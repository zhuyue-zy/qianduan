/**
 * Created by kanghua.pang on 2018/10/22.
 */

import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';


@store('RoleManagementStore')
class RoleManagementStore extends LanguageStore {
  constructor() {
    super('function');
  }
  @observable isLoading = false;

  @observable roleManagementApi = '/iam/v1/custom/menu';

  @observable roleData = [];

  @action setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed get getRoleManagementApi() {
    return this.roleManagementApi;
  }

  @computed get getIsLoading() {
    return this.isLoading;
  }

  @computed get getRoleData() {
    return this.roleData;
  }

  @action setRoleManagementApi(Api) {
    this.roleManagementApi = Api;
  }

  @action setRoleData(flag) {
    this.roleData = flag;
  }

  /* 获取功能树根节点 */
  loadRoleRoot = () => axios.get('iam/v1/function/root');

  /* 根据父code获取子 */
  loadRoleByParent = parentCode => axios.get(`iam/v1/function/root/${parentCode}`);

  /* 搜索功能 */
  loadRoleBySearch = (str, type) => axios.get(`iam/v1/function/tree?search=${str}&type=${type}`);

  /* 获取api */
  loadApi = (value) => axios.get(`iam/v1/permission/query/list?code=${value}`);

  /* 检查编码是否重复 */
  checkRoleCode = functionCode => axios.get(`iam/v1/function/${functionCode}`);

  /* 检查menuCode是否重复 */
  checkMenuCode = (menuCode) => axios.get(`iam/v1/function/menu/${menuCode}`);

  /* 根据code获取功能详细信息 */
  loadRoleByCode = roleCode => axios.get(`iam/v1/function/detail/code/functionCode?functionCode=${roleCode}`);

  /* 创建功能 */
  createRole = (data, type) => {
    if (data.menuCode === ''){
      data.menuCode = null;
    }
    return axios.post(`iam/v1/function?type=${type}`, JSON.stringify(data))
  };

  /* 更新功能 */
  updateRole = data => {
    if (data.menuCode === ''){
      data.menuCode = null;
    }
    return axios.put('iam/v1/function', JSON.stringify(data))
  };

  /* 重置roleManagementApi */
  reset = () => {
    this.setRoleManagementApi('/iam/v1/custom/menu')
  }


  /* 删除功能 */
  deleteRole = functionCode => {
    return axios.delete(`iam/v1/function/code?functionCode=${functionCode}`)
  };

  /* 同步菜单 */
  sychronizeAllMenu = () => {
    return axios.get(`iam/v1/function/sync/menu`)
  }

}

const roleManagementStore = new RoleManagementStore();

export default roleManagementStore;
