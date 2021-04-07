/** 2018/11/6
*作者:高梦龙
*项目：消息模板
*/


import React, { Component } from 'react';
import { Button, Modal, Table, Tooltip, Form, Input, Select, Icon, message } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, axios } from 'yqcloud-front-boot';
import messageTemplateStore from '../../../../stores/organization/messageTemplate/MessageTemplateStore';
import './index.scss';

const intlPrefix = 'organization.messageTemplate';
const FormItem = Form.Item;
const { Option } = Select;

@inject('AppState')
@observer


class MessageTemplateHome extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitState();
  }

  getInitState() {
    return {
      edit: false,
      page: 0,
      isLoading: true,
      params: [],
      filters: {},
      tempId: '',
      count: 0,
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      sort: '',
      visible: false,
      messageTestInfo: {},
      testVisible: false,
      loading: false,
      isSend: false,
      emailEdit: false,
      siteEdit: false,
      wechatEdit: false,
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadMessage();
  }

  fetch() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    messageTemplateStore.getApplicationTypes(organizationId);
    messageTemplateStore.getTransaction(organizationId);
    messageTemplateStore.getIsEnabled(organizationId);
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    messageTemplateStore.queryLanguage(id, AppState.currentLanguage);
  }

  // 消息模板分页

    loadMessage =(paginationIn, sortIn, filtersIn, paramsIn) => {
      const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
      const { AppState } = this.props;
      const { id } = AppState.currentMenuType;
      const pagination = paginationIn || paginationState;
      const sort = sortIn || sortState;
      const filters = filtersIn || filtersState;
      const params = paramsIn || paramsState;
      Object.keys(filters).forEach((i) => {
        if (i === 'transactionName') {
          filters.transactionNameList = [filtersIn.transactionName];
        }
      });
      messageTemplateStore.loadMeaasgeTemplate(
        id,
        pagination,
        sort,
        filters,
        params,
      ).then((data) => {
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
      });
    }

    handlePageChange(pagination, filters, { field, order }, params) {
      const sorter = [];
      if (field) {
        sorter.push(field);
        if (order === 'descend') {
          sorter.push('desc');
        }
      }
      this.loadMessage(pagination, sorter.join(','), filters, params);
    }

  // 打开消息模板页面
  openNewPage = (id) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const menuType = AppState.currentMenuType;
    this.props.history.push(`/iam/messageTemplate/${id ? `edit/${id}` : 'create'}?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
  };

  // 编辑消息模板界面
  onEdit = (id) => {
    this.openNewPage(id);
  };

  // 创建消息模板页面
  onCreate = () => {
    this.openNewPage();
  };

  // 测试弹出modal
  testShowModal=(values) => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    this.queryLDAPOrg();
    messageTemplateStore.getMessageTest(organizationId, values.templateId).then((data) => {
      this.setState({
        messageTestInfo: data,
        testVisible: true,
        tempId: values.templateId,
        emailEdit: data.sendTypeCode.indexOf('EMAIL') !== -1,
        siteEdit: data.sendTypeCode.indexOf('SITE') !== -1,
        wechatEdit: data.sendTypeCode.indexOf('WECHAT') !== -1,
      });
    });
  };


  handleReset = () => {
    this.props.form.resetFields();
  }

  queryLDAPOrg=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    return axios.get(`/iam/v1/${organizationId}/organizations`).then((data) => {
      this.setState({
        isSend: data.sendEmail,
      });
    });
  }

  /*
  测试提交按钮
*/
  testSubmit = (e, values) => {
    e.preventDefault();
    this.setState({
      loading: true,
    });
    this.props.form.validateFields((err, data) => {
      if (data.email !== '' || data.loginName !== '' || data.param !== '') {
        const { AppState, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        const { tempId } = this.state;
        messageTemplateStore.sendEmailTemplate(organizationId, tempId, data).then((data1) => {
          if (data1) {
            message.success(messageTemplateStore.languages[`${intlPrefix}.sent`]);
            this.handleReset();
            this.setState({
              testVisible: false,
              loading: false,
            });
          }
        });
      } else {
        message.warning(messageTemplateStore.languages[`${intlPrefix}.notification.method`]);
        this.setState({
          loading: false,
        });
      }
    });
  }

  testCancel = (e) => {
    this.handleReset();
    this.setState({
      testVisible: false,
      loading: false,
    });
  }

  // 更新页面数据
  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadMessage();
    });
  };

  // 消息模板删除
  handMessageDelete = (record) => {
    const { AppState, intl } = this.props;
    const organizationId = AppState.currentMenuType.id;
    messageTemplateStore.deleteMessage(organizationId, record).then((data) => {
      if (data) {
        Choerodon.prompt(messageTemplateStore.languages['delete.success']);
        this.handleRefresh();
      } else {
        Choerodon.prompt(messageTemplateStore.languages['delete.error']);
      }
    }).catch((error) => {
      Choerodon.prompt(messageTemplateStore.languages['delete.error']);
    });
  }

  /*
 * 有效和无效
 * */

  handleAble = (record) => {
    const { AppState, intl } = this.props;
    const { id } = AppState.currentMenuType;
    if (record.enabled === true) {
      messageTemplateStore.disableMessage(id, record).then((data) => {
        if (data) {
          const { failed, message } = data;
          if (failed) {
          } else {
            Choerodon.prompt(messageTemplateStore.languages['disable.success']);
            this.handleRefresh();
          }
        }
      }).catch((error) => {
        Choerodon.prompt(messageTemplateStore.languages['disable.error']);
      });
    } else {
      messageTemplateStore.enableMessage(id, record).then((data) => {
        if (data) {
          const { failed, message } = data;
          if (failed) {
          } else {
            Choerodon.prompt(messageTemplateStore.languages['enable.success']);
            this.handleRefresh();
          }
        }
      }).catch((error) => {
        Choerodon.prompt(messageTemplateStore.languages[`${intlPrefix}.application.system`]);
      });
    }
  };

  // 应用系统快码解析
  applicationCodeState=(values) => {
    const typeLists = messageTemplateStore.getApplicationCodeList;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  // 事务名称快码解析
  transactionNameState=(values) => {
    const typeLists = messageTemplateStore.getTransactionNames;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  enabledState = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const enabled = messageTemplateStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  render() {
    const { AppState, intl } = this.props;
    const { filters, pagination, dataSource, testVisible, messageTestInfo, loading, isSend, emailEdit, wechatEdit, siteEdit, param, loginNames, emails } = this.state;
    const { orgType } = this.props.AppState.currentMenuType.type;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
    const { getFieldDecorator } = this.props.form;
    const ApplicationCodes = messageTemplateStore.getApplicationCodeList; // 应用系统快码
    const applicationOption = [];
    const applicationText = [];
    const transactionNames = messageTemplateStore.getTransactionNames; // 事务名称快码
    const transactionNameOption = [];
    const transactionNameText = [];


    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '150px',
      wordBreak: 'normal',
    };
    const templateStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '150px',
      wordBreak: 'normal',
    };
    ApplicationCodes.forEach((item) => {
      applicationOption.push({ text1: item.lookupMeaning, value1: item.lookupValue });
    });
    applicationOption.forEach((values) => {
      applicationText.push({ text: values.text1, value: values.value1 });
    });

    transactionNames.forEach((item) => {
      transactionNameOption.push({ text2: item.lookupMeaning, value2: item.lookupValue });
    });
    transactionNameOption.forEach((values) => {
      transactionNameText.push({ text: values.text2, value: values.value2 });
    });

    const columns = [
      {
        title: messageTemplateStore.languages[`${intlPrefix}.templateName`],
        dataIndex: 'templateName',
        key: 'templateName',
        filters: [],
        align: 'left',
        filteredValue: filters.templateName || [],
        width: 150,
        render: (text, record) => (
          <span style={templateStyleName}>
            <Tooltip title={text} lines={20}>
              <a onClick={this.onEdit.bind(this, record.templateId)}>{text}</a>
            </Tooltip>
          </span>
        ),
      },
      {
        title: messageTemplateStore.languages[`${intlPrefix}.templateDesciption`],
        dataIndex: 'description',
        key: 'description',
        align: 'left',
        filteredValue: filters.descriptionc || [],
        width: 150,
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={20}>
              <div style={{ textAlign: 'left' }}>{`${record.description}` === 'null' ? '' : `${record.description}` }</div>
            </Tooltip>
          </span>
        ),
      },
      {
        title: messageTemplateStore.languages[`${intlPrefix}.applySystem`],
        dataIndex: 'applicationCode',
        key: 'applicationCode',
        align: 'left',
        width: 130,
        filters: applicationText,
        filteredValue: filters.applicationCode || [],
        render: (values, record) => this.applicationCodeState(record.applicationCode),

      },
      {
        title: messageTemplateStore.languages[`${intlPrefix}.transactionName`],
        dataIndex: 'transactionName',
        key: 'transactionName',
        align: 'left',
        width: 130,
        filters: transactionNameText,
        filterMultiple: true,
        filteredValue: filters.transactionName || [],
        render: (values, record) => this.transactionNameState(record.transactionName),

      },
      {
        title: messageTemplateStore.languages[`${intlPrefix}.sendType`],
        dataIndex: 'sendTypeCode',
        key: 'sendTypeCode',
        align: 'left',
        width: 130,
        filters: [{
          text: messageTemplateStore.languages[`${intlPrefix}.stationLetter`],
          value: '站内信',
        }, {
          text: messageTemplateStore.languages[`${intlPrefix}.email`],
          value: '邮件',
        },{
          text: messageTemplateStore.languages[`${intlPrefix}.weChat`],
          value: '微信',
        },{
          text: messageTemplateStore.languages[`${intlPrefix}.weChatWork`],
          value: '企业微信',
        }],
        filteredValue: filters.sendTypeCode || [],
        render: text => {
         if (text){
           let strArry = text.split(',');
           const array = [];
           strArry.forEach((v) => {
             if (v === 'email'){
               array.push(messageTemplateStore.languages[`${intlPrefix}.email`]);
             } else if (v === 'site'){
               array.push(messageTemplateStore.languages[`${intlPrefix}.stationLetter`]);
             } else if(v === 'wechat') {
               array.push(messageTemplateStore.languages[`${intlPrefix}.weChat`]);
             } else if(v === 'wechatwork') {
               array.push(messageTemplateStore.languages[`${intlPrefix}.weChatWork`]);
             }
           })
           return array.join(",");
          }
        }
      },
      {
        title: messageTemplateStore.languages[`${intlPrefix}.isEnabled`],
        dataIndex: 'enabled',
        key: 'enabled',
        width: 80,
        align: 'left',
        filters: [{
          text: messageTemplateStore.languages[`${intlPrefix}.isenabled.y`],
          value: 'true',
        }, {
          text: messageTemplateStore.languages[`${intlPrefix}.isenabled.n`],
          value: 'false',
        }],
        sorter: true,
        render: (values, record) => this.enabledState(record.enabled),

      },
      {
        title: messageTemplateStore.languages[`${intlPrefix}.controll`],
        dataIndex: 'action',
        key: 'action',
        width: 80,
        filteredValue: filters.assignee || [],
        render: (values, record) => (
          <div style={{ textAlign: 'left' }}>
            <a
              onClick={this.testShowModal.bind(this, record)}
            >{messageTemplateStore.languages[`${intlPrefix}.test`]}
            </a>
          </div>
        ),
      },

      {
        code: 'actions',
        title: messageTemplateStore.languages.operation,
        dataIndex: 'actions',
        key: 'actions',
        width: 160,
        render: (text, record) => {
          const style = {
            cursor: 'pointer',
            color: '#2196F3',
          };
          return (
            <div>
              {record.enabled === false
                ? (
                  <Tooltip placement="bottom" title={messageTemplateStore.languages[`${intlPrefix}.modeEdit`]}>
                    <Button
                      key="mode_edit"
                      shape="circle"
                      size="small"
                      icon="bianji-"
                      style={{ cursor: 'pointer' }}
                      onClick={this.onEdit.bind(this, record.templateId)}
                      disabled={record.enabled === false}
                    />
                  </Tooltip>
                )
                : (
                  <Tooltip placement="bottom" title={messageTemplateStore.languages[`${intlPrefix}.modeEdit`]}>
                    <Button
                      key="mode_edit"
                      shape="circle"
                      size="small"
                      icon="bianji-"
                      style={{ cursor: 'pointer', color: '#2196F3' }}
                      onClick={this.onEdit.bind(this, record.templateId)}
                      disabled={record.enabled === false}
                    />
                  </Tooltip>
                )

              }

              {record.enabled === false
                ? (
                  <Tooltip placement="bottom" title={messageTemplateStore.languages[`${intlPrefix}.finished`]}>
                    <Button
                      shape="circle"
                      size="small"
                      key="finished"
                      icon="yijieshu"
                      style={style}
                      onClick={this.handleAble.bind(this, record)}
                    />
                  </Tooltip>
                )
                : (
                  <Tooltip placement="bottom" title={messageTemplateStore.languages[`${intlPrefix}.forbidden_a`]}>
                    <Button
                      shape="circle"
                      size="small"
                      key="forbidden_a"
                      icon="jinyongzhuangtai"
                      style={{ cursor: 'pointer' }}
                      onClick={this.handleAble.bind(this, record)}

                    />
                  </Tooltip>
                ) }

              <Tooltip placement="bottom" title={messageTemplateStore.languages[`${intlPrefix}.delete`]}>
                <Button
                  key="delete"
                  shape="circle"
                  size="small"
                  icon="shanchu-icon"
                  style={{ cursor: 'pointer' }}
                  onClick={this.handMessageDelete.bind(this, record)}
                  disabled={record.enabled === true}
                />
              </Tooltip>
            </div>
          );
        },
      },
    ];

    return (

      <Page>
        <Header title={messageTemplateStore.languages[`${intlPrefix}.meaasgeTemplateTitle`]}>
          <Button
            style={{ color: '#04173F' }}
            onClick={this.onCreate}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {messageTemplateStore.languages[`${intlPrefix}.createMeaasgeTemplate`]}
          </Button>
        </Header>
        <Content>
          <div style={{ marginTop: '5px' }}>
            <Table
              size="middle"
              pagination={pagination}
              columns={columns}
              dataSource={dataSource}
              loading={messageTemplateStore.isLoading}
              onChange={this.handlePageChange.bind(this)}
            />
          </div>

          <Modal
            title={messageTemplateStore.languages[`${intlPrefix}.testInformation`]}
            visible={testVisible}
            onCancel={this.testCancel}
            className="agree-content"
            footer={[
              <Button
                onClick={this.testSubmit}
                style={isSend ? { backgroundColor: '#2196f3', borderRadius: 5 } : { borderRadius: 5 }}
                type="primary"
                disabled={isSend ? !(param !== '' || loginNames !== '' || param !== '') : true}
                funcType="raised"
                loading={loading}
              >
                {messageTemplateStore.languages.ok}
              </Button>,
              <Button
                onClick={this.testCancel}
                funcType="raised"
                style={{ marginRight: '15px' }}
              >
                {messageTemplateStore.languages.cancel}
              </Button>,
            ]}
            center
          >
            <Form layout="vertical">
              <div className="messageType">
                <span className="messageLabel">{messageTemplateStore.languages['user.userinfo.email']}</span>
                <FormItem className="messageInput">
                  {getFieldDecorator('email', {
                    validateTrigger: 'onBlur',
                    initialValue: isSend ? messageTestInfo.email || '' : '',
                    validateFirst: true,
                  })(
                    <Input
                      placeholder={isSend ? messageTemplateStore.languages[`${intlPrefix}.emailLabel`] : messageTemplateStore.languages[`${intlPrefix}.isEmailLabel`]}
                      autoComplete="off"
                      style={{ width: 300, marginLeft: '30px' }}
                      disabled={isSend ? !emailEdit : true}
                    />,
                  )}
                </FormItem>
              </div>
              <div className="messageType">
                <span className="messageLabel">{messageTemplateStore.languages['account.configuration.account']}</span>
                <FormItem className="messageInput">
                  {getFieldDecorator('loginName', {
                    validateTrigger: 'onBlur',
                    initialValue: isSend ? messageTestInfo.loginName || '' : '',
                    validateFirst: true,
                  })(
                    <Input
                      placeholder={isSend ? messageTemplateStore.languages[`${intlPrefix}.loginNameLabel`] : messageTemplateStore.languages[`${intlPrefix}.isLoginNameLabel`]}
                      autoComplete="off"
                      style={{ width: 300, marginLeft: '30px' }}
                      disabled={isSend ? !siteEdit : true}
                    />,
                  )}
                </FormItem>
              </div>
              <div className="messageType" style={{ marginBottom: 10 }}>
                <span className="messageLabel">{messageTemplateStore.languages[`${intlPrefix}.weChat`]}</span>
                <FormItem className="messageInput">
                  {getFieldDecorator('param', {
                    validateTrigger: 'onBlur',
                    initialValue: isSend ? messageTestInfo.param || '' : '',
                    validateFirst: true,
                  })(
                    <Input
                      placeholder={isSend ? messageTemplateStore.languages[`${intlPrefix}.paramLabel`] : messageTemplateStore.languages[`${intlPrefix}.isWeChatLabel`]}
                      autoComplete="off"
                      style={{ width: 300, marginLeft: '30px' }}
                      // disabled={!wechatEdit}
                      disabled={isSend ? !wechatEdit : true}
                    />,
                  )}
                </FormItem>
              </div>
              <div className="messageType" style={{ marginBottom: 10 }}>
                <span><Icon style={{ color: '#2196f3', fontSize: 18, marginRight: 5 }} type="info" /><span style={{ fontSize: 12, color: '#818999' }}>{messageTemplateStore.languages[`${intlPrefix}.weChat.message`]}</span></span>
              </div>
            </Form>
          </Modal>
        </Content>
      </Page>


    );
  }
}

export default Form.create()(withRouter(injectIntl(MessageTemplateHome)));
