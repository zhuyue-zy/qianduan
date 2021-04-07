/*eslint-disable*/
import React, {Component} from 'react';
import {inject, observer} from 'mobx-react';
import {withRouter} from 'react-router-dom';
import querystring from 'query-string';
import {Button, Form, Input, Modal, Table, Tooltip, DatePicker, Select, Icon, Switch, Spin,InputNumber} from 'yqcloud-ui';
import {axios, Content, Header, Page, Permission, stores} from 'yqcloud-front-boot';
import {injectIntl, FormattedMessage} from 'react-intl';
import moment from 'moment';
import '../Organization.scss';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';
import UserStore from '../../../../stores/organization/user/UserStore';

const intlPrefix = 'global.organization';
const {HeaderStore} = stores;
const {Sidebar} = Modal;
const FormItem = Form.Item;
const Option = Select.Option;


@inject('AppState')
@observer
class OrganizationHome extends Component {

  state = this.getInitState();

  getInitState() {
    return {
      orgId: this.props.match.params.id,
      visible: false,
      content: null,
      show: '',
      submitting: false,
      loading: false,
      editData: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: 0,
        pageSizeOptions: [25, 50, 100, 200]
      },
      sort: {
        columnKey: null,
        order: null,
      },
      filters: {},
      params: [],
      languageLists: [],
      tempCheck: false,
      tempCheckEmail: true,

      msgVisible: false,
      msgName: [],
      msgStatus: [],
      msgDataSource: [],
      id: '',
      clickEyes: false,
      startValue: null,
      endValue: null,
      endOpen: false,
      orgInfo: [],
      loadingBtn: false,
      industryTypes: [],
      tenantType:[],
      DnsUrl:'',
      LoginType:[],
      // 存放多语言信息
      multiLanguageValue: {
        name: {},
        remark:{},
      },
    };
  }


  componentWillMount() {
    this.loadOrgById();
    this.loadIndustry();
    this.languageList();
    this.getTenantType();
    this.getLanguage();
    this.getLoginType();
    this.getUrl();
  }

  componentDidMount() {
    this.loadLanguage();
  }

  /*  多语言，获取系统支持的语言环境 */
  getLanguage = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        });
      });
  };

  getUrl = () =>{
    const url = window.location.host;
    // const Urldata = 'yqcloud.dev.cloopm.com';
    const  Urldata = url.substring(url.indexOf('.')+1);
    this.setState({
      DnsUrl: Urldata
    })
  };

  // 获取语言
  loadLanguage = () => {
    const {AppState} = this.props;
    const id = 0;
    UserStore.queryLanguage(id, AppState.currentLanguage);
  }

  // 租户类型快码
  getTenantType =() =>{
    const {AppState}=this.props;
    const code = 'FND_TENANT_TYPE';
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          tenantType: data
        })
      })
  };

  loadOrgById() {
    const {orgId} = this.state;
    axios.get(`iam/v1/${orgId}/organizations`).then(data => {
      this.setState({
        orgInfo: data,
        multiLanguageValue: {
          name: data.__tls.name,
          remark:data.__tls.remark
        },
        tempCheck: data.ldap,
        tempCheckEmail: data.sendEmail,
      })
    })
  }

  loadIndustry = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.userInfo;
    this.setState({
      loading: true,
    });
    UserStore.getIndustryTypes(organizationId)
      .then((d) => {
        this.setState({
          industryTypes: d,
          loading: false,
        })
      }).catch((err) => {
      Choerodon.handleResponseError(err);
    });
  };

  clickEyes = (type) => {
    if (type === 'quxiaoyincang') {
      this.setState({
        clickEyes: true,
      })
    } else if (type === 'yincang') {
      this.setState({
        clickEyes: false,
      })
    }
  }

  fetch({current, pageSize}, {columnKey, order}, {name, code, enabled, isLdapUser}, params) {
    this.setState({
      loading: true,
    });
    const queryObj = {
      page: current - 1,
      size: pageSize,
      name,
      code,
      isLdapUser,
      enabled,
      params,
    };
    if (columnKey) {
      const sorter = [];
      sorter.push(columnKey);
      if (order === 'descend') {
        sorter.push('desc');
      }
      queryObj.sort = sorter.join(',');
    }
    this.queryMsgName()
    this.queryMsgStatus()
    return axios.get(`/iam/v1/organizations?${querystring.stringify(queryObj)}`);
  }

  //  快码初始化内容查询
  queryMsgName = () => {
    const {AppState} = this.props;
    const code = "FND_INITIAL_CONTENT";
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          msgName: data
        })
      })
  }

  queryMsgStatus = () => {
    const {AppState} = this.props;
    const code = "FND_MSG_SENDSTATUS";
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          msgStatus: data
        })
      })
  }

  languageList = () => {
    return axios.get('/iam/v1/languages/list').then((data) => {
      this.setState({
        languageLists: data,
      });
    })
  }

  /**
   * 组织编码校验
   * @param rule 表单校验规则
   * @param value 组织编码
   * @param callback 回调函数
   */
  checkCode = (rule, value, callback) => {
    const {intl} = this.props;
    axios.post(`/iam/v1/organizations/check`, JSON.stringify({code: value}))
      .then((mes) => {
        if (mes.failed) {
          callback(UserStore.languages[`${intlPrefix}.onlymsg`]);
        } else {
          callback();
        }
      });
  };

  checkLoginName = (rule, value, callback) => {
    const {intl} = this.props;
    axios.post(`/iam/v1/organizations/0/users/checkLoginName`, JSON.stringify({loginName: value}))
      .then((mes) => {
        if (mes.failed) {
          callback(UserStore.languages[`${intlPrefix}.onlyLoginName`]);
        } else {
          callback();
        }
      });
  };
  //LDAP开关
  handleClickSwitch = (checked) => {
    const {show, editData, tempCheck} = this.state;
    if (checked) {
      this.setState({
        tempCheck: true
      })

    } else if (checked == false) {
      this.setState({
        tempCheck: false
      })
    }
    this.setState({
      editData
    })
  }
  //email开关
  handleClickSwitchEmail = (checked) => {
    const {show, editData, tempCheckEmail} = this.state;
    if (checked) {
      this.setState({
        tempCheckEmail: true
      })

    } else if (checked == false) {
      this.setState({
        tempCheckEmail: false
      })
    }
    this.setState({
      editData
    })
  };

  disabledStartDate = (startValue) => {
    const endValue = this.state.endValue;
    if (!startValue || !endValue) {
      return false;
    }
    return startValue.valueOf() > endValue.valueOf();
  }

  disabledEndDate = (endValue) => {
    const startValue = this.state.startValue;
    if (!endValue || !startValue) {
      return false;
    }
    return endValue.valueOf() <= startValue.valueOf();
  }

  onStartChange = (value) => {
    this.onChange('startValue', value);
  }

  onEndChange = (value) => {
    this.onChange('endValue', value);
  }

  onChange = (field, value) => {
    this.setState({
      [field]: value,
    });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, {code, name,robotNum, remark,typeCode, effectDate, expiryDate, enabled, language, ldap, password, loginName, industry}, modify) => {
      if (!err) {
        this.setState({loadingBtn: true})
        const {intl} = this.props;
        const {show, editData: {id, code: originCode, objectVersionNumber, ldap}, tempCheck, tempCheckEmail, orgId, orgInfo} = this.state;
        let url;
        let body;
        let message;
        let method;
        url = `/iam/v1/organizations/${orgId}`;
        body = {
          // ldap: tempCheck,
          sendEmail: tempCheckEmail,
          name,
          objectVersionNumber:orgInfo.objectVersionNumber,
          code: orgInfo.code,
          remark,
          robotNum,
          typeCode:orgInfo.typeCode,
          effectDate: moment(effectDate).format('YYYY-MM-DD hh:mm:ss'),
          expiryDate: moment(expiryDate).format('YYYY-MM-DD hh:mm:ss'),
          enabled: true,
          language,
          loginName,
          password,
          trade: industry,
          __tls:this.state.multiLanguageValue,
          tenantDns:typeCode==='ENTERPRISE'?(orgInfo.code.toLowerCase()+'.'+this.state.DnsUrl):null,
          // ldap:this.state.ldap,
          // sso:this.state.sso,
        };
        message = UserStore.languages['modify.success'];
        method = 'put';
        this.setState({submitting: true});
        axios[method](url, JSON.stringify(body))
          .then(data => {
            this.setState({
              submitting: false,
              visible: false,
              loadingBtn: false
            });
            if (data.failed) {
              this.setState({loadingBtn: false})
            } else {
              this.props.history.push("/iam/organization")
              this.setState({loadingBtn: false})
              this.loadOrganizations();
              HeaderStore.updateOrg(data);
            }
          })
          .catch(error => {
            this.setState({submitting: false,loadingBtn: false});
            Choerodon.handleResponseError(error);
          });
      }
    });
  };

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

  LoginTypeOnChange = (value) =>{
    if(value==='SSO'){
      this.setState({
        ldap:0,
        sso:1,
      })
    }else if(value==='LDAP'){
      this.setState({
        ldap:1,
        sso:0,
      })

    }else if(value==='ACCOUNT'){
      this.setState({
        ldap:0,
        sso:0,
      })

    }
  };

  renderSidebarContent() {
    const {intl} = this.props;
    const {getFieldDecorator} = this.props.form;
    const {show, editData, orgInfo, startValue, endValue, endOpen, industryTypes} = this.state;

    let login_type;
    if((!orgInfo.sso)&&(!orgInfo.ldap)){
      login_type = '账号密码'
    }else if((orgInfo.sso)&&(!orgInfo.ldap)){
      login_type = '单点登录'
    }else if((!orgInfo.sso)&&(orgInfo.ldap)){
      login_type = 'LDAP认证'
    }

    const formItemLayout = {
      labelCol: {
        xs: {span: 24},
        sm: {span: 8},
      },
      wrapperCol: {
        xs: {span: 24},
        sm: {span: 16},
      },
    };
    const inputWidth = 443;

    const languages = this.state.languageLists;
    const lanOption = [];
    languages.forEach((item) => {
      lanOption.push(<Option value={item.code}>{item.description}</Option>);
    });

    const  { tenantType } = this.state;
    const tenTypeOption = [];
    tenantType.forEach((item) => {
      tenTypeOption.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });

    const industryOption = [];
    industryTypes.map((item) => {
      industryOption.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>)
    });

    const  { LoginType } = this.state;
    const LoginTypeOption = [];
    LoginType.forEach((item) => {
      LoginTypeOption.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });

    return (
      <Content
        className="sidebar-content"
        values={{name: show === 'create' ? `${process.env.HEADER_TITLE_NAME || 'Choerodon'}` : `${editData.code}`}}
      >
        <Form style={{ marginTop: 15 }}>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('code', {
              rules: [{
                required: true,
                whitespace: true,
                message: UserStore.languages[`${intlPrefix}.coderequiredmsg`],
              }, {
                max: 20,
                message: UserStore.languages[`${intlPrefix}.codemaxmsg`],
              }, {
                pattern: /^[A-Z0-9]+$/,
                message: UserStore.languages[`${intlPrefix}.codepatternmsg`],
              }],
              normalize: (value) => {
                if (value) {
                  return value.toUpperCase()
                }
              },
              validateFirst: true,
              initialValue: orgInfo.code,
            })(
              <Input disabled label={UserStore.languages[`${intlPrefix}.code`]} maxLength={15} required
                     autoComplete="off" style={{width: inputWidth}}/>,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('name', {
              initialValue: orgInfo.name,
              rules: [{
                required: true,
                message: UserStore.languages[`${intlPrefix}.namerequiredmsg`],
                whitespace: true
              }],
            })(
              <MultiLanguageFormItem
                label={UserStore.languages[`${intlPrefix}.name`]}
                requestUrl="true"
                requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.name : {}}
                handleMultiLanguageValue={({ retObj, retList }) => {
                  // 将多语言的值设置到当前表单
                  this.props.form.setFieldsValue({
                    name: retObj[this.props.AppState.currentLanguage],
                  });
                  this.setState({
                      multiLanguageValue: {
                        ...this.state.multiLanguageValue,
                        name: retObj,
                      },
                      multiLanguageList: retList,
                    },()=>{
                      // this.onValuesChangeFrom()
                    }
                  );
                }}
                maxLength={50}
                // disabled={isView === '1' ? 'true' : ''}
                type="FormItem"
                FormLanguage={this.state.multiLanguageValue}
                languageEnv={this.state.languageEnv}
                descriptionObject={UserStore.languages.multiLanguage}
                required="true"
                inputWidth={inputWidth}
              />
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('remark', {
              initialValue: orgInfo.remark,
              rules: [{required: true, message: UserStore.languages[`${intlPrefix}.remarkrequiredmsg`]}],
            })(

              <MultiLanguageFormItem
                label={UserStore.languages[`${intlPrefix}.remark`]}
                requestUrl="true"
                requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.remark : {}}
                handleMultiLanguageValue={({ retObj, retList }) => {
                  // 将多语言的值设置到当前表单
                  this.props.form.setFieldsValue({
                    remark: retObj[this.props.AppState.currentLanguage],
                  });
                  this.setState({
                      multiLanguageValue: {
                        ...this.state.multiLanguageValue,
                        remark: retObj,
                      },
                      multiLanguageList: retList,
                    },()=>{
                      // this.onValuesChangeFrom()
                    }
                  );
                }}
                maxLength={100}
                // disabled={isView === '1' ? 'true' : ''}
                type="FormItem"
                FormLanguage={this.state.multiLanguageValue}
                languageEnv={this.state.languageEnv}
                descriptionObject={UserStore.languages.multiLanguage}
                required="true"
                inputWidth={inputWidth}
              />
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('typeCode', {
              initialValue: (orgInfo.typeCode==="ENTERPRISE" ? `${UserStore.languages[`${intlPrefix}.enterprise`]}` : `${UserStore.languages[`${intlPrefix}.public`]}`),
              rules: [{ required: true, message: UserStore.languages[`${intlPrefix}.tenantTypeWarning`]}],
              // validateTrigger: 'onBlur',
            })(
              <Select
                disabled
                getPopupContainer={triggerNode => triggerNode.parentNode}
                label={UserStore.languages[`${intlPrefix}.tenantType`]}
                style={{ width: inputWidth }}
              >
                {tenTypeOption}
              </Select>,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
            style={{
              width:inputWidth
            }}
          >
            {getFieldDecorator('robotNum', {
              rules: [{ required: true, message: '填写机器人数量'}],
              initialValue:orgInfo.robotNum
            })(
              <InputNumber
                label="机器人数量"
                min={0}
                precision={0}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('effectDate', {
              initialValue: orgInfo.effectDate && moment(orgInfo.effectDate),
              rules: [
                {
                  required: true, message: UserStore.languages[`${intlPrefix}.expirydaterequiredmsg`]
                },
                {
                  validator: (rule, value, callback) => {
                    const effectDate = (new Date(value)).getTime()
                    const expiryDate = (new Date(this.props.form.getFieldValue('expiryDate'))).getTime()
                    if (expiryDate !== 0 && (expiryDate - effectDate) < 86400) {
                      callback(UserStore.languages[`${intlPrefix}.effectdate.expirydate.requiredmsg`]);
                    } else {
                      this.props.form.setFieldsValue({expiryDate: this.props.form.getFieldValue('expiryDate')})
                      callback();
                    }
                  }
                }],
              validateFirst: true,
            })(
              <DatePicker onChange={this.onStartChange} disabledDate={this.disabledStartDate} value={startValue}
                          style={{width: inputWidth}} format="YYYY-MM-DD" allowClear={true}
                          label={UserStore.languages[`${intlPrefix}.effectdate`]}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('expiryDate', {
              initialValue: orgInfo.expiryDate && moment(orgInfo.expiryDate),
              rules: [
                {
                  validator: (rule, value, callback) => {
                    const effectDate = (new Date(this.props.form.getFieldValue('effectDate'))).getTime()
                    const expiryDate = (new Date(value)).getTime()
                    if (value && (expiryDate - effectDate) < 86400) {
                      callback(UserStore.languages[`${intlPrefix}.effectdate.expirydate.requiredmsg`]);
                    } else {
                      this.props.form.setFieldsValue({effectDate: this.props.form.getFieldValue('effectDate')})
                      callback();
                    }
                  }
                }],
              validateFirst: true,
            })(
              <DatePicker disabledDate={this.disabledEndDate} onChange={this.onEndChange} value={endValue}
                          style={{width: inputWidth}} format="YYYY-MM-DD" allowClear={true}
                          label={UserStore.languages[`${intlPrefix}.expirydate`]}

              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('language', {
              initialValue: `${orgInfo.language}`,

              rules: [{required: true, message: UserStore.languages[`${intlPrefix}.languages`]}],
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                label={UserStore.languages[`${intlPrefix}.language`]}
                style={{width: inputWidth}}
              >
                {lanOption}
              </Select>,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('industry', {
              initialValue: orgInfo.trade,
              rules: [{required: true, message: UserStore.languages[`${intlPrefix}.industryMsg`]}],
            })(
              <Select
                label={UserStore.languages[`${intlPrefix}.industry`]}
                style={{width: inputWidth}}
              >
                {industryOption}
              </Select>,
            )}
          </FormItem>

          {/*<FormItem*/}
            {/*{...formItemLayout}*/}
          {/*>*/}
            {/*{getFieldDecorator('login_type', {*/}
              {/*initialValue: login_type,*/}
              {/*rules: [{required: true, message: UserStore.languages[`${intlPrefix}.LoginModeTips`]}],*/}
              {/*// validateTrigger: 'onBlur',*/}
            {/*})(*/}
              {/*<Select*/}
                {/*getPopupContainer={triggerNode => triggerNode.parentNode}*/}
                {/*label={UserStore.languages[`${intlPrefix}.LoginMode`]}*/}
                {/*style={{ width: inputWidth }}*/}
                {/*onChange={this.LoginTypeOnChange}*/}
              {/*>*/}
                {/*{LoginTypeOption}*/}
              {/*</Select>,*/}
            {/*)}*/}
          {/*</FormItem>*/}
        </Form>
      </Content>
    );
  }

  renderSidebarContentRight() {
    const {intl} = this.props;
    const {getFieldDecorator} = this.props.form;
    const {show, editData, tempCheck, tempCheckEmail, clickEyes, orgInfo} = this.state;
    const orgNameList= [];
    if(orgInfo.loginNameList&&orgInfo.loginNameList.length> 0 ){
      orgInfo.loginNameList.forEach((v) => {
        orgNameList.push(<span style={{
          display: 'inline-block',
          paddingLeft: 5,
          paddingRight: 5,
          height: 22,
          fontSize: 12,
          color: '#04173f',
          background: '#EBF6FF',
          borderRadius: '4px',
          marginRight:10,
          marginBottom:10,
        }}>{v}</span>)
      })
    }
    const formItemLayout = {
      labelCol: {
        xs: {span: 24},
        sm: {span: 8},
      },
      wrapperCol: {
        xs: {span: 24},
        sm: {span: 16},
      },
    };
    const inputWidth = 443;
    return (
      <Content
        className="sidebar-content"
        values={`${editData.code}`}
      >
        <Form style={{marginTop:15}}>

          <FormItem
            {...formItemLayout}
          >
            <div>
              <div style={{fontSize: 12, color: "#04173f"}}>{UserStore.languages[`${intlPrefix}.loginName`]} </div>
              <div style={{ width: 443, marginTop: 13 }}>{orgNameList}</div>
            </div>

          </FormItem>
          {/*
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('ldap', {})(
              <div>
                <div>
                  <Switch defaultChecked={false} checked={tempCheck} onClick={this.handleClickSwitch.bind(this)}/>
                  <span style={{
                    fontSize: 12,
                    marginLeft: 12,
                    color: '#04173F'
                  }}>{UserStore.languages[`${intlPrefix}.useLDAP`]}</span>
                </div>
                {tempCheck ?
                  <div style={{
                    width: '90%',
                    paddingTop: 10,
                    paddingBottom: 10,
                    height: 'auto',
                    border: '1px solid #FF919E',
                    background: '#FFE6E8',
                    display: 'flex',
                    borderRadius: '4px',
                    marginTop: 12
                  }}><Icon style={{flex: 0.01, color: 'red', fontSize: 15, marginTop: 2, marginLeft: 10}}
                           type='zhucedenglu-xinxishuru-cuowu'/><span style={{
                    flex: 1,
                    fontSize: 12,
                    color: "#818999",
                    marginLeft: 5
                  }}>{UserStore.languages[`${intlPrefix}.ldap.cancel.content`]}</span></div> :
                  <div style={{
                    width: '90%',
                    paddingTop: 11,
                    paddingBottom: 10,
                    height: 'auto',
                    border: '1px solid #91CEFF',
                    background: '#E6F4FF',
                    display: 'flex',
                    borderRadius: '4px',
                    marginTop: 12
                  }}><Icon style={{flex: 0.01, color: '#2196f3', fontSize: 18, marginTop: 2, marginLeft: 10}}
                           type='info'/><span style={{
                    flex: 1,
                    fontSize: 12,
                    color: "#818999",
                    marginLeft: 5
                  }}>{UserStore.languages[`${intlPrefix}.ldap.content`]}</span></div>
                }
              </div>
            )}

          </FormItem>
          */}

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('sendEmail', {})(
              <div>
                <div>
                  <Switch defaultChecked={true} checked={tempCheckEmail}
                          onClick={this.handleClickSwitchEmail.bind(this)}/>
                  <span style={{
                    fontSize: 12,
                    marginLeft: 12,
                    color: '#04173F'
                  }}>{UserStore.languages[`${intlPrefix}.useEmail`]}</span>
                </div>
                {tempCheckEmail ?
                  <div style={{
                    width: '90%',
                    paddingTop: 10,
                    paddingBottom: 10,
                    height: 'auto',
                    border: '1px solid #FF919E',
                    background: '#FFE6E8',
                    display: 'flex',
                    borderRadius: '4px',
                    marginTop: 12
                  }}><Icon style={{flex: 0.01, color: 'red', fontSize: 15, marginTop: 2, marginLeft: 10}}
                           type='zhucedenglu-xinxishuru-cuowu'/><span style={{
                    flex: 1,
                    fontSize: 12,
                    color: "#818999",
                    marginLeft: 5
                  }}>{UserStore.languages[`${intlPrefix}.email.cancel.content`]}</span></div> :
                  <div style={{
                    width: '90%',
                    paddingTop: 10,
                    paddingBottom: 10,
                    height: 'auto',
                    border: '1px solid #91CEFF',
                    background: '#E6F4FF',
                    display: 'flex',
                    borderRadius: '4px',
                    marginTop: 12
                  }}><Icon style={{flex: 0.01, color: '#2196f3', fontSize: 19, marginTop: 2, marginLeft: 10}}
                           type='info'/><span style={{
                    flex: 1,
                    fontSize: 12,
                    color: "#818999",
                    marginLeft: 5
                  }}>{UserStore.languages[`${intlPrefix}.email.content`]}</span></div>
                }
              </div>
            )}
          </FormItem>
          {
            this.state.orgInfo.typeCode==='ENTERPRISE'?(
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('tenantDns')(
                  <span>
                <div style={{ color: '#04173F', fontSize: 14,display: 'flex', alignItems: 'center', marginBottom: 15 }}><span style={{display: 'inline-block', background: '#2196f3', width: 3, height: 14, marginRight: 5}}></span>{UserStore.languages[`${intlPrefix}.personality`]}</div>
                <span>{UserStore.languages[`${intlPrefix}.domainMame`]}<span style={{color:'red'}}>*</span><Input disabled style={{width:'25%'}} type="text" value={this.props.form.getFieldsValue().code.toLowerCase()}/>.{this.state.DnsUrl}</span>
              </span>
                )}
              </FormItem>
            ):''
          }
        </Form>
      </Content>
    );
  }

  render() {
    const {intl} = this.props;
    const {loadingBtn, loading} = this.state;
    return (
      <Page
        service={[
          'iam-service.organization.list',
          'iam-service.organization.check',
          'iam-service.organization.query',
          'iam-service.organization.create',
          'iam-service.organization.update',
          'iam-service.organization.disableOrganization',
          'iam-service.organization.enableOrganization',
        ]}
      >
        <Header title={UserStore.languages[`${intlPrefix}.modify`]}
                backPath="/iam/organization"
        >
          <Permission service={['iam-service.organization.list']}>
            <Button
              onClick={this.handleSubmit}
              style={{color: '#04173F'}}
              loading={loadingBtn}
            >
              <Icon type="baocun" style={{color: '#2196F3', width: 25}}/>
              {UserStore.languages.save}
            </Button>
          </Permission>
        </Header>
        <Spin spinning={loading}>
          <Content>
            <div style={{display: 'flex', width: '100%'}}>
              <div style={{flex: 1}}>
                <div style={{color: '#04173F', fontSize: 14, display: 'flex', alignItems: 'center',}}><span
                  style={{display: 'inline-block', background: '#2196f3', width: 3, height: 14, marginRight: 5 }}></span>{UserStore.languages[`${intlPrefix}.orgInfo`]}
                </div>
                {this.renderSidebarContent()}
              </div>
              <div style={{flex: 1}}>
                <div style={{color: '#04173F', fontSize: 14, display: 'flex', alignItems: 'center',}}><span
                  style={{display: 'inline-block', background: '#2196f3', width: 3, height: 14, marginRight: 5 }}></span>{UserStore.languages[`${intlPrefix}.adminNum`]}
                </div>
                {this.renderSidebarContentRight()}
              </div>
            </div>
          </Content>
        </Spin>
      </Page>
    );
  }
}

export default Form.create()(withRouter(injectIntl(OrganizationHome)));
