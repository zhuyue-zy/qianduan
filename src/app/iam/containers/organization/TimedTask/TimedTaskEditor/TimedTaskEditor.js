/*
* @description:定时任务主页
* @author：郭杨
* @update 2018-10-10 11:22
*/
import React from 'react';
import {
  Modal, Form, Input, Select, message, Icon, DatePicker, Radio, Card,
} from 'yqcloud-ui';
import moment from 'moment';
import { Content } from 'yqcloud-front-boot';
import { injectIntl } from 'react-intl';
import './TimedTaskEditor.scss';
import TimedTaskEditorStore from '../../../../stores/organization/timedTask/TimedTaskEditorStore';

import './TimedTaskEditor.scss';

const { Sidebar, confirm } = Modal;
const { Item: FormItem } = Form;
const { Option } = Select;
const { TextArea } = Input;

const intlPrefix = 'organization.timedTask';
const RadioGroup = Radio.Group;

@injectIntl
@Form.create({})
class TimedTaskEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      services: [], //  存储服务
      showRequestBody: false, //  控制报文实体输入框的显示与隐藏
      record: {}, //  表单中的字段名和值
      showExpress: 1,
    };
    this.loadLanguage();
  }

  componentDidMount() {
    const { createRef } = this.props;
    createRef(this);
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    // const { id } = AppState.currentMenuType;
    TimedTaskEditorStore.queryLanguage(0, AppState.currentLanguage);
  };

  /**
   *   初始化数据
   */
  initData = (record) => {
    this.setState({ showRequestBody: false });
    this.state.record = record;
    if (Object.keys(record).length > 1) {
      //  初始化时决定是否渲染报文实体
      if (record.requestMethod === 'POST' || record.requestMethod === 'PUT') {
        this.setState({
          showRequestBody: true,
        });
      }
    }
    //  获取服务
    return TimedTaskEditorStore.getService();
  };

  /**
   *  清除表单缓存
   */
  clearBuffer = () => {
    const { form: { resetFields } } = this.props;
    resetFields();
  };

  /**
   *  渲染优先级下拉框
   */
  renderPriority = () => {
    const { operationType } = this.props;
    const options = [];
    for (let i = 1; i < 6; i += 1) {
      options.push(<Option key={i}>{i}</Option>);
    }

    return (
      <Select
        style={{ width: 512 }}
        getPopupContainer={triggerNode => triggerNode.parentNode}
        label={TimedTaskEditorStore.languages[`${intlPrefix}.editor.formItem.priority`]}
      >
        {options}
      </Select>
    );
  };
  /**
   *  根据下拉框状态来判断是否显示文本框
   */

  handleRequestBodyTypeChange = (value) => {
    if (value === 'PUT' || value === 'POST') {
      this.setState({
        showRequestBody: true,
      });
    } else {
      this.setState({
        showRequestBody: false,
      });
    }
  };


  /**
   *  渲染请求服务下拉框
   */
  renderRequestService = () => {
    const { operationType } = this.props;
    const { services } = this.state;
    const options = [];
    services.forEach((serviceName) => {
      options.push(<Option key={serviceName}>{serviceName}</Option>);
    });
    return (
      <Select
        style={{ width: 512 }}
        getPopupContainer={triggerNode => triggerNode.parentNode}
        label={TimedTaskEditorStore.languages[`${intlPrefix}.columns.requestService`]}
      >
        {options}
      </Select>
    );
  };


  /**
   *  渲染表单
   */
  renderForm = () => {
    const { form: { getFieldDecorator, getFieldsValue }, intl, operationType } = this.props;
    const { showRequestBody, record, showExpress } = this.state;
    return (
      <Form layout="vertical">
        <FormItem>
          {getFieldDecorator('jobDescription', {
            rules: [
              {
                required: true, //  必填字段
                message: TimedTaskEditorStore.languages[`${intlPrefix}.editor.warning.jobDescription`], //  若未填报出的警告
              },
            ],
            initialValue: record.jobDescription || '',
          })(
            <Input
              style={{ width: 512 }}
              label={TimedTaskEditorStore.languages[`${intlPrefix}.editor.formItem.jobDescription`]}
              maxLength={20}
              autoComplete="off"
            />,
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('jobGroup', {
            initialValue: record.jobGroup || '',
          })(
            <Input
              style={{ width: 512 }}
              label={TimedTaskEditorStore.languages[`${intlPrefix}.columns.jobGroup`]}
              maxLength={20}
              autoComplete="off"
            />,
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('priority', {
            rules: [
              {
                required: true, //  必填字段
                message: TimedTaskEditorStore.languages[`${intlPrefix}.editor.warning.priority`], //  若未填报出的警告
              },
            ],
            initialValue: 5,
          })(
            this.renderPriority(),
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('requestMethod', {
            rules: [
              {
                required: true, //  必填字段
                message: TimedTaskEditorStore.languages[`${intlPrefix}.editor.warning.requestMethod`], //  若未填报出的警告
              },
            ],
            initialValue: record.requestMethod || 'GET',
          })(
            (
              <Select
                style={{ width: 512 }}
                getPopupContainer={triggerNode => triggerNode.parentNode}
                label={TimedTaskEditorStore.languages[`${intlPrefix}.columns.requestMethod`]}
                onChange={this.handleRequestBodyTypeChange}
              >
                <Option value="GET">{TimedTaskEditorStore.languages[`${intlPrefix}.GET`]}</Option>
                <Option value="POST">{TimedTaskEditorStore.languages[`${intlPrefix}.POST`]}</Option>
                <Option value="PUT">{TimedTaskEditorStore.languages[`${intlPrefix}.PUT`]}</Option>
                <Option value="DELETE">{TimedTaskEditorStore.languages[`${intlPrefix}.DELETE`]}</Option>
              </Select>
            ),
          )}
        </FormItem>
        <div style={{ display: showRequestBody ? 'block' : 'none' }}>
          <FormItem>
            {getFieldDecorator('requestBody', {
              rules: [
                {
                  message: TimedTaskEditorStore.languages[`${intlPrefix}.editor.warning.requestBody`], //  若未填报出的警告
                },
              ],
              initialValue: record.requestBody || '',
            })(
              <TextArea
                label={TimedTaskEditorStore.languages[`${intlPrefix}.editor.formItem.requestBody`]}
                style={{ width: 512, height: 200, backgroundColor: '#F5F5F5' }}
                underline={false}
              />,
            )}
          </FormItem>
        </div>
        <FormItem>

          {getFieldDecorator('requestService', {
            rules: [
              {
                required: true, //  必填字段
                message: TimedTaskEditorStore.languages[`${intlPrefix}.editor.warning.requestService`], //  若未填报出的警告
              },
            ],
            initialValue: record.requestService || '',
          })(
            this.renderRequestService(),
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('requestUrl', {
            rules: [
              {
                required: true, //  必填字段
                message: TimedTaskEditorStore.languages[`${intlPrefix}.editor.warning.requestUrl`], //  若未填报出的警告
              },
            ],
            initialValue: record.requestUrl || '',
          })(
            <Input
              style={{ width: 512 }}
              label={TimedTaskEditorStore.languages[`${intlPrefix}.columns.requestUrl`]}
            />,
          )}
        </FormItem>


        <FormItem>
          {(
            <RadioGroup
              onChange={(e) => {
                this.setState({ showExpress: e.target.value });
              }}
              defaultValue={1}
            >
              <Radio value={1}>{TimedTaskEditorStore.languages[`${intlPrefix}.InputExpression`]}</Radio>
              <Radio value={0}>{TimedTaskEditorStore.languages[`${intlPrefix}.SegmentationExpression`]}</Radio>
            </RadioGroup>
          )}
        </FormItem>
        <div style={{ display: showExpress === 1 ? 'block' : 'none' }}>
          <FormItem>
            {getFieldDecorator('cronExpression', {
              rules: [
                {
                  message: TimedTaskEditorStore.languages[`${intlPrefix}.editor.warning.cronExpression`], //  若未填报出的警告
                },
              ],
              initialValue: record.cronExpression || '',
            })(
              <Input
                style={{ width: 512 }}
                label={TimedTaskEditorStore.languages[`${intlPrefix}.editor.formItem.cronExpression`]}
              />,
            )}
          </FormItem>
        </div>
        <div style={{ display: showExpress === 0 ? 'block' : 'none' }}>
          <FormItem style={{ display: 'inline-block' }}>
            {getFieldDecorator('second', {
              initialValue: record.cronExpression ? record.cronExpression.split(' ')[0] : '*',
            })(
              <Input
                style={{ width: 80 }}
                label={TimedTaskEditorStore.languages[`${intlPrefix}.editor.popover.second`]}
              />,
            )}

          </FormItem>
          <FormItem style={{ display: 'inline-block' }}>
            {getFieldDecorator('minute', {
              initialValue: record.cronExpression ? record.cronExpression.split(' ')[1] : '*',
            })(
              <Input
                style={{ width: 80 }}
                label={TimedTaskEditorStore.languages[`${intlPrefix}.editor.popover.minute`]}
              />,
            )}
          </FormItem>
          <FormItem style={{ display: 'inline-block' }}>
            {getFieldDecorator('hour', {
              initialValue: record.cronExpression ? record.cronExpression.split(' ')[2] : '*',
            })(
              <Input
                style={{ width: 80 }}
                label={TimedTaskEditorStore.languages[`${intlPrefix}.editor.popover.hour`]}
              />,
            )}
          </FormItem>
          <FormItem style={{ display: 'inline-block' }}>
            {getFieldDecorator('day', {
              initialValue: record.cronExpression ? record.cronExpression.split(' ')[3] : '*',
            })(
              <Input
                style={{ width: 80 }}
                label={TimedTaskEditorStore.languages[`${intlPrefix}.editor.popover.day`]}
              />,
            )}
          </FormItem>
          <FormItem style={{ display: 'inline-block' }}>
            {getFieldDecorator('month', {
              initialValue: record.cronExpression ? record.cronExpression.split(' ')[4] : '*',
            })(
              <Input
                style={{ width: 80 }}
                label={TimedTaskEditorStore.languages[`${intlPrefix}.editor.popover.month`]}
              />,
            )}
          </FormItem>
          <FormItem style={{ display: 'inline-block' }}>
            {getFieldDecorator('week', {
              rules: [
                {
                  pattern: /[^*\x22]+/,
                  message: TimedTaskEditorStore.languages[`${intlPrefix}.editor.warning.weekCheck`],
                },
              ],
              initialValue: record.cronExpression ? record.cronExpression.split(' ')[5] : '?',
            })(
              <Input
                style={{ width: 80 }}
                label={TimedTaskEditorStore.languages[`${intlPrefix}.editor.popover.week`]}
              />,
            )}
          </FormItem>
          <FormItem style={{ display: 'inline-block' }}>
            {getFieldDecorator('year', {
              initialValue: record.cronExpression ? record.cronExpression.split(' ')[6] : '*',
            })(
              <Input
                style={{ width: 80 }}
                label={TimedTaskEditorStore.languages[`${intlPrefix}.editor.popover.year`]}
                disabled={operationType === 'modify'}
              />,
            )}
          </FormItem>

        </div>
        <FormItem>
          {getFieldDecorator('startTime', {
            initialValue: record.startTime ? moment(record.startTime) : moment(),
          })(
            <DatePicker
              label={TimedTaskEditorStore.languages[`${intlPrefix}.editor.formItem.startTime`]}
              getCalendarContainer={triggerNode => triggerNode.parentNode}
            />,
          )}
        </FormItem>
        <Card
          title={TimedTaskEditorStore.languages[`${intlPrefix}.editor.formItem.timedExpressionExample`]}
          style={{ height: 330, color: 'red', width: 550 }}
          bordered={false}
        >
          <p>*/5 * * * * ? {TimedTaskEditorStore.languages[`${intlPrefix}.execute.five.seconds`]}</p>
          <p>0 */1 * * * ? {TimedTaskEditorStore.languages[`${intlPrefix}.execute.one.minute`]}</p>
          <p>0 0 5-15 * * ? {TimedTaskEditorStore.languages[`${intlPrefix}.five.everyDay.trigger`]}</p>
          <p>0 0/3 * * * ? {TimedTaskEditorStore.languages[`${intlPrefix}.every.three.minutes`]}</p>
          <p>0 0-5 14 * * ?{TimedTaskEditorStore.languages[`${intlPrefix}.every.one.minute`]}</p>
          <p>0 0/5 14 * * ? {TimedTaskEditorStore.languages[`${intlPrefix}.every.five.minutes`]}</p>
          <p>0 0/5 14,18 * * ? {TimedTaskEditorStore.languages[`${intlPrefix}.every.six.minutes`]}</p>
          <p>0 0/30 9-17 * * ? {TimedTaskEditorStore.languages[`${intlPrefix}.every.half.hour`]}</p>
          <p>0 0 10,14,16 * * ? {TimedTaskEditorStore.languages[`${intlPrefix}.every.ten.minutes`]}</p>
        </Card>
      </Form>
    );
  };

  /**
   *  渲染文本
   */
  renderTitle = () => {
    const { operationType } = this.props;
    if (operationType === 'create') {
      return {
        title: TimedTaskEditorStore.languages[`${intlPrefix}.editor.title.create`],
        okText: TimedTaskEditorStore.languages[`${intlPrefix}.create`],
      };
    }
    return {
      title: TimedTaskEditorStore.languages[`${intlPrefix}.editor.title.modify`],
      okText: TimedTaskEditorStore.languages[`${intlPrefix}.save`],
    };
  };

  /**
   *  处理保存请求
   */
  handleSubmit = () => {
    const {
      form: { validateFields }, operationType, hideEditor, refresh, intl,
    } = this.props;
    const { record } = this.state;
    validateFields((err, data) => {
      if (!err) {
        if (!data.startTime || data.startTime === '') {
          delete data.startTime;
        }
        delete data.expressionExample;
        data.triggerType = 'CRON';
        //  进行新建或更新操作
        if (operationType === 'create') {
          if (this.state.showExpress === 0) {
            TimedTaskEditorStore.createTask({
              ...data,
              cronExpression: `${data.second} ${data.minute} ${data.hour} ${data.day} ${data.month} ${data.week} ${data.year}`,
            }) //  新建操作
              .then(({ failed, message }) => {
                if (failed) {
                } else {
                  hideEditor();
                  refresh();
                }
              });
          } else {
            TimedTaskEditorStore.createTask(data) //  新建操作
              .then(({ failed, message }) => {
                if (failed) {
                } else {
                  hideEditor();
                  refresh();
                }
              });
          }
        } else if (this.state.showExpress === 0) {
          TimedTaskEditorStore.updateTask(Object.assign({}, record, {
            ...data,
            cronExpression: `${data.second} ${data.minute} ${data.hour} ${data.day} ${data.month} ${data.week} ${data.year}`,
          })) //  更新操作
            .then(({ failed, message }) => {
              if (failed) {
              } else {
                hideEditor();
                refresh();
              }
            });
        } else {
          TimedTaskEditorStore.updateTask(Object.assign({}, record, data)) //  更新操作
            .then(({ failed, message }) => {
              if (failed) {
              } else {
                hideEditor();
                refresh();
              }
            });
        }
      }
    });
  };

  render() {
    const { visible, hideEditor, form: { isModifiedFields, getFieldsValue } } = this.props;
    return (
      <Sidebar
        visible={visible}
        title={this.renderTitle().title}
        okText={this.renderTitle().okText}
        cancelText={TimedTaskEditorStore.languages[`${intlPrefix}.cancel`]}
        onCancel={() => {
          if (isModifiedFields()) {
            Modal.confirm({
              title: TimedTaskEditorStore.languages['form.cancel.content'],
              okType: 'danger',
              onOk: () => {
                hideEditor();
              },
            });
            this.clearBuffer();
          } else {
            hideEditor();
            this.clearBuffer();
          }
        }}
        onOk={() => {
          this.handleSubmit();
        }}
      >
        <Content className="sidebar-content">
          {this.renderForm()}
        </Content>
      </Sidebar>
    );
  }
}

TimedTaskEditor.propTypes = {};

export default TimedTaskEditor;
