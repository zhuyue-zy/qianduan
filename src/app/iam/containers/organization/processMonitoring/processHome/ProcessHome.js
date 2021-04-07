import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Action, Content, Header, Page, axios } from 'yqcloud-front-boot';
import { Form, Button, Modal, Table, Icon, Input, Select, message, DatePicker, Tooltip, Divider, Row, Col } from 'yqcloud-ui';

import processStore from '../../../../stores/organization/processMonitoring/ProcessStore';
import LOVInput from '../../../../components/lov/LOVInput';
import LOV from '../../../../components/lov';
import './processHome.scss';


const intlPrefix = 'organization.processMonitoring';
const FormItem = Form.Item;
const { Option } = Select;
const { RangePicker } = DatePicker;

@inject('AppState')
@observer
class ProcessHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      isLoading: true,
      params: [],
      filters: {},
      sort: '',
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      id: '',
      employeeId: '',
      LOVVisible: false,
      visible: false,
      selectLOVVisible: false,
      selectVisible: false,
      transferVisible: false,
      text: '',
      LOVCode: '',
      formItemCode: '',
      dataSource: [],
      value: '',
      rejectVisible: false,
      employee: '',
      assignee: '',
      meanName: '',
      selectEmployee: '',
    };
  }

  // 渲染前
  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }

  // 渲染后
  componentDidMount() {
    this.loadBackLog();
    this.transferRender();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    processStore.queryLanguage(id, AppState.currentLanguage);
  }

  fetch() {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    processStore.queryTypeList(id);
    processStore.queryStatusList(id);
    processStore.queryApplicationList(id);
    processStore.queryTransactionTypeList(id);
  }

  // 更新页面数据
  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadBackLog();
    });
  };

  // 工作流分页加载
  loadBackLog = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    processStore.loadBackLogs(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      // 将后台获取的分页信息手动set表格里
      let { count } = this.state;
      data.content.forEach((v) => {
        v.key = count;
        count += 1;
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
    })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
      );
  };

  handlePageChange(pagination, filters, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadBackLog(pagination, sorter.join(','), filters, params);
  }

  /*
  * 挂起恢复
  * */
  handleAble = (record) => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    let { processStatus } = record;
    const { procInstId } = record;
    processStatus = processStatus === 'Processing' ? 'Hang_Up' : 'Processing';
    if (processStatus === 'Hang_Up') {
      processStore.getProcessHandUp(organizationId, procInstId).then(
        (data) => {
          this.handleRefresh();
          Choerodon.prompt(processStore.languages[processStatus === 'Hang_Up' ? 'Hang_Up.success' : 'Processing.success']);
        },
      ).catch((error) => {
        Choerodon.prompt(processStore.languages[isEnabled === 'N' ? 'disable.error' : 'enable.error']);
      });
    } else if (processStatus === 'Processing') {
      processStore.getProcessHuiFu(organizationId, procInstId).then(
        (data) => {
          Choerodon.prompt(processStore.languages[processStatus === 'Hang_Up' ? 'Hang_Up.success' : 'Processing.success']);
          this.handleRefresh();
        },
      ).catch((error) => {
        Choerodon.prompt(processStore.languages[processStatus === 'Hang_Up' ? 'Hang_Up.success' : 'Processing.success']);
      });
    }
  };

  // 终止当前流程
  handleZhongZhi = (record) => {
    const { AppState, intl } = this.props;
    Modal.confirm({
      title: processStore.languages[`${intlPrefix}.cancel.title`],
      content: processStore.languages[`${intlPrefix}.zhongZhi.content`],
      okText: processStore.languages.confirm,
      cancelText: processStore.languages.cancel,
      onOk: () => {
        const { organizationId } = AppState.currentMenuType;
        let { processStatus } = record;
        const { procInstId } = record;
        processStatus = 'Terminated';
        if (processStatus === 'Terminated') {
          processStore.getProcessZhongZhi(organizationId, procInstId).then(
            (data) => {
              Choerodon.prompt(processStore.languages[processStatus === 'Terminated' ? 'Terminated.success' : 'Terminated.filed']);
              this.handleRefresh();
            },
          ).catch((error) => {

          });
        }
      },
    });
  }


  // 查询判断
  handleSearch = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      const valueObj = {};
      const startedBefore = '';
      const startedAfter = '';
      const processType = '';
      const processStatus = '';
      const startUserId = '';
      if (values.forwardCreateDate !== '') {
        valueObj.startedAfter = [values.forwardCreateDate[0].format('YYYY-MM-DD HH:mm:ss')];
        valueObj.startedBefore = [values.forwardCreateDate[1].format('YYYY-MM-DD HH:mm:ss')];
      }

      if (values.category !== '') {
        valueObj.processType = [values.category];
      }
      if (values.status !== '') {
        valueObj.processStatus = [values.status];
      }

      if (values.employeeId !== '') {
        valueObj.startUserId = [values.employeeId];
      }
      Object.keys(values).forEach((i) => {
        if (i !== 'forwardCreateDate') {
          valueObj[i] = [values[i]];
        }
      });
      this.loadBackLog('', '', { ...valueObj });
    });
  }

  // 状态判断
  approvStatus = (values) => {
    const statusLists = processStore.getStatuslist;
    const statusType = statusLists.filter(v => (v.lookupValue === values));
    if (statusType.length > 0) {
      if (statusType[0].lookupValue == 'Hang_Up') {
        return <span style={{ color: '#04173F', fontSize: 12 }}> <Icon type="guaqizhong" style={{ fontSize: 14, color: '#2196F3', marginTop: -3 }} /> {statusType[0].lookupMeaning}</span>;
      } else if (statusType[0].lookupValue == 'Finished') {
        return <span style={{ color: '#04173F', fontSize: 12 }}> <Icon type="yijieshu" style={{ fontSize: 14, color: '#2196F3', marginTop: -3 }} /> {statusType[0].lookupMeaning}</span>;
      } else if (statusType[0].lookupValue == 'Processing') {
        return <span style={{ color: '#04173F', fontSize: 12 }}> <Icon type="jinxingzhong" style={{ fontSize: 14, color: '#2196F3', marginTop: -3 }} /> {statusType[0].lookupMeaning}</span>;
      } else if (statusType[0].lookupValue == 'Rejected') {
        return <span style={{ color: '#04173F', fontSize: 12 }}> <Icon type="beibohui" style={{ fontSize: 14, color: '#2196F3', marginTop: -3 }} /> {statusType[0].lookupMeaning}</span>;
      } else if (statusType[0].lookupValue == 'Terminated') {
        return <span style={{ color: '#04173F', fontSize: 12 }}> <Icon type="yizhongzhi" style={{ fontSize: 14, color: '#2196F3', marginTop: -3 }} /> {statusType[0].lookupMeaning}</span>;
      }
    } else {
      return values;
    }
  }

  // 获取流程状态

  catagoryState = (values) => {
    const typeLists = processStore.getTypelist;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }
  // 获取应用系统

  queryApplication = (values) => {
    const typeLists = processStore.getApplicationList;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }
  // 获取事物管理

  queryTransactionType = (values) => {
    const typeLists = processStore.getTransactionTypeList;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }


  openNewPage = (id) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const menuType = AppState.currentMenuType;
    this.props.history.push(`/iam/processMonitoring/edit/${id}?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
  };

  onEdit = (id) => {
    this.openNewPage(id);
  };

  onJump = (id) => {
    this.openJump(id);
  };

  openJump = (id) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const menuType = AppState.currentMenuType;
    this.props.history.push(`/iam/processMonitoring/jump/${id}?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
  };


  // 转交弹窗
  handleReset = () => {
    this.setState({
      text: '',
    });
    this.props.form.resetFields();
  }


  transferCancel = (e) => {
    this.handleReset();
    this.setState({
      transferVisible: false,
    });
  }

  transferShowModal = (record) => {
    this.setState({
      transferVisible: true,
      id: record.procInstId,
    });
  }

  onCancelTransferHome = () => {
    this.setState({
      transferVisible: false,
    });
  }

  // 转交按钮
  transferSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (!err) {
        const { AppState, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        const { id } = this.state;
        processStore.getProcessTransfer(organizationId, id, data.assignee, data.taskComment).then(({ failed, message }) => {
          if (failed) {
            Choerodon.prompt(message);
          } else {
            this.handleReset();
            this.onCancelTransferHome();
            this.handleRefresh();
            this.setState({
              agreeVisible: false,
            });
            Choerodon.prompt(processStore.languages[`${intlPrefix}.transferSuccess`]);
          }
        });
      }
    });
  }

  // 渲染弹出块
  transferRender = () => {
    const { intl, form } = this.props;
    const { getFieldDecorator } = form;
    const {
      value, text, selectLOVVisible, formItemCode, LOVCode, assignee,
      selectEmployee, transferVisible,
    } = this.state;
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    return (
      <Modal
        title={processStore.languages[`${intlPrefix}.transferApprove`]}
        visible={transferVisible}
        className="transfer-content"
        onCancel={this.transferCancel}
        onOk={this.transferSubmit}
        center
        footer={[
          <Button
            style={{ background: '#2196F3' }}
            funcType="raised"
            type="primary"
            onClick={this.transferSubmit}
          >
            {processStore.languages.ok}
          </Button>,
          <Button
            onClick={this.transferCancel}
            funcType="raised"
            style={{ marginRight: '20px' }}
          >
            {processStore.languages.cancle}
          </Button>,

        ]}
      >
        <Form>
          <FormItem style={{ display: 'inline-block', marginTop: 20, marginLeft: 15 }}>
            {getFieldDecorator('assignee', {
              rules: [
                {
                  required: true,
                  message: processStore.languages[`${intlPrefix}.employeeId`],
                },
              ],
              initialValue: '',
            })(
              <LOVInput
                code="selectEmployee"
                label={processStore.languages[`${intlPrefix}.employeeId`]}
                form={this.props.form}
                formCode="assignee"
                organizationId={organizationId}
                style={{ width: 400 }}
                text={text}
                onLOV={() => {
                  this.setState({
                    selectLOVVisible: true,
                    formItemCode: 'assignee',
                    LOVCode: selectEmployee,
                  });
                }}
                onSelect={(text) => {
                  this.setState({
                    text,
                  });
                }}
              />,
            )}
          </FormItem>
          <FormItem style={{ display: 'inline-block', marginLeft: 15 }}>
            {getFieldDecorator('opinion', {
              validateTrigger: 'onBlur',
              rules: [{
                required: true,
                message: processStore.languages[`${intlPrefix}.taskComment`],

              }],
              initialValue: '',
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={processStore.languages[`${intlPrefix}.proverIdea`]}
                style={{ width: 400 }}
              />,
            )}
          </FormItem>
        </Form>
        <LOV
          code="selectEmployee"
          firstForm={this.props.form}
          formItem={formItemCode}
          organizationId={organizationId}
          visible={selectLOVVisible}
          onChange={(visible, text = text) => {
            this.setState({
              selectLOVVisible: visible,
              text,
            });
          }}
        />
      </Modal>
    );
  }


  render() {
    const { AppState, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { filters, pagination, employee, dataSource } = this.state;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
    const typeLists = processStore.getTypelist;
    const statusLists = processStore.getStatuslist;
    const lanOption_1 = [];
    const lanOption_2 = [];
    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '200px',
      wordBreak: 'normal',
    };
    typeLists.forEach((item) => {
      lanOption_1.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    statusLists.forEach((item) => {
      lanOption_2.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    const {
      text, LOVVisible, formItemCode,
    } = this.state;
    const columns = [
      {
        title: processStore.languages[`${intlPrefix}.procInstIds`],
        dataIndex: 'codeNum',
        key: 'codeNum',
        filters: [],
        filteredValue: filters.codeNum || [],
        width: 150,
      },

      {
        title: processStore.languages[`${intlPrefix}.processName`],
        dataIndex: 'processName',
        key: 'processName',
        filters: [],
        filteredValue: filters.processName || [],
      },
      {
        title: processStore.languages[`${intlPrefix}.category`],
        dataIndex: 'category',
        key: 'category',
        filters: [],
        filteredValue: filters.category || [],
        render: (values, record) => this.catagoryState(record.category),
      },
      {
        title: processStore.languages[`${intlPrefix}.status`],
        dataIndex: 'processStatus',
        key: 'processStatus',
        filters: [],
        filteredValue: filters.processStatus || [],
        render: (values, record) => this.approvStatus(record.processStatus),
      },

      {
        title: processStore.languages[`${intlPrefix}.application`],
        dataIndex: 'application',
        key: 'application',
        filters: [],
        filteredValue: filters.application || [],
        render: (values, record) => this.queryApplication(record.application),

      },
      {
        title: processStore.languages[`${intlPrefix}.subject`],
        dataIndex: 'subject',
        key: 'subject',
        filters: [],
        filteredValue: filters.subject || [],
      },

      {
        title: processStore.languages[`${intlPrefix}.transactionNum`],
        dataIndex: 'transactionNumber',
        key: 'transactionNumber',
        filters: [],
        filteredValue: filters.transactionNumber || [],
      },
      {
        title: processStore.languages[`${intlPrefix}.transactionType`],
        dataIndex: 'transactionType',
        key: 'transactionType',
        filters: [],
        filteredValue: filters.transactionType || [],
        render: (values, record) => this.queryTransactionType(record.transactionType),

      },
      {
        title: processStore.languages[`${intlPrefix}.taskName`],
        dataIndex: 'taskName',
        key: 'taskName',
        filters: [],
        filteredValue: filters.taskName || [],
      },
      {
        title: processStore.languages[`${intlPrefix}.startUserName`],
        dataIndex: 'startUserName',
        key: 'startUserName',
        filters: [],
      },
      {
        title: processStore.languages[`${intlPrefix}.assigneeName`],
        dataIndex: 'assigneeName',
        key: 'assigneeName',
        filters: [],
        filteredValue: filters.assigneeName || [],
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={40}>
              <div style={{ textAlign: 'left' }}>{`${record.assigneeName}` !== 'null' ? `${record.assigneeName}` : ' ' }</div>
            </Tooltip>
          </span>
        ),
      },

      {
        title: processStore.languages[`${intlPrefix}.createTime`],
        dataIndex: 'createTime',
        key: 'createTime',
        filters: [],
        filteredValue: filters.createTime || [],
      },
      {
        title: processStore.languages[`${intlPrefix}.stopTime`],
        dataIndex: 'endTime',
        key: 'endTime',
        filters: [],
        filteredValue: filters.endTime || [],
      },
      {
        title: processStore.languages[`${intlPrefix}.action`],
        key: 'action',
        width: 60,
        fixed: 'right',
        render: (values, record) => (
          <a
            onClick={this.onEdit.bind(this, record.procInstId)}
          >{processStore.languages[`${intlPrefix}.see`]}
          </a>
        ),
      },
      {
        fixed: 'right',
        width: 60,
        filters: [],
        render: (text, record) => {
          const actionDatas = [];
          if (record.processStatus === 'Processing') {
            actionDatas.push({
              service: ['iam-service.role.createBaseOnRoles'],
              icon: '',
              type: 'site',
              text: processStore.languages[`${intlPrefix}.handUp`],
              action: this.handleAble.bind(this, record),
            },
            {
              service: ['iam-service.role.createBaseOnRoles'],
              type: 'site',
              icon: '',
              text: processStore.languages.transfer,
              action: this.transferShowModal.bind(this, record),
            },
            {
              service: ['iam-service.role.createBaseOnRoles'],
              type: 'site',
              icon: '',
              text: processStore.languages.jumpNode,
              action: this.onJump.bind(this, record.procInstId),
            },
            {
              service: ['iam-service.role.createBaseOnRoles'],
              type: 'site',
              icon: '',
              text: processStore.languages.terminationProcess,
              action: this.handleZhongZhi.bind(this, record),
            });
          } else if (record.processStatus === 'Hang_Up') {
            actionDatas.push({
              service: ['iam-service.role.createBaseOnRoles'],
              icon: '',
              type: 'site',
              text: processStore.languages[`${intlPrefix}.huifu`],
              action: this.handleAble.bind(this, record),
            });
          } else if (record.processStatus === 'Finished') {

          } else if (record.processStatus === 'Terminated') {

          } else if (record.processStatus === 'Rejected') {
          }

          return <Action data={actionDatas} />;
        },

      },
    ];

    return (

      <Page>
        <Header title={processStore.languages[`${intlPrefix}.automaticTitle`]} />
        <Content className="fontType" values={{ name: orgname }}>
          <Form layout="vertical">
            <Row>
              <Col span={7}>
                <FormItem>
                  {getFieldDecorator('codeNum', {
                    validateTrigger: 'onBlur',
                    initialValue: '',
                    validateFirst: true,
                  })(
                    <Input
                      autoComplete="on"
                      label={processStore.languages[`${intlPrefix}.procInstIdes`]}
                      style={{ width: 250 }}
                    />,
                  )}
                </FormItem>
              </Col>
              <Col span={7}>
                <FormItem>
                  {getFieldDecorator('processName', {
                    initialValue: '',
                  })(
                    <Input
                      label={processStore.languages[`${intlPrefix}.processNames`]}
                      style={{ width: 250 }}
                    />,
                  )}
                </FormItem>
              </Col>
              <Col span={10}>
                <FormItem style={{ marginTop: '-2px' }}>

                  {getFieldDecorator('category', {
                    initialValue: '',
                  })(
                    <Select
                      label={processStore.languages[`${intlPrefix}.categorys`]}
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      style={{ width: 250 }}
                      onChange={this.handleCertificateTypeChange}
                      allowClear
                    >
                      {lanOption_1}
                    </Select>,
                  )}
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={7}>
                <FormItem style={{ marginTop: -2 }}>
                  {getFieldDecorator('status', {
                    initialValue: '',
                  })(
                    <Select
                      label={processStore.languages[`${intlPrefix}.statuss`]}
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      style={{ width: 250 }}
                      onChange={this.handleCertificateTypeChange}
                      allowClear
                    >
                      {lanOption_2}
                    </Select>,
                  )}
                </FormItem>
              </Col>
              <Col span={7}>
                <FormItem>
                  {getFieldDecorator('employeeId', {
                    initialValue: '',
                  })(
                    <LOVInput
                      code="employee"
                      label={processStore.languages[`${intlPrefix}.startUserNames`]}
                      form={this.props.form}
                      formCode="employeeId"
                      organizationId={this.props.AppState.currentMenuType.organizationId}
                      style={{ width: 250 }}
                      text={text}
                      onLOV={() => {
                        this.setState({
                          LOVVisible: true,
                          formItemCode: 'employeeId',
                          LOVCode: employee,
                        });
                      }}
                      onSelect={(text) => {
                        this.setState({
                          text,
                        });
                      }}
                    />,
                  )}
                </FormItem>
              </Col>
              <Col span={10} style={{ display: 'flex' }}>
                <FormItem style={{ marginTop: '15px' }}>
                  {getFieldDecorator('forwardCreateDate', {
                    initialValue: '',
                  })(
                    <RangePicker
                      placeholder={[processStore.languages.startTime, processStore.languages.endTime]}
                      showTime
                      style={{ width: 250 }}
                    />,
                  )}
                </FormItem>
                <Button
                  style={{ marginTop: '5px', marginLeft: 35, backgroundColor: '#2196f3', borderRadius: 4 }}
                  type="primary"
                  funcType="raised"
                  htmlType="submit"
                  onClick={this.handleSearch}
                >{processStore.languages[`${intlPrefix}.query`]}
                </Button>

                <Button
                  style={{ marginLeft: '20px', borderRadius: 4, marginTop: '5px' }}
                  funcType="raised"
                  onClick={this.handleReset}
                >{processStore.languages[`${intlPrefix}.clear`]}
                </Button>
              </Col>
            </Row>

          </Form>
          <LOV
            code="employee"
            firstForm={this.props.form}
            formItem={formItemCode}
            organizationId={this.props.AppState.currentMenuType.organizationId}
            visible={LOVVisible}
            onChange={(visible, text = text) => {
              this.setState({
                LOVVisible: visible,
                text,
              });
            }}
          />
          <div style={{ marginTop: '5px', marginRight: '0px' }}>
            <Table
              size="middle"
              pagination={pagination}
              columns={columns}
              rowKey="procInstId"
              scroll={{ x: 2100 }}
              dataSource={dataSource}
              loading={processStore.isLoading}
              onChange={this.handlePageChange.bind(this)}
              filterBar={false}
            />
          </div>
          {this.onCancelTransferHome}
          {this.transferRender()}
        </Content>

      </Page>

    );
  }
}

export default Form.create({})(withRouter(injectIntl(ProcessHome)));
