import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';
import { message } from 'yqcloud-ui';

@store('SystemStore')
class SystemStore extends LanguageStore {
  constructor() {
    super('system');
  }

  @observable isLoading = true;

  @observable language;

  @observable organization;


  @observable enabled = [];

  @observable systems;


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
  setSystems(data) {
    this.systems = data;
  }

  @computed
  get getSystems() {
    return this.systems;
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



  // 加载系统列表
  loadSystems = (organizationId, page, sortParam, {
    systemName, systemDescription,
  }, param) => {
    this.setIsLoading(true);

    let systemNameStr = typeof(systemName) == "undefined" ? "" : systemName;
    let systemDescriptionStr = typeof(systemDescription) == "undefined" ? "" : systemDescription;

    return axios.get(`/itsm/v1/${organizationId}/application/system?page=${page.current - 1}&size=${page.pageSize}&systemName=${systemNameStr}&systemDescription=${systemDescriptionStr}`)
    .then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };


}
const systemStore = new SystemStore();

export default systemStore;
