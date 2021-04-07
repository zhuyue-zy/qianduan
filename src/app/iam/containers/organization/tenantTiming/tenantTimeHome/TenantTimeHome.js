/** 2019/8/8
 *作者:高梦龙
 *文件名： 租户定时任务
 */

import React from 'react';
import { Content, Header, Page, Action } from 'yqcloud-front-boot';
import { Table, Button, Popover, Form, Modal, Icon, Tooltip } from 'yqcloud-ui';
import { inject, observer } from 'mobx-react';
import tenantTimeStore from '../../../../stores/organization/tenantTimeTask/TeantTimeStore';
import timedTaskHomeStore from "../../../../stores/organization/timedTask/TimedTaskHomeStore";

const intlPrefix = 'organization.TenantTime';
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
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadData();
  }
  fetch(){
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    tenantTimeStore.timeTask(organizationId);

  }

  // 打开定时任务详情页面
  opendetailPage = (id) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const menuType = AppState.currentMenuType;
    this.props.history.push(`/iam/tenantTime/edit/${id}?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
  };

  // 新建定时任务页面
  openCreatePage=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const menuType = AppState.currentMenuType;
      this.props.history.push(`/iam/tenantTime/create?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
  }



  loadData = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    tenantTimeStore.getTimedTasks(
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
    const { id } = AppState.currentMenuType;
    tenantTimeStore.queryLanguage(id, AppState.currentLanguage);
  };

  getTaskStatus=(values) => {
    const typeLists = tenantTimeStore.getTaskStatus;
    if (typeLists) {
      const temp = typeLists.filter(v => (v.lookupValue === values));
      if (temp.length > 0) {
        return temp[0].lookupMeaning;
      } else {
        return values;
      }
    } else{
      return values;
    }
  }

  handleEdit=(record) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const menuType = AppState.currentMenuType;
    this.props.history.push(`/iam/tenantTime/create/${record.taskId}?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
  }

  handlePageChange(pagination, filters, { field, order }, params) {
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
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '150px',
      wordBreak: 'normal',
    };
    tenantTimeStore.getTaskStatus;
    const columns =[
      {
      title: tenantTimeStore.languages[`${intlPrefix}.taskName`],
      dataIndex: 'taskName',
      key: 'taskName',
      filters: [],
      width: 150,
      render: (text, record) => ((
        <span style={tableStyleName}>
            <Tooltip title={text} lines={20}>
              <a onClick={this.opendetailPage.bind(this, record.taskId)}>{text}</a>
            </Tooltip>
          </span>
      )),
    },
      {
        title: tenantTimeStore.languages[`${intlPrefix}.description`],
        dataIndex: 'description',
        key: 'description',
        filters: [],
        width: 150,
        render: (text) => ((
          <span style={tableStyleName}>
            <Tooltip title={text} lines={20}>
              {text}
            </Tooltip>
          </span>
        )),
      },
      {
        title: tenantTimeStore.languages[`${intlPrefix}.createTime`],
        dataIndex: 'creationDate',
        key: 'creationDate',
        width: 150,
      },
      {
        title: tenantTimeStore.languages[`${intlPrefix}.lastExecuteTime`],
        dataIndex: 'lastExecutionTime',
        key: 'lastExecutionTime',
        width: 150,
      },
      {
        title: tenantTimeStore.languages[`${intlPrefix}.nextExecuteTime`],
        dataIndex: 'nextExecutionTime',
        key: 'nextExecutionTime',
        width: 150,
      },
      {
        title: tenantTimeStore.languages.status,
        dataIndex: 'taskStatus',
        key: 'taskStatus',
        width: 80,
        render: (values, record) => this.getTaskStatus(record.taskStatus),
      },
      {
        title: tenantTimeStore.languages.operation,
        key: 'operation',
        width: 150,
        render: (operation, record) => {
          const style = {
            cursor: 'pointer',
          };
          return (
            <div>
              <Tooltip placement="bottom" title={timedTaskHomeStore.languages.modify}>
                <Button
                  key="edit"
                  icon="bianji-"
                  size="small"
                  shape="circle"
                  style={{ cursor: 'pointer', color:  '#2196F3',  opacity: record.taskStatus == 'Draft' ?  '' : 0.4}}
                  disabled={record.taskStatus == 'Draft' ? '' : 'disabled'}
                  onClick={() => {
                    this.handleEdit(record);
                  }}
                />
              </Tooltip>
              {
                record.taskStatus === 'Draft' ? (
                  <Tooltip placement="bottom" title={tenantTimeStore.languages.enable}>
                    <Button
                      key="disable"
                      size="small"
                      icon="yijieshu"
                      style={{ cursor: 'pointer', color: '#2196F3' }}
                      onClick={() => {
                        tenantTimeStore.enableTask(organizationId,record.taskId)
                          .then(() => { this.loadData(); });
                      }}
                    />
                  </Tooltip>
                ) : record.taskStatus === 'Invalid' ?  (
                  <Tooltip placement="bottom" title={tenantTimeStore.languages.enable}>
                    <Button
                      key="disable"
                      size="small"
                      icon="yijieshu"
                      style={{  cursor: 'pointer', color: '#2196F3', opacity: 0.4 }}
                      disabled={true}
                    /*  onClick={() => {
                        tenantTimeStore.enableTask(organizationId,record.taskId)
                          .then(() => { this.loadData(); });
                      }}*/
                    />
                  </Tooltip>
                ) : (
                  <Tooltip placement="bottom" title={tenantTimeStore.languages.disable}>
                    <Button
                      key="enable"
                      icon="jinyongzhuangtai"
                      style={style}
                      size="small"
                      shape="circle"
                       onClick={() => {
                         tenantTimeStore.disableTask(organizationId, record.taskId)
                           .then(() => {
                             this.loadData();
                           });
                       }}
                    />
                  </Tooltip>
                )
              }

              <Tooltip placement="bottom" title={timedTaskHomeStore.languages.delete}>
                <Button
                  key="delete"
                  icon="shanchu-icon"
                  style={style}
                  size="small"
                  disabled={record.taskStatus == 'Draft' ? '' : 'disabled'}
                 onClick={() => {
                    tenantTimeStore.deletetask(organizationId, record.taskId)
                      .then(() => { this.loadData(); });
                  }}
                />
              </Tooltip>
            </div>);
        },
      },
    ]
    return(
      <Page>
        <Header title={tenantTimeStore.languages[`${intlPrefix}.title`]}>
          <Button
            style={{ color: '#04173F' }}
            onClick={this.openCreatePage}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {tenantTimeStore.languages[`${intlPrefix}.header.create`]}
          </Button>
        </Header>
        <Content>
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={pagination}
            loading={tenantTimeStore.isLoading}
            onChange={this.handlePageChange.bind(this)}
          />
        </Content>
      </Page>
    )
  }

}
export default TenantTimeHome;
