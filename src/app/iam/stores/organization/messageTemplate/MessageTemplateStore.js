/** 2018/11/6
*作者:高梦龙
*项目：消息模板
*/
import { computed, observable, action } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';
import { message } from 'yqcloud-ui';


@store('MessageTemplateStore')
class MessageTemplateStore extends LanguageStore {
  constructor() {
    super('messageTemplate');
  }

  @observable isLoading =true;

   @observable applicationCodeList =[];

   @observable transactionNameList =[];

   @observable transactionName =[];

   @observable enabled =[];

  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
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
  setTransactionNames(transactionName) {
    this.transactionName = transactionName;
  }


  @computed
  get getTransactionNames() {
    return this.transactionName;
  }

  @action
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  @computed
  get getEnabled() {
    return this.enabled;
  }




  loadMeaasgeTemplate = (organizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `message/v1/${organizationId}/setup/temp/list?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 获取id
   getMessageTemplateId=(organizationId, templateId) => axios.get(`message/v1/${organizationId}/setup/temp/${templateId}`)

   // 获取测试信息
   getMessageTest= (organizationId, templateId) => axios.get(`message/v1/${organizationId}/setup/temp/${templateId}/test`)

    // 创建消息模板
    createMessage =(organizationId, setupTemplate) => axios.post(`message/v1/${organizationId}/setup/temp/template`, JSON.stringify(setupTemplate))

    // 更新消息模板
    updateMessage=(organizationId, setupTemplate) => axios.put(`message/v1/${organizationId}/setup/temp/compiler`, JSON.stringify(setupTemplate))

  // 获取事务数据
  getTransactionName= (organizationId, code, parentLookupValue) => axios.post(`/fnd/v1/${organizationId}/lookup/child/site?lookupTypeCode=${code}&parentLookupValue=${parentLookupValue}`).then((data) => {
    this.setTransactionNameList(data);
  })

  // 查询应用系统
  getApplicationTypes=(organizationId, code = 'FND_APP_SYSTEM') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setApplicationCodeList(data);
  });

  // 首頁查詢事务名称
  getTransaction= (organizationId, code = 'FND_MSG_TRANSNAME') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setTransactionNames(data);
  })


  // 生效快码
  getIsEnabled = (organizationId, code = 'FND_VALID_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });

  // 校验事务名称
  checkoTransaction= (organizationId, applicationCode, transactionName) => axios.post(`message/v1/${organizationId}/setup/temp/verification?applicationCode=${applicationCode}&transactionName=${transactionName}`)

  // 发送测试邮件模板
  sendEmailTemplate=(organizationId, templateId, userDTO) => axios.post(`message/v1/${organizationId}/setup/temp/${templateId}/testSend`, JSON.stringify(userDTO))

  // 数据删除
  deleteMessage=(organizationId, setupTemplate) => axios.delete(`message/v1/${organizationId}/setup/temp/temp`, { data: JSON.stringify(setupTemplate) })

  /**
   * 判断状态是否有效和无效
   */

  disableMessage = (organizationId, setupTemplate) => axios.post(`message/v1/${organizationId}/setup/temp/disable`, JSON.stringify(setupTemplate))

  enableMessage = (organizationId, setupTemplate) => axios.post(`message/v1/${organizationId}/setup/temp/enable`, JSON.stringify(setupTemplate))

  getCode = (code) => axios.get(`/fnd/v1/sys/messages/queryCode?messageCode=${code}`)
    .then((data) => {
      const { failed: infailed } = data;
      const types = data.type;
      if (!infailed) {
        message[types](data.content, undefined, undefined, `${data.placement}`);
      } else {
        message[types](code, undefined, undefined, `${data.placement}`);
      }
    });
}
const MessageTemplate = new MessageTemplateStore();
export default MessageTemplate;
