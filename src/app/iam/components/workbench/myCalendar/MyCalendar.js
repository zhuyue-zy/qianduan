import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { Calendar, Badge, Card, Button, Icon, Dropdown, Menu } from 'yqcloud-ui';

/**
 *  日历
 */
class MyCalender extends Component {
  render() {
    const { data } = this.props;
    const tableStyle = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
    };

    return (
      <Card
        title={<span><Icon type="versionline" /><FormattedMessage id="calendar" /></span>}
        className="workBenchCard"
        bordered={false}
        hoverable
        extra={(<Icon type="more_horiz" />)}
        bodyStyle={{ height: '100%' }}
      >

      </Card>
    );
  }
}

export default MyCalender;
