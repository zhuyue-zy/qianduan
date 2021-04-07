/** 2018/10/30
*作者:高梦龙
*参与项目
*/
import { action, observable, computed } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language';

@store('LaunchStore')
class LaunchStore extends LanguageStore {
  @observable totalSize;

  @observable totalPage;

  @observable isLoading = true;

  @observable typelist =[];

  @observable statuslist =[];

  @observable typeLinelist =[];

  @observable transactionTypeList =[];


  constructor(totalPage = 1, totalSize = 0) {
    super('launchProcess');
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
  setTypelist(typelist) {
    this.typelist = typelist;
  }

  @computed
  get getTypelist() {
    return this.typelist;
  }

  @action
  setStatuslist(statuslist) {
    this.statuslist = statuslist;
  }

  @computed
  get getStatuslist() {
    return this.statuslist;
  }

  @action
  setTypeLinelist(typeLinelist) {
    this.typeLinelist = typeLinelist;
  }

  @computed
  get getTypeLinelist() {
    return this.typeLinelist;
  }

  @action
  setTransactionTypeList(transactionTypeList) {
    this.transactionTypeList = transactionTypeList;
  }

  @computed
  get getTransactionTypeList() {
    return this.transactionTypeList;
  }

  loadLaunchProcess = (iamOrganizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `workflow/v1/${iamOrganizationId}/participate/initiated?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 撤回
  callBackProcess=(iamOrganizationId, procInstId, processStatus) => axios.put(`workflow/v1/${iamOrganizationId}/participate/kafka/${procInstId}/initiated?processStatus=${processStatus}`)

  // 查询分类
  queryTypeList=(iamOrganizationId, code = 'WF_CLASSIFY') => axios.get(`fnd/v1/${iamOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setTypelist(data);
  })

  // 查询审批项目状态
  queryTypeLineList=(iamOrganizationId, code = 'WF_SP_ITEM_STATUS') => axios.get(`fnd/v1/${iamOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setTypeLinelist(data);
  })


  // 查询状态

  queryStatusList=(iamOrganizationId, code = 'WF_SP_STATUS') => axios.get(`fnd/v1/${iamOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setStatuslist(data);
  })

  // 加载图片
  getProcessPhoto = (iamOrganizationId, procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/chart/${procInstId}`, { responseType: 'arraybuffer' });

  // 获取table
  approverITSMTable=(iamOrganizationId, transactionNumber, transactionType) => axios.get(`/itsm/v1/${iamOrganizationId}/event/approval/event?transactionNumber=${transactionNumber}&transactionType=${transactionType}`)

  approverKnowledgeTable=(iamOrganizationId, transactionId, transactionType) => axios.get(`/km/v1/${iamOrganizationId}/workcallback?transactionId=${transactionId}&transactionType=${transactionType}`)

  // 查看按钮
  getProcessInfoById = (iamOrganizationId, procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/detail/${procInstId}`);

  // 历史纪录
  getProcessHistory = (iamOrganizationId, procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/history/${procInstId}`);

  // 查询事物管理
  queryTransactionTypeList=(iamOrganizationId, code = 'WF_TRANSACTION_TYPE') => axios.get(`fnd/v1/${iamOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setTransactionTypeList(data);
  })

  // 跳转节点按钮
  getProcessJump = (iamOrganizationId, procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/definition/user-tasks/${procInstId}`);
}
const launchStore = new LaunchStore();
export default launchStore;
