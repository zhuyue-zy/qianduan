import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';
import { message } from 'yqcloud-ui';

@store('StructureStore')
class StructureStore extends LanguageStore {
  constructor() {
    super('structure');
  }

  @observable isLoading = true;

  @observable language;

  @observable organization;


  @observable enabled = [];

  @observable structures;


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
  setStructures(data) {
    this.structures = data;
  }

  @computed
  get getStructures() {
    return this.structures;
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

  //EnableStructure = (orgId, structureId, data) => axios.put(`/iam/v1/organizations/${orgId}/users/${structureId}/enable`);

 //UnenableStructure = (orgId, structureId, data) => axios.put(`/iam/v1/organizations/${orgId}/users/${structureId}/disable`); 

  // 加载系统分类列表
  loadStructures = (organizationId, page, sortParam, {
    structureName, structureDescription,enabled
  }, param) => {
    this.setIsLoading(true);

    let structureNameStr = typeof(structureName) == "undefined" ? "" : structureName;
    let structureDescriptionStr = typeof(structureDescription) == "undefined" ? "" : structureDescription;

    return axios.get(`/itsm/v1/${organizationId}/application/system/structure?page=${page.current - 1}&size=${page.pageSize}&structureName=${structureNameStr}&structureDescription=${structureDescriptionStr}`)
    .then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };
  // 启用快码
  getIsEnabled = (organizationId, code = 'FND_VALID_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });

}
const structureStore = new StructureStore();

export default structureStore;
