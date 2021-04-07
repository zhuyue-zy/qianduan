/** 2019/8/8
 *作者:高梦龙
 *文件名： 租户定时任务
 */

import { action, observable, computed } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../stores/language/languageStore';
import { message } from 'yqcloud-ui';

@store('TeantTimeStore')
class TeantTimeStore extends LanguageStore {
  constructor() {
    super('TenantTime');
  }

  @observable isLoading = true;

  @observable enabled = [];

  @observable taskStatus = [];

  @observable taskTime = [];

  @observable logStatus = [];


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


  @action
  setTaskStatus(taskStatus) {
    this.taskStatus = taskStatus;
  }

  @computed
  get getTaskStatus() {
    return this.taskStatus;
  }

  @action
  setTaskTime(taskTime) {
    this.taskTime = taskTime;
  }

  @computed
  get getTaskTime() {
    return this.taskTime;
  }

  @action
  setLogStatus(logStatus) {
    this.logStatus = logStatus;
  }

  @computed
  get getLogStatus() {
    return this.logStatus;
  }

  getTimedTasks = (iamOrganizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`scheduler/v1/${iamOrganizationId}/organizations/task/page?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 查询详情日志信息
  getTimeLogInfo = (iamOrganizationId, page, sortParam, filters, taskId) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`scheduler/v1/${iamOrganizationId}/organizations/task/log/page?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}&taskId=${taskId}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  }

  // 查询任务列表
  queryTaskList = (iamOrganizationId) => axios.get(`scheduler/v1/${iamOrganizationId}/organizations/task/site/list`);


  // 提交定时任务
  commitTask = (iamOrganizationId, taskInfo) => axios.put(`scheduler/v1/${iamOrganizationId}/organizations/task`, JSON.stringify(taskInfo))

  // 更改定时任务

  updateTask=(iamOrganizationId, taskInfo) => axios.post(`scheduler/v1/${iamOrganizationId}/organizations/task`, JSON.stringify(taskInfo))

  // 获取编辑页面详情
  getTenantEdit = (iamOrganizationId, taskId) => axios.get(`scheduler/v1/${iamOrganizationId}/organizations/task/${taskId}`).then((data) => {
    this.setIsLoading(false);
    return data;
  });


  // 生效快码
  getIsEnabled = (code = 'FND_ENABLE_STATUS') => axios.get(`fnd/v1/lookup/value/dto?lookup_type_code=${code}`).then((data) => {
    this.setEnabled(data);
  });

  // 定时任务状态
  timeTask = (organizationId, code = 'FND_TASK_SCHEDULER_STATUS') => axios.get(`/fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setTaskStatus(data);
    return data;
  });

  // 获取时间快码
  getTimeTasks = (organizationId, code = 'FND_TASK_TRIGGER_TIME') => axios.get(`/fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setTaskTime(data);
    return data;
  });

  // 日志状态
  getLogsStatus = (organizationId, code = 'FND_DOWNLOAD_STATUS') => axios.get(`/fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setLogStatus(data);
    return data;
  });


  //停用
  disableTask = (organizationId, taskId) => axios.post(`scheduler/v1/${organizationId}/organizations/task/disable/${taskId}`)

  //启用
  enableTask = (organizationId, taskId) => axios.post(`scheduler/v1/${organizationId}/organizations/task/enable/${taskId}`)

  // 删除
  deletetask = (organizationId, taskId) => axios.delete(`scheduler/v1/${organizationId}/organizations/task/${taskId}`)

  getCode = (code) => axios.get(`/fnd/v1/sys/messages/queryCode?messageCode=${code}`)
    .then((data) => {
      const { failed: infailed } = data;
      const types = data.type;
      if (!infailed) {
        message[types](data.content, undefined, undefined, `${data.placement}`);
      } else {
        message[types](code, undefined, undefined, `${data.placement}`);
      }
    });

}
const teantTimeStore = new TeantTimeStore();

export default teantTimeStore;

