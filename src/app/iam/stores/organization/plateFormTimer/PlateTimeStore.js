/** 2019/8/8
 *作者:高梦龙
 *文件名： 平台层定时任务
 */

import { action, observable, computed } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../stores/language/languageStore';

@store('PlateTimeStore')
class PlateTimeStore extends LanguageStore {
  constructor() {
    super('platformTime');
  }

  @observable isLoading = true;

  @observable enabled =[];

  @observable requestMethod =[];

  @observable paramType =[];


  @action
  setParamType(paramType) {
    this.paramType = paramType;
  }

  @computed
  get getParamType() {
    return this.paramType;
  }


  @action
  setRequestMethod(requestMethod) {
    this.requestMethod = requestMethod;
  }

  @computed
  get getRequestMethod() {
    return this.requestMethod;
  }

  @action
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  @computed
  get getEnabled() {
    return this.enabled;
  }

  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }


  // 查询分页
  queryTimer = (page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`scheduler/v1/task/site/page?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  }

  // 生效快码
  getIsEnabled = (code = 'FND_VALID_STATUS') => axios.get(`fnd/v1/lookup/value/dto?lookup_type_code=${code}`).then((data) => {
    this.setEnabled(data);
  });
  // 请求方法
  getRequestMethods = (code = 'FND_TASK_REQUEST_TYPE') => axios.get(`fnd/v1/lookup/value/dto?lookup_type_code=${code}`).then((data) => {
    this.setRequestMethod(data);
  });
 // 参数类型
  getParamTypes = (code = 'FND_TASK_PARAMETERS_TYPE') => axios.get(`fnd/v1/lookup/value/dto?lookup_type_code=${code}`).then((data) => {
    this.setParamType(data);
  });

  //启用

  enableTask=(taskSiteId) => axios.post(`scheduler/v1/task/site/enable/${taskSiteId}`)

  // 禁用
  disableTask=(taskSiteId) => axios.post(`scheduler/v1/task/site/disable/${taskSiteId}`)


  // 提交任务分配
  handleAllocation=(taskInfoSite) => axios.put('scheduler/v1/task/site', JSON.stringify(taskInfoSite))

  // 修改任务分配
  editAllocation=(taskInfoSite) => axios.post('scheduler/v1/task/site', JSON.stringify(taskInfoSite))

  // 查询详情
  queryDetail=(taskSiteId) => axios.get(`scheduler/v1/task/site/${taskSiteId}`);

  /**
   *  获取服务
   */
  @action
  getService = () => axios.get('manager/v1/services/manager?size=400')

}

const plateTimeStore = new PlateTimeStore();

export default plateTimeStore;
