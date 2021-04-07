/** 2018/10/23
*作者:高梦龙
*项目:待办事项
*/
import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from "../../language";

@store('BackLogStore')
class BackLogStore extends LanguageStore{

  constructor() {
    super('backLog');
  }
  @observable isLoading = true;

  @observable typelist =[];

  @observable typeLinelist =[];

  @observable transactionTypeList =[];


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

  /**
   * 我的待办列表信息
   * @param organizationId
   * @param page
   * @param sortParam
   * @param flexValueSetName
   * @param description
   * @param param
   * @returns {PromiseLike<T | never> | Promise<T | never>}
   */
  /* eslint-disable */
  loadBackLogs = (iam_organization_id, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `/workflow/v1/${iam_organization_id}/current/my/wfl?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });


  };


  //查询分类
   queryTypeList=(iam_organization_id,code='WF_CLASSIFY') => {
     return axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
       this.setTypelist(data);
     })

   }
  //查询审批项目状态
  queryTypeLineList=(iam_organization_id,code='WF_SP_ITEM_STATUS') => {
    return axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
      this.setTypeLinelist(data);
    })

  }

   //获取我的事项的详情
  getMatterById = (iam_organization_id, procInstId) => {
    return axios.get(`/workflow/v1/${iam_organization_id}/current/approval?procInstId=${procInstId}`);

  }

  //获取审批历史的详情
  getApproverHistoryById = (iam_organization_id, procInstId) => {
    return axios.get(`/workflow/v1/${iam_organization_id}/current/approval/his?procInstId=${procInstId}`);

  }

  //同意审批
  agreeApprovel=(iam_organization_id, procInstId, taskComment, taskId) => {
     return axios.put(`/workflow/v1/${iam_organization_id}/current/kafka/agree?procInstId=${procInstId}&taskComment=${taskComment}&taskId=${taskId}`)
  }

  //转交审批
  transferApprovel=(iam_organization_id, procInstId, assignee, taskComment, taskId) => {
    return axios.put(`/workflow/v1/${iam_organization_id}/current/transfer?procInstId=${procInstId}&assignee=${assignee}&taskComment=${taskComment}&taskId=${taskId}`)
  }

  //拒绝审批
  rejectApprovel=(iam_organization_id, procInstId, taskComment, taskId) => {
    return axios.put(`/workflow/v1/${iam_organization_id}/current/kafka/refuse?procInstId=${procInstId}&taskComment=${taskComment}&taskId=${taskId}`)
  }
  //获取table
  approverITSMTable=(iam_organization_id , transactionNumber , transactionType, )=>{
     return axios.get(`/itsm/v1/${iam_organization_id}/event/approval/event?transactionNumber=${transactionNumber}&transactionType=${transactionType}`)
  }

  approverKnowledgeTable=(iam_organization_id , transactionId , transactionType)=>{
    return axios.get(`/km/v1/${iam_organization_id}/workcallback?transactionId=${transactionId}&transactionType=${transactionType}`)
  }
  //获取流程图片
  getProcessPhoto = (iamOrganizationId , procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/chart/${procInstId}`, { responseType: 'arraybuffer' });
// 查询事物管理
  queryTransactionTypeList=(iamOrganizationId, code = 'WF_TRANSACTION_TYPE') => axios.get(`fnd/v1/${iamOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setTransactionTypeList(data);
  })
  // 跳转节点按钮
  getProcessJump = (iamOrganizationId, procInstId) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/monitor/definition/user-tasks/${procInstId}`);
}

const backLogStore = new BackLogStore();
export default backLogStore;
