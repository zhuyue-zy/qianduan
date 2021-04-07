/*eslint-disable*/
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Form, Modal, Table, Tooltip,Icon } from 'yqcloud-ui';
import { Content, Header, Page, Permission } from 'yqcloud-front-boot';
import { withRouter } from 'react-router-dom';
import { injectIntl, FormattedMessage } from 'react-intl';
import RootUserStore from '../../../stores/globalStores/rootUser/RootUserStore';
import MemberLabel from '../../../components/memberLabel/MemberLabel';
import './rootUser.scss'
import RoleStore from "../../../stores/globalStores/role/RoleStore";

const { Sidebar } = Modal;
const intlPrefix = 'global.rootuser';

@inject('AppState')
@observer
class RootUserSetting extends Component {
  state = this.getInitState();
  getInitState() {
    return {
      visible: false,
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      sort: {
        columnKey: 'id',
        order: 'descend',
      },
      filters: [],
      params: [],
      onlyRootUser: false,
      submitting: false,
    };
  }
  componentWillMount() {
    this.reload();
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const id = 0;
    RootUserStore.queryLanguage(id, AppState.currentLanguage);

  }

  isEmptyFilters = ({ loginName, realName, enabled, locked}) => {
    if ((loginName && loginName.length) ||
      (realName && realName.length) ||
      (enabled && enabled.length) ||
      (locked && locked.length)
    ) {
      return false;
    }
    return true;
  }
  reload = (paginationIn, filtersIn, sortIn, paramsIn) => {
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
    this.setState({
      loading: true,
    });
    RootUserStore.loadRootUserData(pagination, filters, sort, params).then(data => {
      if (this.isEmptyFilters(filters) && !params.length) {
        this.setState({
          onlyRootUser: data.totalElements <= 1,
        });
      }
      RootUserStore.setRootUserData(data.content);
      this.setState({
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
        },
        loading: false,
        sort,
        filters,
        params,
      });
    });
  }
  tableChange = (pagination, filters, sort, params) => {
    this.reload(pagination, filters, sort, params);
  }

  openSidebar = () => {
    const { resetFields } = this.props.form;
    resetFields();
    this.setState({
      visible: true,
    });
  }
  closeSidebar = () => {
    this.setState({
      submitting: false,
      visible: false,
    });
  }

  handleDelete = (record) => {
    const { intl } = this.props;
    Modal.confirm({
      title: RootUserStore[`${intlPrefix}.remove.title`],
      content: RootUserStore[`${intlPrefix}.remove.content`],
      onOk: () => {
        return RootUserStore.deleteRootUser(record.id).then(({ failed, message }) => {
          if (failed) {
            Choerodon.prompt(message);
          } else {
            Choerodon.prompt(RootUserStore.languages.remove.success);
            this.reload();
          }
        });
      }
    });
  }

  handleOk = (e) => {
    const { intl } = this.props;
    const { validateFields } = this.props.form;
    e.preventDefault();
    validateFields((err, values) => {
      if (!err) {
        const memberNames = values.member;
        this.setState({
          submitting: true,
        });
        RootUserStore.searchMemberIds(memberNames).then((data) => {
          if (data) {
            const memberIds = data.map((info) => {
              return info.id;
            });
            RootUserStore.addRootUser(memberIds).then(({ failed, message }) => {
              if (failed) {
                Choerodon.prompt(message);
              } else {
                Choerodon.prompt(RootUserStore.languages.add.success);
                this.closeSidebar();
                this.reload();
              }
            });
          }
        });
      }
    });
  };

  renderTable() {
    const { AppState, intl } = this.props;
    const { type } = AppState.currentMenuType;
    const { filters, sort: { columnKey, order }, } = this.state;
    const rootUserData = RootUserStore.getRootUserData.slice();
    const columns = [
      {
        title: RootUserStore.languages[`${intlPrefix}.loginname`],
        key: 'loginName',
        dataIndex: 'loginName',
        filters: [],
        filteredValue: filters.loginName || [],
        sorter: true,
        sortOrder: columnKey === 'loginName' && order,
      },
      {
        title: RootUserStore.languages[`${intlPrefix}.realname`],
        key: 'realName',
        dataIndex: 'realName',
        filters: [],
        filteredValue: filters.realName || [],
      },
      {
        title: RootUserStore.languages[`${intlPrefix}.status.enabled`],
        key: 'enabled',
        dataIndex: 'enabled',
        render: enabled => intl.formatMessage({id: enabled ? 'enable' : 'disable'}),
        filters: [{
          text: RootUserStore.languages.enable,
          value: 'true',
        }, {
          text: RootUserStore.languages.disable,
          value: 'false',
        }],
        filteredValue: filters.enabled || [],
      },
      {
        title: RootUserStore.languages[`${intlPrefix}.status.locked`],
        key: 'locked',
        dataIndex: 'locked',
        filters: [{
          text: RootUserStore.languages[`${intlPrefix}.normal`],
          value: 'false',
        }, {
          text: RootUserStore.languages[`${intlPrefix}.locked`],
          value: 'true',
        }],
        filteredValue: filters.locked || [],
        render: lock =>  lock ? RootUserStore.languages[`${intlPrefix}.locked`] : RootUserStore.languages[`${intlPrefix}.normal`],
      },
      {
        title: RootUserStore.languages.operation,
        width: 100,
        align: 'left',
        render: (text, record) => {
          const { onlyRootUser } = this.state;
          return (
            <div>
              <Permission
                service={['iam-service.user.deleteDefaultUser']}
                type={type}
              >
                <Tooltip
                  title={onlyRootUser ? RootUserStore.languages[`${intlPrefix}.remove.disable.tooltip`] : RootUserStore.languages.delete}
                  placement={onlyRootUser ? 'bottomRight' : 'bottom'}
                  overlayStyle={{ maxWidth: '300px'}}
                >
                  <Button
                    size="small"
                    disabled={onlyRootUser}
                    onClick={this.handleDelete.bind(this, record)}
                    shape="circle"
                    icon="shanchu-icon"
                    style={{ cursor: 'pointer' }}
                  />
                </Tooltip>
              </Permission>
            </div>
          );
        },
      },
    ];
    return (
      <Table
        loading={this.state.loading}
        pagination={this.state.pagination}
        columns={columns}
        indentSize={0}
        dataSource={rootUserData}
        filters={this.state.params}
        rowKey="id"
        onChange={this.tableChange}
      />
    );
  }
  render() {
    const { AppState, form } = this.props;
    const { type } = AppState.currentMenuType;
    return (
      <Page
        className="root-user-setting"
        service={[
          'iam-service.user.pagingQueryAdminUsers',
          'iam-service.user.addDefaultUsers',
          'iam-service.user.deleteDefaultUser',
        ]}
      >
        <Header title={RootUserStore.languages[`${intlPrefix}.header.title`]}>
          <Permission
            service={['iam-service.user.addDefaultUsers']}
            type={type}
          >
            <Button
              onClick={this.openSidebar}
              style={{ color: '#04173F' }}
            >
              <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
              {RootUserStore.languages.create}
            </Button>
          </Permission>
        </Header>
        <Content>
          {this.renderTable()}
          <Sidebar
            title={RootUserStore.languages.add}
            visible={this.state.visible}
            confirmLoading={this.state.submitting}

            footer={[
              <div className="role-action">
                <Button key="submit"
                        onClick={this.handleOk}
                        //style={{background:'#2196F3'}}
                        type="primary"
                >
                  {<FormattedMessage id="add"/>}
                  </Button>
                <Button key="back" onClick={this.closeSidebar}>
                  {RootUserStore.languages.cancel}</Button>
              </div>
            ]}

          >
            <Content>
              <Form layout="vertical">
                <MemberLabel label={RootUserStore.languages[`${intlPrefix}.user`]} style={{ marginTop: '-15px'}} form={form} />
              </Form>
            </Content>
          </Sidebar>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(RootUserSetting)));
