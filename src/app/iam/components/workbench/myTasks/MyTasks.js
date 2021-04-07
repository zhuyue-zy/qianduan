import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Table, Badge, Card, Button, Icon, Dropdown, Menu, Tabs } from 'yqcloud-ui';
import Ellipsis from '../ellipsis';
import './MyTasks.scss';

/**
 *  我的事项
 */
const { TabPane } = Tabs;

@injectIntl
@inject('AppState')
@observer
class MyTasks extends Component {
  getInitState() {
    return {
      donePagination: {
        current: 1,
        pageSize: 25,
        total: 0,
        pageSizeOptions: [25, 50, 100, 200],
      },
      todoPagination: {
        current: 1,
        pageSize: 25,
        total: 0,
        pageSizeOptions: [25, 50, 100, 200],
      },
    };
  }

  constructor(props) {
    super(props);
    this.state = this.getInitState();
  }

  render() {
    const { preview, data } = this.props;
    const { donePagination, todoPagination } = this.state;

    const tableStyle = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
    };

    const taskColumns = [{
      title: <span style={tableStyle}><Ellipsis lines={50} tooltip>序号</Ellipsis></span>,
      dataIndex: 'key',
      key: 'key',
      width: '70px',
      render: text => (
        <a>
          <span style={tableStyle}>
            <Ellipsis lines={50} tooltip>{text}</Ellipsis>
          </span>
        </a>
      ),
    }, {
      title: (
        <span style={tableStyle}>
          <Ellipsis lines={50} tooltip>主题</Ellipsis>
        </span>),
      dataIndex: 'backlogTheme',
      key: 'backlogTheme',
      render: text => (
        <span style={tableStyle}>
          <Ellipsis lines={50} tooltip>{text}</Ellipsis>
        </span>),
    }, {
      title: (
        <span style={tableStyle}>
          <Ellipsis lines={50} tooltip>状态</Ellipsis>
        </span>),
      dataIndex: 'backlogStatus',
      key: 'backlogStatus',
      render: text => (<span style={tableStyle}><Ellipsis lines={50} tooltip>{text}</Ellipsis></span>),
    }, {
      title: <span style={tableStyle}><Ellipsis lines={50} tooltip>操作人</Ellipsis></span>,
      dataIndex: 'backlogSingles',
      key: 'backlogSingles',
      render: text => <span style={tableStyle}><Ellipsis lines={50} tooltip>{text}</Ellipsis></span>,
    }, {
      title: <span style={tableStyle}><Ellipsis lines={50} tooltip>优先级</Ellipsis></span>,
      dataIndex: 'backlogPriority',
      key: 'backlogPriority',
      render: text => <span style={tableStyle}><Ellipsis lines={50} tooltip>{text}</Ellipsis></span>,
    }, {
      title: <span style={tableStyle}><Ellipsis lines={50} tooltip>更新时间</Ellipsis></span>,
      dataIndex: 'backlogUpdateTime',
      key: 'backlogUpdateTime',
      render: text => <span style={tableStyle}><Ellipsis lines={50} tooltip>{text}</Ellipsis></span>,
    }];

    return (
      <Card
        className="MyTasksCard workBenchCard"
        title={(
          <span><Icon type="versionline" />
            <span style={{ marginLeft: '10px' }}>我的事项</span>
            <Badge count="" showZero={false} style={{ backgroundColor: '#750075', marginLeft: '5px' }} />
          </span>
        )}
        bordered={false}
        hoverable
        extra={(<Icon type="more_horiz" />)}
        bodyStyle={{ height: '100%' /* border: 'solid 1px blue' */}}
      >
        <Tabs
          defaultActiveKey="1"
          size="small"
          style={{ marginTop: '2px' }}
        >

          <TabPane tab={<FormattedMessage id="todoList" />} key="1">
            <Table
              className="MyTaskTable1"
              dataSource={data.userBacklog}
              columns={taskColumns}
              filterBar={false}
              pagination={todoPagination}
              // scroll={{ y: 150 }}
            />
          </TabPane>
          <TabPane tab={<FormattedMessage id="doneMatter" />} key="2">
            <Table
              className="MyTaskTable2"
              dataSource={data.userAlreadyBacklog}
              columns={taskColumns}
              filterBar={false}
              pagination={donePagination}
              // scroll={{ y: 150 }}
            />
          </TabPane>
        </Tabs>
      </Card>
    );
  }
}

export default MyTasks;
