import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('UserInfoStore')
class UserInfoStore extends LanguageStore {
  constructor() {
    super('userInfo');
  }

  @observable userInfo = {};

  @observable avatar;

  @observable languagelist = [];

  @computed
  get getUserInfo() {
    return this.userInfo;
  }

  @action
  setUserInfo(data) {
    this.userInfo = data;
    this.avatar = data.imageUrl;
  }

  @action
  setAvatar(avatar) {
    this.avatar = avatar;
  }

  @computed
  get getAvatar() {
    return this.avatar;
  }

  @action
  setLanguagelist(languagelist) {
    this.languagelist = languagelist;
  }

  @computed
  get getLanguagelist() {
    return this.languagelist;
  }

  updateUserInfo = user => axios.put(`/iam/v1/users/${user.id}/info`, JSON.stringify(user));

  updatePassword = (id, body, valueKeys) => axios.put(`/iam/v1/users/${id}/password?identifier=${valueKeys}`, JSON.stringify(body));

  checkEmailAddress = email => (
    axios.post('/iam/v1/users/check', JSON.stringify({ id: this.userInfo.id, email }))
  );

  //查询登录方式快码
  getLoginMethodTypes = (organizationId, code = 'IAM_LOGIN_PLATFORM') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`);

  // 设置主要租户
  setMainOrgs = id => axios.post(`iam/v1/users/org/main/${id}`);

  // 解绑
  setUnBiindings = obj => axios.delete('iam/v1/organizations/unbinding', { data: JSON.stringify(obj) });

  // 获取密码策略
  getStrategy = organizationId => axios.get(`iam/v1/organizations/${organizationId}/password_policies`);

  // 选择多语言
  loadLanguageList = () => axios.get('/iam/v1/languages/list').then((data) => {
    this.setLanguagelist(data);
  });
  // 获取微信绑定二维码
  getWeChatQRcode = () => axios.get(`/wechat/v1/weChat/ticket/url`);
  // 获取微信昵称
  getWechatNickname = (orgId, userId) => axios.get(`/wechat/v1/${orgId}/weChat/nickname?userId=${userId}`);
  // 个人微信解绑
  weChatUnbind = (orgId, userId) => axios.get(`/wechat/v1/${orgId}/weChat/untieAccount?userId=${userId}`);

  getPulicKey = () => axios.get('iam/v1/users/key');

  gitUniqueIdentification = (orgId, userId) => axios.get(`/fnd/v1/${orgId}/customer/info/extensionNumber?userId=${userId}`);
}

const userInfoStore = new UserInfoStore();
export default userInfoStore;
