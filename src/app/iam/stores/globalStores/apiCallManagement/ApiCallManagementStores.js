import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('ApiCallManagementStore')
class ApiCallManagementStore extends LanguageStore {
  constructor() {
    super('ApiCallManagement');
  }

  /*
  * 查询
  * */
  gitApiList = (page, size) => {
    const pages = page ? page : 0 ;
    const sizes = size ? size : 25 ;
    return axios.get(`/openapi/v1/api/call/log/list?page=${pages}&size=${sizes}`)
  }

  /*
  * 导出
  * */
  export = () => {
    return axios.post(`/openapi/v1/api/call/log/list/export`)
  }
}


const apiCallManagementStore = new ApiCallManagementStore();

export default apiCallManagementStore;
