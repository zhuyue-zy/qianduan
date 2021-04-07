import React, { Component } from 'react';
import { Button, Modal, Table, Tooltip, Icon, Select, Input, Spin } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { axios, Content, Header, Page } from 'yqcloud-front-boot';
import messageParamListStore from '../../../../stores/globalStores/messageParamList/MessageParamListStore';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';

const intlPrefix = 'global.messageParamList';

@inject('AppState')
@observer
class MessageParamList extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      edit: false,
      page: 0,
      isLoading: true,
      params: [],
      filters: {},
      count: 0,
      dataSource: [],
      selectedData: '',
      selectedRowKeys: [],
      selectedCodeValues: [],
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      sort: 'id,desc',
      // visible: false,
      // deleteVisible: false,
      cellEditable: false,
      toggleMultiLanguageTableCell: false,
      multiLanguageValue: {
        param_name: {},
      },
      multiLanguageList: [],
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
    this.getLanguage();
  }

  componentDidMount() {
    this.loadParam();
  }


  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    if (id === undefined) {
      messageParamListStore.queryLanguage(0, AppState.currentLanguage);
    } else {
      messageParamListStore.queryLanguage(id, AppState.currentLanguage);
    }
  };

  /* 获取系统支持的语言环境 */
  getLanguage = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        });
      });
  };

  fetch = () => {
    // 获取类型数据
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    if (organizationId === undefined) {
      messageParamListStore.getApplicationTypes(0);
    } else {
      messageParamListStore.getApplicationTypes(id);
    }
  };

  // 业务参数列表分页

  loadParam = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    Object.keys(filters).forEach((i) => {
      if (i === 'paramCode') {
        if (filters.paramCode[0]) {
          filters.paramCode[0] = filters.paramCode[0].replace(/[&\|\\\*^{}%$#@\-]/g, '');
        }
      }
    });
    messageParamListStore.loadMessageParam(
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      let { count } = this.state;
      data.content.forEach((v) => {
        v.key = count;
        count += 1;
        // messageParamListStore.getParamLanuage(v.id)
        //   .then((data)=>{
        //     v.__tls.param_name = data;
        //   });
      });

      this.setState({
        pagination: {
          current: (data.number || 0) + 1,
          pageSize: data.size || 25,
          total: data.totalElements || '',
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        filters,
        params,
        sort,
        dataSource: data.content,
        count,
      });
    });
  };

  handlePageChange(pagination, filters, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadParam(pagination, sorter.join(','), filters, params);
  }

  renderParamTableCell = (record, value, field, type, onlyLetters, required, focus) => {
    const { cellEditable, dataSource } = this.state;
    const { editable, key } = record;
    return (
      <Input
        // focused={true}
        autoFocus={focus}
        underline={editable || false}
        readOnly={!editable || false}
        defaultValue={value}
        type={type}
        onChange={(e) => {
          record[field] = e.target.value;
          if (record.editType !== 'create') {
            record.editType = 'update';
          }
        }}
        onDoubleClick={() => {
          if (!editable && this.state.tableState !== 'uncompleted') {
            dataSource.forEach((val) => {
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
          } else {
            this.state.tableState = 'completed';
          }
        }}
      />
    );
  };

  handleAddTableRecord = () => {
    let { count } = this.state;
    const { dataSource } = this.state;
    if (dataSource) {
      //  将其他行设置为不可编辑
      dataSource.forEach((val) => {
        val.editable = false;
      });
    }

    //定义一条新数据，暂时先填充两个字段
    const newData = {
      key: count,//  count为了防止报key重复错误
      editable: true,
      editType: 'create',
      isDeleted: false,
    };
    count += 1;
    this.setState({
      count: count,
      dataSource: [newData, ...dataSource],
    });
  };

  checkTableData = () => {
    const { dataSource } = this.state;
    let ret = true;
    dataSource.forEach((val) => {
      if (!(val.applicationCode && val.paramCode && val.paramName)) {
        ret = false;
      }
    });
    return ret;
  };

  handleSubmit = () => {
    const { dataSource } = this.state;
    const desDataSource = [];//新建的数据
    const updateDesDataSource = [];//更新的数据
    if (this.checkTableData()) {
      dataSource.forEach((value) => {
        if (value.editType === 'create') {
          desDataSource.push(value);
        } else if (value.editType === 'update') {
          updateDesDataSource.push(value);
        }
      });
      if (desDataSource.length >= 1) {
        messageParamListStore.createDes(desDataSource).then(() => {
          this.loadParam();
          Choerodon.prompt(messageParamListStore.languages['create.success']);
        }).catch((error) => {
          Choerodon.handleResponseError(error);
        });

      }
      if (updateDesDataSource.length >= 1) {
        messageParamListStore.updateDes(updateDesDataSource).then(() => {
          this.loadParam();
          Choerodon.prompt(messageParamListStore.languages['modify.success']);
        }).catch((error) => {
          Choerodon.handleResponseError(error);
        });
      }
    } else {
      Choerodon.prompt(messageParamListStore.languages['multilingual.mustInput.code']);
    }
  };

  handleDeleteOk = () => {
    Modal.confirm({
      title: messageParamListStore.languages.delete,
      content: messageParamListStore.languages['confirm.delete'],
      okText: messageParamListStore.languages.confirm,
      cancelText: messageParamListStore.languages.cancel,
      onOk: () => {
        const { selectedCodeValues, dataSource } = this.state;
        /* eslint-disable */
        const deleteValue = {};
        selectedCodeValues.forEach((value) => {
          deleteValue.editType = value.editType;
        });
        if (deleteValue.editType !== 'create') {
          const deleteData = selectedCodeValues.filter(v => (v.editType !== 'create'));
          messageParamListStore.deleteDes(deleteData)
            .then((data) => {
              this.setState({
                // deleteVisible: false,
                selectedRowKeys: [],
              });
              this.loadParam();
              Choerodon.prompt(messageParamListStore.languages['delete.success']);
            });
        } else {
          for (let i = dataSource.length - 1; i >= 0; --i) {
            for (let j = selectedCodeValues.length - 1; j >= 0; --j) {
              if ((selectedCodeValues[j].key) === (dataSource[i].key)) {
                dataSource.splice(i, 1);
              }
              this.setState({
                dataSource,
                selectedCodeValues: [],
              });
            }
          }
        }
      },
    });
  };

  renderMultiLanguageTableCell = (text, record, field, type = 'TableCell') => {
    const { dataSource, cellEditable } = this.state;
    const { editable, key } = record;
    return (
      <MultiLanguageFormItem
        label={messageParamListStore.languages[`${intlPrefix}.paramName`]}
        requestUrl="true"
        handleMultiLanguageValue={({ retObj, retList }) => {
          record.__tls = Object.assign(record.__tls || {}, {
            ['param_name']: retObj,
          });
          record = Object.assign(record, {
            language: retList,
            [field]: retObj.zh_CN,
          });
          const { toggleMultiLanguageTableCell } = this.state;
          if (record.editType !== 'create') {
            record.editType = 'update';
          }
          this.setState({
            toggleMultiLanguageTableCell: !toggleMultiLanguageTableCell,
          });
        }}
        requestData={record.__tls ? record.__tls.param_name : {}}
        type={type}
        value={text}
        inputWidth={200}
        maxLength={20}
        editable={record.editable}
        languageEnv={this.state.languageEnv}
        descriptionObject={messageParamListStore.languages.multiLanguage}
        required="true"
        handleDoubleClick={() => {
          dataSource.forEach((val) => {
            if (val.key === key) {
              val.editable = !editable;
            } else {
              val.editable = false;
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


  renderTable = () => {
    //  处理列选择事件
    const rowSelection = {
      //  选择记录后，将选中的记录加入selectedCodeValue状态中
      onChange: (selectedRowKeys, selectedCodeValues) => {
        this.setState({ selectedCodeValues, selectedRowKeys });
      },
      selectedRowKeys: this.state.selectedRowKeys,
    };
    const { pagination, dataSource, filters } = this.state;
    const appOption = [];
    const typeLists = messageParamListStore.getApplicationType;
    const applicationOption = [];
    const applicationText = [];
    typeLists.forEach((item) => {
      appOption.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
      applicationOption.push({ text1: item.lookupMeaning, value1: item.lookupValue });
    });
    applicationOption.forEach((values) => {
      applicationText.push({ text: values.text1, value: values.value1 });
    });
    //  定义表格列
    const columns = [
      {
        title: messageParamListStore.languages[`${intlPrefix}.applyName`],
        dataIndex: 'applicationCode',
        key: 'applicationCode',
        filters: applicationText,
        filteredValue: filters.applicationCode || [],
        width: 200,
        render: (value, record) => (
          <Select
            onChange={(value) => {
              record.applicationCode = value;
            }}
            getPopupContainer={triggerNode => triggerNode.parentNode}
            defaultValue={record.applicationCode}
            style={{ width: 200 }}
            allowClear>
            {appOption}
          </Select>
        ),
      },
      {
        title: messageParamListStore.languages[`${intlPrefix}.paramName`],
        dataIndex: 'paramName',
        key: 'paramName',
        width: 200,
        filters: [],
        render: (text, record) => this.renderMultiLanguageTableCell(
          text,
          record,
          'paramName',
        ),
      },
      {
        title: messageParamListStore.languages[`${intlPrefix}.paramValue`],
        dataIndex: 'paramCode',
        key: 'paramCode',
        width: 200,
        filters: [],
        render: (value, record) => this.renderParamTableCell(record, value, 'paramCode'),
      },
    ];

    return (
      <Table
        size="middle"
        pagination={pagination}
        columns={columns}
        rowSelection={rowSelection}
        dataSource={dataSource}
        onChange={this.handlePageChange.bind(this)}
      />
    );
  };

  render() {
    const { AppState, intl, form } = this.props;
    const { filters, pagination, dataSource } = this.state;
    const { orgType } = this.props.AppState.currentMenuType.type;
    const { selectedRowKeys, selectedCodeValues } = this.state;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;

    return (

      <Page>
        <Spin spinning={messageParamListStore.isLoading}>
          <Header title={messageParamListStore.languages[`${intlPrefix}.messageParamTitle`]}>
            <Button
              onClick={this.handleAddTableRecord}
              style={{ color: '#000000' }}
            >
              <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
              {messageParamListStore.languages.create}
            </Button>

            <Button
              onClick={this.handleSubmit}
              style={{ color: '#04173F' }}
            >
              <Icon type="baocun" style={{ color: '#2196F3', width: 25 }} />
              {messageParamListStore.languages.save}
            </Button>

            <Button
              onClick={this.handleDeleteOk}
              style={{ color: '#04173F' }}
              disabled={selectedRowKeys.length <= 0}
            >
              <Icon type="shanchu" style={{ color: '#2196F3', width: 25 }} />
              {messageParamListStore.languages.delete}
            </Button>
          </Header>
          <Content>
            {this.renderTable()}
          </Content>
        </Spin>
      </Page>
    );
  }
}

export default withRouter(injectIntl(MessageParamList));
