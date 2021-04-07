import React, {Component} from 'react';
import {inject, observer} from 'mobx-react';
import {withRouter} from 'react-router-dom';
import querystring from 'query-string';
import {Button, Form, Input, DatePicker, Select, Icon, Switch,message,Upload,Modal,InputNumber } from 'yqcloud-ui';
import {axios, Content, Header, Page, Permission, stores} from 'yqcloud-front-boot';
import {injectIntl} from 'react-intl';
import moment from 'moment';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/lib/ReactCrop.scss';
import 'react-image-crop/dist/ReactCrop.css';
import UserStore from '../../../../stores/organization/user/UserStore';
import './tenantOrganizationHome.less';
import './LOGOUpload.scss'
import smallImg from '../../../../assets/images/default_image.svg';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';
import MultiLanguageFormItemTwo from '../NewMultiLanguageFormItem';

const intlPrefix = 'global.organization';
const {HeaderStore} = stores;
const FormItem = Form.Item;
const Option = Select.Option;

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

@inject('AppState')
@observer
class tenantOrganizationHome extends Component {

  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
  }
  state = this.getInitState();

  getInitState() {
    return {
      orgId: this.props.match.params.id,
      visible: false,
      content: null,
      show: '',
      submitting: false,
      loading: false,
      editData: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: 0,
        pageSizeOptions: [25, 50, 100, 200]
      },
      sort: {
        columnKey: null,
        order: null,
      },
      filters: {},
      params: [],
      languageLists: [],
      tempCheck: false,
      tempCheckEmail: true,

      msgVisible: false,
      msgName: [],
      msgStatus: [],
      tenantType:[],
      msgDataSource: [],
      id: '',
      clickEyes: false,
      startValue: null,
      endValue: null,
      endOpen: false,
      orgInfo: [],
      loadingBtn: false,
      DnsUrl:'',
      LoginType:[],
      passwordLContainData:[],
      passwordFastCode:[],
      lockedExpireTime:'',
      maxErrorTime:'',
      recentCount:'',
      passwordValidity:'',
      passwordMinLength:'',
      passwordMaxLength:'',
      PasswordLContain:[],
      formatCode:"",
      LOGOvisible:false,
      LOGOsubmitting: false,
      croppedImageUrl: null, // 上传的图片对象
      croppedImageUrl_two: null, // 上传的图片对象
      croppedImageUrl_s: null, // 上传的图片对象
      croppedImageObject: null, // 文件blob对象
      file: null, // 上传的文件对象
      src: null,
      crop: {
        x: 10,
        y: 10,
        aspect: 5.25,
        width: 50,
      },
      // 存放多语言信息
      multiLanguageValue: {
        name: {},
        remark:{},
        welcome_message:{},
      },
    };
  }


  componentWillMount() {
    this.loadOrgById();
    this.languageList();
    this.getTenantType();
    this.getLanguage();
    this.getLoginType();
    this.getUrl();
  }

  componentDidMount() {
    this.loadLanguage();
  }

  /*  多语言，获取系统支持的语言环境 */
  getLanguage = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        });
      });
  };

  getUrl = () =>{
    const url = window.location.host;
    // const Urldata = 'yqcloud.dev.cloopm.com';
    const  Urldata = url.substring(url.indexOf('.')+1);
    this.setState({
      DnsUrl: Urldata
    })
  };

  // 获取语言
  loadLanguage = () => {
    const {AppState} = this.props;
    const id = 0;
    UserStore.queryLanguage(AppState.userInfo.currentOrganizationId, AppState.currentLanguage);
  };

  loadOrgById() {
    const {orgId} = this.state;
    const {AppState} = this.props;
    axios.get(`iam/v1/${AppState.userInfo.currentOrganizationId}/organizations`).then(data => {
      this.setState({
        orgInfo: data,
        multiLanguageValue: {
          name: data.__tls.name,
          remark:data.__tls.remark,
          welcome_message:data.__tls.welcome_message
        },
        tempCheck: data.ldap,
        tempCheckEmail: data.sendEmail,
      })
    })
  }

  fetch({current, pageSize}, {columnKey, order}, {name, code, enabled, isLdapUser}, params) {
    this.setState({
      loading: true,
    });
    const queryObj = {
      page: current - 1,
      size: pageSize,
      name,
      code,
      isLdapUser,
      enabled,
      params,
    };
    if (columnKey) {
      const sorter = [];
      sorter.push(columnKey);
      if (order === 'descend') {
        sorter.push('desc');
      }
      queryObj.sort = sorter.join(',');
    }
    this.queryMsgName()
    this.queryMsgStatus()
    return axios.get(`/iam/v1/organizations?${querystring.stringify(queryObj)}`);
  }

  //  快码初始化内容查询
  queryMsgName = () => {
    const {AppState} = this.props;
    const code = "FND_INITIAL_CONTENT";
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          msgName: data
        })
      })
  }

  queryMsgStatus = () => {
    const {AppState} = this.props;
    const code = "FND_MSG_SENDSTATUS";
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          msgStatus: data
        })
      })
  }

  languageList = () => {
    return axios.get('/iam/v1/languages/list').then((data) => {
      this.setState({
        languageLists: data,
      });
    })
  }

  /**
   * 组织编码校验
   * @param rule 表单校验规则
   * @param value 组织编码
   * @param callback 回调函数
   */
  checkCode = (rule, value, callback) => {
    const {intl} = this.props;
    axios.post(`/iam/v1/organizations/check`, JSON.stringify({code: value}))
      .then((mes) => {
        if (mes.failed) {
          callback(UserStore.languages[`${intlPrefix}.onlymsg`]);
        } else {
          callback();
        }
      });
  };

  //LDAP开关
  handleClickSwitch = (checked) => {
    const {show, editData, tempCheck} = this.state;
    if (checked) {
      this.setState({
        tempCheck: true
      })

    } else if (checked == false) {
      this.setState({
        tempCheck: false
      })
    }
    this.setState({
      editData
    })
  }
  //email开关
  handleClickSwitchEmail = (checked) => {
    const {show, editData, tempCheckEmail} = this.state;
    if (checked) {
      this.setState({
        tempCheckEmail: true
      })

    } else if (checked == false) {
      this.setState({
        tempCheckEmail: false
      })
    }
    this.setState({
      editData
    })
  };

  // 租户类型快码
  getTenantType =() =>{
    const {AppState}=this.props;
    const code = 'FND_TENANT_TYPE';
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          tenantType: data
        })
      })
  };

  disabledStartDate = (startValue) => {
    const endValue = this.state.endValue;
    if (!startValue || !endValue) {
      return false;
    }
    return startValue.valueOf() > endValue.valueOf();
  }

  disabledEndDate = (endValue) => {
    const startValue = this.state.startValue;
    if (!endValue || !startValue) {
      return false;
    }
    return endValue.valueOf() <= startValue.valueOf();
  }

  onStartChange = (value) => {
    this.onChange('startValue', value);
  }

  onEndChange = (value) => {
    this.onChange('endValue', value);
  }

  onChange = (field, value) => {
    this.setState({
      [field]: value,
    });
  }

  handleSubmit = (e) => {
    const {AppState} = this.props;
    e.preventDefault();
    this.props.form.validateFields((err, {code, name, remark,robotNum,typeCode,welcomeMessage, effectDate, expiryDate, enabled, language, ldap, password, loginName}, modify) => {
      if (!err) {
        this.setState({loadingBtn: true})
        const {intl} = this.props;
        const {show, editData: {id, code: originCode, objectVersionNumber, ldap}, tempCheck, tempCheckEmail, orgId, orgInfo} = this.state;
        let url;
        let body;
        let messages;
        let method;
        url = `iam/v1/${AppState.userInfo.currentOrganizationId}/organizations`;
        body = {
          // ldap: tempCheck,
          sendEmail: tempCheckEmail,
          name,
          objectVersionNumber:orgInfo.objectVersionNumber,
          code: orgInfo.code,
          remark,
          robotNum,
          welcomeMessage,
          typeCode:orgInfo.typeCode,
          effectDate: moment(effectDate).format('YYYY-MM-DD hh:mm:ss'),
          expiryDate: moment(expiryDate).format('YYYY-MM-DD hh:mm:ss'),
          enabled: true,
          language,
          loginName,
          password,
          __tls:this.state.multiLanguageValue,
          tenantDns:typeCode==='ENTERPRISE'?(orgInfo.code.toLowerCase()+'.'+this.state.DnsUrl):null,
          logoUrl:this.state.imgObject?this.state.imgObject.imageUrl:(orgInfo.logoUrl?orgInfo.logoUrl:''),
          // ldap:this.state.ldap,
          // sso:this.state.sso,
        };
        messages = UserStore.languages['modify.success'];
        method = 'put';
        this.setState({submitting: true});
        axios[method](url, JSON.stringify(body))
          .then(data => {
            this.setState({
              submitting: false,
              visible: false,
            });
            if (data.failed) {
              this.setState({loadingBtn: false})
            } else {
              message.success(messages,undefined, undefined,'bottomLeft' );
              // this.props.history.push(`tenantOrganization?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);

              document.location.reload();
              this.setState({loadingBtn: false})
              this.loadOrganizations();
              HeaderStore.updateOrg(data);
            }
          })
          .catch(error => {
            this.setState({submitting: false});
            Choerodon.handleResponseError(error);
          });
      }
    });
  };

  // 租户登录方式快码
  getLoginType =() =>{
    const {AppState}=this.props;
    const code = 'FND_LOGIN_TYPE';
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          LoginType: data
        })
      })
  };

  renderSidebarContent() {
    const {intl} = this.props;
    const {getFieldDecorator} = this.props.form;
    const {show, editData, orgInfo} = this.state;
    const {startValue, endValue, endOpen} = this.state;
    const formItemLayout = {
      labelCol: {
        xs: {span: 24},
        sm: {span: 8},
      },
      wrapperCol: {
        xs: {span: 24},
        sm: {span: 16},
      },
    };
    const inputWidth = 443;

    const languages = this.state.languageLists;
    const lanOption = [];
    languages.forEach((item) => {
      lanOption.push(<Option value={item.code}>{item.description}</Option>);
    });
    const  { tenantType } = this.state;
    const tenTypeOption = [];
    tenantType.forEach((item) => {
      tenTypeOption.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });

    const  { LoginType } = this.state;
    const LoginTypeOption = [];
    LoginType.forEach((item) => {
      LoginTypeOption.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    return (
      <Content
        className="sidebar-content"
        values={{name: show === 'create' ? `${process.env.HEADER_TITLE_NAME || 'Choerodon'}` : `${editData.code}`}}
      >
        <Form style={{ marginTop: 15 }}>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('code', {
              rules: [{
                required: true,
                whitespace: true,
                message: UserStore.languages[`${intlPrefix}.coderequiredmsg`],
              }, {
                max: 20,
                message: UserStore.languages[`${intlPrefix}.codemaxmsg`],
              }, {
                pattern: /^[A-Z0-9]+$/,
                message: UserStore.languages[`${intlPrefix}.codepatternmsg`],
              }],
              normalize: (value) => {
                if (value) {
                  return value.toUpperCase()
                }
              },
              validateFirst: true,
              initialValue: orgInfo.code,
            })(
              <Input disabled label={UserStore.languages[`${intlPrefix}.code`]} maxLength={15} required
                     autoComplete="off" style={{width: inputWidth}}/>,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('name', {
              initialValue: orgInfo.name,
              rules: [{
                required: true,
                message: UserStore.languages[`${intlPrefix}.namerequiredmsg`],
                whitespace: true
              }],
            })(
              <MultiLanguageFormItem
                label={UserStore.languages[`${intlPrefix}.name`]}
                requestUrl="true"
                requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.name : {}}
                handleMultiLanguageValue={({ retObj, retList }) => {
                  // 将多语言的值设置到当前表单
                  this.props.form.setFieldsValue({
                    name: retObj[this.props.AppState.currentLanguage],
                  });
                  this.setState({
                      multiLanguageValue: {
                        ...this.state.multiLanguageValue,
                        name: retObj,
                      },
                      multiLanguageList: retList,
                    },()=>{
                      // this.onValuesChangeFrom()
                    }
                  );
                }}
                maxLength={50}
                // disabled={isView === '1' ? 'true' : ''}
                type="FormItem"
                FormLanguage={this.state.multiLanguageValue}
                languageEnv={this.state.languageEnv}
                descriptionObject={UserStore.languages.multiLanguage}
                required="true"
                inputWidth={inputWidth}
              />
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('remark', {
              initialValue: orgInfo.remark,
              rules: [{required: true, message: UserStore.languages[`${intlPrefix}.remarkrequiredmsg`]}],
            })(
              <MultiLanguageFormItem
                label={UserStore.languages[`${intlPrefix}.remark`]}
                requestUrl="true"
                requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.remark : {}}
                handleMultiLanguageValue={({ retObj, retList }) => {
                  // 将多语言的值设置到当前表单
                  this.props.form.setFieldsValue({
                    remark: retObj[this.props.AppState.currentLanguage],
                  });
                  this.setState({
                      multiLanguageValue: {
                        ...this.state.multiLanguageValue,
                        remark: retObj,
                      },
                      multiLanguageList: retList,
                    },()=>{
                      // this.onValuesChangeFrom()
                    }
                  );
                }}
                maxLength={100}
                // disabled={isView === '1' ? 'true' : ''}
                type="FormItem"
                FormLanguage={this.state.multiLanguageValue}
                languageEnv={this.state.languageEnv}
                descriptionObject={UserStore.languages.multiLanguage}
                required="true"
                inputWidth={inputWidth}
              />
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('typeCode', {
              initialValue: (orgInfo.typeCode==="ENTERPRISE" ? `${UserStore.languages[`${intlPrefix}.enterprise`]}` : `${UserStore.languages[`${intlPrefix}.public`]}`),
              rules: [{ required: true, message: UserStore.languages[`${intlPrefix}.tenantTypeWarning`]}],
              // validateTrigger: 'onBlur',
            })(
              <Select
                disabled
                getPopupContainer={triggerNode => triggerNode.parentNode}
                label={UserStore.languages[`${intlPrefix}.tenantType`]}
                style={{ width: inputWidth }}
              >
                {tenTypeOption}
              </Select>,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            style={{
              width:inputWidth
            }}
          >
            {getFieldDecorator('robotNum', {
              rules: [{ required: true, message: '填写机器人数量'}],
              initialValue:orgInfo.robotNum
            })(
              <InputNumber
                label="机器人数量"
                min={0}
                precision={0}
                disabled={true}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('effectDate', {
              initialValue: orgInfo.effectDate && moment(orgInfo.effectDate),
              rules: [
                {
                  required: true, message: UserStore.languages[`${intlPrefix}.expirydaterequiredmsg`]
                },
                {
                  validator: (rule, value, callback) => {
                    const effectDate = (new Date(value)).getTime()
                    const expiryDate = (new Date(this.props.form.getFieldValue('expiryDate'))).getTime()
                    if (expiryDate !== 0 && (expiryDate - effectDate) < 86400) {
                      callback(UserStore.languages[`${intlPrefix}.effectdate.expirydate.requiredmsg`]);
                    } else {
                      this.props.form.setFieldsValue({expiryDate: this.props.form.getFieldValue('expiryDate')})
                      callback();
                    }
                  }
                }],
              validateFirst: true,
            })(
              <DatePicker disabled onChange={this.onStartChange} disabledDate={this.disabledStartDate} value={startValue}
                          style={{width: inputWidth}} format="YYYY-MM-DD" allowClear={true}
                          label={UserStore.languages[`${intlPrefix}.effectdate`]}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('expiryDate', {
              initialValue: orgInfo.expiryDate && moment(orgInfo.expiryDate),
              rules: [
                {
                  validator: (rule, value, callback) => {
                    const effectDate = (new Date(this.props.form.getFieldValue('effectDate'))).getTime()
                    const expiryDate = (new Date(value)).getTime()
                    if (value && (expiryDate - effectDate) < 86400) {
                      callback(UserStore.languages[`${intlPrefix}.effectdate.expirydate.requiredmsg`]);
                    } else {
                      this.props.form.setFieldsValue({effectDate: this.props.form.getFieldValue('effectDate')})
                      callback();
                    }
                  }
                }],
              validateFirst: true,
            })(
              <DatePicker disabled disabledDate={this.disabledEndDate} onChange={this.onEndChange} value={endValue}
                          style={{width: inputWidth}} format="YYYY-MM-DD" allowClear={true}
                          label={UserStore.languages[`${intlPrefix}.expirydate`]}

              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('language', {
              initialValue: `${orgInfo.language}`,

              rules: [{required: true, message: UserStore.languages[`${intlPrefix}.languages`]}],
            })(
              <Select
                getPopupContainer={triggerNode => triggerNode.parentNode}
                label={UserStore.languages[`${intlPrefix}.language`]}
                style={{width: inputWidth}}
              >
                {lanOption}
              </Select>,
            )}
          </FormItem>

        </Form>
      </Content>
    );
  }


  LOGOshowModal = () => {
    this.setState({
      LOGOvisible: true,
    });
  };

  // 上传文件的onChange事件
  LOGOonSelectFile = (e) => {
    const { intl } = this.props;
    let fileSize = 0;
    const fileMaxSize = 1024; // 1M
    const fileTypes = ['.png'];

    if (e.target.files && e.target.files.length > 0) {
      fileSize = e.target.files[0].size;
      const size = fileSize / 1024;
      let isNext = false;
      const fileEnd = e.target.value.substring(e.target.value.lastIndexOf('.')).toLowerCase();
      for (let i = 0; i < fileTypes.length; i++) {
        if (fileTypes[i] === fileEnd) {
          isNext = true;
          break;
        }
      }
      if (!isNext) {
        Choerodon.prompt(UserStore.languages[`${intlPrefix}.pictureType`]);
        e.target.value = '';
        return false;
      } else if (size > fileMaxSize) {
        // 判断是否大于1M
        Choerodon.prompt(UserStore.languages[`${intlPrefix}.imgSize`]);
        e.target.value = '';
        return false;
        // 判断是否为0
      } else if (size <= 0) {
        Choerodon.prompt(UserStore.languages[`${intlPrefix}.imgSizeNull`]);
        e.target.value = '';
        return false;
      } else {
        // 如果满足前两个就可以开始搞事情了
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          this.setState({ src: reader.result });
        });
        reader.readAsDataURL(e.target.files[0]);
        // 解决input = file 两次上传同一文件onChange事件不触发
        e.target.value = '';
      }
    } else {
      return false;
    }
  };

  onImageLoaded = (image, pixelCrop) => {
    this.imageRef = image;
    this.makeClientCrop(this.state.crop, pixelCrop);
  };

  onCropComplete = (crop, pixelCrop) => {
    // console.log('onCropComplete', { crop, pixelCrop });
    this.makeClientCrop(crop, pixelCrop);
  };

  onCropChange = (crop) => {
    // console.log('onCropChange', crop);
    this.setState({ crop });
  };

  // 开始拖拽
  onDragStart = () => {
    // console.log('onDragStart');
  };

  // 结束拖拽
  onDragEnd = () => {
    // console.log('onDragEnd');
  };

  // 这个是画预览图啦  用canvas,水印那块快搞死的东西
  getCroppedImg(image, pixelCrop, fileName) {
    // console.log('getCroppedImg', { image, pixelCrop, fileName });
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    // ctx.globalAlpha=1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        // const base64 = this.blobToDataURL(blob);
        blob.name = fileName; // eslint-disable-line no-param-reassign
        window.URL.revokeObjectURL(this.fileUrl);
        this.fileUrl = window.URL.createObjectURL(blob);
        const croppedImageUrl = this.fileUrl;
        resolve({ croppedImageUrl, croppedImageObject: blob });
      }, 'image/png');
    });
  }

  // 这个是画预览图啦  用canvas,水印那块快搞死的东西
  getCroppedImg_s(image, pixelCrop, fileName) {
    // console.log('getCroppedImg', { image, pixelCrop, fileName });
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#04173F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        // const base64 = this.blobToDataURL(blob);
        blob.name = fileName; // eslint-disable-line no-param-reassign
        window.URL.revokeObjectURL(this.fileUrl);
        this.fileUrl = window.URL.createObjectURL(blob);
        const croppedImageUrl_s = this.fileUrl;
        resolve({ croppedImageUrl_s, croppedImageObject: blob });
      }, 'image/png');
    });
  }

  // 这个是画预览图啦  用canvas,水印那块快搞死的东西
  getCroppedImg_two(image, pixelCrop, fileName) {
    // console.log('getCroppedImg', { image, pixelCrop, fileName });
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        // const base64 = this.blobToDataURL(blob);
        blob.name = fileName; // eslint-disable-line no-param-reassign
        window.URL.revokeObjectURL(this.fileUrl);
        this.fileUrl = window.URL.createObjectURL(blob);
        const croppedImageUrl_two = this.fileUrl;
        resolve({ croppedImageUrl_two, croppedImageObject: blob });
      }, 'image/png');
    });
  }

  makeClientCrop(crop, pixelCrop) {
    if (this.imageRef && crop.width && crop.height) {
      this.getCroppedImg(
        this.imageRef,
        pixelCrop,
        'newFile.png',
      ).then(data => this.setState({ croppedImageUrl: data.croppedImageUrl, croppedImageObject: data.croppedImageObject }));
      this.getCroppedImg_s(
        this.imageRef,
        pixelCrop,
        'newFile.png',
      ).then(data => this.setState({ croppedImageUrl_s: data.croppedImageUrl_s}));
      this.getCroppedImg_two(
        this.imageRef,
        pixelCrop,
        'newFile.png',
      ).then(data => this.setState({ croppedImageUrl_two: data.croppedImageUrl_two}));
    }
  }

  renderSelectionAddon = () => (
    <span>
      <button
        type="button"
        style={{
          position: 'absolute',
          bottom: -25,
          right: 74,
        }}
        onClick={() => this.LOGOhandleOk()}
      >
        {UserStore.languages[`ok`]}
      </button>
    </span>
  );

  // 提交
  LOGOhandleOk = () => {
    const { intl, AppState } = this.props;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    const { croppedImageUrl, croppedImageObject } = this.state;
    const files = new window.File([croppedImageObject], 'newFile.png', { type: 'image/png' });
    const data = new FormData();
    data.append('file', files);
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
    };
    this.setState({ submitting: true });
    axios.post(`fileService/v1/${this.organizationId}/file/picture`, data, config)
      .then((res) => {
        if (res.failed) {
          Choerodon.prompt(res.message);
        } else {
          this.setState({
            imgObject: res,
          });
          this.LOGOclose();
        }
        this.setState({ LOGOsubmitting: false });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
        this.setState({ submitting: false });
      });
  };

  // 关闭方法
  LOGOclose() {
    this.setState({
      croppedImageUrl: null,
      croppedImageUrl_two: null,
      croppedImageUrl_s: null,
      src: null,
      LOGOvisible:false,
    });
  }

  // 关闭
  LOGOhandleCancel = () => {
    this.LOGOclose();
  };

  // 上传图片
  LOGOuploadImg = () => {
    const button = document.getElementById('uploadButton');
    button.click();
  };

  renderContainer() {
    const { croppedImageUrl, croppedImageObject,croppedImageUrl_two,croppedImageUrl_s } = this.state;
    return (
      <div className="App">
        <div className="App-left">
          <div className="App-left-title">{UserStore.languages[`${intlPrefix}.logoUpload`]}</div>
          <div className={this.state.src ? 'App-left-content' : 'App-left-content noborder'}>
            <div className="crop-content-out" style={{position: 'relative',top: '50%',transform: 'translateY(-50%)',maxHeight: '100%'}}>
              {this.state.src ? (
                <ReactCrop
                  className="crop-content"
                  style={{background:'#BFBFBF'}}
                  src={this.state.src}
                  crop={this.state.crop}
                  onImageLoaded={this.onImageLoaded}
                  onComplete={this.onCropComplete}
                  onChange={this.onCropChange}
                  onDragStart={() => this.onDragStart}
                  onDragEnd={this.onDragEnd}
                  // renderSelectionAddon={this.renderSelectionAddon}
                />
              ) : (
                <img width="60px" className="default-imgcontent-big" alt="Crop" src={smallImg} />
              )}
            </div>
          </div>
          <span className="App-left-footer">
            {/*<div className="App-left-footer-tip" style={{width:'265px'}}>上传图片支持PNG、JPG、JPEG格式，且不能大于1M！（LOGO长宽比例为5:1）</div>*/}
            <div className="crop-upload-button" style={{ display: 'none' }}>
              <input type="file" id="uploadButton" onChange={this.LOGOonSelectFile} name='' accept=".jpg,.png,.jpeg" />
            </div>
            <Button className="crop-upload-button-display" onClick={() => this.LOGOuploadImg()}>{this.state.src ? UserStore.languages[`${intlPrefix}.againUpload`] : UserStore.languages[`${intlPrefix}.imgUpload`]}</Button>
          </span>
        </div>
        <div className="App-right">
          <div className="preview-title">{UserStore.languages[`${intlPrefix}.WorkbenchPreview`]}</div>
          {
            croppedImageUrl_two ?
              <div className="crop-content-preview-main" style={{background:'#04173F'}}>
                <img className="preview-imgcontent" alt="Crop" src={croppedImageUrl_s} />
              </div>:
              <div className="crop-content-preview-main" style={{background:'#f0f5fa'}}>
                <img style={{width: '30px'}}  className="preview-imgcontent" alt="Crop" src={smallImg} />
              </div>
          }
          {
            this.state.orgInfo.typeCode==='PUBLIC'?'':(
              <div style={{marginTop:'24px'}}>
                <div className="preview-title">{UserStore.languages[`${intlPrefix}.loginPreview`]}</div>
                {
                  croppedImageUrl_two ?
                    <div className="crop-content-preview-main" style={{marginTop:'15px',background:'#2196F3'}}>
                      <img className="preview-imgcontent" alt="Crop" src={croppedImageUrl_two} />
                    </div>:
                    <div className="crop-content-preview-main" style={{marginTop:'15px',background:'#f0f5fa'}}>
                      <img style={{width: '30px'}}  className="preview-imgcontent" alt="Crop" src={smallImg} />
                    </div>
                }

              </div>

            )
          }

        </div>
      </div>
    );
  }

  // 下载
  downLoadErrorTemplate = () => {
    const Url = this.state.imgObject?this.state.imgObject.imageUrl:this.state.orgInfo?this.state.orgInfo.logoUrl:'';
    const blob = new Blob([Url], { type: 'image/png' });
    if ('msSaveOrOpenBlob' in navigator) { // 判断是ie的浏览器，调用ie文件下载的方法
      // const blob = new Blob([Url], { type: 'image/png' });
      const title = `logo.png`;
      window.navigator.msSaveOrOpenBlob(blob, title);
    } else {
      const blobUrl = window.URL.createObjectURL(blob);
      this.downloadPdfWithUrl(blobUrl, `logo.png`);
    }
  };

  downloadPdfWithUrl = (blobUrl, fileName) => {
    const downloadName = fileName;
    const a = document.createElement('a');
    const imgDiv = document.getElementById("LOGO_IMG");
    imgDiv.appendChild(a);
    a.style.display = 'none';
    a.download = downloadName;
    a.href = blobUrl;
    a.click();
    imgDiv.removeChild(a);
  };


  deleteTemplate=()=>{
    if(this.state.imgObject){
      const {imgObject} = this.state;
      imgObject.imageUrl = '';
      this.setState({
        imgObject
      })
    }
    if(this.state.orgInfo){
      const {orgInfo} = this.state
      orgInfo.logoUrl = '';
      this.setState({
        orgInfo
      })
    }
  };

  // 移出Logo
  LOGOIMGLeave=()=>{

    document.getElementById("logoDown").style.display = 'none';
    document.getElementById("logoDelete").style.display = 'none';
  };

  // 移入Logo
  LOGOIMGEnter=()=>{
    if(this.state.orgInfo){
      if(this.state.orgInfo.logoUrl){
        document.getElementById("logoDown").style.display = 'inline-block';
        document.getElementById("logoDelete").style.display = 'inline-block';
      }
    }
    if(this.state.imgObject){
      if(this.state.imgObject.imageUrl){
        document.getElementById("logoDown").style.display = 'inline-block';
        document.getElementById("logoDelete").style.display = 'inline-block';
      }
    }
  };

  renderSidebarContentRight() {
    const {intl} = this.props;
    const {getFieldDecorator} = this.props.form;
    const {show, editData, tempCheck, tempCheckEmail, orgInfo} = this.state;
    const orgNameList= [];
    if(orgInfo.loginNameList&&orgInfo.loginNameList.length> 0 ){
      orgInfo.loginNameList.forEach((v) => {
        orgNameList.push(<span style={{
          display: 'inline-block',
          paddingLeft: 5,
          paddingRight: 5,
          height: 22,
          fontSize: 12,
          color: '#04173f',
          background: '#EBF6FF',
          borderRadius: '4px',
          marginRight:10,
          marginBottom:10,
        }}>{v}</span>)
      })
    }
    const formItemLayout = {
      labelCol: {
        xs: {span: 24},
        sm: {span: 8},
      },
      wrapperCol: {
        xs: {span: 24},
        sm: {span: 16},
      },
    };
    const inputWidth = 443;
    const uploadButton = (
      <div>
        <Icon type={this.state.loading ? 'loading' : 'add'} />
        <div className="ant-upload-text">Upload</div>
      </div>
    );
    const imageUrl = this.state.imageUrl;
    const { src, LOGOsubmitting } = this.state;
    const modalFooter = [
      <Button key="save" type="primary" disabled={!src} loading={LOGOsubmitting} onClick={this.LOGOhandleOk}>
        {UserStore.languages[`ok`]}
      </Button>,
      <Button disabled={LOGOsubmitting} key="cancel" onClick={this.LOGOhandleCancel}>
        {UserStore.languages[`close`]}
      </Button>,
    ];
    return (
      <Content
        className="sidebar-content"
        values={`${editData.code}`}
      >
        <Form style={{marginTop:15}}>

          <FormItem
            {...formItemLayout}
          >
            <div>
              <div style={{fontSize: 12, color: "#04173f"}}>{UserStore.languages[`${intlPrefix}.loginName`]} </div>
              <div style={{ width: 443, marginTop: 13 }}>{orgNameList}</div>
            </div>

          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('sendEmail', {})(
              <div>
                <div>
                  <Switch defaultChecked={true} checked={tempCheckEmail}
                          onClick={this.handleClickSwitchEmail.bind(this)}/>
                  <span style={{
                    fontSize: 12,
                    marginLeft: 12,
                    color: '#04173F'
                  }}>{UserStore.languages[`${intlPrefix}.useEmail`]}</span>
                </div>
                {tempCheckEmail ?
                  <div style={{
                    width: '90%',
                    paddingTop: 10,
                    paddingBottom: 10,
                    height: 'auto',
                    border: '1px solid #FF919E',
                    background: '#FFE6E8',
                    display: 'flex',
                    borderRadius: '4px',
                    marginTop: 12
                  }}><Icon style={{flex: 0.01, color: 'red', fontSize: 15, marginTop: 2, marginLeft: 10}}
                           type='zhucedenglu-xinxishuru-cuowu'/><span style={{
                    flex: 1,
                    fontSize: 12,
                    color: "#818999",
                    marginLeft: 5
                  }}>{UserStore.languages[`${intlPrefix}.email.cancel.content`]}</span></div> :
                  <div style={{
                    width: '90%',
                    paddingTop: 10,
                    paddingBottom: 10,
                    height: 'auto',
                    border: '1px solid #91CEFF',
                    background: '#E6F4FF',
                    display: 'flex',
                    borderRadius: '4px',
                    marginTop: 12
                  }}><Icon style={{flex: 0.01, color: '#2196f3', fontSize: 19, marginTop: 2, marginLeft: 10}}
                           type='info'/><span style={{
                    flex: 1,
                    fontSize: 12,
                    color: "#818999",
                    marginLeft: 5
                  }}>{UserStore.languages[`${intlPrefix}.email.content`]}</span></div>
                }
              </div>
            )}
          </FormItem>
          {
            this.state.orgInfo.typeCode==='ENTERPRISE'?(
              <div>
                <div>
                  <div style={{ color: '#04173F', fontSize: 14,display: 'flex', alignItems: 'center', marginBottom: 15 }}><span style={{display: 'inline-block', background: '#2196f3', width: 3, height: 14, marginRight: 5}}></span>{UserStore.languages[`${intlPrefix}.personality`]}</div>
                  <FormItem
                    {...formItemLayout}
                    style={{marginBottom:'15px'}}
                  >
                    {getFieldDecorator('tenantDns')(
                      <span>{UserStore.languages[`${intlPrefix}.domainMame`]}<span style={{color:'red'}}>*</span><Input disabled style={{width:'25%'}} type="text" value={this.props.form.getFieldsValue().code.toLowerCase()}/>.{this.state.DnsUrl}</span>
                    )}
                  </FormItem>
                </div>

                <div>
                  <span style={{marginRight:'8px'}}>{UserStore.languages[`${intlPrefix}.welcomeMessage`]}</span>
                  <FormItem
                    className="WelcomeSpeechInput"
                    {...formItemLayout}
                    style={{display:'inline-block'}}
                  >
                    {getFieldDecorator('welcomeMessage',{
                      initialValue: orgInfo.welcomeMessage,
                    })(
                      <MultiLanguageFormItemTwo
                        requestUrl="true"
                        requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.welcome_message : {}}
                        handleMultiLanguageValue={({ retObj, retList }) => {
                          // 将多语言的值设置到当前表单
                          this.props.form.setFieldsValue({
                            welcomeMessage: retObj[this.props.AppState.currentLanguage],
                          });
                          this.setState({
                              multiLanguageValue: {
                                ...this.state.multiLanguageValue,
                                welcome_message: retObj,
                              },
                              multiLanguageList: retList,
                            },()=>{
                              // this.onValuesChangeFrom()
                            }
                          );
                        }}
                        maxLength={14}
                        maxLengthE={28}
                        type="FormItem"
                        FormLanguage={this.state.multiLanguageValue}
                        languageEnv={this.state.languageEnv}
                        descriptionObject={UserStore.languages.multiLanguage}
                        required="true"
                        inputWidth={200}
                      />
                    )}
                  </FormItem>
                </div>
              </div>

            ):''
          }

          <FormItem {...formItemLayout}>
            <div style={{ color: '#04173F', fontSize: 14,display: 'flex', alignItems: 'center', marginBottom: 15 }}><span style={{display: 'inline-block', background: '#2196f3', width: 3, height: 14, marginRight: 5}}></span>{UserStore.languages[`${intlPrefix}.logoUpload`]}<span  style={{paddingLeft:'15px'}}><Icon style={{color:'#2196f3',fontSize:'14px',verticalAlign: 'inherit'}} type='shurutixing' /><span  style={{fontSize:'12px',paddingLeft:'8px',color:'#818999'}}>{UserStore.languages[`${intlPrefix}.loginSupport`]}</span></span> </div>
            <div className="LOGO_tenantOrganization">
              <div
                className="LOGO_IMG"
                id="LOGO_IMG"
                style={{width:'210px',position: 'relative'}}
                onMouseLeave={this.LOGOIMGLeave}
                onMouseEnter={this.LOGOIMGEnter}
              >
                {
                  this.state.imgObject?
                    this.state.imgObject.imageUrl?
                    <div style={{border: '1px dashed #E8E8E8', width: '200px',height: '48px',lineHeight:'44px',background: '#BFBFBF',marginBottom:'8px'}}>
                      <img width='200px' src={this.state.imgObject.imageUrl} alt=""/>
                    </div>
                      :
                      <div className='imgOnNo' onClick={this.LOGOshowModal} style={{ border: '1px dashed #BFBFBF', width: '200px',height: '48px',lineHeight: '44px',textAlign:'center',marginBottom:'8px'}}><Icon style={{fontSize:'32px',color:'#BFBFBF'}} type='tianjia2' /></div>
                  :
                    this.state.orgInfo?
                      this.state.orgInfo.logoUrl?
                        <div style={{border: '1px dashed #E8E8E8', width: '200px',height: '48px',lineHeight:'44px',background: '#BFBFBF',marginBottom:'8px'}}>
                          <img width='200px' src={this.state.orgInfo.logoUrl} alt=""/>
                        </div>
                      :
                        <div className='imgOnNo' onClick={this.LOGOshowModal} style={{ border: '1px dashed #BFBFBF', width: '200px',height: '48px',lineHeight: '44px',textAlign:'center',marginBottom:'8px'}}><Icon style={{fontSize:'32px',color:'#BFBFBF'}} type='tianjia2' /></div>
                    :
                      <div className='imgOnNo' onClick={this.LOGOshowModal} style={{ border: '1px dashed #BFBFBF', width: '200px',height: '48px',lineHeight: '44px',textAlign:'center',marginBottom:'8px'}}><Icon style={{fontSize:'32px',color:'#BFBFBF'}} type='tianjia2' /></div>
                }

                <a onClick={this.LOGOshowModal} style={{color:'#2196f3'}}>{UserStore.languages[`${intlPrefix}.upload`]}</a>
                <a id='logoDown' onClick={this.downLoadErrorTemplate} style={{position: 'absolute',right: '25px',bottom:'0',color:'#2196f3', marginLeft: '16px',display:'none'}}><Icon style={{fontSize:'12px',color:'#2196F3'}} type='xiazai' /></a>
                <a id='logoDelete' onClick={this.deleteTemplate} style={{position: 'absolute',right: '5px',bottom:'0',color:'#2196f3', marginLeft: '16px',display:'none'}}><Icon style={{fontSize:'12px',color:'#2196F3'}} type='shu-shanchu' /></a>
              </div>

              {
                this.state.imgObject?
                  this.state.imgObject.imageUrl?
                  <div style={{marginTop:'24px'}}>
                    <div style={{display: 'inline-block'}}>
                      <span style={{fontSize: '12px',color: '#313E59'}}>{UserStore.languages[`${intlPrefix}.WorkbenchPreview`]}</span>
                      <div style={{ width: '200px',height: '48px',lineHeight:'44px',background: '#04173F',marginTop:'8px'}}>
                        <img width='200px' src={this.state.imgObject.imageUrl} alt=""/>
                      </div>
                    </div>
                    {
                      this.state.orgInfo.typeCode==='PUBLIC'?"":
                        <div style={{display: 'inline-block',marginLeft:'32px'}}>
                          <span style={{fontSize: '12px',color: '#313E59'}}>{UserStore.languages[`${intlPrefix}.loginPreview`]}</span>
                          <div style={{ width: '200px',height: '48px',lineHeight:'44px',background: '#2196F3',marginTop:'8px'}}>
                            <img width='200px' src={this.state.imgObject.imageUrl} alt=""/>
                          </div>
                        </div>
                    }
                  </div>
                    :''
                  :
                  this.state.orgInfo?
                    this.state.orgInfo.logoUrl?
                      <div style={{marginTop:'24px'}}>
                        <div style={{display: 'inline-block'}}>
                          <span style={{fontSize: '12px',color: '#313E59'}}>{UserStore.languages[`${intlPrefix}.WorkbenchPreview`]}</span>
                          <div style={{ width: '200px',height: '48px',lineHeight:'44px',background: '#04173F',marginTop:'8px'}}>
                            <img width='200px' src={this.state.orgInfo.logoUrl} alt=""/>
                          </div>
                        </div>
                        {
                          this.state.orgInfo.typeCode==='PUBLIC'?"":
                            <div style={{display: 'inline-block',marginLeft:'32px'}}>
                              <span style={{fontSize: '12px',color: '#313E59'}}>{UserStore.languages[`${intlPrefix}.loginPreview`]}</span>
                              <div style={{ width: '200px',height: '48px',lineHeight:'44px',background: '#2196F3',marginTop:'8px'}}>
                                <img width='200px' src={this.state.orgInfo.logoUrl} alt=""/>
                              </div>
                            </div>
                        }
                      </div>
                      : ''
                    : ''
              }

              {/*<LOGOUpload visible={this.state.LOGOvisible} />*/}
              <Modal
                title={<span><span>{UserStore.languages[`${intlPrefix}.logoUpload`]}</span><span><Icon style={{color:'#FF9500',marginLeft:'17px',fontSize:'14px'}} type='shurutixing' /><span style={{fontSize: '12px', color: '#818999',textAlign: 'left',lineHeight: '18px',marginLeft:'8px'}}>{UserStore.languages[`${intlPrefix}.uploadProposal`]}</span></span></span>}
                className="LOGOModal"
                visible={this.state.LOGOvisible}
                width={861}
                // closable={false}
                maskClosable={false}
                footer={modalFooter}
                onCancel={this.LOGOhandleCancel}
              >
                {this.renderContainer()}
              </Modal>
            </div>
          </FormItem>
        </Form>
      </Content>
    );
  }

  render() {
    const {intl} = this.props;
    const {loadingBtn} = this.state;
    return (
      <Page
        service={[
          'iam-service.organization.queryOrg',
        ]}
      >
        <Header title={UserStore.languages[`${intlPrefix}.header.title`]}>
          <Permission service={['iam-service.organization.queryOrg']}>
            <Button
              onClick={this.handleSubmit}
              style={{color: '#04173F'}}
              loading={loadingBtn}
            >
              <Icon type="baocun" style={{color: '#2196F3', width: 25}}/>
              {UserStore.languages.save}
            </Button>
          </Permission>
        </Header>
        <Content style={{paddingTop:'0'}}>
          <div style={{display: 'flex', width: '100%',paddingTop:'24px'}}>
            <div style={{flex: 1}}>
              <div style={{color: '#04173F', fontSize: 14, display: 'flex', alignItems: 'center',}}><span
                style={{display: 'inline-block', background: '#2196f3', width: 3, height: 14, marginRight: 5 }}></span>{UserStore.languages[`${intlPrefix}.orgInfo`]}
              </div>
              {this.renderSidebarContent()}
            </div>
            <div style={{flex: 1}}>
              <div style={{color: '#04173F', fontSize: 14, display: 'flex', alignItems: 'center',}}><span
                style={{display: 'inline-block', background: '#2196f3', width: 3, height: 14, marginRight: 5 }}></span>{UserStore.languages[`${intlPrefix}.adminNum`]}
              </div>
              {this.renderSidebarContentRight()}
            </div>
          </div>

        </Content>
      </Page>
    );
  }
}

export default Form.create()(withRouter(injectIntl(tenantOrganizationHome)));
