import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('CallCenterStore')
class CallCenterStore extends LanguageStore{
  constructor() {
    super('callCenter');
  }

  @observable isLoading = true;

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
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  @computed
  get getEnabled() {
    return this.enabled;
  }


  // 分页
  queryCallCenterPage = (iamOrganizationId, page, sortParam, filters) => {
    this.setIsLoading(true);
    let filter = '';
    if (filters) {
      filter = filters || '';
    }
    if (filter) {
      return axios.get(`im-manage/v1/im/call/config/page?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&query=${filter}`).then((data) => {
        this.setIsLoading(false);
        return data;
      });
    } else {
      return axios.get(`im-manage/v1/im/call/config/page?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}`).then((data) => {
        this.setIsLoading(false);
        return data;
      });
    }
  }

  // 提交
  handleCreate=(imCallConfig) => axios.post(`im-manage/v1/im/call/config/insert`, JSON.stringify(imCallConfig));


  handleEdit=(imCallConfig) => axios.post(`im-manage/v1/im/call/config/update`, JSON.stringify(imCallConfig))


  // 查询详情接口
  queryDetail=(id) => {
    return axios.get(`im-manage/v1/im/call/config/select/${id}`)
  }

  // 查询租户

  queryCodeode=(code) => {
    if (code) {
      return axios.get(`iam/v1/organizations/no/config?query=${code}`).then((data) => {
        return data;
      })
    } else {
      return axios.get(`iam/v1/organizations/no/config`).then((data) => {
        return data;
      })
    }
  }


  // 生效快码
  getIsEnabled = (code = 'FND_ENABLE_STATUS') => axios.get(`fnd/v1/lookup/value/dto?lookup_type_code=${code}`).then((data) => {
    this.setEnabled(data);
  });

}

const callCenterStore = new CallCenterStore();

export default callCenterStore;
