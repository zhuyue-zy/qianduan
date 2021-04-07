import React, { Component } from 'react';
import { Button, Form, Input, Modal, Table, Tooltip } from 'yqcloud-ui';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission, stores } from 'yqcloud-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import _ from 'lodash';
// import '../../../../assets/css/main.scss';
import './ProjectHome.scss';

const { HeaderStore } = stores;
const FormItem = Form.Item;
const ORGANIZATION_TYPE = 'organization';
const PROJECT_TYPE = 'project';
const { Sidebar } = Modal;
const intlPrefix = 'organization.project';

@inject('AppState')
@observer
class ProjectHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebar: false,
      id: '',
      projectDatas: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 10,
        total: '',
      },
      sort: {
        columnKey: null,
        order: null,
      },
      submitting: false,
    };
  }


  componentWillMount() {
    this.setState({
      isLoading: true,
    });
  }

  componentDidMount() {
    this.loadProjects();
  }

  linkToChange = (url) => {
    const { history } = this.props;
    history.push(url);
  };

  loadProjects = (paginationIn, sortIn, filtersIn) => {
    const {
      pagination: paginationState,
      sort: sortState,
      filters: filtersState,
    } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const { AppState, ProjectStore } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    ProjectStore.changeLoading(true);
    ProjectStore.loadProject(organizationId, pagination, sort, filters)
      .then((data) => {
        ProjectStore.changeLoading(false);
        ProjectStore.setProjectData(data.content);
        this.setState({
          filters,
          sort,
          pagination: {
            current: data.number + 1,
            pageSize: data.size,
            total: data.totalElements,
          },
        });
      })
      .catch(error => Choerodon.handleResponseError(error));
  };

  handleopenTab = (data, operation) => {
    this.props.form.resetFields();
    this.setState({
      errorMeg: '',
      successMeg: '',
      sidebar: true,
      projectDatas: data,
      operation,
    });
  };

  handleTabClose = () => {
    this.setState({
      sidebar: false,
      submitting: false,
    });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { AppState, ProjectStore } = this.props;
    const { projectDatas } = this.state;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    const { id } = this.state;
    let data;
    // const editData = this.state.resourceData;
    if (this.state.operation === 'create') {
      const { validateFields } = this.props.form;
      validateFields((err, { code, name }) => {
        if (!err) {
          data = {
            code,
            name,
            organizationId,
          };
          this.setState({ submitting: true });
          ProjectStore.createProject(organizationId, data)
            .then((value) => {
              this.setState({ submitting: false });
              if (value) {
                Choerodon.prompt(this.props.intl.formatMessage({ id: 'create.success' }));
                this.handleTabClose();
                this.loadProjects();
                value.type = 'project';
                HeaderStore.addProject(value);
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
              this.setState({
                submitting: false,
              });
            });
        }
      });
    } else {
      const { validateFields } = this.props.form;
      validateFields((err, { name }, modify) => {
        if (!err) {
          if (!modify) {
            Choerodon.prompt(this.props.intl.formatMessage({ id: 'modify.success' }));
            this.handleTabClose();
            return;
          }
          data = {
            name,
          };
          this.setState({ submitting: true });
          ProjectStore.updateProject(organizationId,
            {
              ...data,
              objectVersionNumber: projectDatas.objectVersionNumber,
              code: projectDatas.code,
            },
            this.state.projectDatas.id).then((value) => {
            this.setState({ submitting: false });
            if (value) {
              Choerodon.prompt(this.props.intl.formatMessage({ id: 'modify.success' }));
              this.handleTabClose();
              this.loadProjects();
              value.type = 'project';
              HeaderStore.updateProject(value);
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        }
      });
    }
  };

  /* 停用启用 */
  handleEnable = (record) => {
    const { ProjectStore, AppState, intl } = this.props;
    const userId = AppState.getUserId;
    const menuType = AppState.currentMenuType;
    const orgId = menuType.id;
    ProjectStore.enableProject(orgId, record.id, record.enabled).then((value) => {
      Choerodon.prompt(intl.formatMessage({ id: record.enabled ? 'disable.success' : 'enable.success' }));
      this.loadProjects();
      HeaderStore.axiosGetOrgAndPro(sessionStorage.userId || userId).then((org) => {
        org[0].map((a) => {
          a.type = ORGANIZATION_TYPE;
        });
        org[1].map((b) => {
          b.type = PROJECT_TYPE;
        });
        HeaderStore.setProData(org[0]);
        HeaderStore.setProData(org[1]);
      });
    }).catch((error) => {
      Choerodon.prompt(intl.formatMessage({ id: 'operation.error' }));
    });
  };

  /* 分页处理 */
  handlePageChange(pagination, filters, sorter, params) {
    filters.params = params;
    this.loadProjects(pagination, sorter, filters);
  }

  /**
   * 校验项目编码唯一性
   * @param value 项目编码
   * @param callback 回调函数
   */
  checkCodeOnly = _.debounce((value, callback) => {
    const { AppState, ProjectStore, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    const params = { code: value };
    ProjectStore.checkProjectCode(organizationId, params)
      .then((mes) => {
        if (mes.failed) {
          callback(intl.formatMessage({ id: `${intlPrefix}.code.exist.msg` }));
        } else {
          callback();
        }
      });
  }, 1000);


  /**
   * 校验编码
   * @param rule 校验规则
   * @param value 项目编码
   * @param callback 回调函数
   */
  checkcode(rule, value, callback) {
    const { intl } = this.props;
    if (!value) {
      callback(intl.formatMessage({ id: `${intlPrefix}.code.require.msg` }));
      return;
    }
    if (value.length <= 14) {
      // eslint-disable-next-line no-useless-escape
      const pa = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
      if (pa.test(value)) {
        this.checkCodeOnly(value, callback);
      } else {
        callback(intl.formatMessage({ id: `${intlPrefix}.code.pattern.msg` }));
      }
    } else {
      callback(intl.formatMessage({ id: `${intlPrefix}.code.length.msg` }));
    }
  }

  renderSideTitle() {
    if (this.state.operation === 'create') {
      return <FormattedMessage id={`${intlPrefix}.create`} />;
    } else {
      return <FormattedMessage id={`${intlPrefix}.modify`} />;
    }
  }

  getSidebarContentInfo(operation) {
    const { AppState } = this.props;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
    switch (operation) {
      case 'create':
        return {
          code: `${intlPrefix}.create`,
          values: {
            name: orgname,
          },
        };
      case 'edit':
        return {
          code: `${intlPrefix}.modify`,
          values: {
            name: this.state.projectDatas.code,
          },
        };
    }
  }

  renderSidebarContent() {
    const { intl } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { operation, projectDatas } = this.state;
    const inputWidth = 512;
    const contentInfo = this.getSidebarContentInfo(operation);
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };
    return (
      <Content
        style={{ padding: 0 }}
        {...contentInfo}
      >
        <Form layout="vertical" className="rightForm">
          {operation === 'create' ? (
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('code', {
                rules: [{
                  required: true,
                  hasFeedback: false,
                  validator: this.checkcode.bind(this),
                }],
              })(
                <Input
                  autoComplete="off"
                  label={<FormattedMessage id={`${intlPrefix}.code`} />}
                  style={{ width: inputWidth }}
                />,
              )}
            </FormItem>
          ) : null}
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('name', {
              rules: [{
                required: true,
                whitespace: true,
                message: intl.formatMessage({ id: `${intlPrefix}.name.require.msg` }),
              }],
              initialValue: operation === 'create' ? undefined : projectDatas.name,
            })(
              <Input
                autoComplete="off"
                label={<FormattedMessage id={`${intlPrefix}.name`} />}
                style={{ width: inputWidth }}
              />,
            )}
          </FormItem>
        </Form>
      </Content>
    );
  }

  render() {
    const { ProjectStore, AppState, intl } = this.props;
    const projectData = ProjectStore.getProjectData;
    const menuType = AppState.currentMenuType;
    const orgId = menuType.id;
    const orgname = menuType.name;
    const { filters, operation } = this.state;

    const { type } = menuType;
    const columns = [{
      title: <FormattedMessage id="name" />,
      dataIndex: 'name',
      key: 'name',
      filters: [],
      filteredValue: filters.name || [],
      sorter: (a, b) => (a.name > b.name ? 1 : 0),
      render: (text, record) => <span>{text}</span>,
    }, {
      title: <FormattedMessage id="code" />,
      dataIndex: 'code',
      filters: [],
      filteredValue: filters.code || [],
      key: 'code',
      sorter: (a, b) => (a.code > b.code ? 1 : 0),
    }, {
      title: <FormattedMessage id="status" />,
      dataIndex: 'enabled',
      filters: [{
        text: intl.formatMessage({ id: 'enable' }),
        value: 'true',
      }, {
        text: intl.formatMessage({ id: 'disable' }),
        value: 'false',
      }],
      filteredValue: filters.enabled || [],
      key: 'enabled',
      render: text => <span className="titleNameStyle">{intl.formatMessage({ id: text ? 'enable' : 'disable' })}</span>,
    }, {
      title: '',
      key: 'action',
      width: '100px',
      align: 'right',
      render: (text, record) => (
        <div>
          <Permission service={['iam-service.organization-project.update']} type={type} organizationId={orgId}>
            <Tooltip
              title={<FormattedMessage id="modify" />}
              placement="bottom"
            >
              <Button
                shape="circle"
                size="small"
                onClick={this.handleopenTab.bind(this, record, 'edit')}
                icon="mode_edit"
              />
            </Tooltip>
          </Permission>
          <Permission
            service={['iam-service.organization-project.disableProject', 'iam-service.organization-project.enableProject']}
            type={type}
            organizationId={orgId}
          >
            <Tooltip
              title={<FormattedMessage id={record.enabled ? 'disable' : 'enable'} />}
              placement="bottom"
            >
              <Button
                shape="circle"
                size="small"
                onClick={this.handleEnable.bind(this, record)}
                icon={record.enabled ? 'remove_circle_outline' : 'finished'}
              />
            </Tooltip>
          </Permission>
        </div>
      ),
    }];


    return (
      <Page
        service={[
          'iam-service.organization-project.list',
          'iam-service.organization-project.create',
          'iam-service.organization-project.check',
          'iam-service.organization-project.update',
          'iam-service.organization-project.disableProject',
          'iam-service.organization-project.enableProject',
        ]}
      >
        <Header title={<FormattedMessage id={`${intlPrefix}.header.title`} />}>
          <Permission service={['iam-service.organization-project.create']} type={type} organizationId={orgId}>
            <Button
              onClick={this.handleopenTab.bind(this, null, 'create')}
              icon="playlist_add"
            >
              <FormattedMessage id={`${intlPrefix}.create`} />
            </Button>
          </Permission>
          <Button
            icon="refresh"
            onClick={() => {
              ProjectStore.changeLoading(true);
              this.setState({
                filters: {
                  params: [],
                },
                pagination: {
                  current: 1,
                  pageSize: 10,
                  total: '',
                },
                sort: {
                  columnKey: null,
                  order: null,
                },
              }, () => {
                this.loadProjects();
              });
            }}
          >
            <FormattedMessage id="refresh" />
          </Button>
        </Header>
        <Content
          code={intlPrefix}
        >
          <Table
            pagination={this.state.pagination}
            columns={columns}
            dataSource={projectData}
            rowKey={record => record.id}
            filters={this.state.filters.params}
            onChange={this.handlePageChange.bind(this)}
            loading={ProjectStore.isLoading}
            filterBarPlaceholder={intl.formatMessage({ id: 'filtertable' })}
          />
          <Sidebar
            title={this.renderSideTitle()}
            visible={this.state.sidebar}
            onCancel={this.handleTabClose.bind(this)}
            onOk={this.handleSubmit.bind(this)}
            okText={<FormattedMessage id={operation === 'create' ? 'create' : 'save'} />}
            cancelText={<FormattedMessage id="cancel" />}
            confirmLoading={this.state.submitting}
          >
            {operation && this.renderSidebarContent()}
          </Sidebar>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(ProjectHome)));
