import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';


@store('CreateUserStore')
class CreateUserStore extends LanguageStore{
  constructor() {
    super('user');
  }
  @observable language;

  @observable passwordPolicy;

  @observable staff;

  @observable languagelist =[];



  @action
  setLanguage(lang) {
    this.language = lang;
  }

  @computed
  get getLanguage() {
    return this.language;
  }

  @action
  setPasswordPolicy(data) {
    this.passwordPolicy = data;
  }

  @computed
  get getPasswordPolicy() {
    return this.passwordPolicy;
  }

  @action
  setStaff(data) {
    this.staff = data;
  }

  @computed
  get getStaff() {
    return this.staff;
  }

  @action
  setLanguagelist(languagelist) {
    this.languagelist = languagelist;
  }

  @computed
  get getLanguagelist() {
    return this.languagelist;
  }


  loadPasswordPolicyById(id) {
    return axios.get(`/iam/v1/organizations/${id}/password_policies`).then((data) => {
      this.setPasswordPolicy(data);
    });
  }

  checkUsername = (organizationId, loginName) => (
    axios.post(`/iam/v1/organizations/${organizationId}/users/check`, JSON.stringify({ organizationId, loginName }))
  );

  checkEmailAddress = (organizationId, email) => (
    axios.post(`/iam/v1/organizations/${organizationId}/users/check`, JSON.stringify({ organizationId, email }))
  );

  createUser = (user, id) => (
    axios.post(`/iam/v1/organizations/${id}/users`, JSON.stringify(user))
  );

  getUserInfoById = (orgId, id) => (
    axios.get(`/iam/v1/organizations/${orgId}/users/${id}`)
  );

  updateUser = (orgId, id, user) => (
    axios.put(`/iam/v1/organizations/${orgId}/users/${id}`, JSON.stringify(user))
  );

  // 查询所有员工GET /v1/organizations/{iamOrganizationId}/employee/info/able

  loadStaffData = (orgId, employeeId) => {
    if (employeeId) {
      return (
        axios.get(`/fnd/v1/${orgId}/organizations/employee/no/user/all?employeeId=${employeeId}`).then((data) => {
          const a = data.filter(i => i.status !== 'QUIT' && i.isEnabled === 'Y')
          this.setStaff(a);
        })
      );
    } else {
      return (
        axios.get(`/fnd/v1/${orgId}/organizations/employee/no/user/all`).then((data) => {
          const a = data.filter(i => i.status !== 'QUIT' && i.isEnabled === 'Y')
          this.setStaff(a);
        })
      );
    }
  }

  // 选择多语言
  loadLanguageList = () => axios.get('/iam/v1/languages/list').then((data) => {
    this.setLanguagelist(data);
  });
}

const createUserStore = new CreateUserStore();

export default createUserStore;
