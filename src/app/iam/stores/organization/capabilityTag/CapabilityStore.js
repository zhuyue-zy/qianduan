/** 2019/3/18
*作者:高梦龙
*项目： 能力标签
*/

import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('CapabilityStore')
class CapabilityStore extends LanguageStore {

  @observable languageInfo = {};

  @observable languageList = [];

  @observable languageEnv = [];

  @observable totalSize;

  @observable totalPage;

  @observable isLoading = true;

  @action
  setLanguageEnv(flag) {
    this.languageEnv = flag;
  }

  @computed
  get getLanguageEnv() {
    return this.languageEnv;
  }

  constructor(totalPage = 1, totalSize = 0) {
    super('capability');
    this.totalPage = totalPage;
    this.totalSize = totalSize;
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


  // 查询能力标签分类
  queryCapability = (iamOrganizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`fnd/v1/${iamOrganizationId}/organizations/label/category/page?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&${filter}`).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  }

  // 查询能力标签
  queryTagCapability = (iamOrganizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`fnd/v1/${iamOrganizationId}/organizations/label/page?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&${filter}`).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  }


  // 查询成员能力标签
  queryMemberCapability = (iamOrganizationId, page, sortParam, filters, param, id) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(`fnd/v1/${iamOrganizationId}/organizations/label/employee/page?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&${filter}&labelId=${id}`).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  }

  // 添加能力标签
  addCapabilityLabels = (iamOrganizationId, employeeLabelMap) => {
    return axios.post(`fnd/v1/${iamOrganizationId}/organizations/label/add`, JSON.stringify(employeeLabelMap))
  }

  // 校验分类名称重复
  checkCapability = (iamOrganizationId, capabilityName) => {
    return axios.get(`/fnd/v1/${iamOrganizationId}/organizations/label/category/check?categoryName=${capabilityName}`)
  }

  // 校验能力标签名称重复
  checkCapabilityTag = (iamOrganizationId, labelName) => {
    return axios.get(`/fnd/v1/${iamOrganizationId}/organizations/label/check?labelName=${labelName}`)
  }

  // 新建和修改能力分类标签
  createCapability = (iamOrganizationId, abilityLabelCategories) => axios.post(`fnd/v1/${iamOrganizationId}/organizations/label/category/save`, JSON.stringify(abilityLabelCategories))

  // 新建和修能力标签
  createCapabilityTag = (iamOrganizationId, abilityLabels) => axios.post(`fnd/v1/${iamOrganizationId}/organizations/label/save`, JSON.stringify(abilityLabels))


  // 删除能力标签分类
  deleteCapability = (iamOrganizationId, id) => axios.delete(`fnd/v1/${iamOrganizationId}/organizations/label/category/delete?id=${id}`)

  // 删除能力标签
  deleteCapabilityTag = (iamOrganizationId, id) => axios.delete(`fnd/v1/${iamOrganizationId}/organizations/label/delete?id=${id}`)

  // 删除成员能力标签
  deleteCapabilityLabels = (iamOrganizationId, employeeId, labelIds) => axios.delete(`fnd/v1/${iamOrganizationId}/organizations/label/employee/label/delete?employeeId=${employeeId}`, { data: JSON.stringify(labelIds) })


  // 查询多语言
  queryLanguageEnv = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setLanguageEnv(allLanguage);
      });
  };
}
const capabilityStore = new CapabilityStore();
export default capabilityStore;
