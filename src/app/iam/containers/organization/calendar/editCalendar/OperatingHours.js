/**
 * Create By liuchuan on 2018/9/28.
 */
import React, { Component } from 'react';
import { TimePicker } from 'yqcloud-ui';
import moment from 'moment';
import { injectIntl } from 'react-intl';
import CalendarStore from '../../../../stores/organization/calendar';

const intlPrefix = 'organization.calendar';

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

/**
 * 工作时间组件
 */
class OperatingHours extends Component {
  state = this.getInitState();

  getInitState() {
    const { workTime } = this.props;
    return {
      combinedSplit: !!workTime.postpositionEnd,
      postpositionStart: workTime.postpositionStart || setDefaultDate(moment('14:00', 'HH:mm')),
      postpositionEnd: workTime.postpositionEnd || setDefaultDate(moment('17:00', 'HH:mm')),
      precursorStart: workTime.precursorStart || setDefaultDate(moment('08:00', 'HH:mm')),
      precursorEnd: workTime.precursorEnd || setDefaultDate(moment('17:00', 'HH:mm')),
    };
  }

  componentWillMount() {
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    CalendarStore.queryLanguage(AppState.menuType.id, AppState.userInfo.language);
  };

  modifyCombinedSplit = () => {
    const { timeSetting } = this.props;
    const { combinedSplit } = this.state;
    if (timeSetting) {
      if (combinedSplit) {
        this.setState({
          combinedSplit: false,
          precursorEnd: setDefaultDate(moment('17:00', 'HH:mm')),
        }, () => (this.onWorkDayChange()));
      } else {
        this.setState({
          combinedSplit: true,
          precursorEnd: setDefaultDate(moment('12:00', 'HH:mm')),
        }, () => (this.onWorkDayChange()));
      }
    }
  }

  /**
   * 每次改变时判断
   * @param type
   * @param time
   */
  onChange = (type, time) => {
    const obj1 = {};
    obj1[type] = time;
    const { intl } = this.props;
    const { postpositionStart, postpositionEnd, precursorStart, precursorEnd, combinedSplit } = this.state;
    switch (type) {
      case 'postpositionStart':
        if (time.isBefore(precursorStart)) {
          Choerodon.prompt(CalendarStore.languages[ `${intlPrefix}.working.min.msg`]);
          return;
        }
        if (time.isAfter(postpositionEnd)) {
          Choerodon.prompt(CalendarStore.languages[ `${intlPrefix}.working.max.msg`]);
          return;
        }
        break;
      case 'postpositionEnd':
        if (time.isBefore(postpositionStart)) {
          Choerodon.prompt(CalendarStore.languages[ `${intlPrefix}.working.min.msg`]);
          return;
        }
        break;
      case 'precursorStart':
        if (time.isAfter(precursorEnd)) {
          Choerodon.prompt(CalendarStore.languages[ `${intlPrefix}.working.max.msg`]);
          return;
        }
        break;
      case 'precursorEnd':
        if (combinedSplit) {
          if (time.isBefore(precursorStart)) {
            Choerodon.prompt(CalendarStore.languages[ `${intlPrefix}.working.min.msg`]);
            return;
          }
          if (time.isAfter(postpositionStart)) {
            Choerodon.prompt(CalendarStore.languages[ `${intlPrefix}.working.min.msg`]);
            return;
          }
        } else if (time.isBefore(precursorStart)) {
          Choerodon.prompt(CalendarStore.languages[ `${intlPrefix}.working.max.msg`]);
          return;
        }
        break;
      default:
        break;
    }
    this.setState(obj1, () => (this.onWorkDayChange()));
  }

  // 传递事件给父组件
  onWorkDayChange = () => {
    const { onWorkDayChange, weekDay, workTime } = this.props;
    const { postpositionStart, postpositionEnd, precursorStart, precursorEnd, combinedSplit } = this.state;
    if (combinedSplit) {
      onWorkDayChange({
        postpositionStart,
        postpositionEnd,
        precursorStart,
        precursorEnd,
        weekDay,
      }, workTime);
    } else {
      onWorkDayChange({
        precursorStart,
        precursorEnd,
        weekDay,
      }, workTime);
    }
  }

  render() {
    const { weekDay, timeSetting } = this.props;
    const { combinedSplit } = this.state;
    const format = 'HH:mm';
    const weekStr = `${{
      1: `${CalendarStore.languages[`${intlPrefix}.Monday`]}`,
      2: `${CalendarStore.languages[`${intlPrefix}.Tuesday`]}`,
      3: `${CalendarStore.languages[`${intlPrefix}.Wednesday`]}`,
      4: `${CalendarStore.languages[`${intlPrefix}.Thursday`]}`,
      5: `${CalendarStore.languages[`${intlPrefix}.Friday`]}`,
      6: `${CalendarStore.languages[`${intlPrefix}.Saturday`]}`,
      7: `${CalendarStore.languages[`${intlPrefix}.Sunday`]}`,
    }[weekDay]}`;
    return (
      <div className="working-day" style={{ color: timeSetting ? '#3f51b5' : 'rgb(204, 204, 204)' }}>
        <span>{weekStr}</span>
        <span className="working-day-font1">{CalendarStore.languages[`${intlPrefix}.startOpen`]}</span>
        <TimePicker
          disabled={!timeSetting}
          value={this.state.precursorStart}
          onChange={this.onChange.bind(this, 'precursorStart')}
          format={format}
          getPopupContainer={trigger => trigger.parentNode}
        />

        <span className="working-day-font2">{CalendarStore.languages[`${intlPrefix}.endUp`]}</span>
        <TimePicker
          disabled={!timeSetting}
          value={this.state.precursorEnd}
          onChange={this.onChange.bind(this, 'precursorEnd')}
          format={format}
          getPopupContainer={trigger => trigger.parentNode}
        />

        <span style={{ display: combinedSplit ? 'inline-block' : 'none' }}>
          <span className="working-day-font3">{CalendarStore.languages[`${intlPrefix}.startOpen`]}</span>
          <TimePicker
            disabled={!timeSetting}
            value={this.state.postpositionStart}
            onChange={this.onChange.bind(this, 'postpositionStart')}
            format={format}
            getPopupContainer={trigger => trigger.parentNode}
          />

          <span className="working-day-font4">{CalendarStore.languages[`${intlPrefix}.endUp`]}</span>
          <TimePicker
            disabled={!timeSetting}
            value={this.state.postpositionEnd}
            onChange={this.onChange.bind(this, 'postpositionEnd')}
            format={format}
            getPopupContainer={trigger => trigger.parentNode}
          />
        </span>

        <span
          className="working-day-font5"
          style={{ cursor: timeSetting ? 'pointer' : 'not-allowed' }}
          onClick={this.modifyCombinedSplit}
        >{combinedSplit ? `${CalendarStore.languages[`${intlPrefix}.heBin`]}` : `${CalendarStore.languages[`${intlPrefix}.chaiFen`]}`}{CalendarStore.languages[`${intlPrefix}.timeTIME`]}
        </span>
      </div>
    );
  }
}

export default injectIntl(OperatingHours);
