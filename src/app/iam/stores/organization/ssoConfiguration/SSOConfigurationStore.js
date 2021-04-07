import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('SSOConfigurationStore')
class SSOConfigurationStore extends LanguageStore {
  constructor() {
    super('ssoConfiguration');
  }

  @observable isLoading = true;


  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  // 获取sso配置数据
  ssoConfigurationData = (iamOrganizationId) => axios.get(`/iam/v1/sso/config/${iamOrganizationId}`);

  // 保存提交sso配置数据
  saveSsoConfiguration = (iamOrganizationId, data) => axios.put(`/iam/v1/sso/config/${iamOrganizationId}`, JSON.stringify(data));

  // 保存cas配置
  saveSsoConfigurationCas = (iamOrganizationId, data) => axios.put(`/iam/v1/sso/config/${iamOrganizationId}/cas`, JSON.stringify(data));

  // 保存oauth配置
  saveSsoConfigurationOauth = (iamOrganizationId, data) => axios.put(`/iam/v1/sso/config/${iamOrganizationId}/oauth`, JSON.stringify(data));

  /* 获取快码信息,根据CODE查询快码(平台) */
  getSourceCode = (iamOrganizationId, code) => axios.get(`/fnd/v1${iamOrganizationId ? `/${iamOrganizationId}` : ''}/lookup/value/dto/site?lookupTypeCode=${code}`);

  // getSourceCode = (iamOrganizationId, code) => axios.get(`/fnd/v1/${iamOrganizationId}/lookup/code?lookupTypeCode=${code}`);


  /**
   * 查询租户类型
   */
  getTenantType = (orgId) => axios.get(`/iam/v1/${orgId}/type`);

}
const ssoConfigurationStore = new SSOConfigurationStore();

export default ssoConfigurationStore;
