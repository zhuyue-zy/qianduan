/** 2018/10/24
*作者:高梦龙
*项目名称：审批工作流测试
*/

import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from "../../language";
import { message } from 'yqcloud-ui';

@store('ValueStore')
class WorkFlowStore extends LanguageStore{
  @observable processlist =[];
  constructor() {
    super('workflowTest');
  }

  @action
  setProcesslist(processlist) {
    this.processlist = processlist;
  }

  @computed
  get getProcesslist() {
    return this.processlist;
  }

  createWorkFlow=(iamOrganizationId, applicant, key) => {
    return axios.post(`/workflow/v1/${iamOrganizationId}/wfl/model/test/${applicant}/${key}/engine`)

  }


  // 查询选择流程

  queryProcess=(iamOrganizationId, code) => axios.get(`/workflow/v1/${iamOrganizationId}/wfl/model/engine`).then((data) => {
    this.setProcesslist(data);
  })

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
const workFlowStore = new WorkFlowStore();
export default workFlowStore;
