import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';
import { message } from 'yqcloud-ui';

@store('CatalogueStore')
class CatalogueStore extends LanguageStore{
  constructor() {
    super('catalogue');
  }
@observable projectList = [];
@observable catalogueList = [];
@observable defaultCatalogueList = [];
@action
setProjectList(projectList) {
    this.projectList = projectList;
  }
@computed
  get getProjectList() {
    return this.projectList;
  }
@action
setCatalogueList(catalogueList) {
    this.catalogueList = catalogueList;
  }
@computed
  get getCatalogueList() {
    return this.catalogueList;
  }
  @action
setDefaultCatalogueList(defaultCatalogueList) {
    this.defaultCatalogueList = defaultCatalogueList;
  }
@computed
  get getDefaultCatalogueList() {
    return this.defaultCatalogueList;
  }
  updateCatalogue = (orgId, id, CustomerSystemAuthority) => (
    axios.post(`/itsm/v1/${orgId}/customer/authority/catalogue`, JSON.stringify(CustomerSystemAuthority))  
  );
queryProjectList = (iam_organization_id) => axios.get(`/project/v1/${iam_organization_id}/pm/list/all`).then((data) => {
    this.setProjectList(data);
  });

queryCatalogueList = (iam_organization_id,project_id) => axios.get(`/itsm/v1/${iam_organization_id}/organizations/catalogue/project/1625`).then((data) => {
    this.setCatalogueList(data);
  });

  queryDefaultCatalogueList = (iam_organization_id,customerId) => axios.get(`/itsm/v1/${iam_organization_id}/customer/authority/catalogue/1`).then((data) => {
    this.setDefaultCatalogueList(data);
  });
}
const catalogueStore = new CatalogueStore();

export default catalogueStore;