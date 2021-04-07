/** 2018/11/20
*作者:高梦龙
*项目：编码规则
*/
import { action, observable, computed } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import LanguageStore from "../../language";
import { message } from 'yqcloud-ui';


@store('EncodingStore')
class EncodingStore extends LanguageStore{
  @observable totalSize;

  @observable totalPage;

  @observable isLoading = true;

  @observable applicationType =[];

  @observable docTypeCode =[];

  @observable enabled =[];

  @observable dateType =[];

  @observable resetFrequency =[];

  @observable sequence =[];

  constructor(totalPage = 1, totalSize = 0) {
    super('encodingRules');
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

  @action
  setApplicationType(applicationType) {
    this.applicationType = applicationType;
  }

  @computed
  get getApplicationType() {

    return this.applicationType;
  }

  @action
  setDocTypeCode(docTypeCode) {
    this.docTypeCode = docTypeCode;
  }

  @computed
  get getDocTypeCode() {
    return this.docTypeCode;
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
  setDateType(dateType) {
    this.dateType = dateType;
  }

  @computed
  get getDateType() {
    return this.dateType;
  }

  @action
  setResetFrequency(resetFrequency) {
    this.resetFrequency = resetFrequency;
  }

  @computed
  get getResetFrequency() {
    return this.resetFrequency;
  }

  @action
  setSequence(sequence) {
    this.sequence = sequence;
  }

  @computed
  get getSequence() {
    return this.sequence;
  }

  loadEncodingRules = (organizationId, page, sortParam, filters, param) => {
    this.setIsLoading(true);
    let filter = '';
    for (const i in filters) {
      filter += filters[i][0] ? `&${i}=${filters[i][0]}` : '';
    }
    return axios.get(
      `coderule/v1/${organizationId}/cr/info?page=${page.current - 1}&size=${page.pageSize}&sort=${sortParam}${filter}`,
    ).then((data) => {
      this.setIsLoading(false);
      return data;
    });
  };

  // 查询应用系统
  getApplicationTypes=(organizationId, code = 'FND_APP_SYSTEM') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setApplicationType(data);
  });

  // 查询单据类型
  getDocTypeCodes=(organizationId, code = 'FND_CDRULE_ASGN') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setDocTypeCode(data);
  });

  // 生效快码
  getIsEnabled = (organizationId, code = 'FND_VALID_STATUS') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setEnabled(data);
  });

  // 日期掩码
  getDateTypes = (organizationId, code = 'FND_SEQ_DATETYPE') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setDateType(data);
  })

  //重置频率
  getResetFrequencys = (organizationId, code = 'FND_SEQ_RESETFREQ') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setResetFrequency(data);
  })

  //序列
  getSequences = (organizationId, code = 'FND_SEQ_SECTYPE') => axios.get(`fnd/v1/${organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then((data) => {
    this.setSequence(data);
  })
  // 获取详情页面
  getCodeRulesId = (organizationId, headerId) => axios.get(`/coderule/v1/${organizationId}/cr/id/${headerId}`).then((data) => {
    this.setIsLoading(false);
    return data;
  })

  //检验单据类型
  checkDocTypeCode= (iam_organization_id, application_code, doc_type_code) => axios.get(`/coderule/v1/${iam_organization_id}/cr/code_repeat/${application_code}/${doc_type_code}`)

  //校验规则代码
  checkRuleCode =(iam_organization_id, code) => axios.get(`/coderule/v1/${iam_organization_id}/cr/code_is_repeat/${code}`)

  // 新增编码规则数据
   createCodeRules = (organizationId, codeRuleHeader) => axios.post(`/coderule/v1/${organizationId}/cr/code/rule`, JSON.stringify(codeRuleHeader))

   // 替换编码规则
    repalceCodeRules = (organizationId, newCodeRuleHeader) => axios.post(`/coderule/v1/${organizationId}/cr/enable`, JSON.stringify(newCodeRuleHeader))

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
const encodingStore = new EncodingStore();
export default encodingStore;
