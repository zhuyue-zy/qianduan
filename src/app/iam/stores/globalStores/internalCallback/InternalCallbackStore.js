import { action, computed, observable, toJS } from 'mobx';
import { Observable } from 'rxjs';
import { axios, store } from 'yqcloud-front-boot';
import querystring from 'query-string';
import LanguageStore from '../../language/languageStore';
import _ from 'lodash';

@store('InternalCallbackStore')
class InternalCallbackStore extends LanguageStore {
  constructor() {
    super('interCallback');
  }
  @observable isLoading = false;


  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  @action
  setIsLoading(data) {
    this.isLoading = data;
  }

  /**
   * 加载内部回调接口信息
   * @param organizationId
   * @param page
   * @param sortParam
   * @param employeeName
   * @param employeeCode
   * @param param
   * @returns {PromiseLike<T | never> | Promise<T | never>}
   */
  loadInternalCallbackList = (iamOrganizationId, page, sortParam,
  { permissionCode, apiCode, displayName, description, isPublic, enabled }, params, data) => {
    const queryObj = {
      page: page.current - 1,
      size: page.pageSize,
      sort: sortParam,

      permissionCode: permissionCode && permissionCode[0],
      apiCode: apiCode && apiCode[0],
      displayName: displayName && displayName[0],
      description: description && description[0],
      isPublic: isPublic && isPublic[0],
      enabled: enabled && enabled[0],
      params,
    };
    this.setIsLoading(true);
    return axios.get(`/iam/v1/internal/api?${querystring.stringify(queryObj)}`);
  }

  /* 查询权限编码 */
  getPermissionCode = (value) => axios.get(`/iam/v1/permission/query/list?code=${value}`);

  /* 查找所有有效租户 */
  getEnableOrg = () => axios.get('iam/v1/organizations/enable/all');

  /* 启用失效api接口 */
  disableApi = (status, record) => axios.post(`/iam/v1/sys/messages/${status}`, record);

  /* 编辑后保存 */
  editSave = (internalApiDTO) => axios.put('/iam/v1/internal/api/edit', internalApiDTO);

  /* 创建后提交 */
  createSave = (internalApiDTO) => axios.post('/iam/v1/internal/api', internalApiDTO);
}

const internalCallbackStore = new InternalCallbackStore();

export default internalCallbackStore;
