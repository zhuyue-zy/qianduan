/**
 * Created by Nanjiangqi on 2018-10-17 0017.
 */
import React, { Component } from 'react';
import { Form, Input, Modal, Select, Table, Collapse, Popconfirm, Tooltip, Button, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import WorkflowStore from '../../../../stores/organization/approvalWorkflow';
import ProcessPreview from './ProcessPreview';

const intlPrefixs = 'approval.workflow';
const { Sidebar } = Modal;

function noop() {
}

@inject('AppState')
@observer
class ModifyWorkflow extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      organizationInfo: {},
      dataSource: [],
      params: [],
      popup: false,
      submitting: false,
      deployId: '',
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      lookdataid: '',
    };
  }

  componentWillMount() {
    this.props.onRef(this);
    this.fetch(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.popup) {
      nextProps.form.resetFields();
      this.setState(this.getInitState());
    } else if (!this.props.popup) {
      this.fetch(nextProps);
    }
  }

  fetch(props) {
    const { id, AppState } = props;
    const { organizationId } = AppState.currentMenuType;
    const { pagination } = this.state;
    const code = 'WF_VERSION_STATUS';
    WorkflowStore.loadStatus(organizationId, code);
    this.loadposts(id, pagination);
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    WorkflowStore.queryLanguage(organizationId, AppState.currentLanguage);
  }

  /**
   * 加载组织列表
   */
  loadposts = (id, pagination) => {
    const { organizationId } = this.props.AppState.currentMenuType;
    WorkflowStore.previewWorkflow(
      organizationId,
      id,
      pagination,
    ).then((data) => {
      this.setState({
        dataSource: data.content,
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        lookdataid: id,
      });
    })
      .catch(error => Choerodon.handleResponseError(error));
  };


  // 返回关闭弹框
  handleSubmit = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      OnCloseModel();
    });
  };

  /**
   * 分页处理
   * @param pagination 分页
   */
  handlePageChange = (pagination) => {
    const { lookdataid: id } = this.state;
    this.loadposts(id, pagination);
  };

  // 查看
  onLookover = (record) => {
    this.setState({
      popup: true,
      deployId: record.deployId,
    });
  };

  appStatus = (status) => {
    const statusList = WorkflowStore.getStatuslits;
    let value;
    status === 'Y' ? value = 'true' : value = 'false';
    const statusType = statusList.filter(v => (v.lookupValue === value));
    if (statusType.length > 0) {
      return statusType[0].lookupMeaning;
    } else {
      return value;
    }
  };

  renderPreviewSidebar = () => {
    const { popup, deployId } = this.state;
    return (
      <ProcessPreview
        popup={popup}
        deployId={deployId}
        onRef={(node) => {
          this.processPreview = node;
        }}
        OnUnchangedSuccess={() => {
          this.setState({
            popup: false,
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
            popup: false,
            submitting: false,
          });
          this.loadposts();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
        OnCloseModel={() => {
          this.setState({
            popup: false,
          });
        }}
      />
    );
  };

  render() {
    const { pagination, popup, submitting, params, dataSource } = this.state;
    const ListColumns = [
      {
        title: WorkflowStore.languages[`${intlPrefixs}.version.id`],
        dataIndex: 'version',
        key: 'version',
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.process.coding`],
        dataIndex: 'key',
        key: 'key',
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.process.name`],
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.classification`],
        dataIndex: 'statusValue',
        key: 'statusValue',
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.publisher`],
        dataIndex: 'deploymentPerson',
        key: 'deploymentPerson',
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.release.time`],
        dataIndex: 'deploymentTime',
        key: 'deploymentTime',
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.state`],
        dataIndex: 'status',
        key: 'status',
        render: (values, record) => this.appStatus(record.status),
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.workflow.preview`],
        key: 'see',
        render: record => (
          <a onClick={this.onLookover.bind(this, record)}>{WorkflowStore.languages[`${intlPrefixs}.see`]}</a>
        ),
      },
    ];
    const footerOptions = (
      <div>
        <Button
          type="primary"
          funcType="raised"
          onClick={e => this.processPreview.handleSubmit(e)}
        >
          {WorkflowStore.languages.return}
        </Button>
      </div>
    );
    return (
      <Content
        className="sidebar-content"
        values={{}}
      >
        <div style={{ height: 625 }}>
          <Table
            size="middle"
            columns={ListColumns}
            pagination={pagination}
            onChange={this.handlePageChange.bind(this)}
            rowKey="id"
            dataSource={dataSource}
          />
          <Sidebar
            title={WorkflowStore.languages[`${intlPrefixs}.process.review`]}
            visible={popup}
            footer={footerOptions}
            confirmLoading={submitting}
          >
            {
            this.renderPreviewSidebar()
          }
          </Sidebar>
        </div>
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(ModifyWorkflow)));
