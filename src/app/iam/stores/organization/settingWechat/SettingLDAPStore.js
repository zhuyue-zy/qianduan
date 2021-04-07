import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language';

@store('SettingWechatStore')
class SettingLDAPStore extends LanguageStore {
  constructor() {
    super('ladpSetting');
  }

  @observable rolesTree = [];

  @action
  setRolesTree(data) {
    this.rolesTree = data;
  }

  @computed
  get getRolesTree() {
    return this.rolesTree.slice();
  }

  queryLDAP = id => axios.get(`wechat/v1/${id}/config`);

  updateOrgLDAP = (id, body) => axios.post(`wechat/v1/${id}/config`, JSON.stringify(body));

  querySelect = id => axios.get(`wechat/v1/${id}/config/select`);

  synOrgLDAP = (id, body) => axios.post(`wechat/v1/${id}/config/syn`, JSON.stringify(body));
}
const settingLDAPStore = new SettingLDAPStore();
export default settingLDAPStore;
