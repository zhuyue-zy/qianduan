import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from "../../language";

@store('AutomaticTransferStore')
class AutomaticTransferStore extends LanguageStore {
  @observable totalSize;

  @observable totalPage;

  @observable isLoading = true;

  constructor(totalPage = 1, totalSize = 0) {
    super('AutomaticTransfer');
    this.totalPage = totalPage;
    this.totalSize = totalSize;
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
  setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed
  get getIsLoading() {
    return this.isLoading;
  }

  /**
   * 加载工作流自动配置列表信息
   * @param organizationId
   * @param page
   * @param sortParam
   * @param flexValueSetName
   * @param description
   * @param param
   * @returns {PromiseLike<T | never> | Promise<T | never>}
   */
  /* eslint-disable */
  loadAutos = (iam_organization_id, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
      return axios.get(
        `/workflow/v1/${iam_organization_id}/wfl?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}&${filter}`,
      ).then((data) => {
        this.setIsLoading(false);
        return data;
      });


  };


  // 新建

  createAuto=(iamOrganizationId , forWard) => axios.post(`/workflow/v1/${iamOrganizationId}/wfl/forward`, JSON.stringify(forWard))
}

const automaticTransferStore = new AutomaticTransferStore();
export default automaticTransferStore;
