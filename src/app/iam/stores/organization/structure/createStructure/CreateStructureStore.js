import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';


@store('CreateStructureStore')
class CreateStructureStore extends LanguageStore{
  constructor() {
    super('structure');
  }
  @observable language;


  @action
  setLanguage(lang) {
    this.language = lang;
  }

  @computed
  get getLanguage() {
    return this.language;
  }


  createStructure = (structure, orgId) => (
    axios.post(`/itsm/v1/${orgId}/application/system/structure`, JSON.stringify(structure))  
  );

  getStructureInfoById = (orgId, structureId) => (
    axios.get(`/itsm/v1/${orgId}/application/system/structure/${structureId}`)
  
  );

  updateStructure = (orgId, id, structure) => (
    axios.put(`/itsm/v1/${orgId}/application/system/structure`, JSON.stringify(structure))  
  );

}



const createStructureStore = new CreateStructureStore();

export default createStructureStore;
