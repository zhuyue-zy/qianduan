/**
 * Create By liuchuan on 2018/9/6.
 */
import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';

@store('EmployeeStore')
class EmployeeStore {
  @observable isLoading = true;

  @observable employees = [];

  @observable totalSize;

  @observable totalPage;

  constructor(totalPage = 1, totalSize = 0) {
    this.totalPage = totalPage;
    this.totalSize = totalSize;
  }

  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  @action
  setEmployees(data) {
    this.employees = data;
  }

  @computed
  get getEmployees() {
    return this.employees;
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

  /**
   * 加载员工列表信息
   * @param organizationId
   * @param page
   * @param sortParam
   * @param employeeName
   * @param employeeCode
   * @param param
   * @returns {PromiseLike<T | never> | Promise<T | never>}
   */
  loadEmployees = (organizationId, page, sortParam, {
    employeeName, employeeCode, gender, status, isEnabled,
  }, param) => {
    this.setIsLoading(true);
    return axios.post(
      `/fnd/v1/${organizationId}/organizations/employee/info?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}`,
      JSON.stringify({
        employeeName: employeeName && employeeName[0],
        employeeCode: employeeCode && employeeCode[0],
        gender: gender && gender[0],
        status: status && status[0],
        isEnabled: isEnabled && isEnabled[0],
      }),
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  /**
   * 通过id删除员工
   * @param organizationId
   * @param id
   * @returns {*}
   */
  deleteEmployeeById = (organizationId, id) => (
    axios.delete(`/fnd/v1/${organizationId}/organizations/employee/no?employeeId=${id}`)
  );

  /**
   * 通过id更新员工
   * @param orgId
   * @param user
   * @returns {IDBRequest | Promise<void>}
   */
  // updateEmployee = (orgId, user) => (
  //   axios.put(`/fnd/v1/${orgId}/organizations/employee/revision`, JSON.stringify(user))
  // );
  updateEmployee = (orgId, user) => (
    axios.put(`/fnd/v1/${orgId}/organizations/employee/new/revision`, JSON.stringify(user))
  );

  /**
   * 禁用/启用员工
   * @param orgId
   * @param employeeId
   * @param isEnabled
   * @returns {IDBRequest | Promise<void>}
   */
  isEnableEmployee = (orgId, data) => axios.post(
    `/fnd/v1/${orgId}/organizations/employee/able`, JSON.stringify(data),
  );

  /**
   * 查询租户类型
   */
  getTenantType = (orgId) => axios.get(`/iam/v1/${orgId}/type`);

  /**
   * 查询所有有效的未激活员工
   */
  getInvitationStaff = (orgId) => axios.get(`/fnd/v1/${orgId}/organizations/employee/enabled/inactive`);

  /**
   * 批量激活成员账户
   */
  batchInvitationStaff = (orgId,data) => axios.post(`/fnd/v1/${orgId}/organizations/employee/upload/activate/batch`, JSON.stringify(data));

  /**
   * 冻结已激活成员账户
   */
  isInvUnbindingEnterprise = (organizationId,employeeId) => axios.post(`/fnd/v1/${organizationId}/organizations/employee/freeze/${employeeId}`);

}


const employeeStore = new EmployeeStore();

export default employeeStore;
