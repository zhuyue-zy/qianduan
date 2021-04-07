/**
 * Created by kanghua.pang on 2018/9/19.
 */

import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import querystring from 'query-string';
import LanguageStore from '../../language/languageStore';

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
    return axios.get(`/portal/v1/${iamOrganizationId}/site/announcement/?${querystring.stringify(queryObj)}`);
  }

  /* 删除公告 */
  deleteAnnouncement = (iamOrganizationId, announcementId, status, isDeleted, objectVersionNumber) => axios.delete(`/portal/v1/${iamOrganizationId}/site/announcement`, { data: JSON.stringify({ announcementId, status, isDeleted, objectVersionNumber }) });

  /* 失效公告 */
  ableConfiguration = (iamOrganizationId, announcementId, status, isEnabled, objectVersionNumber) => axios.delete(`/portal/v1/${iamOrganizationId}/site/announcement`, { data: JSON.stringify({ announcementId, status, isEnabled, objectVersionNumber }) });

  /* 新增公告 */
  createAnnouncement = (iamOrganizationId, data) => axios.post(`/portal/v1/${iamOrganizationId}/site/announcement`, JSON.stringify(data));

  /* 更新公告 */
  updateAnnouncement = (iamOrganizationId, data) => axios.put(`/portal/v1/${iamOrganizationId}/site/announcement`, JSON.stringify(data));

  /* 查询公告具体信息 */
  getAnnouncementById = (iamOrganizationId, announcementId) => axios.get(`/portal/v1/${iamOrganizationId}/site/announcement/detail/${announcementId}`);

  /* 发布公告 */
  announcementPublish = (iamOrganizationId, data) => axios.put(`/portal/v1/${iamOrganizationId}/site/announcement/publishment`, JSON.stringify(data));

  /* 模糊查询租户列表 */
  loadTenants = str => axios.get(`iam/v1/organizations/fuzzy?param=${str}`);

  /* 加载文件 */
  loadFile = (iamOrganizationId, fileId) => axios.get(`fileService/v1/${iamOrganizationId}/file/view/${fileId}`);

  /* 删除文件 */
  deleteFile = (iamOrganizationId, fileId) => axios.delete(`fileService/v1/${iamOrganizationId}/file/${fileId}`);

  /* 编辑框上传图 */
  submitFile = (iamOrganizationId, formData, config) => axios.post(`fileService/v1/${iamOrganizationId}/file/picture`, formData, config);

  /* 下载文件 */
  downloadFile = (iamOrganizationId, fileId) => axios.get(`/fileService/v1/${iamOrganizationId}/file/${fileId}`);
  // 修改时间
  updateAnnTime = (iamOrganizationId, data) => axios.put(`/portal/v1/${iamOrganizationId}/announcement/date`, JSON.stringify(data));

  loadOrgMsg=()=>{

    return axios.get(`/iam/v1/organizations/enable/all`);

  }
}

const announcementStore = new AnnouncementStore();

export default announcementStore;
