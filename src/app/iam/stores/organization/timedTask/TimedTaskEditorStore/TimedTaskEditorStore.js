/*
* @description:定时任务编辑栏仓库
* @author：郭杨
* @update 2018-10-11 13:35
*/
import { action, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';

@store('TimedTaskEditorStore')
class TimedTaskEditorStore extends LanguageStore {

  constructor() {
    super('timedTask');
  }

  @observable record = {};

  /**
   *  新建任务
   *  @param task 要新建的task数据
   */
  createTask = (task) => {
    if (!task.startTime || task.startTime === '') {
      delete task.startTime;
    }
    delete task.expressionExample;
    task.triggerType = 'CRON';
    return axios.post('scheduler/v1/job', JSON.stringify(task));
  };

  /**
   *  更新任务
   *  @param task 要更新的task数据
   */
  updateTask = (task) => {
    return axios.put('scheduler/v1/job', JSON.stringify(task));
  };

  /**
   *  获取服务
   */
  @action
  getService = () => axios.get('manager/v1/services/manager?size=400')
    .then(({ content }) => {
      const ret = [];
      const defaultService = ['api-gateway', 'oauth-server', 'config-server', 'gateway-helper'];
      content.forEach(({ serviceName }) => {
        if (defaultService.indexOf(serviceName) === -1) {
          ret.push(serviceName);
        }
      });
      return ret;
    });

}

const timedTaskEditorStore = new TimedTaskEditorStore();

export default timedTaskEditorStore;
