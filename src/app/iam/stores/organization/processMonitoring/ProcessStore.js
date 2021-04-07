import {
  observable, action, computed,
} from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language';

@store('ProcessStore')
class ProcessStore extends LanguageStore {

  @observable isLoading = true;

  @observable processes = [];

  @observable totalSize;

  @observable totalPage;

  @observable processList = [];

  @observable organizationList = [];

  @observable typelist =[];

  @observable statuslist =[];

  @observable typeLinelist =[];

  @observable applicationList =[];

  @observable transactionTypeList =[];


  @action setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed get getIsLoading() {
    return this.isLoading;
  }

  @action setProcesses(data) {
    this.processes = data;
  }

  @computed get getProcesses() {
    return this.processes;
  }

  @action setProcessList(data) {
    this.positionList = data;
  }

  @computed get getProcessList() {
    return this.positionList;
  }

  @action setOrganizationList(data) {
    this.organizationList = data;
  }

  @computed get getOrganizationList() {
    return this.organizationList;
  }

  @action
  setTypelist(typelist) {
    this.typelist = typelist;
  }

  @computed
  get getTypelist() {
    return this.typelist;
  }


  @action
  setApplicationList(applicationList) {
    this.applicationList = applicationList;
  }

  @computed
  get getApplicationList() {
    return this.applicationList;
  }

  @action
  setStatuslist(statuslist) {
    this.statuslist = statuslist;
  }

  @action
  setTransactionTypeList(transactionTypeList) {
    this.transactionTypeList = transactionTypeList;
  }

  @computed
  get getTransactionTypeList() {
    return this.transactionTypeList;
  }


  @computed
  get getStatuslist() {
    return this.statuslist;
  }

  constructor(totalPage = 1, totalSize = 0) {
    super('Process');
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
  setTypeLinelist(typeLinelist) {
    this.typeLinelist = typeLinelist;
  }

  @computed
  get getTypeLinelist() {
    return this.typeLinelist;
  }

  // 查询主页面数据
  loadBackLogs = (iamOrganizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `/workflow/v1/${iamOrganizationId}/wfl/monitor/list?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&${filter}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 查看按钮
  getProcessInfoById = (iamOrganizationId, procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/detail/${procInstId}`);

  // 历史纪录
  getProcessHistory = (iamOrganizationId, procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/history/${procInstId}`);

  // 跳转节点按钮
  getProcessJump = (iamOrganizationId, procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/definition/user-tasks/${procInstId}`);

  // 确认节点按钮
  getProcessJumpConfirm = (iamOrganizationId, procInstId, nodeId) => axios.put(`/workflow/v1/${iamOrganizationId}/wfl/monitor/jump?procInstId=${procInstId}&targetActivityId=${nodeId}`);

  // 挂起节点
  getProcessHandUp = (iamOrganizationId, procInstId) => axios.put(`/workflow/v1/${iamOrganizationId}/wfl/monitor/suspend/${procInstId}`);

  // 恢复节点
  getProcessHuiFu = (iamOrganizationId, procInstId) => axios.put(`/workflow/v1/${iamOrganizationId}/wfl/monitor/active/${procInstId}`);

  // 终止流程
  getProcessZhongZhi = (iamOrganizationId, procInstId) => axios.put(`/workflow/v1/${iamOrganizationId}/wfl/monitor/end/${procInstId}`);

  // 转交
  getProcessTransfer = (iamOrganizationId, procInstId, assignee, opinion) => axios.put(`/workflow/v1/${iamOrganizationId}/wfl/monitor/transfer?procInstId=${procInstId}&assignee=${assignee}&opinion=${opinion}`);


  // 加载图片
  getProcessPhoto = (iamOrganizationId, procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/chart/${procInstId}`, { responseType: 'arraybuffer' });

  // 查询分类(下拉状态框)
  queryTypeList=(iamOrganizationId, code = 'WF_CLASSIFY') => axios.get(`fnd/v1/${iamOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setTypelist(data);
  })

  // 查询状态(下拉状态框)
  queryStatusList=(iamOrganizationId, code = 'WF_SP_STATUS') => axios.get(`fnd/v1/${iamOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setStatuslist(data);
  })

  // 查询审批项目状态
  queryTypeLineList=(iamOrganizationId, code = 'WF_SP_ITEM_STATUS') => axios.get(`fnd/v1/${iamOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setTypeLinelist(data);
  })

  // 查询应用系统
  queryApplicationList=(iamOrganizationId, code = 'FND_APP_SYSTEM') => axios.get(`fnd/v1/${iamOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setApplicationList(data);
  })

  // 查询事物管理
  queryTransactionTypeList=(iamOrganizationId, code = 'WF_TRANSACTION_TYPE') => axios.get(`fnd/v1/${iamOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setTransactionTypeList(data);
  })

   // 获取ITSM的表格信息
  approverITSMTable=(iamOrganizationId, transactionNumber, transactionType) => axios.get(`/itsm/v1/${iamOrganizationId}/event/approval/event?transactionNumber=${transactionNumber}&transactionType=${transactionType}`)

  // 获取知识库的表格信息
  approverKnowledgeTable=(iamOrganizationId, transactionId, transactionType) => axios.get(`/km/v1/${iamOrganizationId}/workcallback?transactionId=${transactionId}&transactionType=${transactionType}`)

  // 查看按钮
  getProcessInfoById = (iamOrganizationId, procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/detail/${procInstId}`);

  // 历史纪录
  getProcessHistory = (iamOrganizationId, procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/history/${procInstId}`);

  // 跳转节点按钮
  getProcessJump = (iamOrganizationId, procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/definition/user-tasks/${procInstId}`);
}

const
  processStore = new ProcessStore();
export default processStore;
