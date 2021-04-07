import React, { Component } from 'react';
import { Button, Form, Icon, Input, Modal, Popover, Radio, Select, Tooltip } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { Content, Header, Page, Permission } from 'yqcloud-front-boot';
import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import TestLdap from '../testLdap';
import LoadingBar from '../../../../components/loadingBar';
import './LDAP.scss';
import LDAPStore from '../../../../stores/organization/ldap/LDAPStore';


const { Sidebar } = Modal;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const { Option } = Select;
const intlPrefix = 'organization.ldap';
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

@inject('AppState')
@observer
class LDAP extends Component {
  constructor(props) {
    super(props);
    this.loadLDAP = this.loadLDAP.bind(this);
    this.state = this.getInitState();
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadLDAP();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    LDAPStore.queryLanguage(id, AppState.currentLanguage);
  };

  getInitState() {
    return {
      sidebar: false,
      open: false,
      saving: false,
      organizationId: this.props.AppState.currentMenuType.id,
      value: '',
      showServer: true,
      showUser: true,
      showAdminPwd: false,
      showWhich: '',
      ldapAdminData: '',
    };
  }

  /* 获取同步账户信息 */
  getSyncInfo() {
    const { LDAPStore } = this.props;
    const { organizationId } = this.state;
    const ldapData = LDAPStore.getLDAPData;
    LDAPStore.getSyncInfo(organizationId, ldapData.id).then((data) => {
      if (data.failed) {
        Choerodon.prompt(data.message);
      } else {
        LDAPStore.setSyncData(data);
      }
    });
  }

  /**
   * Input后缀提示
   * @param text
   */
  getSuffix(text) {
    return (
      <Popover
        overlayStyle={{ maxWidth: '180px', wordBreak: 'break-all' }}
        className="routePop"
        placement="right"
        trigger="hover"
        content={text}
      >
        <Icon type="help" />
      </Popover>
    );
  }

  /**
   * label后缀提示
   * @param label label文字
   * @param tip 提示文字
   */

  labelSuffix(label, tip) {
    return (
      <div className="labelSuffix">
        <span>
          {label}
        </span>
        <Popover
          overlayStyle={{ maxWidth: '180px' }}
          placement="right"
          trigger="hover"
          content={tip}
        >
          <Icon type="help" />
        </Popover>
      </div>
    );
  }

  /* 加载LDAP */
  loadLDAP = () => {
    const { LDAPStore, intl } = this.props;
    const { organizationId } = this.state;
    LDAPStore.loadLDAP(organizationId).catch((error) => {
      LDAPStore.cleanData();
      const { response } = error;
      if (response) {
        const { status } = response;
        const mess = response.data.message;
        switch (status) {
          case 400:
            Choerodon.prompt(mess);
            break;
          case 404:
            Choerodon.prompt(LDAPStore.languages[`${intlPrefix}.notfound.msg`]);
            break;
          default:
            break;
        }
        LDAPStore.setIsLoading(false);
      }
    });
    this.setState({
      saving: false,
    });
  };

  /* 刷新 */
  reload = () => {
    this.loadLDAP();
  };

  /* 开启侧边栏 */
  openSidebar(status) {
    const { LDAPStore } = this.props;
    LDAPStore.setIsShowResult(false);
    LDAPStore.setIsSyncLoading(false);
    if (this.TestLdap) {
      const { resetFields } = this.TestLdap.props.form;
      resetFields();
    }

    this.setState({
      sidebar: true,
      showWhich: status,
    }, () => {
      if (status === 'connect') {
        LDAPStore.setIsConfirmLoading(false);
      } else if (status === 'sync') {
        this.getSyncInfo();
      }
    });
  }

  /* 关闭侧边栏 */
  closeSidebar = () => {
    this.setState({
      sidebar: false,
    }, () => {
      this.TestLdap.closeSyncSidebar();
    });
  };

  /* 是否显示服务器设置下拉面板 */
  isShowServerSetting = () => {
    this.setState({
      showServer: !this.state.showServer,
    });
  }

  /* 是否显示账户设置属性下拉面板 */
  isShowUserSetting = () => {
    this.setState({
      showUser: !this.state.showUser,
    });
  }

  /* ssl修改状态默认端口号更改 */
  changeSsl() {
    const { getFieldValue, setFieldsValue } = this.props.form;
    setFieldsValue({
      port: getFieldValue('useSSL') === 'Y' ? '389' : '636',
    });
  }

  enableLdap = () => {
    const { LDAPStore, intl } = this.props;
    const { organizationId } = this.state;
    const ldapData = LDAPStore.getLDAPData;
    if (ldapData.enabled) {
      Modal.confirm({
        title: LDAPStore.languages[`${intlPrefix}.disable.title`],
        content: LDAPStore.languages[`${intlPrefix}.disable.content`],
        onOk: () => LDAPStore.disabledLdap(organizationId, ldapData.id).then((data) => {
          if (data.failed) {
            Choerodon.prompt(data.message);
          } else {
            Choerodon.prompt(LDAPStore.languages['disable.success']);
            LDAPStore.setLDAPData(data);
          }
        }),
      });
    } else {
      LDAPStore.enabledLdap(organizationId, ldapData.id).then((data) => {
        if (data.failed) {
          Choerodon.prompt(data.message);
        } else {
          Choerodon.prompt(LDAPStore.languages['enable.success']);
          LDAPStore.setLDAPData(data);
        }
      });
    }
  }

  /* 表单提交 */
  handleSubmit = (e) => {
    e.preventDefault();
    this.setState({
      showServer: true,
      showUser: true,
    });
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const { LDAPStore, intl } = this.props;
        const original = LDAPStore.getLDAPData;
        const ldapStatus = values.useSSL === 'Y';
        const ladp = {
          ...values,
          id: original.id,
          objectVersionNumber: original.objectVersionNumber,
        };
        ladp.useSSL = ldapStatus;
        if (!ladp.port) {
          ladp.port = ladp.useSSL ? 636 : 389;
        }
        this.setState({
          saving: true,
        });
        LDAPStore.updateLDAP(this.state.organizationId, LDAPStore.getLDAPData.id, ladp)
          .then((data) => {
            if (data) {
              LDAPStore.setLDAPData(data);
              Choerodon.prompt(LDAPStore.languages['save.success']);
              this.setState({
                saving: false,
              });
              if (LDAPStore.getLDAPData.enabled) {
                LDAPStore.setIsConnectLoading(true);
                LDAPStore.setIsConfirmLoading(true);
                this.openSidebar('adminConnect');
                LDAPStore.testConnect(this.state.organizationId, LDAPStore.getLDAPData.id, ladp)
                  .then((res) => {
                    if (res.failed) {
                      Choerodon.prompt(res.message);
                    } else {
                      LDAPStore.setTestData(res);
                      LDAPStore.setIsConnectLoading(false);
                      LDAPStore.setIsConfirmLoading(false);
                    }
                  });
              }
            } else {
              Choerodon.prompt(LDAPStore.languages['save.error']);
            }
          })
          .catch((error) => {
            Choerodon.handleResponseError(error);
            this.setState({
              saving: false,
            });
          });
      }
    });
  };

  /* 渲染侧边栏头部 */
  renderSidebarTitle() {
    const { intl } = this.props;
    const { showWhich } = this.state;
    if (showWhich === 'connect' || showWhich === 'adminConnect') {
      return LDAPStore.languages[`${intlPrefix}.connect`];
    } else {
      return LDAPStore.languages[`${intlPrefix}.syncuser`];
    }
  }

  /* 渲染侧边栏内容 */
  renderSidebarContent() {
    const { sidebar, showWhich } = this.state;
    return (
      <TestLdap
        sidebar={sidebar}
        showWhich={showWhich}
        onRef={(node) => {
          this.TestLdap = node;
        }}
      />
    );
  }

  render() {
    const { LDAPStore, AppState, form, intl } = this.props;
    const { saving, sidebar, showWhich } = this.state;
    const menuType = AppState.currentMenuType;
    const organizationName = menuType.name;
    const ldapData = LDAPStore.getLDAPData;
    const { getFieldDecorator } = form;
    const inputWidth = 512;
    const tips = {
      hostname: LDAPStore.languages[`${intlPrefix}.hostname.tip`],
      ssl: LDAPStore.languages[`${intlPrefix}.ssl.tip`],
      basedn: LDAPStore.languages[`${intlPrefix}.basedn.tip`],
      loginname: LDAPStore.languages[`${intlPrefix}.loginname.tip`],
      username: LDAPStore.languages[`${intlPrefix}.username.tip`],
    };
    const mainContent = LDAPStore.getIsLoading ? <LoadingBar /> : (
      <div>
        <div className="serverContainer">
          <Button shape="circle" funcType="raised" icon={this.state.showServer ? 'expand_more' : 'expand_less'} onClick={this.isShowServerSetting} />
          {LDAPStore.languages[`${intlPrefix}.server.setting`]}
        </div>
        <Form onSubmit={this.handleSubmit} layout="vertical" className="ldapForm">
          <div style={{ display: this.state.showServer ? 'block' : 'none' }}>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('directoryType', {
                rules: [{
                  required: true,
                  message: LDAPStore.languages[`${intlPrefix}.directorytype.require.msg`],
                }],
                initialValue: ldapData.directoryType ? ldapData.directoryType : undefined,
              })(
                <Select
                  getPopupContainer={() => document.getElementsByClassName('page-content')[0]}
                  label={LDAPStore.languages[`${intlPrefix}.directorytype`]}
                  style={{ width: inputWidth }}
                >
                  <Option value="Microsoft Active Directory">
                    <Tooltip
                placement="right"
                title={LDAPStore.languages[`${intlPrefix}.directorytype.mad.tip`]}
                overlayStyle={{ maxWidth: '300px' }}
              >
                <span style={{ display: 'inline-block', width: '100%' }}>Microsoft Active Directory</span>
              </Tooltip>
                  </Option>
                  <Option value="OpenLDAP">
                    <Tooltip
                placement="right"
                title={LDAPStore.languages[`${intlPrefix}.directorytype.openldap.tip`]}
                overlayStyle={{ maxWidth: '300px' }}
              >
                <span style={{ display: 'inline-block', width: '100%' }}>OpenLDAP</span>
              </Tooltip>
                  </Option>
                </Select>,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('serverAddress', {
                rules: [{
                  required: true,
                  message: LDAPStore.languages[`${intlPrefix}.serveraddress.require.msg`],
                }],
                initialValue: ldapData.serverAddress ? ldapData.serverAddress : undefined,
              })(
                <Input label={LDAPStore.languages[`${intlPrefix}.serveraddress`]} style={{ width: inputWidth }} suffix={this.getSuffix(tips.hostname)} autoComplete="off" />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('useSSL', {
                initialValue: ldapData.useSSL ? 'Y' : 'N',
              })(
                <RadioGroup
                  className="ldapRadioGroup"
                  label={this.labelSuffix(LDAPStore.languages[`${intlPrefix}.usessl.suffix`], tips.ssl)}
                  onChange={this.changeSsl.bind(this)}
                >
                  <Radio value="Y">{LDAPStore.languages.yes}</Radio>
                  <Radio value="N">{LDAPStore.languages.no}</Radio>
                </RadioGroup>,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('port', {
                rules: [{
                  pattern: /^[1-9]\d*$/,
                  message: LDAPStore.languages[`${intlPrefix}.port.pattern.msg`],
                }],
                initialValue: ldapData.port || (ldapData.useSSL ? '636' : '389'),
              })(
                <Input label={LDAPStore.languages[`${intlPrefix}.port`]} style={{ width: inputWidth }} autoComplete="off" />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('baseDn', {
                initialValue: ldapData.baseDn ? ldapData.baseDn : undefined,
              })(
                <Input label={LDAPStore.languages[`${intlPrefix}.basedn`]} suffix={this.getSuffix(tips.basedn)} style={{ width: inputWidth }} autoComplete="off" />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('account', {
                initialValue: ldapData.account ? ldapData.account : undefined,
              })(
                <Input label={LDAPStore.languages[`${intlPrefix}.admin.loginname`]} suffix={this.getSuffix(tips.loginname)} style={{ width: inputWidth }} autoComplete="off" />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('password', {
                initialValue: ldapData.password ? ldapData.password : undefined,
              })(
                <Input label={LDAPStore.languages[`${intlPrefix}.admin.password`]} type="password" style={{ width: inputWidth }} autoComplete="off" />,
              )}
            </FormItem>
          </div>
          <div className="serverContainer">
            <Button shape="circle" funcType="raised" icon={this.state.showUser ? 'expand_more' : 'expand_less'} onClick={this.isShowUserSetting} />
            {LDAPStore.languages[`${intlPrefix}.user.setting`]}
          </div>
          <div style={{ display: this.state.showUser ? 'block' : 'none' }}>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('objectClass', {
                rules: [{
                  required: true,
                  message: LDAPStore.languages[`${intlPrefix}.objectclass.require.msg`],
                }],
                initialValue: ldapData.objectClass ? ldapData.objectClass : undefined,
              })(
                <Input label={LDAPStore.languages[`${intlPrefix}.objectclass`]} style={{ width: inputWidth }} autoComplete="off" />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('loginNameField', {
                rules: [{
                  required: true,
                  message: LDAPStore.languages[`${intlPrefix}.loginname.require.msg`],
                }],
                initialValue: ldapData.loginNameField ? ldapData.loginNameField : undefined,
              })(
                <Input label={LDAPStore.languages[`${intlPrefix}.loginname`]} style={{ width: inputWidth }} autoComplete="off" />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('emailField', {
                rules: [{
                  required: true,
                  message: LDAPStore.languages[`${intlPrefix}.email.require.msg`],
                }],
                initialValue: ldapData.emailField ? ldapData.emailField : undefined,
              })(
                <Input label={LDAPStore.languages[`${intlPrefix}.email`]} style={{ width: inputWidth }} autoComplete="off" />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('realNameField', {
                initialValue: ldapData.realNameField ? ldapData.realNameField : undefined,
              })(
                <Input label={LDAPStore.languages[`${intlPrefix}.realname`]} style={{ width: inputWidth }} suffix={this.getSuffix(tips.username)} autoComplete="off" />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('phoneField', {
                initialValue: ldapData.phoneField ? ldapData.phoneField : undefined,
              })(
                <Input label={LDAPStore.languages[`${intlPrefix}.phone`]} style={{ width: inputWidth }} autoComplete="off" />,
              )}
            </FormItem>
          </div>
          <Permission service={['iam-service.ldap.update']}>
            <div className="btnGroup">
              <hr className="divider" />
              <Button
                funcType="raised"
                type="primary"
                htmlType="submit"
                loading={saving}
              >
                {ldapData.enabled ? LDAPStore.languages[`${intlPrefix}.saveandtest`] : LDAPStore.languages[`${intlPrefix}.save`]}
              </Button>
              <Button
                funcType="raised"
                onClick={() => {
                  const { resetFields } = this.props.form;
                  resetFields();
                }}
                style={{ color: '#3F51B5' }}
                disabled={saving}
              >
                {LDAPStore.languages.cancel}
              </Button>
            </div>
          </Permission>
        </Form>
      </div>
    );

    return (
      <Page
        service={[
          'iam-service.ldap.disableLdap',
          'iam-service.ldap.enableLdap',
          'iam-service.ldap.latestHistory',
          'iam-service.ldap.delete',
        ]}
      >
        <Header title={LDAPStore.languages[`${intlPrefix}.header.title`]}>
          <Button
            icon={ldapData && ldapData.enabled ? 'remove_circle_outline' : 'finished'}
            onClick={this.enableLdap}
          >
            {ldapData && ldapData.enabled ? LDAPStore.languages.disable : LDAPStore.languages.enable}
          </Button>
          <Button
            icon="low_priority"
            onClick={this.openSidebar.bind(this, 'connect')}
            disabled={!(ldapData && ldapData.enabled)}
          >
            {LDAPStore.languages[`${intlPrefix}.connect`]}
          </Button>
          <Button
            icon="sync"
            onClick={this.openSidebar.bind(this, 'sync')}
            disabled={!(ldapData && ldapData.enabled)}
          >
            {LDAPStore.languages[`${intlPrefix}.syncuser`]}
          </Button>
          <Button
            onClick={this.reload}
            icon="refresh"
          >
            {LDAPStore.languages.refresh}
          </Button>
        </Header>
        <Content
          code={intlPrefix}
          values={{ name: organizationName }}
        >
          <div className="ldapContainer">
            {mainContent}
          </div>
          <Sidebar
            className="connectContainer"
            title={this.renderSidebarTitle()}
            visible={sidebar}
            okText={showWhich === 'sync' ? LDAPStore.languages[`${intlPrefix}.sync`] : LDAPStore.languages[`${intlPrefix}.test`]}
            cancelText={showWhich === 'sync' ? LDAPStore.languages.return : LDAPStore.languages.cancel}
            onOk={e => this.TestLdap.handleSubmit(e)}
            onCancel={this.closeSidebar}
            confirmLoading={showWhich === 'sync' ? false : LDAPStore.confirmLoading}
          >
            {this.renderSidebarContent()}
          </Sidebar>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(LDAP)));
