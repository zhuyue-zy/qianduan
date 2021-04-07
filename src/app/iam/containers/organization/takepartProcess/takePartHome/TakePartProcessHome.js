/** 2018/10/29
*作者:高梦龙
*项目：我参与的流程首页
*/

import React, { Component } from 'react';
import { Form, Button, Modal, Table, Input, Select, message, DatePicker, Tooltip, Icon, Row, Col } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page } from 'yqcloud-front-boot';

import takePartStore from '../../../../stores/organization/takepartProcess/TakePartStore';
import LOVInput from '../../../../components/lov/LOVInput';
import LOV from '../../../../components/lov';

const intlPrefix = 'organization.takePart';
const FormItem = Form.Item;
const { Option } = Select;
const { RangePicker } = DatePicker;

@inject('AppState')
@observer
class TakePartProcessHome extends Component {
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
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadTakePart();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    takePartStore.queryLanguage(id, AppState.currentLanguage);
  };

  fetch() {
    // 获取类型数据
    const { AppState, intl } = this.props;
    const { id } = AppState.currentMenuType;
    takePartStore.queryTypeList(id);
    takePartStore.queryStatusList(id);
    takePartStore.queryTransactionTypeList(id);
  }

  // 工作流分页加载
  loadTakePart = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState, AutomaticTransferStore } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    takePartStore.loadTakeParts(
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
    this.loadTakePart(pagination, sorter.join(','), filters, params);
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
        valueObj.startedBefore = [values.forwardStartDate[0].format('YYYY-MM-DD HH:mm:ss')];
        valueObj.startedAfter = [values.forwardStartDate[1].format('YYYY-MM-DD HH:mm:ss')];
      }
      if (values.employeeId !== '') {
        valueObj.startUserId = [values.employeeId];
      }
      Object.keys(values).forEach((i) => {
        if (i !== 'forwardStartDate') {
          valueObj[i] = [values[i]];
        }
      });
      this.loadTakePart('', '', { ...valueObj });
    });
  }

  openNewPage = (record) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const menuType = AppState.currentMenuType;
    this.props.history.push(`/iam/takepartProcess/edit/${record.procInstId}?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}&taskId=${record.taskId}&isTodo=${record.isTodo}&processStatus=${record.processStatus}`);
  };

  onEdit = (record) => {
    this.openNewPage(record);
  };
  /* 流程状态判断 */

  approvStatus=(values) => {
    const statusLists = takePartStore.getStatuslist;
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
    const catagoryState = takePartStore.getTypelist;
    const statusType = catagoryState.filter(v => (v.lookupValue === values));
    if (statusType.length > 0) {
      return statusType[0].lookupMeaning;
    } else {
      return values;
    }
  }

  // 事务名称

  queryTransactionType = (values) => {
    const typeLists = takePartStore.getTransactionTypeList;
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
    takePartStore.callBackProcess(id, record.procInstId, record.processStatus).then(
      (data) => {
        if (data === 'workflow.execution.col.Withdrawn') {
          this.loadTakePart();
          Choerodon.prompt(takePartStore.languages[`${intlPrefix}.CallBackSucess`]);
        } else {
          Choerodon.prompt(takePartStore.languages[`${intlPrefix}.notCallBack`]);
        }
      },
    ).catch((error) => {
      Choerodon.prompt(takePartStore.languages[`${intlPrefix}.notCallBack`]);
    });
  };


  render() {
    const { AppState, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { filters, pagination, employee, forwardStartDate, forwardEndDate, endOpen, dataSource, count } = this.state;
    const { orgType } = this.props.AppState.currentMenuType.type;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
    const typeLists = takePartStore.getTypelist;
    const statusLists = takePartStore.getStatuslist;
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
    statusLists.forEach((item) => {
      statusOption.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    const {
      value, text, LOVVisible, formItemCode, LOVCode, employeeId,
    } = this.state;
    const columns = [
      {
        title: takePartStore.languages[`${intlPrefix}.procInstIds`],
        dataIndex: 'codeNum',
        key: 'codeNum',
        filters: [],
        fixed: 'left',
        filteredValue: filters.procInstId || [],
        width: 150,
      },
      {
        title: takePartStore.languages[`${intlPrefix}.processName`],
        dataIndex: 'processName',
        key: 'processName',
        filters: [],
        filteredValue: filters.processName || [],
      },
      {
        title: takePartStore.languages[`${intlPrefix}.categorys`],
        dataIndex: 'category',
        key: 'category',
        filters: [],
        filteredValue: filters.category || [],
        render: (values, record) => this.catagoryState(record.category),

      },
      {
        title: takePartStore.languages[`${intlPrefix}.processStatuses`],
        dataIndex: 'processStatus',
        key: 'processStatus',
        filters: [],
        filteredValue: filters.category || [],
        render: (values, record) => this.approvStatus(record.processStatus),

      },
      {
        title: takePartStore.languages[`${intlPrefix}.subject`],
        dataIndex: 'subject',
        key: 'subject',
        filters: [],
        filteredValue: filters.processName || [],
      },
      {
        title: takePartStore.languages[`${intlPrefix}.transactionNumber`],
        dataIndex: 'transactionNumber',
        key: 'transactionNumber',
        filters: [],
        filteredValue: filters.category || [],
      },
      {
        title: takePartStore.languages[`${intlPrefix}.transactionClass`],
        dataIndex: 'transactionType',
        key: 'transactionType',
        filters: [],
        filteredValue: filters.category || [],
        render: (values, record) => this.queryTransactionType(record.transactionType),
      },
      {
        title: takePartStore.languages[`${intlPrefix}.taskName`],
        dataIndex: 'taskName',
        key: 'taskName',
        filters: [],
        filteredValue: filters.taskName || [],
      },
      {
        title: takePartStore.languages[`${intlPrefix}.startUserId`],
        dataIndex: 'startUserId',
        key: 'startUserId',
        filters: [],
        filteredValue: filters.assignee || [],
      },
      {
        title: takePartStore.languages[`${intlPrefix}.assignee`],
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
        title: takePartStore.languages[`${intlPrefix}.createTime`],
        dataIndex: 'createTime',
        key: 'createTime',
        filters: [],
        filteredValue: filters.createTime || [],
      },
      {
        title: takePartStore.languages[`${intlPrefix}.endTime`],
        dataIndex: 'endTime',
        key: 'endTime',
        filters: [],
        filteredValue: filters.endTime || [],
      },


      {
        title: takePartStore.languages[`${intlPrefix}.action`],
        key: 'action',
        fixed: 'right',
        width: 60,
        render: (values, record) => (
          <a
            onClick={this.onEdit.bind(this, record)}
          >{takePartStore.languages[`${intlPrefix}.handle`]}
          </a>
        ),
      },
      {
        title: '',
        key: 'actions',
        dataIndex: 'actions',
        fixed: 'right',
        width: 50,
        render: (text, record) => {
          const style = {
            cursor: 'pointer',
          };
          return (
            <div>
              {record.isRevoke === 1 ? (
                <Tooltip placement="bottom" title={takePartStore.languages[`${intlPrefix}.callBack`]}>
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
                <Tooltip placement="bottom" title={takePartStore.languages[`${intlPrefix}.callBack`]}>
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
        <Header title={takePartStore.languages[`${intlPrefix}.takePartTitle`]} />
        <Content>
          <Form layout="vertical">
            <Row>
              <Col span={7}>
                <FormItem>
                  {getFieldDecorator('codeNum', {
                    validateTrigger: 'onBlur',
                    initialValue: '',
                    validateFirst: true,
                  })(
                    <Input

                      label={takePartStore.languages[`${intlPrefix}.procInstId`]}
                      style={{ width: 250 }}
                    />,
                  )}
                </FormItem>
              </Col>
              <Col span={7}>
                <FormItem>
                  {getFieldDecorator('processName', {
                    initialValue: '',
                  })(
                    <Input
                      label={takePartStore.languages[`${intlPrefix}.processNames`]}
                      style={{ width: 250 }}
                    />,
                  )}
                </FormItem>
              </Col>
              <Col span={10}>
                <FormItem style={{ marginTop: '-2px' }}>
                  {getFieldDecorator('category', {
                    initialValue: '',
                  })(
                    <Select
                      label={takePartStore.languages[`${intlPrefix}.category`]}
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      style={{ width: 250 }}
                      onChange={this.handleCertificateTypeChange}
                      allowClear
                    >
                      {lanOption}
                    </Select>,
                  )}
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={7}>
                <FormItem>
                  {getFieldDecorator('processStatus', {
                    initialValue: '',
                  })(
                    <Select
                      label={takePartStore.languages[`${intlPrefix}.processStatus`]}
                      getPopupContainer={triggerNode => triggerNode.parentNode}
                      style={{ width: 250 }}
                      allowClear
                    >
                      {statusOption}
                    </Select>,
                  )}
                </FormItem>
              </Col>
              <Col span={7}>
                <FormItem style={{ marginTop: 2 }}>
                  {getFieldDecorator('employeeId', {
                    initialValue: '',
                  })(
                    <LOVInput
                      code="employee"
                      label={takePartStore.languages[`${intlPrefix}.employeeId`]}
                      form={this.props.form}
                      formCode="employeeId"
                      organizationId={this.props.AppState.currentMenuType.organizationId}
                      style={{ width: 250 }}
                      text={text}
                      onLOV={() => {
                        this.setState({
                          LOVVisible: true,
                          formItemCode: 'employeeId',
                          LOVCode: employee,
                        });
                      }}
                      onSelect={(text) => {
                        this.setState({
                          text,
                        });
                      }}
                    />,
                  )}
                </FormItem>
              </Col>
              <Col span={10} style={{ display: 'flex' }}>
                <FormItem style={{ marginTop: '17px' }}>
                  {getFieldDecorator('forwardStartDate', {
                    initialValue: '',
                  })(
                    <RangePicker
                      placeholder={[takePartStore.languages.startTime, takePartStore.languages.endTime]}
                      style={{ width: 250 }}
                    />,
                  )}
                </FormItem>
                <Button
                  style={{ marginTop: '5px', marginLeft: 35, backgroundColor: '#2196f3', borderRadius: 4 }}
                  type="primary"
                  funcType="raised"
                  htmlType="submit"
                  onClick={this.handleSearch}
                >{takePartStore.languages[`${intlPrefix}.query`]}
                </Button>
                <Button
                  style={{ marginLeft: '20px', borderRadius: 4, marginTop: '5px' }}
                  funcType="raised"
                  onClick={this.handleReset}
                >{takePartStore.languages[`${intlPrefix}.clear`]}
                </Button>
              </Col>
            </Row>
            <div />
          </Form>

          <LOV
            code="employee"
            firstForm={this.props.form}
            formItem={formItemCode}
            organizationId={this.props.AppState.currentMenuType.organizationId}
            visible={LOVVisible}
            onChange={(visible, text = text) => {
              this.setState({
                LOVVisible: visible,
                text,
              });
            }}
          />

          <div style={{ marginTop: '5px' }}>
            <Table
              size="middle"
              pagination={pagination}
              columns={columns}
              rowKey="procInstId"
              dataSource={dataSource}
              loading={takePartStore.isLoading}
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

export default Form.create({})(withRouter(injectIntl(TakePartProcessHome)));
