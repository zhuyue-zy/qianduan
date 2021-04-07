/**
 * Create By liuchuan on 2018/9/18.
 */
import React, { Component } from 'react';
import moment from 'moment';
import 'moment/locale/zh-cn';
import { withRouter } from 'react-router-dom';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { Calendar, Card } from 'yqcloud-ui';
import './index.scss';
import CalendarStore from '../../../../stores/organization/calendar';

@inject('AppState')
@observer
class SingleCalendar extends Component {
  state = this.getInitState();

  getInitState() {
    return {};
  }

  componentDidMount() {
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CalendarStore.queryLanguage(id, AppState.currentLanguage);
  };

  onSelect = (value) => {
    const { onSelect } = this.props;
    onSelect(value);
  }

  dateFullCellRender = (value) => {
    // 得到当前组件的月份
    const { defaultValue, noWorkDay, OnSunday, OnSaturday, saturdayWorkDay, sundayWorkDay } = this.props;
    const currentMonth = defaultValue.month();

    const date = value.date();
    const month = value.month();
    const day = value.day();
    const today = moment();
    const year = value.year();

    // 三种状态 工作日 1，非工作日 2，不可选日期 3
    const style = {};
    let classType = '';
    let status = 1;
    // 月份为当前月,并且是今日之后的日期
    if (month === currentMonth && (value.isAfter(today) || today.isSame(value, 'day'))) {
      // 周日
      if (day === 0) {
        if (OnSunday) {
          status = 1;
          if (sundayWorkDay.filter(v => v.dateNumber.date() === date && v.dateNumber.year() === year && v.holiday).length > 0) {
            status = 2;
          }
        } else {
          status = 2;
          if (sundayWorkDay.filter(v => v.dateNumber.date() === date && v.dateNumber.year() === year && !v.holiday).length > 0) {
            status = 1;
          }
        }
      } else if (day === 6) {
        if (OnSaturday) {
          status = 1;
          if (saturdayWorkDay.filter(v => v.dateNumber.date() === date && v.dateNumber.year() === year && v.holiday).length > 0) {
            status = 2;
          }
        } else {
          status = 2;
          if (saturdayWorkDay.filter(v => v.dateNumber.date() === date && v.dateNumber.year() === year && !v.holiday).length > 0) {
            status = 1;
          }
        }
      } else {
        status = 1;
        // 日历中周一至周五存在的值
        if (noWorkDay.filter(v => v.dateNumber.date() === date && v.dateNumber.year() === year && v.holiday).length > 0) {
          status = 2;
        }
      }
    } else {
      status = 3;
    }

    if (month === currentMonth && today.isSame(value, 'day')) {
      style.border = '1px solid #2196F3';
    }

    if (status === 1) {
      classType = 'cell-working-day';
    } else if (status === 2) {
      classType = 'cell-no-working-day';
    } else {
      classType = 'cell-disable-day';
    }
    return (
      <div style={style} className={`ant-fullcalendar-date ${classType}`}>
        {date}
      </div>
    );
  }

  /**
   * 禁用今天之前的日期
   * @param value
   * @returns {boolean}
   */
  disabledDate = (value) => {
    // 得到当前组件的月份
    const { defaultValue } = this.props;
    const currentMonth = defaultValue.month();
    // 得到当前日期
    const today = moment();
    const month = value.month();
    if (today.isSame(value, 'day')) {
      return false;
    }
    return month !== currentMonth || value.isBefore(today);
  }

  render() {
    const { defaultValue } = this.props;
    const currentMonth = defaultValue.month();
    return (
      <div
        className="calendar-single"
        style={{ width: 240, border: '1px solid #d9d9d9', borderRadius: 4, display: 'inline-block' }}
      >
        <div style={{ textAlign: 'center' }}>
          {currentMonth + 1}月
        </div>
        <Calendar
          dateFullCellRender={this.dateFullCellRender}
          fullscreen={false}
          value={defaultValue}
          onSelect={this.onSelect}
          disabledDate={this.disabledDate}
          mode="month"
        />
      </div>
    );
  }
}

export default withRouter(injectIntl(SingleCalendar));
