import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';
import { message } from 'yqcloud-ui';

@store('MailConfigurationStore')
class MailConfigurationStore extends LanguageStore {
  constructor() {
    super('AccountConfiguration');
  }

  @observable isLoading = true;

  @observable enabled = [];

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
  loadaccount = (page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filterStr = '';
    for (const i in filters) {
      filterStr += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `/message/v1/send/config/info/site?page=${page.current - 1}&size=${page.pageSize}${filterStr}`,
      JSON.stringify({
        param,
      }),
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 创建
  addaccount = configuration => axios.post('/message/v1/send/config/site', JSON.stringify(configuration));

  // 更新
  updateaccount = config => axios.put('/message/v1/send/config/site', JSON.stringify(config));

  // 根据ID查询
  loadconfig = id => axios.get(`/message/v1/send/${id}/config/site`);

  // 批量删除账户
  deleteaccount = accountList => axios.post('/message/v1/send/config/batch_delete/site', JSON.stringify(accountList));


  // 测试邮件
  sendEmail = (configId, subject, receiver) => axios.post(`/message/v1/send/config/send?configId=${configId}&subject=${subject}&receiver=${receiver}`)

  // 启用快码
  getIsEnabled = (organizationId = 0, code = 'FND_ENABLE_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });

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

const mailConfigurationStore = new MailConfigurationStore();

export default mailConfigurationStore;
