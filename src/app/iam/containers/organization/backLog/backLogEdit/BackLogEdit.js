/** 2018/10/24
*作者:高梦龙
*项目:我的待办事项
*/

import React, { Component } from 'react';
import { Form, Table, Button, Tabs, Tooltip, Divider, Collapse, Icon, Row, Col, Radio, Tag } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Page, Header } from 'yqcloud-front-boot';
import backLogStore from '../../../../stores/organization/backLog/BackLogStore';
import './index.scss';
import RejectHome from '../backlogReject/RejectHome';
import TransferHome from '../backlogTransfer/TransferHome';
import AgreeHome from '../backlogAgree/AgreeHome';
import DagreD3 from '../../../../components/dagreD3/DagreD3';


const FormItem = Form.Item;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

const intlPrefix = 'organization.backLog';
const inputWidth = 512;

@inject('AppState')
@observer
class BackLogEdit extends Component {
  state=this.getInitState();

  getInitState() {
    return {
      submitting: false,
      open: false,
      edit: false,
      id: this.props.match.params.id,
      approverInfo: {},
      approverHistory: [],
      page: 0,
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      isLoading: true,
      filters: {},
      flexValuesList: [],
      agreeVisible: false,
      transferVisible: false,
      rejectVisible: false,
      approverTables: '',
      src: '',
      nodes: [], // 流程图node节点
      prop: '',

    };
  }

  componentWillMount() {
    this.fetch(this.props);
  }

  fetch() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    backLogStore.queryTypeLineList(organizationId);
    this.loadLanguage();
  }

  componentDidMount() {
    this.loatAllData();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    backLogStore.queryLanguage(id, AppState.currentLanguage);
  }

  loatAllData=() => {
    const { AppState } = this.props;
    const { id } = this.state;
    const { organizationId } = AppState.currentMenuType;
    this.getApproverId(organizationId, id);
    this.getApproverHistory(organizationId, id);
    this.getJumpDote(organizationId, id);
    this.setState({
      isLoading: false,
    });
  }

  /* 审批状态判断 */
  approvStatus=(values) => {
    const statusLists = backLogStore.getTypeLinelist;
    const statusType = statusLists.filter(v => (v.lookupValue === values));
    if (statusType.length > 0) {
      if (statusType[0].lookupMeaning === '转交') {
        return (<span style={{ borderRadius: 4, fontFamily: 'Arial', color: '#8EA200', fontSize: 12, padding: '3px 8px', textDecoration: 'none', backgroundColor: '#EFF6BF' }}>{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '跳转') {
        return (<span style={{ borderRadius: 4, fontFamily: 'Arial', color: '#F08F07', fontSize: 12, padding: '3px 12px', textDecoration: 'none', backgroundColor: '#FF9500' }}>{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '审批拒绝') {
        return (<span style={{ borderRadius: 4, fontFamily: 'Arial', color: '#F5222D', fontSize: 12, padding: '3px 12px', textDecoration: 'none', backgroundColor: '#FFF1F0' }}>{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '审批撤回') {
        return (<span style={{ borderRadius: 4, fontFamily: 'Arial', color: '#722ED1', fontSize: 12, padding: '3px 12px', textDecoration: 'none', backgroundColor: '#F9F0FF' }}>{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '审批同意') {
        return (<span style={{ borderRadius: 4, fontFamily: 'Arial', color: '#52C41A', fontSize: 12, padding: '3px 12px', textDecoration: 'none', backgroundColor: '#E2FCD6' }}>{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '审批中') {
        return (<span style={{ borderRadius: 4, fontFamily: 'Arial', color: '#2196F3', fontSize: 12, padding: '3px 12px', textDecoration: 'none', backgroundColor: '#E6F7FF' }}>{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '未审批') {
        return (<span style={{ borderRadius: 4, fontFamily: 'Arial', color: '#00B5D9', fontSize: 12, padding: '3px 12px', textDecoration: 'none', backgroundColor: '#E6FFFE' }}>{statusType[0].lookupMeaning}</span>);
      } else {
        return statusType[0].lookupMeaning;
      }
    } else {
      return values;
    }
  }

  /*
获取我的待办事项
 */
  getApproverId=(organizationId, procInstId) => {
    backLogStore.getMatterById(organizationId, procInstId).then((values) => {
      this.setState({
        approverInfo: values,
      });
      if (values.application === 'ITSM') {
        backLogStore.approverITSMTable(organizationId, values.eventNum, values.transactionType).then((data) => {
          this.setState({
            approverTables: data,
          });
        });
      } else if (values.application === 'KB') {
        backLogStore.approverKnowledgeTable(organizationId, values.transactionId, values.transactionType).then((data) => {
          this.setState({
            approverTables: data,
          });
        });
      }
    }).catch((error) => {
      Choerodon.handleResponseError(error);
    });
  }

  /*
获取审批历史数据
*/
  getApproverHistory=(organizationId, procInstId) => {
    backLogStore.getApproverHistoryById(organizationId, procInstId).then((values) => {
      this.setState({
        approverHistory: values,
      });
    });
  }

  // 获取节点流程图

  getJumpDote =(organization, procInstId) => {
    backLogStore.getProcessJump(organization, procInstId).then((data) => {
      this.setState({
        nodes: data,
      });
    });
  }


  // 控制流程图从左向右方向
  processControll =(e) => {
    const { AppState } = this.props;
    const { id } = this.state;
    const { organizationId } = AppState.currentMenuType;
    const lefts = e.target.value;
    const rights = e.target.value;
    const tops = e.target.value;
    const bottoms = e.target.value;

    if (lefts === 'LR') {
      this.setState({
        prop: lefts,
      });
    } else if (rights === 'RL') {
      this.setState({
        prop: rights,
      });
    } else if (tops === 'TB') {
      this.setState({
        prop: tops,
      });
    } else {
      this.setState({
        prop: bottoms,
      });
    }

    this.getJumpDote(organizationId, id);
  }

  renderTable=() => {
    //  获取dataSource
    const { approverHistory, pagination, isLoading } = this.state;
    approverHistory.forEach((v) => {
      v.key = v.approvalTime;
    });
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;

    const columns = [
      {
        title: backLogStore.languages[`${intlPrefix}.approvalTime`],
        dataIndex: 'approvalTime',
        key: 'approvalTime',
        filters: [],
        width: 230,
      },
      {
        title: backLogStore.languages[`${intlPrefix}.approvalUserName`],
        dataIndex: 'approvalUserName',
        key: 'approvalUserName',
        filters: [],
        width: 200,
      },
      {
        title: backLogStore.languages[`${intlPrefix}.approvalStatus`],
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 150,
        render: (value, record) => this.approvStatus(record.approvalStatus),
      },
      {
        title: backLogStore.languages[`${intlPrefix}.taskName`],
        dataIndex: 'approvalTaskName',
        key: 'approvalTaskName',
        width: 200,
      },
      {
        title: backLogStore.languages[`${intlPrefix}.message`],
        dataIndex: 'message',
        key: 'message',
        filters: [],

      },
    ];
    return (
      <Table
        columns={columns}
        dataSource={approverHistory}
        pagination={pagination}
        loading={isLoading}
        filterBar={false}
        bordered={false}
      />
    );
  }

  /*
同意按鈕
* */

  agreeShowModal=() => {
    this.setState({
      agreeVisible: true,
    });
  }

  onCancelAgreeHome = () => {
    this.setState({
      agreeVisible: false,
    });
  }

  /*
  转交按钮
  */
  transferShowModal=() => {
    this.setState({
      transferVisible: true,
    });
  }


  onCancelTransferHome = () => {
    this.setState({
      transferVisible: false,
    });
  }

  /*
拒绝按钮
*/
  rejectShowModal=() => {
    this.setState({
      rejectVisible: true,
    });
  }

  onCancelRejectHome=() => {
    this.setState({
      rejectVisible: false,
    });
  }

  /* 显示流程图 */
  getProcessPhoto = (organizationId, procInstId) => {
    backLogStore.getProcessPhoto(organizationId, procInstId)
      .then((values) => {
        const byteStr = `data:image/png;base64,${btoa(
          new Uint8Array(values)
            .reduce((data, byte) => data + String.fromCharCode(byte), ''),
        )}`;
        this.setState({
          src: byteStr,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };


  render() {
    const { intl, id } = this.props;
    const { AppState: { menuType: { organizationId, name } }, form } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { approverInfo, approverTables, src, nodes, prop } = this.state;
    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '300px',
      wordBreak: 'normal',
    };
    return (
      <Page>
        <Header
          title={backLogStore.languages[`${intlPrefix}.dealList`]}
          backPath={`/iam/backLog?type=organization&id=${organizationId}&name=${name}&organizationId=${organizationId}`}
        >
          <Button
            onClick={this.agreeShowModal}
            style={{ color: '#04173F' }}
          >
            <Icon type="tongyi" style={{ color: '#2196F3', width: 25 }} />
            {backLogStore.languages[`${intlPrefix}.agree`]}
          </Button>
          <Button
            onClick={this.transferShowModal}
            style={{ color: '#04173F' }}
          >
            <Icon type="zhuanjiao" style={{ color: '#2196F3', width: 25 }} />
            {backLogStore.languages[`${intlPrefix}.transfer`]}
          </Button>
          <Button
            onClick={this.rejectShowModal}
            style={{ color: '#04173F' }}
          >
            <Icon type="jujue1" style={{ color: '#2196F3', width: 25 }} />
            {backLogStore.languages[`${intlPrefix}.reject`]}
          </Button>
        </Header>
        <Content className="backlog-content">
          <div style={{ marginBottom: '12px', marginLeft: 11 }}><span style={{ fontSize: '17px', fontFamily: 'sans-serif', color: '#04173F' }}>{backLogStore.languages[`${intlPrefix}.approveMatter`]}</span>
          </div>
          <div style={{ borderBottom: '1px solid #CCD3D9', width: '100.5%', marginBottom: 15 }} />
          <Row style={{ marginBottom: 35, marginTop: -5, marginLeft: 13 }}>
            <Col span={4} className="girdType">{backLogStore.languages[`${intlPrefix}.owner`]}</Col>
            <Col span={8} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}>{approverInfo.startUserId}</Col>

            <Col span={4} className="girdType">{backLogStore.languages[`${intlPrefix}.applicationTime`]}</Col>
            <Col span={8} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}>{approverInfo.createTime}</Col>
          </Row>
          <Row style={{ marginTop: -35, marginBottom: 35, marginLeft: 13 }}>
            <Col span={4} className="girdType">{backLogStore.languages[`${intlPrefix}.procInstIds`]}</Col>
            <Col span={8} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}>{approverInfo.codeNum}</Col>


            <Col span={4} className="girdType">{backLogStore.languages[`${intlPrefix}.processName`]}</Col>
            <Col span={8} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}>{approverInfo.processName}</Col>

          </Row>
          <Row style={{ marginTop: -35, marginBottom: 20, marginLeft: 13 }}>
            <Col span={4} className="girdType">{backLogStore.languages[`${intlPrefix}.applicationDesc`]}</Col>
            <Col span={20} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}><span style={tableStyleName}><Tooltip title={approverInfo.message} lines={40}>{approverInfo.message}</Tooltip></span></Col>
          </Row>
          <Collapse bordered={false} defaultActiveKey={['1']} style={{ marginLeft: -24, borderBottomStyle: 1, marginTop: -20 }}>
            <Panel header={backLogStore.languages[`${intlPrefix}.approveForm`]} style={{ fontSize: '17px', fontWeight: 500, borderRadius: 4, marginBottom: 24, border: 0, color: '#04173F', overflow: 'hidden' }} key="1">
              <div style={{ borderBottom: '1px solid #CCD3D9', width: '100.5%', marginLeft: 9 }} />
              <div className="wf-approver-form" dangerouslySetInnerHTML={{ __html: approverTables || '' }} />
            </Panel>
          </Collapse>

          <Tabs defaultActiveKey="1" style={{ marginTop: -30, marginLeft: -5 }}>
            <TabPane tab={<span style={{ fontSize: '17px' }}>{backLogStore.languages[`${intlPrefix}.approvalHistory`]}</span>} key="1">
              {this.renderTable()}
            </TabPane>

            <TabPane tab={<span style={{ fontSize: '17px' }}>{backLogStore.languages[`${intlPrefix}.flowChart`]}</span>} key="2">
              <div style={{ marginBottom: 30 }}>
                <RadioGroup defaultValue="LR" onChange={this.processControll}>
                  <RadioButton value="LR">{backLogStore.languages[`${intlPrefix}.leftToRight`]}</RadioButton>
                  <RadioButton value="RL">{backLogStore.languages[`${intlPrefix}.rightToLeft`]}</RadioButton>
                  <RadioButton value="TB">{backLogStore.languages[`${intlPrefix}.topToBottom`]}</RadioButton>
                  <RadioButton value="BT">{backLogStore.languages[`${intlPrefix}.bottomToTop`]}</RadioButton>
                </RadioGroup>
                <Tag color="#ffffff" style={{ float: 'right', color: '#000000', marginLeft: 5 }}>{backLogStore.languages[`${intlPrefix}.jump`]}
                </Tag><Tag color="white" style={{ float: 'right', width: 35, marginRight: -5, border: '2px solid #818999' }} />
                <Tag color="#ffffff" style={{ float: 'right', color: '#000000', marginLeft: 5 }}>{backLogStore.languages[`${intlPrefix}.currentCode`]}
                </Tag><Tag color="#FF9500" style={{ float: 'right', width: 35, marginRight: -5 }} />
                <Tag color="#ffffff" style={{ float: 'right', color: '#000000', marginLeft: 5 }}>{backLogStore.languages[`${intlPrefix}.approved`]}
                </Tag><Tag color="green" style={{ float: 'right', width: 35, marginRight: -5, border: '2px solid' }} />
                <Tag color="#ffffff" style={{ float: 'right', color: '#000000', marginLeft: 5 }}>{backLogStore.languages[`${intlPrefix}.notApprovet`]}
                </Tag> <Tag color="blue" style={{ float: 'right', width: 35, marginRight: -5, border: '2px solid' }} />
              </div>
              <DagreD3
                graph={{ rankdir: `${prop}` || 'LR' }} // 流程图方向
                nodes={nodes}
                onNodeClick={this.onNodeClick}
              />
            </TabPane>
          </Tabs>


          <RejectHome
            visible={this.state.rejectVisible}
            onCancel={this.onCancelRejectHome}
          />

          <TransferHome
            visible={this.state.transferVisible}
            onCancel={this.onCancelTransferHome}
          />

          <AgreeHome
            visible={this.state.agreeVisible}
            onCancel={this.onCancelAgreeHome}
          />
        </Content>
      </Page>
    );
  }
}
export default Form.create({})(withRouter(injectIntl(BackLogEdit)));
