/*
* @description:编辑快码的侧边栏
* @author：郭杨
* @update 2018-09-18 16:44
*/
import { action, observable, computed } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';
import { message } from 'yqcloud-ui';


@store('LookupHomeStore')
class LookupHomeStore extends LanguageStore {
  constructor() {
    super('LookupHome');
  }

 languageInfo = {};

 languageList = [];

  @observable lookUpbyPMProjectType = [];

  @observable lookUpbyCategory =[];

  @observable enabled =[];

  @observable isLoading = true;

  // 通过代码名获取一条信息
  @observable totalSize;

  @observable totalPage;

  @observable orgType;

  @observable languageEnv = [];

  organizationType(org) {
    this.orgType = org;
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
  setLookupbyCategory(data) {
    this.lookUpbyCategory = data;
  }

  @computed
  get getLookupbyCategory() {
    return this.lookUpbyCategory;
  }

  @action
  setLookUpbyPMProjectType(data) {
    this.lookUpbyPMProjectType = data;
  }

  @computed
  get getLookUpbyPMProjectType() {
    return this.lookUpbyPMProjectType;
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
   *   分页查询快码
   *   @param organizationId 组织名称
   *   @param current 页码值
   *   @param pageSize 每页显示的记录条数
   *   @param lookupTypeCode 模糊查询字段名
   *   @param description 模糊查询字段名
   *   @param isEnabled 模糊查询字段名
   *   @param sort 排序字段
   *   @return promise类型
   */

     @action
   loadCodesWithPage = (organizationId, page, sortParam, filters, param) => {
     if (this.orgType === 'organization') {
       let filter = '';
       for (const i in filters) {
         filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
       }
       const loadCodes = axios.get(`fnd/v1/${organizationId}/lookup/page/list/proTic?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&${filter}`)
         .then((data) => {
           //  给数据加上key字段和多语言字段
           if (!data.content) {
             data.content = [];
           }
           data.content.forEach((val) => {
             val.key = val.lookupTypeId;
           });
           return data;
         });
       const loadLanguages = axios.get('iam/v1/languages/list')
         .then((allLanguage) => {
           //  初始化多语言字段
           const languageInfo = {};
           const languageList = [];
           allLanguage.forEach((val) => {
             languageInfo[val.code] = '';
             languageList.push(val.code);
           });
           return { languageInfo, languageList };
         });
       return Promise.all([loadCodes, loadLanguages])
         .then((data) => {
           data[0].content.forEach((val) => {
             val = Object.assign(val, {
               language: data[1].languageList,
             });
           });
           [this.languageInfo] = [data[1].languageInfo];
           [this.languageList] = [data[1].languageList];
           return data[0];
         });
     } else {
       let filter = '';
       for (const i in filters) {
         filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
       }
       const loadCodes = axios.get(`fnd/v1/lookup/page/list/?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&${filter}`)
         .then((data) => {
           //  给数据加上key字段和多语言字段
           if (!data.content) {
             data.content = [];
           }
           data.content.forEach((val) => {
             val.key = val.lookupTypeId;
           });
           return data;
         });
       const loadLanguages = axios.get('iam/v1/languages/list')
         .then((allLanguage) => {
           //  初始化多语言字段
           const languageInfo = {};
           const languageList = [];
           allLanguage.forEach((val) => {
             languageInfo[val.code] = '';
             languageList.push(val.code);
           });
           return { languageInfo, languageList };
         });
       return Promise.all([loadCodes, loadLanguages])
         .then((data) => {
           data[0].content.forEach((val) => {
             val = Object.assign(val, {
               language: data[1].languageList,
             });
           });
           [this.languageInfo] = [data[1].languageInfo];
           [this.languageList] = [data[1].languageList];
           return data[0];
         });
     }
   };

     /**
   *   根据id查询快码
   *   @param organizationId 组织名称
   *   @param lookupTypeId 快码id
   *   @return promise类型
   */

  @action
  loadCodeById = (organizationId, lookupTypeId = '') => {
    if (this.orgType === 'organization') {
      return axios.get(`fnd/v1/${organizationId}/lookup/${lookupTypeId}/proTic`)
        .then(({ lookupValuesList }) => {
          lookupValuesList.forEach((val) => {
            //  增加多语言字段
            val = Object.assign(val, {
              key: val.lookupValueId,
              language: this.languageList,
            });
          });
          return lookupValuesList;
        });
    } else {
      return axios.get(`fnd/v1/lookup/${lookupTypeId}`)
        .then(({ lookupValuesList }) => {
          lookupValuesList.forEach((val) => {
            //  增加多语言字段
            val = Object.assign(val, {
              key: val.lookupValueId,
              language: this.languageList,
            });
          });
          return lookupValuesList;
        });
    }
  }

  /**
   *    创建新快码
   *    @param organizationId 组织id
   *    @param code 快码数据对象
   *    @return promise类型
   */
  @action
  createCode = (organizationId, code) => {
    /* eslint-enable */
    if (this.orgType == 'organization') {
      return axios.put(`fnd/v1/${organizationId}/lookup/proTic`, JSON.stringify({ ...code, isSite: 'N' }));
    } else {
      return axios.put('fnd/v1/lookup', JSON.stringify({ ...code, isSite: 'Y' }));
    }
  };

  /**
   *    更新快码
   *    @param organizationId 组织id
   *    @param code 快码数据对象
   *    @return promise类型
   */
  @action
  updateCode = (organizationId, code) => {
    /* eslint-enable */
    if (this.orgType === 'organization') {
      return axios.post(`fnd/v1/${organizationId}/lookup/proTic`, JSON.stringify({ ...code }));
    } else {
      return axios.post('fnd/v1/lookup', JSON.stringify({ ...code }));
    }
  };

  /**
   *   批量删除快码
   *   @param organizationId 组织名称
   *   @param codeList 快码数组
   *   @return promise类型
   */
  @action
  deleteCodes = (organizationId, codeList) => {
    const codeIdList = [];
    codeList.forEach((val) => {
      codeIdList.push(val.lookupTypeId);
    });
    if (this.orgType === 'organization') {
      return axios.delete(`fnd/v1/${organizationId}/lookup/proTic`, { data: JSON.stringify(codeList) });
    } else {
      return axios.delete('fnd/v1/lookup', { data: JSON.stringify(codeList) });
    }
  };

  /**
   *   批量删除快码值
   *   @param organizationId 组织名称
   *   @param codeValueList 快码值数组
   *   @return promise类型
   */
  @action
  deleteCodeValues = (organizationId, codeValueList) => {
    const codeValueIdList = [];
    codeValueList.forEach((val) => {
      codeValueIdList.push(val.lookupValueId);
    });
    if (this.orgType === 'organization') {
      return axios.delete(`fnd/v1/${organizationId}/lookup/value/proTic`, { data: JSON.stringify(codeValueList) });
    } else {
      return axios.delete('fnd/v1/lookup/value', { data: JSON.stringify(codeValueIdList) });
    }
  };

  /**
   *   启用快码
   *   @param organizationId 组织id
   *   @param code 快码数据对象
   *   @return promise类型
   */
  @action
  enableCode = (organizationId, { lookupTypeId, objectVersionNumber }) => {
    /* eslint-enable */
    if (this.orgType === 'organization') {
      return axios.post(`fnd/v1/${organizationId}/lookup/enable`, JSON.stringify({
        lookupTypeId,
        objectVersionNumber,
      }));
    } else {
      return axios.post('fnd/v1/lookup/enable', JSON.stringify({
        lookupTypeId,
        objectVersionNumber,
      }));
    }
  };

  /**
   *   disable快码
   *   @param organizationId 组织id
   *   @param code 快码数据对象
   *   @return promise类型
   */
  @action
  disableCode = (organizationId, { lookupTypeId, objectVersionNumber }) => {
    if (this.orgType === 'organization') {
      return axios.post(`fnd/v1/${organizationId}/lookup/disable`, JSON.stringify({
        lookupTypeId,
        objectVersionNumber,
      }));
    } else {
      return axios.post('fnd/v1/lookup/disable', JSON.stringify({
        lookupTypeId,
        objectVersionNumber,
      }));
    }
  }

  /**
   *  校验数据是否重复
   *  @param organizationId 组织id
   *  @param lookupTypeCode 快码值
   */
  @action
  checkDuplicateRecord = (organizationId, lookupTypeCode, projectId, categoryCode) => {
    if (this.orgType === 'organization') {
      if (projectId && categoryCode) {
        // 先填code 没填项目和单据
        if (projectId === -1 || categoryCode === -1) {
          return;
        }
        return axios.post(`fnd/v1/${organizationId}/lookup/verification/${projectId}/proTic/${categoryCode}`, JSON.stringify({ lookupTypeCode }));
      } else {
        return axios.post(`fnd/v1/${organizationId}/lookup/verification`, JSON.stringify({ lookupTypeCode }));
      }
    } else {
      return axios.post('fnd/v1/lookup/verification', JSON.stringify({ lookupTypeCode }));
    }
  }
  // 有效快码

  getIsEnabled = (organizationId, code = 'FND_VALID_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });

  // 更改新的项目接口 增加项目屏蔽
  loadLookUpbyPMProjectType = (iamOrganizationId, userId) => {
    axios.get(`itsm/v1/${iamOrganizationId}/ca/project/list/manager/${userId}`).then((res) => {
      this.setLookUpbyPMProjectType(res);
    });
  }

  // 查询单据
  loadLookupbyCategory = (iamOrganizationId, projectId) => {
    if (projectId) {
      return axios.get(`itsm/v1/${iamOrganizationId}/ca/project/${projectId}`)
        .then((data) => {
          const { failed } = data;
          if (!failed) {
            if (data.projectCategoryList) {
              this.setLookupbyCategory(data.projectCategoryList);
              return data.projectCategoryList;
            }
          }
        });
    } else {
      return axios.get(`itsm/v1/${iamOrganizationId}/config/category/able`)
        .then((res) => {
          this.setLookupbyCategory(res);
          return res;
        });
    }
  };

  queryLanguageEnv = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setLanguageEnv(allLanguage);
      });
  };
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

const lookupHomeStore = new LookupHomeStore();

export default lookupHomeStore;
