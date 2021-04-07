import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';


@store('CreateSystemStore')
class CreateSystemStore extends LanguageStore{
  constructor() {
    super('system');
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


  createSystem = (system, orgId) => (
    axios.post(`/itsm/v1/${orgId}/application/system`, JSON.stringify(system))  
  );

  getSystemInfoById = (orgId, systemId) => (
    axios.get(`/itsm/v1/${orgId}/application/system/${systemId}`)
  
  );

  updateSystem = (orgId, id, system) => (
    axios.put(`/itsm/v1/${orgId}/application/system`, JSON.stringify(system))  
  );

}



const createSystemStore = new CreateSystemStore();

export default createSystemStore;
