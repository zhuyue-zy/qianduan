/*eslint-disable*/
import React, { Component } from 'react';
import {Button, Col, Form, Input, Modal, Row,Icon} from 'yqcloud-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import {axios, Content, Header, Page, Permission} from 'yqcloud-front-boot';
import UserInfoStore from '../../../../stores/user/userInfo/UserInfoStore';
import { JSEncrypt } from 'jsencrypt'
import './password.scss';

const FormItem = Form.Item;
const intlPrefix = 'user.changepwd';
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 100 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 9 },
  },
};

const inputWidth = 512;

@inject('AppState')
@observer
class ChangePassword extends Component {
  state = {
    submitting: false,
    confirmDirty: null,
    isLDAP:false,
    selfLDAP: false,
    publicKey: '', // 公钥
    valueKeys: '',
  };

  componentWillMount() {
    this.loadUserInfo();
    this.queryLDAPOrg();
    this.securitySettingQuery();
    this.getPassWordStrategy();
    this.querySelfLDAP();
    this.getPulicKeys();
    this.loadLanguage();
  }

  //  密码类型快码查询
  securitySettingQuery= () => {
    const { AppState } = this.props;
    const code = "FND_PWD_POLICY";
    axios.get(`fnd/v1/${AppState.userInfo.currentOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          passwordFastCode: data
        })
      })
  };

  getPassWordStrategy = () =>{
    const { AppState } = this.props;
    UserInfoStore.getStrategy(AppState.userInfo.currentOrganizationId).then(item=>{
      if(item&&!item.failed){
        this.setState({
          passWordStrategy:item,

        })
      }
    })
      .catch((error) => {
        Choerodon.handleResponseError(error);
        this.setState({ LOGOSubmitting: false });
      });
  };

  // 后去公钥
  getPulicKeys=() => {
    UserInfoStore.getPulicKey().then((data) => {
      for (let i in data) {
        this.setState({
          valueKeys: i,
          publicKey: data[i],

        })

      }
    })
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    UserInfoStore.queryLanguage(AppState.userInfo.organizationId, AppState.currentLanguage);
  }

  loadUserInfo = () => {
    UserInfoStore.setUserInfo(this.props.AppState.getUserInfo);
  };

  validateToNextPassword = (rule, value, callback) => {
    const {passWordStrategy,passwordFastCode} = this.state;
    const form = this.props.form;
    const { intl } = this.props;
    let reg = /((?=.*[a-z])(?=.*\d)|(?=[a-z])(?=.*[#@!~%^&*])|(?=.*\d)(?=.*[#@!~%^&*]))[a-z\d#@!~%^&*]{8,16}/i;
    const textOriginal = UserInfoStore.languages[`${intlPrefix}.passwordRulesNew`];
    let text = UserInfoStore.languages[`${intlPrefix}.passwordRulesNew`];
    if(passWordStrategy){
      const typeArr = passWordStrategy.formatCode.split(",");
      const typeArr_cope = [];
      if(passwordFastCode){
        passwordFastCode.forEach(item=>{
          if(typeArr.indexOf(item.lookupValue)>=0){
            typeArr_cope.push(item.lookupMeaning)
          }
        })
      }
      const regs_text = passWordStrategy.regularExpression.substring(0, passWordStrategy.regularExpression.length - 2);
      const regs = "/"+regs_text+"{"+passWordStrategy.minLength+","+passWordStrategy.maxLength+"}"+"$"+"/";
      reg = eval(regs);

      text = textOriginal.replace("8",passWordStrategy.minLength);
      text = text.replace("9",passWordStrategy.maxLength);
      text = text.replace("code",typeArr_cope.join("，"));
    }
    if (value){
      if (reg.test(value)) {
        if (value && this.state.confirmDirty) {
          form.validateFields(['confirm'], { force: true });
        }
        callback();
      } else {
        callback(text);
      }
    } else {
      callback();
    }
  };



  compareToFirstPassword = (rule, value, callback) => {
    const {passWordStrategy,passwordFastCode} = this.state;
    const { intl, form } = this.props;
    let reg = /((?=.*[a-z])(?=.*\d)|(?=[a-z])(?=.*[#@!~%^&*])|(?=.*\d)(?=.*[#@!~%^&*]))[a-z\d#@!~%^&*]{8,16}/i;
    const textOriginal = UserInfoStore.languages[`${intlPrefix}.passwordRulesNew`];
    let text = UserInfoStore.languages[`${intlPrefix}.passwordRulesNew`];
    if(passWordStrategy){
      const typeArr = passWordStrategy.formatCode.split(",");
      const typeArr_cope = [];
      if(passwordFastCode){
        passwordFastCode.forEach(item=>{
          if(typeArr.indexOf(item.lookupValue)>=0){
            typeArr_cope.push(item.lookupMeaning)
          }
        })
      }
      const regs_text = passWordStrategy.regularExpression.substring(0, passWordStrategy.regularExpression.length - 2);
      const regs = "/"+regs_text+"{"+passWordStrategy.minLength+","+passWordStrategy.maxLength+"}"+"$"+"/";
      reg = eval(regs);
      text = textOriginal.replace("8",passWordStrategy.minLength);
      text = text.replace("9",passWordStrategy.maxLength);
      text = text.replace("code",typeArr_cope.join("，"));
    }
    if (reg.test(value)) {
      if (value && value !== form.getFieldValue('password')) {
        callback(UserInfoStore.languages[`${intlPrefix}.twopwd.pattern.msg`]);
      } else {
        callback();
      }
    }else{
      // callback(UserInfoStore.languages[`${intlPrefix}.passwordRules`]);
      callback(text);

    }
  };


  handleConfirmBlur = (e) => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };
  /*
* @parma弹出页面取消新建或者修改按钮
* */
  handleCancel = (e) => {
    const { intl} = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        this.props.history.goBack();
      } else {
        Modal.confirm({
          title: UserInfoStore.languages[`${intlPrefix}.cancel.title`],
          content: UserInfoStore.languages[`${intlPrefix}.cancel.content`],
          okText: UserInfoStore.languages.ok,
          cancelText: UserInfoStore.languages.cancel,
          onOk: () => (
            this.props.history.goBack()
          )
        });
      }
    });
  }
  handleSubmit = (e) => {
    const { getFieldValue } = this.props.form;
    const user = UserInfoStore.getUserInfo;
    const { publicKey, valueKeys } =this.state;
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    let oldPassword= encrypt.encrypt(getFieldValue('oldpassword')); //password为需要加密的字段
    let newPassword= encrypt.encrypt(getFieldValue('confirm'));
    const body = {
      'originalPassword': oldPassword,
      'password': newPassword,
    };
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({ submitting: true });
        UserInfoStore.updatePassword(user.id, body, valueKeys)
          .then(({ failed, message }) => {
            this.setState({ submitting: false });
            if (failed) {
             //Choerodon.prompt(message);
            } else {
              Choerodon.logout();
            }
          })
          .catch((error) => {
            this.setState({ submitting: false });
            Choerodon.handleResponseError(error);
          });
      }
    });
  };

  reload = () => {
    const { resetFields } = this.props.form;
    resetFields();
  };
  //查询是否为LDAP组织
  queryLDAPOrg=()=>{
    const {AppState} = this.props;
    const {organizationId} = AppState.userInfo.organizationId;
    // return axios.get(`/iam/v1/organizations/${AppState.userInfo.organizationId}`).then((data) => {
    return axios.get(`/iam/v1/${AppState.userInfo.organizationId}/organizations`).then((data) => {
      this.setState({
        isLDAP:data.ldap
      })
    })
  }

  // 判断用户的ldap
  querySelfLDAP=()=>{
    const {AppState} = this.props;
    const {organizationId} = AppState.userInfo.organizationId;
    return axios.get(`/iam/v1/users/self?organizationId=${AppState.userInfo.organizationId}`).then((data) => {
      this.setState({
        selfLDAP:data.ldap
      })
    })
  }

  render() {
    const { intl, form ,AppState} = this.props;
    const { getFieldDecorator } = form;
    const { submitting ,isLDAP, selfLDAP} = this.state;
    const user = UserInfoStore.getUserInfo;
    return (
      <Page
        service={[
          'iam-service.user.selfUpdatePassword',
        ]}
      >
        <Header title={UserInfoStore.languages[`${intlPrefix}.header.title`]} />
        <Content
          values={{name: user.realName}}
        >
          <div><Icon type='zhuce-xinxishuru-tishi' style={{color:'#2196F3',fontSize:14,marginTop:'-3px'}}/> {UserInfoStore.languages[`${intlPrefix}.description`]}</div>
          <div className="ldapContainer">
            <Form onSubmit={this.handleSubmit} layout="vertical">
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('oldpassword', {
                  rules: [{
                    required: true,
                    message: UserInfoStore.languages[`${intlPrefix}.oldpassword.require.msg`],
                  }],
                  validateTrigger: 'onBlur',
                })(
                  <Input
                    autoComplete="off"
                    label={ UserInfoStore.languages[`${intlPrefix}.oldpassword`]}
                    type="password"
                    style={{ width: inputWidth }}
                    disabled={isLDAP && selfLDAP ? true : false }
                  />,
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('password', {
                  rules: [{
                    required: true,
                    message: UserInfoStore.languages[`${intlPrefix}.newpassword.require.msg`],
                  }, {
                    validator: this.validateToNextPassword,
                  }],
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                })(
                  <Input
                    autoComplete="off"
                    label={UserInfoStore.languages[`${intlPrefix}.newpassword`]}
                    type="password"
                    style={{ width: inputWidth }}
                    disabled={isLDAP && selfLDAP ? true : false }
                  />,
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('confirm', {
                  rules: [{
                    required: true,
                    message: UserInfoStore.languages[`${intlPrefix}.confirmpassword.require.msg`],
                  }, {
                    validator: this.compareToFirstPassword,
                  }],
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                })(
                  <Input
                    autoComplete="off"
                    label={ UserInfoStore.languages[`${intlPrefix}.confirmpassword`]}
                    type="password"
                    style={{ width: inputWidth }}
                    onBlur={this.handleConfirmBlur}
                    disabled={isLDAP && selfLDAP ? true : false }
                  />,
                )}
              </FormItem>
              <FormItem>
                <Permission service={['iam-service.user.selfUpdatePassword']} type={'site'}>
                  <Row>
                    {/*<hr className='hrLine' />*/}
                    <Col span={5} style={{ marginRight: 16 }}>
                      <Button
                        funcType="raised"
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        disabled={isLDAP && selfLDAP ? true : false }
                      >{ UserInfoStore.languages.save}</Button>
                      <Button
                        funcType="raised"
                        onClick={this.handleCancel}
                        style={{ marginLeft: 16 }}
                        disabled={isLDAP && selfLDAP ? true : false }
                      >{ UserInfoStore.languages.cancel}</Button>
                    </Col>
                  </Row>
                </Permission>
              </FormItem>
            </Form>
          </div>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(ChangePassword)));
