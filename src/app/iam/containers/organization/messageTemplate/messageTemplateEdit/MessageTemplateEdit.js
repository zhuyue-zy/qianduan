/** 2018/11/6
 *作者:高梦龙
 *项目：消息模板
 */

import React, { Component } from 'react';
import { Form, Input, Select, Table, Button, message, Badge, Tabs, Tooltip, Row, Col, Checkbox, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Page, Header, axios } from 'yqcloud-front-boot';
import './index.scss';
import LOV from '../../../../components/lov';
import LOVInput from '../../../../components/lov/LOVInput';
import messageTemplateStore from '../../../../stores/organization/messageTemplate/MessageTemplateStore';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';


const FormItem = Form.Item;
const { TabPane } = Tabs;
const intlPrefix = 'organization.messageTemplate';
const { Option } = Select;
const { TextArea } = Input;

@inject('AppState')
@observer
class BackLogEdit extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      submitting: false,
      open: false,
      edit: !!this.props.match.params.id, // 页面是否是编辑状态
      id: this.props.match.params.id,
      isLoading: true,
      copied: false,
      filters: {},
      badgeEmailStatus: 'default',
      badgeStationStatus: 'default',
      badgeWeChatStatus: 'default',
      badgeWechatWorkStatus: 'default',
      messageInfo: {},
      paramInfo: [],
      messageType: [],
      allDate: {},
      count: 0,
      checkMail: false,
      checkStation: false,
      checkWeChat: false,
      LOVVisible: false,
      visible: false,
      text: '',
      LOVCode: '',
      formItemCode: '',
      userName: '',
      applicationCode: '',
      transactionName: '',
      disableType: true,
      pagination: {
        current: 1,
        pageSize: 15,
        total: '',
        pageSizeOptions: ['15'],
      },
      sort: '',
      page: 0,
      // 存放多语言信息
      multiLanguageValue: {
        template_name: {},
        description: {},
      },
      multiLanguageList: [],
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
    this.getLanguage();
  }

  fetch() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    messageTemplateStore.getApplicationTypes(organizationId);
    messageTemplateStore.getTransactionName(organizationId);
  }

  componentDidMount = () => {
    const { AppState } = this.props;
    const { id } = this.state;
    const { organizationId } = AppState.currentMenuType;
    if (id){
      this.getMessageTemplateId(organizationId, id);
    }
  }

  /* 获取系统支持的语言环境 */
  getLanguage = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        }, () => this.setDispalyName());
      });
  };


  // 设定名字
  setDispalyName = () => {
    const { AppState } = this.props;
    const { id } = this.state;
    const { organizationId } = AppState.currentMenuType;
    const { multiLanguageValue, languageEnv } = this.state;
    const { template_name, description } = multiLanguageValue;
    languageEnv.forEach((val) => {
      template_name[val.code] = '';
      description[val.code] = '';
    });
    if (id){
      this.setState({
        multiLanguageValue,
      }, () => this.getMessageTemplateId(organizationId, id));
    } else {
      this.setState({
        multiLanguageValue,
      });
    }
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    messageTemplateStore.queryLanguage(id, AppState.currentLanguage);
  };


  // 通过ID查询
  getMessageTemplateId = (organizationId, id) => {
    const code = 'FND_MSG_TRANSNAME';
    const { pagination, sort, multiLanguageValue } = this.state;
    messageTemplateStore.getMessageTemplateId(organizationId, id).then((data) => {
      const template_name = Object.assign({}, multiLanguageValue.template_name, data.__tls.template_name);
      const description = Object.assign({}, multiLanguageValue.description, data.__tls.description);
      this.setState({
        messageInfo: data,
        applicationCode:data.applicationCode,
        messageType: data.setupTemplateSendList,
        disableType: data.enabled,
        multiLanguageValue: { template_name, description },
      });
      messageTemplateStore.getTransactionName(organizationId, code, data.applicationCode);

      if (data.transactionName) {
        axios.get(`message/v1/${organizationId}/setup/temp/param?applicationCode=${data.applicationCode}&page=${pagination.current - 1}&size=${pagination.pageSize}&sort=${sort}`)
          .then((data2) => {
            let { count } = this.state;
            data2.content.forEach((v) => {
              v.key = count;
              count += 1;
            });
            this.setState({
              pagination: {
                current: (data2.number || 0) + 1,
                pageSize: data2.size || 15,
                total: data2.totalElements || '',
                pageSizeOptions: ['15'],
              },
              sort,
              paramInfo: data2.content,
            });
          });
      }

      data.setupTemplateSendList.forEach((value) => {
        if (value.sendTypeCode === 'EMAIL') {
          if (value.send) {
            this.setState({ checkMail: true });
          }
          if (value.subject || value.content) {
            this.setState({ badgeEmailStatus: 'success' });
          }
        }
        if (value.sendTypeCode === 'SITE') {
          if (value.send) {
            this.setState({ checkStation: true });
          }
          if (value.subject || value.content) {
            this.setState({ badgeStationStatus: 'success' });
          }
        }

        if (value.sendTypeCode === 'WECHAT') {
          if (value.send) {
            this.setState({ checkWeChat: true });
          }
          if (value.content) {
            this.setState({ badgeWeChatStatus: 'success' });
          }
        }
        if (value.sendTypeCode === 'WECHATWORK') {
          if (value.send) {
            this.setState({ checkWechatWork: true });
          }
          if (value.content) {
            this.setState({ badgeWechatWorkStatus: 'success' });
          }
        }
      });
    });
  }

  copyInput=({ record }) => {
    const { disableType } = this.state;
    return (
      <Tooltip
        title={messageTemplateStore.languages[`${intlPrefix}.click.copy`]}
        placement="right"
      >
        <Input
          value={record.paramCode}
          underline={false}
          copy
          disabled={disableType ? '' : 'true'}
        />
      </Tooltip>
    );
  }


  // 渲染table
  renderTable = () => {
    //  获取dataSource
    const { paramInfo, disableType, pagination } = this.state;
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const columns = [
      {
        title: messageTemplateStore.languages[`${intlPrefix}.parameterName`],
        dataIndex: 'paramName',
        key: 'paramName',
        filters: [],
        width: 300,
      },
      {
        title: messageTemplateStore.languages[`${intlPrefix}.parameterValue`],
        dataIndex: 'paramCode',
        key: 'paramCode',
        filters: [],
        width: 300,
        render: (value, record) => (this.copyInput({ record })),

      },
    ];
    return (
      <Table
        columns={columns}
        dataSource={paramInfo}
        onChange={this.handlePageChange.bind(this)}
        pagination={pagination}
        filterBar={false}
      />
    );
  }

  handlePageChange(pagination, filters, { field, order }) {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { applicationCode, messageInfo, transactionName, sort } = this.state;
    const application = messageInfo.applicationCode;
    const transaction = messageInfo.transactionName;
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }

    axios.get(`message/v1/${organizationId}/setup/temp/param?applicationCode=${applicationCode || application}&page=${pagination.current - 1}&size=${pagination.pageSize}&sort=${sort}`)
      .then((data) => {
        this.setState({
          paramInfo: data.content,
          pagination: {
            current: (data.number || 0) + 1,
            pageSize: data.size || 15,
            total: data.totalElements || '',
            pageSizeOptions: ['15'],
          },
        });
      });
  }

  // 应用系统秀下拉框改变
  applicationCodeChange = (value) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const code = 'FND_MSG_TRANSNAME';
    messageTemplateStore.getTransactionName(organizationId, code, value);
    this.props.form.setFieldsValue({
      transactionName: '',
    });
    this.setState({
      applicationCode: value,
    });
    const { messageInfo } = this.state;
    const { pagination, sort } = this.state;
    const application = messageInfo.applicationCode;
    if (value) {
      axios.get(`message/v1/${organizationId}/setup/temp/param?applicationCode=${value || application}&page=${pagination.current - 1}&size=${pagination.pageSize}&sort=${sort}`)
        .then((data) => {
          this.setState({
            paramInfo: data.content,
            pagination: {
              current: (data.number || 0) + 1,
              pageSize: data.size || 25,
              total: data.totalElements || '',
              pageSizeOptions: ['25', '50', '100', '200'],
            },
          });
        });
    }
  }

  // 事务名称下拉框改变值
  transactionNameChange = (value) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { applicationCode, messageInfo } = this.state;
    const { pagination, sort } = this.state;
    const application = messageInfo.applicationCode;
    if (value) {
      axios.get(`message/v1/${organizationId}/setup/temp/param?applicationCode=${applicationCode || application}&page=${pagination.current - 1}&size=${pagination.pageSize}&sort=${sort}`)
        .then((data) => {
          this.setState({
            paramInfo: data.content,
            pagination: {
              current: (data.number || 0) + 1,
              pageSize: data.size || 25,
              total: data.totalElements || '',
              pageSizeOptions: ['25', '50', '100', '200'],
            },
          });
        });
    }
  }

  // 改变邮箱tab徽标
  changeEamilBadge = (e) => {
    const { form } = this.props;
    if (form.getFieldValue('subject_1') || form.getFieldValue('content_1')) {
      this.setState({
        badgeEmailStatus: 'success',
      });
    } else {
      this.setState({
        badgeEmailStatus: 'default',
      });
    }
  }

  // 改变站内信tab徽标
  changeStationBadge = (e) => {
    const { form } = this.props;
    if (form.getFieldValue('subject_2') || form.getFieldValue('content_2')) {
      this.setState({
        badgeStationStatus: 'success',
      });
    } else {
      this.setState({
        badgeStationStatus: 'default',
      });
    }
  }

  // 改变微信tab徽标
  changeWeChatBadge = (e) => {
    const values = e.target.value;
    if (values) {
      this.setState({
        badgeWeChatStatus: 'success',
      });
    } else {
      this.setState({
        badgeWeChatStatus: 'default',
      });
    }
  }

  // 改变企业微信tab徽标
  changeWechatWorkBadge = (e) => {
    const values = e.target.value;
    if (values) {
      this.setState({
        badgeWechatWorkStatus: 'success',
      });
    } else {
      this.setState({
        badgeWechatWorkStatus: 'default',
      });
    }
  }


  // 提交页面
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (!err) {
        const { intl } = this.props;
        const { messageInfo, messageType, checkMail, checkStation, checkWeChat,checkWechatWork, edit, id } = this.state;
        const { organizationId } = this.props.AppState.currentMenuType;
        if (edit) {
          messageInfo.templateName = data.templateName;
          messageInfo.description = data.description;
          messageInfo.applicationCode = data.applicationCode;
          messageInfo.accountId = data.accountId;
          messageInfo.transactionName = messageInfo.transactionName;
          if (messageType.length !== 0) {
            const emails = messageType.filter(item => (item.sendTypeCode === 'EMAIL'));
            const sites = messageType.filter(item => (item.sendTypeCode === 'SITE'));
            const wechats = messageType.filter(item => (item.sendTypeCode === 'WECHAT'));
            const wechatWork = messageType.filter(item => (item.sendTypeCode === 'WECHATWORK'));


            if (emails.length > 0) {
              emails[0].send = checkMail;
              emails[0].subject = data.subject_1;
              emails[0].content = data.content_1.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;');
            } else {
              messageType.push(
                {
                  sendTypeCode: 'EMAIL',
                  send: checkMail,
                  subject: data.subject_1,
                  content: data.content_1.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                },
              );
            }

            if (sites.length > 0) {
              sites[0].send = checkStation;
              sites[0].subject = data.subject_2;
              sites[0].content = data.content_2.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;');
            } else {
              messageType.push(
                {
                  sendTypeCode: 'SITE',
                  send: checkStation,
                  subject: data.subject_2,
                  content: data.content_2.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                },
              );
            }

            if (wechats.length > 0) {
              wechats[0].send = checkWeChat;
              wechats[0].content = data.content_3.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;');
            } else {
              messageType.push(
                {
                  sendTypeCode: 'WECHAT',
                  send: checkWeChat,
                  content: data.content_3.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                },
              );
            }

            if (wechatWork.length > 0) {
              wechatWork[0].send = checkWechatWork;
              wechatWork[0].subject = data.subject_4;
              wechatWork[0].content = data.content_4.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;');
            } else {
              messageType.push(
                {
                  sendTypeCode: 'WECHATWORK',
                  send: checkWechatWork,
                  subject: data.subject_4,
                  content: data.content_4.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                },
              );
            }

            // if (emails.length !== 0 && wechats.length !== 0 && sites.length !== 0 && wechatWork.length !== 0) {
            //   messageType.splice(0, 4, emails[0], sites[0], wechats[0] ,wechatWork[0]);
            // } else if (emails.length !== 0 && wechats.length!== 0 && sites.length !== 0) {
            //   messageType.splice(0, 3, emails[0], wechats[0], sites[0]);
            // } else if (emails.length !== 0 && wechats.length!== 0 && wechatWork.length !== 0) {
            //   messageType.splice(0, 3, emails[0], wechats[0], wechatWork[0]);
            // }else if (emails.length !== 0 && sites.length!== 0 && wechatWork.length !== 0) {
            //   messageType.splice(0, 3, emails[0], sites[0], wechatWork[0]);
            // }else if (wechats.length !== 0 && sites.length!== 0 && wechatWork.length !== 0) {
            //   messageType.splice(0, 3, wechats[0], sites[0], wechatWork[0]);
            // } else if (emails.length !== 0 && wechatWork.length!== 0) {
            //   messageType.splice(0, 2, emails[0], wechatWork[0]);
            // } else if (wechats.length !== 0 && wechatWork.length!== 0) {
            //   messageType.splice(0, 2, wechats[0], wechatWork[0]);
            // } else if (sites.length !== 0 && wechatWork.length!== 0) {
            //   messageType.splice(0, 2, sites[0], wechatWork[0]);
            // } else if (emails.length !== 0 && wechats.length!== 0) {
            //   messageType.splice(0, 2, emails[0], wechats[0]);
            // } else if (wechats.length !== 0 && sites.length !== 0) {
            //   messageType.splice(0, 2, emails[0], wechats[0]);
            // } else if (emails.length !== 0 && sites.length !== 0) {
            //   messageType.splice(0, 2, emails[0], sites[0]);
            // } else if (emails.length !== 0) {
            //   messageType.splice(0, 1, emails[0]);
            // } else if (sites.length !== 0) {
            //   messageType.splice(0, 1, sites[0]);
            // } else if (wechats.length !== 0) {
            //   messageType.splice(0, 1, wechats[0]);
            // } else if (wechatWork.length !== 0) {
            //   messageType.splice(0, 1, wechatWork[0]);
            // }
          }

          if (checkMail && checkWeChat && checkStation) {
            if (data.accountId && data.subject_1 && data.content_1 && data.subject_2 && data.content_2 && data.content_3) {
                messageInfo.transactionName = data.transactionName,
                messageInfo.setupTemplateSendList = messageType
              messageTemplateStore.updateMessage(organizationId,  Object.assign({},messageInfo,{
                  __tls: this.state.multiLanguageValue,
                  language: this.state.multiLanguageList,
                })).then((values) => {
                if (values) {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('enter.required');
            }
          } else if (checkMail && checkStation) {
            if (data.accountId && data.subject_1 && data.content_1 && data.subject_2 && data.content_2) {
              messageInfo.transactionName = data.transactionName,
                messageInfo.setupTemplateSendList = messageType,
              messageTemplateStore.updateMessage(organizationId,  Object.assign({},messageInfo,{
                  __tls: this.state.multiLanguageValue,
                  language: this.state.multiLanguageList,
                } ,)).then((values) => {
                if (values) {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('select.message.notification');
            }
          } else if (checkMail && checkWeChat) {
            if (data.accountId && data.subject_1 && data.content_1 && data.content_3) {
              messageInfo.transactionName = data.transactionName,
                messageInfo.setupTemplateSendList = messageType,
              messageTemplateStore.updateMessage(organizationId,  Object.assign({},messageInfo,{
                  __tls: this.state.multiLanguageValue,
                  language: this.state.multiLanguageList,
                })).then((values) => {
                if (values) {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('enter.required');
            }
          } else if (checkWeChat && checkStation) {
            if (data.subject_2 && data.content_2 && data.content_3) {
              messageInfo.transactionName = data.transactionName,
                messageInfo.setupTemplateSendList = messageType,
              messageTemplateStore.updateMessage(organizationId,  Object.assign({},messageInfo,{
                  __tls: this.state.multiLanguageValue,
                  language: this.state.multiLanguageList,
                })).then((values) => {
                if (values) {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('enter.required');
            }
          } else if (checkMail) {
            if (data.accountId && data.subject_1 && data.content_1) {
              messageInfo.transactionName = data.transactionName,
                messageInfo.setupTemplateSendList = messageType
              messageTemplateStore.updateMessage(organizationId, Object.assign({},messageInfo,{
                  __tls: this.state.multiLanguageValue,
                  language: this.state.multiLanguageList,
                })).then((values) => {
                if (values) {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('select.message.notification');
            }
          } else if (checkStation) {
            if (data.subject_2 && data.content_2) {
                messageInfo.transactionName = data.transactionName,
                messageInfo.setupTemplateSendList = messageType,
              messageTemplateStore.updateMessage(organizationId,  Object.assign({},messageInfo,{
                  __tls: this.state.multiLanguageValue,
                  language: this.state.multiLanguageList,
                })).then((values) => {
                if (values) {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('select.message.notification');
            }
          } else if (checkWeChat) {
            if (data.content_3) {
                messageInfo.transactionName = data.transactionName,
                messageInfo.setupTemplateSendList = messageType,
              messageTemplateStore.updateMessage(organizationId, Object.assign({},messageInfo,{
                  __tls: this.state.multiLanguageValue,
                  language: this.state.multiLanguageList,
                })).then((values) => {
                if (values) {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('select.message.notification');
            }
          } else {
              messageInfo.transactionName = data.transactionName,
              messageInfo.setupTemplateSendList = messageType
            messageTemplateStore.updateMessage(organizationId, Object.assign({},messageInfo,{
              __tls: this.state.multiLanguageValue,
              language: this.state.multiLanguageList,
            })).then((values) => {
              if (values) {
                Choerodon.prompt(messageTemplateStore.languages['save.success']);
                this.props.history.goBack();
              } else {
                Choerodon.prompt(messageTemplateStore.languages['save.error']);
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
            });
          }
        } else {
          messageInfo.templateName = data.templateName;
          messageInfo.description = data.description;
          messageInfo.applicationCode = data.applicationCode;
          messageInfo.accountId = data.accountId;
          messageInfo.transactionName = data.transactionName;
          if (checkMail && checkWeChat && checkStation) {
            if (data.accountId && data.subject_1 && data.content_1 && data.subject_2 && data.content_2 && data.content_3) {
              if (data.subject_1 || data.content_1 || !checkMail || checkMail) {
                messageType.push(
                  {
                    sendTypeCode: 'EMAIL',
                    send: checkMail,
                    subject: data.subject_1,
                    content: data.content_1.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_2 || data.content_2 || checkStation || !checkStation) {
                messageType.push(
                  {
                    sendTypeCode: 'SITE',
                    send: checkStation,
                    subject: data.subject_2,
                    content: data.content_2.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.content_3 || checkWeChat || !checkWeChat) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHAT',
                    send: checkWeChat,
                    content: data.content_3.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_4 || data.content_4 || !checkWechatWork || checkWechatWork) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHATWORK',
                    send: checkWechatWork,
                    subject: data.subject_4,
                    content: data.content_4.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              messageInfo.setupTemplateSendList = messageType;
              messageTemplateStore.createMessage(organizationId, Object.assign({},messageInfo,{
                __tls: this.state.multiLanguageValue,
                language: this.state.multiLanguageList,
              } )).then(({ failed }) => {
                if (failed) {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('enter.required');
            }
          } else if (checkMail && checkStation) {
            if (data.accountId && data.subject_1 && data.content_1 && data.subject_2 && data.content_2) {
              if (data.subject_1 || data.content_1 || !checkMail || checkMail) {
                messageType.push(
                  {
                    sendTypeCode: 'EMAIL',
                    send: checkMail,
                    subject: data.subject_1,
                    content: data.content_1.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_2 || data.content_2 || checkStation || !checkStation) {
                messageType.push(
                  {
                    sendTypeCode: 'SITE',
                    send: checkStation,
                    subject: data.subject_2,
                    content: data.content_2.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.content_3 || checkWeChat || !checkWeChat) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHAT',
                    send: checkWeChat,
                    content: data.content_3.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_4 || data.content_4 || !checkWechatWork || checkWechatWork) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHATWORK',
                    send: checkWechatWork,
                    subject: data.subject_4,
                    content: data.content_4.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              messageInfo.setupTemplateSendList = messageType;
              messageTemplateStore.createMessage(organizationId, Object.assign({},messageInfo,{
                  __tls: this.state.multiLanguageValue,
                  language: this.state.multiLanguageList,
                })).then(({ failed }) => {
                if (failed) {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('enter.required');
            }
          } else if (checkMail && checkWeChat) {
            if (data.accountId && data.subject_1 && data.content_1 && data.content_3) {
              if (data.subject_1 || data.content_1 || !checkMail || checkMail) {
                messageType.push(
                  {
                    sendTypeCode: 'EMAIL',
                    send: checkMail,
                    subject: data.subject_1,
                    content: data.content_1.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_2 || data.content_2 || checkStation || !checkStation) {
                messageType.push(
                  {
                    sendTypeCode: 'SITE',
                    send: checkStation,
                    subject: data.subject_2,
                    content: data.content_2.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.content_3 || checkWeChat || !checkWeChat) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHAT',
                    send: checkWeChat,
                    content: data.content_3.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_4 || data.content_4 || !checkWechatWork || checkWechatWork) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHATWORK',
                    send: checkWechatWork,
                    subject: data.subject_4,
                    content: data.content_4.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              messageInfo.setupTemplateSendList = messageType
              messageTemplateStore.createMessage(organizationId,Object.assign({},messageInfo,{
                __tls: this.state.multiLanguageValue,
                language: this.state.multiLanguageList,
              })).then(({ failed }) => {
                if (failed) {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('enter.required');
            }
          } else if (checkStation && checkWeChat) {
            if (data.subject_2 && data.content_2 && data.content_3) {
              if (data.subject_1 || data.content_1 || !checkMail || checkMail) {
                messageType.push(
                  {
                    sendTypeCode: 'EMAIL',
                    send: checkMail,
                    subject: data.subject_1,
                    content: data.content_1.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_2 || data.content_2 || checkStation || !checkStation) {
                messageType.push(
                  {
                    sendTypeCode: 'SITE',
                    send: checkStation,
                    subject: data.subject_2,
                    content: data.content_2.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.content_3 || checkWeChat || !checkWeChat) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHAT',
                    send: checkWeChat,
                    content: data.content_3.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_4 || data.content_4 || !checkWechatWork || checkWechatWork) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHATWORK',
                    send: checkWechatWork,
                    subject: data.subject_4,
                    content: data.content_4.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              messageInfo.setupTemplateSendList = messageType;
              messageTemplateStore.createMessage(organizationId, Object.assign({},messageInfo,{
                __tls: this.state.multiLanguageValue,
                language: this.state.multiLanguageList,
              } )).then(({ failed }) => {
                if (failed) {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('enter.required');
            }
          } else if (checkMail) {
            if (data.accountId && data.subject_1 && data.content_1) {
              if (data.subject_1 || data.content_1 || !checkMail || checkMail) {
                messageType.push(
                  {
                    sendTypeCode: 'EMAIL',
                    send: checkMail,
                    subject: data.subject_1,
                    content: data.content_1.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_2 || data.content_2 || checkStation || !checkStation) {
                messageType.push(
                  {
                    sendTypeCode: 'SITE',
                    send: checkStation,
                    subject: data.subject_2,
                    content: data.content_2.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.content_3 || checkWeChat || !checkWeChat) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHAT',
                    send: checkWeChat,
                    content: data.content_3.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_4 || data.content_4 || !checkWechatWork || checkWechatWork) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHATWORK',
                    send: checkWechatWork,
                    subject: data.subject_4,
                    content: data.content_4.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              messageInfo.setupTemplateSendList = messageType;
              messageTemplateStore.createMessage(organizationId, Object.assign({},messageInfo,{
                __tls: this.state.multiLanguageValue,
                language: this.state.multiLanguageList,
              })).then(({ failed }) => {
                if (failed) {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('enter.required');
            }
          } else if (checkStation) {
            if (data.subject_2 && data.content_2) {
              if (data.subject_1 || data.content_1 || !checkMail || checkMail) {
                messageType.push(
                  {
                    sendTypeCode: 'EMAIL',
                    send: checkMail,
                    subject: data.subject_1,
                    content: data.content_1.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_2 || data.content_2 || checkStation || !checkStation) {
                messageType.push(
                  {
                    sendTypeCode: 'SITE',
                    send: checkStation,
                    subject: data.subject_2,
                    content: data.content_2.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.content_3 || checkWeChat || !checkWeChat) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHAT',
                    send: checkWeChat,
                    content: data.content_3.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_4 || data.content_4 || !checkWechatWork || checkWechatWork) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHATWORK',
                    send: checkWechatWork,
                    subject: data.subject_4,
                    content: data.content_4.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              messageInfo.setupTemplateSendList = messageType;
              messageTemplateStore.createMessage(organizationId, Object.assign({},messageInfo,{
                  __tls: this.state.multiLanguageValue,
                  language: this.state.multiLanguageList,
                })).then(({ failed }) => {
                if (failed) {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('enter.required');
            }
          } else if (checkWeChat) {
            if (data.content_3) {
              if (data.subject_1 || data.content_1 || !checkMail || checkMail) {
                messageType.push(
                  {
                    sendTypeCode: 'EMAIL',
                    send: checkMail,
                    subject: data.subject_1,
                    content: data.content_1.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_2 || data.content_2 || checkStation || !checkStation) {
                messageType.push(
                  {
                    sendTypeCode: 'SITE',
                    send: checkStation,
                    subject: data.subject_2,
                    content: data.content_2.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.content_3 || checkWeChat || !checkWeChat) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHAT',
                    send: checkWeChat,
                    content: data.content_3.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              if (data.subject_4 || data.content_4 || !checkWechatWork || checkWechatWork) {
                messageType.push(
                  {
                    sendTypeCode: 'WECHATWORK',
                    send: checkWechatWork,
                    subject: data.subject_4,
                    content: data.content_4.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                  },
                );
              }
              messageInfo.setupTemplateSendList = messageType;
              messageTemplateStore.createMessage(organizationId,Object.assign({},messageInfo,{
                __tls: this.state.multiLanguageValue,
                language: this.state.multiLanguageList,
              })).then(({ failed }) => {
                if (failed) {
                  Choerodon.prompt(messageTemplateStore.languages['save.error']);
                } else {
                  Choerodon.prompt(messageTemplateStore.languages['save.success']);
                  this.props.history.goBack();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              messageTemplateStore.getCode('enter.required');
            }
          } else {
            if (data.subject_1 || data.content_1 || !checkMail || checkMail) {
              messageType.push(
                {
                  sendTypeCode: 'EMAIL',
                  send: checkMail,
                  subject: data.subject_1,
                  content: data.content_1.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                },
              );
            }
            if (data.subject_2 || data.content_2 || checkStation || !checkStation) {
              messageType.push(
                {
                  sendTypeCode: 'SITE',
                  send: checkStation,
                  subject: data.subject_2,
                  content: data.content_2.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                },
              );
            }
            if (data.content_3 || checkWeChat || !checkWeChat) {
              messageType.push(
                {
                  sendTypeCode: 'WECHAT',
                  send: checkWeChat,
                  content: data.content_3.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                },
              );
            }
            if (data.subject_4 || data.content_4 || !checkWechatWork || checkWechatWork) {
              messageType.push(
                {
                  sendTypeCode: 'WECHATWORK',
                  send: checkWechatWork,
                  subject: data.subject_4,
                  content: data.content_4.replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;'),
                },
              );
            }
            messageInfo.setupTemplateSendList = messageType;
            messageTemplateStore.createMessage(organizationId,Object.assign({},messageInfo,{
              __tls: this.state.multiLanguageValue,
              language: this.state.multiLanguageList,
            })).then(({ failed }) => {
              if (failed) {
                Choerodon.prompt(messageTemplateStore.languages['save.error']);
              } else {
                Choerodon.prompt(messageTemplateStore.languages['save.success']);
                this.props.history.goBack();
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
            });
          }
        }
      } else {
        messageTemplateStore.getCode('enter.required');
      }
    });
  }

  // 校验邮箱账户以及邮件主题和内容是否必填
  setCheckMail = (e) => {
    this.setState({ checkMail: e.target.checked });
    this.props.form.validateFields((error, values) => {
      if (e.target.checked) {
        if (!values.accountId) {
          this.props.form.setFields({
            accountId: {
              value: values.accountId,
              errors: [new Error(messageTemplateStore.languages[`${intlPrefix}.select.mailAccount`])],
            },
          });
        }
        if (!values.subject_1) {
          this.props.form.setFields({
            subject_1: {
              value: values.subject_1,
              errors: [new Error(messageTemplateStore.languages[`${intlPrefix}.fill.messageHeader`])],
            },
          });
        } else {
          this.props.form.setFields({
            subject_1: {
              value: values.subject_1,
            },
          });
        }
        if (!values.content_1) {
          this.props.form.setFields({
            content_1: {
              value: values.content_1,
              errors: [new Error(messageTemplateStore.languages[`${intlPrefix}.fill.content`])],
            },
          });
        }
      } else {
        this.props.form.setFields({
          accountId: {
            value: values.accountId,
          },
        });
        this.props.form.setFields({
          subject_1: {
            value: values.subject_1,
          },
        });
        this.props.form.setFields({
          content_1: {
            value: values.content_1,
          },
        });
      }
    });
  }

  checkEmailTitle=(e) => {
    if (e.target.value) {
      this.props.form.setFields({
        subject_1: {
          value: e.target.value,
        },
      });
    }
  }

  checkWechatWorkTitle=(e) => {
    if (e.target.value) {
      this.props.form.setFields({
        subject_4: {
          value: e.target.value,
        },
      });
    }
  }

  checkWechatWorkContent=(e) => {
    if (e.target.value) {
      this.props.form.setFields({
        content_4: {
          value: e.target.value,
        },
      });
    }
  }

  checkEmailContent=(e) => {
    if (e.target.value) {
      this.props.form.setFields({
        content_1: {
          value: e.target.value,
        },
      });
    }
  }

  checkStationTitle=(e) => {
    if (e.target.value) {
      this.props.form.setFields({
        subject_2: {
          value: e.target.value,
        },
      });
    }
  }

  checkStationContent=(e) => {
    if (e.target.value) {
      this.props.form.setFields({
        content_2: {
          value: e.target.value,
        },
      });
    }
  }


  checkWeChats=(e) => {
    if (e.target.value) {
      this.props.form.setFields({
        content_3: {
          value: e.target.value,
        },
      });
    }
  }

  setCheckSation = (e) => {
    this.setState({ checkStation: e.target.checked });
    this.props.form.validateFields((error, values) => {
      if (e.target.checked) {
        if (!values.subject_2) {
          this.props.form.setFields({
            subject_2: {
              value: values.subject_2,
              errors: [new Error(messageTemplateStore.languages[`${intlPrefix}.fill.stationLetter`])],
            },
          });
        }
        if (!values.content_2) {
          this.props.form.setFields({
            content_2: {
              value: values.content_2,
              errors: [new Error(messageTemplateStore.languages[`${intlPrefix}.fill.stationContent`])],
            },
          });
        }
      } else {
        this.props.form.setFields({
          subject_2: {
            value: values.subject_2,
          },
        });
        this.props.form.setFields({
          content_2: {
            value: values.content_2,
          },
        });
      }
    });
  }

  setCheckWeChatWork = (e) => {
    this.setState({ checkWechatWork: e.target.checked });
    this.props.form.validateFields((error, values) => {
      if (e.target.checked) {
        if (!values.subject_4) {
          this.props.form.setFields({
            subject_4: {
              value: values.subject_4,
              errors: [new Error(messageTemplateStore.languages[`${intlPrefix}.inputWeChatWorkTitle`])],
            },
          });
        }
        if (!values.content_4) {
          this.props.form.setFields({
            content_4: {
              value: values.content_4,
              errors: [new Error(messageTemplateStore.languages[`${intlPrefix}.inputWeChatWorkContent`])],
            },
          });
        }
      } else {
        this.props.form.setFields({
          subject_4: {
            value: values.subject_4,
          },
        });
        this.props.form.setFields({
          content_4: {
            value: values.content_4,
          },
        });
      }
    });
  }

  setCheckWeChat = (e) => {
    this.setState({ checkWeChat: e.target.checked });
    this.props.form.validateFields((error, values) => {
      if (e.target.checked) {
        if (!values.content_3) {
          this.props.form.setFields({
            content_3: {
              value: values.content_3,
              errors: [new Error(messageTemplateStore.languages[`${intlPrefix}.fill.weChatContent`])],
            },
          });
        }
      } else {
        this.props.form.setFields({
          content_3: {
            value: values.content_3,
          },
        });
      }
    });
  }

  // 校验事务名称
  checkTransaction = (rule, value, callback) => {
    const { AppState, intl } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    const { applicationCode, messageInfo } = this.state;
    const application = messageInfo.applicationCode;
    if (value === messageInfo.transactionName) {
      callback();
    } else {
      messageTemplateStore.checkoTransaction(organizationId, applicationCode || application, value).then((data) => {
        if (data === 'data.is.existed') {
          callback(messageTemplateStore.languages[`${intlPrefix}.transaction.exist.msg`]);
        } else {
          callback();
        }
      });
    }
  }

  render() {
    const { intl, id } = this.props;
    const { AppState: { menuType: { organizationId, name } }, form } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { edit, badgeEmailStatus, badgeStationStatus, badgeWeChatStatus,badgeWechatWorkStatus, messageInfo, messageType, allDate, disableType } = this.state;
    const applicationCodeList = messageTemplateStore.getApplicationCodeList;
    const lanOption = [];
    const allTransaction = [];
    applicationCodeList.forEach((item) => {
      // if(item.lookupMeaning ==='服务管理' ){
        lanOption.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
      // }
    });

    const transactionNameList = messageTemplateStore.getTransactionNameList;

    transactionNameList.forEach((item) => {
      if(this.state.applicationCode==='ITSM'){
        if(item.lookupValue==='ITSM_UPDATE'||item.lookupValue==='CREATE_TICKET'){
          allTransaction.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
        }
      }else {
        allTransaction.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
      }
    });
    const {
      text, LOVVisible, formItemCode, LOVCode, EmailAccount,
    } = this.state;
    if(messageType&&messageType.length>0){
      messageType.forEach((value) => {
        if (value&&value.sendTypeCode === 'EMAIL') {
          allDate.subject_1 = value.subject;
          allDate.content_1 = value.content.replace(/&nbsp;/ig, ' ').replace(/<br\/>/g, '\r\n');
        }

        if (value&&value.sendTypeCode === 'SITE') {
          allDate.subject_2 = value.subject;
          allDate.content_2 = value.content.replace(/&nbsp;/ig, ' ').replace(/<br\/>/g, '\r\n');
        }

        if (value&&value.sendTypeCode === 'WECHAT') {
          allDate.content_3 = value.content.replace(/&nbsp;/ig, ' ').replace(/<br\/>/g, '\r\n');
        }
        if (value&&value.sendTypeCode === 'WECHATWORK') {
          allDate.subject_4 = value.subject;
          allDate.content_4 = value.content.replace(/&nbsp;/ig, ' ').replace(/<br\/>/g, '\r\n');
        }
      });
    }


    // const requiredData =((messageInfo.applicationCode === 'ITSM') || (this.state.applicationCode === 'ITSM')) ? '' : true;
    const transactionNamefrom = (
      <div>
        <span><span style={{ color: 'red', textAlign: 'center' }}>*</span>{messageTemplateStore.languages[`${intlPrefix}.transactionName`]}</span>
        <FormItem>
          {getFieldDecorator('transactionName', {
            rules: [
              {
                // required: requiredData,
                required: true,
                message: messageTemplateStore.languages[`${intlPrefix}.applySystems.require.msg`],
              },
              {
                validator: ((messageInfo.applicationCode === 'ITSM') || (this.state.applicationCode === 'ITSM')) ? '' : this.checkTransaction
              },
            ],
            initialValue: messageInfo.transactionName ? messageInfo.transactionName : '',

          })(
            <Select
              placeholder={messageTemplateStore.languages[`${intlPrefix}.transactionNames`]}
              style={{ width: 350 }}
              getPopupContainer={triggerNode => triggerNode.parentNode}
              onChange={this.transactionNameChange}
              disabled={disableType ? '' : 'true'}
            >
              {allTransaction}
            </Select>,
          )}
        </FormItem>
      </div>
    );

    return (
      <Page className="message-template">
        <Header
          title={edit ? disableType ? messageTemplateStore.languages[`${intlPrefix}.modifyMessageTemplate`] : messageTemplateStore.languages[`${intlPrefix}.viewMessageTemplate`] : messageTemplateStore.languages[`${intlPrefix}.createMessageTemplate`]}
          backPath={`/iam/messageTemplate?type=organization&id=${organizationId}&name=${name}&organizationId=${organizationId}`}
        >
          <Button
            onClick={this.handleSubmit}
            style={{ display: disableType ? '' : 'none', color: '#04173F' }}
          >
            <Icon type="baocun" style={{ color: '#2196F3', width: 25 }} />
            {messageTemplateStore.languages[`${intlPrefix}.save`]}
          </Button>
        </Header>
        <Content
          className="sidebar-content"
        >
          <div style={{ width: '400px', height: '800px', display: 'inline-block', marginRight: '2%' }}>
            <Form layout="vertical">
              <span><span style={{ color: 'red', textAlign: 'center' }}>*</span>{messageTemplateStore.languages[`${intlPrefix}.templateName`]}</span>
              <FormItem className='messageDesCallBack'>
                {getFieldDecorator('templateName', {
                  rules: [
                    {
                      required: true,
                      message: messageTemplateStore.languages[`${intlPrefix}.templateName.require.msg`],
                    }],
                  initialValue: '' || messageInfo.templateName,
                })(
                  <MultiLanguageFormItem
                    placeholder={messageTemplateStore.languages[`${intlPrefix}.messageTemplates`]}
                    requestUrl="true"
                    requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.template_name : {}}
                    handleMultiLanguageValue={({ retObj, retList }) => {
                      // 将多语言的值设置到当前表单
                      this.props.form.setFieldsValue({
                        templateName: retObj[this.props.AppState.currentLanguage],
                      });
                      this.setState({
                        multiLanguageValue: {
                          ...this.state.multiLanguageValue,
                          template_name: retObj,
                        },
                        multiLanguageList: retList,
                      });
                    }}
                    maxLength={20}
                    type="FormItem"
                    FormLanguage={this.state.multiLanguageValue}
                    languageEnv={this.state.languageEnv}
                    descriptionObject={messageTemplateStore.languages.multiLanguage}
                    required="true"
                    inputWidth={350}
                    disabled={((messageInfo.applicationCode === 'ITSM') || (!messageInfo.applicationCode)) ?  '':'true' }
                  />
                )}
              </FormItem>

              <span>{messageTemplateStore.languages[`${intlPrefix}.templateDesciption`]}</span>
              <FormItem>
                {getFieldDecorator('description', {
                  initialValue: '' || messageInfo.description,

                })(
                  <MultiLanguageFormItem
                    placeholder={messageTemplateStore.languages[`${intlPrefix}.messageDescriptions`]}
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
                    maxLength={20}
                    type="FormItem"
                    FormLanguage={this.state.multiLanguageValue}
                    languageEnv={this.state.languageEnv}
                    descriptionObject={messageTemplateStore.languages.multiLanguage}
                    required="true"
                    disabled={disableType ? '' : 'true'}
                    inputWidth={350}
                  />
                )}
              </FormItem>

              <span><span style={{ color: 'red', textAlign: 'center' }}>*</span>{messageTemplateStore.languages[`${intlPrefix}.applySystem`]}</span>
              <FormItem>
                {getFieldDecorator('applicationCode', {
                  rules: [
                    {
                      required: true,
                      message: messageTemplateStore.languages[`${intlPrefix}.applicationCode.require.msg`],
                    },
                  ],
                  initialValue: '' || messageInfo.applicationCode,
                })(
                  <Select
                    placeholder={messageTemplateStore.languages[`${intlPrefix}.applySystems`]}
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    style={{ width: 350 }}
                    disabled={messageInfo.applicationCode ? 'true' :'' }
                    onChange={this.applicationCodeChange}
                    allowClear
                  >
                    {lanOption}
                  </Select>,
                )}
              </FormItem>

              {/*{((messageInfo.applicationCode === 'ITSM') || (this.state.applicationCode === 'ITSM')) ? '' : transactionNamefrom}*/}
              {transactionNamefrom}


              <span><span style={{ color: 'red', textAlign: 'center' }}>*</span>{messageTemplateStore.languages[`${intlPrefix}.mail.server`]}</span>
              <FormItem>
                {getFieldDecorator('accountId', {
                  rules: [
                  ],
                  initialValue: edit ? `${messageInfo.accountId}` === 'null' ? '' : `${messageInfo.accountId}` : `${messageInfo.accountId}` === 'undefined' ? '' : `${messageInfo.accountId}`,

                })(
                  disableType ? (
                    <LOVInput
                      code="EmailAccount"
                      form={this.props.form}
                      formCode="accountId"
                      organizationId={this.props.AppState.currentMenuType.organizationId}
                      style={{ width: 350 }}
                      text={text || messageInfo.userName}
                      onLOV={() => {
                        this.setState({
                          LOVVisible: true,
                          formItemCode: 'accountId',
                          LOVCode: EmailAccount,
                        });
                      }}
                      onSelect={(text) => {
                        this.setState({
                          text,
                        });
                      }}
                    />
                  ) : (
                    <LOVInput
                      code="EmailAccount"
                      form={this.props.form}
                      formCode="accountId"
                      organizationId={this.props.AppState.currentMenuType.organizationId}
                      style={{ width: 350 }}
                      text={text || messageInfo.userName}
                    />
                  ),
                )}
              </FormItem>
              <span><span style={{ color: 'red', textAlign: 'center' }}>*</span>{messageTemplateStore.languages[`${intlPrefix}.notification`]}</span>
              <FormItem style={{ marginTop: '5px' }}>
                {getFieldDecorator('sendTypeCode', {
                  rules: [
                    {
                      required: true,
                      message: messageTemplateStore.languages[`${intlPrefix}.sendTypeCode.require.msg`],
                    },
                  ],
                  initialValue: this.state.checkMail === false && this.state.checkWechatWork === false&& this.state.checkStation === false && this.state.checkWeChat === false ? '' : this.state.checkMail && this.state.checkStation && this.state.checkWechatWork && this.state.checkWeChat,
                })(
                  <Row style={{width:'350px'}}>
                    <Col span={6}><Checkbox
                      onChange={this.setCheckMail}
                      checked={this.state.checkMail}
                      disabled={disableType ? '' : 'true'}
                    >{messageTemplateStore.languages[`${intlPrefix}.email`]}
                    </Checkbox>
                    </Col>
                    <Col span={6}><Checkbox
                      onChange={this.setCheckSation}
                      checked={this.state.checkStation}
                      disabled={disableType ? '' : 'true'}
                    >{messageTemplateStore.languages[`${intlPrefix}.stationLetter`]}
                    </Checkbox>
                    </Col>
                    <Col span={6}><Checkbox
                      onChange={this.setCheckWeChat}
                      checked={this.state.checkWeChat}
                    >{messageTemplateStore.languages[`${intlPrefix}.weChat`]}
                    </Checkbox>
                    </Col>
                    <Col span={6}><Checkbox
                      onChange={this.setCheckWeChatWork}
                      checked={this.state.checkWechatWork}
                    >
                      {messageTemplateStore.languages[`${intlPrefix}.weChatWork`]}
                      {/*企业微信*/}
                    </Checkbox>
                    </Col>
                  </Row>,
                )

                }
              </FormItem>
            </Form>
            <LOV
              code="EmailAccount"
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

            <div style={{ marginTop: -25, width: 350 }}>
              <Tabs className="message-template-content-tabs" defaultActiveKey="1">
                <TabPane
                  tab={(
                    <span style={{ fontSize: '20px' }}><Badge
                      status={badgeEmailStatus}
                      style={{
                        marginLeft: '5px',
                        fontSize: '20px',
                      }}
                    >{messageTemplateStore.languages[`${intlPrefix}.email`]}
                    </Badge>
                    </span>
                  )}
                  key="1"
                >
                  <Form layout="vertical">
                    <span>{messageTemplateStore.languages[`${intlPrefix}.emailTitles`]}</span>
                    <FormItem>
                      {getFieldDecorator('subject_1', {
                        rules: [
                        ],
                        initialValue: allDate.subject_1 || '',
                        validateFirst: true,
                      })(
                        <Input
                          autoComplete="off"
                          label={messageTemplateStore.languages[`${intlPrefix}.emailTitle`]}
                          style={{ width: 350 }}
                          onBlur={this.changeEamilBadge}
                          onChange={this.checkEmailTitle}
                          disabled={disableType ? '' : 'true'}
                        />,
                      )}
                    </FormItem>
                    <span>{messageTemplateStore.languages[`${intlPrefix}.emailContent`]}</span>
                    <FormItem>
                      {getFieldDecorator('content_1', {
                        rules: [],
                        initialValue: allDate.content_1 || '',
                      })(
                        <TextArea
                          label={messageTemplateStore.languages[`${intlPrefix}.emailComment`]}
                          style={{ width: 350, height: 500, backgroundColor: '#F5F5F5' }}
                          underline={false}
                          autosize={{ minRows: 7, maxRows: 7 }}
                          onBlur={this.changeEamilBadge}
                          onChange={this.checkEmailContent}
                          disabled={disableType ? '' : 'true'}
                          autoComplete="off"
                        />,
                      )}
                    </FormItem>
                  </Form>
                </TabPane>

                <TabPane
                  tab={(
                    <span style={{ fontSize: '15px' }}><Badge
                      status={badgeStationStatus}
                      style={{
                        marginLeft: '5px',
                        fontSize: '20px',
                      }}
                    > {messageTemplateStore.languages[`${intlPrefix}.stationLetter`]}
                    </Badge>
                    </span>
                  )}
                  key="2"
                >
                  <Form layout="vertical">
                    <span>{messageTemplateStore.languages[`${intlPrefix}.stationTitle`]}</span>
                    <FormItem>
                      {getFieldDecorator('subject_2', {

                        initialValue: allDate.subject_2 || '',
                        validateFirst: true,

                      })(
                        <Input
                          autoComplete="off"
                          label={messageTemplateStore.languages[`${intlPrefix}.stationLetterTitle`]}
                          style={{ width: 350 }}
                          onBlur={this.changeStationBadge}
                          onChange={this.checkStationTitle}
                          disabled={disableType ? '' : 'true'}
                        />,
                      )}
                    </FormItem>
                    <span>{messageTemplateStore.languages[`${intlPrefix}.stationContent`]}</span>
                    <FormItem>
                      {getFieldDecorator('content_2', {
                        initialValue: allDate.content_2 || '',
                      })(
                        <TextArea
                          label={messageTemplateStore.languages[`${intlPrefix}.stationLetterContent`]}
                          style={{ width: 350, height: 300, backgroundColor: '#F5F5F5' }}
                          underline={false}
                          autosize={{ minRows: 7, maxRows: 7 }}
                          onBlur={this.changeStationBadge}
                          onChange={this.checkStationContent}
                          disabled={disableType ? '' : 'true'}
                          autoComplete="off"
                        />,
                      )}
                    </FormItem>
                  </Form>
                </TabPane>

                <TabPane
                  tab={(
                    <span style={{ fontSize: '15px' }}><Badge
                      status={badgeWeChatStatus}
                      style={{
                        marginLeft: '5px',
                        fontSize: '20px',
                      }}
                    > {messageTemplateStore.languages[`${intlPrefix}.weChat`]}
                    </Badge>
                    </span>
                  )}
                  key="3"
                >
                  <Form layout="vertical">
                    <span>{messageTemplateStore.languages[`${intlPrefix}.wechatContentTitle`]}</span>
                    <FormItem>
                      {getFieldDecorator('content_3', {
                        initialValue: allDate.content_3 || '',
                      })(
                        <TextArea
                          label={messageTemplateStore.languages[`${intlPrefix}.weChatContent`]}
                          style={{ width: 350, height: 300, backgroundColor: '#F5F5F5' }}
                          underline={false}
                          autosize={{ minRows: 7, maxRows: 7 }}
                          onBlur={this.changeWeChatBadge}
                          onChange={this.checkWeChats}
                          autoComplete="off"
                        />,
                      )}
                    </FormItem>
                  </Form>
                </TabPane>
                <TabPane
                  tab={(
                    <span style={{ fontSize: '15px' }}>
                      <Badge
                        status={badgeWechatWorkStatus}
                        style={{
                          marginLeft: '5px',
                          fontSize: '20px',
                        }}
                      >
                        {messageTemplateStore.languages[`${intlPrefix}.weChatWork`]}
                        {/*企业微信*/}
                      </Badge>
                    </span>
                  )}
                  key="4"
                >
                  <Form layout="vertical">
                    <span>
                      {messageTemplateStore.languages[`${intlPrefix}.weChatWork`]}
                    </span>
                    <FormItem>
                      {getFieldDecorator('subject_4', {
                        rules: [
                        ],
                        initialValue: allDate.subject_4 || '',
                        validateFirst: true,
                      })(
                        <Input
                          autoComplete="off"
                          label={messageTemplateStore.languages[`${intlPrefix}.inputWeChatWorkTitle`]}
                          style={{ width: 350 }}
                          onBlur={this.changeWechatWorkBadge}
                          onChange={this.checkWechatWorkTitle}
                          disabled={disableType ? '' : 'true'}
                        />,
                      )}
                    </FormItem>
                    <span>
                      {messageTemplateStore.languages[`${intlPrefix}.weChatWorkContent`]}
                    </span>
                    <FormItem>
                      {getFieldDecorator('content_4', {
                        rules: [],
                        initialValue: allDate.content_4 || '',
                      })(
                        <TextArea
                          label={messageTemplateStore.languages[`${intlPrefix}.inputWeChatWorkContent`]}
                          style={{ width: 350, height: 500, backgroundColor: '#F5F5F5' }}
                          underline={false}
                          autosize={{ minRows: 7, maxRows: 7 }}
                          onBlur={this.changeWechatWorkBadge}
                          onChange={this.checkWechatWorkContent}
                          disabled={disableType ? '' : 'true'}
                          autoComplete="off"
                        />,
                      )}
                    </FormItem>
                  </Form>
                </TabPane>
              </Tabs>
            </div>


          </div>

          <div style={{ width: '560px', height: '810px', position: 'absolute', display: 'inline-block', float: 'right' }}>
            <span style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '5px' }}><Icon
              type="format_list_bulleted"
              style={{
                color: '#2196F3',
                marginRight: '10px',
              }}
            />{messageTemplateStore.languages[`${intlPrefix}.paramList`]}
            </span>
            <div style={{ marginTop: '15px' }}>{this.renderTable()}</div>

          </div>

        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(BackLogEdit)));
