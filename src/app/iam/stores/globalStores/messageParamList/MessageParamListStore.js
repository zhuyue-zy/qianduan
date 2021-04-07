import { action, observable, computed } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from "../../language/languageStore";

@store('MessageParamListStore')
class MessageParamListStore extends LanguageStore{
  constructor() {
    super('messageParamList');
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

  loadMessageParam = (page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `message/v1/setup/param/page/list?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // getParamLanuage = (id) => axios.get(`message/v1/setup/param/language/${id}`);

  // 查询应用系统
  getApplicationTypes=(organizationId, code = 'FND_APP_SYSTEM') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setApplicationType(data);
  });

  //创建
  createDes = (data) => axios.post(`message/v1/setup/param/insert`,JSON.stringify(data));

  //修改
  updateDes = (data) => axios.put(`message/v1/setup/param/edit`, JSON.stringify(data));

  //删除
  deleteDes = (data) => axios.delete(`message/v1/setup/param`, {data: JSON.stringify(data)});


}

const messageParamListStore = new MessageParamListStore();
export default messageParamListStore;
