/**
 * Create By liuchuan on 2018/9/6.
 */
import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';
import { message } from 'yqcloud-ui';

@store('AssignEmployeeStore')
class AssignEmployeeStore extends LanguageStore {
  constructor() {
    super('assignEmployee');
  }

  @observable postions = [];

  @observable allPostions = [];

  @observable allRoles = [];

  @observable isLoading = true;

  @action
  setPostions(data) {
    this.postions = data;
  }

  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  @computed
  get getPostions() {
    return this.postions;
  }

  @action
  setAllPostions(data) {
    this.allPostions = data;
  }

  @action
  setAllRoles(data) {
    this.allRoles = data;
  }

  @computed
  get getAllPostions() {
    return this.allPostions;
  }

  @computed
  get getAllRoles() {
    return this.allRoles;
  }

  /**
   * 通过员工ID查岗位
   * @param orgId
   * @param id
   * @returns {*}
   */
  getEmployeePostionById = (orgId, id) => {
    this.setIsLoading(true);
    return axios.get(`/fnd/v1/${orgId}/organizations/employeePosition/info?employeeId=${id}`).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  /**
   * 查询所有岗位
   * @param orgId
   * @returns {*}
   */
  getEmployeePostions = (organizationId, id) => (
    axios.get(`/fnd/v1/${organizationId}/organizations/position/employee/exclusive_select/list/${id}`)
  );
  // 查询所有角色

  loadRole = (organizationId, page, sortParam, param) => axios.post(
    `/iam/v1/roles/search/${organizationId}?page=${page.current - 1}&size=${page.pageSize}`,
    JSON.stringify({
      name: name && name[0],
    }),
  ).then(data => data);

  loadRoleUn = (organizationId, employeeId) => axios.get(
    `/fnd/v1/${organizationId}/organizations/employee/role/surplus/${employeeId}`,
    JSON.stringify({
      name: name && name[0],
    }),
  ).then(data => data);


  /**
   * 新增员工岗位关系
   * @param orgId
   * @param user
   * @returns {*}
   */
  createEmployeeePosition = (orgId, position) => (
    axios.put(`/fnd/v1/${orgId}/organizations/employeePosition/new`, JSON.stringify(position))
  );

  // 批量添加角色
  createEmployeeeRole = (orgId, empId, role) => (
    axios.put(`fnd/v1/${orgId}/organizations/employee/${empId}/role`, JSON.stringify(role))
  );

  /**
   * 删除员工岗位关系
   * @param orgId
   * @param position
   * @returns {*}
   */
  deletePositionById = (orgId, selectIds) => (
    axios.delete(`/fnd/v1/${orgId}/organizations/employeePosition/no`, { data: JSON.stringify(selectIds) })
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

const assginEmployeeStore = new AssignEmployeeStore();

export default assginEmployeeStore;
