
import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';

@store('ProjectStore')
class ProjectStore {
  @observable isLoading = true;

  @observable projects = [];

  @observable projectsList = [];

  @observable projectNameList = [];

  @observable totalSize;

  @observable totalPage;

  @observable orgType;

  // 菜单类型
  constructor(totalPage = 1, totalSize = 0) {
    this.totalPage = totalPage;
    this.totalSize = totalSize;
  }

  @action
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  @action
  setProjects(data) {
    this.projects = data;
  }

  @computed
  get getProjects() {
    return this.projects;
  }

  @action
  setProjectsList(data) {
    this.projectsList = data;
  }

  @computed
  get getProjectsList() {
    return this.projectsList;
  }

  @action
  setProjectNameList(data) {
    this.ProjectNameList = data;
  }

  @computed
  get getProjectNameList() {
    return this.ProjectNameList;
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

  /**
   * 加载公司列表信息
   * @param param
   * @returns
   */
  loadProjects = (iamOrganizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filterStr = '';
    for (const i in filters) {
      filterStr += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `/project/v1/${iamOrganizationId}/pm/info?page=${page.current - 1}&size=${page.pageSize}`,
      JSON.stringify({
        param,
      }),
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 获取公司信息
  getProjectInfoById = (iamOrganizationId = 1, projectId) => {
    console.log('123', projectId);
    return axios.get(`/project/v1/${iamOrganizationId}/pm/project/${projectId}`);
  }

  // 新建项目
  createProject = (iamOrganizationId = 1, project) => {
    console.log('123', project);
    return axios.post(`/project/v1/${iamOrganizationId}/pm/project`, JSON.stringify(project));
  }

  // 更新
  updateProjectM = (iamOrganizationId = 1, project) => axios.put(`/project/v1/${iamOrganizationId}/pm/project`, JSON.stringify(project));

  // 删除
  deleteProject=(iamOrganizationId = 1, param) => axios.post(`/project/v1/${iamOrganizationId}/pm/batch_delete`, JSON.stringify(param));


  //  删除项目人员
  deleteProjectPerson=(iamOrganizationId = 1, param) => axios.post(`/project/v1/${iamOrganizationId}/project/person/delete`, JSON.stringify(param));
}

const projectStore = new ProjectStore();

export default projectStore;
