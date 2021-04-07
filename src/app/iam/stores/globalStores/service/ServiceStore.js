/**
 * Created by jaywoods on 2017/6/25.
 */
import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';

@store('ServiceStore')
class ServiceStore {
  @observable service = [];
  @observable totalSize;
  @observable totalPage;
  @observable isLoading = true;

  constructor(totalPage = 1, totalSize = 0) {
    this.totalPage = totalPage;
    this.totalSize = totalSize;
  }

  @action setService(data) {
    this.service = data;
  }

  @computed get getServices() {
    return this.service;
  }

  @action setTotalSize(totalSize) {
    this.totalSize = totalSize;
  }

  @computed get getTotalSize() {
    return this.totalSize;
  }

  @action setTotalPage(totalPage) {
    this.totalPage = totalPage;
  }

  @computed get getTotalPage() {
    return this.totalPage;
  }

  @action changeLoading(flag) {
    this.isLoading = flag;
  }

  @computed get getIsLoading() {
    return this.isLoading;
  }

  loadServices(organizationId, page, size, state) {
    this.changeLoading(true);
    if (!state) {
      return axios.get(`/uaa/v1/services?page=${page}&size=${size}`).then((data) => {
        if (data) {
          this.setService(data.content);
          this.setTotalPage(data.totalPages);
          this.setTotalSize(data.totalElements);
        }
        this.changeLoading(false);
      });
    } else if (state.code === '') {
      return axios.get(`/uaa/v1/services?param=${state.input}&page=${page}&size=${size}`).then((data) => {
        if (data) {
          this.setService(data.content);
          this.setTotalPage(data.totalPages);
          this.setTotalSize(data.totalElements);
        }
        this.changeLoading(false);
      });
    } else {
      return axios.get(`/uaa/v1/services?${state.code}=${state.input}&page=${page}&size=${size}`).then((data) => {
        if (data) {
          this.setService(data.content);
          this.setTotalPage(data.totalPages);
          this.setTotalSize(data.totalElements);
        }
        this.changeLoading(false);
      });
    }
  }
  
  queryServices = (state) => {
    if (state.code === '') {
      axios.get(`/uaa/v1/services?param=${state.input}&page=0&size=10`).then((data) => {
        this.setService(data.content);
      });
    } else {
      axios.get(`/uaa/v1/services?${state.code}=${state.input}&page=0&size=10`).then((data) => {
        this.setService(data.content);
      });
    }
  }
  queryDatas([page, size], value) {
    let url = '';
    if (typeof value === 'string') {
      url = `&param=${value}`;
    } else if (typeof value === 'object') {
      for (let i = 0; i < value.length; i += 1) {
        url += `&${value[i].key}=${value[i].values}`;
      }
    }
    this.changeLoading(true);
    return axios.get(`/uaa/v1/services?page=${page}&size=${size}${url}`).then((data) => {
      if (data) {
        this.setService(data.content);
        this.setTotalPage(data.totalPages);
        this.setTotalSize(data.totalElements);
        this.changeLoading(false);
      }
    });
  }
}

const serviceStore = new ServiceStore();

export default serviceStore;
