import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Input, Form, Table, Icon, Modal, Tooltip, Checkbox } from 'yqcloud-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withRouter } from 'react-router-dom';
import { Action, axios, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import BindingStore from '../../../stores/user/accountBinding/BindingStore';

const intlPrefix = 'user.accountBinding';
const { Sidebar } = Modal;
const FormItem = Form.Item;

function noop() {
}

@inject('AppState')
@observer

class AccountBinding extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      isLoading: true,
      visible: false,
      emailId: '',
      filters: {},
      params: [],
      dataSource: [],
      perfilters: {},
      perparams: [],
      addEmailVisible: false,
      phoneVisible: true,
      emailObj: [],
      phoneNum: '',
      emailValue: '',
      emailBtn: false,
      count: 10,
      liked: true,
      flag: true,
      stop: true,
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },

      stopPhone: true,
      likedPhone: true,
      flagPhine: true,
      phoneBtn: false,
      countPhone: 10,
      dataSourse_p: [],
      inputPhoneNum: '',
      inputYzm: '',
      addPhoneVisible: false,

    };
  }


  componentWillMount() {
    this.loadBinding();
    this.loadSelf();
    this.handleAddEmail();
    this.handleAddPhone();
  }

  // 刷新页面
  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadBinding();
      this.loadSelf();
    });
  };

  // 强制刷新
  handleBigRefush=() => {
    this.setState(this.getInitState(), () => {
      document.location.reload();
      this.loadBinding();
      this.loadSelf();
    });
  }

  // 展示弹出框
  addEmailShowModal = () => {
    this.setState({
      addEmailVisible: true,
    });
  }

  // 弹出框的XXX
  onCancelInvitationHome = () => {
    this.state.stop = true;
    this.setState({
      value: '',
      addEmailVisible: false,
    });
  };

  handleAdd_Email = () => {
    this.setState({
      text: '',
    });
    this.props.form.resetFields();
  }

  // 弹出框的取消按钮
  addEmailCancel = (e) => {
    this.handleAdd_Email();
    this.state.stop = true;
    this.setState({
      value: '',
      addEmailVisible: false,
    });
  }

  //  加载页面方法
  loadBinding = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const params = paramsIn || paramsState;
    if (AppState.userInfo.organizationId === 0 || AppState.userInfo.organizationId === null) {
      BindingStore.loadBindings(pagination, sort, params).then((data) => {
        this.setState({
          dataSource: data.content,
          pagination: {
            current: (data.number || 0) + 1,
            pageSize: data.size || 10,
            total: data.totalElements,
            pageSizeOptions: ['25', '50', '100', '200'],
          },
          params,
          sort,
        });
      });
    } else {
      BindingStore.loadBindingsOrg(AppState.userInfo.organizationId, pagination, sort, params).then((data) => {
        this.setState({
          dataSource: data.content,
          pagination: {
            current: (data.number || 0) + 1,
            pageSize: data.size || 10,
            total: data.totalElements,
            pageSizeOptions: ['25', '50', '100', '200'],
          },
          params,
          sort,
        });
      });
    }
  }

  //  删除方法
  bindingDelete = (record) => {
    const { AppState, intl } = this.props;
    if (record.isMain === 1) {
      Choerodon.prompt(intl.formatMessage({ id: 'deleteMain.filed' }));
    } else if (AppState.userInfo.organizationId === 0 || AppState.userInfo.organizationId === null) {
      BindingStore.bindingDeletes(record.id).then(({ failed, message }) => {
        if (failed) {
          Choerodon.prompt(message);
        } else {
          Choerodon.prompt(intl.formatMessage({ id: 'delete.success' }));

          this.handleRefresh();
        }
      }).catch((error) => {
        Choerodon.prompt(intl.formatMessage({ id: 'delete.error' }));
      });
    } else {
      BindingStore.bindingDeletesOrg(AppState.userInfo.organizationId, record.id).then(({ failed, message }) => {
        if (failed) {
          Choerodon.prompt(message);
        } else {
          Choerodon.prompt(intl.formatMessage({ id: 'delete.success' }));

          this.handleRefresh();
        }
      }).catch((error) => {
        Choerodon.prompt(intl.formatMessage({ id: 'delete.error' }));
      });
    }
  }


  // 标记主体邮箱
  bindingMainEmail = (record) => {
    const { intl, AppState } = this.props;
    if (AppState.userInfo.organizationId === 0 || AppState.userInfo.organizationId === null) {
      BindingStore.bindingMainEmails(record.id).then(({ failed, message }) => {
        if (failed) {
          Choerodon.prompt(message);
        } else {
          this.handleRefresh();
          Choerodon.prompt(intl.formatMessage({ id: 'modify.success' }));
        }
      }).catch((error) => {
        Choerodon.prompt(intl.formatMessage({ id: 'modify.error' }));
      });
    } else {
      BindingStore.bindingMainEmailsOrg(AppState.userInfo.organizationId, record.id).then(({ failed, message }) => {
        if (failed) {
          Choerodon.prompt(message);
        } else {
          this.handleRefresh();
          Choerodon.prompt(intl.formatMessage({ id: 'modify.success' }));
        }
      }).catch((error) => {
        Choerodon.prompt(intl.formatMessage({ id: 'modify.error' }));
      });
    }
  }

  //  校验邮箱是否存在
  bindingCheckEmail = (rule, value, callback) => {
    const { intl, AppState } = this.props;
    const { emailValue } = this.state;
    if (value !== '') {
      if (AppState.userInfo.organizationId === 0 || AppState.userInfo.organizationId === null) {
        BindingStore.bindingCheckEmails(value).then((data) => {
          if (data === 1) {
            callback(intl.formatMessage({ id: `${intlPrefix}.checkEmailFiled` }));
          } else {
            this.setState({
              emailValue: value,
            });
            callback();
          }
        });
      } else {
        BindingStore.bindingCheckEmailsOrg(AppState.userInfo.organizationId, value).then((data) => {
          if (data === 1) {
            callback(intl.formatMessage({ id: `${intlPrefix}.checkEmailFiled` }));
          } else {
            this.setState({
              emailValue: value,
            });
            callback();
          }
        });
      }
    } else {
      callback(intl.formatMessage({ id: `${intlPrefix}.taskComment` }));
    }
  };

  //  验证码按钮点击之后样式改变
  buttonClick = () => {
    clearInterval(this.timer);
    this.state.stop = false;
    this.state.flag = !this.state.flag;
    if (this.state.flag) {
      this.setState({
        liked: true,
        count: this.state.count,
      });
    } else if (this.state.liked) {
      this.timer = setInterval(() => {
        let { count } = this.state;
        this.state.liked = false;
        count -= 1;
        if (count < 1) {
          this.setState({
            liked: true,
            emailBtn: false,
            stop: true,
          });
          count = 10;
          clearInterval(this.timer);
        }
        this.setState({
          count,
        });
      }, 1000);
    }
  };

  //  获取邮箱验证码
  bindingSendYzm = () => {
    const { emailValue, emailBtn } = this.state;
    const { intl, AppState } = this.props;

    if (emailValue !== '') {
      if (AppState.userInfo.organizationId === 0 || AppState.userInfo.organizationId === null) {
        BindingStore.bindingSendYzms(emailValue).then((data) => {
          if (data === 0) {
            Choerodon.prompt(intl.formatMessage({ id: 'yzm.filed' }));
          } else if (data === 1) {
            this.setState({
              emailBtn: true,
            });
            this.buttonClick();
          }
        });
      } else {
        BindingStore.bindingSendYzmsOrg(AppState.userInfo.organizationId, emailValue).then((data) => {
          if (data === 0) {
            Choerodon.prompt(intl.formatMessage({ id: 'yzm.filed' }));
          } else if (data === 1) {
            this.setState({
              emailBtn: true,
            });
            this.buttonClick();
          }
        });
      }
    } else {
      Choerodon.prompt(intl.formatMessage({ id: `${intlPrefix}.taskComment` }));
    }
  };

  // 确认绑定邮箱按钮
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
      const menuType = AppState.currentMenuType;
      const tenantId = menuType.id;
      if (AppState.userInfo.organizationId === 0 || AppState.userInfo.organizationId === null) {
        onSubmit();
        BindingStore.bindingSubmits(data.emailName, data.verificationCode).then((data) => {
          if (data === 0) {
            Choerodon.prompt(intl.formatMessage({ id: 'yzmError' }));
          } else {
            Choerodon.prompt(intl.formatMessage({ id: 'create.success' }));
            onSuccess();
            this.handleRefresh();
          }
        }).catch((error) => {
          onError();
          Choerodon.handleResponseError(error);
        });
      } else {
        onSubmit();
        BindingStore.bindingSubmitsOrg(AppState.userInfo.organizationId, data.emailName, data.verificationCode).then((data) => {
          if (data === 0) {
            Choerodon.prompt(intl.formatMessage({ id: 'yzmError' }));
          } else {
            Choerodon.prompt(intl.formatMessage({ id: 'create.success' }));
            onSuccess();
            this.handleRefresh();
          }
        }).catch((error) => {
          onError();
          Choerodon.handleResponseError(error);
        });
      }
    });
  }

  // 渲染添加绑定邮箱弹出框
  handleAddEmail = () => {
    const { AppState, edit, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { addEmailVisible, email, emailBtn } = this.state;
    const { organizationId } = AppState.currentMenuType;
    return (
      <Modal
        title={intl.formatMessage({ id: `${intlPrefix}.invitationApprove` })}
        visible={addEmailVisible}
        onOk={this.handleSubmit}
        onCancel={this.addEmailCancel}
        center
      >
        <Form onSubmit={this.handleSubmit.bind(this)}>
          <FormItem style={{ display: 'inline-block', marginTop: 30 }}>
            {getFieldDecorator('emailName', {
              validateTrigger: 'onBlur',
              rules: [
                {
                  required: true,
                  message: intl.formatMessage({ id: `${intlPrefix}.taskComment` }),

                },
                {
                  pattern: /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/,
                  message: intl.formatMessage({ id: `${intlPrefix}.correct.messageCode` }),
                },
                {
                  validator: this.bindingCheckEmail,
                },

              ],
              initialValue: '',
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                placeholder="请输入需绑定的邮箱"
                style={{ width: 300 }}
              />,
            )}
          </FormItem>
          <FormItem style={{ display: 'inline-block', marginTop: 30 }}>
            {getFieldDecorator('verificationCode', {

              rules: [
                {
                  required: true,
                  message: intl.formatMessage({ id: `${intlPrefix}.taskComment_YZM` }),
                },
              ],
              initialValue: '',
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                placeholder="请输入验证码"
                style={{ width: 150 }}
                maxLength={6}
              />,
            )}

            <Button
              onClick={this.bindingSendYzm}
              funcType="raised"
              disabled={emailBtn}
              style={{ marginLeft: 15 }}
            >{this.state.stop ? '发送验证码' : `验证码已发送${this.state.count}秒`}
            </Button>

          </FormItem>
        </Form>


      </Modal>
    );
  };


  // 展示弹出框
  addPhoneShowModal = () => {
    this.setState({
      addPhoneVisible: true,
    });
  }

  // 弹出框的XXX
  handleAddPohone = () => {
    this.setState({
      text: '',
    });
    this.props.form.resetFields();
  }

  // 取消
  addPhoneCancel = (e) => {
    this.handleAddPohone();
    this.state.stopPhone = true;
    this.setState({
      value: '',
      addPhoneVisible: false,
    });
  }

  // 渲染解绑弹出框
  handleAddPhone= () => {
    const { AppState, edit, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { addPhoneVisible, phoneNum, phoneBtn } = this.state;
    const { organizationId } = AppState.currentMenuType;
    return (
      <Modal
        title={intl.formatMessage({ id: `${intlPrefix}.unbind.content` })}
        visible={addPhoneVisible}
        onOk={this.phoneUnbind}
        onCancel={this.addPhoneCancel}
        center
      >
        <Form onSubmit={this.phoneUnbind.bind(this)}>
          <div style={{ display: 'inline-block', marginLeft: 15, fontSize: 17, fontWeight: 'bold' }}>
            {phoneNum}
          </div>
          <div style={{ marginBottom: -10 }}>
            <Form>
              <FormItem style={{ display: 'inline-block', marginTop: 0, marginLeft: 20 }}>
                {getFieldDecorator('YZM', {
                  validateTrigger: 'onBlur',
                  rules: [
                    {
                      required: true,
                      message: intl.formatMessage({ id: `${intlPrefix}.taskComment_YZM` }),
                    },
                  ],
                  initialValue: '',
                  validateFirst: true,
                })(
                  <Input
                    value={this.state.inputYzm}
                    onChange={this.handleGetInputValueYzm}
                    autoComplete="off"
                    placeholder="请输入验证码"
                    style={{ width: 150 }}
                    maxLength={6}
                  />,
                )}
                <Button
                  onClick={this.bindingSendPhoneYzm}
                  funcType="raised"
                  disabled={phoneBtn}
                  style={{ marginLeft: 10 }}
                >{this.state.stopPhone ? '发送验证码' : `验证码已发送${this.state.countPhone}秒`}
                </Button>

              </FormItem>

            </Form>
          </div>
        </Form>


      </Modal>
    );
  };

  // 从账户信息中获取手机号
  loadSelf = () => {
    const { id, intl, AppState } = this.props;
    AppState.loadUserInfo().then((data) => {
      this.setState({
        dataSourse_p: data,
        phoneNum: data.phone || '',
        inputYzm: '',
      });
    });
  };

  //  校验手机号是否存在
  bindingCheckPhone = (rule, value, callback) => {
    const { intl, AppState } = this.props;
    if (value !== '') {
      if (AppState.userInfo.organizationId === 0 || AppState.userInfo.organizationId === null) {
        BindingStore.bindingCheckPhones(value).then((data) => {
          if (data === 1) {
            callback(intl.formatMessage({ id: `${intlPrefix}.checkPhoneFiled` }));
          } else {
            this.setState({
              phoneNum: value,
            });
            callback();
          }
        });
      } else {
        BindingStore.bindingCheckPhonesOrg(AppState.userInfo.organizationId, value).then((data) => {
          if (data === 1) {
            callback(intl.formatMessage({ id: `${intlPrefix}.checkPhoneFiled` }));
          } else {
            this.setState({
              phoneNum: value,
            });
            callback();
          }
        });
      }
    } else {
      callback(intl.formatMessage({ id: `${intlPrefix}.phoneNumber` }));
    }
  };

  //  获取手机验证码
  bindingSendPhoneYzm = () => {
    const { phoneNum, phoneBtn } = this.state;
    const { intl, AppState } = this.props;
    if (phoneNum !== '') {
      if (AppState.userInfo.organizationId === 0 || AppState.userInfo.organizationId === null) {
        BindingStore.bindingSendPhoneYzms(phoneNum).then((data) => {
          if (data === 0) {
            Choerodon.prompt(intl.formatMessage({ id: 'yzm.filed' }));
          } else if (data === 1) {
            this.setState({
              phoneBtn: true,
            });
            this.buttonPhoneClick();
          }
        });
      } else {
        BindingStore.bindingSendPhoneYzmsOrg(AppState.userInfo.organizationId, phoneNum).then((data) => {
          if (data === 0) {
            Choerodon.prompt(intl.formatMessage({ id: 'yzm.filed' }));
          } else if (data === 1) {
            this.setState({
              phoneBtn: true,
            });
            this.buttonPhoneClick();
          }
        });
      }
    } else {
      Choerodon.prompt(intl.formatMessage({ id: `${intlPrefix}.taskPhoneComment` }));
    }
  };

  //  验证码按钮点击之后样式改变
  buttonPhoneClick = () => {
    clearInterval(this.timerPhone);
    this.state.stopPhone = false;
    this.state.flagPhine = !this.state.flagPhine;
    if (this.state.flagPhine) {
      this.setState({
        likedPhone: true,
        countPhone: this.state.countPhone,
      });
    } else if (this.state.likedPhone) {
      this.timerPhone = setInterval(() => {
        let { countPhone } = this.state;
        this.state.likedPhone = false;
        countPhone -= 1;
        if (countPhone < 1) {
          this.setState({
            likedPhone: true,
            phoneBtn: false,
            stopPhone: true,
          });
          countPhone = 10;
          clearInterval(this.timerPhone);
        }
        this.setState({
          countPhone,
        });
      }, 1000);
    }
  };

  // 确认绑定号码按钮
  handlePhoneSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((data, modify) => {
      const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
      const menuType = AppState.currentMenuType;
      const { inputPhoneNum, inputYzm } = this.state;
      const tenantId = menuType.id;
      if (AppState.userInfo.organizationId === 0 || AppState.userInfo.organizationId === null) {
        onSubmit();
        BindingStore.bindingPhoneSubmits(inputPhoneNum, inputYzm).then((data) => {
          if (data === 0) {
            Choerodon.prompt(intl.formatMessage({ id: 'yzmError' }));
          } else {
            Choerodon.prompt(intl.formatMessage({ id: 'create.success' }));
            onSuccess();
            this.handleBigRefush();
          }
        }).catch((error) => {
          onError();
          Choerodon.handleResponseError(error);
        });
      } else {
        onSubmit();
        BindingStore.bindingPhoneSubmitsOrg(AppState.userInfo.organizationId, inputPhoneNum, inputYzm).then((data) => {
          if (data === 0) {
            Choerodon.prompt(intl.formatMessage({ id: 'yzmError' }));
          } else {
            Choerodon.prompt(intl.formatMessage({ id: 'create.success' }));
            onSuccess();
            this.handleBigRefush();
          }
        }).catch((error) => {
          onError();
          Choerodon.handleResponseError(error);
        });
      }
    });
  }

  handleGetInputValue = (e) => {
    this.setState({
      inputPhoneNum: e.target.value,
    });
  }

  handleGetInputValueYzm = (e) => {
    this.setState({
      inputYzm: e.target.value,
    });
  }

  // 手机号码解除绑定
  phoneUnbind = () => {
    const { phoneNum } = this.state;
    const { intl, AppState } = this.props;
    if (AppState.userInfo.organizationId === 0 || AppState.userInfo.organizationId === null) {
      BindingStore.phoneUnbinds(phoneNum, this.state.inputYzm).then((data) => {
        if (data === 1) {
          this.handleRefresh();
          this.setState({
            inputYzm: '',
            phoneNum: '',
          });
          Choerodon.prompt(intl.formatMessage({ id: 'unbind.success' }));
        } else {
          Choerodon.prompt(intl.formatMessage({ id: 'unbind.filed' }));
        }
      });
    } else {
      BindingStore.phoneUnbindsOrg(AppState.userInfo.organizationId, phoneNum, this.state.inputYzm).then((data) => {
        if (data === 1) {
          this.handleRefresh();
          this.setState({
            inputYzm: '',
            phoneNum: '',
          });
          Choerodon.prompt(intl.formatMessage({ id: 'unbind.success' }));
        } else {
          Choerodon.prompt(intl.formatMessage({ id: 'unbind.filed' }));
        }
      });
    }
  }

  // 渲染主体
  render() {
    const { visible, pagination, dataSource, dataSourse_p, params, phoneNum, phoneBtn, phoneVisible } = this.state;
    const { AppState, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const columns = [
      {
        title: <FormattedMessage id={`${intlPrefix}.email`} />,
        dataIndex: 'emailName',
        key: 'emailName',
        render: (text, record) => (
          <span>{text}</span>
        ),
      },
      {
        title: <FormattedMessage id={`${intlPrefix}.selected_email`} />,
        dataIndex: 'isMain',
        key: 'isMain',
        render: (text, record) => {
          if (record) {
            let tempCheck = true;
            if (record.isMain === 0) {
              tempCheck = false;
            }
            return (
              <Checkbox
                checked={tempCheck}
                onClick={this.bindingMainEmail.bind(this, record)}
              />
            );
          }
        },
      },
      {
        dataIndex: 'type',
        key: 'type',
        render: (text, record) => (
          <a style={{ color: 'red' }} onClick={this.bindingDelete.bind(this, record)}>删除</a>
        ),
      },
    ];

    return (
      <Page>
        <Header title={<FormattedMessage id={`${intlPrefix}.header.title`} />}>
          <Button
            onClick={this.handleRefresh}
            icon="refresh"
          >
            <FormattedMessage id="refresh" />
          </Button>
        </Header>
        <Content
          code={intlPrefix}
          values={{ name: AppState.getUserInfo.realName }}
        >
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>邮箱</span>
            <span style={{ marginLeft: 20, fontSize: 13, color: '#bfbfbf' }}>和账号绑定的邮箱及手机都可用于登录，主邮箱账号可接受系统消息。</span>
          </div>
          <div style={{ width: 1060, border: '1px solid #bfbfbf', paddingBottom: 20 }}>
            <Table
              style={{ width: 1030, paddingTop: 10, paddingLeft: 15, paddingRight: 15 }}
              dataSource={dataSource}
              pagination={pagination}
              filterBar={false}
              columns={columns}
              filters={params}
              loading={BindingStore.isLoading}
            />
            <Button
              style={{ marginLeft: 15 }}
              onClick={this.addEmailShowModal}
            >
              <Icon type="add_circle" style={{ color: '#08c' }} />
              <FormattedMessage id="add_email" />
            </Button>
          </div>

          <div style={{ marginTop: 15, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>手机号</span>
            <span style={{ marginLeft: 20, fontSize: 13, color: '#bfbfbf' }}>绑定后可用手机号快速登录，接受安全验证信息。</span>
          </div>
          {dataSourse_p.phone === null || dataSourse_p.phone === '' ? (
            <div style={{ width: 1060, border: '1px solid #bfbfbf', paddingBottom: 20 }}>

              <Form onSubmit={this.handlePhoneSubmit.bind(this)}>
                <div>
                  <FormItem style={{ display: 'inline-block', marginTop: 15, marginLeft: 20 }}>
                    {getFieldDecorator('phone', {
                      validateTrigger: 'onBlur',
                      rules: [
                        {
                          required: true,
                          message: intl.formatMessage({ id: `${intlPrefix}.phoneNumber` }),
                        },
                        {
                          pattern: /^1(3|4|5|7|8)\d{9}$/,
                          message: intl.formatMessage({ id: `${intlPrefix}.correct.phoneNumber` }),
                        },
                        {
                          validator: this.bindingCheckPhone,
                        },
                      ],
                      initialValue: '',
                      validateFirst: true,
                    })(
                      <Input
                        value={this.state.inputPhoneNum}
                        onChange={this.handleGetInputValue}
                        autoComplete="off"
                        placeholder="请输入需绑定的手机号"
                        style={{ width: 300 }}
                      />,
                    )}

                  </FormItem>
                </div>
                <div>
                  <FormItem style={{ display: 'inline-block', marginTop: 0, marginLeft: 20 }}>
                    {getFieldDecorator('YZM', {
                      validateTrigger: 'onBlur',
                      rules: [
                        {
                          required: true,
                          message: intl.formatMessage({ id: `${intlPrefix}.taskComment_YZM` }),
                        },
                      ],
                      initialValue: '',
                      validateFirst: true,
                    })(
                      <Input
                        value={this.state.inputYzm}
                        onChange={this.handleGetInputValueYzm}
                        autoComplete="off"
                        placeholder="请输入验证码"
                        style={{ width: 150 }}
                        maxLength={6}
                      />,
                    )}
                    <Button
                      onClick={this.bindingSendPhoneYzm}
                      funcType="raised"
                      disabled={phoneBtn}
                      style={{ marginLeft: 10 }}
                    >{this.state.stopPhone ? '发送验证码' : `验证码已发送${this.state.countPhone}秒`}
                    </Button>

                  </FormItem>
                </div>
              </Form>
              <Button
                style={{ marginLeft: 5 }}
                funcType="raised"
                type="primary"
                onClick={this.handlePhoneSubmit}
              >确认绑定
              </Button>
            </div>
          ) : (
            <div style={{ width: 1060, border: '1px solid #bfbfbf', paddingBottom: 10, paddingTop: 15 }}>
              <span style={{ marginLeft: 20, fontSize: 17 }}>已绑定：</span>
              <div style={{ display: 'inline-block', marginLeft: 15, fontSize: 17, fontWeight: 'bold' }}>
                {phoneNum}
              </div>
              <div style={{ display: 'inline-block', marginTop: 5 }}>
                <Button
                  onClick={this.addPhoneShowModal}
                  style={{ marginLeft: 20, color: 'red' }}
                  funcType="raised"
                >
                  <FormattedMessage id="cancel_binding" />
                </Button>
              </div>

            </div>
          )
          }


          {this.onCancelInvitationHome}
          {this.handleAddEmail()}
          {this.handleAddPhone()}

        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(AccountBinding)));
