import { action, observable, computed } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from "../../language/languageStore";

@store('BusinessParamStore')
class BusinessParamStore extends LanguageStore{
  constructor() {
    super('businessParam');
  }
  @observable isLoading = true;

  @observable applicationType = [];

  @observable transactionNameType = [];

  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  @action
  setApplicationType(applicationType) {
    this.applicationType = applicationType;
  }

  @computed
  get getApplicationType() {
    return this.applicationType;
  }

  @action
  setTransactionNameType(transactionNameType) {
    this.transactionNameType = transactionNameType;
  }

  @computed
  get getTransactionNameType() {
    return this.transactionNameType;
  }

  loadBussinessParam = (organizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `message/v1/${organizationId}/setup/param/page/list?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 查询应用系统
  getApplicationTypes=(organizationId, code = 'FND_APP_SYSTEM') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setApplicationType(data);
  });

  // 查询事务名称
  getTransactionNameTypes = (organizationId, code = 'FND_MSG_TRANSNAME') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setTransactionNameType(data);
  })

}

const businessParamStore = new BusinessParamStore();
export default businessParamStore;
