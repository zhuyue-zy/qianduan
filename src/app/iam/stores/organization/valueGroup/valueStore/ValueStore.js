/** 2018/9/18
 *作者:高梦龙
 *
 */

import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';
import { message } from 'yqcloud-ui';


@store('ValueStore')
class ValueStore extends LanguageStore {

  @observable valueGroups = [];

  @observable values;

  // 通过代码名获取一条信息
  @observable totalSize;

  @observable totalPage;

  @observable languageEnv = [];

  /* eslint-disable */
  @observable  orgType;//菜单类型

  @observable enabled =[];

  constructor(totalPage = 1, totalSize = 0) {
    super('valueGroup');
    this.totalPage = totalPage;
    this.totalSize = totalSize;
  }

  @action
  setValues(data) {
    this.values = data;
  }

  @computed
  get getValues() {
    return this.values;
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
  setValueGroups(data) {
    this.valueGroups = data;
  }

  @computed
  get getValueGroups() {
    return this.valueGroups;
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
  organizationType(org){
    this.orgType=org
  }

  @action
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  @computed
  get getEnabled() {
    return this.enabled;
  }

  @action
  setLanguageEnv(flag) {
    this.languageEnv = flag;
  }

  @computed
  get getLanguageEnv() {
    return this.languageEnv;
  }


  /**
   * 加载值集列表信息
   * @param organizationId
   * @param page
   * @param sortParam
   * @param flexValueSetName
   * @param description
   * @param param
   * @returns {PromiseLike<T | never> | Promise<T | never>}
   */
  /* eslint-disable */
  loadValues = (iam_organization_id, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    if (this.orgType=='organization'){
      return axios.get(
        `/fnd/v1/${iam_organization_id}/flex_value_set/pagination?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&${filter}`,
      ).then((data) => {
        this.setIsLoading(false);
        return data;
      });
    } else {
      return axios.get(
        `/fnd/v1/flex_value_set/pagination?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&${filter}`,
      ).then((data) => {
        this.setIsLoading(false);
        return data;
      });
    }

  };

  // 通过id获取详情信息
  getValueInfoById = (iam_organization_id, flexValueSetId) => {

    if (this.orgType =='organization') {
      return axios.get(`/fnd/v1/${iam_organization_id}/flex_value_set/flex_value_set_id?flexValueSetId=${flexValueSetId}`);
    }else{
      return axios.get(`/fnd/v1/flex_value_set/flex_value_set_id?flexValueSetId=${flexValueSetId}`);

    }
    }
  // 新建
  createValue = (iam_organization_id, flexValueSets) => {
    if (this.orgType =='organization'){
      return axios.post(`/fnd/v1/${iam_organization_id}/flex_value_set/create`,
        JSON.stringify({ ...flexValueSets, isSite: 'N' }));
    }else{
      return axios.post(`/fnd/v1/flex_value_set/create`, JSON.stringify({ ...flexValueSets, isSite: 'Y' }));
    }
  }

  // 修改
  updateValue = (iam_organization_id, flexValueSets) => {
    if(this.orgType =='organization'){
    return axios.put(`/fnd/v1/${iam_organization_id}/flex_value_set`, JSON.stringify({ ...flexValueSets }))
    }else{
      return axios.put(`/fnd/v1/flex_value_set`, JSON.stringify({ ...flexValueSets }))
    }
  }
  /**
   * 删除值集主表和子表信息
   * @param orgId
   * @param deleteValueAll 获取整条数据，不是只获取id
   * @returns {*}
   */
  deleteVlaue = (iam_organization_id, deleteValueAll) =>{
   if (this.orgType=='organization') {
    return axios.delete(`/fnd/v1/${iam_organization_id}/flex_value_set`, {data: JSON.stringify(deleteValueAll)})
   }else {
     return axios.delete(`/fnd/v1/flex_value_set`, {data: JSON.stringify(deleteValueAll)})
   }
   }

  /**
   * 删除值集子表信息
   * @param orgId
   * @param position
   * @returns {*}
   */
  deleteChildValue = (iam_organization_id, flecValues) => {
    if (this.orgType=='organization') {
      return axios.delete(`fnd/v1/${iam_organization_id}/flex/values`, {data: JSON.stringify(flecValues)});
    }else {
      return axios.delete(`fnd/v1/flex/values`, {data: JSON.stringify(flecValues)});
    }
    };

  /**
   *   校验编码
   *   @param organizationId 组织id
   *   @param flexValueSets 获取到编码的值
   *   @param flexValueSetName  向后台传入编码字段名
   *   @return promise类型
   */
  checkFlexValueSetName = (iam_organization_id, flexValueSets) =>{
    if (this.orgType=='organization') {
    return axios.post(`fnd/v1/${iam_organization_id}/flex_value_set/data/verification`,
      JSON.stringify({flexValueSetName: flexValueSets}));
    }else {
      return axios.post(`fnd/v1/flex_value_set/data/verification`,
        JSON.stringify({flexValueSetName: flexValueSets}));
    }
  }

  /**
   * 判断状态是否有效和无效
   */

  disableValue = (iam_organization_id, flexValueSets) => {
   if (this.orgType=='organization') {
     return axios.post(`fnd/v1/${iam_organization_id}/flex_value_set/disable`, JSON.stringify(flexValueSets))
   }else {
     return axios.post(`fnd/v1/flex_value_set/disable`, JSON.stringify(flexValueSets))
   }
  }
  enableValue = (iam_organization_id, flexValueSets) => {
    if (this.orgType=='organization'){
      return axios.post(`fnd/v1/${iam_organization_id}/flex_value_set/enable`, JSON.stringify(flexValueSets))
    }else {
      return axios.post(`fnd/v1/flex_value_set/enable`, JSON.stringify(flexValueSets))

    }
  }

  // 有效快码
  getIsEnabled = (organizationId, code = 'FND_VALID_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });

  // 获取多语言
  queryLanguageEnv = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setLanguageEnv(allLanguage);
      });
  };
  // 获取code信息
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
}


const valueStore = new ValueStore();

export default valueStore;
