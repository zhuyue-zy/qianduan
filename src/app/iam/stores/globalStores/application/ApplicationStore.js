import { action, computed, observable, toJS } from 'mobx';
import { Observable } from 'rxjs';
import { axios, store } from 'yqcloud-front-boot';
import _ from 'lodash';

@store('ApplicationStore')
class ApplicationStore {
  @observable isLoading = false;
  @observable tenantApplicationData = [];

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  @action
  setIsLoading(data) {
    this.isLoading = data;
  }

  @computed
  get getTenantApplicationData() {
    return this.tenantApplicationData;
  }

  @action
  setTenantApplicationData(data) {
    this.tenantApplicationData = data;
  }

  loadTenantApplicationData({ current, pageSize }, { columnKey, order }, params) {
    const sorter = [];
    if (columnKey) {
      sorter.push(columnKey);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    return axios.post(
      `/iam/v1/organization/menu/organization/menus?page=${current - 1}&size=${pageSize}&sort=${sorter.join(',')}`//, JSON.stringify(params)
    );
  }

  loadApplicationData() {
    return axios.get(
      '/iam/v1/menus/menus'
    );
  }

  loadTenantData() {
    return axios.get(
      '/iam/v1/organizations/all'
    );
  }

  createTenantApplication = (body) =>
    axios.post('iam/v1/organization/menu', JSON.stringify(body))

  editTenantApplication = (body) =>
    axios.put('iam/v1/organization/menu/organization/menus', JSON.stringify(body))

  deleteTenantApplication = (body) =>
    axios.delete('iam/v1/organization/menu', { data: JSON.stringify(body) })
}

const applicationStore = new ApplicationStore();

export default applicationStore;
