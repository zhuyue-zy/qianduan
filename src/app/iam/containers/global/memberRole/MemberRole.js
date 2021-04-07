import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Form, Icon, Modal, Progress, Select, Table, Tooltip } from 'yqcloud-ui';
import { withRouter } from 'react-router-dom';
import { axios, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';
import querystring from 'query-string';
import './MemberRole.scss';
import RoleStore from '../../../stores/globalStores/role/RoleStore';

const { Sidebar } = Modal;
const FormItem = Form.Item;
const { Option } = Select;
const pageSize = 25;
const intlPrefix = 'memberrole';
const FormItemNumLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 100 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 10 },
  },
};

// 公用方法类
class MemberRoleType {
  constructor(context) {
    this.context = context;
    const { AppState } = this.context.props;
    const { type, id, name } = this.data = AppState.currentMenuType;
    let apiGetway = `/iam/v1/${type}s/${id}`;
    let codePrefix;
    switch (type) {
      case 'organization':
        codePrefix = 'organization';
        break;
      case 'project':
        codePrefix = 'project';
        break;
      case 'site':
        codePrefix = 'global';
        apiGetway = `/iam/v1/${type}`;
        break;
    }
    this.code = `${codePrefix}.memberrole`;
    this.values = { name: name || 'Choerodon' };
    this.urlUsers = `${apiGetway}/role_members/users`;
    this.urlRoles = `${apiGetway}/role_members/users/roles`;
    this.urlRoleMember = `${apiGetway}/role_members`;
    this.urlDeleteMember = `${apiGetway}/role_members/delete`;
    this.urlUserCount = `${apiGetway}/role_members/users/count`;
    this.roleId = id || 0;
  }

  // fetch分配角色（post）
  fetchRoleMember(memberIds, body, isEdit) {
    let str = `member_ids=${memberIds.join(',')}`;
    if (isEdit === true) {
      str += '&is_edit=true';
    }
    return axios.post(`${this.urlRoleMember}?${str}`, JSON.stringify(body));
  }

  // delete分配角色（delete)
  deleteRoleMember(body) {
    const { id } = this.data;
    body.sourceId = id || 0;
    return axios.post(this.urlDeleteMember, JSON.stringify(body));
  }

  // 根据账户名查询memberId
  searchMemberId(loginName) {
    if (loginName) {
      return axios.get(`/iam/v1/users?login_name=${loginName}`);
    }
  }

  searchMemberIds(loginNames) {
    const promises = loginNames.map((index, value) => this.searchMemberId(index));
    return axios.all(promises);
  }

  loadRoleMemberData(roleData, { current }, { loginName, realName }, params) {
    const { id: roleId, users, name } = roleData;
    const body = {
      loginName: loginName && loginName[0],
      realName: realName && realName[0],
      param: params,
    };
    const queryObj = { role_id: roleId, size: pageSize, page: current - 1 };
    roleData.loading = true;
    return axios.post(`${this.urlUsers}?${querystring.stringify(queryObj)}`,
      JSON.stringify(body))
      .then(({ content }) => {
        roleData.users = users.concat(content.map((member) => {
          member.roleId = roleId;
          member.roleName = name;
          return member;
        }));
        delete roleData.loading;
        this.context.forceUpdate();
      });
  }

  loadMemberDatas({ pageSize: size, current }, { loginName, realName, roles }, params) {
    const body = {
      loginName: loginName && loginName[0],
      roleName: roles && roles[0],
      realName: realName && realName[0],
      param: params,
    };
    const queryObj = { size, page: current - 1, sort: 'id' };
    return axios.post(`${this.urlRoles}?${querystring.stringify(queryObj)}`, JSON.stringify(body));
  }

  loadRoleMemberDatas({ loginName, realName, name }) {
    const body = {
      roleName: name && name[0],
      loginName: loginName && loginName[0],
      realName: realName && realName[0],
    };
    return axios.post(this.urlUserCount, JSON.stringify(body));
  }

  // 多路请求
  fetch() {
    const { memberRolePageInfo, memberRoleFilters, roleMemberFilters, expandedKeys, params, roleMemberParams } = this.context.state;
    this.context.setState({
      loading: true,
    });
    return axios.all([
      this.loadMemberDatas(memberRolePageInfo, memberRoleFilters, params),
      this.loadRoleMemberDatas(roleMemberFilters),
    ]).then(([{ content, totalElements, number }, roleData]) => {
      this.context.setState({
        memberDatas: content,
        expandedKeys,
        roleMemberDatas: roleData.filter((role) => {
          role.users = role.users || [];
          if (role.userCount > 0) {
            if (expandedKeys.find(expandedKey => expandedKey.split('-')[1] === String(role.id))) {
              this.loadRoleMemberData(role, {
                current: 1,
                pageSize,
              }, roleMemberFilters, roleMemberParams);
            }
            return true;
          }
          return false;
        }),
        roleData,
        loading: false,
        memberRolePageInfo: {
          total: totalElements,
          current: number + 1,
          pageSize,
          pageSizeOptions: [25, 50, 100, 200],
        },
      });
    });
  }
}

@inject('AppState')
@observer
class MemberRole extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = this.getInitState();
  }

  getInitState() {
    return {
      submitting: false,
      memberDatas: [], // 账户下的角色集合
      sidebar: false,
      roleData: [], // 当前情况下的所有角色
      selectType: 'create',
      currentMemberData: [], // 当前账户的角色分配信息
      loading: true,
      showMember: true,
      selectMemberRoles: {},
      selectRoleMembers: [],
      selectRoleMemberKeys: [],
      expandedKeys: [],
      validedMembers: {},
      roleMemberDatas: [],
      roleMemberFilters: {},
      roleMemberParams: [],
      memberRoleFilters: {},
      memberRolePageInfo: {
        current: 1,
        total: 0,
        pageSize,
        pageSizeOptions: [25, 50, 100, 200],
      },
      roleMemberFilterRole: [],
      roleIds: [],
      params: [],
      memberData: [],
    };
  }

  init() {
    this.initMemberRole();
    this.roles.fetch();
    this.loadMemberData();
  }

  // 第一次渲染前获得数据
  componentWillMount() {
    this.init();
  }

  componentDidMount() {
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const id = 0;
    RoleStore.queryLanguage(id, AppState.currentLanguage);
  }

  reload = () => {
    this.setState(this.getInitState(), () => {
      this.init();
    });
  };

  formatMessage = (id, values = {}) => {
    const { intl } = this.props;
    return intl.formatMessage({
      id,
    }, values);
  }

  // 创建编辑角色 状态
  getOption = (current) => {
    const { roleData = [], roleIds } = this.state;
    return roleData.reduce((options, { id, name, enabled, code }) => {
      if (roleIds.indexOf(id) === -1 || id === current) {
        if (enabled === false) {
          options.push(<Option style={{ display: 'none' }} disabled value={id} key={id}>{name}</Option>);
        } else {
          options.push(
            <Option value={id} key={id}>
              <Tooltip title={code} placement="right">
                <span style={{ display: 'inline-block', width: '100%' }}>{name}</span>
              </Tooltip>
            </Option>,
          );
        }
      }
      return options;
    }, []);
  };

  loadMemberData = () => {
    const { organizationId } = this.props.AppState.menuType;
    const url = organizationId ? `/iam/v1/users/org/${organizationId}` : '/iam/v1/users/0';
    axios.get(url).then((res) => {
      this.setState({
        memberData: res,
      });
    });
  }

  getMemberOption = () => {
    const { memberData } = this.state;
    return memberData.reduce((options, { id, loginName, realName }) => {
      options.push(
        <Option value={loginName} key={id}>{realName}</Option>,
      );
      return options;
    }, []);
  };

  closeSidebar = () => {
    this.setState({
      sidebar: false,
      currentMemberData: [],
    });
  };

  openSidebar = () => {
    this.props.form.resetFields();
    this.setState({
      roleIds: this.initFormRoleIds(),
      sidebar: true,
    });
  };

  initFormRoleIds() {
    const { selectType, currentMemberData } = this.state;
    let roleIds = [undefined];
    if (selectType === 'edit') {
      roleIds = currentMemberData.roles.map(({ id }) => id);
    }
    return roleIds;
  }

  getProjectNameDom() {
    const { selectType, currentMemberData } = this.state;
    const { getFieldDecorator } = this.props.form;
    const member = currentMemberData.loginName || '';
    return (
      <FormItem
        {...FormItemNumLayout}
      >
        {getFieldDecorator('member', {
          rules: [
            {
              required: true,
              message: RoleStore.languages[`${intlPrefix}.member.require.msg`],
            },
          ],
          initialValue: member,
        })(
          <Select
            style={{ width: 300 }}
            label={RoleStore.languages[`${intlPrefix}.member.label`]}
            optionFilterProp="children"
            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
            filter
            disabled={selectType !== 'create'}
          >
            {this.getMemberOption()}
          </Select>,
        )}
      </FormItem>
    );
  }

  getRoleFormItems = () => {
    const { selectType, roleIds } = this.state;
    const { getFieldDecorator } = this.props.form;
    const formItems = roleIds.map((id, index) => {
      const key = id === undefined ? `role-index-${index}` : String(id);
      return (
        <FormItem
          {...FormItemNumLayout}
          key={key}
        >
          {getFieldDecorator(key, {
            rules: [
              {
                required: roleIds.length === 1 && selectType === 'create',
                message: RoleStore.languages[`${intlPrefix}.role.require.msg`],
              },
            ],
            initialValue: id,
          })(
            <Select
              style={{ width: 300 }}
              label={RoleStore.languages[`${intlPrefix}.role.label`]}
              getPopupContainer={() => document.getElementsByClassName('sidebar-content')[0].parentNode}
              filterOption={(input, option) => {
                const childNode = option.props.children;
                if (childNode && React.isValidElement(childNode)) {
                  return childNode.props.children.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                }
                return false;
              }}
              onChange={value => roleIds[index] = value}
              filter
            >
              {this.getOption(id)}
            </Select>,
          )}
          <Button
            size="small"
            icon="delete"
            shape="circle"
            onClick={() => this.removeRole(index)}
            disabled={roleIds.length === 1 && selectType === 'create'}
            className="delete-role"
          />
        </FormItem>
      );
    });
    return formItems;
  };

  addRoleList = () => {
    const { roleIds } = this.state;
    roleIds.push(undefined);
    this.setState({ roleIds });
  };

  // sidebar
  removeRole = (index) => {
    const { roleIds } = this.state;
    roleIds.splice(index, 1);
    this.setState({ roleIds });
  };

  deleteRoleByMultiple = () => {
    const { selectMemberRoles, showMember, selectRoleMembers } = this.state;
    const content = showMember ? RoleStore.languages[`${intlPrefix}.remove.select.all.content`] : RoleStore.languages[`${intlPrefix}.remove.select.content`];
    Modal.confirm({
      title: RoleStore.languages[`${intlPrefix}.remove.title`],
      content,
      onOk: () => {
        if (showMember) {
          return this.deleteRolesByIds(selectMemberRoles);
        } else {
          const data = {};
          selectRoleMembers.forEach(({ id, roleId }) => {
            if (!data[roleId]) {
              data[roleId] = [];
            }
            data[roleId].push(id);
          });
          return this.deleteRolesByIds(data);
        }
      },
    });
  };

  deleteRoleByRole = (record) => {
    Modal.confirm({
      title: RoleStore.languages[`${intlPrefix}.remove.title`],
      content: this.formatMessage('memberrole.remove.content', {
        member: record.loginName,
        role: record.roleName,
      }),
      onOk: () => this.deleteRolesByIds({ [record.roleId]: [record.id] }),
    });
  };

  deleteRolesByIds = (data) => {
    const { showMember } = this.state;
    let body = {};
    if (showMember) {
      body = {
        view: 'userView',
        memberType: 'user',
        data,
      };
    } else {
      body = {
        view: 'roleView',
        memberType: 'user',
        data,
      };
    }

    return this.roles.deleteRoleMember(body).then(({ failed, message }) => {
      if (failed) {
        Choerodon.prompt(message);
      } else {
        Choerodon.prompt(RoleStore.languages['remove.success']);
        this.setState({
          selectRoleMemberKeys: [],
          selectMemberRoles: {},
        });
        this.roles.fetch();
      }
    });
  };

  initMemberRole() {
    this.roles = new MemberRoleType(this);
  }

  getSidebarTitle() {
    const { selectType } = this.state;
    if (selectType === 'create') {
      // return <FormattedMessage id="memberrole.add" />;
    } else if (selectType === 'edit') {
      return RoleStore.languages[`${intlPrefix}.modify`];
    }
  }

  getHeader() {
    const { selectType, currentMemberData } = this.state;
    const { code, values } = this.roles;
    const modify = selectType === 'edit';
    return {
      code: modify ? `${code}.modify` : `${code}.add`,
      values: modify ? { name: currentMemberData.loginName } : values,
    };
  }

  getAddOtherBtn(disabled) {
    return (
      <Button type="primary" disabled={disabled} className="add-other-role" icon="add" onClick={this.addRoleList}>
        {RoleStore.languages[`${intlPrefix}.add.other`]}
      </Button>
    );
  }

  getSidebarContent() {
    const { roleData = [], roleIds } = this.state;
    const header = this.getHeader();
    const disabled = roleIds.findIndex((id, index) => id === undefined) !== -1
      || !roleData.filter(({ enabled, id }) => enabled && roleIds.indexOf(id) === -1).length;
    return (
      <Content
        className="sidebar-content"
        // {...header}
      >
        <Form layout="vertical">
          {this.getProjectNameDom()}
          {this.getRoleFormItems()}
        </Form>
        {this.getAddOtherBtn(disabled)}
      </Content>);
  }

  isModify = () => {
    const { roleIds, currentMemberData } = this.state;
    const { roles } = currentMemberData;
    if (roles.length !== roleIds.length) {
      return true;
    }
    for (let i = 0; i < roles.length; i++) {
      if (!roleIds.includes(roles[i].id)) {
        return true;
      }
    }
    return false;
  }

  // ok 按钮保存
  handleOk = (e) => {
    const { selectType, roleIds } = this.state;
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const memberNames = [values.member];
        const body = roleIds.filter(roleId => roleId).map((roleId, index) => ({
          memberType: 'user',
          roleId,
          sourceId: sessionStorage.selectData.id || 0,
          sourceType: sessionStorage.type,
        }));
        this.setState({ submitting: true });
        if (selectType === 'create') {
          this.roles.searchMemberIds(memberNames).then((data) => {
            if (data) {
              const memberIds = data.map(info => info.id);
              this.roles.fetchRoleMember(memberIds, body)
                .then(({ failed, message }) => {
                  this.setState({ submitting: false });
                  if (failed) {
                    Choerodon.prompt(message);
                  } else {
                    Choerodon.prompt(RoleStore.languages['add.success']);
                    this.closeSidebar();
                    this.roles.fetch();
                  }
                })
                .catch((error) => {
                  this.setState({ submitting: false });
                  Choerodon.handleResponseError(error);
                });
            }
          });
        } else if (selectType === 'edit') {
          if (!this.isModify()) {
            this.setState({ submitting: false });
            Choerodon.prompt(RoleStore.languages['modify.success']);
            this.closeSidebar();
            return;
          }
          const { currentMemberData } = this.state;
          const memberIds = [currentMemberData.id];
          this.roles.fetchRoleMember(memberIds, body, true)
            .then(({ failed, message }) => {
              this.setState({ submitting: false });
              if (failed) {
                Choerodon.prompt(message);
              } else {
                Choerodon.prompt(RoleStore.languages['modify.success']);
                this.closeSidebar();
                this.roles.fetch();
              }
            })
            .catch((error) => {
              this.setState({ submitting: false });
              Choerodon.handleResponseError(error);
            });
        }
      }
    });
  };

  createRole = () => {
    this.setState({
      selectType: 'create',
    }, () => {
      this.openSidebar();
    });
  };

  editRole = (memberData) => {
    this.setState({
      selectType: 'edit',
      currentMemberData: memberData,
    }, () => {
      this.openSidebar();
    });
  };

  handleDelete = (record) => {
    Modal.confirm({
      title: RoleStore.languages[`${intlPrefix}.remove.title`],
      content: this.formatMessage('memberrole.remove.all.content', { name: record.loginName }),
      onOk: () => this.deleteRolesByIds({
        [record.id]: record.roles.map(({ id }) => id),
      }),
    });
  };

  handleEditRole = ({ id: memberId, loginName }) => {
    const member = this.state.memberDatas.find(({ id }) => id === memberId);
    if (!member) {
      this.roles.loadMemberDatas({
        current: 1,
        pageSize,
      }, {
        loginName: [loginName],
      }).then(({ content }) => {
        this.editRole(content.find(memberData => memberData.loginName === loginName));
      });
    } else {
      this.editRole(member);
    }
  };

  showMemberTable(show) {
    this.reload();
    this.setState({
      showMember: show,
    });
  }

  memberRoleTableChange = (memberRolePageInfo, memberRoleFilters, sort, params) => {
    this.setState({
      memberRolePageInfo,
      memberRoleFilters,
      params,
      loading: true,
    });
    this.roles.loadMemberDatas(memberRolePageInfo, memberRoleFilters, params).then(({ content, totalElements, number, size }) => {
      this.setState({
        loading: false,
        memberDatas: content,
        memberRolePageInfo: {
          current: number + 1,
          total: totalElements,
          pageSize: size,
          pageSizeOptions: [25, 50, 100, 200],
        },
        params,
        memberRoleFilters,
      });
    });
  };

  roleMemberTableChange = (pageInfo, { name, ...roleMemberFilters }, sort, params) => {
    const newState = {
      roleMemberFilterRole: name,
      roleMemberFilters,
      roleMemberParams: params,
    };
    newState.loading = true;
    const { expandedKeys } = this.state;
    this.roles.loadRoleMemberDatas({ name, ...roleMemberFilters })
      .then((roleData) => {
        const roleMemberDatas = roleData.filter((role) => {
          role.users = role.users || [];
          if (role.userCount > 0) {
            if (expandedKeys.find(expandedKey => expandedKey.split('-')[1] === String(role.id))) {
              this.roles.loadRoleMemberData(role, {
                current: 1,
                pageSize,
              }, roleMemberFilters, params);
            }
            return true;
          }
          return false;
        });
        this.setState({
          loading: false,
          expandedKeys,
          roleMemberDatas,
        });
      });
    this.setState(newState);
  };

  renderMemberTable() {
    const { selectMemberRoles, roleMemberDatas, memberRolePageInfo, memberDatas, memberRoleFilters, loading } = this.state;
    const filtersRole = roleMemberDatas.map(({ name }) => ({
      value: name,
      text: name,
    }));
    const { organizationId, projectId, createService, deleteService, type } = this.getPermission();
    const columns = [
      {
        title: RoleStore.languages[`${intlPrefix}.member`],
        dataIndex: 'loginName',
        key: 'loginName',
        filters: [],
        filteredValue: memberRoleFilters.loginName || [],
        render: (text, { enabled }) => {
          if (enabled === false) {
            return (
              <Tooltip title={RoleStore.languages[`${intlPrefix}.member.disabled.tip`]}>
                <span className="text-disabled">
                  {text}
                </span>
              </Tooltip>
            );
          }
          return text;
        },
      },
      {
        title: RoleStore.languages[`${intlPrefix}.name`],
        dataIndex: 'realName',
        key: 'realName',
        filters: [],
        filteredValue: memberRoleFilters.realName || [],
        render: (text, { enabled }) => {
          if (enabled === false) {
            return (
              <Tooltip title={RoleStore.languages[`${intlPrefix}.member.disabled.tip`]}>
                <span className="text-disabled">
                  {text}
                </span>
              </Tooltip>
            );
          }
          return text;
        },
      },
      {
        title: RoleStore.languages[`${intlPrefix}.member.type`],
        dataIndex: 'organizationId',
        key: 'organizationId',
        render: (record, text) => <div><Icon type="person" style={{ verticalAlign: 'text-bottom', marginRight: '4px' }} /><span>{RoleStore.languages.account}</span></div>,
      },
      {
        title: RoleStore.languages[`${intlPrefix}.role`],
        dataIndex: 'roles',
        key: 'roles',
        filters: filtersRole,
        filteredValue: memberRoleFilters.roles || [],
        className: 'memberrole-roles',
        render: text => text.map(({ id, name, enabled }) => {
          const wrapclass = ['role-table'];
          let item = <span className="role-table-list">{name}</span>;
          if (enabled === false) {
            wrapclass.push('text-disabled');
            item = (
              <Tooltip title={RoleStore.languages[`${intlPrefix}.role.disabled.tip`]}>
                {item}
              </Tooltip>
            );
          }
          return (
            <div key={id} className={wrapclass.join(' ')}>
              {item}
            </div>
          );
        }),
      },
      {
        title: RoleStore.languages.operation,
        width: 100,
        align: 'left',
        render: (text, record) => (
          <div>
            <Permission
              service={createService}
            >
              <Tooltip
                title={RoleStore.languages.modify}
                placement="bottom"
              >
                <Button
                  onClick={() => {
                    this.editRole(record);
                  }}
                  size="small"
                  shape="circle"
                  icon="bianji-"
                  style={{ cursor: 'pointer', color: '#2196F3' }}
                />
              </Tooltip>
            </Permission>
            <Permission
              service={deleteService}
              type={type}
              organizationId={organizationId}
              projectId={projectId}
            >
              <Tooltip
                title={RoleStore.languages.delete}
                placement="bottom"
              >
                <Button
                  size="small"
                  shape="circle"
                  onClick={this.handleDelete.bind(this, record)}
                  icon="shanchu-icon"
                />
              </Tooltip>
            </Permission>
          </div>
        ),
      },
    ];
    const rowSelection = {
      selectedRowKeys: Object.keys(selectMemberRoles).map(key => Number(key)),
      onChange: (selectedRowkeys, selectedRecords) => {
        this.setState({
          selectMemberRoles: selectedRowkeys.reduce((data, key, index) => {
            data[key] = selectedRecords[index].roles.map(({ id }) => id);
            return data;
          }, {}),
        });
      },
    };
    return (
      <Table
        key="member-role"
        className="member-role-table"
        loading={loading}
        rowSelection={rowSelection}
        pagination={memberRolePageInfo}
        columns={columns}
        filters={this.state.params}
        onChange={this.memberRoleTableChange}
        dataSource={memberDatas}
        // filterBarPlaceholder={this.formatMessage("filtertable")}
        rowKey={({ id }) => id}
      />
    );
  }

  renderRoleTable() {
    const { roleMemberDatas, roleMemberFilterRole, selectRoleMemberKeys, expandedKeys, roleMemberParams, roleMemberFilters, loading } = this.state;
    const { organizationId, projectId, createService, deleteService, type } = this.getPermission();
    const filtersData = roleMemberDatas.map(({ name }) => ({
      value: name,
      text: name,
    }));
    let dataSource = roleMemberDatas;
    if (roleMemberFilterRole && roleMemberFilterRole.length) {
      dataSource = roleMemberDatas.filter(({ name }) => roleMemberFilterRole.some(role => name.indexOf(role) !== -1));
    }
    const columns = [
      {
        title: RoleStore.languages[`${intlPrefix}.member`],
        key: 'loginName',
        hidden: true,
        filters: [],
        filteredValue: roleMemberFilters.loginName || [],
      },
      {
        title: RoleStore.languages[`${intlPrefix}.rolemember`],
        filterTitle: RoleStore.languages[`${intlPrefix}.role`],
        key: 'name',
        dataIndex: 'name',
        filters: filtersData,
        filteredValue: roleMemberFilterRole || [],
        render: (text, data) => {
          const { loginName, name } = data;
          if (loginName) {
            return loginName;
          } else if (name) {
            const { userCount, users: { length }, loading, enabled } = data;
            const more = loading ? (
              <Progress type="loading" width={12} />
            ) : (length > 0 && userCount > length && (
              <a onClick={() => {
                this.roles.loadRoleMemberData(data, {
                  current: length / pageSize + 1,
                  pageSize,
                }, roleMemberFilters);
                this.forceUpdate();
              }}
              >{RoleStore.languages.more}
              </a>
            ));
            const item = <span className={classnames({ 'text-disabled': !enabled })}>{name} ({userCount}) {more}</span>;
            if (enabled === false) {
              return (
                <Tooltip title={RoleStore.languages[`${intlPrefix}.role.disabled.tip`]}>
                  {item}
                </Tooltip>
              );
            } else {
              return item;
            }
          }
        },
      },
      {
        title: RoleStore.languages[`${intlPrefix}.name`],
        key: 'realName',
        dataIndex: 'realName',
        filteredValue: roleMemberFilters.realName || [],
        filters: [],
      },
      {
        title: '',
        width: 100,
        align: 'right',
        render: (text, record) => {
          if ('roleId' in record) {
            return (
              <div>
                <Permission
                  service={createService}
                >
                  <Tooltip title={RoleStore.languages.modify}>
                    <Button
                      onClick={() => {
                        this.handleEditRole(record);
                      }}
                      size="small"
                      shape="circle"
                      icon="bianji-"
                      style={{ cursor: 'pointer', color: '#2196F3' }}
                    />
                  </Tooltip>
                </Permission>
                <Permission
                  service={deleteService}
                >
                  <Tooltip title={RoleStore.languages.remove}>
                    <Button
                      size="small"
                      onClick={this.deleteRoleByRole.bind(this, record)}
                      shape="circle"
                      icon="shanchu-icon"
                    />
                  </Tooltip>
                </Permission>
              </div>
            );
          }
        },
      },
    ];
    const rowSelection = {
      type: 'checkbox',
      selectedRowKeys: selectRoleMemberKeys,
      getCheckboxProps: ({ loginName }) => ({
        disabled: !loginName,
      }),
      onChange: (selectRoleMemberKeys, selectRoleMembers) => {
        this.setState({
          selectRoleMemberKeys,
          selectRoleMembers,
        });
      },
    };
    return (
      <Table
        key="role-member"
        loading={loading}
        rowSelection={rowSelection}
        expandedRowKeys={expandedKeys}
        className="role-member-table"
        pagination={false}
        columns={columns}
        filters={roleMemberParams}
        indentSize={0}
        dataSource={dataSource}
        rowKey={({ roleId = '', id }) => [roleId, id].join('-')}
        childrenColumnName="users"
        onChange={this.roleMemberTableChange}
        onExpand={this.handleExpand}
        onExpandedRowsChange={this.handleExpandedRowsChange}
        // filterBarPlaceholder={this.formatMessage('filtertable')}
      />
    );
  }

  handleExpandedRowsChange = (expandedKeys) => {
    this.setState({
      expandedKeys,
    });
  };

  handleExpand = (expand, data) => {
    const { users = [], id } = data;
    if (expand && !users.length) {
      this.roles.loadRoleMemberData(data, {
        current: 1,
        pageSize,
      }, this.state.roleMemberFilters, this.state.roleMemberParams);
    }
  };

  getMemberRoleClass(name) {
    const { showMember } = this.state;
    if (name === 'member') {
      return classnames({
        active: showMember,
      });
    } else if (name === 'role') {
      return classnames({
        active: !showMember,
      });
    }
  }

  getPermission() {
    const { AppState } = this.props;
    const { type } = AppState.currentMenuType;
    let createService = ['iam-service.role-member.createOrUpdateOnSiteLevel'];
    let deleteService = ['iam-service.role-member.deleteOnSiteLevel'];
    if (type === 'organization') {
      createService = ['iam-service.role-member.createOrUpdateOnOrganizationLevel'];
      deleteService = ['iam-service.role-member.deleteOnOrganizationLevel'];
    } else if (type === 'project') {
      createService = ['iam-service.role-member.createOrUpdateOnProjectLevel'];
      deleteService = ['iam-service.role-member.deleteOnProjectLevel'];
    }
    return {
      createService,
      deleteService,
    };
  }

  render() {
    const { sidebar, selectType, roleData, showMember, selectMemberRoles, selectRoleMemberKeys, submitting } = this.state;
    const okText = selectType === 'create' ? RoleStore.languages.add : RoleStore.languages.save;
    const { createService, deleteService } = this.getPermission();
    return (
      <Page
        service={[
          'iam-service.role-member.createOrUpdateOnSiteLevel',
          'iam-service.role-member.deleteOnSiteLevel',
          'iam-service.role-member.createOrUpdateOnOrganizationLevel',
          'iam-service.role-member.deleteOnOrganizationLevel',
          'iam-service.role-member.createOrUpdateOnProjectLevel',
          'iam-service.role-member.deleteOnProjectLevel',
          'iam-service.role-member.createOrUpdateOnOrganizationLevel1',
          'iam-service.role-member.deleteOnOrganizationLevel1',
          'iam-service.role-member.pagingQueryUsersByRoleIdOnOrganizationLevel',
          'iam-service.role-member.listRolesWithUserCountOnOrganizationLevel',
          'iam-service.role-member.pagingQueryUsersWithOrganizationLevelRoles',
          'iam-service.role-member.pagingQueryUsersByRoleIdOnProjectLevel',
          'iam-service.role-member.listRolesWithUserCountOnProjectLevel',
          'iam-service.role-member.pagingQueryUsersWithProjectLevelRoles',
          'iam-service.role-member.createOrUpdateOnSiteLevel1',
          'iam-service.role-member.deleteOnSiteLevel1',
          'iam-service.role-member.pagingQueryUsersByRoleIdOnSiteLevel',
          'iam-service.role-member.listRolesWithUserCountOnSiteLevel',
          'iam-service.role-member.pagingQueryUsersWithSiteLevelRoles',
        ]}
      >
        <Header title={RoleStore.languages[`${intlPrefix}.header.title`]}>
          <Permission
            service={createService}
          >
            <Button
              onClick={this.createRole}
              style={{ color: '#04173F' }}
            >
              <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
              {RoleStore.languages.add}
            </Button>
          </Permission>
          <Permission
            service={deleteService}
          >
            <Button
              onClick={this.deleteRoleByMultiple}
              disabled={!(showMember ? Object.keys(selectMemberRoles) : selectRoleMemberKeys).length}
              style={{ color: '#04173F' }}
            >
              <Icon type="shanchu" style={{ color: '#2196F3', width: 25 }} />
              {RoleStore.languages.delete}
            </Button>
          </Permission>
        </Header>
        <Content>
          <div className="member-role-btns">
            <span className="text">
              {RoleStore.languages[`${intlPrefix}.view`]}
            </span>
            <Button
              style={{ color: '#2196F3', width: 75 }}
              className={this.getMemberRoleClass('member')}
              onClick={() => {
                this.showMemberTable(true);
              }}
              type="primary"
            >{RoleStore.languages[`${intlPrefix}.member`]}
            </Button>
            <Button
              style={{ color: '#2196F3', width: 75 }}
              className={this.getMemberRoleClass('role')}
              onClick={() => {
                this.showMemberTable(false);
              }}
              type="primary"
            >{RoleStore.languages[`${intlPrefix}.role`]}
            </Button>
          </div>
          {showMember ? this.renderMemberTable() : this.renderRoleTable()}
          <Sidebar
            title={this.getSidebarTitle()}
            visible={sidebar}
            footer={[
              <div className="role-action">
                <Button
                  key="submit"
                  onClick={this.handleOk}
                  style={{ background: '#2196F3' }}
                  type="primary"
                >
                  <span style={{ color: '#FFFFFF' }}>{okText}</span>
                </Button>
                <Button key="back" onClick={this.closeSidebar}>
                  {RoleStore.languages.cancel}
                </Button>
              </div>,
            ]}
            // style={{background:'#2196F3'}}
          >
            {roleData.length ? this.getSidebarContent() : null}
          </Sidebar>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(MemberRole)));
