import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content, Permission, Action } from 'yqcloud-front-boot';
import { Row, Col, Form, Card, Button, Table, Tabs, Modal, Tooltip, Icon } from 'yqcloud-ui';
import ConfigurationStore from '../../../../stores/organization/accountConfiguration';
import './index.scss';
import EditConfiguration from '../editConfiguration';

const intlPrefix = 'account.configuration';
const { TabPane } = Tabs;
const { Sidebar } = Modal;

@inject('AppState')
@observer
class ConfigurationHome extends Component {
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
      sort: 'companyCode',
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadCompanys();
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    ConfigurationStore.queryLanguage(id, AppState.currentLanguage);
  }

  fetch() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    ConfigurationStore.getIsEnabled(organizationId);
  }

  // 加载组织列表
  loadCompanys = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { organizationId } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    ConfigurationStore.loadaccount(
      organizationId,
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

  // 启用失效
  handleAble = (record) => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    if (record.isEnable === false) {
      ConfigurationStore.enableaccount(organizationId, record).then((failed) => {
        if (failed === 'success') {
          Choerodon.prompt(ConfigurationStore.languages['enable.success']);
          this.loadCompanys();
        } else {
          Choerodon.prompt(ConfigurationStore.languages['enabled.error']);
        }
      }).catch((error) => {
        Choerodon.prompt(ConfigurationStore.languages['enabled.error']);
      });
    } else {
      ConfigurationStore.disableaccount(organizationId, record).then((failed) => {
        if (failed === 'success') {
          Choerodon.prompt(ConfigurationStore.languages[`${intlPrefix}.disable.success`]);
          this.loadCompanys();
        } else {
          Choerodon.prompt(ConfigurationStore.languages[`${intlPrefix}.disable.error`]);
        }
      }).catch((error) => {
        Choerodon.prompt(ConfigurationStore.languages[`${intlPrefix}.disable.error`]);
      });
    }
  };

  // 删除
  handledelete = (record) => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    ConfigurationStore.deletesingle(organizationId, record).then((data) => {
      if (data === 'info.delete.success') {
        Choerodon.prompt(ConfigurationStore.languages[`${intlPrefix}.deletion.success`]);
        this.loadCompanys();
      }
    }).catch((error) => {
      Choerodon.prompt(ConfigurationStore.languages[`${intlPrefix}.deletion.error`]);
    });
  };

  renderSideTitle = () => {
    const { edit } = this.state;
    if (edit) {
      return ConfigurationStore.languages[`${intlPrefix}.edit.mail.account.configuration`];
    } else {
      return ConfigurationStore.languages[`${intlPrefix}.new.mail.account.configuration`];
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
          this.loadCompanys();
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
    const enabled = ConfigurationStore.getEnabled;
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
    this.loadCompanys(pagination, sorter.join(','), filters, params);
  };

  render() {
    const { intl, AppState } = this.props;
    const { submitting, visible, edit, dataSource, params, filters, sort, pagination } = this.state;
    const isEnabled = ConfigurationStore.getEnabled;
    const ListColumns = [
      {
        title: ConfigurationStore.languages[`${intlPrefix}.configuration.code`],
        dataIndex: 'configCode',
        key: 'configCode',
        filters: [],
      },
      {
        title: ConfigurationStore.languages[`${intlPrefix}.describe`],
        dataIndex: 'description',
        key: 'description',
        filters: [],
      },
      {
        title: ConfigurationStore.languages[`${intlPrefix}.mail.server`],
        dataIndex: 'host',
        key: 'host',
        filters: [],
      },
      {
        title: ConfigurationStore.languages[`${intlPrefix}.port`],
        dataIndex: 'port',
        key: 'port',
        filters: [],
      },
      {
        title: ConfigurationStore.languages[`${intlPrefix}.state`],
        dataIndex: 'isEnable',
        key: 'isEnable',
        render: (values, record) => this.enabledState(record.isEnable),

      },
      {
        title: ConfigurationStore.languages.operation,
        key: 'action',
        render: (text, record) => (
          <div>
            <Tooltip
              title={ConfigurationStore.languages.edit}
              placement="bottom"
            >
              <Button
                size="small"
                icon="bianji-"
                shape="circle"
                style={{ color: '#2196F3' }}
                onClick={this.onEdit.bind(this, record)}
              />
            </Tooltip>
            {record.isEnable === false && (
              <Tooltip
                title={ConfigurationStore.languages.enable}
                placement="bottom"
              >
                <Button
                  icon="yijieshu"
                  shape="circle"
                  size="small"
                  style={{ color: '#2196F3' }}
                  onClick={this.handleAble.bind(this, record)}
                />
              </Tooltip>
            )}
            {record.isEnable === true && (
              <Tooltip
                title={ConfigurationStore.languages.disable}
                placement="bottom"
              >
                <Button
                  icon="jinyongzhuangtai"
                  shape="circle"
                  size="small"
                  onClick={this.handleAble.bind(this, record)}
                />
              </Tooltip>
            )}
            <Tooltip
              title={ConfigurationStore.languages.delete}
              placement="bottom"
            >
              <Button
                icon="shanchu-icon"
                shape="circle"
                size="small"
                onClick={this.handledelete.bind(this, record)}
              />
            </Tooltip>
          </div>
        ),
      },
    ];
    return (
      <Page>
        <Header title={ConfigurationStore.languages[`${intlPrefix}.mail.account.configuration`]}>
          <Button
            onClick={() => this.showModal()}
            style={{ color: '#000000' }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {ConfigurationStore.languages[`${intlPrefix}.new.configuration`]}
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
            loading={ConfigurationStore.isLoading}
            filters={params}
          />
          <Sidebar
            title={this.renderSideTitle()}
            visible={visible}
            okText={ConfigurationStore.languages[edit ? 'save' : 'create']}
            cancelText={ConfigurationStore.languages.cancel}
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
        </Content>
      </Page>
    );
  }
}

export default withRouter(injectIntl(ConfigurationHome));
