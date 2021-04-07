/**
 * Create By liuchuan on 2018/9/6.
 */
import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import { message } from 'yqcloud-ui';
import LanguageStore from '../../../language/languageStore';

@store('CreateEmployeeStore')

class CreateEmployeeStore extends LanguageStore {
  constructor() {
    super('assignEmployee');
  }

  @observable CompanyNameList = [];

  @observable empZhuangTai = [];

  @observable empList = [];

  @observable statusList = [];

  @observable inviteStatus = [];

  @observable genderList = [];

  @observable languageEnv = [];

  @observable zJList = [];

  @observable positions = [];

  @observable roles = [];

  @computed
  get getRoles() {
    return this.roles.slice();
  }

  @action
  setRoles(data) {
    this.roles = data;
  }

  @action
  setCompanyNameList(data) {
    this.CompanyNameList = data;
  }

  @action setPositions(data) {
    this.positions = data;
  }

  @computed get getPositions() {
    return this.positions;
  }

  // 员工状态
  @action
  setEmpList(empList) {
    this.empList = empList;
  }

  @computed
  get getEmpList() {
    return this.empList;
  }

  // 查询员工类型
  @action
  setStatusList(statusList) {
    this.statusList = statusList;
  }

  @computed
  get getStatusList() {
    return this.statusList;
  }

  // 查询y邀请状态
  @action
  setInviteStatus(inviteStatus) {
    this.inviteStatus = inviteStatus;
  }

  @computed
  get getInviteStatus() {
    return this.inviteStatus;
  }

  // 查询有效失效
  @action
  setEmpZhuangTai(empZhuangTai) {
    this.empZhuangTai = empZhuangTai;
  }

  @computed
  get getEmpZhuangTai() {
    return this.empZhuangTai;
  }

  // 性别

  @action
  setGenderList(genderList) {
    this.genderList = genderList;
  }

  @computed
  get getGenderList() {
    return this.genderList;
  }

  // 证件

  @action
  setZJList(zJList) {
    this.zJList = zJList;
  }

  @computed
  get getZJList() {
    return this.zJList;
  }


  @computed
  get getCompanyNameList() {
    return this.CompanyNameList;
  }

  @action
  setLanguageEnv(flag) {
    this.languageEnv = flag;
  }

  @computed
  get getLanguageEnv() {
    return this.languageEnv;
  }

  createEmployee = (orgId, user) => (
    axios.put(`/fnd/v1/${orgId}/organizations/employee/new`, JSON.stringify(user))
  );

  getEmployeeInfoById = (orgId, id) => (
    axios.post(`/fnd/v1/${orgId}/organizations/employee/info`,
      JSON.stringify({
        employeeId: id,
      }))
  );

  // updateEmployee = (orgId, user) => (
  //   axios.post(`/fnd/v1/${orgId}/organizations/employee/revision`, JSON.stringify(user))
  // );
  updateEmployee = (orgId, user) => (
    axios.post(`/fnd/v1/${orgId}/organizations/employee/new/revision`, JSON.stringify(user))
  );

  checkEmployeeCode = (organizationId, employeeCode) => (
    axios.post(`/fnd/v1/${organizationId}/organizations/employee/code`, JSON.stringify({employeeCode}))
  );

  checkEmailCode = (organizationId, email) => (
    axios.post(`/fnd/v1/${organizationId}/organizations/employee/code`, JSON.stringify({email}))
  );

  checkMobilCode = (organizationId, mobil) => (
    axios.post(`/fnd/v1/${organizationId}/organizations/employee/code`, JSON.stringify({mobil}))
  );

  // 上级公司下拉框
  loadparentCompany = iamOrganizationId => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/partner/all/info`).then((data) => {
    this.setCompanyNameList(data);
  });

  // 上级公司下拉框
  loadparentCompanyList = iamOrganizationId => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/partner/all/info`);

  // 获取code信息
  getCode = (code) => axios.get(`/fnd/v1/sys/messages/queryCode?messageCode=${code}`)
    .then((data) => {
      const {failed: infailed} = data;
      const types = data.type;
      if (!infailed) {
        message[types](data.content, undefined, undefined, `${data.placement}`);
      } else {
        message[types](code, undefined, undefined, `${data.placement}`);
      }
    });

  // 获得拼接的报错信息
  getEmployeeExistCode = (id, code) => axios.get(`/fnd/v1/sys/messages/queryCode?messageCode=${code}`)
  .then((data) => {
    const {failed: infailed} = data;
    const types = data.type;
    if (!infailed) {
      message[types](id + data.content, undefined, undefined, `${data.placement}`);
    } else {
      message[types](code, undefined, undefined, `${data.placement}`);
    }
  });


  /**
   * 通过员工ID查岗位
   * @param orgId
   * @param id
   * @returns {*}
   */
  getEmployeePostionById = (orgId, id) => axios.get(`/fnd/v1/${orgId}/organizations/employeePosition/info?employeeId=${id}`).then(data => data);

  /**
   * 删除员工岗位关系
   * @param orgId
   * @param position
   * @returns {*}
   */
  deletePositionById = (orgId, selectIds) => (
    axios.delete(`/fnd/v1/${orgId}/organizations/employeePosition/no`, {data: JSON.stringify(selectIds)})
  );

  /**
   * 更新员工岗位关系
   * @param orgId
   * @param user
   * @returns {*}
   */
  updateEmployeeePosition = (orgId, data) => (
    axios.post(`/fnd/v1/${orgId}/organizations/employeePosition/revision`, JSON.stringify(data))
  );

  // 加载历史
  loadHistorys = (orgId, empId) => axios.get(`/fnd/v1/${orgId}/organizations/employee/history/${empId}`).then(data => data);

  // 加载登录历史
  loadLoginHistorys = (organizationId, userId) => axios.get(`/iam/v1/${organizationId}/organization/user/login/history?userId=${userId}`).then(data => data);

  // 加载员工 角色
  loadEmpRole = (orgId, empId) => axios.get(`/fnd/v1/${orgId}/organizations/employee/role/${empId}`).then(data => data);

  // 删除员工角色
  deleteEmoRoles = (orgId, empId, obj) => axios.delete(`/fnd/v1/${orgId}/organizations/employee/${empId}/role`, {data: JSON.stringify(obj)});

  //  邀请账户
  isInvEmployees = (orgId, mail, empObj) => axios.post(
    `/fnd/v1/${orgId}/organizations/employee/Invitation/${mail}`, JSON.stringify(empObj),
  );

  //  取消邀请
  isInvEmployeesCancles = (orgId, empId) => axios.post(
    `/fnd/v1/${orgId}/organizations/employee/cancel/${empId}`,
  );

  //  解绑账户
  isInvUnbinding = (orgId, empId) => axios.post(
    `/fnd/v1/${orgId}/organizations/employee/unbinding/${empId}`,
  );

  // 校验邀请邮箱
  checkInvaitEmails = (orgId, email, id) => axios.post(
    `fnd/v1/${orgId}/organizations/employee/email/binding/check?email=${email}&employeeId=${id}`,
  );

  // 查询员工状态
  queryEmpList = (iam_organization_id, code = 'FND_USER_USERSTATUS') => axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEmpList(data);
  });

  // 查询有效失效
  queryEmpZhuangTai = (iam_organization_id, code = 'FND_VALID_STATUS') => axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEmpZhuangTai(data);
  });

  // 查询员工类型
  queryStatusList = (iam_organization_id, code = 'FND_USER_USERTYPE') => axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setStatusList(data);
  });

  // 查询邀请状态
  queryInviteStatus = (iam_organization_id, code = 'FND_USER_INVITESTATUS') => axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setInviteStatus(data);
  });

  // 查询性别
  queryGenderList = (iam_organization_id, code = 'FND_USER_SEX') => axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setGenderList(data);
  });

  // 查询证件类型
  queryZJList = (iam_organization_id, code = 'FND_USER_IDTYPE') => axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setZJList(data);
  });

  //查询登录方式快码
  getLoginMethodTypes = (organizationId, code = 'IAM_LOGIN_PLATFORM') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`);

  uploadExcelEmp = (iam_organization_id, obj) => axios.post(`fnd/v1/${iam_organization_id}/organizations/employee/import`, JSON.stringify(obj));

  //  批量邀请
  batchInvEmployees = (orgId, empObj) => axios.post(
    `/fnd/v1/${orgId}/organizations/employee/invitation/batch`, JSON.stringify(empObj),
  );

  uploadConfirm = orgId => axios.post(`fnd/v1/${orgId}/organizations/employee/upload/import/confirm`);

  //  查询课批量邀请的员工
  loadEmpBactchInv = orgId => axios.get(`/fnd/v1/${orgId}/organizations/employee/enabled/uninvited/list`).then(data => data);

  // 查询ldap成员信息
  getLdapEmp = (iamOrganizationId, ldapList) => axios.get(`/iam/v1/organizations/${iamOrganizationId}/ldaps/user?param=${ldapList}`);

  //  新建LDAP成员
  createLdapEmp = (iamOrganizationId, ldapList) => axios.put(`/iam/v1/organizations/${iamOrganizationId}/users/ldap/new`, JSON.stringify(ldapList));

  // 校验结果
  queryCheck = (iamOrganizationId) => axios.get(`fnd/v1/${iamOrganizationId}/organizations/employee/upload/verification/result`);

  // 查询租户扩展字段
  queryExtendedField = (iamOrganizationId) => axios.get(`fnd/v1/${iamOrganizationId}/employee/ext/config/info/enable`);

  // 查询租户扩展字段
  queryExtendedFieldExtend = (iamOrganizationId) => axios.get(`fnd/v1/${iamOrganizationId}/employee/ext/config/info`);


  // 查询租户扩展字段
  saveExtendField = (iamOrganizationId,data) => axios.post(`fnd/v1/${iamOrganizationId}/employee/ext/config/save`, JSON.stringify(data));

  // 重置成员密码
  resetPassword = (iamOrganizationId,id,data,key) => axios.put(`iam/v1/users/${iamOrganizationId}/employee/${id}/password?identifier=${key}`, JSON.stringify(data));

  // 获取多语言
  queryLanguageEnv = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setLanguageEnv(allLanguage);
      });
  };

  getPulicKey = () => axios.get('iam/v1/users/key');


}


const createEmployeeStore = new CreateEmployeeStore();

export default createEmployeeStore;
