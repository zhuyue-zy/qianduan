import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content,axios } from 'yqcloud-front-boot';
import {Button, Form, Input, Switch , Select, Icon, Alert,message,Tabs,Pagination,Checkbox,Modal,Row,Col,Table,Radio} from 'yqcloud-ui';
import SSOConfigurationStore from '../../../../stores/organization/ssoConfiguration';
import './SSOStyle.scss';
import AccountSecurityManagementStore from "../../../../stores/organization/accountSecurityManagement";

const intlPrefixSSO = 'organization.ssoConfig';
const intlPrefixs = 'global.accountSecurityManagement';
const FormItem = Form.Item;
const { Search } = Input;
const RadioGroup = Radio.Group;
const { TextArea } = Input;
const Option = Select.Option;


@inject('AppState')
@observer
class SSOHome extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state={
      ssoData: {}, // sso配置数据
      samlData: '', // SAML加密算法
      SSOVisible:false,
      SSOChecked:false,
      SSOCheckedInitial:false,
      TenantType:'',
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
    }
  }

  componentWillMount() {
    this.loadLanguage();
    this.getTenantType();
    this.queryEnable();
    this.getLoginSetUp()
  }

  componentDidMount() {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    this.getSsoConfigurationData(id);
    this.getSamlCode(id, 'FND_SSO_SAML');
    this.setState({
      LDAPChecked:this.props.LDAPChecked,
      securitySettingChecked:this.props.securitySettingChecked,
    });
  }

  // 查询成员
  queryEnable=()=>{
    const { AppState } = this.props;
    const { enableSize } = this.state;
    const { organizationId } = AppState.currentMenuType;
    axios.get(`/fnd/v1/${organizationId}/organizations/employee/login/untreated?loginWayCode=SSO&page=${enableSize}&size=10`).then(data=>{
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

  componentWillReceiveProps(nextProps) {
    this.setState({
      LDAPChecked: nextProps.LDAPChecked,
      securitySettingChecked: nextProps.securitySettingChecked
    });
    // if(nextProps.LDAPChecked||nextProps.securitySettingChecked){
    //   this.setState({
    //     SSOChecked:false,
    //   });
    // }
  }

  loadLanguage=() => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    SSOConfigurationStore.queryLanguage(id, AppState.currentLanguage);
  };

  /**
   * 查询租户类型
   */
  getTenantType = () =>{
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    SSOConfigurationStore.getTenantType(id).then(data=>{
      this.setState({
        TenantType: data
      })
    });
  };

  // 查询sso配置
  getSsoConfigurationData = (id) => {
    SSOConfigurationStore.ssoConfigurationData(id).then((data) => {
      if (data) {
        this.setState({
          ssoData: data.result,
          SSOChecked:data.result.enabled,
          SSOCheckedInitial:data.result.enabled,
          loginWayCode:data.result.accountType,
          loginWayCodeInitial:data.result.accountType,
        });

        if(data.result.accountType!=='ALL'&&data.result.accountType){
          axios.get(`/fnd/v1/${this.organizationId}/organizations/employee/login/${data.result.accountType}?loginWayCode=SSO`).then(item=>{
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

        this.props.handleSSO(data.result.enabled);
      }
    })
  };

  // 获取SAML加密算法
  getSamlCode = (id, code) => {
    SSOConfigurationStore.getSourceCode(id, code).then((data) => {
      this.setState({
        samlData: data,
      });
    })
  };

  // 保存提交
  handleSubmitSSO = (e) => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    const { ssoData } = this.state;
    // const typeArr=[];
    // if(this.state.SSOChecked){
    //   typeArr.push('SSO');
    // }
    // if(this.state.LDAPChecked){
    //   typeArr.push('LDAP')
    // }
    // if(this.state.securitySettingChecked){
    //   typeArr.push('ACCOUNT')
    // }

    const userList = [];
    if(this.state.loginWayCode==='INCLUDE'||this.state.loginWayCode==='EXCEPT'){
      this.state.checkData.forEach(item=>{
        userList.push(item.userId)
      })
    }
    if(this.state.SSOChecked||this.state.LDAPChecked||this.state.securitySettingChecked){
      e.preventDefault();
      this.props.form.validateFieldsAndScroll((err, values, modify) => {
        if(this.state.SSOChecked){
          values.enabled=true;
        }else {
          values.enabled=false;
        }

        values.accountType=this.state.loginWayCode;
        values.userIdList=userList;
        if (!err||!(err.entityId||err.ssoUrl||err.encryTypeCode||err.casLoginUrl||err.casLogoutUrl||err.casVaildUrl||err.authServerUrl||err.authLoginUrl||err.LoginoutUrl||clirntUrl||authUserUrl||clientId||clientSecret)) {
          if(values.type==='SAML'){
            SSOConfigurationStore.saveSsoConfiguration(id, Object.assign(ssoData, values)).then((res) => {
              if (res.failed || res.success === false) {
                Choerodon.prompt(res.message || res.errorMsg);
              } else {
                this.setState({
                  ssoData: res,
                })
                Choerodon.prompt(SSOConfigurationStore.languages['save.success']);
                this.props.history.push(`/iam/accountSecurityManagement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
            });
          }else if(values.type==='CAS')  {
            SSOConfigurationStore.saveSsoConfigurationCas(id, Object.assign(ssoData, values)).then((res) => {
              if (res.failed || res.success === false) {
                Choerodon.prompt(res.message || res.errorMsg);
              } else {
                this.setState({
                  ssoData: res,
                })
                Choerodon.prompt(SSOConfigurationStore.languages['save.success']);
                this.props.history.push(`/iam/accountSecurityManagement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
            });
          }else {
            values.isEnabled = true;
            SSOConfigurationStore.saveSsoConfigurationOauth(id, Object.assign(ssoData, values)).then((res) => {
              if (res.failed || res.success === false) {
                Choerodon.prompt(res.message || res.errorMsg);
              } else {
                this.setState({
                  ssoData: res,
                })
                Choerodon.prompt(SSOConfigurationStore.languages['save.success']);
                this.props.history.push(`/iam/accountSecurityManagement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
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

  // SSO开关
  SSOCheckedOnChange=(checked)=>{
    if(checked){
      this.setState({
        // SSOVisible:true
        SSOChecked:true,
      })
    }else {
      this.props.handleSSO(false);
      this.setState({
        SSOChecked:false
      })
    }
  };

  // // LDAP Modal确认
  // SSOModalHandleOk =()=>{
  //   this.props.handleSSO(true);
  //   this.setState({
  //     // securitySettingChecked:false,
  //     // LDAPChecked:false,
  //     SSOChecked:true,
  //     SSOVisible:false
  //   })
  // };

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
      axios.get(`/fnd/v1/${organizationId}/organizations/employee/login/untreated?loginWayCode=SSO&page=${e-1}&size=10&employeeName=${this.state.searchValue}`).then(data=>{
        this.setState({
          data:data.result.content,
        })
      });
    }else {
      axios.get(`/fnd/v1/${organizationId}/organizations/employee/login/untreated?loginWayCode=SSO&page=${e-1}&size=10`).then(data=>{
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
    axios.get(`/fnd/v1/${organizationId}/organizations/employee/login/untreated?loginWayCode=SSO&page=0&size=10&employeeName=${value}`).then(data=>{
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
    const { samlData, ssoData } = this.state;
    const { getFieldDecorator } = this.props.form;
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
      <div>
        {/*{*/}
          {/*(this.state.LDAPChecked||this.state.securitySettingChecked)?(*/}
            {/*<Alert style={{width:'470px',height:'42px'}} message={<span><Icon type="jingshi" style={{color: '#F8353F',fontSize:'16px'}}/><span style={{paddingLeft:'8px',verticalAlign: 'middle'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.SSOWarning`]}</span></span>} type="error" />*/}
          {/*):(*/}
            {/*<Alert style={{width:'470px',height:'42px'}} message={<span><Icon type="jingshi" style={{color: '#FF9500',fontSize:'16px'}}/><span style={{paddingLeft:'8px',verticalAlign: 'middle'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.WarningHintsOne`]}</span></span>} type="warning" />*/}
          {/*)*/}
        {/*}*/}


        <div style={{padding:'25px 0'}}><span><Switch disabled={this.state.TenantType==='ENTERPRISE' ? false : true} checked={this.state.SSOChecked} onChange={this.SSOCheckedOnChange} /><span style={{paddingLeft:'14px',verticalAlign: 'sub'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.SSOSignIn`]}</span></span></div>

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
          {/*title={<span><Icon type="fuwuzhongxin-2" style={{color: '#FF9500',fontSize:'22px'}}/><span style={{fontSize: '16px',color: '#04173F',lineHeight: '24px',paddingLeft:'14px',verticalAlign: 'middle'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.EnableSSO`]}</span></span>}*/}
          {/*visible={this.state.SSOVisible}*/}
          {/*onOk={this.SSOModalHandleOk}*/}
          {/*onCancel={()=>{this.setState({SSOVisible:false})}}*/}
          {/*center*/}
          {/*footer={[*/}
            {/*<Button key="back" style={{border: '1px solid #A3ACBF',color: '#69758C'}}  onClick={()=>{this.setState({SSOVisible:false})}}>{AccountSecurityManagementStore.languages[`cancle`]}</Button>,*/}
            {/*<Button key="submit" type="primary" style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}} onClick={this.SSOModalHandleOk}>{AccountSecurityManagementStore.languages[`ok`]}</Button>,*/}
          {/*]}*/}
        {/*>*/}
          {/*<p style={{fontSize: '14px',color: '#818999',lineHeight: '22px',padding:'14px 0  14px 37px'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.EnableSSOWarning`]}</p>*/}
        {/*</Modal>*/}
        {/*<div className="title">*/}
          {/*<span className="h2">{SSOConfigurationStore.languages[`${intlPrefixSSO}.title`]}</span>*/}
          {/*<div className="description">{SSOConfigurationStore.languages[`${intlPrefixSSO}.description`]}</div>*/}
        {/*</div>*/}
        <Form className="ssoForm">
          <Row>
            <Col span={5} className="required">{SSOConfigurationStore.languages[`${intlPrefixSSO}.typeSSO`]}</Col>
            <Col span={19}>
              <FormItem {...formItemLayout}>
                {getFieldDecorator('type', {
                  rules: [{
                    required: true,
                    // message: SSOConfigurationStore.languages[`${intlPrefixSSO}.entityId.reqMsg`]
                  }],
                  initialValue: ssoData.type || 'SAML'
                })(
                  <Select disabled={this.state.SSOChecked?false:true} onChange={this.typeOnChange}>
                    <Option value="CAS">{SSOConfigurationStore.languages[`${intlPrefixSSO}.CASLogin`]}</Option>
                    <Option value="SAML">{SSOConfigurationStore.languages[`${intlPrefixSSO}.SAMLLogin`]}</Option>
                    <Option value="OAUTH2">OAUTH2.0</Option>
                  </Select>
                )}
              </FormItem>
            </Col>
          </Row>
          {
            this.props.form.getFieldsValue().type==='SAML'?(
              <div>
                <Row>
                  <Col span={5} className="required">{SSOConfigurationStore.languages[`${intlPrefixSSO}.entityId`]}</Col>
                  <Col span={19}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('entityId', {
                        rules: [{
                          required: true,
                          message: SSOConfigurationStore.languages[`${intlPrefixSSO}.entityId.reqMsg`]
                        }],
                        initialValue: ssoData.entityId || ''
                      })(
                        <Input placeholder={SSOConfigurationStore.languages[`${intlPrefixSSO}.entityId.placeholder`]} autoComplete="off" maxLength={200} disabled={this.state.SSOChecked?false:true}/>
                      )}
                    </FormItem>
                  </Col>
                </Row>
                <Row>
                  <Col span={5} className="required">{SSOConfigurationStore.languages[`${intlPrefixSSO}.ssoUrl`]}</Col>
                  <Col span={19}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('ssoUrl', {
                        rules: [{
                          required: true,
                          message: SSOConfigurationStore.languages[`${intlPrefixSSO}.ssoUrl.reqMsg`]
                        }],
                        initialValue: ssoData.ssoUrl || ''
                      })(
                        <div>
                          <Input placeholder={SSOConfigurationStore.languages[`${intlPrefixSSO}.ssoUrl.placeholder`]} defaultValue={ssoData.ssoUrl || ''}  disabled={this.state.SSOChecked?false:true}/>
                          <span className="urlDirection">{SSOConfigurationStore.languages[`${intlPrefixSSO}.ssoUrl.urlDirection`]}</span>
                        </div>
                      )}
                    </FormItem>
                  </Col>
                </Row>

                <Row>
                  <Col span={5}>{SSOConfigurationStore.languages[`${intlPrefixSSO}.idpPublicKey`]}</Col>
                  <Col span={19}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('idpPublicKey', {
                        rules: [],
                        initialValue: ssoData.idpPublicKey || ''
                      })(
                        <TextArea
                          rows={3}
                          // maxLength={1000}
                          underline={false}
                          className="textArea"
                          placeholder={SSOConfigurationStore.languages[`${intlPrefixSSO}.idpPublicKey.placeholder`]}
                          disabled={this.state.SSOChecked?false:true}
                        />
                      )}
                    </FormItem>
                  </Col>
                </Row>

                <Row>
                  <Col span={5}>{SSOConfigurationStore.languages[`${intlPrefixSSO}.issurerUrl`]}</Col>
                  <Col span={19}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('issurerUrl', {
                        rules: [],
                        initialValue: ssoData.issurerUrl || ''
                      })(
                        <Input placeholder={SSOConfigurationStore.languages[`${intlPrefixSSO}.issurerUrl.placeholder`]} autoComplete="off"  disabled={this.state.SSOChecked?false:true}/>
                      )}
                    </FormItem>
                  </Col>
                </Row>

                <Row>
                  <Col span={5} className="required">{SSOConfigurationStore.languages[`${intlPrefixSSO}.encryTypeCode`]}</Col>
                  <Col span={19} style={{marginTop: '-3px'}}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('encryTypeCode', {
                        rules: [{
                          required: true,
                          message: SSOConfigurationStore.languages[`${intlPrefixSSO}.encryTypeCode.reqMsg`]
                        }],
                        initialValue: ssoData.encryTypeCode || ''
                      })(
                        <Select allowClear  disabled={this.state.SSOChecked?false:true}>
                          {
                            samlData ? (
                              samlData.map(item => <Option value={item.lookupValue}>{item.lookupValue}</Option>)
                            ) : ''
                          }
                        </Select>
                      )}
                    </FormItem>
                  </Col>
                </Row>
              </div>

            ):this.props.form.getFieldsValue().type==='CAS'?(

              <div>
                <Row>
                  <Col span={5} className="required">{SSOConfigurationStore.languages[`${intlPrefixSSO}.casLoginUrl`]}</Col>
                  <Col span={19} style={{marginTop: '-3px'}}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('casLoginUrl', {
                        rules: [{
                          required: true,
                          message: SSOConfigurationStore.languages[`${intlPrefixSSO}.casLoginUrl.reqMsg`]
                        }],
                        initialValue: ssoData.casLoginUrl || ''
                      })(
                        <Input placeholder={SSOConfigurationStore.languages[`${intlPrefixSSO}.casLoginUrl.reqMsg`]} autoComplete="off"  disabled={this.state.SSOChecked?false:true}/>
                      )}
                    </FormItem>
                  </Col>
                </Row>
                <Row>
                  <Col span={5} className="required">{SSOConfigurationStore.languages[`${intlPrefixSSO}.casLogoutUrl`]}</Col>
                  <Col span={19} style={{marginTop: '-3px'}}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('casLogoutUrl', {
                        rules: [{
                          required: true,
                          message: SSOConfigurationStore.languages[`${intlPrefixSSO}.casLogoutUrl.reqMsg`]
                        }],
                        initialValue: ssoData.casLogoutUrl || ''
                      })(
                        <Input placeholder={SSOConfigurationStore.languages[`${intlPrefixSSO}.casLogoutUrl.reqMsg`]} autoComplete="off"  disabled={this.state.SSOChecked?false:true}/>
                      )}
                    </FormItem>
                  </Col>
                </Row>
                <Row>
                  <Col span={5} className="required">{SSOConfigurationStore.languages[`${intlPrefixSSO}.casVaildUrl`]}</Col>
                  <Col span={19} style={{marginTop: '-3px'}}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('casVaildUrl', {
                        rules: [{
                          required: true,
                          message: SSOConfigurationStore.languages[`${intlPrefixSSO}.casVaildUrl.reqMsg`]
                        }],
                        initialValue: ssoData.casVaildUrl || ''
                      })(
                        <Input placeholder={SSOConfigurationStore.languages[`${intlPrefixSSO}.casVaildUrl.reqMsg`]} autoComplete="off"  disabled={this.state.SSOChecked?false:true}/>
                      )}
                    </FormItem>
                  </Col>
                </Row>
              </div>
            ):(
              <div>
                <Row>
                  <Col span={5} className="required">{AccountSecurityManagementStore.languages[`${intlPrefixs}.theServerUrl`]}</Col>
                  <Col span={19} style={{marginTop: '-3px'}}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('authServerUrl', {
                        rules: [{
                          required: true,
                          message: AccountSecurityManagementStore.languages[`${intlPrefixs}.requiredTheServerUrl`]
                        }],
                        initialValue: ssoData.authServerUrl || ''
                      })(
                        <Input placeholder={AccountSecurityManagementStore.languages[`${intlPrefixs}.requiredTheServerUrl`]} autoComplete="off"  disabled={this.state.SSOChecked?false:true}/>
                      )}
                    </FormItem>
                  </Col>
                </Row>

                <Row>
                  <Col span={5} className="required">{AccountSecurityManagementStore.languages[`${intlPrefixs}.loginUrl`]}</Col>
                  <Col span={19} style={{marginTop: '-3px'}}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('authLoginUrl', {
                        rules: [{
                          required: true,
                          message: AccountSecurityManagementStore.languages[`${intlPrefixs}.requiredLoginUrl`]
                        }],
                        initialValue: ssoData.authLoginUrl || ''
                      })(
                        <Input placeholder={AccountSecurityManagementStore.languages[`${intlPrefixs}.requiredLoginUrl`]} autoComplete="off"  disabled={this.state.SSOChecked?false:true}/>
                      )}
                    </FormItem>
                  </Col>
                </Row>

                <Row>
                  <Col span={5} className="required">{AccountSecurityManagementStore.languages[`${intlPrefixs}.logoutUrl`]}</Col>
                  <Col span={19} style={{marginTop: '-3px'}}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('authLogoutUrl', {
                        rules: [{
                          required: true,
                          message: AccountSecurityManagementStore.languages[`${intlPrefixs}.logoutUrl`]
                        }],
                        initialValue: ssoData.authLogoutUrl || ''
                      })(
                        <Input placeholder={AccountSecurityManagementStore.languages[`${intlPrefixs}.logoutUrl`]} autoComplete="off"  disabled={this.state.SSOChecked?false:true}/>
                      )}
                    </FormItem>
                  </Col>
                </Row>

                <Row>
                  <Col span={5} className="required">{AccountSecurityManagementStore.languages[`${intlPrefixs}.clientUrl`]}</Col>
                  <Col span={19} style={{marginTop: '-3px'}}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('clientUrl', {
                        rules: [{
                          required: true,
                          message: AccountSecurityManagementStore.languages[`${intlPrefixs}.requiredClientUrl`]
                        }],
                        initialValue: ssoData.clientUrl || ''
                      })(
                        <Input placeholder={AccountSecurityManagementStore.languages[`${intlPrefixs}.requiredClientUrl`]} autoComplete="off"  disabled={this.state.SSOChecked?false:true}/>
                      )}
                    </FormItem>
                  </Col>
                </Row>

                <Row>
                  <Col span={5} className="required">{AccountSecurityManagementStore.languages[`${intlPrefixs}.OAUTHauthentication`]}</Col>
                  <Col span={19} style={{marginTop: '-3px'}}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('authUserUrl', {
                        rules: [{
                          required: true,
                          message: AccountSecurityManagementStore.languages[`${intlPrefixs}.OAUTHauthentication`],
                        }],
                        initialValue: ssoData.authUserUrl || ''
                      })(
                        <Input placeholder={AccountSecurityManagementStore.languages[`${intlPrefixs}.OAUTHauthentication`]} autoComplete="off"  disabled={this.state.SSOChecked?false:true}/>
                      )}
                    </FormItem>
                  </Col>
                </Row>

                <Row>
                  <Col span={5} className="required">{AccountSecurityManagementStore.languages[`${intlPrefixs}.clientId`]}</Col>
                  <Col span={19} style={{marginTop: '-3px'}}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('clientId', {
                        rules: [{
                          required: true,
                          message: AccountSecurityManagementStore.languages[`${intlPrefixs}.requiredClientId`]
                        }],
                        initialValue: ssoData.clientId || ''
                      })(
                        <Input placeholder={AccountSecurityManagementStore.languages[`${intlPrefixs}.requiredClientId`]} autoComplete="off"  disabled={this.state.SSOChecked?false:true}/>
                      )}
                    </FormItem>
                  </Col>
                </Row>

                <Row>
                  <Col span={5} className="required">{AccountSecurityManagementStore.languages[`${intlPrefixs}.clientPW`]}</Col>
                  <Col span={19} style={{marginTop: '-3px'}}>
                    <FormItem {...formItemLayout}>
                      {getFieldDecorator('clientSecret', {
                        rules: [{
                          required: true,
                          message: AccountSecurityManagementStore.languages[`${intlPrefixs}.requiredClientPW`]
                        }],
                        initialValue: ssoData.clientSecret || ''
                      })(
                        <Input placeholder={AccountSecurityManagementStore.languages[`${intlPrefixs}.requiredClientPW`]} autoComplete="off"  disabled={this.state.SSOChecked?false:true}/>
                      )}
                    </FormItem>
                  </Col>
                </Row>
              </div>
            )
          }

        </Form>
        <div style={{fontSize:'14px',height:'32px',lineHeight:'32px'}}>
          <span style={{borderLeft:'2px solid #2196f3',paddingLeft: '7px',fontWeight:'600'}}>{AccountSecurityManagementStore.languages[`${intlPrefixs}.LoginMode`]}</span>
        </div>
        <div style={{height:'32px',lineHeight:'32px'}}>
          <RadioGroup disabled={this.state.SSOChecked?false:true} name="radiogroup" onChange={(e)=>{this.setState({loginWayCode:e.target.value})}} style={{marginLeft:'7px'}} value={this.state.loginWayCode}>
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

        {
          this.props.form.getFieldsValue().type==='SAML'?(
            <div style={{padding:'8px 0 0 8px'}}>
              <span>{AccountSecurityManagementStore.languages[`${intlPrefixs}.metaData`]}</span>
              <a href={`${process.env.API_HOST}/oauth/saml/metadata`} download>
                <Button
                  key="disable"
                  // size="small"
                  icon="download"
                  shape="circle"
                  // onClick={()=>{
                  //   // AccountSecurityManagementStore.downloadSAMLMetaData()
                  // }}
                  disabled={false}
                  style={{ cursor: 'pointer', color: '#2196F3',marginLeft:'8px'}}
                />
              </a>

            </div>
          ):""
        }

        <div style={{paddingTop:'20px'}}>
          {(!this.props.form.isModifiedFields())&&
          (this.state.SSOCheckedInitial===this.state.SSOChecked&&
            (this.state.loginWayCode===this.state.loginWayCodeInitial)&&
            ((this.state.checkData.length===0&&this.state.checkDataInitial.length===0)?true:(this.state.checkData===this.state.checkDataInitial)))?(
            <Button
              style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff',opacity:0.5}}
              disabled
            >
              {AccountSecurityManagementStore.languages[`save`]}
            </Button>
          ):(
            <Button
              style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}}
              onClick={this.handleSubmitSSO}
            >
              {AccountSecurityManagementStore.languages[`save`]}
            </Button>
          )}
          <Button onClick={this.cancleButton} key="back" style={{border: '1px solid #ACB3BF',color: '#818999',marginLeft:'12px'}}>{AccountSecurityManagementStore.languages[`cancle`]}</Button>
        </div>
      </div>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(SSOHome)));
