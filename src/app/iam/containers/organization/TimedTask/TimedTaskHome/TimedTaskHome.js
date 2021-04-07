import React from 'react';
import { Content, Header, Page, Action } from 'yqcloud-front-boot';
import { Table, Button, Popover, Form, Modal, Icon, Tooltip } from 'yqcloud-ui';
import { inject, observer } from 'mobx-react';
import TimedTaskEditor from '../TimedTaskEditor';
import timedTaskHomeStore from '../../../../stores/organization/timedTask/TimedTaskHomeStore';


const intlPrefix = 'organization.timedTask';
@inject('AppState')
@observer
class TimedTaskHome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: [], //  数据
      operationType: 'create', //  侧边栏的类型，有创建和编辑两种
      showEditor: false, //  控制编辑侧边栏显示与隐藏
      showHistory: false, //  控制历史记录侧边栏的显示与隐藏
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
    };
  }


  loadData = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    timedTaskHomeStore.getTimedTasks(
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

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadData();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    timedTaskHomeStore.queryLanguage(0, AppState.currentLanguage);
  };


  fetch() {
    timedTaskHomeStore.getIsEnabled();
  }
  // 启用快码

  enabledState = (values) => {
    const enabled = timedTaskHomeStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  openTimeHistory=() => {
    this.props.history.push('/iam/timedTask/history');
  }


  /**
   *  渲染主页头部的新建和历史按钮
   */
  renderHeaderButtons = () => [
    <Button
      style={{ color: '#04173F' }}
      onClick={() => {
        this.editor.initData({})
          .then((content) => {
            this.editor.state.services = content;
            this.editor.clearBuffer(); //  清除缓存
            this.setState({
              operationType: 'create',
              showEditor: true,
            });
          });
      }}
    >
      <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
      {timedTaskHomeStore.languages[`${intlPrefix}.header.create`]}
    </Button>,
    <Button
      style={{ color: '#04173F' }}
      onClick={this.openTimeHistory}
    >
      <Icon type="dingshirenwulishijilu" style={{ color: '#2196F3', width: 25 }} />
      {timedTaskHomeStore.languages[`${intlPrefix}.header.history`]}
    </Button>,
  ];

  /**
   *  处理编辑按钮
   *  @return 要传入的记录
   */
  handleEdit = (record) => {
    this.editor.initData(record) //  初始化编辑栏数据
      .then((content) => {
        this.editor.state.services = content;
        this.editor.clearBuffer(); //  清除缓存
        this.setState({
          operationType: 'modify',
          showEditor: true,
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
    this.loadData(pagination, sorter.join(','), filters, params);
  }

  /**
   *  渲染主页中的表格
   */
  renderTable = () => {
    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '150px',
      wordBreak: 'normal',
    };
    const columns = [
      {
        title: timedTaskHomeStore.languages[`${intlPrefix}.columns.jobDescription`],
        dataIndex: 'jobDescription',
        key: 'jobDescription',
        filters: [],
        width: 150,
        render: (jobDescription, record) => ((
          <span style={tableStyleName}>
            <Tooltip title={jobDescription} lines={20}>
              {record.triggerState !== 'NORMAL' ? (<a onClick={() => { this.handleEdit(record)}} >{jobDescription}</a>) : `${jobDescription}`}
            </Tooltip>
          </span>
        )),
      },
      {
        title: timedTaskHomeStore.languages[`${intlPrefix}.columns.jobGroup`],
        dataIndex: 'jobGroup',
        key: 'jobGroup',
        width: 150,
        filters: [],
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={20}>
              <div style={{ textAlign: 'left' }}>{`${record.jobGroup}`}</div>
            </Tooltip>
          </span>
        ),
      },
      {
        title: timedTaskHomeStore.languages[`${intlPrefix}.columns.requestMethod`],
        dataIndex: 'requestMethod',
        width: 100,
        key: 'requestMethod',
        filters: [
          {
            text: 'GET',
            value: 'GET',
          },
          {
            text: 'POST',
            value: 'POST',
          },
          {
            text: 'PUT',
            value: 'PUT',
          },
          {
            text: 'DELETE',
            value: 'DELETE',
          },
        ],
      },
      {
        title: timedTaskHomeStore.languages[`${intlPrefix}.columns.requestService`],
        dataIndex: 'requestService',
        key: 'requestService',
        width: 200,
        filters: [],
      },
      {
        title: timedTaskHomeStore.languages[`${intlPrefix}.columns.requestUrl`],
        dataIndex: 'requestUrl',
        key: 'requestUrl',
        width: 200,
        filters: [],
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={20}>
              <div style={{ textAlign: 'left' }}>{`${record.requestUrl}`}</div>
            </Tooltip>
          </span>
        ),
      },
      {
        title: timedTaskHomeStore.languages[`${intlPrefix}.columns.lastUpdateDate`],
        dataIndex: 'lastTime',
        key: 'lastTime',
        width: 150,
      },
      {
        title: timedTaskHomeStore.languages[`${intlPrefix}.columns.nextExeTime`],
        dataIndex: 'nextTime',
        key: 'nextTime',
        width: 150,
      },
      {
        title: timedTaskHomeStore.languages[`${intlPrefix}.columns.triggerState`],
        dataIndex: 'triggerState',
        key: 'triggerState',
        width: 80,
        filters: [
          {
            text: timedTaskHomeStore.languages.disable,
            value: 'PAUSED',
          },
          {
            text: timedTaskHomeStore.languages.enable,
            value: 'NORMAL',
          },
        ],
        render: (values, record) => this.enabledState(record.triggerState),
      },
      {
        title: timedTaskHomeStore.languages[`${intlPrefix}.columns.operation`],
        key: 'operation',
        fixed: 'right',
        width: 130,
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
                  style={{ cursor: 'pointer', color: record.triggerState !== 'NORMAL'?  '#2196F3' : '' }}
                  disabled={record.triggerState !== 'NORMAL' ? '' : 'disabled'}
                  onClick={() => {
                    this.handleEdit(record);
                  }}
                />
              </Tooltip>
              {
                record.triggerState === 'NORMAL' ? (
                  <Tooltip placement="bottom" title={timedTaskHomeStore.languages.disable}>
                    <Button
                      key="enable"
                      icon="jinyongzhuangtai"
                      style={style}
                      size="small"
                      shape="circle"
                      onClick={() => {
                        const { TimedTaskHomeStore } = this.props;
                        TimedTaskHomeStore.disableTask(record.id)
                          .then(() => {
                            this.loadData();
                          });
                      }}
                    />
                  </Tooltip>
                )
                  : (
                    <Tooltip placement="bottom" title={timedTaskHomeStore.languages.enable}>
                      <Button
                        key="disable"
                        size="small"
                        icon="yijieshu"
                        style={{ marginRight: -10, cursor: 'pointer', color: '#2196F3' }}
                        onClick={() => {
                          const { TimedTaskHomeStore } = this.props;
                          TimedTaskHomeStore.enableTask(record.id)
                            .then(() => { this.loadData(); });
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
                  disabled={record.triggerState !== 'NORMAL' ? '' : 'disabled'}
                  onClick={() => {
                    const { TimedTaskHomeStore } = this.props;
                    TimedTaskHomeStore.deleteTask(record.id)
                      .then(() => { this.loadData(); });
                  }}
                />
              </Tooltip>
            </div>);
        },
      },
    ];

    const { pagination, dataSource } = this.state;
    return (
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={pagination}
        scroll={{ x: 1500 }}
        loading={timedTaskHomeStore.isLoading}
        onChange={this.handlePageChange.bind(this)}
      />
    );
  };


  /**
   *  渲染编辑侧边栏
   */
  renderEditor = () => {
    const { showEditor, operationType } = this.state;
    return (
      <TimedTaskEditor
        AppState={this.props.AppState}
        visible={showEditor}
        operationType={operationType}
        createRef={(node) => {
          this.editor = node;
        }}
        hideEditor={() => {
          this.setState({
            showEditor: false,
          });
        }}
        refresh={() => {
          this.loadData({});
        }}
      />
    );
  };

  render() {
    const enableType = timedTaskHomeStore.getEnabled;
    return (
      <Page>
        <Header title={timedTaskHomeStore.languages[`${intlPrefix}.header.title`]}>
          {this.renderHeaderButtons()}
        </Header>
        <Content>
          {this.renderTable()}
          {this.renderEditor()}
        </Content>
      </Page>
    );
  }
}

TimedTaskHome.propTypes = {};

export default TimedTaskHome;
