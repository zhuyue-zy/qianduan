/*
* @description:定时任务历史记录仓库
* @author：郭杨
* @update 2018-10-15 17:19
*/
import { action, observable, computed } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';

@store('TimedTaskHistoryStore')
class TimedTaskHistoryStore extends LanguageStore {

  @observable isLoading = true;

  constructor() {
    super('timedTask');
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
  loadHistory = (organizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`scheduler/v1/job/log/page?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`)
      .then((data) => {
        this.setIsLoading(false);
        return data;
      });
  }
}

const timedTaskHistoryStore = new TimedTaskHistoryStore();

export default timedTaskHistoryStore;
