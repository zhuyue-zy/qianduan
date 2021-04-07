/**
 * create by Pang Kanghua on 2018/09/04
 */
import {
  observable, action, computed,
} from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('PositionStore')
class PositionStore extends LanguageStore {
  constructor() {
    super('positionManagement');
  }

  @observable isLoading = true;

  @observable positions = [];

  @observable positionTree = [];

  @observable positionList = [];

  @observable statusList = [];

  @observable organizationList = [];

  @action
  setStatusList(statusList) {
    this.statusList = statusList;
  }

  @computed
  get getStatusList() {
    return this.statusList;
  }


  @observable enabled =[];

  @action setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed get getIsLoading() {
    return this.isLoading;
  }

  @action setPositions(data) {
    this.positions = data;
  }

  @computed get getPositions() {
    return this.positions;
  }

  @action setPositionTree(data) {
    this.positionTree = data;
  }

  @computed get getPositionTree() {
    return this.positionTree;
  }

  @action setPositionList(data) {
    this.positionList = data;
  }

  @computed get getPositionList() {
    return this.positionList;
  }

  @action setOrganizationList(data) {
    this.organizationList = data;
  }

  @computed get getOrganizationList() {
    return this.organizationList;
  }

  @action
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  @computed
  get getEnabled() {
    return this.enabled;
  }

  loopPositionTree = (data, num) => data.map((item) => {
    const children = [];
    const result = {
      key: item.positionId,
      positionId: item.positionId,
      name: item.positionName,
      positionCode: item.positionCode,
      organizationName: item.organizationName,
      description: item.description,
    };
    if (item.employeeList && item.employeeList.length > 0) {
      item.employeeList.forEach((value) => {
        children.push({
          key: `${item.parentPositionId}-${item.positionId}-${value.employeeId}`,
          employeeId: value.employeeId,
          name: value.employeeName,
          description: item.description,
        });
      });
    }
    if (item.children && item.children.length > 0) {
      if (children.length > 0) {
        result.children = [...children, ...this.loopPositionTree(item.children, num + 1), ];
      } else {
        result.children = this.loopPositionTree(item.children, num + 1);
      }
    } else if (children.length > 0) {
      result.children = children;
    }
    return result;
  });

  // 加载岗位树
  loadPositionTree = (iamOrganizationId) => {
    this.setIsLoading(true);
    return axios.get(
      `/fnd/v1/${iamOrganizationId}/organizations/position/tree/list`,
    ).then((data) => {
      this.setPositionTree(this.loopPositionTree(data, 0));
      this.setIsLoading(false);
      return data;
    });
  };

  // 根据父级id获取下级组织信息
  loadClassifyByParent = (iamOrganizationId, parentId) => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/position/tree/children/${parentId}`);

  // 刚进来的时候获取头部组织信息
  loadPositionListHeader = iamOrganizationId => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/position/tree/header`);

  // 加载岗位列表
  loadPositions = (iamOrganizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filterStr = '';
    Object.keys(filters).forEach((i) => {
      filterStr += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    });
    return axios.get(
      `/fnd/v1/${iamOrganizationId}/organizations/position/page/list?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filterStr}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  }



  // 选择组织
  loadOrganizationList = iamOrganizationId => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/orgInfoList`).then((data) => {
    this.setOrganizationList(data);
  })

  // 选择父岗位节点
  loadPositionList = (iamOrganizationId, positionId) => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/position/list${positionId ? `?positionId=${positionId}` : ''}`).then((data) => {
    this.setPositionList(data);
  })

  // 新建岗位
  createPosition = (iamOrganizationId, data, isManagerPosition) => axios.put(`/fnd/v1/${iamOrganizationId}/organizations/position?isManagerPosition=${isManagerPosition}`, JSON.stringify(data))

  // 获取某个岗位信息
  getPositionInfoById = (iamOrganizationId, positionId) => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/position/info/${positionId}`)

  // 岗位名称校验
  checkPositionName = (iamOrganizationId, positionName) => (
    axios.post(`/fnd/v1/${iamOrganizationId}/organizations/position/verification`, JSON.stringify({
      positionName,
    }))
  );

  // 岗位编码校验
  checkPositionCode = (iamOrganizationId, positionCode) => (
    axios.post(`/fnd/v1/${iamOrganizationId}/organizations/position/verification`, JSON.stringify({
      positionCode,
    }))
  );

  // 删除岗位
  deletePosition = (iamOrganizationId, positionIdList) => axios.delete(`/fnd/v1/${iamOrganizationId}/organizations/position`, { data: JSON.stringify(positionIdList) })

  // 删除岗位下的员工
  deleteEmployeePosition = (iamOrganizationId, employeeId, positionIdList) => (
    axios.delete(`/fnd/v1/${iamOrganizationId}/organizations/employeePosition/no?employeeId=${employeeId}`, { data: JSON.stringify(positionIdList) })
  )

  // 更新岗位
  updatePosition = (iamOrganizationId, positionId, position) => (
    axios.post(`/fnd/v1/${iamOrganizationId}/organizations/position/${positionId}`, JSON.stringify(position))
  );

  // 查询员工类型
  queryStatusList=(iam_organization_id, code = 'FND_USER_USERTYPE') => axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setStatusList(data);
  })

  // 启用停用岗位
  EnablePosition = (iamOrganizationId, positionId) => axios.post(`/fnd/v1/${iamOrganizationId}/organizations/position/enabled/${positionId}`);

  UnenablePosition = (iamOrganizationId, positionId) => axios.post(`/fnd/v1/${iamOrganizationId}/organizations/position/disable/${positionId}`);

  // 选择是否主管岗位
  handleManagerPosition = (iamOrganizationId, positionId) => axios.get(`/fnd/v1/${iamOrganizationId}/organizations/pos_verification/${positionId}`);

  // 启用快码
  getIsEnabled = (organizationId, code = 'FND_ENABLE_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });
}

const positionStore = new PositionStore();
export default positionStore;
