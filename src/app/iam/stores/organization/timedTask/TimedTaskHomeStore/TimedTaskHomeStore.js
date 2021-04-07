/*
* @description:定时任务主页仓库
* @author：郭杨
* @update 2018-10-10 11:38
*/
import { action, observable, computed } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';

@store('TimedTaskHomeStore')
class TimedTaskHomeStore extends LanguageStore{
  @observable totalSize;

  @observable totalPage;

  @observable isLoading = true;

  @observable enabled =[];

  constructor(totalPage = 1, totalSize = 0) {
    super('timedTask');
    this.totalPage = totalPage;
    this.totalSize = totalSize;
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
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  @action
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  @computed
  get getEnabled() {
    return this.enabled;
  }

  getTimedTasks = (iamOrganizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `scheduler/v1/job/list/page?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  /**
     *  获取服务
     */
  @action
  getService = () => axios.get('manager/v1/services/manager');

  /**
   *  删除任务
   *  @param jobId 任务
   */
  @action
  deleteTask = jobId => axios.delete(`scheduler/v1/job/${jobId}`);

  /**
   *  启用任务
   *  @param jobId 任务id
   */
  @action
  enableTask = jobId => axios.put(`scheduler/v1/job/resume/${jobId}`);

  /**
   *  暂停任务
   *  @param jobId 任务id
   */
  @action
  disableTask = jobId => axios.put(`scheduler/v1/job/pause/${jobId}`);

  // 生效快码
  getIsEnabled = (code = 'FND_ENABLE_STATUS') => axios.get(`fnd/v1/lookup/value/dto?lookup_type_code=${code}`).then((data) => {
    this.setEnabled(data);
  });
}

const timedTaskHomeStore = new TimedTaskHomeStore();

export default timedTaskHomeStore;
