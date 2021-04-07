import React from 'react';
import { Modal, Table, Button, Tooltip } from 'yqcloud-ui';
import { inject, observer } from 'mobx-react';
import { injectIntl } from 'react-intl';
import { Content, Page, Header } from 'yqcloud-front-boot';
import TimedTaskHistoryStore from '../../../../stores/organization/timedTask/TimedTaskHistoryStore';
import './TimedTaskHistory.scss';

const intlPrefix = 'organization.timedTask';

@inject('AppState')
@observer
class TimedTaskHistory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      sort: '',
      dataSource: [], //  存放历史数据
      visible: false,
      resultContent: '',
    };
  }

  componentWillMount() {
    this.initHistory();
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    TimedTaskHistoryStore.queryLanguage(0, AppState.currentLanguage);
  };

  /**
   *  初始化数据
   */
   initHistory = (paginationIn, sortIn, filtersIn, paramsIn) => {
     const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
     const { AppState } = this.props;
     const { id } = AppState.currentMenuType;
     const pagination = paginationIn || paginationState;
     const sort = sortIn || sortState;
     const filters = filtersIn || filtersState;
     const params = paramsIn || paramsState;
     TimedTaskHistoryStore.loadHistory(
       id,
       pagination,
       sort,
       filters,
       params,
     ).then((data) => {
       this.setState({
         pagination: {
           current: (data.number || 0) + 1,
           pageSize: data.size || 25,
           total: data.totalElements || '',
           pageSizeOptions: ['25', '50', '100', '200'],
         },
         filters,
         params,
         sort,
         dataSource: data.content,
       });
     });
   };

   handlePageChange(pagination, filters, { field, order }, params) {
     const sorter = [];
     if (field) {
       sorter.push(field);
       if (order === 'descend') {
         sorter.push('desc');
       }
     }
     this.initHistory(pagination, sorter.join(','), filters, params);
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

  /**
   *  渲染表格
   */
  renderTable = () => {
    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '200px',
      wordBreak: 'normal',
    };
    const { intl } = this.props;
    const columns = [{
      title: TimedTaskHistoryStore.languages[`${intlPrefix}.columns.jobGroup`],
      dataIndex: 'jobGroup',
      key: 'jobGroup',
    }, {
      title: TimedTaskHistoryStore.languages[`${intlPrefix}.columns.triggerState`],
      dataIndex: 'status',
      key: 'status',
      render: status => (status === 'SUCCESS' ? '成功' : '失败'),
    }, {
      title: TimedTaskHistoryStore.languages[`${intlPrefix}.columns.requestService`],
      dataIndex: 'requestService',
      key: 'requestService',
    }, {
      title: TimedTaskHistoryStore.languages[`${intlPrefix}.columns.resCode`],
      dataIndex: 'resCode',
      key: 'resCode',
    },
    {
      title: TimedTaskHistoryStore.languages[`${intlPrefix}.columns.result`],
      dataIndex: 'result',
      key: 'result',
      render: record => (
        <a onClick={this.onLookover.bind(this, record)}>
          {TimedTaskHistoryStore.languages[`${intlPrefix}.see.result`]}
        </a>
      ),
    }, {
      title: TimedTaskHistoryStore.languages[`${intlPrefix}.columns.lastUpdateDate`],
      dataIndex: 'startTime',
      key: 'startTime',
    }, {
      title: TimedTaskHistoryStore.languages[`${intlPrefix}.columns.plannedExeTime`],
      dataIndex: 'planTime',
      key: 'planExeTime',
    }, {
      title: TimedTaskHistoryStore.languages[`${intlPrefix}.columns.nextExeTime`],
      dataIndex: 'nextTime',
      key: 'nextTime',
    }, {
      title: TimedTaskHistoryStore.languages[`${intlPrefix}.columns.exactExeTime`],
      dataIndex: 'actualTime',
      key: 'actualTime',
    }];
    const { pagination, dataSource } = this.state;
    return (
      <Table
        filterBar={false}
        columns={columns}
        dataSource={dataSource}
        pagination={pagination}
        loading={TimedTaskHistoryStore.isLoading}
        onChange={this.handlePageChange.bind(this)}
      />
    );
  };

  render() {
    const { visible, resultContent } = this.state;
    return (
      <Page>
        <Header
          title={TimedTaskHistoryStore.languages[`${intlPrefix}.header.history`]}
          backPath="/iam/timedTask"
        />
        <Content>
          {this.renderTable()}
        </Content>
        <Modal
          visible={visible}
          title={TimedTaskHistoryStore.languages[`${intlPrefix}.content`]}
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
              {TimedTaskHistoryStore.languages.ok}
            </Button>,
            <Button
              onClick={this.handleOk}
              funcType="raised"
              style={{ marginRight: '15px' }}
            >
              {TimedTaskHistoryStore.languages.cancel}
            </Button>,
          ]}
          destroyOnClose
          zIndex={1000}
          style={{ height: 300 }}
        >
          <div style={{ paddingBottom: 10, paddingTop: 10 }} dangerouslySetInnerHTML={{ __html: resultContent }} />
        </Modal>
      </Page>);
  }
}


export default injectIntl(TimedTaskHistory);
