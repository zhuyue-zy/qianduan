import { action, computed, observable, toJS } from 'mobx';
import { Observable } from 'rxjs';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';
import _ from 'lodash';

@store('PermissionStore')
class PermissionStore extends LanguageStore{
  constructor() {
    super('permission');
  }

  @observable permissionData = [];

  @computed
  get getPermissionData() {
    return this.permissionData;
  }

  @action
  setPermissionData(data) {
    this.permissionData = data;
  }

  loadPermissionData({ current, pageSize }, { columnKey, order }, params) {
    const sorter = [];
    if (columnKey) {
      sorter.push(columnKey);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    return axios.post(
      `/iam/v1/permissions/all?page=${current - 1}&size=${pageSize}&sort=${sorter.join(',')}`//, JSON.stringify(params)
    );
  }

  editPermissionData(body) {
    return axios.put(
      '/iam/v1/permissions', JSON.stringify(body)
    );
  }
}

const permissionStore = new PermissionStore();

export default permissionStore;
