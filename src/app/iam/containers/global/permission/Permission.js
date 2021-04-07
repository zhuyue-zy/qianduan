/*eslint-disable*/
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Form, Icon, Modal, Input, Select, Table, Tooltip } from 'yqcloud-ui';
import { withRouter } from 'react-router-dom';
import { axios, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';
import querystring from 'query-string';
import MemberLabel, { validateMember } from '../../../components/memberLabel/MemberLabel';
import PermissionStore from '../../../stores/globalStores/permission';
import './permission.scss'

const { Sidebar } = Modal;
const FormItem = Form.Item;
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
const intlPrefix =  'global.permission'

@inject('AppState')
@observer
class PermissionPage extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitState();
  }

  getInitState() {
    return {
      sidebar: false, // 是否显示右侧弹出层
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
      params: [],
      permissionDatas: [], // 权限数据
      permissionId: '', // 权限id
      permissionCode: '', // 权限编码
      permissionName: '', // 权限名称
      submitting: false, // 表单是否提交中
    };
  }

  /**
   * 初始化数据
   */
  init() {
    this.loadPermissionData();
  }

  // 第一次渲染前获得数据
  componentWillMount() {
    this.init();
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const  id  = 0;
    PermissionStore.queryLanguage(id, AppState.currentLanguage);
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
  loadPermissionData = (paginationIn, sortIn, paramsIn) => {
    const {
      pagination: paginationState,
      sort: sortState,
      filters: filtersState,
      params: paramsState,
    } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const params = paramsIn || paramsState;
    PermissionStore.loadPermissionData(pagination, sort, params).then((res)=>{
      this.setState({
        sort,
        pagination: {
          current: res.number + 1,
          pageSize: res.size,
          total: res.totalElements,
          pageSizeOptions: [25, 50, 100, 200],
        },
      });
      const permissionData = res.content.reduce((options, {id, code, level, description}) => {
        options.push({
          key: id,
          code,
          level,
          description,
        })
        return options;
      }, []);
      PermissionStore.setPermissionData(permissionData);
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
   * 保存当前租户应用数据
   * @param record 所选行数据
   */
  editPermission = (record) => {
    this.setState({
      permissionId: record.key, // 权限id
      permissionCode: record.code, // 权限编码
      permissionName: record.description, // 权限名称
    }, () => {
      this.openSidebar();
    });
  };

  /**
   * 加载租户应用表
   */
  renderPermissionTable() {
    const { pagination, sort: { columnKey, order } } = this.state
    const columns = [
      {
        title: PermissionStore.languages.code,
        dataIndex: 'code',
        key: 'code',
        width: '48%',
        sorter: true,
        sortOrder: columnKey === 'code' && order,
      },
      {
        title: PermissionStore.languages.level,
        dataIndex: 'level',
        key: 'level',
        width: 100,
        filters: [{
          text: PermissionStore.languages.site,
          value: 'site',
        }, {
          text: PermissionStore.languages.Tenant,
          value: 'organization',
        }, {
          text: PermissionStore.languages.project,
          value: 'project',
        }],
        sorter: true,
        sortOrder: columnKey === 'level' && order,
        onFilter: (value, record) => record.level.indexOf(value) === 0,
        render: (text) => {
          if (text==='site') {
            return PermissionStore.languages.site
          } else if(text==='organization') {
            return PermissionStore.languages.Tenant
          } else if(text==='project') {
            return PermissionStore.languages.project
          }
        }
      },
      {
        title: PermissionStore.languages.name,
        dataIndex: 'description',
        key: 'description',
        sorter: true,
        sortOrder: columnKey === 'description' && order,
      },
      {
        title: PermissionStore.languages.operation,
        key: 'operation',
        dataIndex: 'operation',
        width: 100,
        align:'left',
        render: (text, record) => {
          return (
            <div>
              <Permission
                service={[
                  'iam-service.permission.updateDescription',
                ]}
              >
                <Tooltip
                  title={PermissionStore.languages.modify}
                  placement="bottom"
                >
                  <Button onClick={() => this.editPermission(record)}
                          size="small"
                          shape="circle"
                          icon="bianji-"
                          style={{ cursor: 'pointer', color: '#2196F3' }}
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
        key="tenant-application"
        columns={columns}
        dataSource={PermissionStore.getPermissionData}
        pagination={pagination}
        onChange={this.handlePageChange}
        //filterBarPlaceholder={this.formatMessage("filtertable")}
      />
    );
  }

  handlePageChange = (pagination, filters, sort, params) => {
    // console.log(pagination, filters, sort, params)
    this.loadPermissionData(pagination, sort, params);
  };

  /**
   * 加载右侧弹出层内容
   */
  getSidebarContent() {
    const { permissionCode, permissionName } = this.state;
    const { getFieldDecorator } = this.props.form;
    return (
      <Content
        className="sidebar-content"
        values={{ name: permissionCode }}
      >
        <Form layout="vertical">
          <FormItem
            {...FormItemNumLayout}
          >
            {getFieldDecorator('permissionCode', {
              rules: [{
                required: true,
                message: PermissionStore.languages[`${intlPrefix}.code.require.msg`],
              }],
              initialValue: permissionCode,
            })(
              <Input
                autoComplete="off"
                label={PermissionStore.languages[`${intlPrefix}.code.label`]}
                size="default"
                style={{
                  width: 512,
                }}
                disabled={true}
              />,
            )}
          </FormItem>
          <FormItem
            {...FormItemNumLayout}
          >
            {getFieldDecorator('permissionName', {
              rules: [{
                required: true,
                message: PermissionStore.languages[`${intlPrefix}.name.require.msg`],
              }],
              initialValue: permissionName,
            })(
              <Input
                autoComplete="off"
                label={PermissionStore.languages[`${intlPrefix}.name.label`]}
                size="default"
                style={{
                  width: 512,
                }}
              />,
            )}
          </FormItem>
        </Form>
      </Content>);
  }

  // ok 按钮保存
  handleOk = (e) => {
    const { permissionId } = this.state;
    e.preventDefault();
    this.setState({ submitting: true });
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const permissionName = values.permissionName;
        const body = {
          id: permissionId,
          description: permissionName
        }
        PermissionStore.editPermissionData(body).then(({ failed, message }) => {
          this.setState({ submitting: false });
          if (failed) {
            Choerodon.prompt(message);
          } else {
            Choerodon.prompt(PermissionStore.languages.modify.success);
            this.closeSidebar();
            this.init();
          }
        })
        .catch(error => {
          this.setState({ submitting: false });
          Choerodon.handleResponseError(error);
        });
      }
    });
  };

  render() {
    const { selectType, sidebar, submitting } = this.state;
    const okText = selectType === 'create' ? PermissionStore.languages.add  : PermissionStore.languages.save;
    return (
      <Page
        service={[
          'iam-service.permission.queryAll',
          'iam-service.permission.updateDescription',
        ]}
      >
        <Header title={PermissionStore.languages[`${intlPrefix}.header.title`]} />
        <Content>
          {this.renderPermissionTable()}
          <Sidebar
            title={PermissionStore.languages[`${intlPrefix}.modify`]}
            visible={sidebar}
            confirmLoading={submitting}

            footer={[
              <div className="role-action">
                <Button key="submit"
                        onClick={this.handleOk}
                        type="primary"
                >
                  {okText}
                  </Button>
                <Button key="back" onClick={this.closeSidebar}>
                  {PermissionStore.languages.cancel}
                  </Button>
              </div>
            ]}
          >
            {this.getSidebarContent()}
          </Sidebar>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(PermissionPage)));
