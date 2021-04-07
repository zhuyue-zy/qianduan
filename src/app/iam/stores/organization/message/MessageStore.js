/*
* @description:报错信息数据接口
* @author：张凯强
* @update 2018-09-18 16:33
*/
import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('MessageStore')
class MessageStore extends LanguageStore {

  @observable codeList = [];

  @observable selectedCode = {};

  @observable totalSize;

  @observable totalPage;

  @observable isLoading = true;

  @observable placement = [];

  @observable enabled =[];


  constructor(totalPage = 1, totalSize = 0) {
    super('messageError');
    this.totalPage = totalPage;
    this.totalSize = totalSize;
  }

  @action
  setCodeList(data) {
    this.codeList = data;
  }

  @computed
  get getCodeList() {
    return this.codeList;
  }

  @action
  setPlacement(placement) {
    this.placement = placement;
  }

  @computed
  get getPlacement() {
    return this.placement;
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
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  @action
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  @computed
  get getEnabled() {
    return this.enabled;
  }

  // 条件查询消息分页
  loadCodeInfo = (iamOrganizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `fnd/v1/sys/messages/info?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };
  // 提示信息位置快码

  getPlacements = (organizationId = 1, code = 'FND_POSITION') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setPlacement(data);
  });


  //  通过ID查询员工
  loadMessageById = messageId => axios.get(`fnd/v1/sys/messages/query/${messageId}`);

  // 通过CODE查询提示信息
  loadMessageCode = (messageCode = 1) => axios.get(`fnd/v1/sys/messages/queryCode/${messageCode}`);

  // 创建提示信息
  createCode = code => axios.put('fnd/v1/sys/messages/new', JSON.stringify(code));

  // 删除提示信息
  // deleteMessage = (messageId  ,code) =>
  //  axios.delete(`fnd/v1/sys/messages/no?messageId=${messageId}`, JSON.stringify(code));

  // 批量删除提示信息
  /*
  deleteMessage = code => axios.delete('fnd/v1/sys/messages', { data: JSON.stringify(code) });
*/
  deleteMessage = deleteValueAll => axios.delete('fnd/v1/batch', { data: JSON.stringify(deleteValueAll) })

  // 更新提示信息
  updateMessage = (code, messageId = 1) => axios.post('fnd/v1/sys/messages/revision', JSON.stringify(code));

  // 验证code
  verificationCode = code => axios.post('fnd/v1/sys/messages/verification', JSON.stringify(code))

  /**
   *   启用报错信息
   *   @param messages 报错信息数据对象
   */
  @action
  enableMessage = messages => axios.post('fnd/v1/sys/messages/enable', JSON.stringify(messages))

  /**
   *   禁用报错信息
   *   @param code 报错信息数据对象
   */
  @action
  disableMessage = code => axios.post('fnd/v1/sys/messages/disable', JSON.stringify(code))

  // 启用快码
  getIsEnabled = (code = 'FND_ENABLE_STATUS') => axios.get(`fnd/v1/lookup/value/dto?lookup_type_code=${code}`).then((data) => {
    this.setEnabled(data);
  });
}

const messageStore = new MessageStore();

export default messageStore;
