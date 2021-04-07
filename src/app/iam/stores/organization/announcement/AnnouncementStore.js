/**
 * Created by kanghua.pang on 2018/9/19.
 */

import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import querystring from 'query-string';
import LanguageStore from '../../language/languageStore';
import { message } from 'yqcloud-ui';

@store('AnnouncementStore')
class AnnouncementStore extends LanguageStore{

  constructor() {
    super('OrgAnnouncement');
  }

  @observable isLoading = false;

  @observable searchLoading = false;

  @observable announcements = [];

  @observable modules = [];

  @action setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed get getIsLoading() {
    return this.isLoading;
  }

  @action setSearchLoading(flag) {
    this.searchLoading = flag;
  }

  @computed get getSearchLoading() {
    return this.searchLoading;
  }

  @action setAnnouncements(data) {
    this.announcements = data;
  }

  @computed get getAnnouncements() {
    return this.announcements.slice();
  }

  @action setModules(data) {
    this.modules = data;
  }

  @computed get getModules() {
    return this.modules;
  }

  loadAnnouncements(iamOrganizationId, { current, pageSize }, { columnKey = 'announcementId', order = 'descend' }, { createByName, receiver, startTime, status, title }, params) {
    const queryObj = {
      page: current - 1,
      size: pageSize,
      createByName: createByName && createByName[0],
      receiver: receiver && receiver[0],
      startTime: startTime && startTime[0],
      status: status && status[0],
      title: title && title[0],
      params,
    };
    this.setIsLoading(true);
    if (columnKey) {
      const sorter = [];
      sorter.push(columnKey);
      if (order === 'descend') {
        sorter.push('desc');
      }
      queryObj.sort = sorter.join(',');
    }
    return axios.get(`/portal/v1/${iamOrganizationId}/announcement?${querystring.stringify(queryObj)}`);
  }


  /* 加载公告数据列表 */
  loadLayoutList = (iamOrganizationId) => {
    this.setIsLoading(true);
    return axios.get(`/portal/v1/${iamOrganizationId}/organization/module/configuration`);
  };

  /* 修改展示模块排序 */
  displayOrder = (iamOrganizationId, orgPortalConfigurationId, displayOrder) => axios.post(`/portal/v1/${iamOrganizationId}/organization/module/configuration/${orgPortalConfigurationId}/displayOrder/${displayOrder}`);

  /* 删除公告 */
  deleteAnnouncement = (iamOrganizationId, announcementId, status, isDeleted, objectVersionNumber) => axios.delete(`/portal/v1/${iamOrganizationId}/announcement`, { data: JSON.stringify({ announcementId, status, isDeleted, objectVersionNumber }) });

  /* 失效公告 */
  ableConfiguration = (iamOrganizationId, announcementId, status, isEnabled, objectVersionNumber) => axios.delete(`/portal/v1/${iamOrganizationId}/announcement`, { data: JSON.stringify({ announcementId, status, isEnabled, objectVersionNumber }) });

  /* 新增公告 */
  createAnnouncement = (iamOrganizationId, data) => axios.post(`/portal/v1/${iamOrganizationId}/announcement`, JSON.stringify(data));

  /* 更新公告 */
  updateAnnouncement = (iamOrganizationId, data) => axios.put(`/portal/v1/${iamOrganizationId}/announcement`, JSON.stringify(data));

  /* 查询公告具体信息 */
  getAnnouncementById = (iamOrganizationId, announcementId) => axios.get(`/portal/v1/${iamOrganizationId}/announcement/detail/${announcementId}`);

  /* 发布公告 */
  announcementPublish = (iamOrganizationId, data) => axios.put(`/portal/v1/${iamOrganizationId}/announcement/publishment`, JSON.stringify(data));

  /* 模糊查询员工列表 */
  loadEmployees = (iamOrganizationId, str) => axios.get(`fnd/v1/${iamOrganizationId}/organizations/employee/user/all?condition=${str ? `${str}` : ''}`);

  /* 模糊查询公司组织列表 */
  loadOrganizations = (iamOrganizationId, str) => axios.get(`fnd/v1/${iamOrganizationId}/organizations/organization?organizationName=${str ? `${str}` : ''}`);

  /* 加载文件 */
  loadFile = (iamOrganizationId, fileId) => axios.get(`fileService/v1/${iamOrganizationId}/file/view/${fileId}`);

  /* 删除文件 */
  deleteFile = (iamOrganizationId, fileId) => axios.delete(`fileService/v1/${iamOrganizationId}/file/${fileId}`);

  /* 编辑框上传图 */
  submitFile = (iamOrganizationId, formData, config) => axios.post(`fileService/v1/${iamOrganizationId}/file/picture`, formData, config);

  /* 下载文件 */
  downloadFile = (iamOrganizationId, fileId) => axios.get(`/fileService/v1/${iamOrganizationId}/file/${fileId}`);

  //  加载成员
  loadAllEmpList(organizationId) {
    return axios.get(`/fnd/v1/${organizationId}/organizations/employee/enable/list`);
  }

  //  加载成员分页
  loadEmpMsg=(organizationId) => axios.get(`/fnd/v1/${organizationId}/organizations/employee/info/able`);


  //  加载部门
  loadDptMsg(organizationId) {
    return axios.get(`/fnd/v1/${organizationId}/organizations/all`);
  }

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

  // 修改时间
  updateAnnTime = (iamOrganizationId, data) => axios.put(`/portal/v1/${iamOrganizationId}/announcement/date`, JSON.stringify(data));
}

const announcementStore = new AnnouncementStore();

export default announcementStore;
