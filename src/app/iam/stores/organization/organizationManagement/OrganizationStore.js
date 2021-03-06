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

  // ??????????????????
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

  // ???????????????
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

  // ????????????id????????????????????????
  loadClassifyByParent = (iamOrganizationId, parentId) => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/organization/tree/children/${parentId}`);

  // ??????????????????????????????????????????
  loadOrganizationListHeader = iamOrganizationId => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/organization/tree/header`);

  // ??????????????????
  loadOrganizationList = iamOrganizationId => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/orgInfoList`).then((data) => {
    this.setOrganizationList(data);
  })

  // ????????????
  createOrganization = (iamOrganizationId, organization) => axios.post(`/fnd/v1/${iamOrganizationId}/organizations/organization`, JSON.stringify(organization))

  // ??????????????????
  getOrganizationInfoById = (iamOrganizationId, organizationId) => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/organization/${organizationId}`)

  // ????????????
  checkOrganizationName = (iamOrganizationId, organizationName) => axios.post(`/fnd/v1/${iamOrganizationId}/organizations/data/verification`, JSON.stringify({
    iamOrganizationId,
    organizationName
  }))

  // ????????????
  checkOrganizationCode = (iamOrganizationId, organizationCode) => axios.post(`/fnd/v1/${iamOrganizationId}/organizations/data/verification`, JSON.stringify({
    iamOrganizationId,
    organizationCode
  }))

  // ????????????
  deleteOrganization = (iamOrganizationId, organizationIds) => axios.delete(`/fnd/v1/${iamOrganizationId}/organizations/orgList`, {data: JSON.stringify(organizationIds)})

  // ????????????
  updateOrganization = (iamOrganizationId, organization) => (
    axios.put(`/fnd/v1/${iamOrganizationId}/organizations/organizationEdit`, JSON.stringify(organization))
  );

  // ??????????????????
  handleManagerPosition = (iamOrganizationId, organizationId, positionId, objectVersionNumber) => axios.post(`/fnd/v1/${iamOrganizationId}/organizations/${organizationId}/manager/${positionId}?objectVersionNumber=${objectVersionNumber}`)

  // ?????????????????????????????????
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

  // ????????????
  getIsEnabled = (organizationId, code = 'FND_ENABLE_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });


  //  ????????????????????????????????????
  checkPositionBinds = (iamOrganizationId, positionId) => axios.post(`fnd/v1/${iamOrganizationId}/organizations/position/check/manager/binding/${positionId}`)

  //  ?????????????????????
  setMainPositionsOut = (iamOrganizationId, organizationId, positionId, objectVersionNumber, status) => axios.put(`fnd/v1/${iamOrganizationId}/organizations/position/${organizationId}/manager/change/${positionId}?objectVersionNumber=${objectVersionNumber}&status=${status}`)

  //  ?????????????????????
  setMainPositionsIn = (iamOrganizationId, organizationId, positionId, objectVersionNumber, status, employeeId) => axios.put(`fnd/v1/${iamOrganizationId}/organizations/position/${organizationId}/manager/change/${positionId}?objectVersionNumber=${objectVersionNumber}&status=${status}&employeeId=${employeeId}`)

  // ????????????ID??????????????????????????????
  queryEmpByPositionIds = (iamOrganizationId, positionId) => axios.get(`fnd/v1/${iamOrganizationId}/organizations/employee/${positionId}/info`)

  //  ????????????
  cancleMainPositions = (iamOrganizationId, organizationId, positionId, objectVersionNumber) => axios.put(`fnd/v1/${iamOrganizationId}/organizations/position/${organizationId}/manager/cancel/${positionId}?objectVersionNumber=${objectVersionNumber}&status=${status}`)

  //  ????????????????????????
  queryOrganizationType = (iamOrganizationId, code = 'FND_ORG_TYPE') => axios.get(`fnd/v1/${iamOrganizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setOrganizationType(data);
  })
}


const organizeStore = new OrganizationStore();
export default organizeStore;
