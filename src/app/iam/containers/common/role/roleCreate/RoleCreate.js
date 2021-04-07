import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import { Observable } from 'rxjs';
import _ from 'lodash';
import { Button, Col, Form, Input, Modal, Row, Select, Table, Tooltip } from 'yqcloud-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Content, Header, Page, axios } from 'yqcloud-front-boot';
import RoleStore from '../../../../stores/globalStores/role/RoleStore';
import './RoleCreate.scss';

const { Option } = Select;
const { confirm, Sidebar } = Modal;
const FormItem = Form.Item;
const intlPrefix = 'global.role';

@inject('AppState')
@observer
class CreateRole extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.organizationId || '';
    this.id = this.props.AppState.currentMenuType.id || '';
    this.organizationName = this.props.AppState.currentMenuType.name || '';
    this.type = this.props.match.params.type || '';
    this.state = {
      visible: false,
      selectedLevel: 'site',
      code: '',
      description: '',
      page: 1,
      pageSize: 10,
      alreadyPage: 1,
      errorName: '',
      errorDescription: '',
      submitting: false,
      selectedRowKeys: [],
      selectedSideBar: [],
      currentPermission: [],
      firstLoad: true,
      permissionParams: [],
    };
  }

  componentWillMount() {
    RoleStore.setChosenLevel(this.type);
    this.setCanPermissionCanSee();
    const permissions = RoleStore.getSelectedRolesPermission || [];
    this.setState({
      currentPermission: permissions.map(item => item.id),
    });
    RoleStore.getAllRoleLabel();
  }

  componentWillUnmount() {
    RoleStore.setCanChosePermission('site', []);
    RoleStore.setCanChosePermission('organization', []);
    RoleStore.setCanChosePermission('project', []);
  }
  /*
   * @method
   * @param {type} 当前层级
   * @returns {url} 返回url
   * @desc 根据当前层级获取返回url
  */
  getUrl(type) {
    if (type === 'site') {
      return '/iam/role/site';
    } else if (type === 'organization') {
      return `/iam/role/organization?type=organization&id=${this.id}&name=${this.organizationName}&organizationId=${this.organizationId}`;
    }
  }

  // 获取权限管理数据
  setCanPermissionCanSee() {
    const levels = ['organization', 'project', 'site'];
    for (let c = 0; c < levels.length; c += 1) {
      Observable.fromPromise(axios.get(`iam/v1/permissions?level=${levels[c]}`))
        .subscribe((data) => {
          RoleStore.handleCanChosePermission(levels[c], data);
        });
    }
  }

  checkCode = (rule, value, callback) => {
    const validValue = `role/${RoleStore.getChosenLevel}/custom/${value}`;
    const params = { code: validValue };
    axios.post('/iam/v1/roles/check', JSON.stringify(params)).then((mes) => {
      if (mes.failed) {
        const { intl } = this.props;
        callback(intl.formatMessage({ id: `${intlPrefix}.code.exist.msg` }));
      } else {
        callback();
      }
    });
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

  linkToChange = (url) => {
    const { history } = this.props;
    history.push(url);
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

  handleOk = () => {
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

  handleCreate = (e) => {
    e.preventDefault();
    this.setState({
      firstLoad: false,
    });
    this.props.form.validateFieldsAndScroll((err) => {
      if (!err) {
        const { intl } = this.props;
        const { currentPermission } = this.state;
        const rolePermissionss = [];
        currentPermission.forEach(id => rolePermissionss.push({ id }));
        if (rolePermissionss.length > 0) {
          const labelValues = this.props.form.getFieldValue('label');
          const labelIds = labelValues && labelValues.map(labelId => ({ id: labelId }));
          const role = {
            name: this.props.form.getFieldValue('name'),
            modified: this.props.form.getFieldValue('modified'),
            enabled: this.props.form.getFieldValue('enabled'),
            code: `role/${RoleStore.getChosenLevel}/custom/${this.props.form.getFieldValue('code').trim()}`,
            level: RoleStore.getChosenLevel,
            description: this.props.form.getFieldValue('roleDescription'),
            permissions: rolePermissionss,
            labels: labelIds,
            organization_id: this.organizationId,
          };
          this.setState({ submitting: true });
          RoleStore.createRole(role, this.organizationId)
            .then((data) => {
              this.setState({ submitting: false });
              if (data) {
                Choerodon.prompt(intl.formatMessage({ id: 'create.success' }));
                this.linkToChange(this.getUrl(this.type));
              }
            })
            .catch((errors) => {
              this.setState({ submitting: false });
              if (errors.response.data.message === 'error.role.roleNameExist') {
                Choerodon.prompt(intl.formatMessage({ id: `${intlPrefix}.name.exist.msg` }));
              } else {
                Choerodon.prompt(intl.formatMessage({ id: 'create.error' }));
              }
            });
        }
      }
    });
  };

  handleReset = () => {
    const { intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        this.linkToChange(this.getUrl(this.type));
      } else {
        Modal.confirm({
          title: intl.formatMessage({ id: `${intlPrefix}.cancel.title` }),
          content: intl.formatMessage({ id: `${intlPrefix}.cancel.content` }),
          onOk: () => (
            this.linkToChange(this.getUrl(this.type))
          ),
        });
      }
    });
  };

  handlePageChange = (pagination, filters, sorter, params) => {
    const level = RoleStore.getChosenLevel;
    const newFilters = {
      params: (params && params.join(',')) || '',
    };
    this.setState({
      permissionParams: params,
    });
    RoleStore.getWholePermission(this.type, pagination, newFilters).subscribe((data) => {
      RoleStore.handleCanChosePermission(level, data);
    });
  };

  render() {
    const { currentPermission, firstLoad, submitting } = this.state;
    const { intl } = this.props;
    const { getFieldDecorator } = this.props.form;
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
    const origin = RoleStore.getCanChosePermission;
    const data = RoleStore.getChosenLevel !== '' ? origin[RoleStore.getChosenLevel].slice() : [];
    const pagination = RoleStore.getPermissionPage[RoleStore.getChosenLevel];
    const selectedPermission = RoleStore.getSelectedRolesPermission || [];
    const changePermission = RoleStore.getInitSelectedPermission || [];
    return (
      <Page className="choerodon-roleCreate">
        <Header
          title={<FormattedMessage id={`${intlPrefix}.create`} />}
          backPath={this.getUrl(this.type)}
        />
        <Content
          code={`${intlPrefix}.create`}
        >
          <div>
            <Form layout="vertical">
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('code', {
                  rules: [{
                    required: true,
                    whitespace: true,
                    message: intl.formatMessage({ id: `${intlPrefix}.code.require.msg` }),
                  }, {
                    pattern: /^[a-z]([-a-z0-9]*[a-z0-9])?$/,
                    message: intl.formatMessage({ id: `${intlPrefix}.code.pattern.msg` }),
                  }, {
                    validator: this.checkCode,
                  }],
                  validateFirst: true,
                  initialValue: this.state.roleName,
                })(
                  <Input
                    autoComplete="off"
                    label={<FormattedMessage id={`${intlPrefix}.code`} />}
                    size="default"
                    style={{
                      width: '512px',
                    }}
                    maxLength={64}
                  />,
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('name', {
                  rules: [{
                    required: true,
                    whitespace: true,
                    message: intl.formatMessage({ id: `${intlPrefix}.name.require.msg` }),
                  }],
                  initialValue: this.state.name,
                })(
                  <Input
                    autoComplete="off"
                    label={<FormattedMessage id={`${intlPrefix}.name`} />}
                    type="textarea"
                    rows={1}
                    style={{
                      width: '512px',
                    }}
                    maxLength={32}
                  />,
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('roleDescription', {})(
                  <Input
                    autoComplete="off"
                    label={<FormattedMessage id={`${intlPrefix}.role.description`} />}
                    type="textarea"
                    rows={2}
                    style={{
                      width: '512px',
                    }}
                    maxLength={120}
                  />,
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
              >
                <Tooltip
                  placement="top"
                  title={<FormattedMessage id={RoleStore.getChosenLevel ? `${intlPrefix}.add.permission` : `${intlPrefix}.level.nothing.msg`} />}
                >
                  <Button
                    funcType="raised"
                    onClick={this.showModal.bind(this)}
                    disabled={RoleStore.getChosenLevel === ''}
                    className="addPermission"
                    icon="add"
                  >
                    <FormattedMessage id={`${intlPrefix}.add.permission`} />
                  </Button>
                </Tooltip>
              </FormItem>
              <FormItem>
                {currentPermission.length > 0 ? (
                  <p className="alreadyDes">
                    <FormattedMessage id={`${intlPrefix}.permission.count.msg`} values={{ count: currentPermission.length }} />
                  </p>
                ) : (
                  <p className="alreadyDes">
                    <FormattedMessage id={`${intlPrefix}.permission.nothing.msg`} />
                  </p>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
              >
                <Table
                  style={{
                    width: '512px',
                  }}
                  columns={[{
                    title: <FormattedMessage id={`${intlPrefix}.permission.code`} />,
                    dataIndex: 'code',
                    key: 'code',
                  }, {
                    title: <FormattedMessage id={`${intlPrefix}.permission.desc`} />,
                    dataIndex: 'description',
                    key: 'description',
                  }]}
                  dataSource={selectedPermission || []}
                  filterBarPlaceholder={intl.formatMessage({ id: 'filtertable' })}
                  rowSelection={{
                    selectedRowKeys: currentPermission,
                    onChange: (selectedRowKeys, selectedRows) => {
                      this.setState({
                        currentPermission: selectedRowKeys,
                      });
                    },
                  }}
                  rowKey="id"
                />
                {!firstLoad && !currentPermission.length ? (
                  <div style={{ color: '#d50000' }} className="ant-form-explain">
                    <FormattedMessage id={`${intlPrefix}.permission.require.msg`} />
                  </div>
                ) : null}
              </FormItem>
              <FormItem>
                <Row className="mt-md">
                  <Col className="choerodon-btn-create">
                    <Button
                      funcType="raised"
                      type="primary"
                      onClick={this.handleCreate}
                      loading={submitting}
                    >
                      <FormattedMessage id="create" />
                    </Button>
                  </Col>
                  <Col span={5}>
                    <Button
                      funcType="raised"
                      onClick={this.handleReset}
                      disabled={submitting}
                      style={{ color: '#3F51B5' }}
                    >
                      <FormattedMessage id="cancel" />
                    </Button>
                  </Col>
                </Row>
              </FormItem>
            </Form>
            <Sidebar
              title={<FormattedMessage id={`${intlPrefix}.add.permission`} />}
              visible={this.state.visible}
              onOk={this.handleOk.bind(this)}
              onCancel={this.handleCancel.bind(this)}
              okText={intl.formatMessage({ id: 'ok' })}
              cancelText={intl.formatMessage({ id: 'cancel' })}
            >
              <Content
                className="sidebar-content"
                code={`${intlPrefix}.create.addpermission`}
              >
                <Table
                  style={{
                    width: '900px',
                  }}
                  columns={[{
                    title: <FormattedMessage id={`${intlPrefix}.permission.code`} />,
                    dataIndex: 'code',
                    key: 'code',
                    width: 500,
                  }, {
                    title: <FormattedMessage id={`${intlPrefix}.permission.desc`} />,
                    dataIndex: 'description',
                    key: 'description',
                    width: 400,
                  }]}
                  rowKey="id"
                  dataSource={data}
                  pagination={pagination}
                  onChange={this.handlePageChange}
                  filters={this.state.permissionParams}
                  filterBarPlaceholder={intl.formatMessage({ id: 'filtertable' })}
                  rowSelection={{
                    selectedRowKeys: (changePermission
                      && changePermission.map(item => item.id)) || [],
                    onSelect: (record, selected, selectedRows) => {
                      this.handleChangePermission(selected, [record.id], selectedRows);
                    },
                    onSelectAll: (selected, selectedRows, changeRows) => {
                      const ids = _.map(changeRows, item => item.id);
                      this.handleChangePermission(selected, ids, selectedRows);
                    },
                  }}
                />
              </Content>
            </Sidebar>
          </div>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(CreateRole)));
