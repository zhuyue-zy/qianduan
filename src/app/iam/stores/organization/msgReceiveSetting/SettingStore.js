
import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('SettingStore')
class SettingStore extends LanguageStore {
  constructor() {
    super('messageNotification');
  }

  @observable isLoading = true;

  @observable empList =[];

  @observable messages = [];

  @observable messagesList = [];

  @observable MessageNameList = [];

  @observable totalSize;

  @observable totalPage;

  @observable orgType;// 菜单类型
  /*  constructor(totalPage = 1, totalSize = 0) {
    this.totalPage = totalPage;
    this.totalSize = totalSize;
  } */

  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  @action
  setMessages(data) {
    this.messages = data;
  }

  @computed
  get getMessages() {
    return this.messages;
  }

  @action
  setEmpList(empList) {
    this.empList = empList;
  }

  @computed
  get getEmpList() {
    return this.empList;
  }

  @action
  setMessagesList(data) {
    this.messagesList = data;
  }

  @computed
  get getMessagesList() {
    return this.messagesList;
  }

  @action
  setMessageNameList(data) {
    this.MessageNameList = data;
  }

  @computed
  get getMessageNameList() {
    return this.MessageNameList;
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

  // 获取全部样式设置
  loadSettings= (iamOrganizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filterStr = '';
    for (const i in filters) {
      filterStr += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `/message/v1/${iamOrganizationId}/msg/setting/list`,
      JSON.stringify({
        param,
      }),
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 事物名称块码
  queryShiWu=(iam_organization_id, code = 'FND_MSG_TRANSNAME') => axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEmpList(data);
  })

  // 保存提交
  settingSubmits = (iamOrganizationId, data) => axios.post(`/message/v1/${iamOrganizationId}/msg/setting/save`, JSON.stringify(data))
}

const settingStore = new SettingStore();

export default settingStore;
