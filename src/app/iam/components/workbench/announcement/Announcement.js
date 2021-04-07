import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Table, Card, Icon, Badge, Button, Dropdown, Menu, Modal } from 'yqcloud-ui';
import Ellipsis from '../ellipsis';
import './Announcement.scss';

/**
 *  公告
 */

@injectIntl
@inject('AppState')
@observer
class Announcement extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      announcementNoView: '',
      preview: false,
      pagination: {
        current: 1,
        pageSize: 25,
        total: 0,
        pageSizeOptions: [25, 50, 100, 200],
      },
    };
  }

  render() {
    const { announcementNoView, pagination } = this.state;
    const tableStyle = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
    };

    const noticeColumns = [{
      // title: '公告标题',
      dataIndex: 'title',
      key: 'title',
      width: '30%',
    }, {
      // title: '对象',
      dataIndex: 'createByName',
      key: 'createByName',
      width: '25%',
      render: text => <span style={tableStyle}><Ellipsis lines={50} tooltip>{text}</Ellipsis></span>,
    }, {
      // title: '时间 年月日',
      dataIndex: 'startTime',
      key: 'startTime',
      width: '25%',
      render: text => <span style={tableStyle}><Ellipsis lines={50} tooltip>{text}</Ellipsis></span>,
    }];

    return (
      <Card
        className="AnnouncementCard workBenchCard"
        title={(
          <span>
            <Icon type="versionline" />
            <FormattedMessage id="announcement" />
            <Badge count={announcementNoView} showZero={false} style={{ backgroundColor: '#750075', marginLeft: '5px' }} />
          </span>
        )}
        bordered={false}
        hoverable
        extra={(<Icon type="more_horiz" />)}
        bodyStyle={{ height: '100%' }}
      >
        <Table
          className="AnnouncementTable"
          dataSource={this.props.data}
          columns={noticeColumns}
          filterBar={false}
          showHeader={false}
          pagination={pagination}
          scroll={{ y: 150 }}
        />
      </Card>
    );
  }
}

export default Announcement;
