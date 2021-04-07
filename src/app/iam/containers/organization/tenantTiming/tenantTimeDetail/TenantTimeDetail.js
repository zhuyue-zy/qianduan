import React from 'react';
import { Table,  Tabs, Button, Row, Col, Modal } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom'
import { Content, Page, Header, axios } from 'yqcloud-front-boot';
import tenantTimeStore from "../../../../stores/organization/tenantTimeTask/TeantTimeStore";
const intlPrefix = 'organization.TenantTime';
import './detail.scss';
const { TabPane } = Tabs;

@inject('AppState')
@observer
class TenantTimeDetail extends React.Component{
  state = this.getInitState();
  getInitState() {
    return{
      edit: !!this.props.match.params.id, // 页面是否是编辑状态
      id: this.props.match.params.id,
      isLoading: true,
      tenantInfo: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      sort: '',
      dataSource: [],
      logSource: [],
      visible: false,
      resultContent: ''
    }
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }

  fetch(){
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    tenantTimeStore.getLogsStatus(organizationId);
    tenantTimeStore.getTimeTasks(organizationId);
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    tenantTimeStore.queryLanguage(id, AppState.currentLanguage);
  };

  componentDidMount = () => {
    const { AppState } = this.props;
    const { id } = this.state;
    const { organizationId } = AppState.currentMenuType;
    if (id){
      this.getTenantContent(organizationId, id);
    }
  }

  logState = (values) => {
    const enabled = tenantTimeStore.getLogStatus;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  /**
   *  任务日志数据
   */
  initHistory = (paginationIn, sortIn, filtersIn) => {
    const { pagination: paginationState, sort: sortState, filters: filtersState, tenantInfo} = this.state;
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    tenantTimeStore.getTimeLogInfo(
      id,
      pagination,
      sort,
      filters,
      tenantInfo.taskId,
    ).then((data) => {
      this.setState({
        pagination: {
          current: (data.number || 0) + 1,
          pageSize: data.size || 25,
          total: data.totalElements || '',
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        filters,
        sort,
        logSource: data.content,
      });
    });
  };

  handlePageChange(pagination, filters, { field, order }) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.initHistory(pagination, sorter.join(','), filters);
  }



  getTenantContent=(organizationId, id) => {
    tenantTimeStore.getTenantEdit(organizationId, id).then((data) => {
      this.setState({
        tenantInfo: data,
        dataSource: data.taskParams,
      })
    })
  }

  // 内容弹框
  onLookover = (record) => {
    this.setState({
      visible: true,
      resultContent: record,
    });
  }

  // 弹框确定按钮关闭弹框
  handleOk = () => {
    this.setState({
      visible: false,
    });
  };

  changeTab=(key) => {
    if (key === '2'){
      this.initHistory();
    }
  }

  render() {
    const { AppState: { menuType: { organizationId, name } }, form } = this.props;
    const { dataSource, tenantInfo, logSource, pagination, visible, resultContent } =this.state;
    const { taskName, description, startTime, endTime, triggerType, nextExecutionTime, cronExpression,taskSiteName, repeatInterval, repeatCount, repeatUnit } =tenantInfo;
    tenantTimeStore.getLogStatus;
    let tenantMeaning = '';
    const tenantTimeList =tenantTimeStore.getTaskTime;
    if (repeatUnit) {
      const tenantTime =tenantTimeList.filter(v => (v.lookupValue === repeatUnit ));
      if (tenantTime.length > 0) {
        tenantMeaning = tenantTime[0].lookupMeaning;
      }
    }
    const columns =[   {
      title: tenantTimeStore.languages[`${intlPrefix}.paramName`],
      dataIndex: 'paramName',
      key: 'paramName',
      filters: [],
    }, {
      title: tenantTimeStore.languages[`${intlPrefix}.paramDescription`],
      dataIndex: 'description',
      key: 'description',
      filters: [],
    }, {
      title: tenantTimeStore.languages[`${intlPrefix}.paramTypeCode`],
      dataIndex: 'paramTypeCode',
      key: 'paramTypeCode',
      filters: [],
    }, {
      title: tenantTimeStore.languages[`${intlPrefix}.value`],
      dataIndex: 'value',
      key: 'value',
      filters: [],
    }]

    const logColumns =[{
      title: tenantTimeStore.languages[`${intlPrefix}.taskName`],
      dataIndex: 'taskName',
      key: 'taskName',
      filters: [],
    },{
      title: tenantTimeStore.languages.status,
      dataIndex: 'status',
      key: 'status',
      filters: [{
        text: tenantTimeStore.languages.success,
        value: 'SUCCESS',
      },{
        text: tenantTimeStore.languages.error,
        value: 'FAIL',
      }],
      render:(text, record) => this.logState(record.status)
    },{
      title: tenantTimeStore.languages[`${intlPrefix}.result`],
      dataIndex: 'result',
      key: 'result',
      render: record => (
        <a onClick={this.onLookover.bind(this, record)}>
          {tenantTimeStore.languages[`${intlPrefix}.see.result`]}
        </a>
      ),
    },{
      title: tenantTimeStore.languages[`${intlPrefix}.lastExecuteTime`],
      dataIndex: 'lastExecutionTime',
      key: 'lastExecutionTime',
    },{
      title: tenantTimeStore.languages[`${intlPrefix}.planStartTime`],
      dataIndex: 'startTime',
      key: 'startTime',
    },{
      title: tenantTimeStore.languages[`${intlPrefix}.nextExecuteTime`],
      dataIndex: 'nextStartTime',
      key: 'nextStartTime',
    },]
    return (
      <Page>
      <Header
        backPath={`/iam/tenantTime?type=organization&id=${organizationId}&name=${name}&organizationId=${organizationId}`}
        title={tenantTimeStore.languages[`${intlPrefix}.header.detail`]}/>
        <Content class="detail-time">
          <Tabs defaultActiveKey="1" onChange={this.changeTab}>
            <TabPane
              tab={<span style={{ fontSize:14 }}>{tenantTimeStore.languages[`${intlPrefix}.taskInfomation`]}</span>}
              key="1"
            >
              <Row class="detail-Row" style={{ padding: '10px 15px' }}>
                <Col span={2}>
                  <span style={{ color: '#818999', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {tenantTimeStore.languages[`${intlPrefix}.taskName`]}
                  </span>
                </Col>
                <Col span={8}>
                  <span style={{ color: '#04173F', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {taskName}
                  </span>
                </Col>
              </Row>
              <Row style={{ padding: '10px 15px' }}>
                <Col span={2}>
                  <span style={{ color: '#818999', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {tenantTimeStore.languages[`${intlPrefix}.description`]}
                  </span>
                </Col>
                <Col span={8}>
                  <span style={{ color: '#04173F', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {description}
                  </span>
                </Col>
              </Row>
                <Row style={{ padding: '10px 15px' }}>
                <Col span={2}>
                  <span style={{ color: '#818999', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {tenantTimeStore.languages[`${intlPrefix}.startTime`]}
                  </span>
                </Col>
                <Col span={4}>
                  <span style={{ color: '#04173F', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {startTime}
                  </span>
                </Col>
                <Col span={2}>
                  <span style={{ color: '#818999', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {tenantTimeStore.languages[`${intlPrefix}.endTime`]}
                  </span>
                </Col>
                <Col span={4}>
                  <span style={{ color: '#04173F', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {endTime}
                  </span>
                </Col>
              </Row>
              <Row style={{ padding: '10px 15px' }}>
                <Col span={2}>
                  <span style={{ color: '#818999', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {tenantTimeStore.languages[`${intlPrefix}.triggerType`]}
                  </span>
                </Col>
                <Col span={8}>
                  <span style={{ color: '#04173F', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {tenantInfo.triggerType === 'SIMPLE' ? tenantTimeStore.languages[`${intlPrefix}.simpleTask`] : tenantTimeStore.languages[`${intlPrefix}.CronTask`]}
                  </span>
                </Col>
              </Row>
              <Row style={{ padding: '10px 15px', display: tenantInfo.triggerType === 'SIMPLE' ? '': 'none' }}>
                <Col span={2}>
                  <span style={{ color: '#818999', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                   {tenantTimeStore.languages[`${intlPrefix}.repeatInterval`]}
                  </span>
                </Col>
                <Col span={8}>
                  <span style={{ color: '#04173F', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {repeatInterval} {tenantMeaning}
                  </span>
                </Col>
              </Row>
                  <Row style={{ padding: '10px 15px', display: tenantInfo.triggerType === 'SIMPLE' ? '': 'none' }}>
                    <Col span={2}>
                  <span style={{ color: '#818999', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                   {tenantTimeStore.languages[`${intlPrefix}.repeatCount`]}
                  </span>
                    </Col>
                    <Col span={8}>
                  <span style={{ color: '#04173F', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {repeatCount} {tenantTimeStore.languages['detail.times']}
                  </span>
                    </Col>
                  </Row>
             <Row style={{ padding: '10px 15px', display: triggerType === 'SIMPLE' ? 'none': '' }}>
                <Col span={2}>
                  <span style={{ color: '#818999', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                   {tenantTimeStore.languages[`${intlPrefix}.cronExpression`]}
                  </span>
                </Col>
                <Col span={8}>
                  <span style={{ color: '#04173F', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {cronExpression}
                  </span>
                </Col>
              </Row>
              <Row style={{ padding: '10px 15px' }}>
                <Col span={2}>
                  <span style={{ color: '#818999', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {tenantTimeStore.languages[`${intlPrefix}.nextExecuteTime`]}
                  </span>
                </Col>
                <Col span={8}>
                  <span style={{ color: '#04173F', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {nextExecutionTime}
                  </span>
                </Col>
              </Row>
              <Row style={{ padding: '10px 15px' }}>
                <Col span={2}>
                  <span style={{ color: '#818999', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {tenantTimeStore.languages[`${intlPrefix}.executionTask`]}
                  </span>
                </Col>
                <Col span={8}>
                  <span style={{ color: '#04173F', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {taskSiteName}
                  </span>
                </Col>
              </Row>
              <Row style={{ padding: '10px 15px' }}>
                <Col span={2}>
                  <span style={{ color: '#818999', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {tenantTimeStore.languages[`${intlPrefix}.paramData`]}
                  </span>
                </Col>
              </Row>
              <Row>
                <Table
                  columns={columns}
                  dataSource={dataSource}
                  filterBar={false}
                  pagination={false}
                />
              </Row>

            </TabPane>
            <TabPane
              tab={<span style={{ fontSize:14 }}>{tenantTimeStore.languages[`${intlPrefix}.taskLog`]}</span>}
              key="2"
            >
              <Table
                columns={logColumns}
                dataSource={logSource}
                pagination={pagination}
                loading={tenantTimeStore.isLoading}
                onChange={this.handlePageChange.bind(this)}
              />
            </TabPane>
          </Tabs>
          <Modal
            visible={visible}
            title={tenantTimeStore.languages[`${intlPrefix}.content`]}
            onOk={this.handleOk}
            onCancel={this.handleOk}
            className="time-content"
            footer={[
              <Button
                onClick={this.handleOk}
                style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
                type="primary"
                funcType="raised"
              >
                {tenantTimeStore.languages.ok}
              </Button>,
              <Button
                onClick={this.handleOk}
                funcType="raised"
                style={{ marginRight: '15px' }}
              >
                {tenantTimeStore.languages.cancel}
              </Button>,
            ]}
            destroyOnClose
            zIndex={1000}
            style={{ height: 300 }}
          >
            <div style={{ paddingBottom: 10, paddingTop: 10 }} dangerouslySetInnerHTML={{ __html: resultContent }} />
          </Modal>
        </Content>
      </Page>
    );
  }

}
export default TenantTimeDetail;
