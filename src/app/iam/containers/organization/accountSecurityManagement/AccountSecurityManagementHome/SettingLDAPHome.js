import React, { Component } from 'react';
import {Button, Form, Input, Switch , Select, Icon, Alert,message,Popover,Pagination,Checkbox,Modal,Table,Radio} from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { axios, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import SettingLDAPStore from '../../../../stores/organization/settingLDAP';
import AccountSecurityManagementStore from "../../../../stores/organization/accountSecurityManagement";
import "./LDAP.scss"

const intlPrefix = 'organization.settingLDAP';

const intlPrefixs = 'global.accountSecurityManagement';
const FormItem = Form.Item;
const { Option } = Select;
const { Search } = Input;
const RadioGroup = Radio.Group;
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


function noop() {
}
@inject('AppState')
@observer
class SettingLDAPHome extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
  }

  state=this.getInitState();

  getInitState() {
    return {
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
      isLDAP: false,
      edit: !!this.props.match.params.id,
      roleIdType: [],
      verifyField: [],
      showSyncInfo: false,
      showInitialRole: false,
      showRoleValue: [],
      LDAPVisible:false,
      LDAPChecked:false,
      LDAPCheckedInitial:false,
      principalTenantChecked:false,
      passwordOnly:'readonly',
      accountOnly:'readonly',
      parentOrganizationCodeText:true,
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
    this.getLDAPVerifyField();
    this.queryLDAPOrg();
    this.queryRoleId();
    this.loadLanguage();
    this.fetch(this.props);
    this.queryEnable();
    this.getLoginSetUp();
    this.setState({
      SSOChecked:this.props.SSOChecked,
      securitySettingChecked:this.props.securitySettingChecked,
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      SSOChecked: nextProps.SSOChecked,
      securitySettingChecked: nextProps.securitySettingChecked
    });
    // if(nextProps.SSOChecked){
    //   this.setState({
    //     LDAPChecked:false,
    //   });
    // }
  }

  // 查询成员
  queryEnable=()=>{
    const { AppState } = this.props;
    const { enableSize } = this.state;
    const { organizationId } = AppState.currentMenuType;
    axios.get(`/fnd/v1/${organizationId}/organizations/employee/login/untreated?loginWayCode=LDAP&page=${enableSize}&size=10`).then(data=>{
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

  // 获取语言LDAP
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    SettingLDAPStore.queryLanguage(id, AppState.currentLanguage);
  };

  fetch() {
    // 获取类型数据
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    this.queryLDAP();
  }

  // 更新页面数据
  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.getLDAPVerifyField();
      this.queryLDAP();
      this.queryLDAPOrg();
      this.queryRoleId();
    });
  };

  // 查询是否为LDAP组织
  queryLDAPOrg=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    // return axios.get(`/iam/v1/organizations/${organizationId}`).then((data) => {
    return axios.get(`/iam/v1/${organizationId}/organizations`).then((data) => {
      this.setState({
        isLDAP: data.ldap,
      });
    });
  };

  // 查询角色
  queryRoleId=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    return axios.post(`/iam/v1/${organizationId}/roles/list`).then((data) => {
      this.setState({
        roleIdType: data,
      });
    });
  };

  // 查询LDAP
  queryLDAP=() => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    SettingLDAPStore.queryLDAP(organizationId).then(((data) => {
      this.setState({
        principalTenantChecked:data.parentOrganizationCode?true:false,
        dataSource: data,
        LDAPChecked:data.enabled,
        LDAPCheckedInitial:data.enabled,
        parentOrganizationCode:data.parentOrganizationCode,
        parentOrganizationCodeInitial:data.parentOrganizationCode,
        loginWayCode:data.accountType,
        loginWayCodeInitial:data.accountType,
      });

      if(data.accountType!=='ALL'&&data.accountType){
        axios.get(`/fnd/v1/${this.organizationId}/organizations/employee/login/${data.accountType}?loginWayCode=LDAP`).then(item=>{
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

      this.props.handleLDAP(data.enabled);
      // 同步数据有值才会展现
      if (data.loginNameField || data.realNameField || data.emailField || data.phoneField || data.syncField || data.roleId) {
        this.setState({
          showSyncInfo: true,
          showInitialRole: true,
        })
      }
    }));
  };

  // 获取LDAP验证字段
  getLDAPVerifyField = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    SettingLDAPStore.getSourceCode(organizationId, 'FND_LDAP_VERIFY').then((data) => {
      this.setState({
        verifyField: data,
      });
    })
  };

  // LDAP提交
  handleSubmitLdap = (e) => {
    const typeArr=[];
    let enable = false;
    if(this.state.SSOChecked){
      typeArr.push('SSO')
    }
    if(this.state.LDAPChecked){
      typeArr.push('LDAP');
    }
    if(this.state.securitySettingChecked){
      typeArr.push('ACCOUNT')
    }
    const userList = [];
    if(this.state.loginWayCode==='INCLUDE'||this.state.loginWayCode==='EXCEPT'){
      this.state.checkData.forEach(item=>{
        userList.push(item.userId)
      })
    }
    if(this.state.SSOChecked||this.state.LDAPChecked||this.state.securitySettingChecked){
      e.preventDefault();
      this.props.form.validateFieldsAndScroll((err, data, modify) => {
        if(this.state.LDAPChecked){
          data.enabled=true;
        }else {
          data.enabled=false;
        }
        if(!this.state.showSyncInfo){
          data.loginNameField='';
          data.realNameField='';
          data.emailField='';
          data.phoneField='';
          data.syncField='';
          data.invalidField='';
          data.roleId=null;
        }
        if(this.state.LDAPChecked){
          if (!err||!(err.account||err.baseDn||err.ldapAttributeName||err.loginFieldCode||err.password||err.roleId||err.serverAddress)) {
            const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
            const { organizationId } = AppState.currentMenuType;
            const { dataSource } = this.state;
            data.port = '389';
            data.objectClass = 'person';
            data.accountType=this.state.loginWayCode;
            data.userIdList=userList;
            data.type=typeArr.join(',');
            if(!data.parentOrganizationCode){
              data.parentOrganizationCode = this.state.parentOrganizationCode;
            }
            // console.log(data);
            // console.log('dataSource', dataSource);
            if (dataSource.id) {
              data.objectVersionNumber = dataSource.objectVersionNumber;
              // if (!modify && this.state.LDAPChecked===this.state.LDAPCheckedInitial) {
              //   Choerodon.prompt(SettingLDAPStore.languages['modify.success']);
              //   // this.props.history.push(`/iam/accountSecurityManagement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
              //   OnUnchangedSuccess();
              //   return;
              // }
              SettingLDAPStore.updateOrgLDAP(organizationId, dataSource.id,
                { ...data }).then(({ failed, message }) => {
                if (failed) {
                  Choerodon.prompt(message);
                  onError();
                } else {
                  Choerodon.prompt(SettingLDAPStore.languages['modify.success']);
                  this.props.history.push(`/iam/accountSecurityManagement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
                  this.handleRefresh();
                  onSuccess();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              SettingLDAPStore.createLDAP(organizationId,
                { ...data }).then(({ failed, message }) => {
                if (failed) {
                  Choerodon.prompt(message);
                  onError();
                } else {
                  Choerodon.prompt(SettingLDAPStore.languages['create.success']);
                  this.props.history.push(`/iam/accountSecurityManagement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
                  this.handleRefresh();
                  onSuccess();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            }
          } else {
            message.warning(SettingLDAPStore.languages['account.configuration.please.enter.required.fields'],undefined, undefined,'bottomLeft');
          }
        }else {
          const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
          const { organizationId } = AppState.currentMenuType;
          const { dataSource } = this.state;
          data.port = '389';
          data.objectClass = 'person';
          data.accountType=this.state.loginWayCode;
          data.userIdList=userList;
          data.type=typeArr.join(',');
          if(!data.parentOrganizationCode){
            data.parentOrganizationCode = this.state.parentOrganizationCode;
          }
          // console.log(data);
          // console.log('dataSource', dataSource);
          if (dataSource.id) {
            data.objectVersionNumber = dataSource.objectVersionNumber;
            // if (!modify && this.state.LDAPChecked===this.state.LDAPCheckedInitial) {
            //   Choerodon.prompt(SettingLDAPStore.languages['modify.success']);
            //   // this.props.history.push(`/iam/accountSecurityManagement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
            //   OnUnchangedSuccess();
            //   return;
            // }
            SettingLDAPStore.updateOrgLDAP(organizationId, dataSource.id,
              { ...data }).then(({ failed, message }) => {
              if (failed) {
                Choerodon.prompt(message);
                onError();
              } else {
                Choerodon.prompt(SettingLDAPStore.languages['modify.success']);
                this.props.history.push(`/iam/accountSecurityManagement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
                this.handleRefresh();
                onSuccess();
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
            });
          } else {
            SettingLDAPStore.createLDAP(organizationId,
              {...data}).then(({failed, message}) => {
              if (failed) {
                Choerodon.prompt(message);
                onError();
              } else {
                Choerodon.prompt(SettingLDAPStore.languages['create.success']);
                this.props.history.push(`/iam/accountSecurityManagement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
                this.handleRefresh();
                onSuccess();
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
            });
          }
        }
      });
    }else {
      message.info(AccountSecurityManagementStore.languages[`${intlPrefixs}.OpenAKindOf`],undefined, undefined,'bottomLeft');
    }

  };
  //
  // // 连接测试
  // handleConnectionTest = () => {
  //   const { AppState } = this.props;
  //   const { organizationId } = AppState.currentMenuType;
  //   SettingLDAPStore.connectionTest(organizationId).then((data) => {
  //     if (data.success === false) {
  //       //
  //     } else {
  //       if (data.result.data) {
  //         message.success(SettingLDAPStore.languages[`${intlPrefix}.connectTest.succ.msg`]);
  //       } else {
  //         message.error(SettingLDAPStore.languages[`${intlPrefix}.connectTest.fail.msg`]);
  //       }
  //     }
  //   })
  // };

  // 连接测试
  handleConnectionTest = () => {
    const { AppState } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!err||!(err.account||err.baseDn||err.ldapAttributeName||err.loginFieldCode||err.password||err.roleId||err.serverAddress)) {
        const {AppState} = this.props;
        const {organizationId} = AppState.currentMenuType;
        data.port = '389';
        data.objectClass = 'person';
        data.organizationId = organizationId;
        SettingLDAPStore.connectionTestData(organizationId,data).then((datas) => {
          if (datas.success === false) {
            //
          } else {
            if (datas.result.data) {
              message.success(SettingLDAPStore.languages[`${intlPrefix}.connectTest.succ.msg`],undefined, undefined,'bottomLeft');
            } else {
              message.error(SettingLDAPStore.languages[`${intlPrefix}.connectTest.fail.msg`],undefined, undefined,'bottomLeft');
            }
          }
        })
      }
    });

  };

  // 初始化角色受控于同步数据
  handleShowInitialRole = (e) => {
    const { showRoleValue } = this.state;
    if (e.target.value) {
      showRoleValue.push(e.target.value);
      this.setState({
        showRoleValue,
      })
    } else {
      showRoleValue.splice(showRoleValue.findIndex(v => v === e.target.value), 1);
      this.setState({
        showRoleValue,
      })
    }
  };

  // LDAP开关
  LDAPCheckedOnChange=(checked)=>{
    if(checked){
      this.setState({
        LDAPChecked:true,
      })
    }else {
      this.props.handleLDAP(false);
      this.setState({
        LDAPChecked:false
      })
    }
  };

  // // LDAP Modal确认
  // LDAPModalHandleOk =()=>{
  //   this.props.handleLDAP(true);
  //   this.setState({
  //     LDAPChecked:true,
  //     // SSOChecked:false,
  //     LDAPVisible:false
  //   })
  // };

  // 返回
  cancleButton = ()=>{
    this.props.history.push(`/iam/accountSecurityManagement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
  };

  // 校验主租户code
  checkPrincipalTenantCode = () =>{
    if(this.props.form.getFieldsValue().parentOrganizationCode){
      SettingLDAPStore.checkPrincipalTenantCode(this.organizationId,this.props.form.getFieldsValue().parentOrganizationCode).then(data=>{
        if(!data.failed){
          if(data){
            data.id = this.state.dataSource.id;
            data.roleId = this.state.dataSource.roleId;
            this.props.form.setFieldsValue({
              account:data.account,
              password:data.password,
              serverAddress:data.serverAddress,
              ldapAttributeName:data.ldapAttributeName,
              useSsl:data.useSsl+'',
              baseDn:data.baseDn,
              loginFieldCode:data.loginFieldCode,
              enabled:data.enabled,
              name:data.name,
              loginNameField:data.loginNameField,
              realNameField:data.realNameField,
              emailField:data.emailField,
              phoneField:data.phoneField,
              syncField:data.syncField,
              invalidField:data.invalidField,
            });
            this.setState({
              dataSource: data,
              parentOrganizationCodeText:true,
              parentOrganizationCode:this.props.form.getFieldsValue().parentOrganizationCode
            });
            // 同步数据有值才会展现
            if (data.loginNameField || data.realNameField || data.emailField || data.phoneField || data.syncField || data.roleId) {
              this.setState({
                showSyncInfo: true,
                showInitialRole: true,
              })
            }else {
              this.setState({
                showSyncInfo: false,
                showInitialRole: false,
              })
            }
          }else {
            message.info(SettingLDAPStore.languages[`${intlPrefix}.checkInfo`],undefined, undefined,'bottomLeft');
          }
        }
      })
    }

  };

  principalTenantOnchange = e =>{
    this.setState({
      principalTenantChecked:e.target.checked,
    });
    this.props.form.setFieldsValue({
      account:'',
      password:'',
      serverAddress:'',
      ldapAttributeName:'',
      useSsl:'',
      baseDn:'',
      loginFieldCode:'',
      enabledShow:false,
      name:'',
      loginNameField:'',
      realNameField:'',
      emailField:'',
      phoneField:'',
      syncField:'',
      invalidField:'',
    });
    if(!e.target.checked){
      const id = this.state.dataSource.id?this.state.dataSource.id:'';
      this.setState({
        dataSource:{
          id
        },
        showSyncInfo:false,
        parentOrganizationCode:''
      });
    }
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
        <Pagination style={{height:'28px',lineHeight:'28px'}} onChange={this.paginationLeft} simple defaultCurrent={1} total={this.state.totalPages} />
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
      axios.get(`/fnd/v1/${organizationId}/organizations/employee/login/untreated?loginWayCode=LDAP&page=${e-1}&size=10&employeeName=${this.state.searchValue}`).then(data=>{
        this.setState({
          data:data.result.content,
        })
      });
    }else {
      axios.get(`/fnd/v1/${organizationId}/organizations/employee/login/untreated?loginWayCode=LDAP&page=${e-1}&size=10`).then(data=>{
        this.setState({
          data:data.result.content,
        })
      });
    }

  };

  // 搜索时查询成员
  queryOnSearchEnable=(value)=>{
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    axios.get(`/fnd/v1/${organizationId}/organizations/employee/login/untreated?loginWayCode=LDAP&page=0&size=10&employeeName=${value}`).then(data=>{
      this.setState({
        data:data.result.content,
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

    this.setState({
      checkValues: inCheckValues,
      memberVisible:false,
    })
  };

  render() {
    const { AppState, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { dataSource, isLDAP, roleIdType, verifyField, showSyncInfo, showInitialRole, showRoleValue,parentOrganizationCodeText } = this.state;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
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

    return (
      <div className="LDAP_AS">

        <div style={{padding:'25px 0'}}><span><Switch checked={this.state.LDAPChecked} onChange={this.LDAPCheckedOnChange} /><span style={{paddingLeft:'14px',verticalAlign: 'sub'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.LDAPAuthentication`]}</span></span></div>

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

        <div style={{ width: '400px', height: '675px', display: 'inline-block', marginRight: '4%' }}>

          <Form layout="vertical">
            <FormItem
              {...formItemLayout}
              style={{display: 'inline-block',width:'120px' }}
            >
              {getFieldDecorator('principalTenant', {
                initialValue:  dataSource.parentOrganizationCode?true:false,
              })(
                <Checkbox disabled={this.state.LDAPChecked?false:true} onChange={this.principalTenantOnchange} checked ={this.state.principalTenantChecked}>{SettingLDAPStore.languages[`${intlPrefix}.principalTenant`]}</Checkbox>
              )}
            </FormItem>

            {
              this.state.principalTenantChecked?
                parentOrganizationCodeText? (
                  <span style={{width: '230px',display: 'inline-block'}}>
                    <span style={{ display: 'inline-block', width: '200px', overflow: 'hidden'}}>
                      {this.state.parentOrganizationCode}
                    </span>
                    <Icon
                      onClick={
                        ()=>{
                          this.setState({parentOrganizationCodeText:false})
                        }
                      }
                      className="Icon_span"
                      style={{fontSize:'14px',float:'right',color:'#2196F3',marginTop:'2px'}}
                      type="kongjian-bianji"
                    />
                  </span>

                ) : (
                  <FormItem
                    {...formItemLayout}
                    style={{ display: 'inline-block'}}
                  >
                    {getFieldDecorator('parentOrganizationCode', {
                      initialValue: this.state.parentOrganizationCode?this.state.parentOrganizationCode:dataSource.parentOrganizationCode?dataSource.parentOrganizationCode:'',
                    })(
                      <Input
                        disabled={this.state.LDAPChecked?(this.state.principalTenantChecked?false:true):true}
                        autoComplete="off"
                        placeholder={SettingLDAPStore.languages[`${intlPrefix}.parentOrganizationCode`]}
                        size="default"
                        suffix={
                          <span>
                            <Icon onClick={()=>{this.setState({parentOrganizationCodeText:true})}} className="Icon_span_dele" style={{fontSize:'14px'}} type="caozuoguanliIcon-12" />
                            <Popover placement="top" trigger='hover' content={<span>{SettingLDAPStore.languages[`${intlPrefix}.check`]}</span>}>
                              <Icon onClick={this.checkPrincipalTenantCode} className="Icon_span" style={{marginLeft:'5px',color:'#2196F3',fontSize:'14px'}}  type="caozuoguanliIcon-" />
                            </Popover>
                          </span>}
                        style={{
                          width: '230px',
                        }}
                        maxLength={60}
                      />
                    )}
                  </FormItem>
                )
                :''
            }

            <div style={{ fontSize: '15px', fontFamily: 'PingFangSC-Medium', color: '#04173F', paddingLeft: '7px', borderLeft: '2px solid #2196F3 ' }}>
              {SettingLDAPStore.languages[`${intlPrefix}.param`]}
            </div>
            <FormItem
              {...formItemLayout}
              style={{ marginTop: '20px' }}
            >
              {getFieldDecorator('account', {
                rules: [{
                  whitespace: true,
                  required: true,
                  message: SettingLDAPStore.languages[`${intlPrefix}.userName.require.msg`],
                }],
                // validateFirst: true,
                initialValue: dataSource.account || '',
              })(
                <Input
                  disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                  autoComplete="off"
                  label={SettingLDAPStore.languages[`${intlPrefix}.userName`]}
                  size="default"
                  readOnly={this.state.accountOnly}
                  onFocus={
                    ()=>{
                      this.setState({
                        accountOnly:''
                      })
                    }
                  }
                  onBlur={
                    ()=>{
                      this.setState({
                        accountOnly:'readonly'
                      })
                    }
                  }
                  style={{
                    width: '350px',
                  }}
                  maxLength={60}
                />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('password', {
                rules: [{
                  required: true,
                  whitespace: true,
                  message: SettingLDAPStore.languages[`${intlPrefix}.passWord.require.msg`],
                }],
                validateFirst: true,
                initialValue: dataSource.password || '',
              })(
                <Input
                  disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                  type="password"
                  autoComplete="new-password"
                  readOnly={this.state.passwordOnly}
                  label={SettingLDAPStore.languages[`${intlPrefix}.passWord`]}
                  size="default"
                  onFocus={
                    ()=>{
                      this.setState({
                        passwordOnly:''
                      })
                    }
                  }
                  onBlur={
                    ()=>{
                      this.setState({
                        passwordOnly:'readonly'
                      })
                    }
                  }
                  style={{
                    width: '350px',
                  }}
                  maxLength={60}
                />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('serverAddress', {
                rules: [{
                  required: true,
                  whitespace: true,
                  message: SettingLDAPStore.languages[`${intlPrefix}.serviceAddress.require.msg`],
                }],
                validateFirst: true,
                initialValue: dataSource.serverAddress || '',
              })(
                <Input
                  disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                  autoComplete="off"
                  label={SettingLDAPStore.languages[`${intlPrefix}.serviceAddress`]}
                  size="default"
                  style={{
                    width: '350px',
                  }}
                  maxLength={60}
                />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('ldapAttributeName', {
                rules: [{
                  required: true,
                  whitespace: true,
                  message: SettingLDAPStore.languages[`${intlPrefix}.attributeName.require.msg`],
                }],
                validateFirst: true,
                initialValue: dataSource.ldapAttributeName || '',
              })(
                <Input
                  disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                  autoComplete="off"
                  label={SettingLDAPStore.languages[`${intlPrefix}.attributeName`]}
                  size="default"
                  style={{
                    width: '350px',
                  }}
                  maxLength={50}
                />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('useSsl', {
                validateTrigger: 'onBlur',
                validateFirst: true,
                initialValue: dataSource.useSsl || '0',

              })(
                <Select
                  disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                  label={SettingLDAPStore.languages[`${intlPrefix}.encryptionMode`]}
                  allowClear
                  style={{ width: 350 }}
                >
                  <Option value="1">{SettingLDAPStore.languages[`${intlPrefix}.yes`]}</Option>
                  <Option value="0">{SettingLDAPStore.languages[`${intlPrefix}.no`]}</Option>
                </Select>,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('baseDn', {
                rules: [{
                  required: true,
                  whitespace: true,
                  message: SettingLDAPStore.languages[`${intlPrefix}.BasicsDN.require.msg`],
                }],
                validateFirst: true,
                initialValue: dataSource.baseDn || '',
              })(
                <Input
                  disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                  autoComplete="off"
                  label={SettingLDAPStore.languages[`${intlPrefix}.BasicsDN`]}
                  size="default"
                  style={{
                    width: '350px',
                  }}
                  maxLength={60}
                />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('loginFieldCode', {
                rules: [{
                  required: true,
                  whitespace: true,
                  message: SettingLDAPStore.languages[`${intlPrefix}.verifyField.require.msg`],
                }],
                validateFirst: true,
                initialValue: dataSource.loginFieldCode || '',
              })(
                <Select
                  disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                  label={SettingLDAPStore.languages[`${intlPrefix}.verifyField`]}
                  allowClear
                  style={{ width: 350 }}
                >
                  {
                    verifyField !== undefined ? (
                      verifyField.map((item) => {
                        return (
                          <Option value={item.lookupValue}>
                            {item.lookupMeaning}
                          </Option>
                        )
                      })
                    ) : ''
                  }
                </Select>
              )}
            </FormItem>

            <div style={{display:'flex', justifyContent: 'space-between', width: 350}}>
              <span>{SettingLDAPStore.languages[`${intlPrefix}.ldapSyncInfo`]}</span>
              <FormItem>
                {getFieldDecorator('enabledShow', {
                  valuePropName: 'checked',
                  initialValue: showSyncInfo
                })(
                  <Switch
                    // checked={showSyncInfo}
                    disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                    onChange={(checked) => {
                      this.setState({
                        showSyncInfo: checked,
                      })
                    }}
                  />
                )}
              </FormItem>
            </div>
            <FormItem
              {...formItemLayout}
              style={{
                width: '350px',
              }}
            >
              {getFieldDecorator('name', {
                validateFirst: true,
                initialValue: dataSource.name || '',
              })(
                <Input.TextArea
                  disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                  autoComplete="off"
                  label={SettingLDAPStore.languages[`${intlPrefix}.description`]}
                  size="default"
                  style={{
                    width: '350px',
                  }}
                  maxLength={200}
                  autosize={{ minRows: 1.2, maxRows: 6 }}
                />,
              )}
            </FormItem>
          </Form>
        </div>
        {
          showSyncInfo ? (
            <div style={{ width: '560px', height: '810px', position: 'absolute', display: 'inline-block', float: 'right' }}>
                <span style={{ fontSize: '15px', fontFamily: 'PingFangSC-Medium', color: '#04173F', paddingLeft: '7px', borderLeft: '2px solid #2196F3 ' }}>
                  {SettingLDAPStore.languages[`${intlPrefix}.ziduan`]}
                </span>
              <Form layout="vertical" style={{ marginTop: '20px' }}>
                <FormItem
                  {...formItemLayout}
                >
                  {getFieldDecorator('loginNameField', {
                    validateFirst: true,
                    initialValue: dataSource.loginNameField || '',
                  })(
                    <Input
                      disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                      autoComplete="off"
                      label={SettingLDAPStore.languages[`${intlPrefix}.loginNameField`]}
                      size="default"
                      style={{
                        width: '350px',
                      }}
                      maxLength={20}
                      onChange={this.handleShowInitialRole.bind(this)}
                    />,
                  )}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                >
                  {getFieldDecorator('realNameField', {
                    validateFirst: true,
                    initialValue: dataSource.realNameField || '',
                  })(
                    <Input
                      disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                      autoComplete="off"
                      label={SettingLDAPStore.languages[`${intlPrefix}.realNameField`]}
                      size="default"
                      style={{
                        width: '350px',
                      }}
                      maxLength={20}
                      onChange={this.handleShowInitialRole.bind(this)}
                    />,
                  )}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                >
                  {getFieldDecorator('emailField', {
                    validateFirst: true,
                    initialValue: dataSource.emailField || '',
                  })(
                    <Input
                      disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                      autoComplete="off"
                      label={SettingLDAPStore.languages[`${intlPrefix}.emailField`]}
                      size="default"
                      style={{
                        width: '350px',
                      }}
                      maxLength={20}
                      onChange={this.handleShowInitialRole.bind(this)}
                    />,
                  )}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                >
                  {getFieldDecorator('phoneField', {
                    rules: [{
                      whitespace: true,
                    }],
                    validateFirst: true,
                    initialValue: dataSource.phoneField || '',
                  })(
                    <Input
                      disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                      autoComplete="off"
                      label={SettingLDAPStore.languages[`${intlPrefix}.phoneField`]}
                      size="default"
                      style={{
                        width: '350px',
                      }}
                      maxLength={20}
                      onChange={this.handleShowInitialRole.bind(this)}
                    />,
                  )}
                </FormItem>
                <div style={{ marginTop: '24px' }}>
                    <span style={{ fontSize: '15px', fontFamily: 'PingFangSC-Medium', color: '#04173F', paddingLeft: '7px', marginTop: '40px', borderLeft: '2px solid #2196F3 ' }}>
                      {SettingLDAPStore.languages[`${intlPrefix}.synchronous.configuration`]}
                    </span>
                </div>
                <FormItem
                  {...formItemLayout}
                  style={{ marginTop: '24px' }}
                >
                  {getFieldDecorator('syncField', {
                    validateFirst: true,
                    initialValue: dataSource.syncField || '',
                  })(
                    <Input
                      disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                      autoComplete="off"
                      label={SettingLDAPStore.languages[`${intlPrefix}.syncField`]}
                      size="default"
                      style={{
                        width: '350px',
                      }}
                      maxLength={60}
                      onChange={this.handleShowInitialRole.bind(this)}
                    />,
                  )}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  style={{ marginTop: '24px' }}
                >
                  {getFieldDecorator('invalidField', {
                    validateTrigger: 'onBlur',
                    validateFirst: true,
                    initialValue: dataSource.invalidField || '',

                  })(
                    (
                      <Input
                        disabled={this.state.LDAPChecked?(this.props.form.getFieldsValue().principalTenant?true:false):true}
                        autoComplete="off"
                        label={SettingLDAPStore.languages[`${intlPrefix}.resignation.field`]}
                        size="default"
                        style={{
                          width: '350px',
                        }}
                        maxLength={20}
                        onChange={this.handleShowInitialRole.bind(this)}
                      />
                    ),
                  )}
                </FormItem>

                {
                  showRoleValue.length || showInitialRole ? (
                    <div>
                      <div style={{ marginTop: '24px' }}>
                          <span style={{ fontSize: '15px', fontFamily: 'PingFangSC-Medium', color: '#04173F', paddingLeft: '7px', marginTop: '40px', borderLeft: '2px solid #2196F3 ' }}>
                            {SettingLDAPStore.languages[`${intlPrefix}.initialization.configuration`]}
                          </span>
                      </div>
                      <FormItem
                        {...formItemLayout}
                        style={{ marginTop: '24px' }}
                      >
                        {getFieldDecorator('roleId', {
                          rules: [{
                            required: true,
                            message: SettingLDAPStore.languages[`${intlPrefix}.roleId.require.msg`],
                          }],
                          initialValue: dataSource.roleId || null,
                        })(
                          <Select
                            disabled={this.state.LDAPChecked?false:true}
                            allowClear
                            style={{ width: 350 }}
                            label={SettingLDAPStore.languages[`${intlPrefix}.roleId`]}
                          >{
                            roleIdType.map((item) => {
                              return <Option value={item.id}>{item.name}</Option>
                            })
                          }
                          </Select>
                        )}
                      </FormItem>
                    </div>
                  ) : ''
                }
              </Form>
            </div>
          ) : ''
        }
        <div style={{fontSize:'14px',height:'32px',lineHeight:'32px'}}>
          <span style={{borderLeft:'2px solid #2196f3',paddingLeft: '7px',fontWeight:'600'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.LoginMode`]}</span>
        </div>
        <div style={{height:'32px',lineHeight:'32px'}}>
          <RadioGroup disabled={this.state.LDAPChecked?false:true} name="radiogroup" onChange={(e)=>{this.setState({loginWayCode:e.target.value})}} style={{marginLeft:'7px'}} value={this.state.loginWayCode}>
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
        <div style={{paddingTop:'20px'}}>
          {
            (!this.props.form.isModifiedFields())&&
            (this.state.LDAPCheckedInitial===this.state.LDAPChecked)
            &&(this.state.loginWayCode===this.state.loginWayCodeInitial)
            &&((this.state.checkData.length===0&&this.state.checkDataInitial.length===0)?true:(this.state.checkData===this.state.checkDataInitial))
              ?(
                <Button
                  style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff',opacity:0.5}}
                  disabled
                >
                  {AccountSecurityManagementStore.languages[`save`]}
                </Button>
              ):(parentOrganizationCodeText)?(
                <Button
                  style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}}
                  onClick={this.handleSubmitLdap}
                >
                  {AccountSecurityManagementStore.languages[`save`]}
                </Button>
              ):(
                <Button
                  style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff',opacity:0.5}}
                  disabled
                >
                  {AccountSecurityManagementStore.languages[`save`]}
                </Button>
              )
          }

          <Button key="back" onClick={this.handleConnectionTest} style={{border: '1px solid #2196F3',color: '#2196F3',marginLeft:'12px'}}>{SettingLDAPStore.languages[`${intlPrefix}.connectTest`]}</Button>

          <Button onClick={this.cancleButton} key="back" style={{border: '1px solid #ACB3BF',color: '#818999',marginLeft:'12px'}}>{AccountSecurityManagementStore.languages[`cancle`]}</Button>
        </div>
      </div>
    );
  }
}
export default Form.create({})(withRouter(injectIntl(SettingLDAPHome)));

