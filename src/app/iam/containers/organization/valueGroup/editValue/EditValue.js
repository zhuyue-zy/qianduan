import React, { Component } from 'react';
import { Form, Input, Select, InputNumber, Table, Button, Checkbox, Modal, message } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import valueStore from '../../../../stores/organization/valueGroup/valueStore/ValueStore';
import MultiLanguageFormItem from './NewMultiLanguageFormItem';

const FormItem = Form.Item;
/* eslint-disable */
const Option = Select.Option;
const intlPrefix = 'organization.valueGroup';
const inputWidth = 512;

const formItemLayout = {
  labelCol: {
    xs: {span: 24},
    sm: {span: 100},
  },
  wrapperCol: {
    xs: {span: 24},
    sm: {span: 10},
  },
};

function noop() {
}


@inject('AppState')
@observer
class EditValue extends Component {
  state = this.getInitState();

  componentDidMount() {
    valueStore.organizationType(this.props.AppState.currentMenuType.type)
    const {onRef} = this.props;
    onRef(this);
  }

  componentWillUnmount() {
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    valueStore.queryLanguage(id, AppState.currentLanguage);
  };

  componentWillMount() {
    this.props.onRef(this);
    this.fetch(this.props);
    valueStore.queryLanguageEnv();
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.visible) {
      nextProps.form.resetFields();
      this.setState(this.getInitState());
    } else if (!this.props.visible) {
      this.fetch(nextProps);
    }
  }

  getInitState() {
    return {
      valueInfo: {},
      submitting: false,
      open: false,
      edit: false,
      id: '',
      page: 0,
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      isLoading: true,
      filters: {},
      flexValuesList: [],
      cellEditable: false, // 控制单元格是否可编辑
      toggleCheck: false, // 控制复选框是否可选
      visible: false,
      showModal: false,
      // 存放多语言信息
      multiLanguageValue: {
        description: {},
        placeholder:{},
        title:{}
      },
      multiLanguageField: '',
      multiLanguageList: [],
      tableState: 'unchanged',
      selectedCodeValues: [],// 存放被选中的记录
      deleteValueAll: [],
      toggleMultiLanguageTableCell: false,
      count: 1000, //  记录的index,用于新建数据时作为其key

    };
  }

  getValueInfoById(organizationId, flexValueSetId) {
    valueStore.getValueInfoById(organizationId, flexValueSetId)
      .then((data) => {
        let valId = 0;
        if (data) {
          if(data.flexValuesList)
            data.flexValuesList.map((val) => {
              val.key = valId++;
            });
        }

        this.setState({
          valueInfo: data,
          flexValuesList: data.flexValuesList||[],
          multiLanguageValue:data.__tls,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  checkFlexValueSetName = (rule, value, callback) => {
    const { AppState, intl } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    if (value !== this.state.valueInfo.flexValueSetName) {
      valueStore.checkFlexValueSetName(organizationId, value).then((data) => {
        if (data) {
          callback(valueStore.languages[ `${intlPrefix}.code.exist.msg`]);
        } else {
          callback();
        }
      }).catch(() => {
        Choerodon.prompt(valueStore.languages[`${intlPrefix}.flexValueSetName.exist.msg`]);
      });
    } else {
      callback();
    }
  }


  fetch(props) {
    const {AppState, edit, id} = props;// props从父组件传值
    const {organizationId} = AppState.currentMenuType;
    if (edit) {
      this.getValueInfoById(organizationId, id);
    }
  }

  /*
  * @parma弹出页面取消新建或者修改按钮
  * */
  handleCancel = (e) => {
    const {OnCloseModel = noop, intl} = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      this.setState({selectedCodeValues:[]}) ;
      if (!modify) {
        OnCloseModel();
      } else {
        Modal.confirm({
          title: valueStore.languages[`${intlPrefix}.cancel.title`],
          content: valueStore.languages[`${intlPrefix}.cancel.content`],
          okText: valueStore.languages.ok,
          cancelText: valueStore.languages.cancle,
          onOk: () => (
            OnCloseModel()
          )
        });
      }
    });
  }


  /*
  * @parma新建或者保存按钮
  * */
  handleSubmit = (e) => {
    const { intl } =this.props;
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (!err && this.checkTableData()) {
        const {AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl} = this.props;
        const {organizationId} = AppState.currentMenuType;
        onSubmit();

        if (edit) {
          const {valueInfo, flexValuesList} = this.state;
          flexValuesList.forEach((value) => {
            value.gridFieldName=value.conditionFieldName
            value.gridFieldSequence=value.conditionFieldSequence
          })
          valueStore.updateValue(organizationId, Object.assign({}, valueInfo, {
            ...data,
            flexValueSetId: valueInfo.flexValueSetId || '',
            flexValuesList,
            __tls: this.state.multiLanguageValue,
            language: this.state.multiLanguageList,

          })).then(({failed, message}) => {
            if (failed) {
              onError();
            } else {
              Choerodon.prompt(valueStore.languages.modify.success);
              onSuccess();
              this.setState({selectedCodeValues:[],
                multiLanguageValue:{}}) ;

            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else {
          const {valueInfo, flexValuesList} = this.state;
          flexValuesList.forEach((value) => {
            value.gridFieldName=value.conditionFieldName
            value.gridFieldSequence=value.conditionFieldSequence
            value.isSite = this.props.AppState.currentMenuType.type === 'organization' ? 'N' : 'Y'
          })
          valueStore.createValue(organizationId, Object.assign({}, valueInfo, {
            ...data,
            flexValuesList,
            __tls: this.state.multiLanguageValue,
            language: this.state.multiLanguageList,
          })).then(({failed, message}) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(valueStore.languages.create.success);
              onSuccess();
              this.setState({
                selectedCodeValues:[],
                multiLanguageValue:{}}) ;
            }
          }).catch((error) => {
            onError();
            Choerodon.handleResponseError(error);
          });
        }
      }else{
        message.warning(valueStore.languages[ `${intlPrefix}.enter.filed`]);
      }
    });

  };


  handleAddTableRecord = () => {
    const { form: { validateFields } } = this.props;
    //  若表单必填项未填则不允许新增数据
    if (this.state.tableState !== 'uncompleted') {
      validateFields((err) => {
        if (!err) {
          const { flexValuesList, count } = this.state;
          //  将其他行设置为不可编辑
          flexValuesList.forEach((val) => {
            val.editable = false;
          });
          //  定义一条新数据，暂时先填充两个字段
          const newData = {
            key: 1000, //  count为了防止报key重复错误
            description: '',
            //  默认启用、可编辑
            editable: true,
            gridFieldWidth:100,
            conditionFieldSequence:0,
            gridFieldAlign:'center',
            isGridField:'N',
            isConditionField:'N'

          };

          this.setState({
            //  将新定义的数据加入到数据集中
            flexValuesList: flexValuesList ? [ ...flexValuesList,newData] : [newData],
            count: count + 1,
            newCodeValueLine: true,

          });
        }
      });
    } else {
      valueStore.getCode('enter.required')
    }
  };
  /**
   *  处理删除表格行的事件
   */
  handleDeleteTableRecords = () => {
    if (this.state.tableState === 'uncompleted') {
      valueStore.getCode('enter.required')
    } else if (this.state.selectedCodeValues.length > 0) { //  若至少选择了一行才弹出窗口
      const { AppState, intl } = this.props;
      const { organizationId } = AppState.currentMenuType;
      const { deleteValueAll } = this.state;
      const deleteValue ={};
      deleteValueAll.forEach((value) => {
        deleteValue.key = value.key
      })
      //  删除前弹窗确认
      Modal.confirm({
        title: valueStore.languages[ `${intlPrefix}.editor.confirmDelete`],
        okType: 'danger',
        onOk: () => {
          const { record, AppState: { menuType: { organizationId } } } = this.props;
          if (deleteValue.key !== undefined){
            valueStore.deleteChildValue(organizationId, this.state.selectedCodeValues)
              .then(() => {
                this.handleRefresh();
              });
          }else {
            for(let i=deleteValueAll.length-1; i>=0; i-=1 ){
              this.handleRefresh();
            }
          }
        },
      });
    }
  };




  /**
   *  处理表单输入控件返回的多语言信息
   *  @param value 多语言表单控件中返回的数据
   */
  handleMultiLanguageValue = ({ retObj, retList, field }) => {
    const { form: { setFieldsValue } } = this.props;
    this.multiLanguageValue[field] = retObj;
    this.state.multiLanguageList = retList;
    setFieldsValue({
      [field]: retObj[this.props.AppState.currentLanguage],
    });
  };

  /**
   *  检查表格中必填字段是否填完
   */
  checkTableData = () => {
    const { flexValuesList } = this.state;
    let ret = true;
    flexValuesList.forEach((val) => {
      if (!(val.description && val.conditionFieldName)) {
        ret = false;
      }
    });
    return ret;
  };

  /**
   *  渲染多语言表格单元
   *  @param text 用于表格单元的数据显示
   *  @param record 多语言弹窗中点击确定后改变记录中的数据，
   *  @param requestUrl 请求的url
   *  @param field 要更新的字段名称
   *  @param type 多语言控件的类型，目前只有表单元素和表格元素两种
   */
  renderMultiLanguageTableCell = (text, record, requestUrl, field, type = 'TableCell') => (
    <MultiLanguageFormItem
      label={valueStore.languages[`${intlPrefix}.description`]}
      requestUrl={requestUrl}
      handleMultiLanguageValue={({ retObj, retList }) => {
        /* eslint-disable */
        record.__tls = Object.assign(record.__tls || {}, {
          [field]: retObj,
        });
        /* eslint-enable */
        record = Object.assign(record, {
          language: retList,
          [field]: retObj.zh_CN,
        });
        const { toggleMultiLanguageTableCell } = this.state;
        this.setState({
          toggleMultiLanguageTableCell: !toggleMultiLanguageTableCell,
        });
      }}
      type={type}
      value={text}
      inputWidth="80%"
      maxLength={20}
      editable={record.editable}
      languageEnv={valueStore.languageEnv}
      handleDoubleClick={() => {
        const { flexValuesList, cellEditable } = this.state;
        const { editable } = record;
        if (!editable && this.state.tableState !== 'uncompleted') {
          flexValuesList.forEach((val) => {
            if (val.key === record.key) {
              val.editable = !editable;
            } else {
              val.editable = editable;
            }
          });
          this.setState({
            cellEditable: !cellEditable,
          });
        }
      }
      }
    />
  );


  handleRefresh() {
    const { AppState, id } = this.props;
    const { organizationId } = AppState.currentMenuType;
    this.getValueInfoById(organizationId, id);
    this.setState({
      selectedCodeValues: [],
      deleteValueAll: [],
    });
  }

  /**
   *  渲染按钮组
   */
  renderButtonGroup = () => (
    <div>
      <Button
        icon="playlist_add"
        type="primary"
        onClick={this.handleAddTableRecord}
      >
        {valueStore.languages[`${intlPrefix}.create`]}
      </Button>
      <Button
        icon="delete_sweep"
        type="danger"
        onClick={this.handleDeleteTableRecords}
      >
        {valueStore.languages.delete}
      </Button>
    </div>
  )


  /**
   *  渲染可编辑单元格
   *  @param editable 标识单元格是否可编辑
   *  @param key 唯一标识
   *  @param field 记录字段名
   *  @param value 要显示的内容
   *  @param type input控件的类型(暂时只有默认类型和数字类型)
   */
  /**
   *  渲染可编辑表格单元格
   */
  renderTestTableCell = (record, value, field, type, onlyLetters, required, focus) => {
    const { cellEditable, flexValuesList } = this.state;
    const { editable, key } = record;
    return (
      <Input
        autoFocus={focus}
        underline={editable || false}
        readOnly={!editable || false}
        defaultValue={value}
        type={type}
        onChange={(e) => {
          record[field] = e.target.value;
        }}
        onDoubleClick={() => {
          if (!editable && this.state.tableState !== 'uncompleted') {
            flexValuesList.forEach((val) => {
              if (val.key === key) {
                val.editable = !editable;
              } else {
                val.editable = editable;
              }
            });
            this.setState({
              cellEditable: !cellEditable,
            });
          }
        }}
        onKeyUp={(e) => {
          if (onlyLetters) {
            e.target.value = e.target.value.replace(/[\W]/g, '');
          }
        }}
        onBlur={(e) => {
          if (required && !e.target.value) {
            this.state.tableState = 'uncompleted';
            message.error('请输入必填字段');
            // e.target.focus();
          } else {
            this.state.tableState = 'completed';
          }
        }}
      />
    );
  };


  //  渲染表格
  renderTable = () => {
    //  处理列选择事件
    const rowSelection = {
      //  选择记录后，将选中的记录加入selectedCodeValue状态中
      onChange: (selectedRows, selectValue) => {
        this.setState({ selectedCodeValues: selectedRows, deleteValueAll: selectValue });
      },
      selectedRowKeys: this.state.selectedCodeValues,
    };


    //  获取dataSource
    const { flexValuesList, pagination } = this.state;
    flexValuesList.forEach((v) => {
      v.key = v.flexValueId;
    });
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    //  定义表格列
    const columns = [

      {
        title: valueStore.languages[`${intlPrefix}.conditionFieldName`],
        dataIndex: 'conditionFieldName',
        key: 'conditionFieldName',
        align: 'center',
        filters: [],
        render: (value, record) => this.renderTestTableCell(record, value, 'conditionFieldName'),

      },
      {
        title: valueStore.languages[`${intlPrefix}.valueGroup.description`],
        dataIndex: 'description',
        key: 'description',
        filters: [],
        width: '18%',
        align: 'center',
        onFilter: (description, record) => record.description.indexOf(description) !== -1,
        render: (text, record) => this.renderMultiLanguageTableCell(
          text,
          record,
          record.flexValueId ? `fnd/v1/${organizationId}/flex/values/language/${record.flexValueId}?columnName=description` : null,
          'description',
        ),

      },

      {
        title: valueStore.languages[`${intlPrefix}.gridFieldWidth`],
        dataIndex: 'gridFieldWidth',
        key: 'gridFieldWidth',
        align: 'center',
        filters: [],
        onFilter: (gridFieldWidth, record) => record.gridFieldWidth.indexOf(gridFieldWidth) !== -1,
        render: (value, record) => this.renderTestTableCell(record, value, 'gridFieldWidth', 'number'),

      },
      {
        title: valueStore.languages[`${intlPrefix}.isGridField`],
        dataIndex: 'isGridField',
        align: 'center',
        key: 'isGridField',
        render: (text, record) => (
          <Checkbox
            onChange={(a) => {
              record.isGridField = record.isGridField === 'Y' ? 'N' : 'Y';
              const { toggleCheck } = this.state;
              this.setState({
                toggleCheck: !toggleCheck,
              });
            }}
            checked={record.isGridField === 'Y'}
          />
        ),
      },
      {
        title: valueStore.languages[`${intlPrefix}.gridFieldAlign`],
        dataIndex: 'gridFieldAlign',
        key: 'gridFieldAlign',
        align: 'center',
        onFilter: (gridFieldAlign, record) => record.gridFieldAlign.indexOf(gridFieldAlign) !== -1,
        render: (value, record) => (
          <Select
            onChange={(value) => {
              record.gridFieldAlign = value;
            }}
            getPopupContainer={triggerNode => triggerNode.parentNode}
            defaultValue={record.gridFieldAlign}
            style={{ width: 90 }}
            allowClear
          >
            <Option value="center">{valueStore.languages[`${intlPrefix}.center`]}</Option>
            <Option value="right">{valueStore.languages[`${intlPrefix}.right`]}</Option>
            <Option value="left">{valueStore.languages[`${intlPrefix}.left`]}</Option>
          </Select>
        ),
      },
      {
        title: valueStore.languages[`${intlPrefix}.conditionField`],
        dataIndex: 'isConditionField',
        key: 'isConditionField',
        align: 'center',
        render: (text, record) => (
          <Checkbox
            onChange={(a) => {
              record.isConditionField = record.isConditionField === 'Y' ? 'N' : 'Y';
              const { toggleCheck } = this.state;
              this.setState({
                toggleCheck: !toggleCheck,
              });
            }}
            checked={record.isConditionField === 'Y'}
          />
        ),
      },
      {
        title: valueStore.languages[`${intlPrefix}.conditionFieldSequence`],
        dataIndex: 'conditionFieldSequence',
        key: 'conditionFieldSequence',
        align: 'center',
        onFilter: (conditionFieldSequence, record) => record.conditionFieldSequence.indexOf(conditionFieldSequence) !== -1,
        render: (value, record) => this.renderTestTableCell(record, value, 'conditionFieldSequence', 'number'),

      },
      {
        title: valueStore.languages[`${intlPrefix}.conditionFieldType`],
        dataIndex: 'conditionFieldType',
        key: 'conditionFieldType',
        align: 'center',
        onFilter: (conditionFieldType, record) => record.conditionFieldType.indexOf(conditionFieldType) !== -1,
        render: (value, record) => (
          <Select
            onChange={(value) => {
              record.conditionFieldType = value;
            }}
            getPopupContainer={triggerNode => triggerNode.parentNode}
            defaultValue={record.conditionFieldType}
            style={{ width: 90 }}
            allowClear
          >
            <Option value="number">{valueStore.languages[`${intlPrefix}.number`]}</Option>
            <Option value="input">{valueStore.languages[`${intlPrefix}.string`]}</Option>
            <Option value="date">{valueStore.languages[`${intlPrefix}.date`]}</Option>
            <Option value="drop">{valueStore.languages[`${intlPrefix}.drop`]}</Option>
          </Select>
        ),
      },
    ];


    return (
      <Table
        columns={columns}
        dataSource={flexValuesList}
        rowSelection={rowSelection}
        pagination={pagination}
        loading={valueStore.isLoading}
        filterBar={false}
        bordered
      />
    );
  };


  // 渲染
  render() {
    const { edit, intl } = this.props;
    const { AppState: { menuType: { organizationId } } } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { orgType } = this.props.AppState.currentMenuType.type;
    const { valueInfo } = this.state;
    const { id } = this.props;
    return (
      <Content
        className="sidebar-content"
      >
        <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical">
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('flexValueSetName', {
              rules: [
                {
                  required: true,
                  message: valueStore.languages[`${intlPrefix}.flexValueSetName.require.msg`],
                },
                {
                  pattern: /^[A-Za-z0-9]+$/,
                  message: valueStore.languages[`${intlPrefix}.directory.code.pattern`],
                },
                {
                  validator: this.checkFlexValueSetName,
                },
              ],
              validateTrigger: 'onBlur',
              initialValue: valueInfo.flexValueSetName || '',
              validateFirst: true,

            })(
              <Input
                autoComplete="off"
                label={valueStore.languages[`${intlPrefix}.valuecode`]}
                style={{ width: inputWidth }}
                maxLength={30}
                disabled={edit}

              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {
              getFieldDecorator('description', {
                rules: [
                  {
                    required: true,
                    message: valueStore.languages[`${intlPrefix}.description.require.msg`],
                  }],
                initialValue: valueInfo.description || '',
              })(<MultiLanguageFormItem
                label={valueStore.languages[`${intlPrefix}.valueDes`]}
                descriptionObject={valueStore.languages[`${intlPrefix}.valueDes`]}
                requestUrl="true"
                requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.description : {}}
                // requestUrl={edit ? `fnd/v1/flex_value_set/language/${id}?columnName=description` : ''}
                handleMultiLanguageValue={({ retObj, retList }) => {
                  // 将多语言的值设置到当前表单
                  this.props.form.setFieldsValue({
                    description: retObj[this.props.AppState.currentLanguage],
                  });
                  this.setState({
                    multiLanguageValue: {
                      ...this.state.multiLanguageValue,
                      description: retObj,
                    },
                    multiLanguageList: retList,
                  });
                }}
                maxLength={60}
                type="FormItem"
                inputWidth={512}
                FormLanguage={this.state.multiLanguageValue}
                languageEnv={valueStore.languageEnv}
              />)}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('title', {
              validateTrigger: 'onBlur',
              initialValue: valueInfo.title || '',
              validateFirst: true,
            })(<MultiLanguageFormItem
              label={valueStore.languages[`${intlPrefix}.valuestitle`]}
              descriptionObject={valueStore.languages[`${intlPrefix}.valuestitle`]}
              requestUrl="true"
              requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.title : {}}
              // requestUrl={edit ? `fnd/v1/flex_value_set/language/${id}?columnName=title` : ''}
              handleMultiLanguageValue={({ retObj, retList }) => {
                // 将多语言的值设置到当前表单
                this.props.form.setFieldsValue({
                  title: retObj[this.props.AppState.currentLanguage],
                });
                this.setState({
                  multiLanguageValue: {
                    ...this.state.multiLanguageValue,
                    description: retObj,
                  },
                  multiLanguageList: retList,
                });
              }}
              maxLength={60}
              type="FormItem"
              inputWidth={512}
              FormLanguage={this.state.multiLanguageValue}
              languageEnv={valueStore.languageEnv}
            />)}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('placeholder', {
              validateTrigger: 'onBlur',
              initialValue: valueInfo.placeholder || '',
              validateFirst: true,
            })(<MultiLanguageFormItem
              label={valueStore.languages[`${intlPrefix}.placeholder`]}
              requestUrl="true"
              requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.placeholder : {}}
              // requestUrl={edit ? `fnd/v1/flex_value_set/language/${id}?columnName=placeholder` : ''}
              handleMultiLanguageValue={({ retObj, retList }) => {
                // 将多语言的值设置到当前表单
                this.props.form.setFieldsValue({
                  placeholder: retObj[this.props.AppState.currentLanguage],
                });
                this.setState({
                  multiLanguageValue: {
                    ...this.state.multiLanguageValue,
                    description: retObj,
                  },
                  multiLanguageList: retList,
                });
              }}
              maxLength={60}
              type="FormItem"
              inputWidth={512}
              descriptionObject={valueStore.languages[`${intlPrefix}.placeholder`]}
              FormLanguage={this.state.multiLanguageValue}
              languageEnv={valueStore.languageEnv}
            />)}
          </FormItem>


          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('lovPageSize', {
              initialValue: valueInfo.lovPageSize || '5',
            })(
              <Select
                label={valueStore.languages[`${intlPrefix}.pagesize`]}
                getPopupContainer={() => document.getElementsByClassName('sidebar-content')[0].parentNode}
                style={{ width: inputWidth }}
                onChange={this.handleCertificateTypeChange}
                allowClear
              >
                <Option value="5">{valueStore.languages[`${intlPrefix}.five`]}</Option>
                <Option value="10">{valueStore.languages[`${intlPrefix}.ten`]}</Option>
                <Option value="20">{valueStore.languages[`${intlPrefix}.twenty`]}</Option>
              </Select>,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('width', {
              rules: [{
                required: true,
                message: valueStore.languages[`${intlPrefix}.width.require.msg`],
              }],
              validateTrigger: 'onBlur',
              initialValue: valueInfo.width || '260',
              validateFirst: true,
            })(<InputNumber
              label={valueStore.languages[`${intlPrefix}.width`]}
              style={{ width: inputWidth }}
            />)}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('valueField', {
              rules: [{
                required: true,
                message: valueStore.languages[`${intlPrefix}.value_field.require.msg`],
              }],
              validateTrigger: 'onBlur',
              initialValue: valueInfo.valueField || '',
              validateFirst: true,
            })(<Input
              label={valueStore.languages[`${intlPrefix}.valueField`]}
              style={{ width: inputWidth }}
              maxLength={60}
            />)}

          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('textFiled', {
              rules: [{
                required: true,
                message: valueStore.languages[`${intlPrefix}.textFiled.require.msg`],
              }],
              validateTrigger: 'onBlur',
              initialValue: valueInfo.textFiled || '',
              validateFirst: true,
            })(<Input
              label={valueStore.languages[`${intlPrefix}.textFiled`]}
              style={{ width: inputWidth }}
              maxLength={60}
            />)}

          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('customUrl', {
              rules: [
                {
                  required: true,
                  message: valueStore.languages[`${intlPrefix}.customUrl.require.msg`],
                }],
              validateTrigger: 'onBlur',
              initialValue: valueInfo.customUrl || '',
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={valueStore.languages[`${intlPrefix}.customUrl`]}
                style={{ width: inputWidth }}
                maxLength={60}
              />,
            )}
          </FormItem>

        </Form>
        {/* 渲染按钮组 */}
        {this.renderButtonGroup()}

        {/* 渲染表格结构 */}
        {this.renderTable()}
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EditValue)));
