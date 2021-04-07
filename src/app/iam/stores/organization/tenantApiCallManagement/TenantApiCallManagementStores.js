import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('TenantApiCallManagementStores')
class TenantApiCallManagementStores extends LanguageStore {
  constructor() {
    super('TenantApiCallManagement');
  }

  /*
  * 查询
  * */
  gitApiList = (organizationId,page,size) => {
    const pages = page ? page : 0 ;
    const sizes = size ? size : 25 ;
    return axios.get(`/openapi/v1/api/call/log/organization/${organizationId}/list?page=${pages}&size=${sizes}`)
  }

  /*
  * 导出
  * */
  exportTenant = (organizationId) => {
    return axios.post(`/openapi/v1/api/call/log/organization/${organizationId}/export`)
  }
}


const tenantApiCallManagementStores = new TenantApiCallManagementStores();

export default tenantApiCallManagementStores;
