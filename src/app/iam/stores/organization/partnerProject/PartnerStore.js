
import {action, computed, observable} from 'mobx';
import {axios, store} from 'yqcloud-front-boot';
import LanguageStore from "../../language";

@store('PartnerStore')
class PartnerStore extends LanguageStore{
  @observable isLoading = true;
  @observable companys = [];
  @observable companysList = [];
  @observable CompanyNameList = [];
  @observable CompanyNature = [];
  @observable employee = [];
  @observable lookUp = {
    FND_CONTRACT_TYPE: [],
    FND_CURRENCY_TYPE: [],
    FND_CONTRACT_STATUS: [],
    FND_PARTNER_SCALE: [],
    FND_PARTNER_INDUSTRY: [],
  };
  @observable totalSize;
  @observable totalPage;

  constructor(totalPage = 1, totalSize = 0) {
    super('partner');
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
  setCompanysNature(CompanyNature) {
    this.CompanyNature = CompanyNature;
  }

  @computed
  get getCompanysNature() {

    return this.CompanyNature;
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
  setEmployee(data) {
    this.employee = data;
  }

  @action
  setLookUp(item, data) {
    this.lookUp[item] = data;
  }

  /**
   * 加载公司列表信息
   * @param param
   * @returns
   */
  loadCompanys = (iamOrganizationId = 1, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filterStr = '';
    for (let i in filters) {
      filterStr += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `/fnd/v1/${iamOrganizationId}/organizations/partner/info?page=${page.current - 1}&size=${page.pageSize}${filterStr}`,
    JSON.stringify({
      param,
    }),
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 获取公司信息
  getCompanyInfoById = (iamOrganizationId, companyId) =>
    axios.get(`/fnd/v1/${iamOrganizationId}/organizations/partner/id/info?partnerId=${companyId}`);

  // 新建公司
  createCompany = (iamOrganizationId , company) =>
    axios.post(`/fnd/v1/${iamOrganizationId}/organizations/partner/company`, JSON.stringify(company));

  // 启用停用
  ableCompany = (iamOrganizationId, company) =>
    axios.post(`/fnd/v1/${iamOrganizationId}/organizations/partner/able`, JSON.stringify(company));

  // 更新
  updateCompany = (iamOrganizationId, company) =>
    axios.put(`/fnd/v1/${iamOrganizationId}/organizations/partner/revision`, JSON.stringify(company));

  // 上级公司下拉框
  loadparentCompany = (iamOrganizationId) =>
    axios.get(`/fnd/v1/${iamOrganizationId}/organizations/partner/all/info`).then((data) => {
      this.setCompanyNameList(data);
    });

  //获取公司性质
  queryComNature=(iam_organization_id,code='PTN_CPN_TYPE') => {
    return axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
      this.setCompanysNature(data);
    })
  }

  loadEmployee = (iamOrganizationId,condition='',page) => {
    axios.post(`/fnd/v1/${iamOrganizationId}/organizations/employee/organization/employee/page?&condition=${condition}`,JSON.stringify(page)).then((res) => {
      const temp = res.content.map(v => v.employeeName);
      res.content.forEach((v) => {
        if (temp.filter(v2 => v2 === v.employeeName).length > 1) {
          v.employeeNameCode = `${v.employeeName}-${v.employeeId}`;
        } else {
          v.employeeNameCode = v.employeeName;
        }
      });
      this.setEmployee(res.content);
    });
  }

  deleteContractNo = (iamOrganizationId, data) => (axios.delete(`/fnd/v1/${iamOrganizationId}/contract/no`, { data: JSON.stringify(data) }))

  queryLookUp = (organizationId) => {
    Object.keys(this.lookUp)
      .forEach((v) => {
        axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${v}`)
          .then((data) => {
            if (data && !data.failed) this.setLookUp(v, data);
          });
      });

  };
}

const partnerStore = new PartnerStore();

export default partnerStore;
