import { observable, action, computed, toJS } from 'mobx';
import { axios, store, stores } from 'yqcloud-front-boot';
import LanguageStore from '../../language/languageStore';

@store('PortalManagementStore')
class PortalManagementStore extends LanguageStore {
  constructor() {
    super('portalManagement');
  }
  @observable loading = false
  @observable saveLoading = false
  @observable info = {
    id: '',
    objectVersionNumber: '',
    domainName: '',
    iamOrgCode: '',
    welcomeMessage: '',
    isOpenChatRobot: 'N',
    isOpenHotline: 'N',
    logo: '',
    backgroundImage: '',
    serviceHotline: '',
    trueUrl: '',
  }

  @observable portalProjectList = []
  @observable projectList = []

  @action.bound setLoading(loading) {
    this.loading = loading
  }

  @action.bound setSaveLoading(saveLoading) {
    this.saveLoading = saveLoading
  }

  @action.bound setInfo(info) {
    this.info = info
  }

  @action.bound setPortalList(portalProjectList) {
    this.portalProjectList = portalProjectList
  }

  @action.bound setProjectList(projectList) {
    this.projectList = projectList
  }

  // 获取租户code
  @action.bound getDomain(data) {
    return new Promise(resolve => {
      const url = `/iam/v1/${data.organizationId}/organizations`
      axios.get(url).then(json => {
        if (json && json.code) {
          resolve(json)
        } else {
          resolve(-1)
        }
      })
    })
  }

  // 获取门户页面
  @action.bound getPortalSetting(data) {
    return new Promise(resolve => {
      const url = `/itsm/v1/portal/${data.organizationId}/id`
      axios.get(url).then(json => {
        if (!json.failed) {
          resolve(json)
        } else {
          resolve(-1)
        }
      })
    })
  }

  @action.bound getPortalInfo(data) {
    this.setLoading(true)

    Promise.all([
      this.getDomain(data),
      this.getPortalSetting(data),
    ]).then(jsonArr => {

      let _info = { ...this.info }
      let portalProjectList = []
      if (jsonArr && jsonArr[1] !== -1) {
        let json = jsonArr[1]

        // 头信息
        _info.domainName = json.domainName
        _info.welcomeMessage = json.welcomeMessage
        _info.isOpenChatRobot = json.isOpenChatRobot
        _info.isOpenHotline = json.isOpenHotline
        _info.logo = json.logo
        _info.backgroundImage = json.backgroundImage
        _info.objectVersionNumber = json.objectVersionNumber
        _info.serviceHotline = json.serviceHotline
        _info.id = json.id
        _info.trueUrl = json.trueUrl

        // 表格数据
        portalProjectList = json.portalProjectList

      } else {
        console.error('获取portal setting 失败')
      }

      if (jsonArr && jsonArr[0] !== -1) {
        let json = jsonArr[0]
        _info.iamOrgCode = json.code
      } else {
        console.error('获取domain code失败')
      }

      // 第一次默认租户code给域名
      if (!_info.domainName && _info.iamOrgCode) {
        _info.domainName = _info.iamOrgCode.toLowerCase()
      }
      this.setInfo(_info)
      this.setPortalList(portalProjectList)
      this.setLoading(false);
      return jsonArr[1];
    })
  }

  // 保存头部信息
  @action.bound saveInfo(data) {

    this.setSaveLoading(true)
    const url = `/itsm/v1/portal/${data.organizationId}`

    axios.post(url, data).then(json => {
      if (json != 0) {
        this.getPortalInfo({ organizationId: data.organizationId });
      } else {
        // 保存失败
      }
      this.setSaveLoading(false)

    })
  }

  // 获取项目列表
  @action.bound getProjectList(data) {
    this.setLoading(true)
    const url = `/project/v1/${data.organizationId}/pm/able`
    axios.get(url, data).then(json => {
      this.setProjectList(json)
      this.setLoading(false)
    })
  }

  // 获取项目列表
  @action.bound deleteProject(data) {
    this.setLoading(true)
    const url = `/itsm/v1/portal/project/${data.organizationId}`
    axios.delete(url, { data: JSON.stringify(data) }).then(json => {
      this.getPortalInfo({ organizationId: data.organizationId });
      this.setLoading(false)

    })
  }

  @action.bound saveRow(data) {
    this.setLoading(true)
    const url = `/itsm/v1/portal/project/${data.organizationId}`
    axios.post(url, data).then(json => {
      this.getPortalInfo({ organizationId: data.organizationId });
      this.setLoading(false)
    })
  }

  @action.bound sortRow(data) {
    this.setLoading(true)
    const url = `/itsm/v1/portal/project/${data.organizationId}/sort`
    axios.post(url, data.portalProjects).then(json => {
      this.getPortalInfo({ organizationId: data.organizationId })
      this.setLoading(false)
    })
  }

}
const portalManagementStore = new PortalManagementStore()

export default portalManagementStore
