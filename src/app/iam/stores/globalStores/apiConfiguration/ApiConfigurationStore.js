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

  // 查看分页
  loadAPI=(page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`iam/v1/organizations/open/api?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  }

  // 查询未添加的api
  loadNoCreate=(page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`iam/v1/organizations/enable/api?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  }

  // 获取查看api信息
   getAPIMessage= organizationId => axios.get(`openapi/v1/${organizationId}/client/site/list`);

   // 新建api
   createApi= organizationOpenApiDO => axios.post('iam/v1/organizations/api', JSON.stringify(organizationOpenApiDO));

  // 失效API
  disableAPI = openApiId => axios.put(`iam/v1/organizations/api/${openApiId}/disable`);

  // 生效API
  enableAPI = openApiId => axios.put(`iam/v1/organizations/api/${openApiId}/enable`);


  // 生效快码
  getIsEnabled = (code = 'FND_ENABLE_STATUS') => axios.get(`fnd/v1/lookup/value/dto?lookup_type_code=${code}`).then((data) => {
    this.setEnabled(data);
  });
}
const apiConfigurationStore = new ApiConfigurationStore();

export default apiConfigurationStore;
