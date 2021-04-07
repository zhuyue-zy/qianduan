/*eslint-disable*/
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Form, Icon, Modal, Progress, Select, Table, Tooltip } from 'yqcloud-ui';
import { withRouter } from 'react-router-dom';
import { axios, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';
import querystring from 'query-string';
import MemberLabel, { validateMember } from '../../../components/memberLabel/MemberLabel';
import ApplicationStore from '../../../stores/globalStores/application';
import './Application.scss';

const { Sidebar } = Modal;
const FormItem = Form.Item;
const Option = Select.Option;
const pageSize = 10;
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

@inject('AppState')
@observer
class Application extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitState();
    this.code = 'global.application'
  }

  getInitState() {
    return {
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      sort: {
        columnKey: 'id',
        order: 'descend',
      },
      selectType: 'create', // 编辑类型
      sidebar: false, // 是否显示右侧弹出层
      tenantApplicationDatas: [], // 租户-应用关系数据
      nowTenantId: '', // 当前选择的租户id
      nowTenantName: '', // 当前选择的租户名称
      nowApplicationId: [], // 当前选择租户的所有应用id
      tenantDatas: [], // 租户数据
      applicationDatas: [], // 应用数据
      submitting: false, // 表单是否提交中
      selectedRowkeys: [] // 当前选择行key
    };
  }

  /**
   * 初始化数据
   */
  init() {
    this.loadTenantApplicationData();
    this.loadApplicationData();
    this.loadTenantData();
  }

  // 第一次渲染前获得数据
  componentWillMount() {
    this.init();
  }

  /**
   * 刷新页面
   */
  reload = () => {
    this.setState(this.getInitState(), () => {
      this.init();
    });
  };

  /**
   * 加载租户-应用关系数据
   * @param callback 租户应用数据
   */
  loadTenantApplicationData = (paginationIn, sortIn, paramsIn) => {
    const {
      pagination: paginationState,
      sort: sortState,
      filters: filtersState,
      params: paramsState,
    } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const params = paramsIn || paramsState;
    ApplicationStore.loadTenantApplicationData(pagination, sort, params).then((res)=>{
      this.setState({
        sort,
        pagination: {
          current: res.number + 1,
          pageSize: res.size,
          total: res.totalElements,
        },
      });
      const tenantApplicationDatas = res.content.reduce((options, {id, organizationId, organizationName, menuId, menuName}) => {
        if (options.length === 0) {
          options.push({
            key: id,
            tenantId: organizationId,
            tenant: organizationName,
            applicationId: [menuId],
            application: [menuName],
          })
        } else {
          options.map(({optionsId}, index) => {
            if (optionsId === id) {
              options[index].applicationId.push(menuId);
              options[index].application.push(menuName);
            } else {
              options.push({
                key: id,
                tenantId: organizationId,
                tenant: organizationName,
                applicationId: [menuId],
                application: [menuName],
              })
            }
          })
        }
        return options;
      }, []);
      this.setState({ tenantApplicationDatas });
    });
  }

  /**
   * 加载应用数据
   * @param callback 应用数据
   */
  loadApplicationData = () => {
    ApplicationStore.loadApplicationData().then((res)=>{
      const applicationDatas = res.map((value) => {
        return {
          id: value.id,
          name: value.name
        }
      });
      this.setState({ applicationDatas })
    });
  }

  /**
   * 加载租户数据
   * @param callback 租户数据
   */
  loadTenantData = () => {
    ApplicationStore.loadTenantData().then((res)=>{
      const tenantDatas = res.map((value) => {
        return {
          id: value.id,
          name: value.name
        }
      });
      this.setState({ tenantDatas })
    });
  }

  formatMessage = (id, values = {}) => {
    const { intl } = this.props;
    return intl.formatMessage({
      id,
    },values);
  }

  closeSidebar = () => {
    this.setState({
      sidebar: false,
    });
  };

  openSidebar = () => {
    this.props.form.resetFields(); // 清空记录
    this.setState({
      sidebar: true,
    });
  };

  /**
   * 判断右侧弹出层标题
   * @param callback 标题
   */
  getSidebarTitle() {
    const { selectType } = this.state;
    if (selectType === 'create') {
      return <FormattedMessage id={`${this.code}.add`}/>;
    } else if (selectType === 'edit') {
      return <FormattedMessage id={`${this.code}.modify`}/>;
    }
  }

  /**
   * 判断右侧弹出层顶部文字
   * @param callback 标题
   */
  getHeader() {
    const { selectType, nowTenantName } = this.state;
    const modify = selectType === 'edit';
    return {
      code: modify ? 'global.application.modify': 'global.application.add',
      values: { name: modify ? nowTenantName : 'YQCloud' },
    };
  }

  createTenantApplication = () => {
    this.setState({
      selectType: 'create',
      nowTenantId: '',
      nowTenantName: '',
      nowApplicationId: [],
    }, () => {
      this.openSidebar();
    });
  };

  /**
   * 保存当前租户应用数据
   * @param record 所选行数据
   */
  editTenantApplication = (record) => {
    this.setState({
      selectType: 'edit',
      nowTenantId: record.tenantId,
      nowTenantName: record.tenant,
      nowApplicationId: record.applicationId,
    }, () => {
      this.openSidebar();
    });
  };

  /**
   * 删除前租户应用
   * @param id 所选关系id
   */
  deleteTenantApplication = (id) => {
    const { selectedRowkeys } = this.state;
    let body;
    if (id) {
      body = [{id: id}]
    } else {
      body = selectedRowkeys.map((id) => {
        return {id: id}
      })
    }
    ApplicationStore.deleteTenantApplication(body).then(({ failed, message }) => {
      if (failed) {
        Choerodon.prompt(message);
      } else {
        Choerodon.prompt(this.formatMessage('delete.success'));
        this.init();
      }
    })
    .catch(error => {
      Choerodon.handleResponseError(error);
    });
  };

  /**
   * 加载租户应用表
   */
  renderTenantApplicationTable() {
    const { tenantApplicationDatas } = this.state;
    const columns = [
      {
        title: <FormattedMessage id="organization"/>,
        dataIndex: 'tenant',
        key: 'tenant',
      },
      {
        title: <FormattedMessage id="application"/>,
        dataIndex: 'application',
        key: 'application',
        className: 'memberrole-roles',
        render: (text, record) => {
          return text.map((value) => {
            const wrapclass = ['role-table'];
            let item = <span>{value}</span>;
            return (
              <div key={value} className={wrapclass.join(' ')}>
                {item}
              </div>
            );
          });
        },
      },
      {
        title: '',
        key: 'operation',
        dataIndex: 'operation',
        width: 100,
        align:'right',
        render: (text, record) => {
          return (
            <div>
              <Permission
                service={[
                  'iam-service.organization-menu.update',
                ]}
              >
                <Tooltip
                  title={<FormattedMessage id="modify"/>}
                  placement="bottom"
                >
                  <Button onClick={() => this.editTenantApplication(record)} size="small" shape="circle" icon="mode_edit" />
                </Tooltip>
              </Permission>
              <Permission
                service={[
                  'iam-service.organization-menu.delete',
                ]}
              >
                <Tooltip
                  title={<FormattedMessage id="remove"/>}
                  placement="bottom"
                >
                  <Button size="small" shape="circle" onClick={() => this.deleteTenantApplication(record.key)} icon="delete" />
                </Tooltip>
              </Permission>
            </div>
          );
        },
      },
    ];
    const rowSelection = {
      onChange: (selectedRowkeys, selectedRecords) => {
        this.setState({
          selectedRowkeys
        })
      },
    };
    return (
      <Table
        key="tenant-application"
        className="member-role-table"
        rowSelection={rowSelection}
        columns={columns}
        dataSource={tenantApplicationDatas}
        onChange={this.handlePageChange}
        filterBarPlaceholder={this.formatMessage("filtertable")}
      />
    );
  }

  handlePageChange = (pagination, filters, sort, params) => {
    this.loadTenantApplicationData(pagination, sort, params);
  };

  /**
   * 加载右侧弹出层内容
   */
  getSidebarContent() {
    const { selectType, nowTenantId, nowApplicationId, applicationDatas } = this.state;
    const { getFieldDecorator } = this.props.form;
    const header = this.getHeader();
    return (
      <Content
        className="sidebar-content"
        {...header}
      >
        <Form layout="vertical">
          <FormItem
            {...FormItemNumLayout}
          >
            {getFieldDecorator('tenant', {
              rules: [{
                required: true,
                message: this.formatMessage(`${this.code}.tenant.require.msg`),
              }],
              initialValue: nowTenantId,
            })(
              <Select
                style={{ width: 300 }}
                label={<FormattedMessage id={`${this.code}.tenant.label`}/>}
                optionFilterProp="children"
                filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                filter
                disabled={selectType !== 'create'}
              >
                {this.getTenantOption()}
              </Select>,
            )}
          </FormItem>
          <FormItem
            {...FormItemNumLayout}
          >
            {getFieldDecorator('application', {
              rules: [{
                required: true,
                message: this.formatMessage(`${this.code}.application.require.msg`),
              }],
              initialValue: nowApplicationId,
            })(
              <Select
                mode="multiple"
                style={{ width: 300 }}
                label={<FormattedMessage id={`${this.code}.application.label`}/>}
                optionFilterProp="children"
                filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                filter
                allowClear
              >
                {this.getApplicationOption()}
              </Select>,
            )}
          </FormItem>
        </Form>
      </Content>);
  }

  /**
   * 获取应用选项
   */
  getApplicationOption = () => {
    const { applicationDatas } = this.state;
    return applicationDatas.map((value) => {
      return <Option value={value.id} key={value.id}>{value.name}</Option>
    })
  }

  /**
   * 获取租户选项
   */
  getTenantOption = () => {
    const { tenantDatas } = this.state;
    return tenantDatas.map((value) => {
      return <Option value={value.id} key={value.id}>{value.name}</Option>
    })
  }

  // ok 按钮保存
  handleOk = (e) => {
    const { selectType } = this.state;
    e.preventDefault();
    this.setState({ submitting: true });
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const tenantId = values.tenant;
        const applicationId = values.application;
        const body = applicationId.reduce((options, id) => {
          options.push({
            organizationId: tenantId,
            menuId: id
          })
          return options;
        }, [])
        if (selectType === 'create') {
          ApplicationStore.createTenantApplication(body).then(({ failed, message }) => {
            this.setState({ submitting: false });
            if (failed) {
              Choerodon.prompt(message);
            } else {
              Choerodon.prompt(this.formatMessage('add.success'));
              this.closeSidebar();
              this.init();
            }
          })
          .catch(error => {
            this.setState({ submitting: false });
            Choerodon.handleResponseError(error);
          });
        } else if (selectType === 'edit') {
          if (!this.isModify(applicationId)) {
            this.setState({ submitting: false });
            Choerodon.prompt(this.formatMessage('modify.success'));
            this.closeSidebar();
            return;
          }
          ApplicationStore.editTenantApplication(body).then(({ failed, message }) => {
            this.setState({ submitting: false });
            if (failed) {
              Choerodon.prompt(message);
            } else {
              Choerodon.prompt(this.formatMessage('modify.success'));
              this.closeSidebar();
              this.init();
            }
          })
          .catch(error => {
            this.setState({ submitting: false });
            Choerodon.handleResponseError(error);
          });
        }
      }
    });
  };

  /**
   * 判断数据是否改变
   * @param applicationId 所选应用id
   */
  isModify = (applicationId) => {
    const { nowApplicationId } = this.state;
    return applicationId.filter(id => nowApplicationId.indexOf(id) === -1).length !== 0 || nowApplicationId.filter(id =>  applicationId.indexOf(id) === -1).length
  }

  render() {
    const { selectType, sidebar, submitting } = this.state;
    const okText = selectType === 'create' ? this.formatMessage('add') : this.formatMessage('save');
    return (
      <Page
        service={[
          'iam-service.organization-menu.create',
          'iam-service.organization-menu.delete',
          'iam-service.organization-menu.select',
          'iam-service.organization-menu.update',
          'iam-service.organization.allList',
        ]}
      >
        <Header title={<FormattedMessage id={`${this.code}.header.title`}/>}>
          <Permission
            service={[
              'iam-service.organization-menu.create',
            ]}
          >
            <Button
              onClick={this.createTenantApplication}
              icon="playlist_add"
            >
              <FormattedMessage id="add"/>
            </Button>
          </Permission>
          <Permission
            service={[
              'iam-service.organization-menu.delete',
            ]}
          >
            <Button
              onClick={() => this.deleteTenantApplication()}
              icon="delete"
            >
              <FormattedMessage id="remove"/>
            </Button>
          </Permission>
          <Button
            onClick={this.reload}
            icon="refresh"
          >
            <FormattedMessage id="refresh"/>
          </Button>
        </Header>
        <Content
          code={this.code}
          values={{ name: 'YQCloud' }}
        >
          {this.renderTenantApplicationTable()}
          <Sidebar
            title={this.getSidebarTitle()}
            visible={sidebar}
            okText={okText}
            cancelText={<FormattedMessage id="cancel" />}
            onOk={this.handleOk}
            onCancel={this.closeSidebar}
            confirmLoading={submitting}
          >
            {this.getSidebarContent()}
          </Sidebar>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(Application)));
