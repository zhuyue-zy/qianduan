/** 2018/10/30
*作者:高梦龙
*项目：发起流程
*/
/** 2018/10/23
 *作者:高梦龙
 *项目:我的待办事项
 */

import React, { Component } from 'react';
import { Form, Button, Table, Input, Select, message, DatePicker, Tooltip, Icon, Row, Col } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page } from 'yqcloud-front-boot';

import moment from 'moment';
import launchStore from '../../../../stores/organization/launchProcess/LaunchStore';

const intlPrefix = 'organization.launchPorcess';
const FormItem = Form.Item;
const { Option } = Select;
const { RangePicker } = DatePicker;

@inject('AppState')
@observer
class LaunchHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      isLoading: true,
      params: [],
      filters: {},
      sort: '',
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      employeeId: '',
      LOVVisible: false,
      visible: false,
      text: '',
      LOVCode: '',
      formItemCode: '',
      dataSource: [],
      lookupMeaning: '',
      lookupValue: '',
      startedBefore: '',
      startedAfter: '',
      typeLists: [],
      statusTypes: [],
      count: 0,
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadLaunch();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    launchStore.queryLanguage(id, AppState.currentLanguage);
  }

  fetch() {
    // 获取类型数据
    const { AppState, intl } = this.props;
    const { id } = AppState.currentMenuType;
    launchStore.queryTypeList(id);
    launchStore.queryStatusList(id);
    launchStore.queryTransactionTypeList(id);
  }

  // 工作流分页加载
  loadLaunch = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState, AutomaticTransferStore } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    launchStore.loadLaunchProcess(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      // 将后台获取的分页信息手动set表格里
      let { count } = this.state;
      data.content.forEach((v) => {
        v.key = count;
        count += 1;
      });

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
        count,
      });
    })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
      );
  };


  handlePageChange(pagination, filters, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadLaunch(pagination, sorter.join(','), filters, params);
  }

  handleReset = () => {
    this.setState({
      text: '',
    });
    this.props.form.resetFields();
  }

  handleSearch = (e) => {
    e.preventDefault();

    this.props.form.validateFields((err, values) => {
      const valueObj = {};
      const startedBefore = '';
      const startedAfter = '';
      const startUserId = '';
      if (values.forwardStartDate !== '') {
        valueObj.startedBefore = [moment(values.forwardStartDate[0]).format('YYYY-MM-DD 00:00:00')];
        valueObj.startedAfter = [moment(values.forwardStartDate[1]).format('YYYY-MM-DD 00:00:00')];
      }
      if (values.employeeId !== '') {
        valueObj.startUserId = [values.employeeId];
      }
      Object.keys(values).forEach((i) => {
        if (i !== 'forwardStartDate') {
          valueObj[i] = [values[i]];
        }
      });
      this.loadLaunch('', '', { ...valueObj });
    });
  }

  openNewPage = (id) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const menuType = AppState.currentMenuType;
    this.props.history.push(`/iam/launchProcess/edit/${id}?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
  };

  onEdit = (id) => {
    this.openNewPage(id);
  };
  /* 流程状态判断 */

  approvStatus=(values) => {
    const statusLists = launchStore.getStatuslist;
    const statusType = statusLists.filter(v => (v.lookupValue === values));
    if (statusType.length > 0) {
      if (statusType[0].lookupMeaning === '被驳回') {
        return (<span style={{ fontFamily: 'Arial', color: '#000000', fontSize: 13 }}><Icon type="beibohui" style={{ color: '#2196F3', width: 25 }} />{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '已结束') {
        return (<span style={{ fontFamily: 'Arial', color: '#000000', fontSize: 13 }}><Icon type="yijieshu" style={{ color: '#2196F3', width: 25 }} />{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '已终止') {
        return (<span style={{ fontFamily: 'Arial', color: '#000000', fontSize: 13 }}><Icon type="yizhongzhi" style={{ color: '#2196F3', width: 25 }} />{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '进行中') {
        return (<span style={{ fontFamily: 'Arial', color: '#000000', fontSize: 13 }}><Icon type="jinxingzhong" style={{ color: '#2196F3', width: 25 }} />{statusType[0].lookupMeaning}</span>);
      } else if (statusType[0].lookupMeaning === '挂起中') {
        return (<span style={{ fontFamily: 'Arial', color: '#000000', fontSize: 13 }}><Icon type="guaqizhong" style={{ color: '#2196F3', width: 25 }} />{statusType[0].lookupMeaning}</span>);
      } else {
        return statusType[0].lookupMeaning;
      }
    } else {
      return values;
    }
  }
  // 流程分类快码

  catagoryState = (values) => {
    const catagoryState = launchStore.getTypelist;
    const statusType = catagoryState.filter(v => (v.lookupValue === values));
    if (statusType.length > 0) {
      return statusType[0].lookupMeaning;
    } else {
      return values;
    }
  }


  // 事务名称

  queryTransactionType = (values) => {
    const typeLists = launchStore.getTransactionTypeList;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  /* 撤回 */
  callBackWork = (record, callback) => {
    const { AppState, intl } = this.props;
    const { id } = AppState.currentMenuType;
    launchStore.callBackProcess(id, record.procInstId, record.processStatus).then(
      (data) => {
        if (data === 'workflow.execution.col.Withdrawn') {
          this.loadLaunch();
          Choerodon.prompt(launchStore.languages[`${intlPrefix}.CallBackSucess`]);
        } else {
          Choerodon.prompt(launchStore.languages[`${intlPrefix}.notCallBack`]);
        }
      },
    ).catch((error) => {
      Choerodon.prompt(launchStore.languages[`${intlPrefix}.notCallBack`]);
    });
  };

  render() {
    const { AppState, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { filters, pagination, employee, forwardStartDate, forwardEndDate, endOpen, dataSource } = this.state;
    const { orgType } = this.props.AppState.currentMenuType.type;
    const { selectedRowKeys, selectedCodeValues } = this.state;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
    const typeLists = launchStore.getTypelist;
    const statusTypes = launchStore.getStatuslist;
    const lanOption = [];
    const statusOption = [];
    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '200px',
      wordBreak: 'normal',
    };
    typeLists.forEach((item) => {
      lanOption.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    statusTypes.forEach((item) => {
      statusOption.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    const columns = [
      {
        title: launchStore.languages[`${intlPrefix}.procInstIds`],
        dataIndex: 'codeNum',
        key: 'codeNum',
        filters: [],
        fixed: 'left',
        filteredValue: filters.codeNum || [],
        width: 150,
      },
      {
        title: launchStore.languages[`${intlPrefix}.processName`],
        dataIndex: 'processName',
        key: 'processName',
        filters: [],
        filteredValue: filters.processName || [],
      },
      {
        title: launchStore.languages[`${intlPrefix}.categorys`],
        dataIndex: 'category',
        key: 'category',
        filters: [],
        filteredValue: filters.category || [],
        render: (values, record) => this.catagoryState(record.category),

      },
      {
        title: launchStore.languages[`${intlPrefix}.processStatuses`],
        dataIndex: 'processStatus',
        key: 'processStatus',
        filters: [],
        filteredValue: filters.category || [],
        render: (values, record) => this.approvStatus(record.processStatus),
      },
      {
        title: launchStore.languages[`${intlPrefix}.subject`],
        dataIndex: 'subject',
        key: 'subject',
        filters: [],
        filteredValue: filters.processName || [],
      },
      {
        title: launchStore.languages[`${intlPrefix}.transactionNumber`],
        dataIndex: 'transactionNumber',
        key: 'transactionNumber',
        filters: [],
        filteredValue: filters.category || [],
      },
      {
        title: launchStore.languages[`${intlPrefix}.transactionClass`],
        dataIndex: 'transactionType',
        key: 'transactionType',
        filters: [],
        filteredValue: filters.category || [],
        render: (values, record) => this.queryTransactionType(record.transactionType),
      },
      {
        title: launchStore.languages[`${intlPrefix}.taskName`],
        dataIndex: 'taskName',
        key: 'taskName',
        filters: [],
        filteredValue: filters.taskName || [],
      },
      {
        title: launchStore.languages[`${intlPrefix}.assignee`],
        dataIndex: 'assignee',
        key: 'assignee',
        filters: [],
        filteredValue: filters.assignee || [],
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={40}>
              <div style={{ textAlign: 'left' }}>{`${record.assignee}` !== 'null' ? `${record.assignee}` : ' ' }</div>
            </Tooltip>
          </span>
        ),
      },

      {
        title: launchStore.languages[`${intlPrefix}.createTime`],
        dataIndex: 'createTime',
        key: 'createTime',
        filters: [],
        filteredValue: filters.createTime || [],
      },
      {
        title: launchStore.languages[`${intlPrefix}.endTime`],
        dataIndex: 'endTime',
        key: 'endTime',
        filters: [],
        filteredValue: filters.endTime || [],
      },
      {
        title: launchStore.languages[`${intlPrefix}.action`],
        key: 'action',
        fixed: 'right',
        width: 60,
        render: (values, record) => (
          <a
            onClick={this.onEdit.bind(this, record.procInstId)}
          >{launchStore.languages[`${intlPrefix}.handle`]}
          </a>
        ),
      },
      {
        code: 'actions',
        title: '',
        dataIndex: 'actions',
        key: 'actions',
        fixed: 'right',
        width: 50,
        render: (text, record) => {
          const style = {
            cursor: 'pointer',
          };
          return (
            <div>
              {record.isRevoke === 1 ? (
                <Tooltip placement="bottom" title={launchStore.languages[`${intlPrefix}.callBack`]}>
                  <Button
                    key="reply_all"
                    icon="chehui"
                    style={{ color: '#2196F3', cursor: 'pointer' }}
                    onClick={() => {
                      this.callBackWork(record);
                    }}
                  />
                </Tooltip>
              ) : (
                <Tooltip placement="bottom" title={launchStore.languages[`${intlPrefix}.callBack`]}>
                  <Button
                    key="reply_all"
                    icon="chehui"
                    style={style}
                    disabled="disabled"
                    onClick={() => {
                      this.callBackWork(record);
                    }}
                  />
                </Tooltip>
              ) }
            </div>
          );
        },
      },
    ];

    return (

      <Page>
        <Header title={launchStore.languages[`${intlPrefix}.launchTitle`]} />
        <Content>
          <Form layout="vertical">
            <Row>
              <Col span={8}>
                <FormItem>
                  {getFieldDecorator('codeNum', {
                    validateTrigger: 'onBlur',
                    initialValue: '',
                    validateFirst: true,
                  })(
                    <Input

                      label={launchStore.languages[`${intlPrefix}.procInstId`]}
                      style={{ width: 300 }}
                    />,
                  )}
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem>
                  {getFieldDecorator('processName', {
                    initialValue: '',
                  })(
                    <Input
                      label={launchStore.languages[`${intlPrefix}.processNames`]}
                      style={{ width: 300 }}
                    />,
                  )}
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem style={{ marginTop: '-3px' }}>
                  {getFieldDecorator('category', {
                    initialValue: '',
                  })(
                    <Select
                      label={launchStore.languages[`${intlPrefix}.category`]}
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      style={{ width: 300 }}
                      allowClear
                    >
                      {lanOption}
                    </Select>,
                  )}
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={8}>

                <FormItem style={{ display: 'inline-block', marginTop: '-2px' }}>
                  {getFieldDecorator('processStatus', {
                    initialValue: '',
                  })(
                    <Select
                      label={launchStore.languages[`${intlPrefix}.processStatus`]}
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      style={{ width: 300 }}
                      allowClear
                    >
                      {statusOption}
                    </Select>,
                  )}
                </FormItem>
              </Col>
              <Col span={8}>

                <FormItem style={{ display: 'inline-block', marginTop: '15px' }}>
                  {getFieldDecorator('forwardStartDate', {
                    initialValue: '',
                  })(
                    <RangePicker
                      placeholder={[launchStore.languages.startTime, launchStore.languages.endTime]}
                      style={{ width: 300 }}
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                    />,
                  )}
                </FormItem>
              </Col>
              <Col span={8}>
                <Button
                  style={{ marginTop: '5px', backgroundColor: '#2196f3', borderRadius: 5 }}
                  type="primary"
                  funcType="raised"
                  htmlType="submit"
                  onClick={this.handleSearch}
                >{launchStore.languages[`${intlPrefix}.query`]}
                </Button>
                <Button
                  style={{ marginLeft: '20px', borderRadius: 5 }}
                  funcType="raised"
                  onClick={this.handleReset}
                >{launchStore.languages[`${intlPrefix}.clear`]}
                </Button>
              </Col>
            </Row>
            <div />
          </Form>


          <div style={{ marginTop: '5px' }}>
            <Table
              size="middle"
              pagination={pagination}
              columns={columns}
              dataSource={dataSource}
              loading={launchStore.isLoading}
              onChange={this.handlePageChange.bind(this)}
              filterBar={false}
              scroll={{ x: 2000 }}
            />
          </div>

        </Content>
      </Page>


    );
  }
}

export default Form.create({})(withRouter(injectIntl(LaunchHome)));
