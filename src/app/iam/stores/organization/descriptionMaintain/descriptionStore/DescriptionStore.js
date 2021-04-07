/** 2018/10/13
*作者:高梦龙
*项目：描述维护路由
*/


import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from '../../../language/languageStore';
import { message } from 'yqcloud-ui';

@store('DescriptionStore')
class DescriptionStore extends LanguageStore {
  @observable isLoading = true;

  @observable desMaintains = [];

  @observable descriptions;

  // 通过代码名获取一条信息
  @observable totalSize;

  @observable totalPage;

  @observable languagelist =[];
  /* eslint-disable */
  @observable  orgType;//菜单类型

  constructor(totalPage = 1, totalSize = 0) {
    super('descriptionMaintain');
    this.totalPage = totalPage;
    this.totalSize = totalSize;
  }

  @action
  setDesMaintains(data) {
    this.desMaintains = data;
  }

  @computed
  get getDesMaintains() {
    return this.desMaintains;
  }

  @action
  setDescriptions(data) {
    this.descriptions = data;
  }

  @computed
  get getDescriptions() {
    return this.descriptions;
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
  setLanguagelist(languagelist) {
    this.languagelist = languagelist;
  }

  @computed
  get getLanguagelist() {
    return this.languagelist;
  }
  @action
  organizationType(org){
    this.orgType=org
  }
  /**
   * 加载描述维护列表信息
   * @param organizationId
   * @param page
   * @param sortParam
   * @param flexValueSetName
   * @param description
   * @param param
   * @returns {PromiseLike<T | never> | Promise<T | never>}
   */
  /* eslint-disable */
  loadDescription = (iam_organization_id, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    let times = new Date();
    if (this.orgType=='organization') {
      return axios.get(
        `/fnd/v1/${iam_organization_id}/prompts/pagination?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&${filter}&time=${Number(times)}`,
      ).then((data) => {
        this.setIsLoading(false);
        data.content.forEach((value) => {
          value.editType = 'unchanged';//表示数据三个状态，新建、修改、不变的

        })
        return data;
      });
    }else {
      return axios.get(
        `/fnd/v1/prompts/pagination?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&${filter}&time=${Number(times)}`,
      ).then((data) => {
        this.setIsLoading(false);
        data.content.forEach((value) => {
          value.editType = 'unchanged';//表示数据三个状态，新建、修改、不变的

        })
        return data;
      });
    }

  };

  //创建
   createDes=(iam_organization_id,prompts)=>{
    const createPrompts=[]
     prompts.forEach((value) => {
       createPrompts.push({
         description: value.description || '',
         lang: value.lang || '',
         promptCode: value.promptCode || '',
         isSite: value.isSite || '',
       });
     })
     if (this.orgType=='organization') {
       return axios.post(`/fnd/v1/${iam_organization_id}/prompts`, JSON.stringify(createPrompts))
     }else {
       return axios.post(`/fnd/v1/prompts/create`, JSON.stringify(createPrompts))

     }
   }

   //编辑
    updateDes=(iam_organization_id,promptList)=>{
      if (this.orgType=='organization') {
        return axios.put(`/fnd/v1/${iam_organization_id}/prompts/batch`, JSON.stringify(promptList))
      }else {
        return axios.put(`/fnd/v1/prompts/batch`, JSON.stringify(promptList))

      }
  }

  //删除
   deleteDes=(iam_organization_id,prompts)=>{
     if (this.orgType=='organization') {
       return axios.delete(`/fnd/v1/${iam_organization_id}/prompts`, {data: JSON.stringify(prompts)})
     }else {
       return axios.delete(`/fnd/v1/prompts/`, {data: JSON.stringify(prompts)})

     }
     }
     //根据编码集查询语言数据
    queryLanguages=(iam_organization_id,promptCodeList, orgType)=>{
    if (orgType=='organization') {
     return axios.post(`fnd/v1/${iam_organization_id}/prompts/multi/lan`,JSON.stringify(promptCodeList))
  }
  else {
      return axios.post(`fnd/v1/prompts/multi/language`,JSON.stringify(promptCodeList))

    }
  }

  // 选择多语言
  loadLanguageList = () =>
    axios.get('/iam/v1/languages/list').then((data) => {
      this.setLanguagelist(data);
    });

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

const descriptionStore=new DescriptionStore()
export default  descriptionStore
