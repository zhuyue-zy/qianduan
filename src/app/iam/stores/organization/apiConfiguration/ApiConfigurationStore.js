import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('ApiConfigurationStore')
class ApiConfigurationStore extends LanguageStore {
  constructor() {
    super('ApiConfiguration');
  }

  @observable isLoading = true;

  @observable enabled =[];


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

  // 查询租户层api配置数据
    loadApiConfiguration =(organizationId, page, sortParam, filters, param) => {
      this.setIsLoading(true);
      let filter = '';
      for (const i in filters) {
        filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
      }
      return axios.get(`openapi/v1/${organizationId}/client/list?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`).then((data) => {
        this.setIsLoading(false);
        return data;
      });
    }

   // 创建accessKey
   createKey = organizationId => axios.post(`openapi/v1/${organizationId}/client`);


  // 保存分配权限api
  saveAPI=(organizationId, openApiToken) => axios.put(`openapi/v1/${organizationId}/client`, JSON.stringify(openApiToken));

  // 删除Accesskey
  deleteKey = (organizationId, id) => axios.delete(`openapi/v1/${organizationId}/client/${id}`)

  // 失效access
  disableAccess=(organizationId, id) => axios.put(`openapi/v1/${organizationId}/client/${id}/disable`)

  // 生效accss
  enabledAccess=(organizationId, id) => axios.put(`openapi/v1/${organizationId}/client/${id}/enable`)

  // 查看详情
  getAccessMessage= (organizationId, id, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`openapi/v1/${organizationId}/api/permission/${id}?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  }

  // 查看功能权限
  loadFunction=(openApiTokenId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`openapi/v1/api/permission/list?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&openApiTokenId=${openApiTokenId}${filter}`).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  }

  // 生效快码租户层使用
  getIsEnabled=(organizationId, code = 'FND_ENABLE_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  })

  // 删除子表
  deleteAPI= (organizationId, openApiPermission) => axios.delete(`openapi/v1/${organizationId}/api/permission`, { data: JSON.stringify(openApiPermission) })


  // 初始化页面判断组织是否有效
  initOragan= organizationId => axios.get(`iam/v1/organizations/api/${organizationId}`);
}
const apiConfigurationStore = new ApiConfigurationStore();

export default apiConfigurationStore;
