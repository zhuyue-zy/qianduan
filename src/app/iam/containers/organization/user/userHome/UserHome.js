import React, { Component } from 'react';
import { Button, Modal, Table, Tooltip, Icon, Popover, Divider } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission } from 'yqcloud-front-boot';
import EditUser from '../editUser';
import UserStore from '../../../../stores/organization/user/UserStore';

import './UserHome.scss';

const { Sidebar } = Modal;
const intlPrefix = 'organization.user';

@inject('AppState')
@observer
class User extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitState();
    this.loadLanguage();
  }

  getInitState() {
    return {
      submitting: false,
      open: false,
      edit: false,
      id: '',
      page: 0,
      isLoading: true,
      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: [25, 50, 100, 200],
      },
      sort: 'id,desc',
      visible: false,
      selectedData: '',
      employeeId: 0,
    };
  }

  componentWillMount() {
    this.fetch(this.props);
  }

  componentDidMount() {
    this.loadUser();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    UserStore.queryLanguage(id, AppState.currentLanguage);
  }


  handleRefresh = () => {
    this.setState(this.getInitState(),
      () => {
        this.loadUser();
      });
  };

  onEdit = (id, employeeId) => {
    this.setState({
      visible: true,
      edit: true,
      selectedData: id,
      employeeId,
    });
  };

  fetch = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    UserStore.getIsEnabled(organizationId);
  }

  // 启用快码
  enabledState = (values) => {
    const enabled = UserStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  loadUser = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    UserStore.loadUsers(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      UserStore.setUsers(data.content);
      this.setState({
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
          pageSizeOptions: [25, 50, 100, 200],
        },
        filters,
        params,
        sort,
      });
    })
      .catch(error => Choerodon.handleResponseError(error));
  };

  openNewPage = () => {
    this.setState({
      visible: true,
      edit: false,
    });
  };

  /*
  * 解锁
  * */
  handleUnLock = (record) => {
    const { AppState, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    UserStore.unLockUser(organizationId, record.id).then(() => {
      Choerodon.prompt(intl.formatMessage({ id: `${intlPrefix}.unlock.success` }));
      this.loadUser();
    }).catch((error) => {
      window.console.log(error);
    });
  };

  /*
  * 启用停用
  * */
  handleAble = (record) => {
    const { AppState, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    if (record.enabled) {
      // 禁用
      // debugger;
      UserStore.UnenableUser(organizationId, record.id, !record.enabled).then(() => {
        Choerodon.prompt(UserStore.languages['disable.success']);
        this.loadUser();
      }).catch((error) => {
        Choerodon.prompt(UserStore.languages['disable.error']);
      });
    } else {
      UserStore.EnableUser(organizationId, record.id, !record.enabled).then(() => {
        Choerodon.prompt(UserStore.languages['enable.success']);
        this.loadUser();
      }).catch((error) => {
        Choerodon.prompt(UserStore.languages['enable.error']);
      });
    }
  };

  changeLanguage = (code) => {
    if (code === 'zh_CN') {
      return '简体中文';
    } else if (code === 'en_US') {
      return 'English';
    }
    return null;
  };

  handlePageChange(pagination, filters, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadUser(pagination, sorter.join(','), filters, params);
  }

  renderSideTitle() {
    if (this.state.edit) {
      return UserStore.languages[`${intlPrefix}.modify`];
    } else {
      return UserStore.languages[`${intlPrefix}.create`];
    }
  }

  renderSideBar() {
    const { selectedData, edit, visible, employeeId } = this.state;
    return (
      <EditUser
        id={selectedData}
        employeeId={employeeId}
        visible={visible}
        edit={edit}
        onRef={(node) => {
          this.editUser = node;
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
          this.loadUser();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
      />
    );
  }

  renderEmail(text, record) {
    if (record.userEmailDOList !== null && record.userEmailDOList.length >0) {
      return <Tooltip
        placement="right"
        arrowPointAtCenter
        overlayClassName='email-pop'
        title={<div>
          <div className={record.userEmailDOList.includes(item => item.isMain !== 1) ?  'email-pop-title email-pop-title-border' : 'email-pop-title' } style={{ paddingBottom: 10 }} >
            <span className="email-pop-title-tag">{UserStore.languages[`${intlPrefix}.mainMail`]}</span>
            {record.userEmailDOList.find(item => item.isMain === 1)?record.userEmailDOList.find(item => item.isMain === 1).emailName:''}
          </div>
          <div style={{ paddingTop: 0 }}>
            {record.userEmailDOList.map(row => {
              if (row.isMain !== 1) {
                return <div className='email-pop-item'>{row.emailName}</div>
              }
            })}
          </div>
        </div>}>
        <span className='email-cell'>{record.email}</span>
      </Tooltip>
    } /*else  {
      return <Tooltip
        placement="right"
        arrowPointAtCenter
        overlayClassName='email-pop'
        title={<div>
          <div className='email-pop-title'>
            <span className="email-pop-title-tag">{UserStore.languages[`${intlPrefix}.mainMail`]}</span>
            {record.userEmailDOList.find(item => item.isMain === 1).emailName}
          </div>
        </div>}>
        <span className='email-cell'>{record.email}</span>
      </Tooltip>
    }*/

  }

  render() {
    const { AppState, intl } = this.props;
    const { filters, pagination, visible, edit, submitting, params } = this.state;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    const enable = UserStore.getEnabled;
    const orgname = menuType.name;

    let type;
    if (AppState.getType) {
      type = AppState.getType;
    } else if (sessionStorage.type) {
      type = sessionStorage.type;
    } else {
      type = menuType.type;
    }
    let data = [];
    if (UserStore.getUsers) {
      data = UserStore.users.slice();
      data.forEach((element) => {
        if (element.employee) {
          element.employeeName = element.employee.employeeName;
        }
      });
    }
    const columns = [
      {
        title: UserStore.languages[`${intlPrefix}.loginname`],
        dataIndex: 'loginName',
        key: 'loginName',
        filters: [],
        filteredValue: filters.loginName || [],
      }, {
        title: UserStore.languages[`${intlPrefix}.realname`],
        key: 'realName',
        dataIndex: 'realName',
        filters: [],
        filteredValue: filters.realName || [],
        render: (text, record) => <span>{record.realName ? record.realName : record.loginName}</span>,
      }, {
        title: UserStore.languages.email,
        key: 'email',
        dataIndex: 'email',
        filters: [],
        filteredValue: filters.email || [],
        render: (text, record) => this.renderEmail(text, record)
      }, {
        title: UserStore.languages.publictime,
        key: 'creationDate',
        dataIndex: 'creationDate',
        filters: [],
        filteredValue: filters.creationDate || [],
      }, {
        title: UserStore.languages[`${intlPrefix}.source`],
        key: 'ldap',
        render: (text, record) => (
          record.ldap
            ? UserStore.languages[`${intlPrefix}.ldap`]
            : UserStore.languages[`${intlPrefix}.notldap`]
        ),
        filters: [
          {
            text: UserStore.languages[`${intlPrefix}.ldap`],
            value: 'true',
          }, {
            text: UserStore.languages[`${intlPrefix}.notldap`],
            value: 'false',
          },
        ],
        filteredValue: filters.ldap || [],
        hidden: true,
      },
      {
        title: UserStore.languages[`${intlPrefix}.language`],
        dataIndex: 'language',
        key: 'language',
        render: (text, record) => (
          this.changeLanguage(record.language)
        ),
        filters: [
          {
            text: '简体中文',
            value: 'zh_CN',
          }, {
            text: 'English',
            value: 'en_US',
          },
        ],
        filteredValue: filters.language || [],
        hidden: true,
      },
      {
        title: UserStore.languages[`${intlPrefix}.enabled`],
        key: 'isValid',
        dataIndex: 'isValid',
        filters: [
          {
            text: UserStore.languages.enable,
            value: 'Y',
          }, {
            text: UserStore.languages.disable,
            value: 'N',
          },
        ],
        filteredValue: filters.enabled || [],
        render: (values, record) => this.enabledState(record.isValid),
      }, {
        title: UserStore.languages[`${intlPrefix}.locked`],
        key: 'locked',
        render: (text, record) => (
          record.locked
            ? UserStore.languages[`${intlPrefix}.locked`]
            : UserStore.languages[`${intlPrefix}.normal`]
        ),
        filters: [
          {
            text: UserStore.languages[`${intlPrefix}.normal`],
            value: 'false',
          },
          {
            text: UserStore.languages[`${intlPrefix}.locked`],
            value: 'true',
          },
        ],
        filteredValue: filters.locked || [],
        hidden: true,
      }, {
        title: UserStore.languages[`${intlPrefix}.staff`],
        key: 'employeeName',
        dataIndex: 'employeeName',
        render: (text, record) => <span>{record.employee.employeeName}</span>,
      },
      {
        title: UserStore.languages.operation,
        key: 'action',
        align: 'left',
        width: '130px',
        render: (text, record) => (
          <div>
            <Permission
              service={['iam-service.organization-user.update']}
              type={type}
              organizationId={organizationId}
            >
              <Tooltip
                title={UserStore.languages.modify}
                placement="bottom"
              >
                <Button
                  size="small"
                  icon="bianji-"
                  shape="circle"
                  style={{ cursor: 'pointer', color: '#2196F3' }}
                  onClick={this.onEdit.bind(this, record.id, record.employee ? record.employee.employeeId : 0)}
                />
              </Tooltip>
            </Permission>
          </div>
        ),
      }];
    return (
      <Page
        service={[
          'iam-service.organization-user.create',
          'iam-service.organization-user.list',
          'iam-service.organization-user.query',
          'iam-service.organization-user.update',
          'iam-service.organization-user.delete',
          'iam-service.organization-user.disableUser',
          'iam-service.organization-user.enableUser',
          'iam-service.organization-user.unlock',
          'iam-service.organization-user.check',
        ]}
      >
        <Header title={UserStore.languages[`${intlPrefix}.header.title`]}>
          <Permission
            service={['iam-service.organization-user.create']}
            type={type}
            organizationId={organizationId}
          >
            <Button
              onClick={this.openNewPage}
              style={{ color: '#04173F' }}

            >
              <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
              {UserStore.languages[`${intlPrefix}.create`]}
            </Button>
          </Permission>
        </Header>
        <Content className='user-page'>
          <Table
            size="middle"
            pagination={pagination}
            columns={columns}
            dataSource={data}
            rowKey="id"
            onChange={this.handlePageChange.bind(this)}
            loading={UserStore.isLoading}
            filters={params}
          />
          <Sidebar
            title={this.renderSideTitle()}
            visible={visible}
            okText={edit ? UserStore.languages.save : UserStore.languages.create}
            cancelText={UserStore.languages.cancel}
            onOk={e => this.editUser.handleSubmit(e)}
            onCancel={() => {
              this.setState({
                visible: false,
                selectedData: '',
                employeeId: '',
              });
            }}
            destroyOnClose={true}
            confirmLoading={submitting}
          >
            {
              this.renderSideBar()
            }
          </Sidebar>
        </Content>
      </Page>
    );
  }
}

export default withRouter(injectIntl(User));
