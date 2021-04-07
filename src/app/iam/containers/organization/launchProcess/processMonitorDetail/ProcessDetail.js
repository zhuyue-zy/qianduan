import React, { Component } from 'react';
import { Form, Table, Tooltip, Tabs, Divider, Collapse, Row, Col, Radio, Tag, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Page, Header } from 'yqcloud-front-boot';
import launchStore from '../../../../stores/organization/launchProcess/LaunchStore';
import './index.scss';
import DagreD3 from '../../../../components/dagreD3/DagreD3';


const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
const Panel = Collapse.Panel;
const intlPrefix = 'organization.processMonitoring';
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

@inject('AppState')
@observer
class ProcessDetail extends Component {
  state=this.getInitState();

  getInitState() {
    return {
      id: this.props.match.params.id,
      page: 0,
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      isLoading: true,
      processInfo: {},
      processHistory: [],
      nodes: [], // 流程图node节点
      prop: '', // 流程图方向状态值
      src: '',
      approverTables: '',
    };
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    launchStore.queryLanguage(id, AppState.currentLanguage);
  };

  loatAllData=() => {
    const { AppState } = this.props;
    const { id } = this.state;
    const { organizationId } = AppState.currentMenuType;
    this.getProcessInfoById(organizationId, id);
    this.getProcessHistory(organizationId, id);
    this.getJumpDote(organizationId, id);
    this.setState({
      isLoading: false,
    });
  };

  componentWillMount=() => {
    this.fetch(this.props);
    this.loatAllData();
    this.loadLanguage();
  };

  fetch() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    launchStore.queryTypeLineList(organizationId);
  }

  // 根据ID查询
  getProcessInfoById = (organizationId, procInstId) => {
    launchStore.getProcessInfoById(organizationId, procInstId)
      .then((values) => {
        this.setState({
          processInfo: values,
        });
        if (values.application === 'ITSM') {
          launchStore.approverITSMTable(organizationId, values.eventNum, values.transactionType).then((data) => {
            this.setState({
              approverTables: data || '',
            });
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else if (values.application === 'KB') {
          launchStore.approverKnowledgeTable(organizationId, values.transactionId, values.transactionType).then((data) => {
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
    launchStore.getProcessPhoto(organizationId, procInstId)
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
    launchStore.getProcessJump(organization, procInstId).then((data) => {
      this.setState({
        nodes: data,
      });
    });
  }


  /* 审批状态判断 */
  approvStatus=(values) => {
    const statusLists = launchStore.getTypeLinelist;
    const statusType = statusLists.filter(v => (v.lookupValue === values));
    if (statusType.length > 0) {
      if (statusType[0].lookupMeaning === '转交') {
        return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#8EA200', fontSize: 12, padding: '3px 8px', textDecoration: 'none', backgroundColor: '#EFF6BF' }}>{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '跳转') {
        return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#F08F07', fontSize: 12, padding: '3px 12px', textDecoration: 'none', backgroundColor: '#FF9500' }}>{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '审批拒绝') {
        return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#F5222D', fontSize: 12, padding: '3px 12px', textDecoration: 'none', backgroundColor: '#FFF1F0' }}>{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '审批撤回') {
        return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#722ED1', fontSize: 12, padding: '3px 12px', textDecoration: 'none', backgroundColor: '#F9F0FF' }}>{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '审批同意') {
        return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#52C41A', fontSize: 12, padding: '3px 12px', textDecoration: 'none', backgroundColor: '#E2FCD6' }}>{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '审批中') {
        return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#2196F3', fontSize: 12, padding: '3px 12px', textDecoration: 'none', backgroundColor: '#E6F7FF' }}>{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '未审批') {
        return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#00B5D9', fontSize: 12, padding: '3px 8px', textDecoration: 'none', backgroundColor: '#E6FFFE' }}>{statusType[0].lookupMeaning}</span>);
      } else {
        return statusType[0].lookupMeaning;
      }
    } else {
      return values;
    }
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

  /* 获取审批历史数据
*/
  getProcessHistory=(organizationId, procInstId) => {
    launchStore.getProcessHistory(organizationId, procInstId).then((values) => {
      this.setState({
        processHistory: values,
      });
    });
  }

  renderTable= () => {
    //  获取dataSource
    const { processHistory, pagination, isLoading } = this.state;
    processHistory.forEach((v) => {
      v.key = v.approvalTime;
    });
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;

    const columns = [
      {
        title: launchStore.languages[`${intlPrefix}.shenPiTime`],
        dataIndex: 'approvalTime',
        key: 'approvalTime',
        filters: [],
        width: 230,
      },

      {
        title: launchStore.languages[`${intlPrefix}.owner`],
        dataIndex: 'approvalUserName',
        key: 'approvalUserName',
        filters: [],
        width: 200,

      },
      {
        title: launchStore.languages[`${intlPrefix}.shenPiSituation`],
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        filters: [],
        width: 150,
        render: (values, record) => this.approvStatus(record.approvalStatus),
      },
      {
        title: launchStore.languages[`${intlPrefix}.approvalTaskName`],
        dataIndex: 'approvalTaskName',
        key: 'approvalTaskName',
        filters: [],
        width: 200,

      },
      {
        title: launchStore.languages[`${intlPrefix}.shenPiOpinion`],
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
        bordered={false}

      />
    );
  }


  render() {
    const { intl } = this.props;
    const { AppState: { menuType: { organizationId, name } } } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { id } = this.props;
    const { processInfo, src, approverTables, nodes, prop } = this.state;
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
          title={launchStore.languages[`${intlPrefix}.dealList`]}
          backPath={`/iam/launchProcess?type=organization&id=${organizationId}&name=${name}&organizationId=${organizationId}`}
        />
        <Content className="launch-content">
          <div style={{ marginBottom: '12px', marginLeft: 11 }}><span style={{ fontSize: '17px', fontFamily: 'sans-serif', color: '#04173F' }}>{launchStore.languages[`${intlPrefix}.approveMatter`]}</span>
          </div>
          <div style={{ borderBottom: '1px solid #CCD3D9', width: '100.5%', marginBottom: 15 }} />
          <Row style={{ marginBottom: 35, marginTop: -5, marginLeft: 13 }}>
            <Col span={4} className="girdType">{launchStore.languages[`${intlPrefix}.owner`]}</Col>
            <Col span={8} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}>{processInfo.startUserName}</Col>

            <Col span={4} className="girdType">{launchStore.languages[`${intlPrefix}.applicationTime`]}</Col>
            <Col span={8} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}>{processInfo.createTime}</Col>
          </Row>
          <Row style={{ marginTop: -35, marginBottom: 35, marginLeft: 13 }}>
            <Col span={4} className="girdType">{launchStore.languages[`${intlPrefix}.procInstIds`]}</Col>
            <Col span={8} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}>{processInfo.codeNum}</Col>


            <Col span={4} className="girdType">{launchStore.languages[`${intlPrefix}.processName`]}</Col>
            <Col span={8} style={{ fontSize: 14, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}>{processInfo.processName}</Col>

          </Row>
          <Row style={{ marginTop: -35, marginBottom: 20, marginLeft: 13 }}>
            <Col span={4} className="girdType">{launchStore.languages[`${intlPrefix}.applicationDesc`]}</Col>
            <Col span={20} style={{ fontSize: 17, color: '#04173F', marginBottom: 20, fontWeight: 400, fontFamily: 'PingFangSC-Regular' }}><span style={tableStyleName}><Tooltip title={processInfo.message} lines={40}>{processInfo.message}</Tooltip></span></Col>
          </Row>
          <Collapse bordered={false} defaultActiveKey={['1']} style={{ marginLeft: -22, borderBottomStyle: 1, marginTop: -20 }}>
            <Panel header={launchStore.languages[`${intlPrefix}.approveForm`]} style={{ fontSize: '17px', borderRadius: 4, marginBottom: 24, border: 0, color: '#04173F', overflow: 'hidden' }} key="1">
              <div style={{ borderBottom: '1px solid #CCD3D9', width: '100.5%', marginLeft: 9 }} />
              <div className="wf-approver-form" dangerouslySetInnerHTML={{ __html: approverTables || '' }} />
            </Panel>
          </Collapse>

          <Tabs defaultActiveKey="1" style={{ marginTop: -30, marginLeft: -5 }}>
            <TabPane tab={<span style={{ fontSize: '17px' }}> {launchStore.languages[ `${intlPrefix}.approvalHistory`]}</span>} key="1">
              {this.renderTable()}
            </TabPane>

            <TabPane tab={<span style={{ fontSize: '17px' }}> {launchStore.languages[ `${intlPrefix}.flowChart`]}</span>} key="2">
              <div style={{ marginBottom: 30 }}>
                <RadioGroup defaultValue="LR" onChange={this.processControll}>
                  <RadioButton value="LR">{launchStore.languages[`${intlPrefix}.leftToRight`]}</RadioButton>
                  <RadioButton value="RL">{launchStore.languages[`${intlPrefix}.rightToLeft`]}</RadioButton>
                  <RadioButton value="TB">{launchStore.languages[`${intlPrefix}.topToBottom`]}</RadioButton>
                  <RadioButton value="BT">{launchStore.languages[`${intlPrefix}.bottomToTop`]}</RadioButton>
                </RadioGroup>
                <Tag color="#ffffff" style={{ float: 'right', color: '#000000', marginLeft: 5 }}>{launchStore.languages[`${intlPrefix}.jump`]}
                </Tag><Tag color="white" style={{ float: 'right', width: 35, marginRight: -5, border: '2px solid #818999' }} />
                <Tag color="#ffffff" style={{ float: 'right', color: '#000000', marginLeft: 5 }}>{launchStore.languages[`${intlPrefix}.currentCode`]}
                </Tag><Tag color="#FF9500" style={{ float: 'right', width: 35, marginRight: -5 }} />
                <Tag color="#ffffff" style={{ float: 'right', color: '#000000', marginLeft: 5 }}>{launchStore.languages[`${intlPrefix}.approved`]}
                </Tag><Tag color="green" style={{ float: 'right', width: 35, marginRight: -5, border: '2px solid' }} />
                <Tag color="#ffffff" style={{ float: 'right', color: '#000000', marginLeft: 5 }}>{launchStore.languages[`${intlPrefix}.notApprovet`]}
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
export default Form.create({})(withRouter(injectIntl(ProcessDetail)));
