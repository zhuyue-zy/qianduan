import React, { Component } from 'react';
import { Form, Input, Select, Table, Button, Tooltip, Row, Col, Icon, Checkbox, Modal } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Page, Header, axios } from 'yqcloud-front-boot';;
import plateTimeStore from '../../../../stores/organization/plateFormTimer/PlateTimeStore';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';
const { Item: FormItem } = Form;
const { Option } = Select;
const intlPrefix = 'organization.platformTime';

@inject('AppState')
@observer
class CreatePlateform extends Component{
  state = this.getInitState();
  getInitState() {
    return{
      isLoading: true,
      edit: !!this.props.match.params.id, // 页面是否是编辑状态
      id: this.props.match.params.id,
      // 存放多语言信息
      multiLanguageValue: {
        task_name: {},
        description: {},
        descrip: {},
      },
      multiLanguageList: [],
      taskParamSites: [],
      platformInfo: {},
      services: [],
      paramkey: 0,
      isEmpty: false,
      toggleMultiLanguageTableCell: false,
      cellEditable: false, // 控制单元格是否可编辑
      deleteValueAll: [],
      selectedCodeValues: [],
      loading: false,
    }
  }

  componentWillMount(){
    const { id } = this.state;
    this.fetch(this.props);
    this.loadLanguage();
    this.getLanguage();
    if (id) {
      this.getTaskDetail(id);
    }
  }

  componentDidMount(){
    this.loadLanguage();
  }

  // 获取链接字段名
  getQueryString = (name) => {
    const url = window.location.hash;
    const theRequest = {};
    if (url.indexOf('?') !== -1) {
      const str = url.substr(1);
      const strs = str.split('?');
      for (let i = 0; i < strs.length; i += 1) {
        theRequest[strs[i].split('=')[0]] = decodeURI(strs[i].split('=')[1]);
        if (theRequest[name]) {
          return theRequest[name];
        }
      }
    }
  };


  /* 获取系统支持的语言环境 */
  getLanguage = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        }, () => this.setDispalyName());
      });
  };

  setDispalyName = () => {
    const { multiLanguageValue, languageEnv, id } = this.state;
    const { task_name, description } = multiLanguageValue;
    languageEnv.forEach((val) => {
      task_name[val.code] = '';
      description[val.code] = '';
    });
    if (id) {
      this.setState({
        multiLanguageValue,
      }, ()=> this.getTaskDetail(id));
    }
  }

  fetch(){
    this.getServices();
    plateTimeStore.getRequestMethods();
    plateTimeStore.getParamTypes();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const id = 0;
    plateTimeStore.queryLanguage(id, AppState.currentLanguage);
  };
  /**
   *  渲染请求服务下拉框
   */
  getServices=() => {
    const serviceArray = [];
    plateTimeStore.getService().then((data) => {
      const defaultService = ['api-gateway', 'oauth-server', 'config-server', 'gateway-helper'];
      data.content.forEach((v) => {
        if (defaultService.indexOf(v.serviceName) === -1) {
          serviceArray.push(v.serviceName);
        }
      });
      this.setState({
        services: serviceArray
      })
    })
  }

  // 获取详情
  getTaskDetail=(id) => {
    const  { multiLanguageValue } =this.state;
    let valId = 100000;
    plateTimeStore.queryDetail(id).then((data) => {
      const task_name = Object.assign({}, multiLanguageValue.task_name, data.__tls.task_name);
      const description = Object.assign({}, multiLanguageValue.description, data.__tls.description);
      if (data.taskParamSites) {
        data.taskParamSites.map((val) => {
          val.key = valId++;
          val.editable =false;
        });
      }
      this.setState({
        platformInfo: data,
        taskParamSites: data.taskParamSites,
        multiLanguageValue: { task_name, description },
      })
    })
  }

  handleSubmit=(e) => {
    e.preventDefault();
    const { edit,taskParamSites, platformInfo } =this.state;
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (!err){
        if (edit){
          this.setState({
            loading: true,
          });
          plateTimeStore.editAllocation(Object.assign({}, data, {
            __tls: this.state.multiLanguageValue,
            language: this.state.multiLanguageList,
            taskParamSites,
            taskCode: platformInfo.taskCode,
            taskSiteId: platformInfo.taskSiteId,
            objectVersionNumber: platformInfo.objectVersionNumber
          })).then((data) => {
            if (data === 1) {
              Choerodon.prompt(plateTimeStore.languages['save.success']);
              this.setState({
                loading:false,
              });
              this.props.history.goBack();
            } else {
              Choerodon.prompt(plateTimeStore.languages['save.error']);
            }
          })
        } else {
          this.setState({
            loading: true,
          });
          plateTimeStore.handleAllocation(Object.assign({}, data, {
            taskParamSites,
            taskCode: '',
            __tls: this.state.multiLanguageValue,
            language: this.state.multiLanguageList})).then((data) => {
            if (data === 1) {
              Choerodon.prompt(plateTimeStore.languages['save.success']);
              this.setState({
                loading:false,
              });
              this.props.history.goBack();
            } else {
              Choerodon.prompt(plateTimeStore.languages['save.error']);
            }
          });
        }
      }
    })
  }






  handleAddTableRecord = () => {
    const { form: { validateFields } } = this.props;
    //  若表单必填项未填则不允许新增数据
    validateFields((err) => {
      if (!err) {
        const { taskParamSites, count,  } = this.state;
        let { paramkey } = this.state;
        //  将其他行设置为不可编辑
        if (taskParamSites){
          taskParamSites.forEach((val) => {
            val.editable = false;
          });
        }

        //  定义一条新数据，暂时先填充两个字段
        const newData = {
          key: paramkey, //  count为了防止报key重复错误
          description: '',
          descrip: '',
          editType: 'creates',
          //  默认启用、可编辑
          editable: true,
          empty: false,
        };
        paramkey += 1;
        this.setState({
          paramkey,
          taskParamSites: [newData, ...taskParamSites],
        });
      }
    });
  };


  /**
   *  处理删除表格行的事件
   */
  handleDeleteTableRecords = () => {
    if (this.state.selectedCodeValues.length > 0) {
      const { taskParamSites, selectedCodeValues, deleteValueAll } = this.state;
      //  删除前弹窗确认
      Modal.confirm({
        title: plateTimeStore.languages[`${intlPrefix}.editor.confirmDelete`],
        okType: 'danger',
        onOk: () => {
          for (let i = taskParamSites.length - 1; i >= 0; i -= 1) {
            if (selectedCodeValues.includes(taskParamSites[i].key)) {
              taskParamSites.splice(i, 1);
            }
            this.setState({
              taskParamSites,
              selectedCodeValues: [],
              deleteValueAll
            });
          }
        },
      });
    }
  };


  // 对表格进行渲染
  renderInputableCell = (value, record, field) => {
    const { cellEditable, taskParamSites } = this.state;
    const { editable, key } = record;
    return(
      <Input
        underline={record.editable}
        readOnly={!editable || false}
        defaultValue={record[field]}
        style={{ width: 120 }}
        onChange={(e) => {
          record[field] = e.target.value;
          if (record.id !== '') {
            record.editType = 'update';
          }
        }}
        onDoubleClick={() => {
          taskParamSites.forEach((val) => {
            if (val.key === key) {
              val.editable = !editable;
            } else {
              val.editable = editable;
            }
            if (val.editType === 'creates') {
              val.editType = 'creates';
            } else {
              val.editType = 'updates';
            }
          });
          this.setState({
            cellEditable: !cellEditable,
          });
        }
        }
      />
    );
  };

  renderMultiLanguageTableCell = (text, record, requestUrl, field, type = 'TableCell') => (
    <MultiLanguageFormItem
      label={plateTimeStore.languages[`${intlPrefix}.description`]}
      requestUrl={requestUrl}
      handleMultiLanguageValue={({ retObj, retList }) => {
        record.__tls = Object.assign(record.__tls || {}, {
          [field]: retObj,
        });
        record = Object.assign(record, {
          language: retList,
          [field]: retObj.zh_CN,
        });
        const { toggleMultiLanguageTableCell } = this.state;
        this.setState({
          toggleMultiLanguageTableCell: !toggleMultiLanguageTableCell,
        });
      }}
      requestData={record.__tls ? record.__tls.description : {}}
      type={type}
      value={text}
      inputWidth={120}
      maxLength={20}
      editable={record.editable}
      descriptionObject={plateTimeStore.languages.multiLanguage}
      languageEnv={this.state.languageEnv}
      handleDoubleClick={() => {
        const { taskParamSites, cellEditable } = this.state;
        const { editable } = record;
        taskParamSites.forEach((val) => {
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
    />
  );

  // 对表格进行渲染
  renderTestTableCell = (record, value, field, type, required, focus) => {
    const { cellEditable, taskParamSites } = this.state;
    const { editable, key } = record;
    const paramList = [];
    const paramArray =plateTimeStore.getParamType;
    paramArray.forEach((item) => {
      paramList.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });

    return (
      record.editable ? (
        <Select
          onChange={(values, option) => {
            // 从标签名称相同的数据中找出分类id相同的数据
            record[field] = values;
          }}
          getPopupContainer={triggerNode => triggerNode.parentNode}
          defaultValue={value}
          autoFocus={focus}
          style={{ width: 150 }}
          onDoubleClick={() => {
            if (!editable && this.state.tableState !== 'uncompleted') {
              taskParamSites.forEach((val) => {
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
        >
          {paramList}
        </Select>
      ) : (
        <Input
          autoFocus={focus}
          underline={false}
          readOnly={!editable || false}
          defaultValue={value}
          style={{ height: 20, marginTop: 5 }}
          onChange={(e) => {
            record[field] = e.target.value;
            if (record.id !== '') {
              record.editType = 'update';
            }
          }}
          onDoubleClick={() => {
            taskParamSites.forEach((val) => {
              if (val.key === key) {
                val.editable = !editable;
              } else {
                val.editable = editable;
              }
              if (val.editType === 'creates') {
                val.editType = 'creates';
              } else {
                val.editType = 'updates';
              }
            });
            this.setState({
              cellEditable: !cellEditable,
            });
          }}
        />
      )
    );
  };



  render(){
    const { getFieldDecorator } = this.props.form;
    const { services, taskParamSites, platformInfo, edit, loading } =this.state;
    const method = plateTimeStore.getRequestMethod;
    const requestMethod =[]
    const serviceList = [];
    const isView = this.getQueryString('isView');
    services.forEach((value, index) => {
      serviceList.push(<Option value={value} key={index}>{value}</Option>)
    });
    method.forEach((item) => {
      requestMethod.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });

    const rowSelection = {
      //  选择记录后，将选中的记录加入selectedCodeValue状态中
      onChange: (selectedRows, selectValue) => {
        this.setState({ selectedCodeValues: selectedRows, deleteValueAll: selectValue });
      },
      selectedRowKeys: this.state.selectedCodeValues,
    };

    const columns= [ {
      title: plateTimeStore.languages[`${intlPrefix}.paramName`],
      dataIndex: 'paramName',
      key: 'paramName',
      render: (text, record) => this.renderInputableCell(text, record, 'paramName')
    },
      {
        title: plateTimeStore.languages[`${intlPrefix}.paramDescription`],
        dataIndex: 'description',
        key: 'description',
        render: (text, record) => this.renderMultiLanguageTableCell(
          text,
          record,
          true,
          'description',
        ),
      },
       {
        title: plateTimeStore.languages[`${intlPrefix}.paramTypeCode`],
        dataIndex: 'paramTypeCode',
        key: 'paramTypeCode',
        render: (text, record) => this.renderTestTableCell(record, text, 'paramTypeCode')
      },  {
        title: plateTimeStore.languages[`${intlPrefix}.empty`],
        dataIndex: 'empty',
        key: 'empty',
        render: (text, record) => (
          <Checkbox
            onChange={() => {
              record.empty = !record.empty ;
              const { isEmpty } = this.state;
              this.setState({
                isEmpty: !isEmpty,
              });
            }
            }
            checked={record.empty}
          />
        ),
      }, ]
    const disableColumns= [ {
      title: plateTimeStore.languages[`${intlPrefix}.paramName`],
      dataIndex: 'paramName',
      key: 'paramName',
    },
      {
        title: plateTimeStore.languages[`${intlPrefix}.paramDescription`],
        dataIndex: 'description',
        key: 'description',
      },  {
        title: plateTimeStore.languages[`${intlPrefix}.paramTypeCode`],
        dataIndex: 'paramTypeCode',
        key: 'paramTypeCode',
      },  {
        title: plateTimeStore.languages[`${intlPrefix}.empty`],
        dataIndex: 'empty',
        key: 'empty',
        render: (text, record) => (
          <Checkbox
            disabled={true}
            checked={record.empty}
          />
        ),
      }, ]
    return(
      <Page>
        <Header
          title={edit ? plateTimeStore.languages[`${intlPrefix}.header.modify`] : plateTimeStore.languages[`${intlPrefix}.header.create`]}
          backPath={`/iam/platFormTimer`}
        >
          <Button
            onClick={this.handleSubmit}
            style={{ color: '#04173F', display: isView === '1' ? 'none' : '' }}
            loading={loading}
          >
            <Icon type="baocun" style={{ color: '#2196F3', width: 25 }} />
            {plateTimeStore.languages.save}
          </Button>
        </Header>
        <Content>
          <Form layout="vertical">
            <div style={{ width: 1000 }}>
              <Row>
                <Col span={2}>
                    <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                     {plateTimeStore.languages[`${intlPrefix}.taskName`]}
                      <span style={{ color: 'red', verticalAlign: 'middle' }}>*</span></span>
                </Col>
                <Col>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('taskName', {
                      rules: [
                        {
                          required: true,
                          message: plateTimeStore.languages[`${intlPrefix}.taskName.require.msg`],
                        }],
                      initialValue: '' || platformInfo.taskName,
                    })(
                      <MultiLanguageFormItem
                        placeholder={plateTimeStore.languages[`${intlPrefix}.taskName.require.msg`]}
                        requestUrl="true"
                        requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.task_name : {}}
                        handleMultiLanguageValue={({ retObj, retList }) => {
                          // 将多语言的值设置到当前表单
                          this.props.form.setFieldsValue({
                            taskName: retObj[this.props.AppState.currentLanguage],
                          });
                          this.setState({
                            multiLanguageValue: {
                              ...this.state.multiLanguageValue,
                              task_name: retObj,
                            },
                            multiLanguageList: retList,
                          });
                        }}
                        maxLength={30}
                        disabled={isView === '1' ? 'true' : ''}
                        type="FormItem"
                        FormLanguage={this.state.multiLanguageValue}
                        languageEnv={this.state.languageEnv}
                        descriptionObject={plateTimeStore.languages.multiLanguage}
                        required="true"
                        inputWidth={300}
                      />
                    )}
                  </FormItem>
                </Col>
              </Row>
              <Row>
                <Col span={2}>
              <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
               {plateTimeStore.languages[`${intlPrefix}.description`]}
              </span>
                </Col>
                <Col>
                  <FormItem>
                    {getFieldDecorator('description', {
                      initialValue: '' || platformInfo.description,
                    })(
                      <MultiLanguageFormItem
                        placeholder={plateTimeStore.languages[`${intlPrefix}.description.content`]}
                        requestUrl="true"
                        requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.description : {}}
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
                        maxLength={50}
                        type="FormItem"
                        disabled={isView === '1' ? 'true' : ''}
                        FormLanguage={this.state.multiLanguageValue}
                        languageEnv={this.state.languageEnv}
                        descriptionObject={plateTimeStore.languages.multiLanguage}
                        required="true"
                        inputWidth={300}
                      />
                    )}
                  </FormItem>
                </Col>
              </Row>
              <Row>
                <Col span={2}>
              <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                {plateTimeStore.languages[`${intlPrefix}.requestMethod`]}
                <span style={{ color: 'red', verticalAlign: 'middle' }}>*</span>
              </span>
                </Col>
                <Col>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('requestMethod', {
                      rules: [
                        {
                          required: true,
                          message: plateTimeStore.languages[`${intlPrefix}.requestMethod.require.msg`],
                        }],
                      initialValue: '' || platformInfo.requestMethod,
                    })(
                      <Select
                        style={{ width: 300 }}
                        disabled={isView === '1' ? 'true' : ''}
                        placeholder={plateTimeStore.languages[`${intlPrefix}.requestMethod.require.msg`]}
                        getPopupContainer={triggerNode => triggerNode.parentNode}
                      >
                        {requestMethod}
                      </Select>
                    )}
                  </FormItem>

                </Col>
              </Row>
              <Row>
                <Col span={2}>
              <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                {plateTimeStore.languages[`${intlPrefix}.requestService`]}
                <span style={{ color: 'red', verticalAlign: 'middle' }}>*</span>
              </span>
                </Col>
                <Col>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('requestService', {
                      rules: [
                        {
                          required: true,
                          message: plateTimeStore.languages[`${intlPrefix}.requestService.require.msg`],
                        }],
                      initialValue: '' || platformInfo.requestService,
                    })(
                      <Select
                        disabled={isView === '1' ? 'true' : ''}
                        placeholder={plateTimeStore.languages[`${intlPrefix}.requestService.require.msg`]}
                        style={{ width: 300 }}
                        getPopupContainer={triggerNode => triggerNode.parentNode}
                      >
                        {serviceList}
                      </Select>
                    )}
                  </FormItem>

                </Col>
              </Row>
              <Row >
                <Col span={2}>
                   <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Regular' }}>
                     {plateTimeStore.languages[`${intlPrefix}.requestUrl`]}
                     <span style={{ color: 'red', verticalAlign: 'middle' }}>*</span>
                      </span>
                </Col>
                <Col>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('requestUrl', {
                      rules: [
                        {
                          required: true,
                          message: plateTimeStore.languages[`${intlPrefix}.requestUrl.require.msg`],
                        }],
                      initialValue:  '' || platformInfo.requestUrl,
                    })
                    (
                      <Input
                        disabled={isView === '1' ? 'true' : ''}
                        style={{ width: 300 }}
                        placeholder={plateTimeStore.languages[`${intlPrefix}.requestUrl.require.msg`]}
                        autoComplete="off"
                        maxLength={100}
                      />,
                    ) }
                  </FormItem>
                </Col>
              </Row>
            </div>
          </Form>
          <div>
            <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: '15px', fontFamily: 'PingFangSC-Medium', color: '#04173F', paddingLeft: '7px', borderLeft: '2px solid #2196F3 ' }}>
              {plateTimeStore.languages[`${intlPrefix}.paramData`]}
            </span>
            </div>
            <div style={{ marginBottom: 3 }}>
              <Button
                style={{ color: '#04173F', display: isView === '1' ? 'none' : '' }}
                onClick={this.handleAddTableRecord}
              >
                <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
                {plateTimeStore.languages[`create`]}
              </Button>

              <Button
                style={{ color: '#04173F', display: isView === '1' ? 'none' : '' }}
                onClick={this.handleDeleteTableRecords}
              >
                <Icon type="shanchu" style={{ color: '#2196F3', width: 25 }} />
                {plateTimeStore.languages.delete}
              </Button>
            </div>
            <Table
              columns={isView === '1' ? disableColumns : columns}
              dataSource={taskParamSites}
              filterBar={false}
              pagination={false}
              style={{ width: 800 }}
              rowSelection={rowSelection}
            />
          </div>
        </Content>
      </Page>
    )
  }

}
export default Form.create({})(withRouter(injectIntl(CreatePlateform)));
