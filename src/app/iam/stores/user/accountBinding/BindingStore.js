import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';

@store('BindingStore')
class BindingStore {
  @observable isLoading = true;
  @observable avatar;

  @action setIsLoading(flag) {
    this.isLoading = flag;
  }

  @computed get getIsLoading() {
    return this.isLoading;
  }

  @computed
  get getUserInfo() {
    return this.userInfo;
  }

  @action
  setUserInfo(data) {
    this.userInfo = data;
    this.avatar = data.imageUrl;
  }

  @action
  setAvatar(avatar) {
    this.avatar = avatar;
  }

  @computed
  get getAvatar() {
    return this.avatar;
  }

  @action
  setLanguagelist(languagelist) {
    this.languagelist = languagelist;
  }

  @computed
  get getLanguagelist() {
    return this.languagelist;
  }

  //账户绑定获取数据 平台
  loadBindings=(page,param)=>{
    this.setIsLoading(true);
    return axios.get(`iam/v1/user/email/list?page=${page.current - 1}&size=${page.pageSize}`, JSON.stringify({
      param,
    }),).then((data) => {
      this.setIsLoading(false);
      return data;
    })};
  //账户绑定获取数据 租户
  loadBindingsOrg=(organizationId,page,param)=>{
    this.setIsLoading(true);
    return axios.get(`iam/v1/user/email/organization/${organizationId}/list?page=${page.current - 1}&size=${page.pageSize}`, JSON.stringify({
      param,
    }),).then((data) => {
      this.setIsLoading(false);
      return data;
    })};

  //账户绑定删除接口 平台
  bindingDeletes=(id)=>axios.delete(`iam/v1/user/email/remove/${id}`);
  //账户绑定删除接口 租户
  bindingDeletesOrg=(organizationId,id)=>axios.delete(`iam/v1/user/email/organization/${organizationId}/remove/${id}`);

  // 设置主邮箱接口 平台
  bindingMainEmails=(id)=>axios.post(`iam/v1/user/email/main/${id}`);
  // 设置主邮箱接口 租户
  bindingMainEmailsOrg=(organizationId,id)=>axios.post(`iam/v1/user/email/organization/${organizationId}/main/${id}`);

  //校验邮箱是否存在 平台
  bindingCheckEmails=(employeeCode)=>axios.post(`iam/v1/user/email/check?emailName=${employeeCode}`);
  //校验邮箱是否存在 租户
  bindingCheckEmailsOrg=(organizationId,employeeCode)=>axios.post(`iam/v1/user/email/organization/${organizationId}/check?emailName=${employeeCode}`);

  //邮箱验证码 平台
  bindingSendYzms=(emailName)=>axios.post(`iam/v1/user/email/send?emailName=${emailName}`);
  //邮箱验证码 租户
  bindingSendYzmsOrg=(organizationId,emailName)=>axios.post(`iam/v1/user/email/organization/${organizationId}/send?emailName=${emailName}`);

  //保存接口 平台
  bindingSubmits=(emailName,verificationCode)=>axios.post(`iam/v1/user/email/bind?emailName=${emailName}&verificationCode=${verificationCode}`)
  //保存接口 租户
  bindingSubmitsOrg=(organizationId,emailName,verificationCode)=>axios.post(`iam/v1/user/email/organization/${organizationId}/bind?emailName=${emailName}&verificationCode=${verificationCode}`)



  //账号信息获取 平台
  loadUserInfo = () => {
    this.setIsLoading(true);
    return axios.get('/iam/v1/users/self').then((data) => {
      if (data) {
        this.setUserInfo(data);
      }
      this.setIsLoading(false);
    });
  };

  //手机号码解绑 平台
  phoneUnbinds=(phoneNum,verificationCode)=>axios.post(`iam/v1/users/phone/unbind/${phoneNum}/${verificationCode}`)
  //手机号码解绑 租户
  phoneUnbindsOrg=(organizationId,phoneNum,verificationCode)=>axios.post(`iam/v1/users/organization/${organizationId}/phone/unbind/${phoneNum}/${verificationCode}`)

  //校验手机号是否存在 平台
  bindingCheckPhones=(phone)=>axios.post(`iam/v1/users/check/${phone}`);
  //校验手机号是否存在 租户
  bindingCheckPhonesOrg=(organizationId,phone)=>axios.post(`iam/v1/users/organization/${organizationId}/check/${phone}`);

  //手机号验证码 平台
  bindingSendPhoneYzms=(phone)=>axios.post(`iam/v1/users/send/${phone}`);
  //手机号验证码 租户
  bindingSendPhoneYzmsOrg=(organizationId,phone)=>axios.post(`iam/v1/users/organization/${organizationId}/send/${phone}`);

  //保存接口 平台
  bindingPhoneSubmits=(phone,verificationCode)=>axios.post(`iam/v1/users/phone/bind/${phone}/${verificationCode}`)
  //保存接口 租户
  bindingPhoneSubmitsOrg=(organizationId,phone,verificationCode)=>axios.post(`iam/v1/users/organization/${organizationId}/phone/bind/${phone}/${verificationCode}`)


}

const bindingStore = new BindingStore();
export default bindingStore;
