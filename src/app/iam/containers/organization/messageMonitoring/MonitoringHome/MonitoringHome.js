/**
 * Created by Administrator on 2018-11-9 0009.
 */
import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content, Permission, Action } from 'yqcloud-front-boot';
import {
  Row, Col, Form, Card, Button, Table, Tabs, Modal, Tooltip, Input,
} from 'yqcloud-ui';
import MonitoringStore from '../../../../stores/organization/messageMonitoring';
import './index.scss';
import workFlowStore from '../../../../stores/organization/workFlowTest';

const intlPrefix = 'message.monitoring';
const { TextArea } = Input;

@inject('AppState')
@observer
class MonitoringHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      dataSource: [],
      visible: false, // 内容 查看弹出框
      visibleform: false, // 收件人 查看弹出框
      errorvisible: false, // 错误 查看弹出框
      dataContent: '', // 内容弹框接口接收的数据
      dataAddressee: [], // 收件人弹框接口接收的数据
      dataError: '', // 错误信息弹框接口接收的收据
      messageId: '',
      loading: false,
      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadMonitoring();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    MonitoringStore.queryLanguage(id, AppState.currentLanguage);
  }

  fetch() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    MonitoringStore.getApplicationTypes(organizationId);
    MonitoringStore.getTransaction(organizationId);
    MonitoringStore.getIsEnabled(organizationId);
    MonitoringStore.getMessageTypes(organizationId);
  }

  // 消息信息查询
  loadMonitoring = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const page = paginationIn || paginationState;
    const params = paramsIn || paramsState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    Object.keys(filters).forEach((i) => {
      if (i === 'transactionName') {
        filters.transactionNameList = [filtersIn.transactionName];
      }
    });
    MonitoringStore.loadquerylist(organizationId, page, params, sort, filters).then((data) => {
      this.setState({
        dataSource: data.content,
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
          pageSizeOptions: ['25', '50', '100', '200'],
        },
      });
    }).catch(error => Choerodon.handleResponseError(error));
  };

  // 消息信息分页处理
  handlePageChange = (pagination, filters, { field, order }, params) => {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadMonitoring(pagination, sorter.join(','), filters, params);
  };

  // 内容弹框
  onLookover = (record) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    MonitoringStore.loadcontent(organizationId, record.messageId).then((data) => {
      if (data) {
        this.setState({
          visible: true,
          dataContent: data,
        });
      }
    }).catch(error => Choerodon.handleResponseError(error));
  };

  // 收件人弹框
  onAddressee = (messageId) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    MonitoringStore.loadaddressee(organizationId, messageId).then((data) => {
      if (data) {
        this.setState({
          visibleform: true,
          dataAddressee: data,
        });
      }
    }).catch(error => Choerodon.handleResponseError(error));
  };

  // 错误弹框
  onError = (messageId) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    MonitoringStore.loaderror(organizationId, messageId).then((data) => {
      this.setState({
        errorvisible: true,
        dataError: data,
      });
    }).catch(error => Choerodon.handleResponseError(error));
  };

  // 弹框确定按钮关闭弹框
  handleOk = () => {
    this.setState({ loading: true });
    setTimeout(() => {
      this.setState({ loading: false, visible: false, visibleform: false, errorvisible: false });
    }, 100);
  };

  // 应用系统快码解析
  applicationCodeState=(values) => {
    const typeLists = MonitoringStore.getApplicationCodeList;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  // 事务名称快码解析
  transactionNameState=(values) => {
    const typeLists = MonitoringStore.getTransactionNameList;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  // 消息类型快码
  messageTypeState=(values) => {
    const messageTypes = MonitoringStore.getMessageType;
    const temp = messageTypes.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  enabledState = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const enabled = MonitoringStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      if (temp[0].lookupMeaning === '成功') {
        return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#eee', fontSize: 12, padding: '3px 8px', textDecoration: 'none', backgroundColor: '#6CC846' }}>{temp[0].lookupMeaning}</span>);
      } else if (temp[0].lookupMeaning === '失败') {
        return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#eee', fontSize: 12, padding: '3px 8px', textDecoration: 'none', backgroundColor: '#8092C0' }}>{temp[0].lookupMeaning}</span>);
      }
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }


  render() {
    const { intl } = this.props;
    const {
      pagination, params, dataSource, dataError, dataContent,
      dataAddressee, visible, loading, visibleform, errorvisible,
    } = this.state;
    const ApplicationCodes = MonitoringStore.getApplicationCodeList; // 应用系统快码
    const applicationOption = [];
    const applicationText = [];
    const transactionNames = MonitoringStore.getTransactionNameList; // 事务名称快码
    const transactionNameOption = [];
    const transactionNameText = [];
    const messageTypes = MonitoringStore.getMessageType; // 消息通知类型
    const messageOption = [];
    const messageText = [];

    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '150px',
      wordBreak: 'normal',
    };

    const messageStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '180px',
      wordBreak: 'normal',
    };
    ApplicationCodes.forEach((item) => {
      applicationOption.push({ text1: item.lookupMeaning, value1: item.lookupValue });
    });
    applicationOption.forEach((values) => {
      applicationText.push({ text: values.text1, value: values.value1 });
    });
    transactionNames.forEach((item) => {
      transactionNameOption.push({ text2: item.lookupMeaning, value2: item.lookupValue });
    });
    transactionNameOption.forEach((values) => {
      transactionNameText.push({ text: values.text2, value: values.value2 });
    });
    messageTypes.forEach((item) => {
      messageOption.push({ text3: item.lookupMeaning, value3: item.lookupValue });
    });
    messageOption.forEach((values) => {
      messageText.push({ text: values.text3, value: values.value3 });
    });
    const columns = [{
      title: MonitoringStore.languages[`${intlPrefix}.message.notification.type`],
      dataIndex: 'messageType',
      key: 'messageType',
      width: 120,
      filters: messageText,
      render: (values, record) => this.messageTypeState(record.messageType),
    },
    {
      title: MonitoringStore.languages[`${intlPrefix}.application.system`],
      dataIndex: 'applicationCode',
      key: 'applicationCode',
      width: 100,
      filters: applicationText,
      render: (values, record) => this.applicationCodeState(record.applicationCode),
    },
    {
      title: MonitoringStore.languages[`${intlPrefix}.transaction.name`],
      dataIndex: 'transactionName',
      width: 150,
      key: 'transactionName',
      filters: transactionNameText,
      filterMultiple: true,
      // filteredValue: filters.transactionName || [],
      render: (values, record) => this.transactionNameState(record.transactionName),

    },

    {
      title: MonitoringStore.languages[`${intlPrefix}.message.title`],
      dataIndex: 'subject',
      width: 150,
      key: 'subject',
      filters: [],
      render: (values, record) => (
        <span style={tableStyleName}>
          <Tooltip title={values} lines={20}>
            <div style={{ textAlign: 'left' }}>{`${record.subject}` === 'null' ? '' : `${record.subject}` }</div>
          </Tooltip>
        </span>
      ),
    },
    {
      title: MonitoringStore.languages[`${intlPrefix}.message.sending.time`],
      dataIndex: 'creationDate',
      width: 150,
      key: 'creationDate',
    },
    {
      title: MonitoringStore.languages[`${intlPrefix}.sending.state`],
      dataIndex: 'isSend',
      key: 'isSend',
      width: 100,
      filters: [{
        text: MonitoringStore.languages[`${intlPrefix}.isSend.y`],
        value: 'true',
      }, {
        text: MonitoringStore.languages[`${intlPrefix}.isSend.n`],
        value: 'false',
      }],
      render: (values, record) => this.enabledState(record.isSend),
    },
    {
      title: MonitoringStore.languages[`${intlPrefix}.content`],
      width: 80,
      render: record => (
        <a onClick={this.onLookover.bind(this, record)}>
          {MonitoringStore.languages[`${intlPrefix}.see`]}
        </a>
      ),
    },
    {
      title: MonitoringStore.languages[`${intlPrefix}.addressee`],
      width: 80,
      render: record => (
        <a onClick={this.onAddressee.bind(this, record.messageId)}>
          {MonitoringStore.languages[`${intlPrefix}.see`]}
        </a>
      ),
    },
    {
      title: MonitoringStore.languages[`${intlPrefix}.error`],
      width: 80,
      render: record => (
        record.isSend !== true ? (
          <a onClick={this.onError.bind(this, record.messageId)}>
            {MonitoringStore.languages[`${intlPrefix}.see`]}
          </a>
        ) : (null)
      ),
    },
    ];
    const columnsdata = [{
      title: MonitoringStore.languages[`${intlPrefix}.receiving.address`],
      dataIndex: 'messageAddress',
      key: 'messageAddress',
    }, {
      title: MonitoringStore.languages[`${intlPrefix}.isSuccess.type`],
      dataIndex: 'success',
      key: 'success',
      render: (values, record) => this.enabledState(record.success),
    }];
    const errordata = [{
      title: MonitoringStore.languages[`${intlPrefix}.error.address`],
      dataIndex: 'address',
      key: 'address',
    }, {
      title: MonitoringStore.languages[`${intlPrefix}.error.message`],
      dataIndex: 'message',
      key: 'message',
      render: (values, record) => (
        <span style={messageStyleName}>
          <Tooltip title={values} lines={20}>
            <div style={{ textAlign: 'left' }}>{`${record.message}` === 'null' ? '' : `${record.message}` }</div>
          </Tooltip>
        </span>
      ),
    }];
    return (
      <Page>
        <Header title={MonitoringStore.languages[`${intlPrefix}.messageMonitoring`]} />
        <Content
          className="message-content"
        >
          <Table
            size="middle"
            columns={columns}
            pagination={pagination}
            rowKey="id"
            dataSource={dataSource}
            onChange={this.handlePageChange.bind(this)}
            loading={MonitoringStore.isLoading}
            filters={params}
          />
          <Modal
            visible={visible}
            title={MonitoringStore.languages[`${intlPrefix}.content`]}
            className="modal-contents"
            onOk={this.handleOk}
            destroyOnClose // 关闭时销毁 Modal 里的子元素
            onCancel={this.handleOk}
            footer={[
              <Button
                key="submit"
                type="primary"
                funcType="raised"
                loading={loading}
                onClick={this.handleOk}
                style={{ backgroundColor: '#2196f3', borderRadius: 5, marginRight: 30 }}
              >
                {MonitoringStore.languages.ok}
              </Button>,
            ]}
          >
            <div style={{ paddingBottom: 10 }} dangerouslySetInnerHTML={{ __html: dataContent }} />
          </Modal>
          <Modal
            visible={visibleform}
            title={MonitoringStore.languages[`${intlPrefix}.addressee`]}
            className="modal-contents"
            destroyOnClose // 关闭时销毁 Modal 里的子元素
            onCancel={this.handleOk}
            footer={[
              <Button
                key="submit"
                type="primary"
                funcType="raised"
                loading={loading}
                style={{ backgroundColor: '#2196f3', borderRadius: 5, marginRight: 30 }}
                onClick={this.handleOk}
              >
                {MonitoringStore.languages.ok}
              </Button>,
            ]}
          >
            <Table
              columns={columnsdata}
              rowKey="id"
              dataSource={dataAddressee}
              pagination={false}
              filterBar={false}
            />
          </Modal>
          <Modal
            visible={errorvisible}
            title={MonitoringStore.languages[`${intlPrefix}.error`]}
            className="modal-contents"
            destroyOnClose // 关闭时销毁 Modal 里的子元素
            onCancel={this.handleOk}
            footer={[
              <Button
                key="submit"
                type="primary"
                funcType="raised"
                loading={loading}
                onClick={this.handleOk}
                style={{ backgroundColor: '#2196f3', borderRadius: 5, marginRight: 30 }}

              >
                {MonitoringStore.languages.ok}
              </Button>,
            ]}
          >
            <Table
              columns={errordata}
              rowKey="id"
              dataSource={dataError}
              pagination={false}
              filterBar={false}
            />
          </Modal>
        </Content>
      </Page>
    );
  }
}


export default withRouter(injectIntl(MonitoringHome));
