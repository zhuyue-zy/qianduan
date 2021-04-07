/**
 * Created by nanjiangqi on 2018-9-27 0027.
 */
import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('CompanyStore')
class CompanyStore extends LanguageStore {
  @observable isLoading = true;

  @observable companys = [];

  @observable companysList = [];

  @observable CompanyNameList = [];

  @observable totalSize;

  @observable totalPage;

  @observable enabled =[];


  constructor(totalPage = 1, totalSize = 0) {
    super('companyManagement');
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

  @action
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  @computed
  get getEnabled() {
    return this.enabled;
  }

  /**
   * 加载公司列表信息
   * @param param
   * @returns
   */
  loadCompanys = (iamOrganizationId = 1, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filterStr = '';
    for (const i in filters) {
      filterStr += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `/fnd/v1/${iamOrganizationId}/organizations/company/info?page=${page.current - 1}&size=${page.pageSize}${filterStr}`,
      JSON.stringify({
        param,
      }),
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 获取公司信息
  getCompanyInfoById = (iamOrganizationId = 1, companyId) => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/company/info?companyId=${companyId}`);

  // 新建公司
  createCompany = (iamOrganizationId = 1, company) => axios.post(`/fnd/v1/${iamOrganizationId}/organizations/company/company`, JSON.stringify(company));

  // 启用停用
  ableCompany = (iamOrganizationId, company) => axios.post(`/fnd/v1/${iamOrganizationId}/organizations/company/able`, JSON.stringify(company));

  // 更新
  updateCompany = (iamOrganizationId, company) => axios.put(`/fnd/v1/${iamOrganizationId}/organizations/company/revision`, JSON.stringify(company));

  // 上级公司下拉框
  loadparentCompany = iamOrganizationId => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/company/all/info`).then((data) => {
    this.setCompanyNameList(data);
  });

  // 有效快码

  getIsEnabled = (organizationId, code = 'FND_VALID_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });
}

const companyStore = new CompanyStore();

export default companyStore;
