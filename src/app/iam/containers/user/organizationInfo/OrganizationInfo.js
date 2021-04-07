/**
 * Created by hulingfangzi on 2018/7/2.
 */
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Form, Table, Icon, Modal, Tooltip, Checkbox } from 'yqcloud-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withRouter } from 'react-router-dom';
import { Action, axios, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import querystring from 'query-string';
import UserInfoStore from '../../../stores/user/userInfo/UserInfoStore';

const intlPrefix = 'user.orginfo';
const { Sidebar } = Modal;
@inject('AppState')
@observer

class OrganizationInfo extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      totalCount: false,
      loading: true,
      visible: false,
      content: null,
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      filters: {},
      params: [],
      perpagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      perfilters: {},
      perparams: [],
      percontent: null,
      perloading: true,
      roleId: null,
      roleName: '',
      orgName: '',
      mainOrgId: '',
      orgId: '',
      unBingObj: {},
      unBingObj_2: [],
      isLDAP: false,
    };
  }

  componentWillMount() {
    const { AppState } = this.props;
    const { mainOrgId } = this.state;
    this.setState({
      mainOrgId: AppState.userInfo.organizationId,
      orgId: AppState.userInfo.id,
    });
    this.loadInitData();
    this.queryLDAPOrg();
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    UserInfoStore.queryLanguage(AppState.userInfo.organizationId, AppState.currentLanguage);
  }

  loadInitData(paginationIn, filtersIn, paramsIn) {
    const {
      pagination: paginationState,
      params: paramsState,
      filters: filtersState,
      mainOrgId,
    } = this.state;
    const { AppState } = this.props;
    const pagination = paginationIn || paginationState;
    const params = paramsIn || paramsState;
    const filters = filtersIn || filtersState;
    this.fetch(pagination, filters, params).then((data) => {
      this.setState({
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
        },
        mainOrgId: AppState.userInfo.organizationId,
        content: data.content,
        loading: false,
        filters,
        params,
      });
    });
  }

  fetch({ current, pageSize }, { name, code }, params) {
    this.setState({
      loading: true,
    });
    const { AppState } = this.props;
    const { id } = AppState.getUserInfo;
    const queryObj = {
      page: current - 1,
      size: pageSize,
      name,
      code,
      params,
    };
    return axios.get(`/iam/v1/users/${id}/organization_roles?${querystring.stringify(queryObj)}`);
  }

  handlePageChange = (pagination, filters, sorter, params) => {
    this.loadInitData(pagination, filters, params);
  };


  /* 打开sidebar */
  openSidebar = (record) => {
    this.setState({
      roleId: record.id,
      roleName: record.name,
      orgName: record.organizationName,
      totalCount: false,
      perpagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      perfilters: {},
      perparams: [],
      percontent: null,
    }, () => {
      this.loadPermissionData();
    });
  }

  //  关闭sidebar
  closeSidebar = () => {
    this.setState({
      visible: false,
    });
  };


  loadPermissionData(paginationIn, filtersIn, paramsIn) {
    const {
      perpagination: paginationState,
      perparams: paramsState,
      perfilters: filtersState,
    } = this.state;
    const pagination = paginationIn || paginationState;
    const params = paramsIn || paramsState;
    const filters = filtersIn || filtersState;
    this.permissionFetch(pagination, filters, params).then((data) => {
      if (this.state.totalCount === false) {
        this.setState({
          totalCount: data.totalElements,
        });
      }
      this.setState({
        perpagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
        },
        percontent: data.content,
        perloading: false,
        perfilters: filters,
        perparams: params,
        visible: true,
      });
    });
  }

  permissionFetch({ current, pageSize }, { code, description }, params) {
    this.setState({
      perloading: true,
    });
    const id = this.state.roleId;
    const queryObj = {
      page: current - 1,
      size: pageSize,
      code,
      description,
      params,
    };
    return axios.get(`/iam/v1/roles/${id}/permissions?${querystring.stringify(queryObj)}`);
  }

  handlePerPageChange = (pagination, filters, sorter, params) => {
    this.loadPermissionData(pagination, filters, params);
  };

  renderSidebarContent() {
    const { intl } = this.props;
    const { percontent, perpagination, perloading, perparams, orgName, roleName, totalCount } = this.state;
    const title = intl.formatMessage({ id: `${intlPrefix}.detail.title` }, {
      roleName,
    });
    const description = intl.formatMessage({ id: `${intlPrefix}.detail.description` }, {
      orgName,
      roleName,
    });
    const columns = [{
      title: UserInfoStore.languages[`${intlPrefix}.detail.table.permission`],
      dataIndex: 'code',
      key: 'code',
    }, {
      title: UserInfoStore.languages[`${intlPrefix}.detail.table.description`],
      dataIndex: 'description',
      key: 'description',
    }];
    return (
      <Content
        className="sidebar-content"
        title={title}
        description={description}
        link={intl.formatMessage({ id: `${intlPrefix}.detail.link` })}
      >
        <p style={{ fontSize: '18px', marginBottom: '8px' }}>{totalCount}{UserInfoStore.languages[`${intlPrefix}.assigned.permissions`]}</p>
        <Table
          loading={perloading}
          style={{ width: '512px' }}
          columns={columns}
          pagination={perpagination}
          filterBarPlaceholder={intl.formatMessage({ id: 'filtertable' })}
          dataSource={percontent}
          filters={perparams}
          onChange={this.handlePerPageChange}
        />
      </Content>
    );
  }

  getRowKey = (record, id) => {
    if ('roles' in record) {
      return record.id;
    } else {
      return `${id}-${record.id}`;
    }
  }

  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      document.location.reload();
      this.loadInitData();
    });
  };

  // 查询是否为LDAP组织
  queryLDAPOrg=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.userInfo.organizationId;
    // return axios.get(`/iam/v1/organizations/${AppState.userInfo.organizationId}`).then((data) => {
    return axios.get(`/iam/v1/${AppState.userInfo.organizationId}/organizations`).then((data) => {
      this.setState({
        isLDAP: data.ldap,
      });
    });
  }

  // 标记主要租户
  setMainOrg = (record) => {
    const { intl } = this.props;
    UserInfoStore.setMainOrgs(record.id).then(({ failed, message }) => {
      if (failed) {
        Choerodon.prompt(message);
      } else {
        this.handleRefresh();
        Choerodon.prompt(UserInfoStore.languages['modify.success']);
      }
    }).catch((error) => {
      Choerodon.prompt(UserInfoStore.languages['modify.error']);
    });
  }

  // 租户解除绑定
  setUnBiinding = (record) => {
    const { mainOrgId, unBingObj, unBingObj_2, orgId } = this.state;
    const { intl } = this.props;

    record.roles.forEach((v) => {
      unBingObj_2.push(v.id);
    });

    if (mainOrgId === record.id) {
      Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.unbindmain.filed`]);
    } else if (mainOrgId !== record.id) {
      Modal.confirm({

        title: UserInfoStore.languages[`${intlPrefix}.unbind.title`],
        content: UserInfoStore.languages[`${intlPrefix}.unbind.content`],
        okText: UserInfoStore.languages.confirm,
        cancelText: UserInfoStore.languages.cancel,

        onOk: () => {
          UserInfoStore.setUnBiindings(record).then((data) => {
            if (data === 'iam.organization.unbinding.success') {
              this.handleRefresh();
              Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.unbind.success`]);
            } else {
              Choerodon.prompt(UserInfoStore.languages[`${intlPrefix}.unbind.filed`]);
            }
          });
        },
      });
    }
  }

  render() {
    const { content, visible, pagination, loading, params, mainOrgId, isLDAP } = this.state;
    const { AppState, intl } = this.props;
    let orgId;
    const columns = [{
      title: UserInfoStore.languages[`${intlPrefix}.name`],
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => {
        let icon = '';
        if (record.hasOwnProperty('projects')) {
          icon = 'zuhushezhi-yijix';
        } else {
          icon = 'zuhushezhijiaoseguanli';
        }
        return (
          <span><Icon type={icon} style={{ verticalAlign: 'text-bottom' }} /> {text}</span>
        );
      },
    }, {
      title: UserInfoStore.languages.code,
      dataIndex: 'code',
      key: 'code',
    }, {
      title: UserInfoStore.languages.type,
      dataIndex: 'type',
      key: 'type',
      render: (text, record) => (
        record.hasOwnProperty('projects') ? UserInfoStore.languages.Tenant : UserInfoStore.languages.role
      ),
    },
    {
      title: UserInfoStore.languages[`${intlPrefix}.main`],
      dataIndex: 'type',
      key: 'type',
      render: (text, record) => {
        if (record.hasOwnProperty('projects')) {
          if (isLDAP && AppState.userInfo.ldap) {
            if (record) {
              let tempCheck = true;
              if (record.id !== mainOrgId) {
                tempCheck = false;
              }
              return (
                <Checkbox
                  disabled
                  checked={tempCheck}
                  onClick={this.setMainOrg.bind(this, record)}
                />
              );
            }
          } else if (record) {
            let tempCheck = true;
            if (record.id !== mainOrgId) {
              tempCheck = false;
            }
            return (
              <Checkbox
                checked={tempCheck}
                onClick={this.setMainOrg.bind(this, record)}
              />
            );
          }
        } else { return ''; }
      },
    },
    {
      title: UserInfoStore.languages.operation,
      dataIndex: 'operation',
      key: 'operation',
      render: (text, record) => {
        if (isLDAP) {
          return record.hasOwnProperty('projects') ? (record.code === 'DEFAULT' ? '' : <a style={{ color: '#818999', cursor: 'not-allowed' }}>{UserInfoStore.languages.unbind}</a>) : '';
        } else {
          return record.hasOwnProperty('projects') ? (record.code === 'DEFAULT' ? '' : <a onClick={this.setUnBiinding.bind(this, record)}>{UserInfoStore.languages.unbind}</a>) : '';
        }
      },

    },
    ];

    return (
      <Page>
        <Header title={UserInfoStore.languages[`${intlPrefix}.header.title`]} />
        <Content>
          <Table
            loading={loading}
            dataSource={content}
            pagination={pagination}
            columns={columns}
            filters={params}
            filterBar={false}
            childrenColumnName="roles"
            rowKey={(record) => {
              orgId = this.getRowKey(record, orgId);
              return orgId;
            }}
            onChange={this.handlePageChange}
            filterBarPlaceholder={intl.formatMessage({ id: 'filtertable' })}
          />
          <Sidebar
            title={UserInfoStore.languages[`${intlPrefix}.detail.header.title`]}
            visible={visible}
            onOk={this.closeSidebar}
            okText={UserInfoStore.languages.close}
            okCancel={false}
          >
            {this.renderSidebarContent()}
          </Sidebar>
        </Content>
      </Page>
    );
  }
}

export default withRouter(injectIntl(OrganizationInfo));
