/** 2019/8/8
 *作者:高梦龙
 *文件名： 平台层定时任务
 */

import React from 'react';
import { Content, Header, Page, Action } from 'yqcloud-front-boot';
import { Table, Button, Popover, Form, Modal, Icon, Tooltip } from 'yqcloud-ui';
import { inject, observer } from 'mobx-react';
import plateTimeStore from '../../../../stores/organization/plateFormTimer/PlateTimeStore';

const intlPrefix = 'organization.platformTime';
@inject('AppState')
@observer
class TenantTimeHome extends React.Component{
  constructor(props){
    super(props);
    this.state={
      dataSource: [],
      isLoading: true, //  标识数据是否在加载
      params: [],
      filters: {},
      sort: '',
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
    }
  }


  componentWillMount() {
    this.fetch(this.props);
  }

  componentDidMount() {
    this.loadData();
    this.loadLanguage();
  }


  fetch=() => {
    plateTimeStore.getIsEnabled();
  }


  loadData = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    plateTimeStore.queryTimer(
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
    })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
      );
  };

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    plateTimeStore.queryLanguage(0, AppState.currentLanguage);
  };

  getTaskStatus=(values) => {
    const typeLists = plateTimeStore.getEnabled;
    const temp = typeLists.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  createPlateform=() => {
    this.props.history.push(`/iam/platFormTimer/create`);
  }

  opendetailPage=(id) => {
    this.props.history.push(`/iam/platFormTimer/edit/${id}`);
  }

  viewdetailPage=(id) => {
    this.props.history.push(`/iam/platFormTimer/edit/${id}?isView=${1}`);
  }

  handlePageChange(pagination, filters, {field, order}, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadData(pagination, sorter.join(','), filters, params);
  }

  render(){
    const { pagination, dataSource } = this.state;
    const typeLists = plateTimeStore.getEnabled;
    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '120px',
      wordBreak: 'normal',
    };
    const columns =[
      {
        title: plateTimeStore.languages[`${intlPrefix}.taskCode`],
        dataIndex: 'taskCode',
        key: 'taskCode',
        filters: [],
        width: 100,
       render: (text, record) => (
          <span style={{ color: '#2196F3', cursor: 'pointer' }} onClick={this.viewdetailPage.bind(this, record.taskSiteId)}>
              {text}
          </span>
        ),
      },
      {
        title: plateTimeStore.languages[`${intlPrefix}.taskName`],
        dataIndex: 'taskName',
        key: 'taskName',
        filters: [],
        width: 100,
        render: (text, record) => ((
          <span style={tableStyleName}>
            <Tooltip title={text} lines={20}>
              {text}
            </Tooltip>
          </span>
        )),
      },
      {
        title: plateTimeStore.languages[`${intlPrefix}.description`],
        dataIndex: 'description',
        key: 'description',
        filters: [],
        width: 120,
        render: text => ((
          <span style={tableStyleName}>
            <Tooltip title={text} lines={20}>
             {text}
            </Tooltip>
          </span>
        )),
      },
      {
        title: plateTimeStore.languages[`${intlPrefix}.requestMethod`],
        dataIndex: 'requestMethod',
        key: 'requestMethod',
        width: 90,
      },
      {
        title: plateTimeStore.languages[`${intlPrefix}.requestService`],
        dataIndex: 'requestService',
        key: 'requestService',
        filters: [],
        width: 150,
        render: text => ((
          <span style={tableStyleName}>
            <Tooltip title={text} lines={20}>
             {text}
            </Tooltip>
          </span>
        )),
      },
      {
        title: plateTimeStore.languages[`${intlPrefix}.requestUrl`],
        dataIndex: 'requestUrl',
        key: 'requestUrl',
        filters: [],
        width: 80,
        render: text =>(
          <Popover content={text} trigger="click">
            <span style={{ color: '#2196F3', cursor: 'pointer' }}>{plateTimeStore.languages.see}</span>
          </Popover>
        )

      },
      {
        title: plateTimeStore.languages[`${intlPrefix}.creationDate`],
        dataIndex: 'creationDate',
        key: 'creationDate',
        width: 150,
      },
      {
        title: plateTimeStore.languages.status,
        dataIndex: 'enabled',
        key: 'enabled',
        filters: [{
          text: plateTimeStore.languages.enableY,
          value: true,
        }, {
          text: plateTimeStore.languages.disableN,
          value: false,
        }],
        width: 80,
        render: (values, record) => this.getTaskStatus(record.enabled),
      },
      {
        title: plateTimeStore.languages.operation,
        key: 'operation',
        width: 110,
        render: (operation, record) => {
          const style = {
            cursor: 'pointer',
          };
          return (
            <div>
              <Tooltip placement="bottom" title={plateTimeStore.languages.modify}>
                <Button
                  key="edit"
                  icon="bianji-"
                  size="small"
                  shape="circle"
                  style={{ cursor: 'pointer', color:  '#2196F3' }}
                  onClick={() => {
                    this.opendetailPage(record.taskSiteId)
                  }}
                />
              </Tooltip>
              {
                record.enabled  ? (
                    <Tooltip placement="bottom" title={plateTimeStore.languages.disableN}>
                      <Button
                        key="enable"
                        icon="jinyongzhuangtai"
                        style={style}
                        size="small"
                        shape="circle"
                        onClick={() => {
                          plateTimeStore.disableTask(record.taskSiteId)
                            .then(() => {
                              this.loadData();
                            });
                        }}
                      />
                    </Tooltip>
                  )
                  : (
                    <Tooltip placement="bottom" title={plateTimeStore.languages.enableY}>
                      <Button
                        key="disable"
                        size="small"
                        icon="yijieshu"
                        style={{ cursor: 'pointer', color: '#2196F3' }}
                        onClick={() => {
                          plateTimeStore.enableTask(record.taskSiteId)
                            .then(() => { this.loadData(); });
                        }}
                      />
                    </Tooltip>
                  )
              }

            </div>);
        },
      },
    ]
    return(
      <Page>
        <Header title={plateTimeStore.languages[`${intlPrefix}.title.allocation`]}>
          <Button
            style={{ color: '#04173F' }}
            onClick={this.createPlateform}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {plateTimeStore.languages[`${intlPrefix}.header.create`]}
          </Button>
        </Header>
        <Content>
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={pagination}
            loading={plateTimeStore.isLoading}
            onChange={this.handlePageChange.bind(this)}
          />
        </Content>
      </Page>
    )
  }

}
export default TenantTimeHome;
