import React, { Component } from 'react';
import { Form, Table, Button, Tooltip, Tabs, Icon, Collapse, Row, Col, Radio, Tag } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Page, Header, axios } from 'yqcloud-front-boot';
import ProcessStore from '../../../../stores/organization/processMonitoring/ProcessStore';
import './index.scss';
import DagreD3 from '../../../../components/dagreD3/DagreD3';


const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
const intlPrefix = 'organization.processMonitoring';
const Panel = Collapse.Panel;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

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
      processInfo: {},
      processHistory: [],
      src: '',
      approverTables: '',
      nodes: [], // 流程图node节点
      prop: '',
    };
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    ProcessStore.queryLanguage(id, AppState.currentLanguage);
  }

  loadAllData=() => {
    const { AppState } = this.props;
    const { id } = this.state;
    const { organizationId } = AppState.currentMenuType;
    this.getProcessInfoByIds(organizationId, id);
    this.getProcessHistory(organizationId, id);
    this.getJumpDote(organizationId, id);

    this.setState({
      isLoading: false,
    });
  }

  componentWillMount=() => {
    this.fetch(this.props);
    this.loadAllData();
    this.loadLanguage();
  }

  fetch() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    ProcessStore.queryTypeLineList(organizationId);
  }

  // 根据ID查询
  getProcessInfoByIds = (organizationId, procInstId) => {
    ProcessStore.getProcessInfoById(organizationId, procInstId)
      .then((values) => {
        this.setState({
          processInfo: values,
        });
        if (values.application === 'ITSM') {
          ProcessStore.approverITSMTable(organizationId, values.eventNum, values.transactionType).then((data) => {
            this.setState({
              approverTables: data || '',
            });
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else if (values.application === 'KB') {
          ProcessStore.approverKnowledgeTable(organizationId, values.transactionId, values.transactionType).then((data) => {
            this.setState({
              approverTables: data,
            });
          });
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  // 显示流程图
  getProcessPhoto = (organizationId, procInstId) => {
    ProcessStore.getProcessPhoto(organizationId, procInstId)
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

  // 获取节点流程图

  getJumpDote =(organization, procInstId) => {
    ProcessStore.getProcessJump(organization, procInstId).then((data) => {
      this.setState({
        nodes: data,
      });
    });
  }

  approvStatus=(values) => {
    const statusLists = ProcessStore.getTypeLinelist;
    const statusType = statusLists.filter(v => (v.lookupValue === values));

    if (statusType.length > 0) {
      if (statusType[0].lookupValue == 'NEW') {
        return <span style={{ borderRadius: 2, display: 'inline-block', textAlign: 'center', color: '#00B5D9', width: 64, height: 18, background: '#E6FFFE', fontSize: 12 }}>{statusType[0].lookupMeaning}</span>;
      } else if (statusType[0].lookupValue == 'APPROVED') {
        return <span style={{ borderRadius: 2, display: 'inline-block', textAlign: 'center', color: '#52C41A', width: 64, height: 18, background: '#E2FCD6', fontSize: 12 }}>{statusType[0].lookupMeaning}</span>;
      } else if (statusType[0].lookupValue == 'PROCESSING') {
        return <span style={{ borderRadius: 2, display: 'inline-block', textAlign: 'center', color: '#2196F3', width: 64, height: 18, background: '#E6F7FF', fontSize: 12 }}>{statusType[0].lookupMeaning}</span>;
      } else if (statusType[0].lookupValue == 'REJECTED') {
        return <span style={{ borderRadius: 2, display: 'inline-block', textAlign: 'center', color: '#F5222D', width: 64, height: 18, background: '#FFF1F0', fontSize: 12 }}>{statusType[0].lookupMeaning}</span>;
      } else if (statusType[0].lookupValue == 'RECALL') {
        return <span style={{ borderRadius: 2, display: 'inline-block', textAlign: 'center', color: '#722ED1', width: 64, height: 18, background: '#F9F0FF', fontSize: 12 }}>{statusType[0].lookupMeaning}</span>;
      } else if (statusType[0].lookupValue == 'SKIP') {
        return <span style={{ borderRadius: 2, display: 'inline-block', textAlign: 'center', color: '#F08F07', width: 64, height: 18, background: '#FF9500', fontSize: 12 }}>{statusType[0].lookupMeaning}</span>;
      } else if (statusType[0].lookupValue == 'DELEGATE') {
        return <span style={{ borderRadius: 2, display: 'inline-block', textAlign: 'center', color: '#8EA200', width: 64, height: 18, background: '#EFF6BF', fontSize: 12 }}>{statusType[0].lookupMeaning}</span>;
      }
    } else {
      return values;
    }
  }

  /* 获取审批历史数据
*/
  getProcessHistory=(organizationId, procInstId) => {
    ProcessStore.getProcessHistory(organizationId, procInstId).then((values) => {
      this.setState({
        processHistory: values,
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
    const { processHistory, pagination, isLoading } = this.state;
    processHistory.forEach((v) => {
      v.key = v.approvalTime;
    });
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;

    const columns = [
      {
        title: ProcessStore.languages[`${intlPrefix}.shenPiTime`],
        dataIndex: 'approvalTime',
        key: 'approvalTime',
        filters: [],
        width: 230,
      },

      {
        title: ProcessStore.languages[`${intlPrefix}.owner`],
        dataIndex: 'approvalUserName',
        key: 'approvalUserName',
        filters: [],
        width: 200,

      },
      {
        title: ProcessStore.languages[`${intlPrefix}.shenPiSituation`],
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        filters: [],
        width: 100,
        render: (values, record) => this.approvStatus(record.approvalStatus),
      },
      {
        title: ProcessStore.languages[`${intlPrefix}.approvalTaskName`],
        dataIndex: 'approvalTaskName',
        key: 'approvalTaskName',
        filters: [],
        width: 200,

      },
      {
        title: ProcessStore.languages[`${intlPrefix}.shenPiOpinion`],
        dataIndex: 'message',
        key: 'message',
        filters: [],

      },
    ];
    return (
      <Table
        columns={columns}
        dataSource={processHistory}
        pagination={pagination}
        loading={isLoading}
        filterBar={false}
      />
    );
  }

  callBackPage=() => {
    this.props.history.goBack();
  }

  render() {
    const { intl } = this.props;
    const { AppState: { menuType: { organizationId, name } } } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { id } = this.props;
    const {
      processInfo, src,
      approverTables, nodes, prop } = this.state;
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
          style={{ position: 'relative' }}
          title={ProcessStore.languages[`${intlPrefix}.dealList`]}
          backPath={`/iam/processMonitoring?type=organization&id=${organizationId}&name=${name}&organizationId=${organizationId}`}
        />
        <Content>
          <div style={{ marginBottom: '12px', marginLeft: 11 }}><span style={{ fontSize: '17px', fontFamily: 'sans-serif', color: '#04173F' }}>{ProcessStore.languages[`${intlPrefix}.approveMatter`]}</span>
          </div>
          <div style={{ borderBottom: '1px solid #CCD3D9', width: '100.5%', marginBottom: 15 }} />
          <Row style={{ marginBottom: 35, marginTop: -5, marginLeft: 13 }}>
            <Col span={4} className="girdType">{ProcessStore.languages[`${intlPrefix}.startUserName`]}</Col>
            <Col span={8} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}>{processInfo.startUserName}</Col>

            <Col span={4} className="girdType">{ProcessStore.languages[`${intlPrefix}.applicationTime`]}</Col>
            <Col span={8} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}>{processInfo.createTime}</Col>
          </Row>
          <Row style={{ marginTop: -35, marginBottom: 35, marginLeft: 13 }}>
            <Col span={4} className="girdType">{ProcessStore.languages[`${intlPrefix}.procInstIds`]}</Col>
            <Col span={8} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}>{processInfo.codeNum}</Col>


            <Col span={4} className="girdType">{ProcessStore.languages[`${intlPrefix}.processName`]}</Col>
            <Col span={8} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}>{processInfo.processName}</Col>

          </Row>
          <Row style={{ marginTop: -35, marginBottom: 20, marginLeft: 13 }}>
            <Col span={4} className="girdType">{ProcessStore.languages[`${intlPrefix}.applicationDesc`]}</Col>
            <Col span={20} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}><span style={tableStyleName}><Tooltip title={processInfo.message} lines={40}>{processInfo.message}</Tooltip></span></Col>
          </Row>

          <Collapse bordered={false} defaultActiveKey={['1']} style={{ marginLeft: -22, borderBottomStyle: 1, marginTop: -20 }}>
            <Panel header={ProcessStore.languages[`${intlPrefix}.approveForm`]} style={{ fontSize: '17px', fontWeight: 500, borderRadius: 4, marginBottom: 24, border: 0, color: '#04173F', overflow: 'hidden' }} key="1">
              <div style={{ borderBottom: '1px solid #CCD3D9', width: '100.5%', marginLeft: 9 }} />
              <div className="wf-approver-form" dangerouslySetInnerHTML={{ __html: approverTables || '' }} />
            </Panel>
          </Collapse>

          <Tabs defaultActiveKey="1" style={{ marginTop: -30, marginLeft: -5 }}>
            <TabPane tab={<span style={{ fontSize: '17px' }}>{ProcessStore.languages[`${intlPrefix}.approvalHistory`]}</span>} key="1">
              {this.renderTable()}
            </TabPane>

            <TabPane tab={<span style={{ fontSize: '17px' }}> {ProcessStore.languages[`${intlPrefix}.flowChart`]}</span>} key="2">
              <div style={{ marginBottom: 30 }}>
                <RadioGroup defaultValue="LR" onChange={this.processControll}>
                  <RadioButton value="LR">{ProcessStore.languages[`${intlPrefix}.leftToRight`]}</RadioButton>
                  <RadioButton value="RL">{ProcessStore.languages[`${intlPrefix}.rightToLeft`]}</RadioButton>
                  <RadioButton value="TB">{ProcessStore.languages[`${intlPrefix}.topToBottom`]}</RadioButton>
                  <RadioButton value="BT">{ProcessStore.languages[`${intlPrefix}.bottomToTop`]}</RadioButton>
                </RadioGroup>
                <Tag color="#ffffff" style={{ float: 'right', color: '#000000', marginLeft: 5 }}>{ProcessStore.languages[`${intlPrefix}.jump`]}
                </Tag><Tag color="white" style={{ float: 'right', width: 35, marginRight: -5, border: '2px solid #818999' }} />
                <Tag color="#ffffff" style={{ float: 'right', color: '#000000', marginLeft: 5 }}>{ProcessStore.languages[`${intlPrefix}.currentCode`]}
                </Tag><Tag color="#FF9500" style={{ float: 'right', width: 35, marginRight: -5 }} />
                <Tag color="#ffffff" style={{ float: 'right', color: '#000000', marginLeft: 5 }}>{ProcessStore.languages[`${intlPrefix}.approved`]}
                </Tag><Tag color="green" style={{ float: 'right', width: 35, marginRight: -5, border: '2px solid' }} />
                <Tag color="#ffffff" style={{ float: 'right', color: '#000000', marginLeft: 5 }}>{ProcessStore.languages[`${intlPrefix}.notApprovet`]}
                </Tag> <Tag color="blue" style={{ float: 'right', width: 35, marginRight: -5, border: '2px solid' }} />
              </div>
              <DagreD3
                graph={{ rankdir: `${prop}` || 'LR' }} // 流程图方向
                nodes={nodes}
                onNodeClick={this.onNodeClick}
              />
            </TabPane>
          </Tabs>

        </Content>
      </Page>
    );
  }
}
export default Form.create({})(withRouter(injectIntl(ProcessEdit)));
