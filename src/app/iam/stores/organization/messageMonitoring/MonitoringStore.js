/**
 * Created by Administrator on 2018-11-9 0009.
 */
import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from "../../language";

@store('MonitoringStore')
class MonitoringStore extends LanguageStore{
  @observable isLoading = true;

  @observable applicationCodeList =[];

  @observable transactionNameList =[];

  @observable enabled =[];

  @observable messageType = [];

  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  constructor() {
    super('messageMonitoring');
  }
  @action
  setApplicationCodeList(applicationCodeList) {
    this.applicationCodeList = applicationCodeList;
  }


  @computed
  get getApplicationCodeList() {
    return this.applicationCodeList;
  }

  @action
  setTransactionNameList(transactionNameList) {
    this.transactionNameList = transactionNameList;
  }


  @computed
  get getTransactionNameList() {
    return this.transactionNameList;
  }

  @action
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  @computed
  get getEnabled() {
    return this.enabled;
  }

  @action
  setMessageType(messageType) {
    this.messageType = messageType;
  }

  @computed
  get getMessageType() {
    return this.messageType;
  }

  // 消息信息查询
  loadquerylist = (organizationId, page, params, sort, filters) => {
    this.setIsLoading(true);
    let filterStr = '';
    for (const i in filters) {
      filterStr += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`/message/v1/${organizationId}/send/message/info?page=${page.current - 1}&size=${page.pageSize}${filterStr}`,
      JSON.stringify({
        params,
      })).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 查询内容
  loadcontent = (iamOrganizationId, messageId) => axios.get(`/message/v1/${iamOrganizationId}/send/message/content?messageId=${messageId}`);

  // 查询收件人
  loadaddressee = (iamOrganizationId, messageId) => axios.get(`/message/v1/${iamOrganizationId}/send/message/receiver?messageId=${messageId}`);

  // 查询错误
  loaderror = (iamOrganizationId, messageId) => axios.get(`/message/v1/${iamOrganizationId}/send/message/transaction?messageId=${messageId}`);

  // 查询应用系统
  getApplicationTypes=(organizationId, code = 'FND_APP_SYSTEM') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setApplicationCodeList(data);
  });

  // 首頁查詢事务名称
  getTransaction= (organizationId, code = 'FND_MSG_TRANSNAME') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setTransactionNameList(data);
  })

  // 生效快码
  getIsEnabled = (organizationId, code = 'FND_MSG_SENDSTATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });

  getMessageTypes = (organizationId, code = 'FND_MSG_TYPE') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setMessageType(data);
  })
}

const monitoringStore = new MonitoringStore();

export default monitoringStore;
