import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('ServicePortalStore')
class ServicePortalStore extends LanguageStore {
  constructor() {
    super('servicePortal');
  }

  @observable servicePortalList = []; // 门户列表

  @action
  setServicePortalList(data) {
    this.servicePortalList = data;
  }

  @computed
  get getServicePortalList() {
    return this.servicePortalList;
  }

  // 获取门户列表
  getServicePortalListHome = (iamOrganizationId, page ,size ,content,enable) => {
    const pages = page-1|| 0;
    const sizes = size|| 10;
    if(enable&&content){
      return axios.get(`/user-portal/v1/${iamOrganizationId}/portal/info/list?condition=${content}&enable=${enable}&page=${pages}&size=${sizes}`);
    }else if(!enable&&content){
      return axios.get(`/user-portal/v1/${iamOrganizationId}/portal/info/list?condition=${content}&page=${pages}&size=${sizes}`);
    }else if(enable&&!content) {
      return axios.get(`/user-portal/v1/${iamOrganizationId}/portal/info/list?enable=${enable}&page=${pages}&size=${sizes}`);
    }else {
      return axios.get(`/user-portal/v1/${iamOrganizationId}/portal/info/list?page=${pages}&size=${sizes}`);
    }
  };

  // 编辑门户
  setEnabledFalse = (iamOrganizationId,data) =>  axios.put(`/user-portal/v1/${iamOrganizationId}/organizations/portal/info`, JSON.stringify(data));

  // 新建门户
  establishPortal = (iamOrganizationId,data) =>  axios.post(`/user-portal/v1/${iamOrganizationId}/portal/info`, JSON.stringify(data));

  // 检验门户名称和代码
  checkPortal = (iamOrganizationId,type,data) =>  axios.get(`/user-portal/v1/${iamOrganizationId}/portal/info/check?${type}=${data}`);

  // 查询当前租户
  getOrganization = (iamOrganizationId) =>  axios.get(`/iam/v1/${iamOrganizationId}/organizations`);

  // 查询顶栏
  getTopContent = (iamOrganizationId,id,content) => {
    if(content){
      return axios.get(`/user-portal/v1/${iamOrganizationId}/organizations/top/content/query/${id}?portalTopBarName=${content}`);
    }else {
      return axios.get(`/user-portal/v1/${iamOrganizationId}/organizations/top/content/query/${id}`);
    }
  };

  // 编辑顶栏
  setTopContent = (iamOrganizationId,id,data) =>  axios.post(`/user-portal/v1/${iamOrganizationId}/organizations/top/content/${id}/save`, JSON.stringify(data));

  // 查询banner
  getBanner = (iamOrganizationId,id) =>  axios.get(`/user-portal/v1/${iamOrganizationId}/portal/banner/query/${id}`);

  // 编辑banner
  setBanner = (iamOrganizationId,data) =>  axios.put(`/user-portal/v1/${iamOrganizationId}/portal/banner`, JSON.stringify(data));

  // 新建banner
  newBanner = (iamOrganizationId,data) =>  axios.post(`/user-portal/v1/${iamOrganizationId}/portal/banner`, JSON.stringify(data));

  // 新建资源
  newResources = (iamOrganizationId,data) =>  axios.put(`/user-portal/v1/${iamOrganizationId}/portal/body/area/add`, JSON.stringify(data));

  // 查询资源
  getResources = (iamOrganizationId,id) =>  axios.get(`/user-portal/v1/${iamOrganizationId}/portal/body/area/query/list?portal_id=${id}`);

  // 修改资源
  editResources = (iamOrganizationId,data) =>  axios.post(`/user-portal/v1/${iamOrganizationId}/portal/body/area/edit`, JSON.stringify(data));

  // 查询目录
  getCatalog = (iamOrganizationId,id) =>  axios.get(`/user-portal/v1/portal/catalogue/${iamOrganizationId}/query/${id}`);

  // 创建目录
  newCatalog = (iamOrganizationId,data) =>  axios.post(`/user-portal/v1/portal/catalogue/${iamOrganizationId}`, JSON.stringify(data));

  // 创建目录
  editCatalog = (iamOrganizationId,data) =>  axios.put(`/user-portal/v1/portal/catalogue/${iamOrganizationId}`, JSON.stringify(data));

  // 查询门户详情
  getPortalDetails = (iamOrganizationId,id) =>  axios.get(`/user-portal/v1/${iamOrganizationId}/portal/info/${id}`);

  // 查询侧栏详情
  getSideBar = (iamOrganizationId,id) =>  axios.get(`/user-portal/v1/${iamOrganizationId}/portal/side/bar/query/${id}`);

  // 新建侧栏
  newSideBar = (iamOrganizationId,data) =>  axios.post(`/user-portal/v1/${iamOrganizationId}/portal/side/bar`, JSON.stringify(data));

  // 编辑侧栏
  setSideBar = (iamOrganizationId,data) =>  axios.put(`/user-portal/v1/${iamOrganizationId}/portal/side/bar`, JSON.stringify(data));

  // // 编辑侧栏
  // addTopContent = (iamOrganizationId,data) =>  axios.put(`/user-portal/v1/${iamOrganizationId}/organizations/top/content/add`, JSON.stringify(data));

  // 查询知识空间
  getKnowledgeSpace = (iamOrganizationId, page ,size ,content) => {
    const pages = page-1|| 0;
    const sizes = size|| 10;
    if(content){
      return axios.get(`/km/v1/${iamOrganizationId}/space/page/mylist?searchValue=${content}&page=${pages}&size=${sizes}&sort=spaceId,desc`);
    }else {
      return axios.get(`/km/v1/${iamOrganizationId}/space/page/mylist?page=${pages}&size=${sizes}&sort=spaceId,desc`);
    }
  }

  /* 编辑框上传图 */
  submitFile = (iamOrganizationId, formData, config) => axios.post(`fileService/v1/${iamOrganizationId}/file/picture`, formData, config);

  // 查询知识
  getKnowledge = (iamOrganizationId, page ,size ,content) => {
    const pages = page-1|| 0;
    const sizes = size|| 10;
    const data=[];
    if(content){
      return axios.post(`/km/v1/${iamOrganizationId}/knowledge/mine/all?knowledgeTitle=${content}&page=${pages}&size=${sizes}&sort=id,desc`, JSON.stringify(data));
    }else {
      return axios.post(`/km/v1/${iamOrganizationId}/knowledge/mine/all?page=${pages}&size=${sizes}&sort=id,desc`, JSON.stringify(data));
    }
  };

  // 查询机器人
  getRobot = (iamOrganizationId, page ,size ,content) => {
    const pages = page-1|| 0;
    const sizes = size|| 10;
    if(content){
      return axios.get(`/chatrobot/v1/${iamOrganizationId}/config/page/robots?searchValue=${content}&page=${pages}&size=${sizes}&isShowExpired=false`);
    }else {
      return axios.get(`/chatrobot/v1/${iamOrganizationId}/config/page/robots?page=${pages}&size=${sizes}&isShowExpired=false`);
    }
  };

  // 查询租户下所有项目
  getProjectAll = (iamOrganizationId) => {
      return axios.get(`/project/v1/${iamOrganizationId}/pm/able`);
  };

  // 查询项目下所有服务目录
  getServiceList = (iamOrganizationId, projectId, page ,size , ) => {
    const pages = page-1|| 0;
    const sizes = size|| 10;
      return axios.get(`itsm/v1/${iamOrganizationId}/ca/cata/struct/page/project/${projectId}?page=${pages}&size=${sizes}`);
  };

  /* 获取OrgCode的接口 */
  getOrgCodeFun = iamOrganizationId => axios.get(`iam/v1/${iamOrganizationId}/organizations`)


}

const servicePortalStore = new ServicePortalStore();

export default servicePortalStore;
