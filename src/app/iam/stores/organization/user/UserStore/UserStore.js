import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';
import { message } from 'yqcloud-ui';

@store('UserStore')
class UserStore extends LanguageStore {
  constructor() {
    super('user');
  }

  @observable isLoading = true;

  /* 密码策略用于修改密码时校验 */
  @observable passwordPolicy;

  @observable userInfo;

  @observable language;

  @observable organization;

  @observable timeZone = [];

  @observable checkEmail;

  @observable enabled = [];

  @observable users;

  /* 账户列表 */
  @observable totalSize;

  @observable totalPage;

  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  @action
  setPasswordPolicy(data) {
    this.passwordPolicy = data;
  }

  @action
  setUserInfo(data) {
    this.userInfo = data;
  }

  @computed
  get getUserInfo() {
    return this.userInfo;
  }

  @action
  setLanguage(data) {
    this.language = data;
  }

  @action
  setOrganization(data) {
    this.organization = data;
  }

  @computed
  get getTimeZone() {
    return this.timeZone;
  }

  @action
  setTimeZone(data) {
    this.timeZone = data;
  }

  @action
  setCheckEmail(data) {
    this.checkEmail = data;
  }

  @action
  setUsers(data) {
    this.users = data;
  }

  @computed
  get getUsers() {
    return this.users;
  }

  @action
  setTotalSize(totalSize) {
    this.totalSize = totalSize;
  }

  @computed
  get getTotalSize() {
    return this.totalSize;
  }

  @action
  setTotalPage(totalPage) {
    this.totalPage = totalPage;
  }

  @computed
  get getTotalPage() {
    return this.totalPage;
  }

  @action
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  @computed
  get getEnabled() {
    return this.enabled;
  }

  unLockUser(orgId, UserId) {
    return axios.get(`/iam/v1/organizations/${orgId}/users/${UserId}/unlock`);
  }

  loadPasswordPolicy = () => axios.get('/iam/v1/passwordPolicies/querySelf').then((data) => {
    if (data) {
      this.setPasswordPolicy(data);
    }
  });

  updatePassword = (originPassword, hashedPassword) => axios.put(`/iam/v1/password/updateSelf?originPassword=${originPassword}&password=${hashedPassword}`);

  // 账户信息维护
  loadUserInfo = () => {
    this.setIsLoading(true);
    return axios.get('/iam/v1/users/self').then((data) => {
      if (data) {
        this.setUserInfo(data);
      }
      this.setIsLoading(false);
    });
  };

  checkEmails = (id, email) => axios.get(`/iam/v1/organization/${id}/users/checkEmail?email=${email}`);

  updateUserInfo = user => axios.put(`/iam/v1/users/${this.userInfo.id}/updateSelf`, JSON.stringify(user));

  EnableUser = (orgId, userId, data) => axios.put(`/iam/v1/organizations/${orgId}/users/${userId}/enable`);

  UnenableUser = (orgId, userId, data) => axios.put(`/iam/v1/organizations/${orgId}/users/${userId}/disable`);


  // 加载账户列表
  loadUsers = (organizationId, page, sortParam, {
    loginName, realName, ldap, language, enabled, locked, email,
  }, param) => {
    this.setIsLoading(true);
    return axios.post(
      `/iam/v1/organizations/${organizationId}/users/search?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}`,
      JSON.stringify({
        loginName: loginName && loginName[0],
        realName: realName && realName[0],
        ldap: ldap && ldap[0],
        language: language && language[0],
        enabled: enabled && enabled[0],
        locked: locked && locked[0],
        email: email && email[0],
        param,
      }),
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  deleteUserById = (organizationId, id) => (
    axios.delete(`/iam/v1/organizations/${organizationId}/users/${id}`)
  );

  // 启用快码
  getIsEnabled = (organizationId, code = 'FND_VALID_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });

  // 行业快码
  getIndustryTypes = (organizationId, code = 'FND_PARTNER_INDUSTRY') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`);

  // 初始化
  initialData = (organizationId, init_type) => axios.post(`fnd/v1/${organizationId}/data/single/${init_type}`)

  getCode = (code) => axios.get(`/fnd/v1/sys/messages/queryCode?messageCode=${code}`)
    .then((data) => {
      const { failed: infailed } = data;
      const types = data.type;
      if (!infailed) {
        message[types](data.content, undefined, undefined, `${data.placement}`);
      } else {
        message[types](code, undefined, undefined, `${data.placement}`);
      }
    });
}

const userStore = new UserStore();

export default userStore;
