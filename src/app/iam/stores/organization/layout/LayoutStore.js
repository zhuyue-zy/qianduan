/**
 * Created by kanghua.pang on 2018/9/19.
 */

import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';

@store('LayoutStore')
class LayoutStore {
  @observable isLoading = false;

  @observable layoutList = [];

  @observable applications = [];

  @observable modules = [];

  @action setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed get getIsLoading() {
    return this.isLoading;
  }

  @action setLayoutList(data) {
    this.layoutList = data;
  }

  @computed get getLayoutList() {
    return this.layoutList;
  }

  @action setApplications(data) {
    this.applications = data;
  }

  @computed get getApplications() {
    return this.applications;
  }

  @action setModules(data) {
    this.modules = data;
  }

  @computed get getModules() {
    return this.modules;
  }

  loopLayoutList = data => data.map((item) => {
    const result = {
      key: item.moduleId,
      ...item,
    };
    return result;
  });

  /* 加载布局数据列表 */
  loadLayoutList = iamOrganizationId => axios.get(`/portal/v1/${iamOrganizationId}/organization/module/configuration`);

  /* 修改展示模块排序 */
  displayOrder = (iamOrganizationId, orgPortalConfigurationId, displayOrder) => axios.post(`/portal/v1/${iamOrganizationId}/organization/module/configuration/${orgPortalConfigurationId}/displayOrder/${displayOrder}`);

  /* 删除应用模块 */
  deleteConfiguration = (iamOrganizationId, orgPortalConfigurationId, objectVersionNumber) => axios.delete(`/portal/v1/${iamOrganizationId}/organization/module/configuration`, { data: JSON.stringify({ orgPortalConfigurationId, objectVersionNumber }) });

  /* 新增应用模块 */
  createConfiguration = (iamOrganizationId, data) => axios.post(`/portal/v1/${iamOrganizationId}/organization/module/configuration`, JSON.stringify(data));

  /* 更新应用模块 */
  updateConfiguration = (iamOrganizationId, orgPortalConfigurationId, data) => axios.put(`/portal/v1/${iamOrganizationId}/organization/module/configuration/${orgPortalConfigurationId}`, JSON.stringify(data));

  /* 查询应用模块具体信息 */
  getConfigurationById = (iamOrganizationId, orgPortalConfigurationId) => axios.get(`/portal/v1/${iamOrganizationId}/organization/module/configuration/onePortal/${orgPortalConfigurationId}`);

  /* 模块列表 */
  loadModules = (iamOrganizationId, appId, portalId) => axios.get(`/portal/v1/${iamOrganizationId}/module/info/module/${appId}${portalId ? `?portalId=${portalId}` : ''}`).then((data) => {
    if (data) {
      this.setModules(data);
    }
  });

  /* 应用列表 */
  loadApplication = (iamOrganizationId, userId) => axios.get(`/portal/v1/${iamOrganizationId}/module/info/app/${userId}`).then((data) => {
    if (data) {
      this.setApplications(data);
    }
  })
}

const layoutStore = new LayoutStore();

export default layoutStore;
