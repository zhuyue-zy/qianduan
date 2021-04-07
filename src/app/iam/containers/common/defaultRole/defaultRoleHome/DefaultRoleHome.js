import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import { Button, Form, Icon, Table, Select, Modal } from 'yqcloud-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Observable } from 'rxjs';
import { Action, axios, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import _ from 'lodash';
import RoleStore from '../../../../stores/organization/defaultRole/DefaultRoleStore';
import CreateEmployeeStore from '../../../../stores/organization/employee/createEmployee/CreateEmployeeStore';
import './Role.scss';

const FormItem = Form.Item;
const { Option } = Select;
const { Sidebar } = Modal;
const intlPrefix = 'organization.defaultRole';

@inject('AppState')
@observer
class Role extends Component {
  state = this.getInitState();


  getInitState() {
    return {
      id: '',
      pagination: {
        current: 1,
        pageSize: 25,
        total: 0,
        pageSizeOptions: [25, 50, 100, 200],
      },
      pagination_2: {
        current: 0,
        pageSize: 25,
        total: 0,
        pageSizeOptions: [25, 50, 100, 200],
      },
      selectedRoleIds: {},
      params: [],
      visible: false,
      filters: {},
      sort: {
        columnKey: 'id',
        order: 'descend',
      },
      selectedData: '',
      roleData: {},
      selectedLevel: 'site',
      submitting: false,
      currentPermission: [],
      selectPermission: [],
      permissionParams: [],
      perData: [],
      selectedRows: [],
      selectedNewRows: [],
      dataRole: [],
      isDefaultRole: false,
      loadingStatus: false, // 这是loading状态
    };
  }

  componentWillMount() {
    this.loadNewRole();
    this.setCanPermissionCanSee();
    const permissions = RoleStore.getSelectedRolesPermission || [];
    this.setState({
      currentPermission: permissions.map(item => item.id),
    });
    RoleStore.getAllRoleLabel();
  }

  componentWillUnmount() {
    RoleStore.setSelectedRolesPermission([]);
  }

  componentDidMount() {
    this.isHasDefaultRole();
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const id = 0;
    RoleStore.queryLanguage(id, AppState.currentLanguage);
  }


  isHasDefaultRole = () => {
    const { intl } = this.props;
    axios.get('/iam/v1/custom/roles').then((data) => {
      if (data === '') {
      } else {
        this.setState({
          isDefaultRole: true,
        });
      }
    }).catch((error) => {
      Choerodon.handleResponseError(error);
    });
  }

  createDefaultRole = () => {
    const { intl } = this.props;
    axios.post('iam/v1/custom/roles').then((data) => {
      if (data.failed) {
        if (data.code === 'CustomRoleServiceImpl.insertDefaultRole.insertDefaultRoleError') {
          Choerodon.prompt(RoleStore.languages[`${intlPrefix}.createRole.failed`]);
        } else {
          Choerodon.prompt(RoleStore.languages[`${intlPrefix}.createRole.exists`]`${data.code}`);
        }
      } else {
        Choerodon.prompt(RoleStore.languages['create.success']);
        this.setState({
          isDefaultRole: true,
          loadingStatus: true,
        });
      }
    }).catch((error) => {
      Choerodon.handleResponseError(error);
    });
  };

  loadNewRole(paginationIn, sortIn, filtersIn, paramsIn) {
    const {
      pagination: paginationState,
      sort: sortState,
      filters: filtersState,
      params: paramsState,
    } = this.state;
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    RoleStore.loadNewRole(pagination, filters, params)
      .then((data) => {
        CreateEmployeeStore.setRoles(data.content);
        this.setState({
          dataRole: data.content,
          filters,
          loadingStatus: true,
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

  /**
   * 分页加载数据
   * @param page
   * @returns {*}
   */
  handlePageChangeMain = (paginationIn, filtersIn, sortIn, paramsIn) => {
    this.loadNewRole(paginationIn, sortIn, filtersIn, paramsIn);
  };

  getSelectedRowKeys() {
    return Object.keys(this.state.selectedRoleIds).map(id => Number(id));
  }

  // 获取权限管理数据
  setCanPermissionCanSee() {
    Observable.fromPromise(axios.get(`iam/v1/permissions/default/list?page=${0}&size=${25}`))
      .subscribe((data) => {
        this.setState({
          perData: data.content,
          pagination_2: {
            current: data.number + 1,
            pageSize: data.size,
            total: data.totalElements,
            pageSizeOptions: [25, 50, 100, 200],
          },
        });
      });
  }

  linkToChange = (url) => {
    const { history } = this.props;
    history.push(url);
  };

  handleOk = () => {
    this.props.form.validateFieldsAndScroll((err) => {
      if (!err) {
        const { intl } = this.props;
        const { currentPermission, selectedRows } = this.state;
        const rolePermissionss = [];
        currentPermission.forEach(id => rolePermissionss.push({ id }));
        if (rolePermissionss.length > 0) {
          const labelValues = this.props.form.getFieldValue('label');
          const labelIds = labelValues && labelValues.map(labelId => ({ id: labelId }));

          this.setState({ submitting: true });
          RoleStore.createRole(selectedRows)
            .then((data) => {
              this.setState({ submitting: false });
              if (data) {
                Choerodon.prompt(RoleStore.languages['modify.success']);
                this.linkToChange('/iam/defaultRole');
              }
            })
            .catch((errors) => {
              this.setState({ submitting: false });
              if (errors.response.data.message === 'error.role.roleNameExist') {
                Choerodon.prompt(RoleStore.languages[`${intlPrefix}.name.exist.msg`]);
              } else {
                Choerodon.prompt(RoleStore.languages['modify.error']);
              }
            });
        }
      }
    });
    const selected = RoleStore.getInitSelectedPermission;
    const selectedIds = selected.map(item => item.id);
    RoleStore.setSelectedRolesPermission(_.uniqBy(selected));
    this.setState({
      currentPermission: selectedIds,
      visible: false,
      alreadyPage: 1,
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false,
      firstLoad: false,
    });
  };

  // 删除
  deleteNewRole=() => {
    const { AppState, intl } = this.props;
    const { selectedNewRows } = this.state;
    const idObj = [];
    selectedNewRows.forEach((v) => {
      idObj.push(v.id);
    });
    //  删除前弹窗确认
    Modal.confirm({
      title: RoleStore.languages[`${intlPrefix}.editor.confirmDelete`],
      okType: 'danger',
      onOk: () => {
        const { record, AppState: { menuType: { organizationId } } } = this.props;
        RoleStore.deleteNewRoles(idObj)
          .then((data) => {
            this.setState({ submitting: false });
            this.handleRefresh();
            if (data) {
              Choerodon.prompt(RoleStore.languages['delete.success']);
            }
          });
      },
    });
  }

  handleRefresh = () => {
    const { AppState, id } = this.props;
    const { organizationId } = AppState.currentMenuType;
    this.setState({
      loadingStatus: false,
    });
    this.loadNewRole();
    this.setState({
      selectedRowKeys: [],
      selectedNewRows: [],
    });
  }

  handlePageChange = (pagination_2, filters, sorter, params) => {
    const { roleData } = this.state;
    const newFilters = {
      params: (params && params.join(',')) || '',
    };
    this.setState({
      permissionParams: params,
    });
    RoleStore.getWholePermission(pagination_2, filters, newFilters).subscribe((data) => {
      this.setState({
        perData: data.content,
        pagination_2: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
          pageSizeOptions: [25, 50, 100, 200],
        },
        filters,

      });
      RoleStore.handleCanChosePermission(data);
    });
  };

  handleChangePermission = (selected, ids, permissions) => {
    const initPermission = RoleStore.getInitSelectedPermission;
    if (selected) {
      const newPermission = initPermission.concat(permissions);
      RoleStore.setInitSelectedPermission(_.uniqBy(newPermission, 'code'));
    } else {
      const centerPermission = initPermission.slice();
      _.remove(centerPermission, item => ids.indexOf(item.id) !== -1);
      RoleStore.setInitSelectedPermission(centerPermission);
    }
  };

  showModal = () => {
    const { currentPermission } = this.state;
    RoleStore.setPermissionPage(RoleStore.getChosenLevel, {
      current: 1,
      pageSize: 10,
      total: '',
    });
    this.setState({
      permissionParams: [],
    }, () => {
      this.setCanPermissionCanSee();
      const selected = RoleStore.getSelectedRolesPermission
        .filter(item => currentPermission.indexOf(item.id) !== -1);
      RoleStore.setInitSelectedPermission(selected);
      this.setState({
        visible: true,
      });
    });
  };

  render() {
    const {
      roleData = {},
      chosenLevel,
      perData,
    } = this.state;
    const { currentPermission, firstLoad, selectedRows, selectedNewRows, isDefaultRole, loadingStatus } = this.state;
    const { intl } = this.props;
    const { name, builtIn } = roleData;
    const origin = RoleStore.getCanChosePermission;
    const { sort: { columnKey, order }, filters, params, dataRole, pagination_2, pagination } = this.state;
    const selectedRowKeys = this.getSelectedRowKeys();
    const selectedPermission = RoleStore.getSelectedRolesPermission || [];
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
    const changePermission = RoleStore.getInitSelectedPermission || [];
    // const pagination = RoleStore.getPermissionPage[RoleStore.getChosenLevel];
    const columns = [
      {
        title: RoleStore.languages[`${intlPrefix}.permission.serviceName`],
        dataIndex: 'serviceName',
        key: 'serviceName',
        filters: [],
        filteredValue: filters.serviceName || [],
      }, {
        title: RoleStore.languages[`${intlPrefix}.permission.path`],
        dataIndex: 'path',
        key: 'path',
        filters: [],
        filteredValue: filters.path || [],
      }, {
        title: RoleStore.languages[`${intlPrefix}.permission.method`],
        dataIndex: 'method',
        key: 'method',
        filters: [],
        filteredValue: filters.method || [],

      }, {
        title: RoleStore.languages[`${intlPrefix}.permission.publicAccess`],
        dataIndex: 'publicAccess',
        key: 'publicAccess',
        filteredValue: filters.publicAccess || [],
        render: (text, record) => {
          if (record.publicAccess === true) {
            return (<span>{RoleStore.languages.yes}</span>);
          } else {
            return (<span>{RoleStore.languages.no}</span>);
          }
        },
      }, {
        title: RoleStore.languages[`${intlPrefix}.permission.loginAccess`],
        dataIndex: 'loginAccess',
        key: 'loginAccess',
        filteredValue: filters.loginAccess || [],
        render: (text, record) => {
          if (record.loginAccess === true) {
            return (<span>{RoleStore.languages.yes}</span>);
          } else {
            return (<span>{RoleStore.languages.no}</span>);
          }
        },
      }, {
        title: RoleStore.languages[`${intlPrefix}.permission.description`],
        dataIndex: 'description',
        key: 'description',
        filters: [],
        filteredValue: filters.description || [],
      }, {
        title: RoleStore.languages[`${intlPrefix}.permission.code`],
        dataIndex: 'code',
        key: 'code',
        filters: [],
        filteredValue: filters.code || [],

      }, {
        title: RoleStore.languages[`${intlPrefix}.permission.level`],
        dataIndex: 'level',
        key: 'level',
        filteredValue: filters.level || [],
        render: (text, record) => {
          if (record.level === 'organization') {
            return (<span>{RoleStore.languages.Tenant}</span>);
          } else if (record.level === 'site') {
            return (<span>{RoleStore.languages.site}</span>);
          } else if (record.level === 'user') {
            return (<span>{RoleStore.languages.user}</span>);
          } else if (record.level === 'project') {
            return (<span>{RoleStore.languages.project}</span>);
          }
        },
      }];
    const rowSelection = {
      selectedRowKeys,
      onChange: this.changeSelects,
    };
    return (
      <div>

        <Page
          service={[
            'iam-service.role.createBaseOnRoles',
            'iam-service.role.update',
            'iam-service.role.disableRole',
            'iam-service.role.enableRole',
            'iam-service.role.create',
            'iam-service.role.check',
            'iam-service.role.listRolesWithUserCountOnOrganizationLevel',
            'iam-service.role.listRolesWithUserCountOnProjectLevel',
            'iam-service.role.list',
            'iam-service.role.listRolesWithUserCountOnSiteLevel',
            'iam-service.role.queryWithPermissionsAndLabels',
            'iam-service.role.pagingQueryUsersByRoleIdOnOrganizationLevel',
            'iam-service.role.pagingQueryUsersByRoleIdOnProjectLevel',
            'iam-service.role.pagingQueryUsersByRoleIdOnSiteLevel',
          ]}
          className="choerodon-role"
        >
          <Header
            title={RoleStore.languages[`${intlPrefix}.header.title`]}
          >
            <Permission
              service={['iam-service.role.create']}
            >
              <Button
                onClick={this.goCreate}
                style={{ color: '#04173F' }}

              >
                <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
                {RoleStore.languages[`${intlPrefix}.create`]}
              </Button>
            </Permission>
            <Button
              // funcType="raised"
              onClick={this.showModal.bind(this)}
              disabled={isDefaultRole === false}
              className="addPermission"
              style={{ color: '#04173F' }}
            >
              <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
              {RoleStore.languages[`${intlPrefix}.add.permission`]}
              </Button>
            <Button
              style={{ color: '#04173F' }}
              onClick={this.deleteNewRole}
              disabled={!selectedNewRows.length}
            >
              <Icon type="shanchu" style={{ color: '#2196F3', width: 25 }} />
              {RoleStore.languages[`${intlPrefix}.delete.per`]}
              </Button>
          </Header>
          <Content>
            {
              isDefaultRole === false ? (<div className="content-nothave-defaultRole-hint">{RoleStore.languages[`${intlPrefix}.createDefaultRole`]}</div>) : (
                <Table
                  columns={columns}
                  // loading={loadingStatus}
                  dataSource={dataRole || []}
                  pagination={pagination}
                  scroll={{ x: 2000 }}
                  rowSelection={{
                    selectedRowKeys: currentPermission,
                    onChange: (selectedRowKeys, valAll) => {
                      this.setState({
                        currentPermission: selectedRowKeys,
                        selectedNewRows: valAll,
                      });
                    },

                  }}
                  onChange={this.handlePageChangeMain}
                  rowKey={record => record.id}
                  // filters={params}
                  //filterBarPlaceholder={intl.formatMessage({ id: 'filtertable' })}
                />
              )
            }

          </Content>
          <Sidebar
            title={RoleStore.languages[`${intlPrefix}.add.permission`]}
            visible={this.state.visible}
            destroyOnClose="true"
            footer={[
              <div className="role-action">
                <Button key="submit"
                        onClick={this.handleOk.bind(this)}
                  //style={{background:'#2196F3'}}
                        type="primary"
                >
                  {RoleStore.languages.ok}
                  </Button>
                <Button key="back" onClick={this.handleCancel.bind(this)}>
                  {RoleStore.languages.cancel}</Button>
              </div>
            ]}
          >
            <Content
              className="sidebar-content"
              //code={`${intlPrefix}.modify.addpermission`}
              values={{ name }}
            >
              <Form layout="vertical">
                <FormItem
                  {...formItemLayout}
                >
                  <Table
                    style={{
                      // width: '512px',
                    }}
                    columns={[
                      {
                        title: RoleStore.languages[`${intlPrefix}.permission.serviceName`],
                        dataIndex: 'serviceName',
                        key: 'serviceName',
                        filters: [],
                        filteredValue: filters.serviceName || [],
                      }, {
                        title: RoleStore.languages[`${intlPrefix}.permission.code`],
                        dataIndex: 'code',
                        key: 'code',
                        filters: [],
                        filteredValue: filters.code || [],
                      }, {
                        title: RoleStore.languages[`${intlPrefix}.permission.path`],
                        dataIndex: 'path',
                        key: 'path',
                        filters: [],
                        filteredValue: filters.path || [],

                      }, {
                        title: RoleStore.languages[`${intlPrefix}.permission.method`],
                        dataIndex: 'method',
                        key: 'method',
                        filters: [],
                        filteredValue: filters.method || [],

                      },
                    ]}
                    scroll={{ x: 1200 }}
                    rowKey="id"
                    dataSource={perData}
                    pagination={pagination_2}
                    onChange={this.handlePageChange.bind(this)}
                    filters={this.state.permissionParams}
                    //filterBarPlaceholder={intl.formatMessage({ id: 'filtertable' })}
                    rowSelection={{
                      selectedRowKeys: currentPermission,
                      onChange: (selectedRowKeys, valAll) => {
                        this.setState({
                          currentPermission: selectedRowKeys,
                          selectedRows: valAll,
                        });
                      },
                    }}
                  />
                </FormItem>
              </Form>
            </Content>
          </Sidebar>
        </Page>

      </div>

    );
  }
}

export default Form.create({})(withRouter(injectIntl(Role)));
