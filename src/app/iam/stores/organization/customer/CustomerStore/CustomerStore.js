import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';
import { message } from 'yqcloud-ui';

@store('CustomerStore')
class CustomerStore extends LanguageStore {
  constructor() {
    super('customer');
  }

  @observable isLoading = true;

  @observable language;

  @observable organization;


  @observable enabled = [];

  @observable customers;


  @observable totalSize;

  @observable totalPage;

  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }



  @action
  setLanguage(data) {
    this.language = data;
  }

  @action
  setOrganization(data) {
    this.organization = data;
  }


  @action
  setCustomers(data) {
    this.customers = data;
  }

  @computed
  get getCustomers() {
    return this.customers;
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

  //EnableStructure = (orgId, structureId, data) => axios.put(`/iam/v1/organizations/${orgId}/users/${structureId}/enable`);

 //UnenableStructure = (orgId, structureId, data) => axios.put(`/iam/v1/organizations/${orgId}/users/${structureId}/disable`); 

  // 加载客户列表
  loadCustomers = (organizationId, page, sortParam, {
    customerName, customerCode,contactEmail,contactPhone,enabled,condition
  }, param) => {
    this.setIsLoading(true);

    let customerNameStr = typeof(customerName) == "undefined" ? "" : customerName;
    let customerCodeStr = typeof(customerCode) == "undefined" ? "" : customerCode;
    let cityStr = typeof(city) == "undefined" ? "" : city;
    let contactPhoneStr = typeof(contactPhone) == "undefined" ? "" : contactPhone;
    let conditionStr = typeof(condition) == "undefined" ? "" : condition;
    //let conditionStr = typeof(condition) == "undefined" ? "" : condition;
    

    return axios.get(`/itsm/v1/${organizationId}/customer/page?page=${page.current - 1}&size=${page.pageSize}&customerName=${customerNameStr}&customerCode=${customerCodeStr}&city=${cityStr}&contactPhone=${contactPhoneStr}`)
    .then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };
 
}
const customerStore = new CustomerStore();

export default customerStore;
