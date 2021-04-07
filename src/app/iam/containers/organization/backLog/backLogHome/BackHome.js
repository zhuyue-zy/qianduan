/** 2018/10/23
 *作者:高梦龙
 *项目:我的待办事项
 */

import React, { Component } from 'react';
import { Form, Button, Modal, Table, Input, message, DatePicker, Select, Tooltip, Row, Col } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page } from 'yqcloud-front-boot';

import backLogStore from '../../../../stores/organization/backLog/BackLogStore';
import LOVInput from '../../../../components/lov/LOVInput';
import LOV from '../../../../components/lov';

const intlPrefix = 'organization.backLog';
const FormItem = Form.Item;
const { RangePicker } = DatePicker;
const { Option } = Select;


@inject('AppState')
@observer
class BackHome extends Component {
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
    this.loadBackLog();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    backLogStore.queryLanguage(id, AppState.currentLanguage);
  }

  fetch() {
    // 获取类型数据
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    backLogStore.queryTypeList(organizationId);
    backLogStore.queryTransactionTypeList(organizationId);
  }

  // 工作流分页加载
  loadBackLog = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState, AutomaticTransferStore } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    backLogStore.loadBackLogs(
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
    this.loadBackLog(pagination, sorter.join(','), filters, params);
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
        if (i !== 'forwardStartDate' && i !== 'employeeId') {
          valueObj[i] = [values[i]];
        }
      });
      this.loadBackLog('', '', { ...valueObj });
    });
  };

  openNewPage = (record) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const menuType = AppState.currentMenuType;
    this.props.history.push(`/iam/backLog/edit/${record.procInstId}?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}&taskId=${record.taskId}`);
  };

  onEdit = (record) => {
    this.openNewPage(record);
  };

  // 获取流程类型 procInstId

  catagoryState = (values) => {
    const typeLists = backLogStore.getTypelist;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  // 事务名称

  queryTransactionType = (values) => {
    const typeLists = backLogStore.getTransactionTypeList;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }


  render() {
    const { AppState, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { filters, pagination, employee, forwardStartDate, forwardEndDate, endOpen, dataSource, count } = this.state;
    const { orgType } = this.props.AppState.currentMenuType.type;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '200px',
      wordBreak: 'normal',
    };
    const typeLists = backLogStore.getTypelist;
    const lanOption = [];
    typeLists.forEach((item) => {
      lanOption.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });

    const {
      value, text, LOVVisible, formItemCode, LOVCode, employeeId,
    } = this.state;
    const columns = [
      {
        title: backLogStore.languages[`${intlPrefix}.procInstIds`],
        dataIndex: 'codeNum',
        key: 'codeNum',
        filters: [],
        fixed: 'left',
        filteredValue: filters.codeNum || [],
        width: 150,
      },
      {
        title: backLogStore.languages[`${intlPrefix}.processName`],
        dataIndex: 'processName',
        key: 'processName',
        filters: [],
        filteredValue: filters.processName || [],
      },
      {
        title: backLogStore.languages[`${intlPrefix}.categorys`],
        dataIndex: 'category',
        key: 'category',
        filters: [],
        filteredValue: filters.category || [],
        render: (values, record) => this.catagoryState(record.category),

      },
      {
        title: backLogStore.languages[`${intlPrefix}.subject`],
        dataIndex: 'subject',
        key: 'subject',
        filters: [],
        filteredValue: filters.processName || [],
      },
      // {
      //   title: backLogStore.languages[ `${intlPrefix}.transactionNumber`],
      //   dataIndex: 'transactionNumber',
      //   key: 'transactionNumber',
      //   filters: [],
      //   filteredValue: filters.transactionNumber || [],
      // },
      {
        title: backLogStore.languages[`${intlPrefix}.transactionClass`],
        dataIndex: 'transactionType',
        key: 'transactionType',
        filters: [],
        filteredValue: filters.transactionType || [],
        render: (values, record) => this.queryTransactionType(record.transactionType),
      },

      {
        title: backLogStore.languages[`${intlPrefix}.taskName`],
        dataIndex: 'taskName',
        key: 'taskName',
        filters: [],
        filteredValue: filters.taskName || [],
      },
      {
        title: backLogStore.languages[`${intlPrefix}.owner`],
        dataIndex: 'startUserId',
        key: 'startUserId',
        filters: [],
      },
      {
        title: backLogStore.languages[`${intlPrefix}.assignee`],
        dataIndex: 'assignee',
        key: 'assignee',
        filteredValue: filters.assignee || [],
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={40}>
              <div style={{ textAlign: 'left' }}>{`${record.assignee}`}</div>
            </Tooltip>
          </span>
        ),

      },
      {
        title: backLogStore.languages[`${intlPrefix}.createTime`],
        dataIndex: 'createTime',
        key: 'createTime',
        filters: [],
        width: 160,
        filteredValue: filters.createTime || [],
      },
      {
        title: backLogStore.languages[`${intlPrefix}.action`],
        key: 'action',
        fixed: 'right',
        width: 80,
        render: (values, record) => (
          <a
            onClick={this.onEdit.bind(this, record)}
          >{backLogStore.languages[`${intlPrefix}.handle`]}
          </a>
        ),
      },
    ];

    return (

      <Page>
        <Header title={backLogStore.languages[`${intlPrefix}.automaticTitle`]} />
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
                      label={backLogStore.languages[`${intlPrefix}.procInstId`]}
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
                      label={backLogStore.languages[`${intlPrefix}.processNames`]}
                      style={{ width: 300 }}
                    />,
                  )}
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem style={{ marginTop: '-2.5px' }}>
                  {getFieldDecorator('category', {
                    initialValue: '',
                  })(
                    <Select
                      label={backLogStore.languages[`${intlPrefix}.category`]}
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
                <FormItem>
                  {getFieldDecorator('employeeId', {
                    initialValue: '',
                  })(
                    <LOVInput
                      code="employee"
                      label={backLogStore.languages[`${intlPrefix}.employeeId`]}
                      form={this.props.form}
                      formCode="employeeId"
                      organizationId={this.props.AppState.currentMenuType.organizationId}
                      style={{ width: 300 }}
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
              <Col span={8}>
                <FormItem style={{ display: 'inline-block', marginTop: 15 }}>
                  {getFieldDecorator('forwardStartDate', {
                    initialValue: '',
                  })(
                    <RangePicker
                      placeholder={['创建开始时间', '创建结束时间']}
                      showTime
                      style={{ width: 300 }}
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
                >{backLogStore.languages[`${intlPrefix}.query`]}
                </Button>
                <Button
                  style={{ marginLeft: '20px', borderRadius: 5 }}
                  funcType="raised"
                  onClick={this.handleReset}
                >{backLogStore.languages[`${intlPrefix}.clear`]}
                </Button>
              </Col>
            </Row>
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
              loading={backLogStore.isLoading}
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

export default Form.create({})(withRouter(injectIntl(BackHome)));
