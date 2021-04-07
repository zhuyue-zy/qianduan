import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';
import { message } from 'yqcloud-ui';

@store('CreateCustomerStore')
class CreateCustomerStore extends LanguageStore{
  constructor() {
    super('customer');
  }
  @observable language;
  @observable scaleList = [];
  @observable industryList = [];
  @observable areaList = [];
  @observable employeeList = [];
  @observable countryList = [];
  @observable cityList = [];


  @action
  setLanguage(lang) {
    this.language = lang;
  }
 
  @computed
  get getLanguage() {
    return this.language;
  }

  // 查询规模大小
  @action
  setScaleList(scaleList) {
    this.scaleList = scaleList;
  }

  @computed
  get getScaleList() {
    return this.scaleList;
  }
   // 查询行业
   @action
   setIndustryList(industryList) {
     this.industryList = industryList;
   }
 
   @computed
   get getIndustryList() {
     return this.industryList;
   }
     // 查询地区
     @action
     setAreaList(areaList) {
       this.areaList = areaList;
     }
   
     @computed
     get getAreaList() {
       return this.areaList;
     }
     
  // 查询规模大小
  @action
  setEmployeeList(employeeList) {
    this.employeeList = employeeList;
  }

  @computed
  get getEmployeeList() {
    return this.employeeList;
  }
  @action
  setCountryList(countryList) {
    this.countryList = countryList;
  }

  @computed
  get getCountryList() {
    return this.countryList;
  }
  @action
  setCityList(cityList) {
    this.cityList = cityList;
  }

  @computed
  get getCityList() {
    return this.cityList;
  }

  createCustomer = (customer, orgId) => (
    axios.post(`/itsm/v1/${orgId}/customer`, JSON.stringify(customer))  
  );

  getCustomerInfoById = (orgId, customerId) => (
    axios.get(`/itsm/v1/${orgId}/customer/${customerId}`)
  
  );

  updateCustomer = (orgId, id, customer) => (
    axios.put(`/itsm/v1/${orgId}/customer`, JSON.stringify(customer))  
  );
  //queryEmployeeList = (iam_organization_id,) => axios.put(`/fnd/v1/${iam_organization_id}/organizations/employee/info/all`).then((data) => {
     // this.setEmployeeList(data);
  //  });
  // 查询行业
queryIndustryList = (iam_organization_id, code = 'ITSM_INDUSTRY') => axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto?lookupTypeCode=${code}`).then((data) => {
  this.setIndustryList(data);
});
// 查询规模
  queryScaleList = (iam_organization_id, code = 'ITSM_SCALE') => axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto?lookupTypeCode=${code}`).then((data) => {
  this.setScaleList(data);
});
// 查询地区
queryAreaList = (iam_organization_id, code = 'ITSM_AREA') => axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto?lookupTypeCode=${code}`).then((data) => {
  this.setAreaList(data);
});
// 查询员工
queryEmployeeList = (iam_organization_id, conditionStr) => axios.get(`fnd/v1/${iam_organization_id}/organizations/employee/info/all?condition=${conditionStr}`).then((data) => {
  this.setEmployeeList(data.content);
});
queryCountryList = (iam_organization_id, code = 'ITSMCOUNTRY') => axios.get(`/fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
 this.setCountryList(data);
});
queryCityList = (iam_organization_id, code = 'ITSMCITY') => axios.get(`/fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
  this.setCityList(data);
 });
}



const createCustomerStore = new CreateCustomerStore();

export default createCustomerStore;
