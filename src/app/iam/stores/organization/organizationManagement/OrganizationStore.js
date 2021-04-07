/**
 * create by Pang Kanghua on 2018/09/04
 */
import {
  observable, action, computed,
} from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('OrganizationStore')
class OrganizationStore extends LanguageStore {
  constructor() {
    super('organizationManagement');
  }

  @observable isLoading = true;

  @observable organizations = [];

  @observable organizationTree = [];

  @observable organizationList = [];

  @observable organizationType = [];

  @observable positionList = [];

  @observable enabled = [];


  @action setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed get getIsLoading() {
    return this.isLoading;
  }

  @action setOrganizations(data) {
    this.organizations = data;
  }

  @computed get getOrganizationTree() {
    return this.organizationTree;
  }

  @action setOrganizationTree(data) {
    this.organizationTree = data;
  }

  @computed get getOrganizations() {
    return this.organizations;
  }

  @action setOrganizationList(data) {
    this.organizationList = data;
  }

  @computed get getOrganizationList() {
    return this.organizationList;
  }

  @action setPositionList(data) {
    this.positionList = data;
  }

  @computed get getPositionList() {
    return this.positionList;
  }

  @action
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  @computed
  get getEnabled() {
    return this.enabled;
  }

  @action setOrganizationType(data) {
    this.organizationType = data;
  }

  @computed get getOrganizationType() {
    return this.organizationType;
  }

  loopOrganizationTree = (data, num) => data.map((item) => {
    const children = [];
    const result = {
      key: item.organizationId,
      positionId: item.organizationId,
      name: item.organizationName,
      organizationCode: item.organizationCode,
      positionName: item.positionName,
      description: item.description,
    };
    // if (item.employeeList && item.employeeList.length > 0) {
    //   item.employeeList.forEach((value) => {
    //     children.push({
    //       key: `${item.parentPositionId}-${item.positionId}-${value.employeeId}`,
    //       employeeId: value.employeeId,
    //       name: value.employeeName,
    //     });
    //   });
    // }
    if (item.children && item.children.length > 0) {
      if (children.length > 0) {
        result.children = [...this.loopOrganizationTree(item.children, num + 1), ...children];
      } else {
        result.children = this.loopOrganizationTree(item.children, num + 1);
      }
    } else if (children.length > 0) {
      result.children = children;
    }
    return result;
  });

  // 加载组织列表
  loadOrganizations = (iamOrganizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filterStr = '';
    for (const i in filters) {
      filterStr += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `/fnd/v1/${iamOrganizationId}/organizations/organization/pagination?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filterStr}`,
      JSON.stringify({
        // code: code && code[0],
        // name: name && name[0],
        // type: type && type[0],
        // isEnabled: isEnabled && isEnabled[0],
        param,
      }),
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 加载组织树
  loadOrganizationTree = (iamOrganizationId) => {
    this.setIsLoading(true);
    return axios.get(
      `/fnd/v1/${iamOrganizationId}/organizations/organization/tree`,
    ).then((data) => {
      this.setOrganizationTree(this.loopOrganizationTree(data, 0));
      this.setIsLoading(false);
      return data;
    });
  };

  // 根据父级id获取下级组织信息
  loadClassifyByParent = (iamOrganizationId, parentId) => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/organization/tree/children/${parentId}`);

  // 刚进来的时候获取头部组织信息
  loadOrganizationListHeader = iamOrganizationId => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/organization/tree/header`);

  // 组织选择列表
  loadOrganizationList = iamOrganizationId => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/orgInfoList`).then((data) => {
    this.setOrganizationList(data);
  })

  // 创建组织
  createOrganization = (iamOrganizationId, organization) => axios.post(`/fnd/v1/${iamOrganizationId}/organizations/organization`, JSON.stringify(organization))

  // 获取组织信息
  getOrganizationInfoById = (iamOrganizationId, organizationId) => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/organization/${organizationId}`)

  // 名字校验
  checkOrganizationName = (iamOrganizationId, organizationName) => axios.post(`/fnd/v1/${iamOrganizationId}/organizations/data/verification`, JSON.stringify({
    iamOrganizationId,
    organizationName
  }))

  // 编码校验
  checkOrganizationCode = (iamOrganizationId, organizationCode) => axios.post(`/fnd/v1/${iamOrganizationId}/organizations/data/verification`, JSON.stringify({
    iamOrganizationId,
    organizationCode
  }))

  // 删除组织
  deleteOrganization = (iamOrganizationId, organizationIds) => axios.delete(`/fnd/v1/${iamOrganizationId}/organizations/orgList`, {data: JSON.stringify(organizationIds)})

  // 更新组织
  updateOrganization = (iamOrganizationId, organization) => (
    axios.put(`/fnd/v1/${iamOrganizationId}/organizations/organizationEdit`, JSON.stringify(organization))
  );

  // 设置主管岗位
  handleManagerPosition = (iamOrganizationId, organizationId, positionId, objectVersionNumber) => axios.post(`/fnd/v1/${iamOrganizationId}/organizations/${organizationId}/manager/${positionId}?objectVersionNumber=${objectVersionNumber}`)

  // 获取该组织对应岗位列表
  getPosInfo = (iamOrganizationId, organizationId) => {
    this.setIsLoading(true);
    axios.get(`/fnd/v1/${iamOrganizationId}/organizations/${organizationId}/posInfoList`).then((data) => {
      if (data) {
        this.setPositionList(data);
      }
      this.setIsLoading(false);
    });
  }

  EnableOrganization = (iamOrganizationId, organizationId, objectVersionNumber) => axios.put(`/fnd/v1/${iamOrganizationId}/organizations/${organizationId}/enable?objectVersionNumber=${objectVersionNumber}`);

  UnenableOrganization = (iamOrganizationId, organizationId, objectVersionNumber) => axios.put(`/fnd/v1/${iamOrganizationId}/organizations/${organizationId}/disable?objectVersionNumber=${objectVersionNumber}`);

  // 启用快码
  getIsEnabled = (organizationId, code = 'FND_ENABLE_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });


  //  校验岗位是否绑定了多员工
  checkPositionBinds = (iamOrganizationId, positionId) => axios.post(`fnd/v1/${iamOrganizationId}/organizations/position/check/manager/binding/${positionId}`)

  //  外面新设为主岗
  setMainPositionsOut = (iamOrganizationId, organizationId, positionId, objectVersionNumber, status) => axios.put(`fnd/v1/${iamOrganizationId}/organizations/position/${organizationId}/manager/change/${positionId}?objectVersionNumber=${objectVersionNumber}&status=${status}`)

  //  里面新设为主岗
  setMainPositionsIn = (iamOrganizationId, organizationId, positionId, objectVersionNumber, status, employeeId) => axios.put(`fnd/v1/${iamOrganizationId}/organizations/position/${organizationId}/manager/change/${positionId}?objectVersionNumber=${objectVersionNumber}&status=${status}&employeeId=${employeeId}`)

  // 根据岗位ID查询岗位下的员工信息
  queryEmpByPositionIds = (iamOrganizationId, positionId) => axios.get(`fnd/v1/${iamOrganizationId}/organizations/employee/${positionId}/info`)

  //  取消主岗
  cancleMainPositions = (iamOrganizationId, organizationId, positionId, objectVersionNumber) => axios.put(`fnd/v1/${iamOrganizationId}/organizations/position/${organizationId}/manager/cancel/${positionId}?objectVersionNumber=${objectVersionNumber}&status=${status}`)

  //  获取组织类别快码
  queryOrganizationType = (iamOrganizationId, code = 'FND_ORG_TYPE') => axios.get(`fnd/v1/${iamOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setOrganizationType(data);
  })
}


const organizeStore = new OrganizationStore();
export default organizeStore;
