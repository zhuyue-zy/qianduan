/**
 * Created by nanjiangqi on 2018-9-27 0027.
 */
import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('WorkflowStore')
class WorkflowStore extends LanguageStore{
  @observable isLoading = true;

  @observable companys = [];

  // 快码 审批规则
  @observable ApprovalList = [];

  // 快码 审批节点规则
  @observable companysList = [];

  // 快码 状态
  @observable CompanyNameList = [];

  // 快码  分类
  @observable generatelist = [];

  // 新建自动生成流程编码
  @observable PreviewWorkflowlits = [];

  // 工作流预览
  @observable Statuslits = [];

  // 应用系统
  @observable applicationSystems = [];

  // 工作流预览 状态
  @observable totalSize;

  @observable totalPage;

  constructor(totalPage = 1, totalSize = 0) {
    super('workflow');
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
  setCompanys(data) {
    this.companys = data;
  }

  @computed
  get getCompanys() {
    return this.companys;
  }

  @action
  setCompanysList(data) {
    this.companysList = data;
  }

  @computed
  get getCompanysList() {
    return this.companysList;
  }

  @action
  setCompanyNameList(data) {
    this.CompanyNameList = data;
  }

  @computed
  get getCompanyNameList() {
    return this.CompanyNameList;
  }

  @action
  setPreviewWorkflowlits(data) {
    this.PreviewWorkflowlits = data;
  }

  @computed
  get getPreviewWorkflowlits() {
    return this.PreviewWorkflowlits;
  }



  @action
  setApplicationSystems(data) {
    this.applicationSystems = data;
  }

  @computed
  get getApplicationSystems() {
    return this.applicationSystems;
  }


  @action
  setStatuslits(data) {
    this.Statuslits = data;
  }

  @computed
  get getStatuslits() {
    return this.Statuslits;
  }

  @action
  setApprovalList(data) {
    this.ApprovalList = data;
  }

  @computed
  get getApprovalList() {
    return this.ApprovalList;
  }

  @action
  setGeneratelist(data) {
    this.generatelist = data;
  }

  @computed
  get getGeneratelist() {
    return this.generatelist;
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

  /**
   * 加载审批工作流列表信息
   * @param param
   * @returns
   */
  loadCompanys = (organizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filterStr = '';
    for (const i in filters) {
      filterStr += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `/workflow/v1/${organizationId}/wfl/model/info?page=${page.current - 1}&size=${page.pageSize}${filterStr}`,
      JSON.stringify({
        param,
      }),
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 岗位查询
  loadqueryPost = (organizationId, page, sortParam, filters, param) => {
    let filterStr = '';
    for (const i in filters) {
      filterStr += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`fnd/v1/${organizationId}/organizations/position/page/list?page=${page.current - 1}&size=${page.pageSize}${filterStr}`,
      JSON.stringify({
        param,
      })).then(data => data);
  };

  // 新建审批工作流
  createCompany = (organizationId, company) => axios.post(`/workflow/v1/${organizationId}/wfl/model/ext`, JSON.stringify(company));

  // 创建流程
  createProcess = (modelExtId, organizationId, value) => axios.post(`/workflow/v1/${organizationId}/wfl/process/list/${modelExtId}`, JSON.stringify(value));

  // 更新流程
  updateProcess = (modelExtId, organizationId, value) => axios.put(`/workflow/v1/${organizationId}/wfl/process/list${modelExtId}`, JSON.stringify(value));

  // 根据ID查询模型流程
  getWorkflowId = (organizationId, id) => axios.get(`/workflow/v1/${organizationId}/wfl/process/id/${id}`).then(data => data);

  // 审批工作流版本查看
  previewWorkflow = (organizationId, id, pagination) => axios.get(`/workflow/v1/${organizationId}/wfl/model/edition/${id}?page=${pagination.current - 1}&size=${pagination.pageSize}`).then((data) => {
    this.setPreviewWorkflowlits(data);
    return data;
  });

  // 工作流预览
  getPreview = (organizationId, deployId) => axios.get(`/workflow/v1/${organizationId}/wfl/monitor/deployment/chart/${deployId}`, { responseType: 'arraybuffer' })
    .then(data => data);

  // 启用
  ableWorkflow = (organizationId, modelExtId) => axios.post(`/workflow/v1/${organizationId}/wfl/model/enable`, JSON.stringify(modelExtId));

  // 停用
  enableWorkflow = (organizationId, modelExtId) => axios.post(`/workflow/v1/${organizationId}/wfl/model/invalid`, JSON.stringify(modelExtId));

  // 发布
  releaseWorkflow = (organizationId, record) => axios.post(`/workflow/v1/${organizationId}/wfl/process/deploy`, JSON.stringify(record));

  // 删除
  deleteWorkflow = (organizationId, record) => axios.delete(`/workflow/v1/${organizationId}/wfl/model/ext`, { data: JSON.stringify(record) });

  // 更新
  updateCompany = (organizationId, company) => axios.put(`/fnd/v1/organizations/${organizationId}/company/revision`, JSON.stringify(company));

  // 快码 状态
  loadparentCompany = (organizationId, code) => axios.get(`/fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setCompanysList(data);
    return data;
  });

  // 快码 分类
  loadClassify = (organizationId, code) => axios.get(`/fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setCompanyNameList(data);
    return data;
  });

  // 应用系统
  loadSystem=(organizationId, code) => axios.get(`/fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setApplicationSystems(data);
    return data;
  })

  // 快码 审批规则
  loadApproval = (organizationId, code) => axios.get(`/fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setCompanys(data);
    return data;
  });

  // 快码 审批节点规则
  loadNode = (organizationId, code) => axios.get(`/fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setApprovalList(data);
    return data;
  });

  // 快码 状态
  loadStatus = (organizationId, code) => axios.get(`/fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setStatuslits(data);
    return data;
  });
}

const workflowStore = new WorkflowStore();

export default workflowStore;
