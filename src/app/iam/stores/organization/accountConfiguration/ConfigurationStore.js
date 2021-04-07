import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from "../../language";

@store('ConfigurationStore')
class ConfigurationStore extends LanguageStore{
  @observable isLoading = true;

  @observable enabled =[];
  constructor() {
    super('configuration');
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

  // 加载邮件账户列表
  loadaccount = (iamOrganizationId = 1, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filterStr = '';
    for (const i in filters) {
      filterStr += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `/message/v1/${iamOrganizationId}/send/config/info?page=${page.current - 1}&size=${page.pageSize}${filterStr}`,
      JSON.stringify({
        param,
      }),
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 创建
  addaccount = (organizationId, configuration) => axios.post(`/message/v1/${organizationId}/send/config`, JSON.stringify(configuration));

  // 更新
  updateaccount = (organizationId, configuration) => axios.put(`/message/v1/${organizationId}/send/config`, JSON.stringify(configuration));

  // 根据ID查询
  loadconfig = (organizationId, id) => axios.get(`/message/v1/${organizationId}/send/${id}/config`);

  // 批量删除账户
  deleteaccount = (organizationId, accountList) => axios.post(`/message/v1/${organizationId}/send/account/batch_delete`, JSON.stringify(accountList));

  // 失效
  disableaccount = (organizationId, accountList) => axios.post(`/message/v1/${organizationId}/send/config/disable`, JSON.stringify(accountList));

  // 启用
  enableaccount = (organizationId, accountList) => axios.post(`/message/v1/${organizationId}/send/config/enable`, JSON.stringify(accountList));

  // 删除单条
  deletesingle = (organizationId, accountList) => axios.delete(`/message/v1/${organizationId}/send/config`, { data: JSON.stringify(accountList) });

  // 启用快码
  getIsEnabled = (organizationId, code = 'FND_ENABLE_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });
}

const configurationStore = new ConfigurationStore();

export default configurationStore;
