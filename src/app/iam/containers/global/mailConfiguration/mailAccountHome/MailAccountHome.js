import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content, Permission, Action } from 'yqcloud-front-boot';
import { Row, Col, Form, message, Button, Table, Input, Modal, Tooltip, Icon } from 'yqcloud-ui';
import MailConfigurationStore from '../../../../stores/globalStores/mailConfiguration';
import EditConfiguration from '../editEailConfiguration';


const intlPrefix = 'mail.AccountConfiguration';
const { Sidebar } = Modal;
const FormItem = Form.Item;
const { TextArea } = Input;


@inject('AppState')
@observer
class MailAccountHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      dataSource: [],
      visible: false,
      edit: false,
      submitting: false,
      selectedData: '',
      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      testVisible: false,
      configId: '',
    };
  }

  componentDidMount() {
    this.loadAccounts();
  }

  fetch() {
    MailConfigurationStore.getIsEnabled();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    if (this.props.AppState.currentMenuType.type === 'site') {
      MailConfigurationStore.queryLanguage(0, AppState.currentLanguage);
    } else {
      MailConfigurationStore.queryLanguage(id, AppState.currentLanguage);
    }
  };

  // 加载邮件账户数据列表
  loadAccounts = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    MailConfigurationStore.loadaccount(
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      this.setState({
        dataSource: data.content,
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        filters,
        params,
        sort,
      });
    })
      .catch(error => Choerodon.handleResponseError(error));
  };

  /**
   * 弹层
   */
  showModal = () => {
    this.setState({
      visible: true,
      edit: false,
    });
  };

  // 编辑
  onEdit = (record) => {
    this.setState({
      visible: true,
      selectedData: record.configId,
      edit: true,
    });
  };

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }


  renderSideTitle = () => {
    const { edit } = this.state;
    if (edit) {
      return MailConfigurationStore.languages[`${intlPrefix}.edit.mail.account.configuration`];
    } else {
      return MailConfigurationStore.languages[`${intlPrefix}.new.mail.account.configuration`];
    }
  };


  renderSidebar = () => {
    const { visible, edit, selectedData } = this.state;
    return (
      <EditConfiguration
        visible={visible}
        selectedData={selectedData}
        edit={edit}
        onRef={(node) => {
          this.editConfiguration = node;
        }}
        OnUnchangedSuccess={() => {
          this.setState({
            visible: false,
            submitting: false,
          });
        }}
        onSubmit={() => {
          this.setState({
            submitting: true,
          });
        }}
        onSuccess={() => {
          this.setState({
            visible: false,
            submitting: false,
          });
          this.loadAccounts();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
        onCloseModel={() => {
          this.setState({
            visible: false,
            selectedData: '',
          });
        }}
      />
    );
  };

  enabledState = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const enabled = MailConfigurationStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  /**
   * 分页处理
   * @param pagination 分页
   */
  handlePageChange = (pagination, filters, { field, order }, params) => {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadAccounts(pagination, sorter.join(','), filters, params);
  };


  accountShowModal=(value) => {
    this.setState({
      testVisible: true,
      configId: value.configId,
    });
  }

  handleReset = () => {
    this.props.form.resetFields();
  }

  /*
测试提交按钮
*/
  accountSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, data) => {
      if (!err) {
        const { AppState, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        const { configId } = this.state;
        MailConfigurationStore.sendEmail(configId, data.subject, data.receiver).then((data1) => {
          if (data1 === 'success') {
            MailConfigurationStore.getCode('send.success');
            this.handleReset();
            this.setState({
              testVisible: false,
            });
          } else {
            MailConfigurationStore.getCode('send.failed');
          }
        });
      }
    });
  };


  accountCancel = (e) => {
    this.handleReset();
    this.setState({
      testVisible: false,
    });
  };

  render() {
    const { intl } = this.props;
    const { submitting, visible, edit, dataSource, params, filters, sort, pagination, testVisible } = this.state;
    const { getFieldDecorator } = this.props.form;

    const isEnabled = MailConfigurationStore.getEnabled;
    const ListColumns = [
      {
        title: MailConfigurationStore.languages[`${intlPrefix}.configuration.code`],
        dataIndex: 'configCode',
        key: 'configCode',
        filters: [],
        render: (text, record) => (record.isEnable ? record.configCode : (
          <a onClick={this.onEdit.bind(this, record)}>{text}</a>
        )),
      },
      {
        title: MailConfigurationStore.languages[`${intlPrefix}.describe`],
        dataIndex: 'description',
        key: 'description',
        filters: [],
      },
      {
        title: MailConfigurationStore.languages[`${intlPrefix}.mail.server`],
        dataIndex: 'host',
        key: 'host',
        filters: [],
      },
      {
        title: MailConfigurationStore.languages[`${intlPrefix}.port`],
        dataIndex: 'port',
        key: 'port',
        filters: [],
      },
      {
        title: MailConfigurationStore.languages[`${intlPrefix}.state`],
        dataIndex: 'isEnable',
        key: 'isEnable',
        render: (values, record) => this.enabledState(record.isEnable),

      },
      {
        title: MailConfigurationStore.languages.operation,
        key: 'action',
        render: (text, record) => (
          <div>
            { record.isEnable ? (
              <Tooltip
                title={MailConfigurationStore.languages.send}
                placement="bottom"
              >
                <Button
                  size="small"
                  icon="hebingxingzhuangx1"
                  shape="circle"
                  style={{ color: '#2196F3' }}
                  onClick={this.accountShowModal.bind(this, record)}
                />
              </Tooltip>
            ) : (
              <Tooltip
                title={MailConfigurationStore.languages.send}
                placement="bottom"
              >
                <Button
                  size="small"
                  icon="hebingxingzhuangx1"
                  shape="circle"
                  onClick={this.accountShowModal.bind(this, record)}
                  disabled="true"
                />
              </Tooltip>
            )
            }
            {
              record.isEnable ? (
                <Tooltip
                  title={MailConfigurationStore.languages.modify}
                  placement="bottom"
                >
                  <Button
                    size="small"
                    icon="bianji-"
                    shape="circle"
                    style={{ color: '#2196F3' }}
                    onClick={this.onEdit.bind(this, record)}
                    disabled={!record.isEnable}
                  />
                </Tooltip>
              ) : (
                <Tooltip
                  title={MailConfigurationStore.languages.modify}
                  placement="bottom"
                >
                  <Button
                    size="small"
                    icon="bianji-"
                    shape="circle"
                    onClick={this.onEdit.bind(this, record)}
                    disabled="true"
                  />
                </Tooltip>
              )}
          </div>
        ),
      },
    ];
    return (
      <Page>
        <Header title={MailConfigurationStore.languages[`${intlPrefix}.mail.account.configuration`]}>
          <Button
            onClick={() => this.showModal()}
            style={{ color: '#000000', display: dataSource.length > 0 ? 'none' : '' }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {MailConfigurationStore.languages[`${intlPrefix}.new.configuration`]}
          </Button>
        </Header>
        <Content>
          <Table
            size="middle"
            columns={ListColumns}
            pagination={pagination}
            rowKey="id"
            dataSource={dataSource}
            onChange={this.handlePageChange.bind(this)}
            loading={MailConfigurationStore.isLoading}
            filters={params}
          />
          <Sidebar
            title={this.renderSideTitle()}
            visible={visible}
            okText={MailConfigurationStore.languages[edit ? 'save' : 'create']}
            cancelText={MailConfigurationStore.languages.cancel}
            onOk={(e) => {
              this.editConfiguration.handleSubmit(e);
            }}
            onCancel={(e) => {
              this.editConfiguration.handleCancel(e);
            }}
          >
            {
              this.renderSidebar()
            }
          </Sidebar>
          <Modal
            title={MailConfigurationStore.languages[`${intlPrefix}.testInformation`]}
            visible={testVisible}
            onCancel={this.accountCancel}
            className="account-content"
            footer={[
              <Button
                onClick={this.accountSubmit}
                style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
                type="primary"
                funcType="raised"
              >
                {MailConfigurationStore.languages.ok}
              </Button>,
              <Button
                onClick={this.accountCancel}
                funcType="raised"
                style={{ marginRight: '15px' }}
              >
                {MailConfigurationStore.languages.cancel}
              </Button>,
            ]}
            center
          >
            <Form layout="vertical">
              <div className="accountType">
                <span className="messageLabel">{MailConfigurationStore.languages[`${intlPrefix}.recipient`]}</span>
                <FormItem className="messageInput">
                  {getFieldDecorator('receiver', {
                    validateTrigger: 'onBlur',
                    validateFirst: true,
                  })(
                    <Input
                      autoComplete="off"
                      style={{ width: 300, marginLeft: '30px' }}
                    />,
                  )}
                </FormItem>
              </div>
              <div className="accountType">
                <span className="messageLabel">{MailConfigurationStore.languages[`${intlPrefix}.theme`]}</span>
                <FormItem className="messageInput">
                  {getFieldDecorator('subject', {
                    validateTrigger: 'onBlur',
                    validateFirst: true,
                  })(
                    <TextArea
                      autoComplete="off"
                      style={{ width: 300, height: 100, backgroundColor: '#F5F5F5', marginLeft: '43px' }}
                      underline={false}
                      autosize={{ minRows: 4, maxRows: 4 }}
                    />,
                  )}
                </FormItem>
              </div>
            </Form>
          </Modal>
        </Content>
      </Page>
    );
  }
}

export default Form.create()(withRouter(injectIntl(MailAccountHome)));
