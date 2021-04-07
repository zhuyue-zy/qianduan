import React, { Component } from 'react';
import { Form, Input, Select, Icon, Checkbox } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, axios } from 'yqcloud-front-boot';
import CreateUserStore from '../../../../stores/organization/user/createUser/CreateUserStore';

const FormItem = Form.Item;
const { Option } = Select;
const intlPrefix = 'organization.user';

const inputWidth = 512; // input框的长度
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 100 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 10 },
  },
};
const defaultPassword = 'abcd1234';

function noop() {
}

@inject('AppState')
@observer
class EditUser extends Component {
  state = this.getInitState();

  componentWillMount() {
    this.props.onRef(this);
    this.fetch(this.props);
    this.loadLanguage();
    this.getLoginType();
  }

  // 租户登录方式快码
  getLoginType =() =>{
    const {AppState}=this.props;
    const code = 'FND_LOGIN_TYPE';
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          LoginType: data
        })
      })
  };

  handleRefush=() => {
    this.setState(this.getInitState(), () => {
      this.loadLanguage();
      this.fetch(this.props);
    });
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
      rePasswordDirty: false,
      userInfo: {
        id: '',
        loginName: '',
        realName: '',
        email: '',
        language: 'zh_CN',
        timeZone: 'CTT',
        objectVersionNumber: '',
      },
      type: 'readonly',
      types: 'readonly',
      oldEmployeeId: 0,
      clickEyes: false,
      clickEyePasswords: false,
      passwordFastCode:[],
      passwordFastCodeArrs:[],
      passwordPolicy:{},
      LoginType:[],
    };
  }

  loadLanguage=() => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CreateUserStore.queryLanguage(id, AppState.currentLanguage);
  }

  getUserInfoById(organizationId, id) {
    CreateUserStore.getUserInfoById(organizationId, id)
      .then((data) => {
        CreateUserStore.loadStaffData(organizationId, data.employeeId)
          .then(() => {
            this.setState({
              userInfo: data,
              oldEmployeeId: data.employee.employeeId,
            });
          })
          .catch((error) => {
            Choerodon.handleResponseError(error);
          });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  loadPasswordPolicyById(id) {
    CreateUserStore.loadPasswordPolicyById(id)
      .then(() => {
        this.securitySettingQuery()
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  fetch(props) {
    const { AppState, edit, id, employeeId } = props;
    const { id: organizationId } = AppState.currentMenuType;
    CreateUserStore.loadLanguageList();
    if (edit) {
      this.getUserInfoById(organizationId, id);
      this.loadPasswordPolicyById(organizationId);
    } else {
      CreateUserStore.loadStaffData(organizationId)
        .catch((error) => {
          Choerodon.handleResponseError(error);
        });
      this.loadPasswordPolicyById(organizationId);
    }
  }

  checkUsernameAndPwd() {
    const { getFieldValue } = this.props.form;
    const { enablePassword, notUsername } = CreateUserStore.getPasswordPolicy || {};
    const password = getFieldValue('password');
    const loginName = getFieldValue('loginName');
    if (enablePassword && notUsername && password === loginName) {
      return true;
    }
    return false;
  }

  checkUsername = (rule, username, callback) => {
    const { edit, AppState, intl } = this.props;
    if (!edit || username !== this.state.userInfo.loginName) {
      if (username && this.checkUsernameAndPwd()) {
        callback(CreateUserStore.languages[`${intlPrefix}.name.samepwd.msg`]);
        return;
      }
      const { id } = AppState.currentMenuType;
      CreateUserStore.checkUsername(id, username).then(({ failed }) => {
        if (failed) {
          callback(CreateUserStore.languages[`${intlPrefix}.name.exist.msg`]);
        } else {
          callback();
        }
      });
    } else {
      callback();
    }
  };

  //  密码类型快码查询
  securitySettingQuery= () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    const code = "FND_PWD_POLICY";
    const passwordPolicy = CreateUserStore.getPasswordPolicy;
    if(passwordPolicy){
      const passwordContain = passwordPolicy.formatCode.split(',');
      const arrs = [];
      axios.get(`fnd/v1/${id}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
        data => {
          this.setState({
            passwordFastCode: data,
            passwordPolicy
          });
          passwordContain.forEach((item,i)=>{
            data.forEach((datas,j)=>{
              if(item === datas.lookupValue){
                arrs.push(datas.lookupMeaning)
              }
              if(i+1>=passwordContain.length && j+1>=data.length){
                this.setState({
                  passwordFastCodeArrs: arrs
                })
              }
            });
          });
        })
    }else {
      axios.get(`fnd/v1/${id}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
        data => {
          this.setState({
            passwordFastCode: data
          });
        })
    }

  };

  // validateToPassword = (rule, value, callback) => {
  //   const passwordPolicy = CreateUserStore.getPasswordPolicy;
  //   if(value && passwordPolicy && passwordPolicy.not)
  // }

  // 分别验证密码的最小长度，特殊字符和大写字母的情况和密码策略进行比对
  checkPassword = (rule, value, callback) => {
    const passwordPolicy = CreateUserStore.getPasswordPolicy;
    const { intl, form } = this.props;
    if (value && this.checkUsernameAndPwd()) {
      callback(CreateUserStore.languages[`${intlPrefix}.name.samepwd.msg`]);
      return;
    }else {
      if (value && passwordPolicy && passwordPolicy.originalPassword !== value) {
        // const userName = this.state.userInfo.loginName;
        const userName = form.getFieldValue('loginName');
        if(eval(`/${passwordPolicy.regularExpression}/`).test(value)){
          callback();
        }else {
          callback(CreateUserStore.languages[`${intlPrefix}.PasswordLength`]+passwordPolicy.minLength+CreateUserStore.languages[`${intlPrefix}.PasswordPosition`]+"，"+CreateUserStore.languages[`${intlPrefix}.IncorrectPassword`]+this.state.passwordFastCodeArrs.join('、'));
        }
        Choerodon.checkPassword(passwordPolicy, value, callback, userName);
      } else {
        callback();
      }
    }
  };

  validateToNextPassword = (rule, value, callback) => {
    const { form } = this.props;
    const { originalPassword } = CreateUserStore.getPasswordPolicy || {};
    if (value && (this.state.rePasswordDirty || originalPassword)) {
      form.validateFields(['rePassword'], { force: true });
    }
    callback();
  };

  handleRePasswordBlur = (e) => {
    const { value } = e.target;
    this.setState({ rePasswordDirty: this.state.rePasswordDirty || !!value });
  };

  checkRepassword = (rule, value, callback) => {
    const passwordPolicy = CreateUserStore.getPasswordPolicy;
    const { intl, form } = this.props;
    if (value && value !== form.getFieldValue('password')) {
      callback(CreateUserStore.languages[`${intlPrefix}.password.unrepeat.msg`]);
    } else {
      if(passwordPolicy){
        if(eval(`/${passwordPolicy.regularExpression}/`).test(value)){
          callback();
        }else {
          callback(CreateUserStore.languages[`${intlPrefix}.PasswordLength`]+passwordPolicy.minLength+CreateUserStore.languages[`${intlPrefix}.PasswordPosition`]+"，"+CreateUserStore.languages[`${intlPrefix}.IncorrectPassword`]+this.state.passwordFastCodeArrs.join('、'));
        }
      }else {
        callback();
      }
    }
  };

  checkEmailAddress = (rule, value, callback) => {
    const { edit, AppState, intl } = this.props;
    if (!edit || value !== this.state.userInfo.email) {
      const { id } = AppState.currentMenuType;
      CreateUserStore.checkEmailAddress(id, value).then(({ failed }) => {
        if (failed) {
          callback(CreateUserStore.languages[`${intlPrefix}.email.used.msg`]);
        } else {
          callback();
        }
      });
    } else {
      callback();
    }
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!err) {
        const { oldEmployeeId } = this.state;
        const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
        const menuType = AppState.currentMenuType;
        const organizationId = menuType.id;
        onSubmit(data.employeeId);
        data.employeeId = data.employeeId || 0;

        if (edit) {
          if (!modify) {
            Choerodon.prompt(CreateUserStore.languages['modify.success']);
            OnUnchangedSuccess();
            return;
          }
          const { id, objectVersionNumber } = this.state.userInfo;
          CreateUserStore.updateUser(organizationId, id, {
            ...data = {
              id,
              realName: data.realName,
              email: data.email,
              language: data.language,
              timeZone: data.timeZone,
              employeeId: typeof data.employeeId === 'number' ? data.employeeId : oldEmployeeId,
              loginWayCode:data.loginWayCode
            },
            objectVersionNumber,
          }).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(CreateUserStore.languages['modify.success']);
              this.handleRefush();
              onSuccess();
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else {
          CreateUserStore.createUser(data, organizationId).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(CreateUserStore.languages['create.success']);
              onSuccess();
              this.handleRefush();
            }
          }).catch((error) => {
            onError();
            Choerodon.handleResponseError(error);
          });
        }
      }
    });
  };

  renderStaffOption = () => {
    if (CreateUserStore.getStaff) {
      return CreateUserStore.getStaff.map(value => (<Option value={value.employeeId}>{value.employeeName}</Option>));
    }
  }

  clickEyes=(type) => {
    if (type === 'quxiaoyincang') {
      this.setState({
        clickEyes: true,
      });
    } else if (type === 'yincang') {
      this.setState({
        clickEyes: false,
      });
    }
  }

  clickEyePasswords=(type) => {
    if (type === 'quxiaoyincang') {
      this.setState({
        clickEyePasswords: true,
      });
    } else if (type === 'yincang') {
      this.setState({
        clickEyePasswords: false,
      });
    }
  }

  // 点击表单后，改变type
  changeType = (e) => {
    this.setState({ type: '' });
  }

  changereType = (e) => {
    this.setState({ types: '' });
  }


  render() {
    const { AppState, edit, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationName = menuType.name;
    const { getFieldDecorator } = this.props.form;
    const { userInfo, oldEmployeeId, clickEyes, types, type, clickEyePasswords } = this.state;
    const { originalPassword, enablePassword } = CreateUserStore.getPasswordPolicy || {};
    const languages = CreateUserStore.getLanguagelist;
    const lanOption = [];
    languages.forEach((item) => {
      lanOption.push(<Option value={item.code}>{item.description}</Option>);
    });

    const loginModeOption=[
    ];
    this.state.LoginType?this.state.LoginType.forEach((item) => {
      loginModeOption.push(<Checkbox value={item.lookupValue}>{item.lookupMeaning}</Checkbox >);
    }):'';
    return (
      <Content className="sidebar-content">
        <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical" autocomplete="off">
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('loginName', {
              rules: [
                {
                  required: true,
                  message: CreateUserStore.languages[`${intlPrefix}.loginname.require.msg`],
                },
                {
                  validator: this.checkUsername,
                },
                {
                  pattern: /^[A-Za-z0-9_-]+$/,
                  message: CreateUserStore.languages[`${intlPrefix}.name.space.msg`],
                },
              ],
              validateTrigger: 'onBlur',
              initialValue: userInfo.id ? userInfo.loginName : '',
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CreateUserStore.languages[`${intlPrefix}.loginname`]}
                disabled={edit}
                type="text"
                style={{ width: inputWidth }}
                maxLength={64}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {
              getFieldDecorator('realName', {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: CreateUserStore.languages[`${intlPrefix}.realname.require.msg`],
                  },
                ],
                initialValue: userInfo.realName ? userInfo.realName : userInfo.loginName,
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={CreateUserStore.languages[`${intlPrefix}.realname`]}
                  type="text"
                  rows={1}
                  style={{ width: inputWidth }}
                  maxLength={60}
                />,
              )
            }
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('email', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: CreateUserStore.languages[`${intlPrefix}.email.require.msg`],
                },
                {
                  type: 'email',
                  message: CreateUserStore.languages[`${intlPrefix}.email.pattern.msg`],
                },
                {
                  validator: this.checkEmailAddress,
                },
              ],
              validateTrigger: 'onBlur',
              initialValue: userInfo.email || '',
              validateFirst: true,
            })(
              <Input
                disabled={!!userInfo.email}
                autoComplete="off"
                label={CreateUserStore.languages[`${intlPrefix}.email`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>
          {!edit && (
            <FormItem
              {...formItemLayout}
              className="password_one_user"
            >
              {getFieldDecorator('password', {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: CreateUserStore.languages[`${intlPrefix}.password.require.msg`],
                  },
                  {
                    validator: this.checkPassword,
                  },
                ],
                initialValue: '',
                validateFirst: true,
              })(
                <div>
                  {clickEyes
                    ? (
                      <div>
                        <Input
                          autoComplete="off"
                          label={CreateUserStore.languages[`${intlPrefix}.password`]}
                          style={{ width: inputWidth }}
                          maxLength={this.state.passwordPolicy.maxLength}
                        />
                        <Icon style={{ color: '#2196f3', marginLeft: -25, marginTop: 10, cursor: 'pointer', position: 'relative' }} type="quxiaoyincang" onClick={() => { this.clickEyes('yincang'); }} />
                      </div>
                    )
                    : (
                      <div>
                        <Input
                          label={CreateUserStore.languages[`${intlPrefix}.password`]}
                          autocomplete="new-password"
                          type="password"
                          readOnly={type}
                          maxLength={this.state.passwordPolicy.maxLength}
                          onClick={this.changeType}
                          data-max-length="50"
                          tabindex="2"
                          spellcheck="false"
                          style={{ width: inputWidth }}
                        />
                        <Icon type="yincang" style={{ color: '#818999', marginLeft: -25, marginTop: 10, position: 'relative', cursor: 'pointer' }} onClick={() => { this.clickEyes('quxiaoyincang'); }} />
                      </div>
                    )
                  }
                </div>
                ,
              )}
            </FormItem>
          )}
          {!edit && (
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('rePassword', {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: CreateUserStore.languages[`${intlPrefix}.repassword.require.msg`],
                  }, {
                    validator: this.checkRepassword,
                  },
                ],
                initialValue: '',
                validateFirst: true,
              })(
                <div>
                  {clickEyePasswords
                    ? (
                      <div>
                        <Input
                          autoComplete="off"
                          maxLength={this.state.passwordPolicy.maxLength}
                          label={CreateUserStore.languages[`${intlPrefix}.repassword`]}
                          style={{ width: inputWidth }}
                        />
                        <Icon style={{ color: '#2196f3', marginLeft: -25, marginTop: 10, cursor: 'pointer', position: 'relative' }} type="quxiaoyincang" onClick={() => { this.clickEyePasswords('yincang'); }} />
                      </div>
                    )
                    : (
                      <div>
                        <Input
                          label={CreateUserStore.languages[`${intlPrefix}.repassword`]}
                          autocomplete="new-password"
                          type="password"
                          onClick={this.changereType}
                          readOnly={types}
                          maxLength={this.state.passwordPolicy.maxLength}
                          data-max-length="50"
                          tabindex="2"
                          spellcheck="false"
                          style={{ width: inputWidth }}
                          onBlur={this.handleRePasswordBlur}
                        />
                        <Icon type="yincang" style={{ color: '#818999', marginLeft: -25, marginTop: 10, position: 'relative', cursor: 'pointer' }} onClick={() => { this.clickEyePasswords('quxiaoyincang'); }} />
                      </div>
                    )
                  }
                </div>,
              )}
            </FormItem>
          )}
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('language', {
              initialValue: this.state.userInfo.language,
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                label={CreateUserStore.languages[`${intlPrefix}.language`]}
                style={{ width: inputWidth }}
              >
                {lanOption}
              </Select>,
            )}
          </FormItem>
          {
            edit && (
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('timeZone', {
                  initialValue: this.state.userInfo.timeZone,
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    label={CreateUserStore.languages[`${intlPrefix}.timezone`]}
                    style={{ width: inputWidth }}
                  >
                    <Option value="CTT">中国</Option>
                  </Select>,
                )}
              </FormItem>
            )
          }
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('employeeId', {
              rules: [
                {
                  required: true,
                  message: CreateUserStore.languages[`${intlPrefix}.staff.require.msg`],
                },
              ],
              initialValue: oldEmployeeId === 0 ? '' : userInfo.employee.employeeName,
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                style={{ width: 512 }}
                label={CreateUserStore.languages[`${intlPrefix}.staff`]}
                optionFilterProp="children"
                filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                filter
              >
                {this.renderStaffOption(oldEmployeeId)}
              </Select>,
            )}
          </FormItem>
          {
            edit?(
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('loginWayCode', {
                  initialValue: this.state.userInfo.loginWayCode,
                  // initialValue: ['ACCOUNT','LDAP'],
                })(
                  <Checkbox.Group disabled style={{ width: '100%' }}>
                    {loginModeOption}
                  </Checkbox.Group>,
                )}
              </FormItem>
            ):''
          }

        </Form>
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EditUser)));
