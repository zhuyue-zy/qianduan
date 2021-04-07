/**
 * Created by YANG on 2017/6/27.
 */
/*eslint-disable*/
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import {
  Button,
  Form,
  Icon,
  Input,
  Modal,
  Select,
  Table,
  Upload,
  Tooltip,
  Avatar,
  message,
  Popconfirm,
} from 'yqcloud-ui';
import { FormattedMessage, injectIntl } from 'react-intl';
import { axios, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import UserInfoStore from '../../../../stores/user/userInfo/UserInfoStore';
import AvatarUploader from './AvatarUploader';
import './Userinfo.scss';
import BindingStore from '../../../../stores/user/accountBinding/BindingStore';
import IntlTelInput from 'react-intl-tel-input';
import 'react-intl-tel-input/dist/main.css';

const FormItem = Form.Item;
const Option = Select.Option;
const inputWidth = 328;
const intlPrefix = 'user.userinfo';
const { Sidebar } = Modal;

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

function noop() {
}

@inject('AppState')
@observer
class UserInfo extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      emailNew: '',
      submitting: false,
      visible: false,
      addEmailVisible: false,
      emailObj: [],
      phoneNum: '',
      emailValue: '',
      emailBtn: false,
      count: 60,
      liked: true,
      flag: true,
      stop: true,
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },

      dataSourse_l: [], //登录历史数据
      loginMethodTypes: [],
      loading: false,
      historySidebarVisible: false,

      stopPhone: true,
      likedPhone: true,
      flagPhine: true,
      phoneBtn: false,
      countPhone: 60,
      dataSourse_p: [],
      inputPhoneNum: '',
      inputYzm: '',
      valueName: '',
      addPhoneVisible: false,
      addWeChatVisible: false,
      WeChatQRcodeUrl: '',
      WeChatNickname: '',
      isLDAP: false,
      selfLDAP: false,
      emailChecking: false,
    };
  };

  componentWillMount() {
    this.loadBinding();
    this.loadUserInfo();
    this.fetch(this.props);
    this.handleHistorySidebar();
    this.handleAddPhone();
    this.handleAddEmail();
    this.loadSelf();
    this.handleAddWeChat();
    this.renderEmail();
    this.queryLDAPOrg();
    this.querySelfLDAP();
    this.gitUniqueIdentifications();
    UserInfoStore.loadLanguageList();
    this.loadLanguage();
  }

  fetch() {
    UserInfoStore.loadLanguageList();
  }

  // 获得唯一标识
  gitUniqueIdentifications = () => {
    const { AppState } = this.props;
    UserInfoStore.gitUniqueIdentification(AppState.userInfo.organizationId, AppState.userInfo.id).then(item=>{
      if(item){
        this.setState({
          uniqueIdentification:item
        })
      }
    })
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    UserInfoStore.queryLanguage(AppState.userInfo.organizationId, AppState.currentLanguage);
  };

  //刷新页面
  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadSelf();
      this.loadBinding();
    });
  };
  //强制刷新
  handleBigRefush = () => {
    window.location.reload();
  };
  //查询是否为LDAP组织
  queryLDAPOrg = () => {
    const { AppState } = this.props;
    // return axios.get(`/iam/v1/organizations/${organizationId}`).then((data) => {
    return axios.get(`/iam/v1/${AppState.userInfo.organizationId}/organizations`).then((data) => {
      this.setState({
        isLDAP: data.ldap,
      });
    });
  };

  loadUserInfo = () => {
    UserInfoStore.setUserInfo(this.props.AppState.getUserInfo);
  };

  refresh = () => {
    this.props.form.resetFields();
    this.loadUserInfo();
  };


  openAvatorUploader = () => {
    this.setState({
      visible: true,
    });
  };

  handleVisibleChange = (visible) => {
    this.setState({ visible });
  };

  handleSubmit = (e) => {
    const { AppState, intl } = this.props;
    const originUser = UserInfoStore.getUserInfo;
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, values, modify) => {
      this.setState({
        submitting: true,
      });
      const user = {
        ...values,
        id: originUser.id,
        objectVersionNumber: originUser.objectVersionNumber,
      };
      user.emailName = null;
      user.YZM = null;
      if (user.realName === '') {
        Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.realname.require.msg`]);
        this.setState({ submitting: false });
      } else {
        UserInfoStore.updateUserInfo(user).then((data) => {
          if (data) {
            UserInfoStore.setUserInfo(data);
            Choerodon.prompt(UserInfoStore.languages['modify.success']);
            window.__LAN__ = undefined; // 清除组件多语言
            this.setState({ submitting: false });
            AppState.setUserInfo(data);
            this.handleBigRefush();
          }
        }).catch((error) => {
          Choerodon.handleResponseError(error);
          this.setState({ submitting: false });
        });
      }


    });
  };
  /*
* @parma弹出页面取消新建或者修改按钮
* */
  handleCancel = (e) => {
    const { intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        this.props.history.goBack();
      } else {
        Modal.confirm({
          title: UserInfoStore.languages[`${intlPrefix}.cancel.title`],
          content: UserInfoStore.languages[`${intlPrefix}.cancel.content`],
          okText: UserInfoStore.languages.ok,
          cancelText: UserInfoStore.languages.cancle,
          onOk: () => (
            this.props.history.goBack()
          ),
        });
      }
    });
  };

  getTimeZoneOptions() {
    const timeZone = [];
    if (timeZone.length > 0) {
      return timeZone.map(({ code, description }) => (<Option key={code} value={code}>{description}</Option>));
    } else {
      return [
        <Option key="CTT" value="CTT">{UserInfoStore.languages[`${intlPrefix}.timezone.ctt`]}</Option>,
      ];
    }
  }

  getNewAvatar = (realName, loginName) => {
    if (96 < ((realName ? realName : loginName).charAt(0).charCodeAt(0)) && ((realName ? realName : loginName).charAt(0).charCodeAt(0)) < 123) {

      return (<span style={{
        display: 'inline-block',
        width: 80,
        height: 80,
        color: '#FFFFFF',
        fontSize: '40px',
        fontWeight: 'bold',
        lineHeight: '80px',
        background: '#EF7F25',
      }}>{(realName ? realName : loginName).charAt(0)}</span>);
    } else if (64 < ((realName ? realName : loginName).charAt(0).charCodeAt(0)) && ((realName ? realName : loginName).charAt(0).charCodeAt(0)) < 91) {
      return (<span style={{
        display: 'inline-block',
        width: 80,
        height: 80,
        color: '#FFFFFF',
        fontSize: '40px',
        fontWeight: 'bold',
        lineHeight: '80px',
        background: '#EF7F25',
      }}>{(realName ? realName : loginName).charAt(0)}</span>);
    } else if (47 < ((realName ? realName : loginName).charAt(0).charCodeAt(0)) && ((realName ? realName : loginName).charAt(0).charCodeAt(0)) < 58) {
      return (<span style={{
        display: 'inline-block',
        width: 80,
        height: 80,
        color: '#FFFFFF',
        fontSize: '40px',
        fontWeight: 'bold',
        lineHeight: '80px',
        background: '#3C4D73',
      }}>{(realName ? realName : loginName).charAt(0)}</span>);
    } else {
      return (<span style={{
        display: 'inline-block',
        width: 80,
        height: 80,
        color: '#FFFFFF',
        fontSize: '40px',
        fontWeight: 'bold',
        lineHeight: '80px',
        background: '#2196F3',
      }}>{(realName ? realName : loginName).charAt(0)}</span>);
    }
  };

  getAvatar({ id, realName, loginName }) {
    const { visible, isLDAP, selfLDAP, uniqueIdentification } = this.state;
    const { AppState } = this.props;
    const avatar = UserInfoStore.getAvatar;

    return (
      <div className="user-info-avatar-wrap" style={{ width: inputWidth }}>
        <div>
          <div className="user-info-headPortrait">
           <Avatar
             shape="square"
             style={{ background: 'white' }}
             className='user-info-avatar'
             src={AppState.userInfo.imageUrl}
           >
              {this.getNewAvatar(realName, loginName)}
           </Avatar>

            <Permission
              service={['iam-service.user.uploadPhoto']}
              type="site"
            >
              <div onClick={this.openAvatorUploader} className="user-info-headPortrait-img">
                <Icon className="user-info-headPortrait-img-icon" type='genghuantupian' />
              </div>
              <AvatarUploader id={id} visible={visible} onVisibleChange={this.handleVisibleChange} />
            </Permission>
          </div>

          {/*<Permission*/}
          {/*  service={['iam-service.user.uploadPhoto']}*/}
          {/*  type="site"*/}
          {/*>*/}
          {/*  <a className="user-info-avatar-button" style={{ fontSize: 12 }} onClick={this.openAvatorUploader}>*/}
          {/*    {UserInfoStore.languages[`${intlPrefix}.change.avatar`]}*/}
          {/*  </a>*/}
          {/*  <AvatarUploader id={id} visible={visible} onVisibleChange={this.handleVisibleChange} />*/}
          {/*</Permission>*/}
        </div>
        {isLDAP && selfLDAP ?
          <span
            style={{
              display: 'inline-block',
              top: uniqueIdentification ? '26px' : '39px'
            }}
            className="user-info-avatar-title"
          >
            {realName ? realName : loginName}
            <span style={{ fontSize: 14 }}>
            (<span style={{ color: '#D0021B', fontSize: 12 }}>LDAP用户</span>)
            </span>
          </span> :
          <span
            style={{
              display: 'inline-block',
              top: uniqueIdentification ? '26px' : '39px'
            }}
            className="user-info-avatar-title"
          >
            {realName ? realName : loginName}
          </span>
        }

        {uniqueIdentification ? (
          <span className="user-info-only-marking">
            <Tooltip title={UserInfoStore.languages[`${intlPrefix}.unique.customerNumber`]}><Icon className="user-info-only-marking-icon" type='worknumber'/></Tooltip>
            <span>{uniqueIdentification}</span>
          </span>
        ):''}

        <div style={{ width: 1116, height: 1, background: '#DCE1E6', marginTop: 10 }}></div>

      </div>


    );
  }

  //展示历史记录弹出
  historyShowSidebar = () => {
    this.setState({
      historySidebarVisible: true,
    });
  };

  historySidebarCancel = () => {
    this.setState({
      historySidebarVisible: false,
    });
  };

  historySidebarOk = () => {
    this.setState({
      historySidebarVisible: false,
    });
  };

  loginMethodCodeState = (values) => {
    const { loginMethodTypes } = this.state;
    const temp = loginMethodTypes.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  };

  handleHistorySidebar = () => {
    const { historySidebarVisible, dataSourse_l, loading } = this.state;
    const columns = [
      {
        title: UserInfoStore.languages[`${intlPrefix}.loginHistory.method`],
        // title: '登录方式',
        dataIndex: 'loginMethod',
        key: 'loginMethod',
        width: 100,
        render: (values, record) => this.loginMethodCodeState(record.loginMethod),
      },
      {
        title: UserInfoStore.languages[`${intlPrefix}.loginHistory.inTime`],
        // title: '登录时间',
        dataIndex: 'loginInTime',
        key: 'loginInTime',
        width: 200,
      },
      {
        title: UserInfoStore.languages[`${intlPrefix}.loginHistory.address`],
        // title: '登录地址',
        dataIndex: 'address',
        key: 'address',
      },
    ];
    return (
      <div>
        <Sidebar
          title={UserInfoStore.languages[`${intlPrefix}.loginHistory`]}
          visible={historySidebarVisible}
          onCancel={this.historySidebarCancel}
          onOk={this.historySidebarOk}
          width={952}
          style={{ right: 0 }}
          cancelText={UserInfoStore.languages[`${intlPrefix}.loginHistory.cancel`]}
          footer={[
            <Button
              funcType="raised"
              onClick={this.historySidebarCancel}>
              {UserInfoStore.languages[`${intlPrefix}.loginHistory.cancel`]}
            </Button>,
          ]}
        >
          <div>
            <Table
              columns={columns}
              dataSource={dataSourse_l}
              filterBar={false}
              loading={loading}
            />
          </div>
        </Sidebar>
      </div>
    );
  };

  // 微信弹出框显示
  addWeChatShowModal = () => {
    this.setState({
      addWeChatVisible: true,
    });
  };


  //展示弹出框
  addPhoneShowModal = () => {
    this.setState({
      addPhoneVisible: true,
    });
  };
  //弹出框的XXX
  handleAdd_Pohone = () => {
    this.setState({
      text: '',
      inputPhoneNum: '',
    });
    this.props.form.resetFields();
  };


  //取消
  addPhoneCancel = (e) => {
    const { inputPhoneNum } = this.state;
    this.handleAdd_Pohone();
    this.state.stopPhone = true;
    this.setState({
      inputPhoneNum: '',
      value: '',
      addPhoneVisible: false,
      countPhone: '',
      phoneBtn: false,
    });
  };

  //微信绑定modal确定按钮
  handleWeChatSubmit = () => {
    this.handleRefresh();
    this.setState({
      addWeChatVisible: false,
    });
    // this.props.history.push(`userinfo?type=site`);
    this.handleBigRefush();
  };

  // 微信绑定modal返回按钮
  addWeChatCancel = () => {
    this.setState({
      addWeChatVisible: false,
    });
  };

  // 渲染微信绑定modal
  handleAddWeChat = () => {
    const { addWeChatVisible, WeChatQRcodeUrl } = this.state;
    return (
      <div>
        <Modal
          title={UserInfoStore.languages[`${intlPrefix}.bind.WeChat`]}
          visible={addWeChatVisible}
          onOk={this.handleWeChatSubmit}
          onCancel={this.addWeChatCancel}
          className='geRenZhonXinModal'
          destroyOnClose={true}
          footer={[
            <span style={{ float: 'left' }}>{UserInfoStore.languages[`${intlPrefix}.bind.WeChatNotice`]}</span>,
            <Button
              onClick={this.handleWeChatSubmit}
              style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
              type="primary"
              funcType="raised"
            >
              {UserInfoStore.languages.ok}
            </Button>, <Button
              onClick={this.addWeChatCancel}
              funcType="raised"
              style={{ marginRight: '20px' }}
            >
              {UserInfoStore.languages.cancel}
            </Button>]}
        >
          <div style={{ margin: 'auto', display: 'flex', justifyContent: 'center' }}>
            <img style={{ margin:'40px 0', width: '128px', height:'128px' }} src={WeChatQRcodeUrl} alt="weChatQRcode" />
          </div>
        </Modal>
      </div>
    );
  };

  //渲染解绑弹出框
  handleAddPhone = () => {
    const { AppState, edit, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { addPhoneVisible, phoneNum, phoneBtn, dataSourse_p, inputPhoneNum } = this.state;
    const { organizationId } = AppState.currentMenuType;
    return (
      <div>
        {dataSourse_p.phone == null || dataSourse_p.phone == '' ? (
          <Modal
            title={UserInfoStore.languages[`${intlPrefix}.bind.content`]}
            visible={addPhoneVisible}
            onOk={this.handlePhoneSubmit.bind(this)}
            onCancel={this.addPhoneCancel}
            className='geRenZhonXinModal'
            destroyOnClose={true}
            footer={[<Button
              onClick={this.handlePhoneSubmit.bind(this)}
              style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
              type="primary"
              funcType="raised"
            >
              {UserInfoStore.languages.ok}
            </Button>, <Button
              onClick={this.addPhoneCancel}
              funcType="raised"
              style={{ marginRight: '20px' }}
            >
              {UserInfoStore.languages.cancle}
            </Button>]}
          >
            <Form onSubmit={this.phoneUnbind.bind(this)} style={{ marginLeft: 95, marginBottom: 10 }}>

              <FormItem style={{ display: 'inline-block', marginTop: 30, marginLeft: 20 }}>
                {getFieldDecorator('phone', {
                  validateTrigger: 'onBlur',
                  validateFirst: true,
                })(
                  <IntlTelInput
                    border={false}
                    style={{ border: 'none' }}
                    //separateDialCode={true}
                    onPhoneNumberChange={this.handleGetInputValue}
                    onChange={this.handleGetInputValue}
                    css={['intl-tel-input', 'form-control']}
                    placeholder={UserInfoStore.languages[`${intlPrefix}.enter.BoundPhoneNumber`]}
                    defaultCountry="cn"
                  />,
                )}
              </FormItem>
              <FormItem style={{ display: 'inline-block', marginTop: 15, marginLeft: 20 }}>
                {getFieldDecorator('YZM', {
                  validateTrigger: 'onBlur',
                  rules: [
                    {
                      required: true,
                      message: UserInfoStore.languages[`${intlPrefix}.not.taskComment_YZM`],
                    },
                  ],
                  initialValue: '',
                  validateFirst: true,
                })(
                  <Input
                    value={this.state.inputYzm}
                    onChange={this.handleGetInputValueYzm}
                    autoComplete="off"
                    placeholder={UserInfoStore.languages[`${intlPrefix}.enter.verificationCode`]}
                    style={{ width: 150 }}
                    maxLength={6}
                  />,
                )}
                <Button onClick={this.bindingCheckPhone} funcType="raised" disabled={phoneBtn}
                        style={{ marginLeft: 10 }}>{this.state.stopPhone ? UserInfoStore.languages[`${intlPrefix}.send.verificationCode`] : UserInfoStore.languages[`${intlPrefix}.verificationCode.sent`] + this.state.countPhone + UserInfoStore.languages.second}</Button>
              </FormItem>
            </Form>


          </Modal>
        ) : (
          <Modal
            title={UserInfoStore.languages[`${intlPrefix}.unbind.content`]}
            visible={addPhoneVisible}
            className='geRenZhonXinModal'
            onOk={this.phoneUnbind}
            onCancel={this.addPhoneCancel}
            footer={[<Button
              onClick={this.phoneUnbind}
              style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
              type="primary"
              funcType="raised"
            >
              {UserInfoStore.languages.ok}
            </Button>, <Button
              onClick={this.addPhoneCancel}
              funcType="raised"
              style={{ marginRight: '20px' }}
            >
              {UserInfoStore.languages.cancle}
            </Button>]}
            destroyOnClose={true}
          >

            <Form onSubmit={this.phoneUnbind.bind(this)} style={{ marginLeft: 100, marginTop: 15, marginBottom: 15 }}>
              <div style={{ display: 'inline-block', fontSize: 17, marginLeft: 20, marginTop: 15 }}>
                {phoneNum}
              </div>
              <div style={{ marginBottom: -10 }}>
                <FormItem style={{ display: 'inline-block', marginTop: 0, marginLeft: 20 }}>
                  {getFieldDecorator('YZM', {
                    validateTrigger: 'onBlur',
                    rules: [
                      {
                        required: true,
                        message: UserInfoStore.languages[`${intlPrefix}.not.taskComment_YZM`],
                      },
                    ],
                    initialValue: '',
                    validateFirst: true,
                  })(
                    <Input
                      value={this.state.inputYzm}
                      onChange={this.handleGetInputValueYzm}
                      autoComplete="off"
                      placeholder={UserInfoStore.languages[`${intlPrefix}.enter.verificationCode`]}
                      style={{ width: 150 }}
                      maxLength={6}
                    />,
                  )}
                  <Button onClick={this.bindingSendPhoneYzm} funcType="raised" disabled={phoneBtn}
                          style={{ marginLeft: 10 }}>{this.state.stopPhone ? UserInfoStore.languages[`${intlPrefix}.send.verificationCode`] : UserInfoStore.languages[`${intlPrefix}.verificationCode.sent`] + this.state.countPhone + UserInfoStore.languages.second}</Button>

                </FormItem>

              </div>
            </Form>


          </Modal>)}
      </div>


    );
  };
  //获取账户信息
  loadSelf = () => {
    // 获取手机信息
    const { id, intl, AppState } = this.props;
    const { dataSourse_l } = this.state;
    AppState.loadUserInfo().then(data => {
      this.setState({
        dataSourse_p: data,
        phoneNum: data.phone || '',
        inputYzm: '',
      });
    });
    //获取历史登录记录
    this.setState({ loading: true });
    axios.get(`/iam/v1/user/login/history`)
      .then((data) => {
        this.setState({
          dataSourse_l: data.content,
        });
        UserInfoStore.getLoginMethodTypes(AppState.userInfo.organizationId)
          .then((d) => {
            this.setState({
              loginMethodTypes: d,
              loading: false,
            });
          }).catch((err) => {
          Choerodon.handleResponseError(err);
        });
      });
    // 获取微信信息
    UserInfoStore.getWeChatQRcode()
      .then((data) => {
        this.setState({
          WeChatQRcodeUrl: data,
        });
      });
    UserInfoStore.getWechatNickname(AppState.userInfo.organizationId, AppState.userInfo.id)
      .then((res) => {
        if(res.success){
          this.setState({
            WeChatNickname: res.result,
          });
        }
      });
  };


  //  校验手机号是否存在
  bindingCheckPhone = () => {
    const { intl, AppState } = this.props;
    const { phoneNum, inputPhoneNum } = this.state;
    if (inputPhoneNum != '') {
      if (AppState.userInfo.organizationId == 0 || AppState.userInfo.organizationId == null) {

        BindingStore.bindingCheckPhones(inputPhoneNum).then((data) => {
          if (data == 1) {
            Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.checkPhoneFiled`]);
          } else {
            this.setState({
              phoneNum: inputPhoneNum,
            });
            this.bindingSendPhoneYzm();
          }
        });
      } else {
        BindingStore.bindingCheckPhonesOrg(AppState.userInfo.organizationId, inputPhoneNum).then((data) => {
          if (data == 1) {
            Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.checkPhoneFiled`]);
          } else {
            this.setState({
              phoneNum: inputPhoneNum,
            });
            this.bindingSendPhoneYzm();
          }
        });

      }


    } else {
      Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.phoneNumber`]);
    }
  };


  //  获取手机验证码
  bindingSendPhoneYzm = () => {
    const { phoneNum, phoneBtn, inputPhoneNum } = this.state;
    const { AppState } = this.props;
    if (phoneNum != '') {
      if (AppState.userInfo.organizationId == 0 || AppState.userInfo.organizationId == null) {
        BindingStore.bindingSendPhoneYzms(phoneNum).then((data) => {
          if (data == 0) {
            Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.yzm.phone.filed`]);
          } else if (data == 1) {
            this.setState({
              phoneBtn: true,
            });
            this.buttonPhoneClick();
          }
        });
      } else {
        BindingStore.bindingSendPhoneYzmsOrg(AppState.userInfo.organizationId, phoneNum).then((data) => {
          if (data == 0) {
            Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.yzm.phone.filed`]);
          } else if (data == 1) {
            this.setState({
              phoneBtn: true,
            });
            this.buttonPhoneClick();
          }
        });

      }
    } else if (inputPhoneNum != '') {
      if (AppState.userInfo.organizationId == 0 || AppState.userInfo.organizationId == null) {
        BindingStore.bindingSendPhoneYzms(inputPhoneNum).then((data) => {
          if (data == 0) {
            Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.yzm.phone.filed`]);
          } else if (data == 1) {
            this.setState({
              phoneBtn: true,
            });
            this.buttonPhoneClick();
          }
        });
      } else {
        BindingStore.bindingSendPhoneYzmsOrg(AppState.userInfo.organizationId, inputPhoneNum).then((data) => {
          if (data == 0) {
            Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.yzm.phone.filed`]);
          } else if (data == 1) {
            this.setState({
              phoneBtn: true,
            });
            this.buttonPhoneClick();
          }
        });
      }
    } else {
      Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.taskPhoneComment`]);
    }
  };


  //  验证码按钮点击之后样式改变
  buttonPhoneClick = () => {
    //clearInterval(this.timerPhone);
    this.state.stopPhone = false;
    this.state.flagPhine = !this.state.flagPhine;
    if (this.state.flagPhine) {
      this.setState({
        likedPhone: true,
        countPhone: this.state.countPhone,
      });
    } else {
      if (this.state.likedPhone) {
        this.timerPhone = setInterval(function () {
          let countPhone = this.state.countPhone;
          this.state.likedPhone = false;
          countPhone -= 1;
          if (countPhone < 1) {
            this.setState({
              stopPhone: true,
              likedPhone: true,
              flagPhine: true,
              phoneBtn: false,
              countPhone: 60,
            });
            countPhone = 60;
            //clearInterval(this.timerPhone);
          }
          this.setState({
            countPhone: countPhone,
          });
        }.bind(this), 1000);
      }
    }
  };


  //确认绑定号码按钮
  handlePhoneSubmit = (e) => {
    const { AppState, edit, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const { inputPhoneNum, inputYzm } = this.state;
    const tenantId = menuType.id;
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (AppState.userInfo.organizationId == 0 || AppState.userInfo.organizationId == null) {
        if (inputYzm !== '' || inputPhoneNum !== '') {
          BindingStore.bindingPhoneSubmits(inputPhoneNum, inputYzm).then((data) => {
            if (data == 0) {
              message.info(UserInfoStore.languages[`${intlPrefix}.yzmError`]);
            } else {
              this.setState({
                inputPhoneNum: '',
                countPhone: '',
                phoneBtn: false,
                addPhoneVisible: false,
              });
              message.info(UserInfoStore.languages['create.success']);
              this.handleRefresh();
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else {
          message.info(UserInfoStore.languages[`${intlPrefix}.taskComment_YZM`]);
        }
      } else {
        if (inputYzm !== '' && inputPhoneNum !== '') {
          BindingStore.bindingPhoneSubmitsOrg(AppState.userInfo.organizationId, inputPhoneNum, inputYzm).then((data) => {
            if (data == 0) {
              message.info(UserInfoStore.languages[`${intlPrefix}.yzmError`]);
            } else {
              this.setState({
                inputPhoneNum: '',
                countPhone: '',
                phoneBtn: false,
                addPhoneVisible: false,
              }),
                message.info(UserInfoStore.languages['create.success']);
              this.handleRefresh();
            }
          }).catch((error) => {
            onError();
            Choerodon.handleResponseError(error);
          });
        } else {
          message.info(UserInfoStore.languages[`${intlPrefix}.taskComment_YZM`]);
        }
      }
    });
  };

  handleGetInputValue = (e, status) => {
    if (status.length == 11) {
      this.setState({
        inputPhoneNum: status,
      });
    }
  };

  handleGetInputValueYzm = (e) => {
    this.setState({
      inputYzm: e.target.value,
    });
  };
  //手机号码解除绑定
  phoneUnbind = () => {
    const { phoneNum } = this.state;
    const { intl, AppState } = this.props;
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (data) {
        if (AppState.userInfo.organizationId == 0 || AppState.userInfo.organizationId == null) {
          BindingStore.phoneUnbinds(phoneNum, this.state.inputYzm).then((data) => {
            if (data == 1) {
              this.handleRefresh();
              this.setState({
                inputYzm: '',
                phoneNum: '',
                countPhone: '',
                phoneBtn: false,
                addPhoneVisible: false,
              });
              message.success(UserInfoStore.languages[`${intlPrefix}.unbind.success`]);
            } else {
              message.success(UserInfoStore.languages[`${intlPrefix}.yzmError`]);
            }
          });
        } else {
          BindingStore.phoneUnbindsOrg(AppState.userInfo.organizationId, phoneNum, this.state.inputYzm).then((data) => {
            if (data == 1) {
              this.handleRefresh();
              this.setState({
                inputYzm: '',
                phoneNum: '',
                countPhone: '',
                phoneBtn: false,
                addPhoneVisible: false,
              });
              message.success(UserInfoStore.languages[`${intlPrefix}.unbind.success`]);
            } else {
              message.success(UserInfoStore.languages[`${intlPrefix}.yzmError`]);
            }
          });

        }
      }
    });
  };


  //展示弹出框
  addEmailShowModal = () => {
    this.setState({
      addEmailVisible: true,
    });
  };

  //弹出框的XXX
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
  };
  //弹出框的取消按钮
  addEmailCancel = (e) => {
    this.handleAdd_Email();
    this.state.stop = true;
    this.setState({
      value: '',
      emailBtn: false,
      count: '',
      addEmailVisible: false,
    });
  };

  //  加载页面方法
  loadBinding = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const params = paramsIn || paramsState;
    if (AppState.userInfo.organizationId == 0 || AppState.userInfo.organizationId == null) {
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
  };

  // 标记主体邮箱
  bindingMainEmail = (record) => {
    const { intl, AppState } = this.props;
    if (AppState.userInfo.organizationId == 0 || AppState.userInfo.organizationId == null) {
      BindingStore.bindingMainEmails(record.id).then(({ failed, message }) => {
        if (failed) {
        } else {
          Choerodon.prompt(UserInfoStore.languages['modify.success']);
          this.handleBigRefush();
        }
      }).catch((error) => {
        Choerodon.prompt(UserInfoStore.languages['modify.error']);
      });
    } else {
      BindingStore.bindingMainEmailsOrg(AppState.userInfo.organizationId, record.id).then(({ failed, message }) => {
        if (failed) {
        } else {
          Choerodon.prompt(UserInfoStore.languages['modify.success']);
          this.handleBigRefush();
        }
      }).catch((error) => {
        Choerodon.prompt(UserInfoStore.languages['modify.error']);
      });
    }
  };
  //  校验邮箱是否存在
  bindingCheckEmail = (rule, value, callback) => {
    const { AppState } = this.props;
    this.setState({ emailValue: value, emailChecking: false, emailError: true });
    //this.setState({ emailValue: value});
    if (value != '') {
      if (AppState.userInfo.organizationId == 0 || AppState.userInfo.organizationId == null) {
        BindingStore.bindingCheckEmails(value).then((data) => {
          if (data === 1) {
            this.setState({
              emailChecking: false,
              emailError: true,
            });
            callback(UserInfoStore.languages[`${intlPrefix}.checkEmailFiled`]);
          } else {
            this.setState({
              emailValue: value,
              emailChecking: false,
              emailError: false,
            });
            callback();
          }
        });
      } else {
        BindingStore.bindingCheckEmailsOrg(AppState.userInfo.organizationId, value).then((data) => {
          if (data === 1) {
            this.setState({
              emailChecking: false,
              emailError: true,
            });
            callback(UserInfoStore.languages[`${intlPrefix}.checkEmailFiled`]);
          } else {
            this.setState({
              emailValue: value,
              emailChecking: false,
              emailError: false,
            });
            callback();
          }
        });
      }
    } else {
      this.setState({ emailChecking: false, emailError: false });
      callback(UserInfoStore.languages[`${intlPrefix}.taskComment`]);
    }
  };
  //  验证码按钮点击之后样式改变
  buttonClick = () => {
    //clearInterval(this.timer);
    this.state.stop = false;
    this.state.flag = !this.state.flag;
    if (this.state.flag) {
      this.setState({
        liked: true,
        count: this.state.count,
      });
    } else {
      if (this.state.liked) {
        this.timer = setInterval(function () {
          let count = this.state.count;
          this.state.liked = false;
          count -= 1;
          if (count < 1) {
            this.setState({
              emailBtn: false,
              count: 60,
              liked: true,
              flag: true,
              stop: true,
            });
            count = 60;
            // clearInterval(this.timer);
          }
          this.setState({
            count: count,
          });
        }.bind(this), 1000);
      }
    }
  };
  //  获取邮箱验证码
  bindingSendYzm = () => {
    const { emailValue, valueName, emailChecking, emailError } = this.state;
    if (emailChecking) {
      Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.email.checking`] || '邮箱校验中');
      return;
    }
    if (emailError) {
      Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.yzm.filed`]);
      return;
    }

    this.props.form.validateFields(['emailName'], (fieldObject) => {
      if (fieldObject && fieldObject.emailName && fieldObject.emailName.errors && fieldObject.emailName.errors[0] && fieldObject.emailName.errors[0].message) {
        // alert(JSON.stringify(fieldObject, null, 2))
        return;
      }

      const { intl, AppState } = this.props;
      if (valueName != '') {
        if (AppState.userInfo.organizationId == 0 || AppState.userInfo.organizationId == null) {
          BindingStore.bindingSendYzms(emailValue).then((data) => {
            if (data == 0) {
              Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.yzm.filed`]);
            } else if (data == 1) {
              this.buttonClick();
              this.setState({
                emailBtn: true,
              });
            }
          });
        } else {
          BindingStore.bindingSendYzmsOrg(AppState.userInfo.organizationId, emailValue).then((data) => {
            if (data == 0) {
              Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.yzm.filed`]);
            } else if (data == 1) {
              this.buttonClick();
              this.setState({
                emailBtn: true,
              });
            }
          });
        }
      } else {
        Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.taskComment`]);
      }
    });
  };

  //确认绑定邮箱按钮
  handleEmailSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      const { AppState, edit } = this.props;
      const menuType = AppState.currentMenuType;
      const tenantId = menuType.id;
      if (data.emailName !== '' && data.verificationCode !== '') {
        if (AppState.userInfo.organizationId == 0 || AppState.userInfo.organizationId == null) {
          BindingStore.bindingSubmits(data.emailName, data.verificationCode).then((data) => {
            if (data == 0) {
              Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.yzmError`]);
            } else {
              Choerodon.prompt(UserInfoStore.languages['create.success']);
              this.handleRefresh();
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else {
          BindingStore.bindingSubmitsOrg(AppState.userInfo.organizationId, data.emailName, data.verificationCode).then((data) => {
            if (data == 0) {
              Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.yzmError`]);
            } else {
              Choerodon.prompt(UserInfoStore.languages['create.success']);
              this.handleRefresh();
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        }
      }


    });
  };

  onChangeEmail = (value) => {
    this.setState({
      valueName: value,
    });
  };

  //渲染添加绑定邮箱弹出框
  handleAddEmail = () => {
    const { AppState, edit, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { addEmailVisible, email, emailBtn } = this.state;
    const { organizationId } = AppState.currentMenuType;
    return (
      <Modal
        title={UserInfoStore.languages[`${intlPrefix}.invitationApprove`]}
        visible={addEmailVisible}
        onOk={this.handleEmailSubmit}
        onCancel={this.addEmailCancel}
        className="geRenZhonXinModal"
        footer={[<Button
          onClick={this.handleEmailSubmit}
          style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
          type="primary"
          funcType="raised"
        >
          {UserInfoStore.languages.ok}
        </Button>, <Button
          onClick={this.addEmailCancel}
          funcType="raised"
          style={{ marginRight: '20px' }}
        >
          {UserInfoStore.languages.cancle}
        </Button>]}
        destroyOnClose={true}
      >
        <Form style={{ marginLeft: 100, height: 165 }} onSubmit={this.handleEmailSubmit.bind(this)}>
          <FormItem style={{ display: 'inline-block', marginTop: 30 }}>
            {getFieldDecorator('emailName', {
              validateTrigger: 'onBlur',
              rules: [
                {
                  required: true,
                  message: UserInfoStore.languages[`${intlPrefix}.taskComment`],

                },
                {
                  validator: this.bindingCheckEmail,
                },
                {
                  pattern: /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/,
                  message: UserInfoStore.languages[`${intlPrefix}.correct.messageCode`],
                },
              ],
              initialValue: '',
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                placeholder={UserInfoStore.languages[`${intlPrefix}.enter.BoundEmail`]}
                style={{ width: 250 }}
                onChange={this.onChangeEmail}
              />,
            )}
          </FormItem>
          <FormItem style={{ display: 'inline-block', marginTop: 20 }}>
            {getFieldDecorator('verificationCode', {

              rules: [
                {
                  required: true,
                  message: UserInfoStore.languages[`${intlPrefix}.not.taskComment_YZM`],
                },
              ],
              initialValue: '',
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                placeholder={UserInfoStore.languages[`${intlPrefix}.enter.verificationCode`]}
                style={{ width: 150 }}
                maxLength={6}
              />,
            )}

            <Button onClick={this.bindingSendYzm} funcType="raised" disabled={emailBtn}
                    style={{ marginLeft: 15 }}>{this.state.stop ? UserInfoStore.languages[`${intlPrefix}.send.verificationCode`] : UserInfoStore.languages[`${intlPrefix}.verificationCode.sent`] + this.state.count + UserInfoStore.languages.second}</Button>

          </FormItem>
        </Form>

      </Modal>
    );
  };
  renderEmail = () => {
    const { visible, pagination, dataSource, params, isLDAP, selfLDAP } = this.state;
    const { AppState, intl, form } = this.props;
    const columns = [
      {
        title: UserInfoStore.languages[`${intlPrefix}.email`],
        dataIndex: 'emailName',
        key: 'emailName',
        render: (text, record) => {
          return (
            <span>{text}</span>
          );
        },
      },
      {
        title: UserInfoStore.languages[`${intlPrefix}.selected_email`],
        dataIndex: 'isMain',
        key: 'isMain',
        render: (text, record) => {
          if (record) {
            if (record.isMain == 0) {
              return '';
            } else {
              if (AppState.currentLanguage === 'en_US') {
                return (<span style={{
                  textAlign: 'center',
                  fontSize: 11,
                  display: 'inline-block',
                  background: '#FF9700',
                  color: 'white',
                  width: 84,
                  height: 18,
                  borderRadius: 3,
                }}>{UserInfoStore.languages[`${intlPrefix}.mainEmail`]}</span>);
              } else {
                return (<span style={{
                  textAlign: 'center',
                  fontSize: 11,
                  display: 'inline-block',
                  background: '#FF9700',
                  color: 'white',
                  width: 52,
                  height: 18,
                  borderRadius: 3,
                }}>{UserInfoStore.languages[`${intlPrefix}.mainEmail`]}</span>);

              }
            }
          }
        },
      },
      {
        title: UserInfoStore.languages[`${intlPrefix}.selected_email`],
        dataIndex: 'isMain',
        key: 'isMain',
        render: (text, record) => {
          if (record) {
            if (record.isMain == 0) {
              return (<Button size="small" disabled={isLDAP && selfLDAP}
                              style={{ background: '#2196F3', color: 'white', fontSize: 13, width: 'auto', height: 28 }}
                              onClick={this.bindingMainEmail.bind(this, record)}>{UserInfoStore.languages[`${intlPrefix}.settingMainEmail`]}</Button>);
            } else {
              return '';
            }

          }
        },
      },
      {
        dataIndex: 'type',
        key: 'type',
        render: (text, record) => {

          if (record) {
            if (isLDAP && selfLDAP) {
              if (record.isMain == 0) {
                return (<Button size="small" style={{
                  display: 'inline-block',
                  textAlign: 'center',
                  lineHeight: 2,
                  color: 'red',
                  fontSize: 13,
                  borderRadius: 4,
                  height: 28,
                  width: 'auto',
                  opacity: 0.65,
                  border: '1px' +
                    ' solid #81899',
                }}>{UserInfoStore.languages.delete}</Button>);
              } else {
                return '';
              }
            } else {
              if (record.isMain == 0) {
                return (<Button style={{
                  display: 'inline-block',
                  textAlign: 'center',
                  lineHeight: 2,
                  color: 'red',
                  fontSize: 13,
                  borderRadius: 4,
                  height: 28,
                  width: 'auto',
                  opacity: 0.65,
                  border: '1px' +
                    ' solid red',
                }} onClick={this.handleDeleteOk.bind(this, record)}>{UserInfoStore.languages.delete}</Button>);
              } else {
                return '';
              }
            }

          }

        },
      },
    ];

    return (
      <Table
        pagination={false}
        dataSource={dataSource}
        filterBar={false}
        columns={columns}
        filters={params}
        showHeader={false}
      />
    );
  };


  // 删除弹出框
  handleDeleteOk = (record) => {
    const { intl } = this.props;
    Modal.confirm({
      title: UserInfoStore.languages[`${intlPrefix}.cancel.title`],
      content: UserInfoStore.languages[`${intlPrefix}.cancel.content`],
      okText: UserInfoStore.languages.confirm,
      cancelText: UserInfoStore.languages.cancel,
      onOk: () => {

        const { AppState, intl } = this.props;
        if (record.isMain == 1) {
          Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.deleteMain.filed`]);
        } else {
          if (AppState.userInfo.organizationId == 0 || AppState.userInfo.organizationId == null) {
            BindingStore.bindingDeletes(record.id).then(({ failed, message }) => {
              if (failed) {
                Choerodon.prompt(message);
              } else {
                Choerodon.prompt(UserInfoStore.languages['delete.success']);

                this.handleRefresh();
              }
            });
          } else {
            BindingStore.bindingDeletesOrg(AppState.userInfo.organizationId, record.id).then(({ failed, message }) => {
              if (failed) {
                Choerodon.prompt(message);
              } else {
                Choerodon.prompt(UserInfoStore.languages['delete.success']);
                this.handleRefresh();
              }
            });
          }
        }
      },
    });
  };

  weChatUnbind = () => {
    const {AppState} = this.props;
    const { organizationId, id } = AppState.userInfo;
    UserInfoStore.weChatUnbind(organizationId,id)
      .then((res)=>{
        if(res.success)
        this.handleRefresh();
      });
  };


  renderForm(user) {
    const { intl } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { submitting, emailNew, dataSourse_p, dataSourse_l, phoneNum, dataSource, isLDAP, selfLDAP, loading, WeChatNickname } = this.state;
    const { loginName, realName, email, language, timeZone, phone, wechatUserId } = user;
    const languages = UserInfoStore.getLanguagelist;
    const lanOption = [];
    languages.forEach((item) => {
      lanOption.push(<Option value={item.code}>{item.name}</Option>);
    });
    const dataSourse_l_out = dataSourse_l.slice(0, 5);

    const columns = [
      {
        title: UserInfoStore.languages[`${intlPrefix}.loginHistory.method`],
        // title: '登录方式',
        dataIndex: 'loginMethod',
        key: 'loginMethod',
        width: 100,
        render: (values, record) => this.loginMethodCodeState(record.loginMethod),
      },
      {
        title: UserInfoStore.languages[`${intlPrefix}.loginHistory.inTime`],
        // title: '登录时间',
        dataIndex: 'loginInTime',
        key: 'loginInTime',
        width: 200,
      },
      {
        title: UserInfoStore.languages[`${intlPrefix}.loginHistory.address`],
        // title: '登录地址',
        dataIndex: 'address',
        key: 'address',
      },
    ];

    return (

      <Form onSubmit={this.handleSubmit} layout="vertical" className="user-info">
        {this.getAvatar(user)}
        <div style={{ display: 'flex' }}>
          <div style={{ width: '50%' }}>
            <div>
              <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 20, marginTop: 29 }}>
              <span style={{
                display: 'inline-block',
                width: 2,
                height: 18,
                background: '#2196F3',
              }}>&nbsp;&nbsp;&nbsp;</span>
                &nbsp;&nbsp;&nbsp;{UserInfoStore.languages[`${intlPrefix}.basicInformation`]}
              </div>
              <FormItem
                style={{ paddingBottom: 0, marginBottom: 16 }}
                {...formItemLayout}
              >
                {getFieldDecorator('loginName', {
                  initialValue: loginName,
                })(
                  <Input
                    disabled
                    autoComplete="off"
                    label={UserInfoStore.languages[`${intlPrefix}.loginname`]}
                    style={{ width: inputWidth }}
                  />,
                )}
              </FormItem>
              <FormItem
                style={{ paddingBottom: 0, marginBottom: 16 }}
                {...formItemLayout}
              >
                {getFieldDecorator('realName', {
                  rules: [
                    {
                      required: true,
                      whitespace: true,
                      message: UserInfoStore.languages[`${intlPrefix}.name.require.msg`],
                    },
                  ],
                  validateTrigger: 'onBlur',
                  initialValue: realName ? realName : loginName,
                })(
                  <Input
                    autoComplete="off"
                    label={UserInfoStore.languages[`${intlPrefix}.name`]}
                    style={{ width: inputWidth }}
                    maxLength={60}
                  />,
                )}
              </FormItem>
              <FormItem
                style={{ paddingBottom: 0, marginBottom: 16 }}
                {...formItemLayout}
              >
                {getFieldDecorator('language', {
                  rules: [
                    {
                      required: true,
                      message: UserInfoStore.languages[`${intlPrefix}.language.require.msg`],
                    },
                  ],
                  initialValue: language || 'zh_CN',
                })(
                  <Select
                    label={UserInfoStore.languages[`${intlPrefix}.language`]}
                    style={{ width: inputWidth }}
                    getPopupContainer={triggerNode => triggerNode.parentNode}

                  >
                    {lanOption}
                  </Select>,
                )}
              </FormItem>
              <FormItem
                style={{ paddingBottom: 0, marginBottom: 16 }}
                {...formItemLayout}
              >
                {getFieldDecorator('timeZone', {
                  rules: [
                    {
                      required: true,
                      message: UserInfoStore.languages[`${intlPrefix}.timezone.require.msg`],
                    }],
                  initialValue: timeZone || 'CTT',
                })(
                  <Select
                    label={UserInfoStore.languages[`${intlPrefix}.timezone`]}
                    style={{ width: inputWidth }}>
                    {this.getTimeZoneOptions()}
                  </Select>,
                )}
              </FormItem>
            </div>
            <div>
              <div style={{
                fontSize: 18,
                lineHeight: 1,
                marginBottom: 20,
                marginTop: 29,
                display: 'inline-block',
                marginRight: 15,
              }}>
              <span style={{
                display: 'inline-block',
                width: 2,
                height: 18,
                background: '#2196F3',
              }}>&nbsp;&nbsp;&nbsp;</span>
                &nbsp;&nbsp;&nbsp;{UserInfoStore.languages[`${intlPrefix}.loginHistory`]}
              </div>
              <Button
                style={{ color: '#04173f' }}
                onClick={this.historyShowSidebar}
              >
                <Icon type="search" style={{ color: '#2196F3' }} />
                {UserInfoStore.languages[`${intlPrefix}.loginHistory.more`]}
              </Button>
              <div style={{ width: '85%' }}>
                <Table
                  columns={columns}
                  dataSource={dataSourse_l_out}
                  pagination={false}
                  filterBar={false}
                  loading={loading}
                  scroll={{ y: 120, x: 300 }}
                />
              </div>
            </div>
            <Permission
              service={['iam-service.user.queryInfo', 'iam-service.user.updateInfo', 'iam-service.user.querySelf']}
              type="site"
            >
              <FormItem>
                <Button
                  htmlType="submit"
                  funcType="raised"
                  type="primary"
                  loading={submitting}
                >{UserInfoStore.languages.save}</Button>
                <Button
                  funcType="raised"
                  onClick={this.handleCancel}
                  style={{ marginLeft: 16, marginTop: 16 }}
                  disabled={submitting}
                >{UserInfoStore.languages.cancel}</Button>
              </FormItem>
            </Permission>
          </div>
          <div>
            <div>
              <div style={{
                fontSize: 18,
                lineHeight: 1,
                marginBottom: 20,
                marginTop: 29,
                display: 'inline-block',
                marginRight: 15,
              }}>
              <span style={{
                display: 'inline-block',
                width: 2,
                height: 18,
                background: '#2196F3',
              }}>&nbsp;&nbsp;&nbsp;</span>
                &nbsp;&nbsp;&nbsp;{UserInfoStore.languages[`${intlPrefix}.phoneAccount`]}
              </div>
              {dataSourse_p.phone == null || dataSourse_p.phone == '' ? (
                <Button
                  style={{ color: '#04173f' }}
                  onClick={this.addPhoneShowModal}
                  disabled={isLDAP && selfLDAP}
                >
                  <Icon type="xinjian" style={{ color: '#2196F3' }} />
                  {UserInfoStore.languages[`${intlPrefix}.bind.content`]}
                </Button>
              ) : (
                <div>
                  <div style={{ display: 'inline-block', fontSize: 14, marginLeft: 15 }}>
                    {phoneNum}
                  </div>
                  <Button style={{ marginLeft: 15, color: '#04173f' }}
                          onClick={this.addPhoneShowModal}
                          disabled={isLDAP && selfLDAP}
                  >
                    <Icon type="hjbjbh" style={{ color: '#2196F3' }} />
                    {UserInfoStore.languages[`${intlPrefix}.cancel_binding`]}
                  </Button>
                </div>
              )}

            </div>
            <div>
              <div style={{ display: 'inline-block', fontSize: 18, lineHeight: 1, marginBottom: 20, marginTop: 29 }}>
              <span style={{
                display: 'inline-block',
                width: 2,
                height: 18,
                background: '#2196F3',
              }}>&nbsp;&nbsp;&nbsp;</span>
                &nbsp;&nbsp;&nbsp;{UserInfoStore.languages[`${intlPrefix}.emailAccount`]}
              </div>
              <div style={{ display: 'inline-block' }}>
                {dataSource.length > 4 ? (
                  <Tooltip placement="topLeft" title={UserInfoStore.languages[`${intlPrefix}.mailbox.limit`]}>
                    <Button
                      style={{ marginLeft: 15, color: '#04173f' }}
                      disabled={true}
                    >
                      <Icon type="xinjian" style={{ color: '#2196F3' }} />
                      {UserInfoStore.languages[`${intlPrefix}.add_email`]}
                    </Button>
                  </Tooltip>
                ) : (
                  <Button
                    style={{ marginLeft: 15, color: '#04173f' }}
                    onClick={this.addEmailShowModal}
                    disabled={isLDAP && selfLDAP}
                  >
                    <Icon type="xinjian" style={{ color: '#2196F3' }} />
                    {UserInfoStore.languages[`${intlPrefix}.add_email`]}
                  </Button>
                )}


              </div>
              <div style={{ display: 'inline-block', fontSize: 12, color: '#818999' }}><Icon
                style={{ color: '#2196F3' }}
                type="info" />{UserInfoStore.languages[`${intlPrefix}.mailbox.acceptSystem`]}
              </div>
              {this.renderEmail()}
            </div>
            {
              !wechatUserId && <div>
                <div style={{
                  fontSize: 18,
                  lineHeight: 1,
                  marginBottom: 20,
                  marginTop: 29,
                  display: 'inline-block',
                  marginRight: 15,
                }}>
              <span style={{
                display: 'inline-block',
                width: 2,
                height: 18,
                background: '#2196F3',
              }}>&nbsp;&nbsp;&nbsp;</span>
                  &nbsp;&nbsp;&nbsp;{UserInfoStore.languages[`${intlPrefix}.WeChatAccount`]}
                </div>
                {
                  (!WeChatNickname.false && !WeChatNickname.true) ? <Button
                      style={{ color: '#04173f' }}
                      onClick={this.addWeChatShowModal}
                    >
                      <Icon type="xinjian" style={{ color: '#2196F3' }} />
                      {UserInfoStore.languages[`${intlPrefix}.bind.WeChat`]}
                    </Button> :(
                    WeChatNickname.false==='pay.attention.to.cloopm.public.address'?(
                      <div>
                        <div style={{ display: 'inline-block', fontSize: 14, marginLeft: 15 }}>
                          {UserInfoStore.languages[`${intlPrefix}.followOfficialAccount`]}
                        </div>
                        <div>
                          <img style={{ margin:'20px 0',marginLeft:'15px', width: '128px', height:'128px' }} src={this.state.WeChatQRcodeUrl} alt="weChatQRcode" />
                        </div>
                      </div>
                    ):(
                      <div style={{ fontSize: 14, marginLeft: 15 }}>
                        {WeChatNickname.true}
                        <Popconfirm title={UserInfoStore.languages[`${intlPrefix}.confirmUnbind.WeChat`]}
                                    onConfirm={this.weChatUnbind}
                                    okText={UserInfoStore.languages.ok}
                                    cancelText={UserInfoStore.languages.cancel}>
                          <Button style={{ marginLeft: 15, color: '#04173f' }}>
                            <Icon type="quxiaofenxiang" style={{ color: '#2196F3' }} />
                            {UserInfoStore.languages[`${intlPrefix}.cancel_binding`]}
                          </Button>
                        </Popconfirm>
                      </div>
                    )
                  )

                }
              </div>
            }
          </div>
        </div>
      </Form>

    );
  }

  // 判断用户的ldap
  querySelfLDAP = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.userInfo.organizationId;
    return axios.get(`/iam/v1/users/self?organizationId=${AppState.userInfo.organizationId}`).then((data) => {
      this.setState({
        selfLDAP: data.ldap,
      });
    });
  };

  queryLDAPSelf = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.userInfo.organizationId;
    return axios.get(`/iam/v1/${AppState.userInfo.organizationId}/organizations`).then((data) => {
      this.setState({
        isLDAP: data.ldap,
      });
    });
  };

  render() {
    const user = UserInfoStore.getUserInfo;
    return (
      <Page
        service={[
          'iam-service.user.query',
          'iam-service.user.check',
          'iam-service.user.querySelf',
          'iam-service.user.queryInfo',
          'iam-service.user.updateInfo',
          'iam-service.user.uploadPhoto',
          'iam-service.user.queryProjects',
        ]}
      >
        <Header
          title={UserInfoStore.languages[`${intlPrefix}.header.title`]}
        >
        </Header>
        <Content>
          {this.renderForm(user)}
          {this.handleHistorySidebar()}
          {this.handleAddPhone()}
          {this.handleAddEmail()}
          {this.handleAddWeChat()}
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(injectIntl(UserInfo));
