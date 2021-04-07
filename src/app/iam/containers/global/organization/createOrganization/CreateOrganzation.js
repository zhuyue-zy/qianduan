/*eslint-disable*/
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import querystring from 'query-string';
import { Button, Form, Input, Modal, Table, Tooltip, DatePicker, Select,Icon ,Switch,message,InputNumber } from 'yqcloud-ui';
import { axios, Content, Header, Page, Permission, stores } from 'yqcloud-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import moment from 'moment';
import '../Organization.scss';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';
import UserStore from '../../../../stores/organization/user/UserStore';

const intlPrefix = 'global.organization';
const { HeaderStore } = stores;
const { Sidebar } = Modal;
const FormItem = Form.Item;
const Option = Select.Option;


@inject('AppState')
@observer
class OrganizationHome extends Component {

  state= this.getInitState();
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
      tempCheck:false,
      tempCheckEmail:true,

      msgVisible:false,
      msgName:[],
      msgStatus:[],
      msgDataSource:[],
      id:'',
      clickEyes: false,
      startValue: null,
      endValue: null,
      endOpen: false,
      loadingBtn:false,
      changeLoginName: '',
      changePassword: '',
      industryTypes: [],
      tenantType:[],
      tenantTypeChoice:'',
      loginNameValidateStatus:'',
      loginNameValidateStatusText:'',
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
    this.languageList();
    this.loadIndustry();
    this.loadLanguage();
    this.getTenantType();
    this.getLanguage();
    this.getLoginType();
    this.getUrl();
  }

  getUrl = () =>{
    const url = window.location.host;
    // const Urldata = 'yqcloud.dev.cloopm.com';
    const  Urldata = url.substring(url.indexOf('.')+1);
    this.setState({
      DnsUrl: Urldata
    })
  };

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

  /*  多语言，获取系统支持的语言环境 */
  getLanguage = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        });
      });
  };

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const  id  = 0;
    const { organizationId } = AppState.userInfo;
    UserStore.queryLanguage(id, AppState.currentLanguage);
  }

  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.languageList();
    });
  };

  clickEyes=(type)=>{
    if(type==='quxiaoyincang'){
      this.setState({
        clickEyes: true,
      })
    }else if(type==='yincang'){
      this.setState({
        clickEyes: false,
      })
    }
  }

  fetch({ current, pageSize }, { columnKey, order }, { name, code, enabled, isLdapUser }, params) {
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
  queryMsgName=()=>{
    const {AppState}=this.props;
    const code="FND_INITIAL_CONTENT";
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          msgName:data
        })
      })
  }
  // 获取初始化名称
  selectMsgName = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const{msgName}=this.state;
    const temp_Emp = msgName.filter(v => (v.lookupValue === values));
    if (temp_Emp.length > 0) {
      return temp_Emp[0].lookupMeaning;
    } else {
      return values;
    }
  }
  queryMsgStatus=()=>{
    const {AppState}=this.props;
    const code="FND_MSG_SENDSTATUS";
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          msgStatus:data
        })
      })
  }
  languageList=() => {
    return axios.get('/iam/v1/languages/list').then((data) => {
      this.setState({
        languageLists : data,
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
    const { intl } = this.props;
    axios.post(`/iam/v1/organizations/check`, JSON.stringify({ code: value }))
      .then((mes) => {
        if (mes.failed) {
          callback(UserStore.languages[`${intlPrefix}.onlymsg`]);
        } else {
          callback();
        }
      });
  };

  checkLoginName= (rule, value, callback) => {
    const { intl } = this.props;
    if(value===''){
      callback();
    }else {
      if(this.state.tenantTypeChoice === 'PUBLIC'){
        axios.post(`/iam/v1/organizations/0/users/checkLoginName`, JSON.stringify({ loginName: value }))
          .then((mes) => {
            if (mes.failed) {
              callback(UserStore.languages[`${intlPrefix}.onlyLoginName`]);
            } else {
              callback();
            }
          })

        ;
      } else {
        callback();
      }
    }
  };

  tenantTypeOnChange = (value) =>{
    this.setState({
      tenantTypeChoice: value
    });
    const _this = this;
    if(value === 'PUBLIC' && this.props.form.getFieldsValue().loginName){
      axios.post(`/iam/v1/organizations/0/users/checkLoginName`, JSON.stringify({ loginName: this.props.form.getFieldsValue().loginName }))
        .then((mes) => {
          if (mes.failed) {
            _this.setState({
              loginNameValidateStatus:'error',
              loginNameValidateStatusText:UserStore.languages[`${intlPrefix}.onlyLoginName`],
            });
          }else {
            _this.setState({
              loginNameValidateStatus:'',
              loginNameValidateStatusText:'',
            });
          }
        });
    }
  };

  //LDAP开关
  handleClickSwitch=(checked)=>{
    const { show, editData ,tempCheck} = this.state;
    if(checked){
      this.setState({
        tempCheck:true
      })

    }else if(checked==false){
      this.setState({
        tempCheck:false
      })
    }
    this.setState({
      editData
    })
  }
  //email开关
  handleClickSwitchEmail=(checked)=>{
    const { show, editData ,tempCheckEmail} = this.state;
    if(checked){
      this.setState({
        tempCheckEmail:true
      })

    }else if(checked==false){
      this.setState({
        tempCheckEmail:false
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
    this.props.form.validateFields((err, { code, name,robotNum, remark,typeCode, effectDate, expiryDate, enabled,language,ldap,password,loginName, industry }, modify) => {
      if (!err) {
        this.setState({loadingBtn:true})
        const { intl } = this.props;
        const { show, editData: { code: originCode, objectVersionNumber,ldap },tempCheck ,tempCheckEmail,id} = this.state;
        let url;
        let body;
        let message;
        let method;
        url = '/iam/v1/organizations';
        if(loginName===''&&password!==''){

        }
        body = {
          // ldap:tempCheck,
          sendEmail:tempCheckEmail,
          name,
          code,
          robotNum,
          typeCode,
          remark,
          effectDate: effectDate ? moment(effectDate).format('YYYY-MM-DD hh:mm:ss') : '',
          expiryDate: expiryDate ? moment(expiryDate).format('YYYY-MM-DD hh:mm:ss') : '',
          enabled,
          language,
          loginName,
          password,
          trade: industry,
          __tls:this.state.multiLanguageValue,
          tenantDns:typeCode==='ENTERPRISE'?(code.toLowerCase()+'.'+this.state.DnsUrl):null,
          // ldap:this.state.ldap,
          // sso:this.state.sso,
        };
        message = UserStore.languages['create.success'];
        method = 'post';
        this.setState({ submitting: true });
        axios[method](url, JSON.stringify(body))
          .then(data => {
            this.setState({
              submitting: false,
              visible: false,
              loadingBtn:false
            });
            if (data.failed) {
              Choerodon.prompt(data.message);
            } else {
              this.setState({loadingBtn:false})
              Choerodon.prompt(message);
              HeaderStore.addOrg(data);
              this.props.history.push("/iam/organization")
            }
          })
          .catch(error => {
            this.setState({ submitting: false,loadingBtn:false });
            Choerodon.handleResponseError(error);
          });
      }
    });
  };

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
    const { intl } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { show, editData, startValue, endValue, endOpen } = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };
    const inputWidth = 443;

    const  languages = this.state.languageLists;
    const lanOption = [];
    languages.forEach((item) => {
      lanOption.push(<Option value={item.code}>{item.description}</Option>);
    });

    const  { tenantType } = this.state;
    const tenTypeOption = [];
    tenantType.forEach((item) => {
      tenTypeOption.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });

    const  { LoginType } = this.state;
    const LoginTypeOption = [];
    LoginType.forEach((item) => {
      LoginTypeOption.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });

    const  { industryTypes } = this.state;
    const industryOption = [];
    industryTypes.map((item) => {
      industryOption.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>)
    });
    return (
      <Content
        className="sidebar-content"
        values={{ name: show === 'create' ? `${process.env.HEADER_TITLE_NAME || 'Choerodon'}` : `${editData.code}` }}
      >
        <Form>

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
                  }, {
                    validator: this.checkCode,
                  }],
                  normalize: (value) => {
                    if(value){
                      return value.toUpperCase()
                    }
                  },
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                })(
                  <Input label={UserStore.languages[`${intlPrefix}.code`]} maxLength={15} required autoComplete="off" style={{ width: inputWidth }} />,
                )}
              </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('name', {
              rules: [{ required: true, message: UserStore.languages[`${intlPrefix}.namerequiredmsg`], whitespace: true }],
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
              rules: [{ required: true, message: UserStore.languages[`${intlPrefix}.remarkrequiredmsg`]}],
              // validateTrigger: 'onBlur',
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
              rules: [{ required: true, message: UserStore.languages[`${intlPrefix}.tenantTypeWarning`]}],
              // validateTrigger: 'onBlur',
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                label={UserStore.languages[`${intlPrefix}.tenantType`]}
                style={{ width: inputWidth }}
                onChange={this.tenantTypeOnChange}
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
              initialValue:5
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
              rules: [
                {
                  required: true, message: UserStore.languages[`${intlPrefix}.expirydaterequiredmsg`]
                },
                { validator: (rule, value, callback) => {
                    const effectDate = (new Date(value)).getTime()
                    const expiryDate = (new Date(this.props.form.getFieldValue('expiryDate'))).getTime()
                    if (expiryDate !==0 && (expiryDate-effectDate)<86400) {
                      callback(UserStore.languages[`${intlPrefix}.effectdate.expirydate.requiredmsg`]);
                    } else {
                      this.props.form.setFieldsValue({expiryDate: this.props.form.getFieldValue('expiryDate')})
                      callback();
                    }
                  }}],
              validateFirst: true,
              // validateTrigger: 'onBlur',
            })(
              <DatePicker  onChange={this.onStartChange} disabledDate={this.disabledStartDate} value={startValue} style={{ width: inputWidth}} format="YYYY-MM-DD" allowClear={true} label={UserStore.languages[`${intlPrefix}.effectdate`]}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('expiryDate', {
              rules: [
                { validator: (rule, value, callback) => {
                    const effectDate = (new Date(this.props.form.getFieldValue('effectDate'))).getTime()
                    const expiryDate = (new Date(value)).getTime()
                    if (value && (expiryDate-effectDate)<86400) {
                      callback(UserStore.languages[`${intlPrefix}.effectdate.expirydate.requiredmsg`]);
                    } else {
                      this.props.form.setFieldsValue({effectDate: this.props.form.getFieldValue('effectDate')})
                      callback();
                    }
                  }}],
              validateFirst: true,
              // validateTrigger: 'onBlur',
            })(
              <DatePicker disabledDate={this.disabledEndDate} onChange={this.onEndChange} value={endValue} style={{ width: inputWidth }} format="YYYY-MM-DD" allowClear={true} label={UserStore.languages[`${intlPrefix}.expirydate`]}

              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('language', {
              rules: [{ required: true, message: UserStore.languages[`${intlPrefix}.languages`] }],
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                label={UserStore.languages[`${intlPrefix}.language`]}
                style={{ width: inputWidth }}
              >
                {lanOption}
              </Select>,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('industry', {
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

  changeLoginName=(e)=>{
    this.setState({
      changeLoginName:e.target.value
    })
  }
  changePassword=(e)=>{
    this.setState({
      changePassword:e.target.value
    })
  }

  renderSidebarContentRight() {
    const { intl } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { show, editData ,tempCheck,tempCheckEmail, clickEyes,changeLoginName,changePassword} = this.state;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };
    const inputWidth = 443;
    return (
      <Content
        className="sidebar-content"
        values={{ name: show === 'create' ? `${process.env.HEADER_TITLE_NAME || 'Choerodon'}` : `${editData.code}` }}
      >
        <Form>

          <FormItem
                {...formItemLayout}
                validateStatus={this.state.loginNameValidateStatus}
                help={this.state.loginNameValidateStatusText}
              >
                {getFieldDecorator('loginName', {
                  rules: [
                    {required: true,
                      whitespace: true,
                      message:UserStore.languages[`${intlPrefix}.loginName.required`],
                    },{
                      pattern: /^[A-Za-z0-9_-]+$/,
                      message: UserStore.languages[`${intlPrefix}.loginName.msg`],
                    }, {
                      validator: this.checkLoginName ,
                    }],
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                })(
                  <Input disabled={this.state.tenantTypeChoice ? false : true} onChange={(e)=>{this.changeLoginName(e)}} label={UserStore.languages[`${intlPrefix}.loginName`]} maxLength={15} required autoComplete="off" style={{ width: inputWidth }} />,
                )}
              </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('password', {
              rules: [
                {
                  required: true,
                  message:  UserStore.languages[`${intlPrefix}.password.required`],
                whitespace: true },
                {
                  pattern: /^(?=.*?[0-9])(?=.*?[a-z)(?=.*>[A-Z])(?!\d+$)[^\u4e00-\u9fa5]{8,}$/,
                  message: UserStore.languages[`${intlPrefix}.password.msg`],
                },
                ],
              validateTrigger: 'onBlur',
            })(
              <div>
                {clickEyes?
                  <div>
                    <Input
                      disabled={this.state.tenantTypeChoice ? false : true}
                      autoComplete="off"
                      label={UserStore.languages[`${intlPrefix}.password`]}
                      style={{ width: inputWidth }}
                      onChange={(e)=>{this.changePassword(e)}}
                    />
                    <Icon style={{ color: '#2196f3',  marginLeft: -25, marginTop: 10, cursor: 'pointer', position: 'relative', zIndex:'99999' }} type='quxiaoyincang' onClick={()=>{this.clickEyes('yincang')}}/>
                  </div>
                  :
                  <div>
                    <Input
                      disabled={this.state.tenantTypeChoice ? false : true}
                      label={UserStore.languages[`${intlPrefix}.password`]}
                      autocomplete="new-password"
                      type="password"
                      data-max-length="50"
                      tabindex="2"
                      spellcheck="false"
                      onChange={(e)=>{this.changePassword(e)}}
                      style={{ width: inputWidth }}
                    />
                    <Icon type='yincang' style={{ color: '#818999', marginLeft: -25, marginTop: 10, position: 'relative', cursor: 'pointer', zIndex:'999999'}} onClick={()=>{this.clickEyes('quxiaoyincang')}}/>
                  </div>
                }
              </div>
            )}
          </FormItem>

          {/* <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('ldap', {
            })(
              <div>
                <div>
                  <Switch defaultChecked={false} checked={tempCheck} onClick={this.handleClickSwitch.bind(this)} />
                  <span style={{ fontSize: 12, marginLeft: 12, color: '#04173F' }}>{UserStore.languages[`${intlPrefix}.useLDAP`]}</span>
                </div>
                {tempCheck?
                  <div style={{ width: 443, paddingTop: 10,paddingBottom: 10, border: '1px solid #FF919E', background:'#FFE6E8', display: 'flex', borderRadius: '4px', marginTop: 12 }}><Icon style={{flex: 0.01,color:'red',fontSize:15,marginTop:2, marginLeft: 10}} type='zhucedenglu-xinxishuru-cuowu'/><span style={{flex: 1,fontSize:12,color:"#818999",marginLeft:5}}>{UserStore.languages[`${intlPrefix}.ldap.cancel.content`]}</span></div>:
                  <div style={{ width: 443, paddingTop: 10,paddingBottom: 10, border: '1px solid #91CEFF', background: '#E6F4FF', display: 'flex', borderRadius: '4px', marginTop: 12 }}><Icon style={{flex: 0.01,color:'#2196f3',fontSize:18,marginTop:2, marginLeft: 10}} type='info'/><span style={{flex: 1,fontSize:12,color:"#818999",marginLeft:5}}>{UserStore.languages[`${intlPrefix}.ldap.content`]}</span></div>
                }
              </div>
            )}

          </FormItem> */}
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('sendEmail', {
            })(
              <div>
                <div>
                  <Switch defaultChecked={true} checked={tempCheckEmail} onClick={this.handleClickSwitchEmail.bind(this)} />
                  <span style={{ fontSize: 12, marginLeft: 12, color: '#04173F' }}>{UserStore.languages[`${intlPrefix}.useEmail`]}</span>
                </div>
                {tempCheckEmail?
                  <div style={{ width: 443, paddingTop: 10,paddingBottom: 10, border: '1px solid #FF919E', background:'#FFE6E8', display: 'flex', borderRadius: '4px', marginTop: 12 }}><Icon style={{flex: 0.01,color:'red',fontSize:15,marginTop:2, marginLeft: 10}} type='zhucedenglu-xinxishuru-cuowu'/><span style={{flex: 1,fontSize:12,color:"#818999",marginLeft:5}}>{UserStore.languages[`${intlPrefix}.email.cancel.content`]}</span></div>:
                  <div style={{ width: 443, paddingTop: 10,paddingBottom: 10,border: '1px solid #91CEFF', background: '#E6F4FF', display: 'flex', borderRadius: '4px', marginTop: 12 }}><Icon style={{flex: 0.01,color:'#2196f3',fontSize:18,marginTop:2, marginLeft: 10}} type='info'/><span style={{flex: 1,fontSize:12,color:"#818999",marginLeft:5}}>{UserStore.languages[`${intlPrefix}.email.content`]}</span></div>
                }
              </div>
            )}
          </FormItem>
          {
            this.props.form.getFieldsValue().typeCode==='ENTERPRISE'?(
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('tenantDns')(
                  <span>
                <div style={{ color: '#04173F', fontSize: 14,display: 'flex', alignItems: 'center', marginBottom: 15 }}><span style={{display: 'inline-block', background: '#2196f3', width: 3, height: 14, marginRight: 5}}></span>{UserStore.languages[`${intlPrefix}.personality`]}</div>
                <span>{UserStore.languages[`${intlPrefix}.domainMame`]}<span style={{color:'red'}}>*</span><Input disabled style={{width:'25%'}} type="text" value={this.props.form.getFieldsValue().code?this.props.form.getFieldsValue().code.toLowerCase():''}/>.{this.state.DnsUrl}</span>
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
    const { intl } = this.props;
    const {loadingBtn} = this.state;
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
        {/*<Header title={UserStore.languages[`${intlPrefix}.header.title`]}>*/}
        <Header title={UserStore.languages[`${intlPrefix}.create`]}
                backPath="/iam/organization"
        >
          <Permission service={['iam-service.organization.list']}>
            <Button
              onClick={this.handleSubmit}
              style={{ color: '#04173F' }}
              loading={loadingBtn}
            >
              <Icon type="baocun" style={{ color: '#2196F3', width: 25 }} />
              {UserStore.languages.save}
            </Button>
          </Permission>
        </Header>
        <Content>
          <div style={{display: 'flex', width: '100%'}}>
            <div style={{flex: 1}}>
              <div style={{ color: '#04173F', fontSize: 14,display: 'flex', alignItems: 'center', marginBottom: 15 }}><span style={{display: 'inline-block', background: '#2196f3', width: 3, height: 14, marginRight: 5}}></span>{UserStore.languages[`${intlPrefix}.orgInfo`]}</div>
              {this.renderSidebarContent()}
            </div>
            <div style={{flex: 1}}>
              <div style={{ color: '#04173F', fontSize: 14,display: 'flex', alignItems: 'center', marginBottom: 15 }}><span style={{display: 'inline-block', background: '#2196f3', width: 3, height: 14, marginRight: 5}}></span>{UserStore.languages[`${intlPrefix}.adminNum`]}</div>
              {this.renderSidebarContentRight()}
            </div>
          </div>
        </Content>
      </Page>
    );
  }
}

export default Form.create()(withRouter(injectIntl(OrganizationHome)));
