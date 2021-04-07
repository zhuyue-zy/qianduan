import React, { Component } from 'react';
import { Table, Icon, Card, Tabs } from 'yqcloud-ui';
import { FormattedMessage } from 'react-intl';

/**
 *  知识库
 */
const { TabPane } = Tabs;

class KnowledgeBase extends Component {
  render() {
    const { data } = this.props;

    const knowledgeBaseColumns = [{
      // title: '图标',
      dataIndex: 'knowledgeIcon',
      key: 'knowledgeIcon',
      width: '10px',
      fixed: 'left',
      render: () => <Icon type="quality" />,
    }, {
      // title: '知识类别',
      dataIndex: 'knowledgeCategory',
      key: 'knowledgeCategory',
      width: '30%',
      // fixed: 'right',
    }, {
      // title: '知识标题',
      dataIndex: 'knowledgeTitle',
      key: 'knowledgeTitle',
      width: '30%',
      render: text => <a href="http://www.baidu.com">{text}</a>,
    }, {
      // title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: '10%',
    }, {
      // title: '创建名称',
      dataIndex: 'createDate',
      key: 'createDate',
      width: '30%',
    }];

    return (

      <Card
        title={<div><Icon type="versionline" /> 知识库</div>}
        bordered={false}
        hoverable
        className="workBenchCard"
        extra={(<Icon type="more_horiz" />)}
        bodyStyle={{ height: '100%' }}
      >

        <Tabs defaultActiveKey="1" size="small">
          <TabPane tab={<FormattedMessage id="latestKnowledge" />} key="1">
            <Table
              dataSource={data}
              columns={knowledgeBaseColumns}
              filterBar={false}
              showHeader={false}
              scroll={{ x: 800 }}
              pagination={false}
            />
          </TabPane>
          <TabPane tab={<FormattedMessage id="popularKnowledge" />} key="2">
            <Table
              dataSource={data}
              columns={knowledgeBaseColumns}
              filterBar={false}
              showHeader={false}
              scroll={{ x: 800 }}
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>
    );
  }
}

export default KnowledgeBase;
