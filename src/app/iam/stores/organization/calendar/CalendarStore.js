/**
 * Create By liuchuan on 2018/9/17.
 */
import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('CalendarStore')
class CalendarStore extends LanguageStore {
  @observable isLoading = true;

  @observable calendars = [];

  @observable totalSize;

  @observable totalPage;

  @observable allData = [];

  @observable enabled =[];

  constructor(totalPage = 1, totalSize = 0) {
    super('calendar');
    this.totalPage = totalPage;
    this.totalSize = totalSize;
  }

  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  @action
  setCalendars(data) {
    this.calendars = data;
  }

  @computed
  get getCalendars() {
    return this.calendars;
  }

  @action
  setTotalSize(totalSize) {
    this.totalSize = totalSize;
  }

  @computed
  get getTotalSize() {
    return this.totalSize;
  }

  @action
  setTotalPage(totalPage) {
    this.totalPage = totalPage;
  }

  @computed
  get getTotalPage() {
    return this.totalPage;
  }

  @action
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  @computed
  get getEnabled() {
    return this.enabled;
  }

  /**
   * 加载日历列表
   * @param organizationId
   * @param page
   * @param sortParam
   * @param filters
   * @param param
   * @returns {PromiseLike<T | never> | Promise<T | never>}
   */
  loadCalendars = (organizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    return axios.get(
      `/fnd/v1/${organizationId}/sys/calendars/list?page=${page.current - 1}&size=${page.pageSize}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  /**
   * 通过id查询工作日历详情
   * @param organizationId
   * @param id
   * @returns {*}
   */
  selectCalendarById = (organizationId, id) => (
    axios.get(`/fnd/v1/${organizationId}/sys/calendars/${id}`)
  );

  /**
   * 新增日历信息
   * @param organizationId
   * @param data
   * @returns {*}
   */
  calendarsNew = (organizationId, data) => (
    axios.put(`/fnd/v1/${organizationId}/sys/calendars/new`,
      JSON.stringify(data))
  );

  /**
   * 更新一条日历信息
   * @param organizationId
   * @param data
   * @returns {*}
   */
  calendarsRevision = (organizationId, data) => (
    axios.post(`/fnd/v1/${organizationId}/sys/calendars/revision`,
      JSON.stringify(data))
  );

  /**
   * 新增工作时间信息
   * @param organizationId
   * @param data
   * @returns {*}
   */
  workTimeNew = (organizationId, data) => (
    axios.put(`/fnd/v1/${organizationId}/sys/workTime/new`,
      JSON.stringify(data))
  );

  /**
   * 修改一条工作时间信息
   * @param organizationId
   * @param data
   * @returns {*}
   */
  workTimeRevision = (organizationId, data) => (
    axios.post(`/fnd/v1/${organizationId}/sys/workTime/revision`,
      JSON.stringify(data))
  );

  /**
   * 工作日历日期信息维护
   * @param organizationId
   * @param data
   * @returns {*}
   */
  calendarsDate = (organizationId, data) => (
    axios.post(`/fnd/v1/${organizationId}/sys/calendarsDate`,
      JSON.stringify(data))
  );

  /**
   * 工作日历日期信息维护
   * @param organizationId
   * @param data
   * @returns {*}
   */
  calendarsWeekendRevision = (organizationId, data) => (
    axios.post(`/fnd/v1/${organizationId}/sys/calendars/weekend/revision`,
      JSON.stringify(data))
  );

  /**
   * 工作日历日期信息维护
   * @param organizationId
   * @param data
   * @returns {*}
   */
  calendarsWeekTime = (organizationId, data) => (
    axios.post(`/fnd/v1/${organizationId}/sys/calendars/week/time`,
      JSON.stringify(data))
  );

  /**
   * 查询快码
   * @param orgId
   * @param data
   */
  lookupValueDto = (organizationId, code, site) => (
    axios.get(`/fnd/v1/${organizationId}/lookup/value/dto${site ? '/site' : ''}?lookupTypeCode=${code}`)
  );

  // 启用快码
  getIsEnabled = (organizationId, code = 'FND_ENABLE_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });
}


const calendarStore = new CalendarStore();

export default calendarStore;
