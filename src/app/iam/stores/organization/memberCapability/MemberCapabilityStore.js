/** 2019/3/20
*作者:高梦龙
*项目： 成员能力标签路由
*/

import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('MemberCapabilityStore')
class MemberCapabilityStore extends LanguageStore {
  @observable totalSize;

  @observable totalPage;

  @observable isLoading = true;


  constructor(totalPage = 1, totalSize = 0) {
    super('MemberCapability')
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

  // 查询成员能力标签
  queryMemberCapability=(iamOrganizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      if (i === 'mobil') {
        filter += filters[i][0] ? `&${i}e=${filters[i][0]}` : '';
      } else {
        filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
      }
    }
    return axios.get(`fnd/v1/${iamOrganizationId}/organizations/label/employee/page?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&${filter}`).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  }


  // 查询能力标签
  queryTagCapability=(iamOrganizationId, page, sortParam, filters, param) => {
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

  // 添加能力标签
  addCapabilityLabels=(iamOrganizationId, employeeLabelMap) => axios.post(`fnd/v1/${iamOrganizationId}/organizations/label/add`, JSON.stringify(employeeLabelMap))

  // 删除能力标签
  deleteCapabilityLabels=(iamOrganizationId, employeeId, labelIds) => axios.delete(`fnd/v1/${iamOrganizationId}/organizations/label/employee/label/delete?employeeId=${employeeId}`, { data: JSON.stringify(labelIds) })
}


const memberCapabilityStore = new MemberCapabilityStore();
export default memberCapabilityStore;
