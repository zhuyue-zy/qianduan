import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language';
import { observer } from 'mobx-react';

@store('SettingLDAPStore')
class SettingLDAPStore extends LanguageStore {
  constructor() {
    super('ladpSetting');
  }

  createLDAP = (id, body) => axios.post(`iam/v1/organizations/${id}/ldaps`, JSON.stringify(body));

  queryLDAP = id => axios.get(`iam/v1/organizations/${id}/ldaps`);

  updateOrgLDAP = (id, LDAPId, body) => axios.post(`/iam/v1/organizations/${id}/ldaps/${LDAPId}`, JSON.stringify(body));

  /* 获取快码信息,根据CODE查询快码(平台) */
  getSourceCode = (iamOrganizationId, code) => axios.get(`/fnd/v1${iamOrganizationId ? `/${iamOrganizationId}` : ''}/lookup/value/dto/site?lookupTypeCode=${code}`);

  // 连接测试
  connectionTest = (iamOrganizationId) => axios.get(`/iam/v1/organizations/${iamOrganizationId}/ldaps/test/ldap`);

  // 连接测试
  connectionTestData = (iamOrganizationId,data) => axios.post(`/iam/v1/organizations/${iamOrganizationId}/ldaps/test/details/ldap`, JSON.stringify(data));

  checkPrincipalTenantCode = (iamOrganizationId,code) => axios.get(`/iam/v1/organizations/${iamOrganizationId}/ldaps/queryByParentOrg?parentOrganizationCode=${code}`)
}
const settingLDAPStore = new SettingLDAPStore();
export default settingLDAPStore;
