/** 2018/10/23
*作者:高梦龙
*项目:工作流转交设置
*/
import React, { Component } from 'react';
import { Form, Input, Button, Table, DatePicker, message, Tooltip, Icon, Row, Col } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page } from 'yqcloud-front-boot';
import './index.scss';
import moment from 'moment';
import LOV from '../../../../components/lov';
import LOVInput from '../../../../components/lov/LOVInput';
import automaticTransferStore from '../../../../stores/organization/automaticTransfer/AutomaticTransferStore';

const intlPrefix = 'organization.automaticTransfer';
const FormItem = Form.Item;
const { TextArea } = Input;
@inject('AppState')
@observer
class AutomaticHome extends Component {
  state=this.getInitState();

  getInitState() {
    return {
      isLoading: true,
      params: [],
      filters: {},
      sort: 'id,desc',
      forwardStartDate: null,
      forwardEndDate: null,
      employeeName: '',
      comment: '',
      endOpen: false,
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },

      LOVVisible: false,
      visible: false,
      text: '',
      LOVCode: '',
      formItemCode: '',
      dataSource: [],
      count: 1,
      allDate: {},

    };
  }


  componentWillMount() {
    this.loadAutomatics();
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    automaticTransferStore.queryLanguage(id, AppState.currentLanguage);
  }

  // 工作流分页加载
  loadAutomatics = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    automaticTransferStore.loadAutos(
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
        v.count = count;
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
    this.loadAutomatics(pagination, sorter.join(','), filters, params);
  }

  /*
    不可选的开始时间
    */
   disabledStartDate = forwardStartDate => forwardStartDate < moment().date(moment().date() - 1)

   /*
    不可选的截止时间
    */

  disabledEndDate = (forwardEndDate) => {
    const { forwardStartDate } = this.state;
    if (!forwardEndDate || !forwardStartDate) {
      return false;
    }
    return forwardEndDate.valueOf() <= forwardStartDate.valueOf();
  }

  onChange = (field, value) => {
    this.setState({
      [field]: value,
    });
  }


  onStartChange = (value) => {
    this.onChange('forwardStartDate', value);
    this.setState({
      forwardStartDate: value,
    });
  }

  onEndChange = (value, callback) => {
    this.onChange('forwardEndDate', value);
    const { intl } = this.props;
    const { forwardStartDate, allDate } = this.state;
    const forwardStart = moment(forwardStartDate).format(' YYYY-MM-DD HH:mm:ss ');
    const forwardEndDate = moment(value).format('YYYY-MM-DD HH:mm:ss');
    if (moment(forwardStart).isAfter(forwardEndDate)) {
      callback();
    }
    if (allDate.forwardStartDate) {
      const forwardStart1 = moment(allDate.forwardStartDate).format(' YYYY-MM-DD HH:mm:ss ');
      const forwardEndDate2 = moment(value).format('YYYY-MM-DD HH:mm:ss');
      if (moment(forwardStart1).isAfter(forwardEndDate2)) {
        message.error(automaticTransferStore.languages[`${intlPrefix}.error.tishi`], 3);
      }
    }
  }

  handleEndOpenChange = (open) => {
    this.setState({ endOpen: open });
  }

  handleStartOpenChange = (open) => {
    if (!open) {
      this.setState({ endOpen: true });
    }
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, { employeeId }) => {
      // 格式化日期
      if (!err) {
        const { AppState } = this.props;
        const { organizationId } = AppState.currentMenuType;
        let forwardStartDate = data.forwardStartDate || '';
        if (forwardStartDate) {
          forwardStartDate = forwardStartDate.format('YYYY-MM-DD HH:mm:ss');
        }
        let forwardEndDate = data.forwardEndDate || '';
        if (forwardEndDate) {
          forwardEndDate = forwardEndDate.format('YYYY-MM-DD HH:mm:ss');
        }

        if (forwardEndDate) {
          if (moment(forwardStartDate).isAfter(forwardEndDate)) {
            message.error(automaticTransferStore.languages[`${intlPrefix}.error.tishi`], 2);
          } else {
            automaticTransferStore.createAuto(organizationId, {
              ...data,
              forwardStartDate,
              forwardEndDate,
            }).then(({ failed }) => {
              if (failed) {
                /*
                Choerodon.prompt(automaticTransferStore.languages[ `${intlPrefix}.Data.already.exists`]);
*/
              } else {
                this.loadAutomatics();
                Choerodon.prompt(automaticTransferStore.languages['create.success']);
                this.setState({ count: 1 });
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
            });
          }
        } else {
          automaticTransferStore.createAuto(organizationId, {
            ...data,
            forwardStartDate,
            forwardEndDate,
          }).then(({ failed }) => {
            if (failed) {
              Choerodon.prompt(automaticTransferStore.languages[`${intlPrefix}.Data.already.exists`]);
            } else {
              this.loadAutomatics();
              Choerodon.prompt(automaticTransferStore.languages['create.success']);
              this.setState({ count: 1 });
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        }
      } else {
        message.error(automaticTransferStore.languages[`${intlPrefix}.error`]);
      }
    });
  };

  // 回车键事件
  keypress(e) {
    e.preventDefault(); // 禁止默认行为，例如回车键失效
  }


  render() {
    const { AppState, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { filters, pagination, employee, endOpen, dataSource, allDate } = this.state;
    const { orgType } = this.props.AppState.currentMenuType.type;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '300px',
      wordBreak: 'normal',
    };
    dataSource.forEach((value) => {
      if (value.effective) {
        allDate.forwardStartDate = value.forwardStartDate;
        allDate.forwardEndDate = value.forwardEndDate;
        allDate.employeeName = value.employeeName;
        allDate.comment = value.comment;
        allDate.employeeId = value.employeeId;
      }
    });
    const { value, text, LOVVisible, formItemCode, LOVCode, employeeId, employeeName } = this.state;
    const columns = [
      {
        title: automaticTransferStore.languages[`${intlPrefix}.forwardStartDate`],
        dataIndex: 'forwardStartDate',
        key: 'forwardStartDate',
        filteredValue: filters.forwardStartDate || [],
        width: 170,
        sorter: true,
      },
      {
        title: automaticTransferStore.languages[`${intlPrefix}.forwardEndDate`],
        dataIndex: 'forwardEndDate',
        key: 'forwardEndDate',
        filteredValue: filters.forwardEndDate || [],
        width: 170,
        sorter: true,
      },
      {
        title: automaticTransferStore.languages[`${intlPrefix}.isEffective`],
        dataIndex: 'effective',
        key: 'effective',
        filteredValue: filters.effective || [],
        width: 80,
        render: (v, record) => (
          record.effective
            ? automaticTransferStore.languages[`${intlPrefix}.true`]
            : automaticTransferStore.languages[`${intlPrefix}.false`]
        ),
      },
      {
        title: automaticTransferStore.languages[`${intlPrefix}.employeeId`],
        dataIndex: 'employeeId',
        key: 'employeeId',
        filters: [],
        width: 200,
        render: (v, record) => (
          `<${record.employeeCode}>${record.employeeName}`),
      },
      {
        title: automaticTransferStore.languages[`${intlPrefix}.comments`],
        dataIndex: 'comment',
        key: 'comment',
        filters: [],
        filteredValue: filters.comment || [],
        sorter: true,
        width: 300,
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={40}>
              <div style={{ textAlign: 'left' }}>{`${record.comment}`}</div>
            </Tooltip>
          </span>
        ),
      },
    ];


    return (
      <Page>
        <Header title={automaticTransferStore.languages[`${intlPrefix}.automaticTitle`]}>
          <Button
            onClick={this.handleSubmit}
            style={{ color: '#04173F' }}
          >
            <Icon type="baocun" style={{ color: '#2196F3', width: 25 }} />
            {automaticTransferStore.languages[`${intlPrefix}.save`]}
          </Button>
        </Header>
        <Content>
          <Form layout="vertical">
            <Row>
              <Col span={8}>
                <span className="fontType">{automaticTransferStore.languages[`${intlPrefix}.forwardStartDate`]}<span style={{ color: 'red', textAlign: 'center' }}>*</span></span>
                <FormItem style={{ display: 'inline-block', marginLeft: 10 }}>
                  {getFieldDecorator('forwardStartDate', {
                    rules: [{
                      required: true,
                      message: automaticTransferStore.languages[`${intlPrefix}.require.forwardStartDate`],

                    }],
                    initialValue: allDate.forwardStartDate ? moment(allDate.forwardStartDate, 'YYYY-MM-DD HH:mm:ss') : '',
                  })(
                    <DatePicker
                      style={{ width: 200 }}
                      disabledDate={this.disabledStartDate}
                      showTime
                      format="YYYY-MM-DD HH:mm:ss"
                      // placeholder={automaticTransferStore.languages[ `${intlPrefix}.forwardStartDate`]}
                      onChange={this.onStartChange}
                      onOpenChange={this.handleStartOpenChange}
                    />,
                  )}
                </FormItem>
              </Col>
              <Col span={8}>
                <span className="fontType" style={{ marginLeft: 30 }}>{automaticTransferStore.languages[`${intlPrefix}.forwardEndDate`]}</span>
                <FormItem style={{ display: 'inline-block', marginLeft: 10 }}>
                  {getFieldDecorator('forwardEndDate', {

                    initialValue: allDate.forwardEndDate ? moment(allDate.forwardEndDate, 'YYYY-MM-DD HH:mm:ss') : '',
                  })(
                    <DatePicker
                      style={{ width: 200 }}
                      disabledDate={this.disabledEndDate}
                      showTime
                      format="YYYY-MM-DD HH:mm:ss"
                      onChange={this.onEndChange}
                      open={endOpen}
                      onOpenChange={this.handleEndOpenChange}
                    />,
                  )}
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem className="formtest" style={{ display: 'inline-block', marginLeft: 30 }}>
                  <span className="fontType">{automaticTransferStore.languages[`${intlPrefix}.employeeId`]}<span style={{ color: 'red', textAlign: 'center' }}>*</span></span>
                  {getFieldDecorator('employeeId', {
                    rules: [{
                      required: true,
                      message: automaticTransferStore.languages[`${intlPrefix}.require.employeeId`],

                    }],
                    initialValue: `${allDate.employeeId}` === 'undefined' ? '' : `${allDate.employeeId}`,

                  })(
                    <LOVInput
                      code="employee"
                      form={this.props.form}
                      formCode="employeeId"
                      organizationId={this.props.AppState.currentMenuType.organizationId}
                      style={{ width: 200, marginLeft: 10 }}
                      text={text || allDate.employeeName}
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
            </Row>
            <Row>
              <Col style={{ height: '20px' }}>
                <span className="fontType">{automaticTransferStore.languages[`${intlPrefix}.comments`]}</span>
                <FormItem style={{ display: 'inline-block', marginLeft: '45px' }}>
                  {getFieldDecorator('comment', {
                    initialValue: allDate.comment || '',
                  })(
                    <TextArea
                      style={{ width: 858, height: 80, backgroundColor: '#F5F5F5', marginLeft: -30 }}
                      underline={false}
                      autosize={{ minRows: 4, maxRows: 4 }}
                      onPressEnter={this.keypress}
                      maxLength={300}
                    />,
                  )}
                </FormItem>
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
          <div style={{ marginTop: '70px' }}>
            <Table
              size="middle"
              pagination={pagination}
              columns={columns}
              dataSource={dataSource}
              loading={automaticTransferStore.isLoading}
              onChange={this.handlePageChange.bind(this)}
              filterBar={false}
            />
          </div>
        </Content>
      </Page>

    );
  }
}

export default Form.create({})(withRouter(injectIntl(AutomaticHome)));
