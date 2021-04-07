import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import querystring from 'query-string';
import LanguageStore from '../../language/languageStore';
import { message } from 'yqcloud-ui';

@store('AccountSecurityManagementStore')
class AccountSecurityManagementStores extends LanguageStore{
  constructor() {
    super('AccountSecurityManagement');
  }


  /* 查询免密登录 */
  getFreeLogin = (iamOrganizationId) => axios.get(`/iam/v1/${iamOrganizationId}/custom/token/config`);

  /* 保存免密 */
  saveFreeLogin = (iamOrganizationId,data) => axios.put(`/iam/v1/${iamOrganizationId}/custom/token/config`,JSON.stringify(data));

  // /* 下载SAML meta data源数据 */
  // downloadSAMLMetaData = () => axios.get(`/oauth/saml/metadata`);
}

const AccountSecurityManagementStore = new AccountSecurityManagementStores();

export default AccountSecurityManagementStore;
