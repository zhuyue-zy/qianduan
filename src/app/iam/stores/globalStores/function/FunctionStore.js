import { action, computed, observable, toJS } from 'mobx';
import { Observable } from 'rxjs';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

import _ from 'lodash';

@store('FunctionStore')
class FunctionStore extends LanguageStore {
  constructor() {
    super('function');
  }

  @observable isLoading = true;

  @observable companys = [];

  @observable companysList = [];

  @observable CompanyNameList = [];

  @observable totalSize;

  @observable totalPage;

/*  constructor(totalPage = 1, totalSize = 0) {
    this.totalPage = totalPage;
    this.totalSize = totalSize;
  }*/

  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  @action
  setCompanys(data) {
    this.companys = data;
  }

  @computed
  get getCompanys() {
    return this.companys;
  }

  @action
  setCompanysList(data) {
    this.companysList = data;
  }

  @computed
  get getCompanysList() {
    return this.companysList;
  }

  @action
  setCompanyNameList(data) {
    this.CompanyNameList = data;
  }

  @computed
  get getCompanyNameList() {
    return this.CompanyNameList;
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
   * 加载公司列表信息
   * @param param
   * @returns
   */
  loadFunctions = (page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filterStr = '';
    for (const i in filters) {
      filterStr += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `/iam/v1/function/permission/query?page=${page.current - 1}&size=${page.pageSize}${filterStr}&sort=${sortParam}`,
      JSON.stringify({
        param,
      }),
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };
}

const functionStore = new FunctionStore();

export default functionStore;
