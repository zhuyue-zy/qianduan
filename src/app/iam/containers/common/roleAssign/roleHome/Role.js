import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import { Button, Form, Icon, Table, Tooltip } from 'yqcloud-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Action, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import RoleStore from '../../../../stores/globalStores/role/RoleStore';
import './Role.scss';

const intlPrefix = 'global.role';
@inject('AppState')
@observer
class Role extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitState();
    this.organizationOrSite = this.props.AppState.currentMenuType.id || 'site';
    this.organizationId = this.props.AppState.currentMenuType.id || 0;
    this.organizationName = this.props.AppState.currentMenuType.name || '';
    this.type = this.props.AppState.currentMenuType.type || '';
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadRole();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    if (id === undefined) {
      RoleStore.queryLanguage(0, AppState.currentLanguage);
    } else {
      RoleStore.queryLanguage(id, AppState.currentLanguage);
    }
  }

  getUrl(type, url) {
    if (type === 'site') {
      return `/iam/roleAssign/${type}/${url}`;
    } else if (type === 'organization') {
      return `/iam/roleAssign/${type}/${url}?type=organization&id=${this.organizationOrSite}&name=${this.organizationName}&organizationId=${this.organizationOrSite}`;
    }
  }

  getInitState() {
    return {
      id: '',
      selectedRoleIds: {},
      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: 0,
        pageSizeOptions: [25, 50, 100, 200],
      },
      sort: {
        columnKey: 'id',
        order: 'descend',
      },
      selectedData: '',
    };
  }

  fetch=() => {
    // 获取类型数据
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    if (organizationId === undefined) {
      RoleStore.getIsEnabled(0);
    } else {
      RoleStore.getIsEnabled(organizationId);
    }
  }

  getSelectedRowKeys() {
    return Object.keys(this.state.selectedRoleIds).map(id => Number(id));
  }

  showModal(ids) {
    this.props.history.push(this.getUrl(this.type, `edit/${ids}`));
  }

  goCreate = () => {
    RoleStore.setSelectedRolesPermission([]);
    this.props.history.push(this.getUrl(this.type, 'create'));
  };

  loadRole(paginationIn, sortIn, filtersIn, paramsIn) {
    const {
      pagination: paginationState,
      sort: sortState,
      filters: filtersState,
      params: paramsState,
    } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    RoleStore.loadRole(pagination, sort, filters, params, this.organizationOrSite)
      .then((data) => {
        RoleStore.setIsLoading(false);
        RoleStore.setRoles(data.content);
        this.setState({
          sort,
          filters,
          params,
          pagination: {
            current: data.number + 1,
            pageSize: data.size,
            total: data.totalElements,
            pageSizeOptions: [25, 50, 100, 200],
          },
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  linkToChange = (url) => {
    this.props.history.push(`${url}`);
  };

  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadRole();
    });
  };

  handleEnable = (record) => {
    const { intl } = this.props;
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    if (this.type === 'organization') {
      if (record.enabled) {
        RoleStore.disableRole(record.id, organizationId).then(() => {
          Choerodon.prompt(RoleStore.languages['disable.success']);
          this.loadRole();
        });
      } else {
        RoleStore.enableRole(record.id, organizationId).then(() => {
          Choerodon.prompt(RoleStore.languages['enable.success']);
          this.loadRole();
        });
      }
    } else if (this.type === 'site') {
      if (record.enabled) {
        RoleStore.disableRole(record.id).then(() => {
          Choerodon.prompt(RoleStore.languages['disable.success']);
          this.loadRole();
        });
      } else {
        RoleStore.enableRole(record.id).then(() => {
          Choerodon.prompt(RoleStore.languages['enable.success']);
          this.loadRole();
        });
      }
    }
  };

  changeSelects = (selectedRowKeys, selectedRows) => {
    const { selectedRoleIds } = this.state;
    Object.keys(selectedRoleIds).forEach((id) => {
      if (selectedRowKeys.indexOf(Number(id)) === -1) {
        delete selectedRoleIds[id];
      }
    });
    selectedRows.forEach(({ id, level }) => {
      selectedRoleIds[id] = level;
    });
    this.setState({
      selectedRoleIds,
    });
  };

  handlePageChange = (pagination, filters, sort, params) => {
    this.loadRole(pagination, sort, filters, params);
  };

  createByThis= (record) => {
    RoleStore.loadRoleById(this.organizationId, record.id).then((data) => {
      RoleStore.setChosenLevel(data.level);
      RoleStore.setSelectedRolesPermission(data.functionCodes);
      this.linkToChange(this.getUrl(this.type, 'create'));
    }).catch((err) => {
    });
  }

  createByMultiple = () => {
    const { intl } = this.props;
    const levels = Object.values(this.state.selectedRoleIds);
    if (levels.some((level, index) => levels[index + 1] && levels[index + 1] !== level)) {
      Choerodon.prompt(RoleStore.languages[`${intlPrefix}.create.byselect.level`]);
    } else {
      this.createBased();
    }
  };

  createBased = () => {
    const ids = this.getSelectedRowKeys();
    RoleStore.getSelectedRoleMemberPermissions(this.organizationId, this.type, ids).then((datas) => {
      RoleStore.setChosenLevel(datas[0].level);
      RoleStore.setSelectedRolesPermission(datas);
      RoleStore.setInitSelectedPermission(datas);
      this.linkToChange(this.getUrl(this.type, 'create'));
    }).catch((error) => {
      Choerodon.prompt(error);
    });
  };

  renderBuiltIn(record) {
    if (record.builtIn) {
      return (
        <div>
          <Icon type="settings" style={{ verticalAlign: 'text-bottom' }} />
          {RoleStore.languages[`${intlPrefix}.builtin.predefined`]}
        </div>
      );
    } else {
      return (
        <div>
          <Icon type="av_timer" style={{ verticalAlign: 'text-bottom' }} />
          {RoleStore.languages[`${intlPrefix}.builtin.custom`]}
        </div>
      );
    }
  }

  renderLevel(text) {
    if (text === 'organization') {
      return RoleStore.languages.organization;
    } else if (text === 'project') {
      return RoleStore.languages.project;
    } else {
      return RoleStore.languages.global;
    }
  }

  // 启用快码
  enabledState = (values) => {
    const enabled = RoleStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  render() {
    const enabled = RoleStore.getEnabled;
    const { intl } = this.props;
    const { sort: { columnKey, order }, pagination, filters, params } = this.state;
    const selectedRowKeys = this.getSelectedRowKeys();
    const columns = [{
      dataIndex: 'id',
      key: 'id',
      hidden: true,
      sortOrder: columnKey === 'id' && order,
    }, {
      title: RoleStore.languages.name,
      dataIndex: 'name',
      key: 'name',
      filters: [],
      sorter: true,
      sortOrder: columnKey === 'name' && order,
      filteredValue: filters.name || [],
      render: (text, record) => (<a onClick={this.showModal.bind(this, record.id)}>{text}</a>),
    }, {
      title: RoleStore.languages.code,
      dataIndex: 'code',
      key: 'code',
      filters: [],
      sorter: true,
      sortOrder: columnKey === 'code' && order,
      filteredValue: filters.code || [],
      render: (text, record) => (
        <span>{record.code.replace('role/organization/custom/', '').replace('role/site/custom/', '')}</span>
      ),
    }, {
      title: RoleStore.languages[`${intlPrefix}.role.description`],
      dataIndex: 'description',
      key: 'description',
      filters: [],
      sorter: true,
      sortOrder: columnKey === 'description' && order,
      filteredValue: filters.description || [],
    }, {
      title: RoleStore.languages.publictime,
      dataIndex: 'creationDate',
      key: 'creationDate',
      filters: [],
      sorter: true,
      sortOrder: columnKey === 'creationDate' && order,
      filteredValue: filters.creationDate || [],
    }, {
      title: RoleStore.languages.status,
      dataIndex: 'enabled',
      key: 'enabled',
      filters: [{
        text: RoleStore.languages.enable,
        value: 'true',
      }, {
        text: RoleStore.languages.disable,
        value: 'false',
      }],
      sorter: true,
      sortOrder: columnKey === 'enabled' && order,
      filteredValue: filters.enabled || [],
      render: (values, record) => this.enabledState(record.enabled),
    }, {
      title: RoleStore.languages.operation,
      key: 'action',
      align: 'left',
      fixed: 'right',
      width: '120px',
      render: (text, record) => (
        <div>
          <Tooltip
            title={RoleStore.languages[`${intlPrefix}.create.byone`]}
            placement="bottom"
          >
            <Button
              size="small"
              icon="jiyusuoxuanjiaosechuangjian"
              shape="circle"
              style={{ cursor: 'pointer', color: '#2196F3' }}
              onClick={this.createByThis.bind(this, record)}
            />
          </Tooltip>
          <Tooltip
            title={RoleStore.languages.modify}
            placement="bottom"
          >
            <Button
              size="small"
              icon="bianji-"
              shape="circle"
              style={{ cursor: 'pointer', color: '#2196F3' }}
              onClick={this.showModal.bind(this, record.id)}
            />
          </Tooltip>
          {record.enabled ? (
            <Tooltip
              title={RoleStore.languages.disable}
              placement="bottom"
            >
              <Button
                icon="jinyongzhuangtai"
                style={{ cursor: 'pointer' }}
                shape="circle"
                size="small"
                onClick={this.handleEnable.bind(this, record)}
              />
            </Tooltip>
          ) : (
            <Tooltip
              title={RoleStore.languages.enable}
              placement="bottom"
            >
              <Button
                icon="yijieshu"
                shape="circle"
                style={{ cursor: 'pointer', color: '#2196F3' }}
                size="small"
                onClick={this.handleEnable.bind(this, record)}
              />
            </Tooltip>)}
        </div>),
    }];
    if (this.type === 'site') {
      columns.splice(2, 0, {
        title: RoleStore.languages.level,
        dataIndex: 'level',
        key: 'level',
        filters: [
          {
            text: RoleStore.languages.global,
            value: 'site',
          }, {
            text: RoleStore.languages.organization,
            value: 'organization',
          }, {
            text: RoleStore.languages.project,
            value: 'project',
          }],
        render: text => this.renderLevel(text),
        sorter: true,
        sortOrder: columnKey === 'level' && order,
        filteredValue: filters.level || [],
      });
      columns.splice(4, 0, {
        title: RoleStore.languages.source,
        dataIndex: 'builtIn',
        key: 'builtIn',
        filters: [{
          text: RoleStore.languages[`${intlPrefix}.builtin.predefined`],
          value: 'true',
        }, {
          text: RoleStore.languages[`${intlPrefix}.builtin.custom`],
          value: 'false',
        }],
        render: (text, record) => this.renderBuiltIn(record),
        sorter: true,
        sortOrder: columnKey === 'builtIn' && order,
        filteredValue: filters.builtIn || [],
      });
    }
    const rowSelection = {
      selectedRowKeys,
      onChange: this.changeSelects,
    };
    return (
      <Page
        service={[
          'iam-service.role.createBaseOnRoles',
          'iam-service.role.disableRole',
          'iam-service.role.enableRole',
          'iam-service.role.check',
          'iam-service.role.listRolesWithUserCountOnOrganizationLevel',
          'iam-service.role.listRolesWithUserCountOnProjectLevel',
          'iam-service.role.list',
          'iam-service.role.listPage',
          'iam-service.role.listRolesWithUserCountOnSiteLevel',
          'iam-service.role.queryWithPermissionsAndLabels',
          'iam-service.role.pagingQueryUsersByRoleIdOnOrganizationLevel',
          'iam-service.role.pagingQueryUsersByRoleIdOnProjectLevel',
          'iam-service.role.pagingQueryUsersByRoleIdOnSiteLevel',
          'iam-service.role-function.createSiteRole',
          'iam-service.role-function.createOrganizationRole',
          'iam-service.role-function.queryWithPermissionsAndLabels',
          'iam-service.role-function.update',
          'iam-service.function.getIamFunctions',
          'iam-service.function.saveFunctionRole',
          'iam-service.function.getIamFunctionsByRoles',
        ]}
        className="choerodon-role"
      >

        <Header title={
          RoleStore.languages[`${intlPrefix}.header.title`]
        }
        >
          <Permission
            service={['iam-service.role-function.createOrganizationRole']}
          >
            <Button
              style={{ color: '#04173F' }}
              onClick={this.goCreate}
            >
              <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
              {RoleStore.languages[`${intlPrefix}.creates`]}
            </Button>
          </Permission>
        </Header>
        <Content>
          <Table
            columns={columns}
            dataSource={RoleStore.getRoles}
            pagination={pagination}
            rowKey={record => record.id}
            filters={params}
            onChange={this.handlePageChange}
            loading={RoleStore.getIsLoading}
          />
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(Role)));
