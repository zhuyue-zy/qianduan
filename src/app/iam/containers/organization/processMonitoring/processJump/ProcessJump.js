
import React, { Component } from 'react';
import { Form, Input, Select, Table, Button, Modal, message, Tabs, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Page, Header } from 'yqcloud-front-boot';
import ProcessStore from '../../../../stores/organization/processMonitoring/ProcessStore';

const intlPrefix = 'organization.processMonitoring';
@inject('AppState')
@observer
class ProcessEdit extends Component {
  state=this.getInitState();

  getInitState() {
    return {
      submitting: false,
      open: false,
      edit: false,
      id: this.props.match.params.id,
      page: 0,
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      isLoading: true,
      filters: {},
      agreeVisible: false,
      transferVisible: false,
      rejectVisible: false,
      employeeId: '',
      LOVVisible: false,
      visible: false,
      text: '',
      LOVCode: '',
      selectedRowKeys: [],
      ValueAll: [],
      params: [],
      processJump: [],
    };
  }


openPath=(id) => {
  const { AppState } = this.props;
  const { organizationId } = AppState.currentMenuType;
  const menuType = AppState.currentMenuType;
  this.props.history.push(`/iam/processMonitoring?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
};

  // 确认提交按钮
  handleSubmitOk = () => {
    const { intl } = this.props;
    Modal.confirm({
      title: ProcessStore.languages[`${intlPrefix}.cancel.title`],
      content: ProcessStore.languages[`${intlPrefix}.cancel.content`],
      okText: ProcessStore.languages.confirm,
      cancelText: ProcessStore.languages.cancel,
      onOk: () => {
        const { ValueAll, id } = this.state;
        const { AppState } = this.props;
        const { organizationId } = AppState.currentMenuType;
        /* eslint-disable */

        ProcessStore.getProcessJumpConfirm(
          organizationId,
          id,
          ValueAll[0].nodeId,
        ).then((data) => {
          this.setState({
            deleteVisible: false,
            selectedRowKeys: [],
          });
          this.openPath();
          Choerodon.prompt(intl.formatMessage({id: `${intlPrefix}.jumpSuccess`}));
        });
      },
    });
  }


  componentWillMount() {
    this.loatAllData();
    this.loadLanguage();
  };

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    ProcessStore.queryLanguage(id, AppState.currentLanguage);
  };

  loatAllData=() => {
    const { AppState } = this.props;
    const { id } = this.state;
    const { organizationId } = AppState.currentMenuType;
    this.getProcessJump(organizationId, id);
    this.setState({
      isLoading: false,
    });
  }

  //根据ID查询
  getProcessJump = (organizationId, procInstId) => {
    ProcessStore.getProcessJump(organizationId, procInstId)
      .then((values) => {
        this.setState({
          processJump:values,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });

  };
  render() {
    const { intl } = this.props;
    const { AppState: { menuType: { organizationId, name } } } = this.props;
    const {
      selectedRowKeys,params,
    } = this.state;
    const { processJump, pagination ,isLoading, } = this.state;
    processJump.forEach((v) => {
      v.key = v.nodeId;
    });
    const columns=[
      {
        title: ProcessStore.languages[ `${intlPrefix}.nodeNumber`],
        dataIndex: 'nodeId',
        key: 'nodeId',
        filters: [],
        width: 80,
        render: (text, record, index) => {
          return <span>{index + 1}</span>
        },
      },
      {
        title: ProcessStore.languages[ `${intlPrefix}.nodeName`],
        dataIndex: 'name',
        key: 'name',
        filters: [],
        width: 80,
      },
      {
        title: ProcessStore.languages[ `${intlPrefix}.nodeStatus`],
        dataIndex: 'status',
        key: 'status',
        filters: [],
        width: 80,
        render: (text, record) => {
          if(record.status=='Y'){
            return <span>{ProcessStore.languages[ `${intlPrefix}.approved`]}</span>
          }else if(record.status=='N') {
            return <span>{ProcessStore.languages[ `${intlPrefix}.notApprovet`]}</span>

          }else if(record.status=='JUMP') {
            return <span>&nbsp;&nbsp;----</span>

          }
        },
  },
    ];
    const rowSelection = {

      onChange: (selectedRowKeys, valAll) => {
        this.setState({selectedRowKeys, ValueAll: valAll});
      },
      selectedRowKeys,
      type: 'radio',
    };
    return (
      <Page>
        <Header
          title={ProcessStore.languages[`${intlPrefix}.selectNode`]}
          backPath={`/iam/processMonitoring?type=organization&id=${organizationId}&name=${name}&organizationId=${organizationId}`}
        >
          <Button
            onClick={this.handleSubmitOk}
            style={{ color: '#04173F', fontSize: 15, verticalAlign: 'bottom' }}
            disabled={selectedRowKeys.length <1}
          >
            <Icon type="ghj" style={{ color: '#2196F3', width: 25, fontSize: 15 }}/>
            {ProcessStore.languages[`${intlPrefix}.agree`]}
          </Button>
        </Header>
        <Content>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            size="middle"
            dataSource={processJump}
            pagination={pagination}
            loading={isLoading}
            filters={params}
            // bordered
            rowKey="id"
            width='80px'
          />
          <Modal
            title={ProcessStore.languages[ `${intlPrefix}.agreeApprove`]}
            visible={this.state.agreeVisible}
            onOk={this.agreeSubmit}
            onCancel={this.agreeCancel}
            center
          >
          </Modal>
        </Content>
      </Page>
    );
  }
}
export default Form.create({})(withRouter(injectIntl(ProcessEdit)));

