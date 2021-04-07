/*eslint-disable*/
import React, { Component } from 'react';
import { Form, Input, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import TestLoading from '../ldapHome/TestLoading';
import './TestLdap.scss';
import LDAPStore from '../../../../stores/organization/ldap/LDAPStore';

const FormItem = Form.Item;
const inputWidth = 512; // input框的长度
const intlPrefix = 'organization.ldap';
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
let timer = null;

@inject('AppState')
@observer
class TestConnect extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      organizationId: this.props.AppState.currentMenuType.id,
    };
  }

  componentWillMount() {
    this.props.onRef(this);
    this.loadLanguage();

  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    LDAPStore.queryLanguage(id, AppState.currentLanguage);
  };

  getSyncInfoOnce = () => {
    const ldapData = LDAPStore.getLDAPData;
    const { organizationId } = this.state;
    LDAPStore.getSyncInfo(organizationId, ldapData.id).then((data) => {
      if (data.syncEndTime) {
        window.clearInterval(timer);
        LDAPStore.setSyncData(data);
        LDAPStore.setIsSyncLoading(false);
      }
    })
  }

  getSpentTime = (startTime, endTime) => {
    const { intl } = this.props;
    const timeUnit = {
      day: LDAPStore.languages[ 'day'],
      hour: LDAPStore.languages[ 'hour'],
      minute: LDAPStore.languages[ 'minute'],
      second: LDAPStore.languages[ 'second'],
    };
    const spentTime = new Date(endTime).getTime() - new Date(startTime).getTime(); // 时间差的毫秒数
    // 天数
    const days = Math.floor(spentTime / (24 * 3600 * 1000));
    // 小时
    const leave1 = spentTime % (24 * 3600 * 1000); //  计算天数后剩余的毫秒数
    const hours = Math.floor(leave1 / (3600 * 1000));
    // 分钟
    const leave2 = leave1 % (3600 * 1000); //  计算小时数后剩余的毫秒数
    const minutes = Math.floor(leave2 / (60 * 1000));
    // 秒数
    const leave3 = leave2 % (60 * 1000); //  计算分钟数后剩余的毫秒数
    const seconds = Math.round(leave3 / 1000);
    const resultDays = days ? (days + timeUnit.day) : '';
    const resultHours = hours ? (hours + timeUnit.hour) : '';
    const resultMinutes = minutes ? (minutes + timeUnit.minute) : '';
    const resultSeconds = seconds ? (seconds + timeUnit.second) : '';
    return resultDays + resultHours + resultMinutes + resultSeconds;
  }

  loading () {
    const { intl } = this.props;
    window.clearInterval(timer);
    timer = window.setInterval(this.getSyncInfoOnce, 9000);
    return <TestLoading
      tip={LDAPStore.languages[ `${intlPrefix}.sync.loading`]}
      syncTip={LDAPStore.languages[ `${intlPrefix}.sync.loading.tip`]}
    />;
  }

  getTestResult() {
    const testData = LDAPStore.getTestData;
    const ldapData = LDAPStore.getLDAPData;
    const adminAccount = LDAPStore.getLDAPData.account;
    const adminPassword = LDAPStore.getLDAPData.password;
    const adminStatus = adminAccount && adminPassword;
    return (
      <div>
        <p className="testTitle">
          {LDAPStore.languages[`${intlPrefix}.test.result`]}
        </p>
        <div className="resultContainer">
          <div className="resultInfo">
            <div>
              <Icon type={testData.canLogin ? 'check_circle' : 'cancel'} className={testData.canLogin ? 'successIcon' : 'failedIcon'} />
              {LDAPStore.languages[`${intlPrefix}.test.login`]}
              {testData.canLogin ? LDAPStore.languages.success : LDAPStore.languages.error}
            </div>
            <div>
              <Icon type={testData.canConnectServer ? 'check_circle' : 'cancel'} className={testData.canConnectServer ? 'successIcon' : 'failedIcon'} />
              {LDAPStore.languages[`${intlPrefix}.test.connect`]}
              {testData.canConnectServer ? LDAPStore.languages.success : LDAPStore.languages.error }
            </div>
            <div>
              <Icon type={testData.matchAttribute ? 'check_circle' : 'cancel'} className={testData.matchAttribute ? 'successIcon' : 'failedIcon'} />
              {LDAPStore.languages[`${intlPrefix}.test.user`]}
              {testData.matchAttribute ? LDAPStore.languages.success : LDAPStore.languages.error }
            </div>
            <ul className="info">
              <li
                style={{ display: ldapData.loginNameField ? 'inline' : 'none' }}
                className={ldapData.loginNameField === testData.loginNameField ? 'toRed' : ''}
              >
                {LDAPStore.languages[`${intlPrefix}.loginname`]}
                <span>{ldapData.loginNameField}</span>
              </li>
              <li
                style={{ display: ldapData.realNameField && adminStatus ? 'inline' : 'none' }}
                className={ldapData.realNameField === testData.realNameField ? 'toRed' : ''}
              >
                {LDAPStore.languages[`${intlPrefix}.realname`]}
                <span>{ldapData.realNameField}</span>
              </li>
              <li
                style={{ display: ldapData.phoneField && adminStatus ? 'inline' : 'none' }}
                className={ldapData.phoneField === testData.phoneField ? 'toRed' : ''}
              >
                {LDAPStore.languages[`${intlPrefix}.phone`]}
                <span>{ldapData.phoneField}</span>
              </li>
              <li
                style={{ display: ldapData.emailField ? 'inline' : 'none' }}
                className={ldapData.emailField === testData.emailField ? 'toRed' : ''}
              >
                {LDAPStore.languages[`${intlPrefix}.email`]}
                <span>{ldapData.emailField}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  getSyncInfo() {
    const syncData = LDAPStore.getSyncData || {};
    if (timer) {
      window.clearInterval(timer);
    };
    if (!Object.getOwnPropertyNames(syncData).length) {
      return (
        <div className="syncContainer">
          <p>
            {LDAPStore.languages[`${intlPrefix}.sync.norecord`]}
          </p>
        </div>
      );
    } else if (syncData && syncData.syncEndTime) {
      return (
        <div className="syncContainer">
          <p>{LDAPStore.languages[`${intlPrefix}.sync.lasttime`]} {syncData.syncEndTime}</p>
          <p>
            {LDAPStore.languages[`${intlPrefix}.sync.time`]}
          </p>
        </div>
      );
    } else if (!syncData.syncEndTime) {
      return LDAPStore.setIsSyncLoading(true);
    }
  }

  getSidebarContent() {
    const { showWhich, intl } = this.props;
    const { getFieldDecorator } = this.props.form;
    const testData = LDAPStore.getTestData;
    const ldapData = LDAPStore.getLDAPData;
    const isSyncLoading = LDAPStore.getIsSyncLoading;
    if (showWhich === 'connect') {
      return (
        <div>
          <Form onSubmit={this.handleSubmit.bind(this)}>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('ldapname', {
                rules: [{
                  required: true,
                  whitespace: true,
                  message: LDAPStore.languages[ `${intlPrefix}.name.require.msg`],
                }],
              })(
                <Input
                  autoComplete="off"
                  label={LDAPStore.languages[ `${intlPrefix}.name`]}
                  style={{ width: inputWidth }}
                />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('ldappwd', {
                rules: [{
                  required: true,
                  whitespace: true,
                  message: LDAPStore.languages[ `${intlPrefix}.password.require.msg`],
                }],
              })(
                <Input
                  autoComplete="off"
                  type="password"
                  label={LDAPStore.languages[ `${intlPrefix}.password`]}
                  style={{ width: inputWidth }}
                />,
              )}
            </FormItem>
          </Form>
          <div style={{ width: '512px', display: LDAPStore.getIsShowResult ? 'block' : 'none' }}>
            {LDAPStore.getIsConnectLoading ? <TestLoading tip={LDAPStore.languages[ `${intlPrefix}.test.loading`]} /> : this.getTestResult()}
          </div>
        </div>
      );
    } else if (showWhich === 'adminConnect') {
      return (
        <div style={{ width: '512px' }}>
          {LDAPStore.getIsConnectLoading ? <TestLoading tip={LDAPStore.languages[ `${intlPrefix}.test.loading`]}  synctip={''} /> : this.getTestResult()}
        </div>

      );
    } else {
      return (
        <div style={{ width: '512px' }}>
          {isSyncLoading ? this.loading() : this.getSyncInfo()}
        </div>
      );
    }
  }

  closeSyncSidebar = () => {
    window.clearInterval(timer);
    LDAPStore.setIsSyncLoading(false);
  }

  handleSubmit = (e) => {
    const { showWhich, intl } = this.props;
    const { organizationId } = this.state;
    e.preventDefault();
    if (showWhich === 'connect') {
      this.props.form.validateFieldsAndScroll((err, value) => {
        if (!err) {
          LDAPStore.setIsShowResult(true);
          LDAPStore.setIsConnectLoading(true);
          const ldapData = Object.assign({}, LDAPStore.getLDAPData);
          ldapData.account = value.ldapname;
          ldapData.password = value.ldappwd;
          LDAPStore.setIsConfirmLoading(true);
          LDAPStore.testConnect(organizationId, LDAPStore.getLDAPData.id, ldapData)
            .then((res) => {
              if (res) {
                LDAPStore.setTestData(res);
              }
              LDAPStore.setIsConnectLoading(false);
              LDAPStore.setIsConfirmLoading(false);
            });
        }
      });
    } else if (showWhich === 'adminConnect') {
      LDAPStore.setIsConnectLoading(true);
      LDAPStore.setIsConfirmLoading(true);
      const ldapData = LDAPStore.getLDAPData;
      LDAPStore.testConnect(organizationId, LDAPStore.getLDAPData.id, ldapData)
        .then((res) => {
          if (res) {
            LDAPStore.setTestData(res);
          }
          LDAPStore.setIsConnectLoading(false);
          LDAPStore.setIsConfirmLoading(false);
        });
    } else if (showWhich === 'sync') {
      LDAPStore.SyncUsers(organizationId, LDAPStore.getLDAPData.id).then((data) => {
        if (data.failed) {
          Choerodon.prompt(data.message);
        } else {
          LDAPStore.setIsSyncLoading(true);
        }
      });
    }
  }


  render() {
    const { showWhich } = this.props;
    let code;
    if (showWhich === 'connect') {
      code = `${intlPrefix}.connect`;
    } else if (showWhich === 'adminConnect') {
      code = `${intlPrefix}.adminconnect`;
    } else if (showWhich === 'sync') {
      code = `${intlPrefix}.sync`;
    }
    return (
      <Content
        style={{ padding: 0 }}
        code={code}
      >
        {this.getSidebarContent()}
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(TestConnect)));
