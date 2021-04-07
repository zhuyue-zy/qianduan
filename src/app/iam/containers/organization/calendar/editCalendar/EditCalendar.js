/**
 * Create By liuchuan on 2018/9/17.
 */
import React, { Component } from 'react';
import {
  Form, Input, Button, Select, Switch, Tabs, Card, TimePicker, Checkbox, Spin, Icon,
} from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page } from 'yqcloud-front-boot';
import moment from 'moment';
import 'moment/locale/zh-cn';
import SingleCalendar from './SingleCalendar';
import './index.scss';
import CalendarStore from '../../../../stores/organization/calendar';
import OperatingHours from './OperatingHours';

const { TabPane } = Tabs;
moment.locale('zh-cn');

const FormItem = Form.Item;
const { Option } = Select;
const intlPrefix = 'organization.calendar';

const inputWidth = 512;
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 100 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 10 },
  },
};

function noop() {
}

/**
 * 给日期加上默认值
 * @param str
 */
function setDefaultDate(str) {
  const temp = moment(str);
  temp.set('year', 2000);
  temp.set('month', 0);
  temp.set('date', 1);
  return temp;
}

@inject('AppState')
@observer
class EditCalendar extends Component {
  state = this.getInitState();

  /**
   * 组件加载中
   */
  componentWillMount() {
    this.loadAllData();
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CalendarStore.queryLanguage(id, AppState.currentLanguage);
  };

  /**
   * 初始化页面数据
   * @returns {{currentYear: number, allCalendarData: Array, OnSaturday: boolean, OnSunday: boolean, id: (*|string), edit: boolean, calendarInfo: {}, timeSetting: boolean, weekDays: Array}}
   */
  getInitState() {
    const workDays = [];
    for (let i = 1; i <= 7; i += 1) {
      const workDay = {
        weekDay: `${i}`, // 当前是周几
        postpositionStart: '', // 开始
        postpositionEnd: '', // 开始拆分
        precursorStart: setDefaultDate(moment('08:00', 'HH:mm')), // 结束拆分
        precursorEnd: setDefaultDate(moment('17:00', 'HH:mm')), // 结束
      };
      workDays.push(workDay);
    }
    const allCalendarData = [];
    for (let i = 1; i <= 12; i += 1) {
      allCalendarData.push({
        month: i, // 当前月份
        noWorkDay: [], // 已点击的工作日
        saturdayWorkDay: [], // 已点击的周六
        sundayWorkDay: [], // 已点击的周日
      });
    }
    return {
      currentYear: moment().year(), // 当前年份
      allCalendarData, // 一年的用户点击的日期数据
      OnSaturday: false, // 是否选择了六
      OnSunday: false, // 是否选择了周日
      id: this.props.match.params.id || '', // 页面编辑状态时的id
      edit: !!this.props.match.params.id, // 页面是否是编辑状态
      calendarInfo: {}, // 日历相关信息
      timeSetting: false, // 是否开启工作时间
      weekDays: workDays, // 工作时间
      loading: true,
      calendarLookupType: [],
    };
  }

  /**
   * 加载页面数据方法
   */
  loadAllData() {
    const { AppState } = this.props;
    const { edit, id } = this.state;
    const { id: organizationId } = AppState.currentMenuType;
    CalendarStore.lookupValueDto(
      organizationId,
      'ITSM_CALENDAR_TYPE',
      true,
    )
      .then((data) => {
        this.setState({ calendarLookupType: data });
      })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
      );
    if (edit) {
      this.getAllDataInfo(organizationId, id);
    } else {
      this.setState({ loading: false });
    }
  }

  /**
   * 向后台发送请求得到数据
   * @param organizationId
   * @param id
   */
  getAllDataInfo(organizationId, id) {
    CalendarStore.selectCalendarById(organizationId, id)
      .then((data) => {
        if (data) {
          this.setState({
            calendarInfo: {
              calendarId: data.calendarId,
              calendarName: data.calendarName,
              calendarStatus: data.calendarStatus,
              calendarTimeZone: data.calendarTimeZone,
              calendarType: data.calendarType,
              objectVersionNumber: data.objectVersionNumber,
              holidaySaturday: data.holidaySaturday,
              holidaySunday: data.holidaySunday,
              holidayFestival: data.holidayFestival,
            },
            OnSaturday: data.holidaySaturday,
            OnSunday: data.holidaySunday,
            timeSetting: data.enabledWorkTime,
            weekDays: this.getWorkTime(data.workTimeList),
            loading: false,
          });
          this.setAllCalendarData(data); // 设置工作日数据
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  getWorkTime(data) {
    const { weekDays } = this.state;
    data.forEach((v1) => { // 解析出工作时间数据
      weekDays.forEach((v2, i) => {
        if (v2.weekDay === v1.weekDay) {
          weekDays[i] = {
            ...v1,
            postpositionStart: v1.postpositionStart && setDefaultDate(v1.postpositionStart),
            postpositionEnd: v1.postpositionEnd && setDefaultDate(v1.postpositionEnd),
            precursorStart: v1.precursorStart && setDefaultDate(v1.precursorStart),
            precursorEnd: v1.precursorEnd && setDefaultDate(v1.precursorEnd),
          };
        }
      });
    });
    return weekDays;
  }

  /**
   * 设置工作日数据
   * @param data
   */
  setAllCalendarData({ calendarsDateList }) {
    const { allCalendarData } = this.state;
    calendarsDateList.forEach((v, i) => {
      const currentDate = moment(v.date);
      const date = currentDate.date();
      const month = currentDate.month();
      const day = currentDate.day();
      let arryStr = '';
      if (day === 0) {
        arryStr = 'sundayWorkDay';
      } else if (day === 6) {
        arryStr = 'saturdayWorkDay';
      } else {
        arryStr = 'noWorkDay';
      }
      if (arryStr) {
        allCalendarData[month][arryStr].push({
          ...v,
          dateNumber: currentDate,
        });
      }
    });
    this.setState({
      allCalendarData,
    });
  }

  /**
   * 每次修改后，重新设置工作时间状态
   * @param weekDay
   * @param postpositionStart
   * @param postpositionEnd
   * @param precursorStart
   * @param precursorEnd
   * @param callback
   * @param objectVersionNumber
   */
  setWorkingState = ({ weekDay, postpositionStart, postpositionEnd, precursorStart, precursorEnd, objectVersionNumber }, callback = noop) => {
    const { weekDays } = this.state;
    weekDays.map((v) => {
      if (weekDay === v.weekDay) {
        v.postpositionStart = postpositionStart || '';
        v.postpositionEnd = postpositionEnd || '';
        v.precursorStart = precursorStart || '';
        v.precursorEnd = precursorEnd || '';
        v.objectVersionNumber = objectVersionNumber;
      }
      return v;
    });

    this.setState({
      weekDays,
    }, () => {
      callback(); // 设置完weekDays后调用回调
    });
  }

  /**
   * 点击周六
   * @param e
   */
  setSaturday = (e) => {
    this.setState({ OnSaturday: e.target.checked });
    this.removeWeekendWorkDay('saturdayWorkDay', e.target.checked);
  }

  /**
   * 点击周日
   * @param e
   */
  setSunday = (e) => {
    this.setState({ OnSunday: e.target.checked });
    this.removeWeekendWorkDay('sundayWorkDay', e.target.checked);
  }

  /**
   * 点击周末后调用后台请求
   * @param week
   * @param checked
   */
  removeWeekendWorkDay = (week, checked) => {
    const { intl, AppState } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    const { allCalendarData, calendarInfo, OnSaturday: holidaySaturday, OnSunday: holidaySunday, timeSetting } = this.state;
    const calendarsDateList = [];
    allCalendarData.forEach((v) => {
      calendarsDateList.push(...v[week]);
    });
    CalendarStore.calendarsWeekendRevision(organizationId, {
      ...calendarInfo,
      holidaySaturday: week === 'saturdayWorkDay' ? checked : holidaySaturday,
      holidaySunday: week === 'sundayWorkDay' ? checked : holidaySunday,
      calendarsDateList,
    })
      .then((data) => {
        if (data) {
          allCalendarData.map((v) => { // 选择周末后清空相关数据
            v[week].length = 0;
            return v;
          });
          this.setState({
            allCalendarData,
            calendarInfo: {
              ...calendarInfo,
              objectVersionNumber: data.objectVersionNumber,
            },
          });
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  /**
   * 选择每个工作日后
   * @param value
   */
  onSelect = (value) => {
    const { allCalendarData, edit, id, OnSaturday, OnSunday } = this.state;
    const { intl, AppState } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    if (!edit) {
      Choerodon.prompt(CalendarStore.languages[`${intlPrefix}.working.edit.msg`]);
      return;
    }
    const month = value.month() + 1;
    const date = value.date();
    const day = value.day();
    const year = value.year();

    let currentData = {};
    let judgeData = '';
    let isDate = false; // 是否有这条数据
    let currentIndex = '';
    allCalendarData.map((v) => { // 循环得到已有的数据，修改状态；或者没有的数据，创建
      if (v.month === month) {
        if (day === 0) {
          judgeData = 'sundayWorkDay';
        } else if (day === 6) {
          judgeData = 'saturdayWorkDay';
        } else {
          judgeData = 'noWorkDay';
        }
        const index = v[judgeData].filter((v1, i) => {
          if (v1.dateNumber.date() === date && v1.dateNumber.year() === year) {
            currentIndex = i;
          }
          return v1.dateNumber.date() === date && v1.dateNumber.year() === year;
        });
        if (index.length > 0) {
          currentData = { ...index[0] };
          currentData.holiday = !index[0].holiday;
          isDate = true;
        } else {
          let holiday = true;
          if (judgeData === 'sundayWorkDay' && !OnSunday) {
            holiday = false;
          } else if (judgeData === 'saturdayWorkDay' && !OnSaturday) {
            holiday = false;
          }
          currentData = {
            day: 0,
            holiday,
            iamOrganizationId: organizationId,
            month: 0,
            year: 0,
            calendarId: id,
          };
          isDate = false;
        }
      }
      return v;
    });

    value.second(0);
    value.minute(0);
    value.hour(0);
    CalendarStore.calendarsDate(organizationId, {
      ...currentData,
      date: value.format('YYYY-MM-DD HH:mm:ss'),
    })
      .then((data) => {
        const { failed, message } = data;
        if (failed) {
          if (message === 'error.calendarsDate.update') {
            Choerodon.prompt(CalendarStore.languages[`${intlPrefix}.frequentOperation`]);
          } else if (message === 'error.calendarsDate.same') {
            Choerodon.prompt(CalendarStore.languages[`${intlPrefix}.frequentOperation`]);
          } else {
            Choerodon.prompt(message);
          }
        } else {
          if (isDate) {
            allCalendarData[month - 1][judgeData][currentIndex] = { ...data, dateNumber: moment(data.date) };
          } else {
            allCalendarData[month - 1][judgeData].push({
              ...data,
              dateNumber: moment(data.date),
            });
          }
          this.setState({
            allCalendarData,
          });
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  /**
   * 年份切换时
   * @param value
   */
  onYearChange = (value) => {
    this.setState({
      currentYear: value,
    });
  }


  /**
   * 工作时间改变时调用
   */
  onWorkDayChange = (_data, workTime) => {
    const { AppState, intl } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    const { weekDay, postpositionStart, postpositionEnd, precursorStart, precursorEnd } = _data;
    CalendarStore.workTimeRevision(organizationId, {
      ...workTime,
      postpositionStart: postpositionStart && postpositionStart.format('YYYY-MM-DD HH:mm:ss'),
      postpositionEnd: postpositionEnd && postpositionEnd.format('YYYY-MM-DD HH:mm:ss'),
      precursorStart: precursorStart && precursorStart.format('YYYY-MM-DD HH:mm:ss'),
      precursorEnd: precursorEnd && precursorEnd.format('YYYY-MM-DD HH:mm:ss'),
    })
      .then((data) => {
        if (data) {
          const { objectVersionNumber } = data;
          this.setWorkingState({ ..._data, objectVersionNumber });
        } else {
          Choerodon.prompt(CalendarStore.languages['save.error']);
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  /**
   * 开启关闭工作时间
   */
  onTimeSetting = (checked) => {
    const { weekDays, id } = this.state;
    weekDays.map((v) => {
      v.postpositionStart = v.postpositionStart && setDefaultDate(moment(v.postpositionStart)).format('YYYY-MM-DD HH:mm:ss');
      v.postpositionEnd = v.postpositionEnd && setDefaultDate(moment(v.postpositionEnd)).format('YYYY-MM-DD HH:mm:ss');
      v.precursorStart = v.precursorStart && setDefaultDate(moment(v.precursorStart)).format('YYYY-MM-DD HH:mm:ss');
      v.precursorEnd = v.precursorEnd && setDefaultDate(moment(v.precursorEnd)).format('YYYY-MM-DD HH:mm:ss');
      v.calendarId = id;
      return v;
    });
    const { AppState, intl } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    const { calendarInfo } = this.state;
    CalendarStore.calendarsWeekTime(organizationId, {
      calendarId: id,
      objectVersionNumber: calendarInfo.objectVersionNumber,
      enabledWorkTime: checked,
      workTimeList: weekDays,
    })
      .then((data) => {
        if (data) {
          this.setState({
            calendarInfo: {
              ...calendarInfo,
              objectVersionNumber: data.objectVersionNumber,
            },
            weekDays: data.workTimeList ? this.getWorkTime(data.workTimeList) : weekDays,
            timeSetting: checked,
          });
        } else {
          Choerodon.prompt(CalendarStore.languages['save.error']);
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  /**
   * 点击保存按钮
   */
  saveData = () => {
    const { AppState, intl } = this.props;
    const { OnSaturday, OnSunday, timeSetting, calendarInfo, edit } = this.state;
    const { id: organizationId } = AppState.currentMenuType;
    this.props.form.validateFieldsAndScroll((err, formData, modify) => {
      if (!err) {
        if (edit) {
          CalendarStore.calendarsRevision(organizationId, { // 编辑的时候调用
            ...calendarInfo,
            ...formData,
            holidaySaturday: OnSaturday,
            holidaySunday: OnSunday,
            enabledWorkTime: timeSetting,
          })
            .then((data) => {
              if (data) {
                Choerodon.prompt(CalendarStore.languages['save.success']);
                this.setState({
                  calendarInfo: {
                    ...data,
                  },
                });
              } else {
                Choerodon.prompt(CalendarStore.languages['save.error']);
              }
            })
            .catch((error) => {
              Choerodon.handleResponseError(error);
            });
        } else {
          CalendarStore.calendarsNew(organizationId, { // 新建的时候调用
            ...formData,
            iamOrganizationId: organizationId,
            calendarStatus: 'Y',
            holidaySaturday: OnSaturday,
            holidaySunday: OnSunday,
            enabledWorkTime: timeSetting,
            holidayFestival: false,
          })
            .then((data) => {
              if (data) {
                Choerodon.prompt(CalendarStore.languages['save.success']);
                this.setState({
                  edit: true,
                  id: data.calendarId,
                  calendarInfo: {
                    ...data,
                  },
                });
              } else {
                Choerodon.prompt(CalendarStore.languages['save.error']);
              }
            })
            .catch((error) => {
              Choerodon.handleResponseError(error);
            });
        }
      }
    });
  }

  /**
   * 渲染12个日历
   */
  renderCalendarYear() {
    const { allCalendarData, currentYear, OnSaturday, OnSunday } = this.state;
    const mode = 'month';
    const allCalendar = allCalendarData.map(v => (
      <SingleCalendar
        defaultValue={moment(`${currentYear}/${v.month}/01`)}
        noWorkDay={v.noWorkDay}
        saturdayWorkDay={v.saturdayWorkDay}
        sundayWorkDay={v.sundayWorkDay}
        key={v.month}
        OnSaturday={OnSaturday}
        OnSunday={OnSunday}
        onSelect={this.onSelect}
      />
    ));

    return (
      <div>
        {allCalendar}
      </div>
    );
  }

  /**
   * 渲染年
   */
  renderYear() {
    const options = [];
    const currentYear = moment().year();
    for (let i = currentYear; i <= 2100; i += 1) {
      options.push(<Option key={i} value={i}>{`${i.toString()}`}{CalendarStore.languages.year}</Option>);
    }
    return options;
  }

  /**
   * 渲染工作时间
   */
  renderOperatingHours(AppState) {
    const options = [];
    for (let i = 1; i <= 7; i += 1) {
      options.push(<OperatingHours
        AppState={AppState}
        timeSetting={this.state.timeSetting}
        onWorkDayChange={this.onWorkDayChange}
        workTime={this.state.weekDays[i - 1]}
        key={i}
        weekDay={`${i}`}
      />);
    }
    return options;
  }

  render() {
    const { intl, AppState } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    const { edit, timeSetting } = this.state;
    const { getFieldDecorator } = this.props.form;
    const { currentYear, calendarInfo, OnSaturday, OnSunday, calendarLookupType } = this.state;

    return (
      <Page className="choerodon-calendarEA">
        <Header
          title={CalendarStore.languages[`${intlPrefix}.header.title`]}
          backPath={`/iam/calendar?type=organization&id=${this.props.AppState.currentMenuType.id}&name=${this.props.AppState.currentMenuType.name}&organizationId=${this.props.AppState.currentMenuType.organizationId}`}
        >
          <Button
            onClick={this.saveData}
            style={{ color: '#04173F' }}
          >
            <Icon type="baocun" style={{ color: '#2196F3', width: 25 }} />
            {CalendarStore.languages.save}
          </Button>
        </Header>
        <Content>
          <Spin spinning={this.state.loading}>
            <Form layout="vertical">
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('calendarName', {
                  initialValue: calendarInfo.calendarName || '',
                  rules: [{
                    required: true,
                    message: CalendarStore.languages[`${intlPrefix}.calendarName.require.msg`],
                  }],
                })(
                  <Input
                    label={CalendarStore.languages[`${intlPrefix}.calendarName`]}
                    size="default"
                    maxLength={30}
                    style={{ width: inputWidth }}
                  />,
                )}
              </FormItem>

              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('calendarType', {
                  initialValue: calendarInfo.calendarType || '',
                  rules: [{
                    required: true,
                    message: CalendarStore.languages[`${intlPrefix}.calendarType.require.msg`],
                  }],
                })(
                  <Select
                    label={CalendarStore.languages[`${intlPrefix}.calendarType`]}
                    style={{ width: inputWidth }}
                    disabled={calendarInfo.calendarType === 'WORK'}
                    getPopupContainer={trigger => trigger.parentNode}
                  >
                    {calendarLookupType.map(data => (calendarInfo.calendarType !== 'WORK' && data.lookupValue === 'WORK' ? null
                      : (
                        <Option
                          key={data.lookupValue}
                          title={data.lookupMeaning}
                          value={data.lookupValue}
                        >{data.lookupMeaning}
                        </Option>
                      )
                    ))}
                  </Select>,
                )}
              </FormItem>

              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('calendarTimeZone', {
                  initialValue: calendarInfo.calendarTimeZone || '',
                  rules: [{
                    required: true,
                    message: CalendarStore.languages[`${intlPrefix}.calendarTimeZone.require.msg`],
                  }],
                })(
                  <Select
                    label={CalendarStore.languages[`${intlPrefix}.calendarTimeZone`]}
                    style={{ width: inputWidth }}
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                  >
                    <Option value="UTC +8">{CalendarStore.languages[`${intlPrefix}.eastEight`]}</Option>
                    <Option value="UTC +7">{CalendarStore.languages[`${intlPrefix}.eastSeven`]}</Option>
                  </Select>,
                )}
              </FormItem>
            </Form>

            <Tabs defaultActiveKey="1">
              <TabPane tab={CalendarStore.languages[`${intlPrefix}.workingDay`]} key="1">
                <div>
                  <Select
                    label={CalendarStore.languages[`${intlPrefix}.selectYear`]}
                    defaultValue={currentYear}
                    onChange={this.onYearChange}
                    style={{ width: inputWidth }}
                    disabled={!edit}
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                  >
                    {this.renderYear()}
                  </Select>

                  <div className="checkbox">
                    <Checkbox disabled={!edit} onChange={this.setSaturday} checked={OnSaturday}>{CalendarStore.languages[`${intlPrefix}.checkSixWorkDay`]}</Checkbox>
                  </div>
                  <div className="checkbox" style={{ paddingBottom: '10px' }}>
                    <Checkbox disabled={!edit} onChange={this.setSunday} checked={OnSunday}>{CalendarStore.languages[`${intlPrefix}.checkDayWorkDay`]}</Checkbox>
                  </div>
                  <div style={{ paddingBottom: '10px' }}>
                    {CalendarStore.languages[`${intlPrefix}.redDayNotWork`]}
                  </div>
                  {this.renderCalendarYear()}
                </div>
              </TabPane>

              <TabPane tab={CalendarStore.languages[`${intlPrefix}.operatingHours`]} key="2">
                <Card>{CalendarStore.languages[`${intlPrefix}.openWorkTimeSetting`]}<Switch
                  disabled={!edit}
                  onChange={checked => this.onTimeSetting(checked)}
                  checked={timeSetting}
                />
                </Card>
                {this.renderOperatingHours(AppState)}
              </TabPane>
            </Tabs>
          </Spin>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EditCalendar)));
