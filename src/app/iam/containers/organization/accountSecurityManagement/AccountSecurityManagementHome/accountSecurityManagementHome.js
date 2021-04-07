import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import {axios, Content, Header, Page, Permission, stores} from 'yqcloud-front-boot';
import {Button, Form, Input, Switch , Icon, Tooltip,message,Tabs,InputNumber,Checkbox,Modal,Radio,Table,Pagination,Popconfirm  } from 'yqcloud-ui';
import AccountSecurityManagementStore from '../../../../stores/organization/accountSecurityManagement';
import './accountSecurityManagement.scss'
import SettingLDAPHome from "./SettingLDAPHome";
import SSOHome from "./SSOHome";
import SettingLDAPStore from "../../../../stores/organization/settingLDAP";
import SSOConfigurationStore from "../../../../stores/organization/ssoConfiguration";

const intlPrefixs = 'global.accountSecurityManagement';
const TabPane = Tabs.TabPane;
const FormItem = Form.Item;
const { Search } = Input;
const InputGroup = Input.Group;
const RadioGroup = Radio.Group;

const EditableCell = ({ editable, value, onChange }) =>{

  return (
    <div>
      <Input
        style={{ margin: '-5px 0' }}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
};

@inject('AppState')
@observer
class AccountSecurityManagementHomes extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state={
      key:1,
      applicationNewArr:[],
      saveSubmitting:false,
      securitySettingChecked:false,
      securitySettingCheckedInitial:false,
      lockedExpireTime:'',
      lockedExpireTimeInitial:'',
      maxErrorTime:'',
      maxErrorTimeInitial:'',
      recentCount:'',
      recentCountInitial:'',
      passwordValidity:'',
      passwordValidityInitial:'',
      passwordMinLength:'',
      passwordMinLengthInitial:'',
      passwordMaxLength:'',
      passwordMaxLengthInitial:'',
      passwordLContainData:[],
      passwordFastCode:[],
      PasswordLContain:[],
      PasswordLContainInitial:[],
      formatCode:"",
      securitySettingVisible:false,
      LDAPVisible:false,
      SSOVisible:false,
      LDAPChecked:false,
      SSOChecked:false,
      isLoading: true,
      params: [],
      filters: {},
      endOpen: false,
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      dataSource: [],
      verifyField: [],
      showSyncInfo: false,
      showInitialRole: false,
      showRoleValue: [],
      ssoData: {}, // sso配置数据
      samlData: '', // SAML加密算法
      PasswordLContainNo:true,
      memberVisible:false,
      loginWayCode:'',
      loginWayCodeInitial:'',
      checkValues: new Set(),
      data: [],
      checkData:[],
      checkDataInitial:[],
      LoginSetUp:[],
      enableSize:0,
      totalPages:0,
    };
  }

  componentWillMount() {
    this.loadLanguage();
    this.getPasswordLContain();
  }

  componentDidMount() {
    this.securitySettingQuery();
    this.queryLDAP();
    this.getSsoConfigurationData();
    this.queryEnable();
    this.getLoginSetUp();
    this.getFreeLogins();
  }

  // 查询免密登录
  getFreeLogins = () =>{
    const { AppState } = this.props;
    AccountSecurityManagementStore.getFreeLogin(AppState.currentMenuType.organizationId).then((item)=>{
      if(item){
        this.setState({
          applicationNewArr:item,
          applicationNewArrOriginal:JSON.parse(JSON.stringify(item)) || [],
        })
      }
    })
  }

  // 查询成员
  queryEnable=()=>{
    const { AppState } = this.props;
    const { enableSize } = this.state;
    const { organizationId } = AppState.currentMenuType;
    axios.get(`/fnd/v1/${organizationId}/organizations/employee/login/untreated?loginWayCode=ACCOUNT&page=${enableSize}&size=10`).then(data=>{
      this.setState({
        data:data.result.content,
        totalPages:data.result.totalPages
      })
    });
  };

  // 登录设置快码
  getLoginSetUp =() =>{
    const code = 'FND_ACCOUNT_SETTING_TYPE';
    axios.get(`fnd/v1/${this.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          LoginSetUp: data
        })
      })
  };

  // 查询LDAP
  queryLDAP=() => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    SettingLDAPStore.queryLDAP(organizationId).then(((data) => {
      this.setState({
        LDAPChecked:data.enabled,
      });
    }));
  };


  // 查询sso配置
  getSsoConfigurationData = () => {
    SSOConfigurationStore.ssoConfigurationData(this.organizationId).then((data) => {
      if (data) {
        this.setState({
          SSOChecked:data.enabled,
        });
      }
    })
  };

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    AccountSecurityManagementStore.queryLanguage(id, AppState.currentLanguage);
  };

   // 查询密码策略
  getPasswordLContain = () => {
    axios.get(`iam/v1/organizations/${this.organizationId}/password_policies`).then(
      data => {
        if(data){
          this.setState({
            passwordLContainData: data,
            securitySettingChecked:data.enablePassword,
            securitySettingCheckedInitial:data.enablePassword,
            lockedExpireTime:data.lockedExpireTime,
            lockedExpireTimeInitial:data.lockedExpireTime,
            maxErrorTime:data.maxErrorTime,
            maxErrorTimeInitial:data.maxErrorTime,
            recentCount:data.recentCount,
            recentCountInitial:data.recentCount,
            passwordValidity:data.passwordValidity,
            passwordValidityInitial:data.passwordValidity,
            passwordMinLength:data.minLength,
            passwordMinLengthInitial:data.minLength,
            passwordMaxLength:data.maxLength,
            passwordMaxLengthInitial:data.maxLength,
            formatCode:data.formatCode,
            PasswordLContain:data.formatCode?data.formatCode.split(','):[],
            PasswordLContainInitial:data.formatCode?data.formatCode.split(','):[],
            loginWayCode:data.accountType,
            loginWayCodeInitial:data.accountType,
          })
        }

        if(data.accountType!=='ALL'&&data.accountType){
          axios.get(`/fnd/v1/${this.organizationId}/organizations/employee/login/${data.accountType}?loginWayCode=ACCOUNT`).then(item=>{
            const {checkValues} = this.state;
            item.result.forEach(itemA =>{
              checkValues.add(itemA)
            });
            this.setState({
              checkData:item.result,
              checkDataInitial:item.result,
              checkValues,
            })
          })
        }
      })
  };

  passwordLContainOnChange=(checkedValues)=>{
    const value = checkedValues.target.value;
    const checked = checkedValues.target.checked;
    const {PasswordLContain,PasswordLContainInitial} = this.state;
    if(checked){
      if(PasswordLContain.indexOf(value)<0){
        PasswordLContain.push(value)
      }
    }else {
      const index = PasswordLContain.indexOf(value);
      PasswordLContain.splice(index, 1)
    }

    let text = true;
    if(PasswordLContainInitial.length>0){
      PasswordLContainInitial.forEach((item,i)=>{
        if(PasswordLContain.indexOf(item)<0){
          text=false
        }
        if(i+1===PasswordLContainInitial.length){
          if(text){
            this.setState({
              PasswordLContainNo: true
            })
          }else {
            this.setState({
              PasswordLContainNo: false
            })
          }
        }
      });
    }

    if(PasswordLContainInitial.length<PasswordLContain.length){
      this.setState({
        PasswordLContainNo: false
      })
    }

    this.setState({
      PasswordLContain
    });
  };

  //  密码类型快码查询
  securitySettingQuery= () => {
    const code = "FND_PWD_POLICY";
    axios.get(`fnd/v1/${this.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          passwordFastCode: data
        })
      })
  };

  handleSubmitSecuritySetting=()=>{
    const { PasswordLContain } = this.state;
    if(PasswordLContain.indexOf('DIGIT')<0){
      PasswordLContain.push('DIGIT')
    }
    const typeArr=[];
    let enable = false;
    if(this.state.SSOChecked){
      typeArr.push('SSO')
    }
    if(this.state.LDAPChecked){
      typeArr.push('LDAP')
    }
    if(this.state.securitySettingChecked){
      typeArr.push('ACCOUNT');
      enable = true;
    }
    const userList = [];
    if(this.state.loginWayCode==='INCLUDE'||this.state.loginWayCode==='EXCEPT'){
      this.state.checkData.forEach(item=>{
        userList.push(item.userId)
      })
    }
    if(this.state.SSOChecked||this.state.LDAPChecked||this.state.securitySettingChecked){
      if(PasswordLContain.length<2){
        message.info(AccountSecurityManagementStore.languages[`${intlPrefixs}.ChooseTwoKinds`],undefined, undefined,'bottomLeft');
      }else {
        if(this.state.passwordMinLength>this.state.passwordMaxLength){
          message.info(`${AccountSecurityManagementStore.languages[`${intlPrefixs}.PasswordLengthPrompt`]}`,undefined, undefined,'bottomLeft');
        }else {
          const data={
            enablePassword:enable,
            type:typeArr.join(','),
            lockedExpireTime:this.state.lockedExpireTime,
            maxErrorTime:this.state.maxErrorTime,
            recentCount:this.state.recentCount,
            passwordValidity:this.state.passwordValidity,
            minLength:this.state.passwordMinLength,
            maxLength:this.state.passwordMaxLength,
            formatCode:PasswordLContain.join(','),
            accountType:this.state.loginWayCode,
            userIdList:userList,
            id:this.state.passwordLContainData.id?this.state.passwordLContainData.id:'',
            objectVersionNumber:this.state.passwordLContainData.objectVersionNumber?this.state.passwordLContainData.objectVersionNumber:''
          };
          axios.post(`iam/v1/organizations/${this.organizationId}/password_policies`,JSON.stringify(data)).then(
            datas => {
              if(datas){
                message.info(`${AccountSecurityManagementStore.languages[`save.success`]}`,undefined, undefined,'bottomLeft' );
                this.setState({
                  passwordLContainData: datas,
                  lockedExpireTime:data.lockedExpireTime,
                  lockedExpireTimeInitial:data.lockedExpireTime,
                  maxErrorTime:data.maxErrorTime,
                  maxErrorTimeInitial:data.maxErrorTime,
                  recentCount:data.recentCount,
                  recentCountInitial:data.recentCount,
                  passwordValidity:data.passwordValidity,
                  passwordValidityInitial:data.passwordValidity,
                  passwordMinLength:data.minLength,
                  passwordMinLengthInitial:data.minLength,
                  passwordMaxLength:data.maxLength,
                  passwordMaxLengthInitial:data.maxLength,
                  formatCode:data.formatCode,
                  securitySettingChecked:data.enablePassword,
                  securitySettingCheckedInitial:data.enablePassword,
                  PasswordLContain:data.formatCode?data.formatCode.split(','):[],
                  PasswordLContainInitial:data.formatCode?data.formatCode.split(','):[]
                });
                this.props.history.push(`/iam/accountSecurityManagement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
              }
            });
        }
      }
    }else {
      message.info(AccountSecurityManagementStore.languages[`${intlPrefixs}.OpenAKindOf`],undefined, undefined,'bottomLeft');
    }
  };

  cancleButton = ()=>{
    this.props.history.push(`/iam/accountSecurityManagement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
  };

  // 删除
  operationDelete=(record)=>{
    const {checkData}= this.state;
    const ArrChe = checkData.slice()
    ArrChe.splice(checkData.findIndex(item => item === record), 1);
    const { checkValues: inCheckValues } = this.state;
    inCheckValues.delete(record);
    this.setState({
      checkData:ArrChe,
      checkValues: inCheckValues
    })
  };

  // 账号密码渲染
  securitySetting=()=>{
    const columns = [{
      title: AccountSecurityManagementStore.languages[`${intlPrefixs}.employeeName`],
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 136,
    }, {
      title: AccountSecurityManagementStore.languages[`${intlPrefixs}.employeeName`],
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 136,

    }, {
      title: AccountSecurityManagementStore.languages[`${intlPrefixs}.employeeEmail`],
      dataIndex: 'email',
      key: 'email',
      width: 173,
    }, {
      title: AccountSecurityManagementStore.languages[`${intlPrefixs}.employeeOperation`],
      dataIndex: 'operation',
      key: 'operation',
      width: 100,
      render: (text, record) => (
        <div>
          <a onClick={()=>{this.operationDelete(record)}}>
            <Icon type="shanchu4" style={{color: '#2196F3',marginLeft:'10px'}}/>
          </a>
        </div>
      )
    }];

    const LoginSetUpOption = [];
    Array.isArray(this.state.LoginSetUp)?this.state.LoginSetUp.forEach(item=>{
      LoginSetUpOption.push(<Radio value={item.lookupValue}>{item.lookupMeaning}</Radio>)
    }):'';

    const {getFieldDecorator} = this.props.form;
    const fastCodeArr = this.state.formatCode?this.state.formatCode.split(','):[];
    const plainOptions = [];
    if(this.state.passwordFastCode.length>0){
      this.state.passwordFastCode.forEach(item=>{
        if(item.lookupValue==='DIGIT'){
          plainOptions.push(
            <Checkbox style={{display: 'inline-block',marginRight:'8px'}} value={item.lookupValue} onChange={this.passwordLContainOnChange} defaultChecked disabled >{item.lookupMeaning}</Checkbox>
          )
        }else {
          if(fastCodeArr.indexOf(item.lookupValue)> -1){
            plainOptions.push(
              <Checkbox style={{display: 'inline-block',marginRight:'8px'}} value={item.lookupValue} onChange={this.passwordLContainOnChange} defaultChecked >{item.lookupMeaning}</Checkbox>
            )
          }else {
            plainOptions.push(
              <Checkbox style={{display: 'inline-block',marginRight:'8px'}} value={item.lookupValue} onChange={this.passwordLContainOnChange} >{item.lookupMeaning}</Checkbox>
            )
          }
        }
      });
    };
    return(
      <div className="securitySetting">

        {/*<Alert style={{width:'470px',height:'42px'}} message={<span><Icon type="jingshi" style={{color: '#FF9500',fontSize:'16px'}}/><span style={{paddingLeft:'8px',verticalAlign: 'middle'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.WarningHintsOne`]}</span></span>} type="warning" />*/}

        <div style={{padding:'25px 0'}}><span><Switch checked={this.state.securitySettingChecked} onChange={this.AccountPasswordOnChange} /><span style={{paddingLeft:'14px',verticalAlign: 'sub'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.AccountPassword`]}</span></span></div>

        <Form>
          <FormItem>
            <div style={{display: 'inline-block',width:'95px'}}>
              <span style={{float:'left'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.PasswordLength`]}</span><span style={{color:'red'}}>*</span>
            </div>
            {getFieldDecorator('PasswordLength', {
              // rules: [{
              //   required: true, message: 'Please input your E-mail!',
              // }],
            })(
              <InputGroup style={{display: 'inline-block',width:'50%',verticalAlign: 'top'}} compact>
                <InputNumber disabled={this.state.securitySettingChecked?false:true} onChange={(value)=>{this.setState({passwordMinLength:value})}} value={this.state.passwordMinLength} min={8} precision={0} style={{ width: 65, textAlign: 'center' }} />
                <span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.reach`]}</span>
                <InputNumber disabled={this.state.securitySettingChecked?false:true} onChange={(value)=>{this.setState({passwordMaxLength:value})}} value={this.state.passwordMaxLength} min={8} precision={0} style={{ width: 65, textAlign: 'center', borderLeft: 0 }}/>
                <span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.position`]}</span>
              </InputGroup>
            )}
          </FormItem>

          <FormItem>
            <div style={{display: 'inline-block',width:'95px'}}>
              <span style={{float:'left'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.PasswordContains`]}</span><span style={{color:'red'}}>*</span>
            </div>
            {getFieldDecorator('PasswordLContain', {
              // rules: [{
              //   required: true, message: 'Please input your E-mail!',
              // }],
            })(
              <span>
                {plainOptions}
                <span style={{color:'#69758C',paddingLeft:'0',marginLeft:'-8px'}}>（{AccountSecurityManagementStore.languages[`${intlPrefixs}.ChooseTwoKinds`]}）</span>
              </span>
            )}
          </FormItem>

          <FormItem>
            <div style={{display: 'inline-block',width:'95px'}}>
              <span style={{float:'left'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.passwordValidity`]}</span><span style={{color:'red'}}>*</span>
            </div>
            {getFieldDecorator('passwordValidity', {
              // rules: [{
              //   required: true, message: 'Please input your E-mail!',
              // }],
            })(
              <InputGroup style={{display: 'inline-block',width:'50%',verticalAlign: 'top'}} compact>
                <InputNumber disabled={this.state.securitySettingChecked?false:true} onChange={(value)=>{this.setState({passwordValidity:value})}} value={this.state.passwordValidity} max={365} min={0} precision={0} style={{ width: 65, textAlign: 'center', borderLeft: 0 }}/>
                {/*<span>天</span><span style={{color:'#69758C'}}>（最长365天，“0”表示永不过期，过期后不可登录）</span>*/}
                <span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.day`]}</span><span style={{color:'#69758C'}}>（{AccountSecurityManagementStore.languages[`${intlPrefixs}.dayDescribe`]}）</span>
              </InputGroup>
            )}
          </FormItem>

          <FormItem>
            <div style={{display: 'inline-block',width:'95px'}}>
              {/*<span style={{float:'left'}}>历史密码检查</span>*/}
              <span style={{float:'left'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.recentCount`]}</span><span style={{color:'red'}}>*</span>
            </div>
            {getFieldDecorator('recentCount', {
              // rules: [{
              //   required: true, message: 'Please input your E-mail!',
              // }],
            })(
              <InputGroup style={{display: 'inline-block',width:'50%',verticalAlign: 'top'}} compact>
                {/*<span>禁止使用历史</span>*/}
                <span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.prohibit`]}</span>
                <InputNumber disabled={this.state.securitySettingChecked?false:true} onChange={(value)=>{this.setState({recentCount:value})}} max={24} value={this.state.recentCount} min={0} precision={0} style={{ width: 65, textAlign: 'center', borderLeft: 0 }}/>
                {/*<span>次密码</span><span style={{color:'#69758C'}}>（最大24，“0”表示不启用历史密码检查策略）</span>*/}
                <span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.secondPassword`]}</span><span style={{color:'#69758C'}}>（{AccountSecurityManagementStore.languages[`${intlPrefixs}.secondPasswordDescribe`]}）</span>
              </InputGroup>
            )}
          </FormItem>

          <FormItem>
            <div style={{display: 'inline-block',width:'95px'}}>
              {/*<span style={{float:'left'}}>密码重试次数</span>*/}
              <span style={{float:'left'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.maxErrorTime`]}</span><span style={{color:'red'}}>*</span>
            </div>
            {getFieldDecorator('maxErrorTime', {
              // rules: [{
              //   required: true, message: 'Please input your E-mail!',
              // }],
            })(
              <InputGroup style={{display: 'inline-block',width:'50%',verticalAlign: 'top'}} compact>
                <InputNumber disabled={this.state.securitySettingChecked?false:true} onChange={(value)=>{this.setState({maxErrorTime:value})}} value={this.state.maxErrorTime} min={0} precision={0} style={{ width: 65, textAlign: 'center', borderLeft: 0 }}/>
                {/*<span>次</span>*/}
                <span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.second`]}</span>
                <span style={{color:'#69758C'}}>（{AccountSecurityManagementStore.languages[`${intlPrefixs}.maxErrorTimeWarning`]}）</span>
              </InputGroup>
            )}
          </FormItem>

          <FormItem>
            <div style={{display: 'inline-block',width:'95px'}}>
              {/*<span style={{float:'left'}}>自动解锁时间</span>*/}
              <span style={{float:'left'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.lockedExpireTime`]}</span><span style={{color:'red'}}>*</span>
            </div>
            {getFieldDecorator('lockedExpireTime', {
              // rules: [{
              //   required: true, message: 'Please input your E-mail!',
              // }],
            })(
              <InputGroup style={{display: 'inline-block',width:'50%',verticalAlign: 'top'}} compact>
                <InputNumber disabled={this.state.securitySettingChecked?false:true} onChange={(value)=>{this.setState({lockedExpireTime:value})}} value={this.state.lockedExpireTime} min={0} precision={0} style={{ width: 65, textAlign: 'center', borderLeft: 0 }}/>
                {/*<span>分钟</span><span style={{color:'#69758C'}}>（如果设置为“0”，代表30分钟）</span>*/}
                <span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.Minute`]}</span><span style={{color:'#69758C'}}>（{AccountSecurityManagementStore.languages[`${intlPrefixs}.MinuteDescribe`]}）</span>
              </InputGroup>
            )}
          </FormItem>
        </Form>
        <div>
          <div style={{fontSize:'14px',height:'32px',lineHeight:'32px'}}>
            <span style={{borderLeft:'2px solid #2196f3',paddingLeft: '7px',fontWeight:'600'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.LoginMode`]}</span>
          </div>
          <div style={{height:'32px',lineHeight:'32px'}}>
            <RadioGroup name="radiogroup" onChange={(e)=>{this.setState({loginWayCode:e.target.value})}} style={{marginLeft:'7px'}} value={this.state.loginWayCode}>
              {LoginSetUpOption}
            </RadioGroup>
            {
              (this.state.loginWayCode==='INCLUDE'||this.state.loginWayCode==='EXCEPT')?(
                <Button onClick={()=>{this.setState({memberVisible:true})}}><Icon type="playlist_add" style={{ color: '#2196f3' }} />{AccountSecurityManagementStore.languages[`${intlPrefixs}.addEmployee`]}</Button>
              ):''
            }
          </div>
          <div style={{width:'450px'}}>
            {
              (this.state.loginWayCode==='INCLUDE'||this.state.loginWayCode==='EXCEPT')?(
                <Table
                  size="middle"
                  columns={columns}
                  filterBar={false}
                  // bordered
                  pagination={false}
                  dataSource={this.state.checkData}
                  scroll={{ y: 280 }}
                  rowKey={
                    record => record.organizationId
                  }
                />
              ):''
            }

          </div>

        </div>
        <div style={{paddingTop:'20px'}}>
          {(this.state.securitySettingCheckedInitial===this.state.securitySettingChecked)
          &&(this.state.passwordMinLength===this.state.passwordMinLengthInitial)
          &&(this.state.passwordMaxLength===this.state.passwordMaxLengthInitial)
          &&(this.state.loginWayCode===this.state.loginWayCodeInitial)
          &&(this.state.checkData===this.state.checkDataInitial)
          &&(this.state.passwordValidity===this.state.passwordValidityInitial)
          &&(this.state.recentCount===this.state.recentCountInitial)
          &&(this.state.maxErrorTime===this.state.maxErrorTimeInitial)
          &&(this.state.lockedExpireTime===this.state.lockedExpireTimeInitial)
          &&this.state.PasswordLContainNo
            ?(
              <Button
                style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff',opacity:0.5}}
                disabled
              >
                {AccountSecurityManagementStore.languages[`save`]}
              </Button>
            ):
            (!(Boolean(this.state.passwordMinLength))
              ||!Boolean(this.state.passwordMaxLength)
              ||(!Boolean(this.state.passwordValidity)&&this.state.passwordValidity!==0)
              ||(!Boolean(this.state.recentCount)&&this.state.recentCount!==0)
              ||(!Boolean(this.state.maxErrorTime)&&this.state.maxErrorTime!==0)
              ||(!Boolean(this.state.lockedExpireTime)&&this.state.lockedExpireTime!==0)
            ) ?
              (
                <Button
                  style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff',opacity:0.5}}
                  disabled
                >
                  {AccountSecurityManagementStore.languages[`save`]}
                </Button>
              ):
              (
                <Button
                  style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}}
                  onClick={this.handleSubmitSecuritySetting}
                >
                  {AccountSecurityManagementStore.languages[`save`]}
                </Button>
              )}

          <Button onClick={this.cancleButton} key="back" style={{border: '1px solid #ACB3BF',color: '#818999',marginLeft:'12px'}}>{AccountSecurityManagementStore.languages[`cancle`]}</Button>
        </div>
      </div>
    )
  };

  // 账号密码Modal确认
  // securitySettingModalHandleOk=()=>{
  //   this.setState({
  //     securitySettingChecked:true,
  //     // SSOChecked:false,
  //     securitySettingVisible:false
  //   })
  // };

  // 添加成员Modal确认
  memberModalHandleOk=()=>{
    this.setState({
      memberVisible:false,
      checkData:Array.from(this.state.checkValues)
    })
  };

  // 添加成员Modal取消
  onCancelModal=()=>{
    const { checkValues: inCheckValues,checkData } = this.state;
    Array.from(this.state.checkValues).forEach(data=>{
      if(checkData.indexOf(data)<0){
        inCheckValues.delete(data);
      }
    });
    this.queryEnable();
    this.setState({
      searchValue:'',
      checkValues: inCheckValues,
      memberVisible:false,
    })
  };

  // 账号密码开关
  AccountPasswordOnChange=(checked)=> {
    if(checked){
      this.setState({
        securitySettingChecked:true,
        // securitySettingVisible:true
      })
    }else {
      this.setState({
        securitySettingChecked:false
      })
    }
  };

  handleLDAP=(value)=>{
    this.setState({
      LDAPChecked:value,
    })
    // if(value){
    //   this.setState({
    //     SSOChecked:false
    //   })
    // }
  };

  handleSSO=(value)=>{
    this.setState({
      SSOChecked:value,
    });
      // if(value){
    //   this.setState({
    //     LDAPChecked:false,
    //     securitySettingChecked:false
    //   })
    // }
  };

  renderLeft = () => (
    <div style={{ height: '100%' }}>
      <div>
        <Search
          placeholder={AccountSecurityManagementStore.languages[`${intlPrefixs}.searchEmployee`]}
          enterButton
          value={this.state.searchValue}
          onSearch={(value) => {
            this.setState({enableSize:0});
            if(value){
              this.setState({searchValue:value});
              this.queryOnSearchEnable(value);
            }else {
              this.queryEnable();
            }

          }}
          onChange={(e) => {
            this.setState({
              searchValue: e.target.value,
            });
          }}
        />
      </div>
      <div className="left-main">
        {this.state.data.map(element => (
          <div className="left-item" key={element.employeeId}>
            <div className="item-left">
              <p>
                <span>{
                  element.employeeName
                }</span>
                <span>{element.employeeCode}</span>
              </p>
              <p>
                {element.email}
              </p>
            </div>
            <div className="item-right">
              <Checkbox
                checked={!!Array.from(this.state.checkValues)
                  .find((v => v.employeeId === element.employeeId))}
                onChange={(e) => {
                  const { checkValues } = this.state;
                  if (e.target.checked) {
                    checkValues.add(element);
                  } else {
                    checkValues.delete(element);
                  }
                  this.setState({ checkValues });
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{textAlign: 'center'}}>
        <Pagination style={{height:'28px',lineHeight:'28px'}} onChange={this.paginationLeft} simple defaultCurrent={1} current={this.state.enableSize+1} total={this.state.totalPages} />
      </div>
    </div>
  );

  paginationLeft=(e)=>{
    this.setState({
      enableSize:e-1,
    });
    this.querySizeEnable(e);
  };

  // 分页改变时查询成员
  querySizeEnable=(e)=>{
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    if(this.state.searchValue){
      axios.get(`/fnd/v1/${organizationId}/organizations/employee/login/untreated?loginWayCode=ACCOUNT&page=${e-1}&size=10&employeeName=${this.state.searchValue}`).then(data=>{
        this.setState({
          data:data.result.content,
          totalPages:data.result.totalPages
        })
      });
    }else {
      axios.get(`/fnd/v1/${organizationId}/organizations/employee/login/untreated?loginWayCode=ACCOUNT&page=${e-1}&size=10`).then(data=>{
        this.setState({
          data:data.result.content,
          totalPages:data.result.totalPages
        })
      });
    }

  };

  // 搜索时查询成员
  queryOnSearchEnable=(value)=>{
    const { AppState } = this.props;
    this.setState({
      enableSize:0,
    });
    const { organizationId } = AppState.currentMenuType;
    axios.get(`/fnd/v1/${organizationId}/organizations/employee/login/untreated?loginWayCode=ACCOUNT&page=0&size=10&employeeName=${value}`).then(data=>{
      this.setState({
        data:data.result.content,
        totalPages:data.result.totalPages
      })
    });
  };

  renderRight = () => {
    const { checkValues } = this.state;
    return (
      <div>
        <div className="right-top">
          <span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.haveChosenEmployee`]}</span>
          <span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.haveChosen`]}{checkValues.size}{AccountSecurityManagementStore.languages[`${intlPrefixs}.individual`]}</span>
        </div>
        <div className="left-main">
          {Array.from(checkValues)
            .map(element => (
              <div className="left-item" key={element.employeeId}>
                <div className="item-left">
                  <p>
                    <span>{element.employeeName}</span>
                    <span>{element.employeeCode}</span>
                  </p>
                  <p>
                    {element.email}
                  </p>
                </div>
                <div className="item-right">
                  <Icon
                    type="yizhongzhi"
                    style={{
                      fontSize: 16,
                      right: 10,
                      color: '#B8BECC',
                    }}
                    onClick={() => {
                      const { checkValues: inCheckValues } = this.state;
                      inCheckValues.delete(element);
                      this.setState({ checkValues: inCheckValues });
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  renderColumns(text, record, column) {
    return (
      <EditableCell
        editable={record.editable}
        value={text}
        onChange={value => this.handleChange(value, record, column)}
      />
    );
  }

  handleChange(value, record, column) {
    const newData = this.state.applicationNewArr;
    const target = this.recordData(record,newData);
    if (target) {
      target[column] = value;
      this.setState({ applicationNewArr: newData });
    }
  }

  // 添加应用
  addApplication = () =>{
    const { AppState } = this.props;
    let { key,applicationNewArr }=this.state;
    if(applicationNewArr){
      const newApp = {
        key:key,
        applicationCode:'',
        iamOrganizationId: AppState.currentMenuType.organizationId,
        accessTokenUrl:'',
        corpid:'',
        corpsecret:'',
        authorizeInfoUrl:'',
        redirectUrl:'',
        enabled:true,
      };
      applicationNewArr.push(newApp);
      this.setState({
        applicationNewArr,
        key:key+1,
      })
    }else {
      applicationNewArr = [
        {
          key:key,
          applicationCode:'',
          accessTokenUrl:'',
          iamOrganizationId: AppState.currentMenuType.organizationId,
          corpid:'',
          corpsecret:'',
          authorizeInfoUrl:'',
          redirectUrl:'',
          enabled:true,
        }
      ];

      this.setState({
        applicationNewArr,
        key:key+1,
      })
    }
  };

  recordData = (record, data) =>{
    let arr;
    for( var i in data){
      if(data[i]===record){
        arr = data[i]
        break
      }
    }
    return arr
  };

  deleteRecord(record) {
    let newData = this.state.applicationNewArr;
    const target = this.recordData(record,newData);
    const deleteArr = [];
    const deleteArrCopy = [];
    newData.forEach(item=>{
      if(target!==item){
        deleteArr.push(item)
      }else {
        item.deleted = true
        deleteArrCopy.push(item)
      }
    });
    if (target) {
      this.setState({
        applicationNewArr: deleteArr ,
        deleteAppArr: deleteArrCopy,
      });
    }
  }

  handleSubmit_tabFour=()=>{
    const { AppState } = this.props;
    const { deleteAppArr } = this.state;
    this.setState({saveSubmitting:true})
    const data = JSON.parse(JSON.stringify(this.state.applicationNewArr||''))||[];
    data.push(...JSON.parse(JSON.stringify(deleteAppArr||'')) || [])
    let isRepeat = false;
    this.state.applicationNewArr.forEach((item_i,i)=>{
      this.state.applicationNewArr.forEach((item_j,j)=>{
        if(item_i.applicationCode===item_j.applicationCode&&i!==j){
          isRepeat=true
        }
      })
    })
    if(isRepeat){
      Choerodon.prompt(AccountSecurityManagementStore.languages[`${intlPrefixs}.codeRepeat`])
    }else {
      AccountSecurityManagementStore.saveFreeLogin(AppState.currentMenuType.organizationId,data).then(item=>{
        if(item){
          this.getFreeLogins()
          this.setState({saveSubmitting:false})
          Choerodon.prompt(AccountSecurityManagementStore.languages[`save.success`])
        }
      })
    }

  }

  cancle_tabFour=()=>{
    const {applicationNewArrOriginal}=this.state;
    this.setState({
      applicationNewArr:JSON.parse(JSON.stringify(applicationNewArrOriginal)) || []
    })
  }

  // 停用
  disabledAccess=(record)=>{
    const newData = this.state.applicationNewArr;
    const target = this.recordData(record,newData);
    if (target) {
      target.enabled = false;
      this.setState({ applicationNewArr: newData });
    }
  }

  // 启用
  deactivation=(record)=>{
    const newData = this.state.applicationNewArr;
    const target = this.recordData(record,newData);
    if (target) {
      target.enabled = true;
      this.setState({ applicationNewArr: newData });
    }
  }

  freeLogin=()=>{
    let isNullRecord = false;
    const newData = this.state.applicationNewArr;
    if(newData&&newData.length>0){
      newData.forEach(item=>{
        if((!item.applicationCode)||(!item.accessTokenUrl)||(!item.corpid)||(!item.corpsecret)||(!item.authorizeInfoUrl)||(!item.redirectUrl)){
          isNullRecord = true;
        }
      })
    }

    const columns = [{
      title: <span><span style={{color:'#F8353F'}}>*</span><span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.code`]}</span></span>,
      dataIndex: 'applicationCode',
      render: (text, record) => this.renderColumns(text, record, 'applicationCode'),
    }, {
      title: <span><span style={{color:'#F8353F'}}>*</span><span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.tokenUrl`]}</span></span>,
      dataIndex: 'accessTokenUrl',
      render: (text, record) => this.renderColumns(text, record, 'accessTokenUrl'),
    }, {
      title: <span><span style={{color:'#F8353F'}}>*</span><span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.enterpriseId`]}</span></span>,
      dataIndex: 'corpid',
      render: (text, record) => this.renderColumns(text, record, 'corpid'),
    }, {
      title: <span><span style={{color:'#F8353F'}}>*</span><span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.enterpriseCode`]}</span></span>,
      dataIndex: 'corpsecret',
      render: (text, record) => this.renderColumns(text, record, 'corpsecret'),
    },  {
      title: <span><span style={{color:'#F8353F'}}>*</span><span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.codeUrl`]}</span></span>,
      dataIndex: 'authorizeInfoUrl',
      render: (text, record) => this.renderColumns(text, record, 'authorizeInfoUrl'),
    },  {
      title: <span><span style={{color:'#F8353F'}}>*</span><span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.callbackUrl`]}</span></span>,
      dataIndex: 'redirectUrl',
      render: (text, record) => this.renderColumns(text, record, 'redirectUrl'),
    }, {
      title: AccountSecurityManagementStore.languages[`${intlPrefixs}.operation`],
      dataIndex: 'operation',
      render: (text, record) => {
        return (
          <div className="editable-row-operations">
            {
              record.enabled?(
                <Tooltip title={AccountSecurityManagementStore.languages[`${intlPrefixs}.disabledNo`]}>
                  <Button
                    icon="jinyongzhuangtai"
                    style={{
                      cursor: 'pointer',
                    }}
                    size="small"
                    shape="circle"
                    disabled={false}
                    onClick={()=>this.disabledAccess(record)}
                  />
                </Tooltip>
              ):(
                <Tooltip title={AccountSecurityManagementStore.languages[`${intlPrefixs}.disabledYse`]}>
                  <Button
                    key="disable"
                    size="small"
                    icon="yijieshu"
                    shape="circle"
                    disabled={false}
                    style={{ cursor: 'pointer', color: '#2196F3' }}
                    onClick={()=>this.deactivation(record)}
                  />
                </Tooltip>
              )
            }

            <Tooltip title={AccountSecurityManagementStore.languages[`.delete`]}>
              <Popconfirm
                title={AccountSecurityManagementStore.languages[`${intlPrefixs}.IsdisabledYse`]}
                onConfirm={() => this.deleteRecord(record)}
                cancelText={AccountSecurityManagementStore.languages[`.cancle`]}
                okText={AccountSecurityManagementStore.languages[`.ok`]}
              >
                <Button
                  key="disable"
                  size="small"
                  icon="delete-surface"
                  shape="circle"
                  disabled={false}
                  style={{ cursor: 'pointer', color: '#2196F3' }}
                />
              </Popconfirm>
            </Tooltip>
          </div>
        );
      },
    }];

    return (
      <div>
        <span
          style={{
            fontSize: '16px',
            color: '#04173F',
            paddingLeft: '7px',
            borderLeft: '2px solid #2196F3 ',
            // marginBottom:'16px',
          }}
        >
        <span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.appManagement`]}</span>
          <Tooltip title={AccountSecurityManagementStore.languages[`${intlPrefixs}.newEstablish`]}>
            <Button
              style={{
                marginLeft: '8px' ,
                height:'22px',
                lineHeight: '22px'
              }}
              onClick={this.addApplication}
            >
              <Icon type="tianjia2" style={{ color: '#8C8C8C' }} />
            </Button>
          </Tooltip>
        </span>
        <Table
          className="accountSecurity_table"
          filterBar={false}
          dataSource={this.state.applicationNewArr}
          columns={columns}
        />

        <div
          style={{
            marginTop:'30px'
          }}
        >
          {isNullRecord?(
            <Button
              style={{
                background:'#2196F3 ',
                border: '1px solid #2196F3',
                color: '#fff',
                opacity:'0.5'
              }}
              disabled={true}
            >
              {AccountSecurityManagementStore.languages.save}
            </Button>
          ):(
            <Button
              onClick={this.handleSubmit_tabFour}
              loading={this.state.saveSubmitting}
              style={{
                background:'#2196F3 ',
                border: '1px solid #2196F3',
                color: '#fff'
              }}
            >
              {AccountSecurityManagementStore.languages.save}
            </Button>
          )}
          <Button
            onClick={this.cancle_tabFour}
            style={{
              border: '1px solid #ACB3BF',
              color: '#818999',
              marginLeft:'12px'
            }}
          >
            {AccountSecurityManagementStore.languages[`cancle`]}
          </Button>
        </div>
      </div>
    )
  }

  render() {
    return(
      <Page className="AccountSecurityManagement">
        <Header title={AccountSecurityManagementStore.languages[`${intlPrefixs}.AccountSecurity`]}>
        </Header>
        <Content>
          <Tabs defaultActiveKey="1" >
            <TabPane tab={AccountSecurityManagementStore.languages[`${intlPrefixs}.AccountPassword`]} key="1">
              {this.securitySetting()}
              <Modal
                className="securitySettingModal"
                title={AccountSecurityManagementStore.languages[`${intlPrefixs}.employeeInformation`]}
                visible={this.state.memberVisible}
                onOk={this.memberModalHandleOk}
                onCancel={this.onCancelModal}
                center
                footer={[
                  <Button key="back" style={{border: '1px solid #A3ACBF',color: '#69758C'}}  onClick={this.onCancelModal}>{AccountSecurityManagementStore.languages[`cancle`]}</Button>,
                  <Button key="submit" type="primary" style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}} onClick={this.memberModalHandleOk}>{AccountSecurityManagementStore.languages[`ok`]}</Button>,
                ]}
              >
                <div style={{width:'100%',paddingTop:'14px',display: 'flex'}}>
                  <div className='search-left'>
                    {this.renderLeft()}
                  </div>
                  <div className='search-right'>
                    {this.renderRight()}
                  </div>
                </div>
              </Modal>
              {/*<Modal*/}
                {/*className="AccountSecurityManagement_Modal"*/}
                {/*title={<span><Icon type="fuwuzhongxin-2" style={{color: '#FF9500',fontSize:'22px'}}/><span style={{fontSize: '16px',color: '#04173F',lineHeight: '24px',paddingLeft:'14px',verticalAlign: 'middle'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.EnableAccountPassword`]}</span></span>}*/}
                {/*visible={this.state.securitySettingVisible}*/}
                {/*onOk={this.securitySettingModalHandleOk}*/}
                {/*onCancel={()=>{this.setState({securitySettingVisible:false})}}*/}
                {/*center*/}
                {/*footer={[*/}
                  {/*<Button key="back" style={{border: '1px solid #A3ACBF',color: '#69758C'}}  onClick={()=>{this.setState({securitySettingVisible:false})}}>{AccountSecurityManagementStore.languages[`cancle`]}</Button>,*/}
                  {/*<Button key="submit" type="primary" style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}} onClick={this.securitySettingModalHandleOk}>{AccountSecurityManagementStore.languages[`ok`]}</Button>,*/}
                {/*]}*/}
              {/*>*/}
                {/*<p style={{fontSize: '14px',color: '#818999',lineHeight: '22px',padding:'14px 0  14px 37px'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.EnableAccountPasswordWarning`]}</p>*/}
              {/*</Modal>*/}
            </TabPane>

            <TabPane tab={AccountSecurityManagementStore.languages[`${intlPrefixs}.LDAPAuthentication`]} key="2">
              <SettingLDAPHome handleLDAP={this.handleLDAP.bind(this)} SSOChecked={this.state.SSOChecked} securitySettingChecked={this.state.securitySettingChecked} />
            </TabPane>

            <TabPane tab={AccountSecurityManagementStore.languages[`${intlPrefixs}.SSOSignIn`]} key="3">
              <SSOHome handleSSO={this.handleSSO.bind(this)} LDAPChecked={this.state.LDAPChecked} securitySettingChecked={this.state.securitySettingChecked} />

            </TabPane>
            <TabPane tab='免密登录' key="4">
              {this.freeLogin()}
            </TabPane>
          </Tabs>
        </Content>
      </Page>
    )
  }
}

const AccountSecurityManagementHome = Form.create()(AccountSecurityManagementHomes);

export default withRouter(injectIntl(AccountSecurityManagementHome));
