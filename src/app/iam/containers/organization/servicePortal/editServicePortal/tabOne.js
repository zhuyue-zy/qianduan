import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { Page, Header, Content, Permission, Action, axios } from 'yqcloud-front-boot';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Switch, Checkbox, Input, Popover, message, Popconfirm, Progress, Form, Select, Col, Row, } from 'yqcloud-ui';
import img from '../../../../assets/images/logo.svg'
import imgTwo from '../../../../assets/images/logo-two.png'
import ReactCrop from 'react-image-crop';
import smallImg from "../../../../assets/images/default_image.svg";
import MultiLanguageFormItem from '../NewMultiLanguageFormItem';
import ServicePortalStore from '../../../../stores/organization/servicePortal'
import reactCSS from 'reactcss'
import { SketchPicker } from 'react-color'

const FormItem = Form.Item;
const intlPrefix = 'organization.servicePortal';
const serviceUrl = process.env.SERVICE_PORTALS_HOST||'https://servicePortals.bendi.hand-ams.com'

@injectIntl
@inject('AppState')
@observer
class TabOne extends Component {

  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {

      LOGOvisible:false, // logo
      labelLOGOVisible:false, // 标签

      displayColorPicker: false,
      color: '',
      color16: '',

      saveSubmitting:false,
      LOGOSubmitting: false,
      labelLOGOSubmitting: false,
      croppedImageUrl: null, // 上传的图片对象
      croppedImageObject: null, // 文件blob对象
      file: null, // 上传的文件对象
      src: null,
      crop: {
        x: 10,
        y: 10,
        aspect: 2.25,
        width: 50,
      },
      TabPane_one_formClick:false, // tab1是否编辑状态
      // 存放多语言信息
      multiLanguageValue: {
        portal_name: {},
        slogan_text:{},
        description:{},
      },
      organizations:{},
    };
  }

  componentWillMount() {
    // this.loadLanguage();
    this.getLanguage();
    this.getOrganizations();
    this.servicePortalTypeQuery();
    this.servicePortalPermissionQuery();
    this.getTabOne();
    this.getUrl();
    this.props.onChangeThis(this);
  }

  // // 获取语言
  // loadLanguage = () => {
  //   const { AppState } = this.props;
  //   const { id } = AppState.currentMenuType;
  //   ServicePortalStore.queryLanguage(id, AppState.currentLanguage);
  // };

  getUrl = () =>{
    const url = window.location.host;
    // const Urldata = 'yqcloud.dev.cloopm.com';
    const  Urldata = url.substring(url.indexOf('.')+1);
    this.setState({
      DnsUrl: Urldata
    })
  };

  getTabOne=()=> {
    const idData = this.props.urlId;
    ServicePortalStore.getPortalDetails(this.organizationId,idData).then(infoData=>{
      if(!infoData.failed){
        this.setState({
          infoData:infoData|| {},
          multiLanguageValue:infoData.__tls,
          color:infoData.themeColor||'',
          color16:infoData.themeColor||'',
        })
      }

    })
  };

  //  门户类型快码查询
  servicePortalTypeQuery= () => {
    const code = "PORTAL_TYPE";
    axios.get(`fnd/v1/${this.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        if(!data.failed){
          this.setState({
            servicePortalTypeCode: data
          })
        }
      })
  };

  //  权限类型快码查询
  servicePortalPermissionQuery= () => {
    const code = "PORTAL_PERMISSIONS";
    axios.get(`fnd/v1/${this.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        if(!data.failed){
          this.setState({
            servicePortalPermissionCode: data
          })
        }
      })
  };

  getOrganizations = () =>{
    ServicePortalStore.getOrganization(this.organizationId).then(item=>{
      if(!item.failed){
        this.setState({
          organizations:item
        })
      }
    })
  };

  /*  多语言，获取系统支持的语言环境 */
  getLanguage = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        });
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
        Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.img.format`]);
        e.target.value = '';
        return false;
      } else if (size > fileMaxSize) {
        // 判断是否大于1M
        Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.img.size`]);
        e.target.value = '';
        return false;
        // 判断是否为0
      } else if (size <= 0) {
        Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.img.sizeNull`]);
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

  // 画图，用于保存
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

  makeClientCrop(crop, pixelCrop) {
    if (this.imageRef && crop.width && crop.height) {
      this.getCroppedImg(
        this.imageRef,
        pixelCrop,
        'newFile.png',
      ).then(data => this.setState({
        croppedImageUrl: data.croppedImageUrl,
        croppedImageObject: data.croppedImageObject
      }));
    }
  }

  // 上传图片
  tabOneLOGOuploadImg = () => {
    const button = document.getElementById('uploadButton_tabOne');
    button.click();
  };

  // logo Modal内容
  renderContainer() {
    const { croppedImageUrl } = this.state;
    return (
      <div className="App">
        <div className="App-left">
          <div className="App-left-title">
            <span style={{fontSize:'14px',color:'#595959'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.customImg`]}</span>
            <span>
               <Icon
                 type="jieshi"
                 style={{
                   fontSize: '14px',
                   marginLeft: '16px',
                   cursor: 'pointer',
                   color: '#2196F3',
                   verticalAlign: 'inherit',
                 }}
               />
            </span>
            <span style={{fontSize:'12px',color:'#8C8C8C',marginLeft:'4px'}}>
              {ServicePortalStore.languages[`${intlPrefix}.edit.proposalImg_one`]}
            </span>
          </div>
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
            <div className="App-left-footer-tip" style={{width:'240px',fontSize:'12px',color:'rgba(140,140,140,1)'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.pictureFormat_one`]}</div>
            <div className="crop-upload-button" style={{ display: 'none' }}>
              <input type="file" id="uploadButton_tabOne" onChange={this.LOGOonSelectFile} name='' accept=".jpg,.png,.jpeg" />
            </div>
            <a style={{ float: 'right' }} onClick={() => this.tabOneLOGOuploadImg()}>
              {this.state.src ?ServicePortalStore.languages[`${intlPrefix}.img.againUpload`]:ServicePortalStore.languages[`${intlPrefix}.img.uploadImg`]}
            </a>
          </span>
        </div>
        <div className="App-right">
          <div className="preview-title">{ServicePortalStore.languages[`${intlPrefix}.img.preview`]}</div>
          {
            croppedImageUrl ?
              <div
                className="crop-content-preview-main"
                style={{
                  background:'#fff',
                  width: '250px',
                  height: '100px',
                  lineHeight: '100px',
                }}
              >
                <img
                  className="preview-imgcontent"
                  alt="Crop"
                  src={croppedImageUrl}
                  style={{
                    width:'250px'
                  }}
                />
              </div>:
              <div
                className="crop-content-preview-main"
                style={{
                  background:'#f0f5fa',
                  width: '250px',
                  height: '100px',
                  lineHeight: '100px',
                }}
              >
                <img style={{width: '30px'}}  className="preview-imgcontent" alt="Crop" src={smallImg} />
              </div>
          }

        </div>
      </div>
    );
  }

  // 标签 Modal内容
  renderContainerLabel() {
    const { croppedImageUrl } = this.state;
    return (
      <div className="App">
        <div className="App-left">
          <div className="App-left-title">
            <span style={{fontSize:'14px',color:'#595959'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.customImg`]}</span>
            <span>
               <Icon
                 type="jieshi"
                 style={{
                   fontSize: '14px',
                   marginLeft: '16px',
                   cursor: 'pointer',
                   color: '#2196F3',
                   verticalAlign: 'inherit',
                 }}
               />
            </span>
            <span style={{fontSize:'12px',color:'#8C8C8C',marginLeft:'4px'}}>
              {ServicePortalStore.languages[`${intlPrefix}.edit.labelImg_one`]}
            </span>
          </div>
          <div style={{ width:'240px',height: '240px',lineHeight: '240px'}} className={this.state.src ? 'App-left-content' : 'App-left-content noborder'}>
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
            <div className="App-left-footer-tip" style={{width:'160px',fontSize:'12px',color:'rgba(140,140,140,1)'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.pictureFormat_one`]}</div>
            <div className="crop-upload-button" style={{ display: 'none' }}>
              <input type="file" id="uploadButton_tabOne" onChange={this.LOGOonSelectFile} name='' accept=".jpg,.png,.jpeg" />
            </div>
            <a style={{ float: 'right' }} onClick={() => this.tabOneLOGOuploadImg()}>
              {this.state.src ?ServicePortalStore.languages[`${intlPrefix}.img.againUpload`]:ServicePortalStore.languages[`${intlPrefix}.img.uploadImg`]}
            </a>
          </span>
        </div>
        <div className="App-right">
          <div className="preview-title">{ServicePortalStore.languages[`${intlPrefix}.img.preview`]}</div>
          {
            croppedImageUrl ?
              <div
                className="crop-content-preview-main"
                style={{
                  background:'#fff',
                  width:'140px',
                  height: '140px',
                  lineHeight: '140px',
                }}
              >
                <img
                  className="preview-imgcontent"
                  alt="Crop"
                  src={croppedImageUrl}
                  style={{
                    width:'140px'
                  }}
                />
              </div>:
              <div
                className="crop-content-preview-main"
                style={{
                  background:'#f0f5fa',
                  width: '140px',
                  height: '140px',
                  lineHeight: '140px',
                }}
              >
                <img style={{width: '30px'}}  className="preview-imgcontent" alt="Crop" src={smallImg} />
              </div>
          }

        </div>
      </div>
    );
  }

  // logo modal提交
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
    this.setState({ LOGOSubmitting: true });
    axios.post(`fileService/v1/${this.organizationId}/file/picture`, data, config)
      .then((res) => {
        if (res.failed) {
          Choerodon.prompt(res.message);
        } else {
          this.setState({
            croppedImageUrl: null,
            src: null,
            logoImgObject: res,
            LOGOvisible:false,
          });
        }
        this.setState({ LOGOSubmitting: false });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
        this.setState({ LOGOSubmitting: false });
      });
  };

  // 标签logo modal提交
  labelLOGOHandleOk = () => {
    const { intl, AppState } = this.props;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    const { croppedImageUrl, croppedImageObject } = this.state;
    const files = new window.File([croppedImageObject], 'newFile.png', { type: 'image/png' });
    const data = new FormData();
    data.append('file', files);
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
    };
    this.setState({ labelLOGOSubmitting: true });
    axios.post(`fileService/v1/${this.organizationId}/file/picture`, data, config)
      .then((res) => {
        if (res.failed) {
          Choerodon.prompt(res.message);
        } else {
          this.setState({
            croppedImageUrl: null,
            src: null,
            labelLogoImgObject: res,
            labelLOGOVisible:false,
          });
        }
        this.setState({ labelLOGOSubmitting: false });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
        this.setState({ labelLOGOSubmitting: false });
      });
  };

  // logo modal关闭
  LOGOhandleCancel = () => {
    this.setState({
      croppedImageUrl: null,
      src: null,
      LOGOvisible:false,
    });
  };

  // logo modal关闭
  labelLOGOHandleCancel = () => {
    this.setState({
      croppedImageUrl: null,
      src: null,
      labelLOGOVisible:false,
    });
  };

  // 复制域名
  copyToClip=(copyTxt)=> {
    var createInput = document.createElement('input');
    createInput.value = copyTxt;
    document.body.appendChild(createInput);
    createInput.select(); // 选择对象
    document.execCommand("Copy"); // 执行浏览器复制命令
    createInput.className = 'createInput';
    createInput.style.display='none';
    Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.copySuccess`]);
  };

  handleClickColor = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  };

  handleCloseColor = () => {
    this.setState({ displayColorPicker: false })
  };

  handleChangeColor = (color) => {
    const color16=this.hexIfy16(`rgba(${ color.rgb.r }, ${ color.rgb.g }, ${ color.rgb.b }, ${ color.rgb.a })`).toUpperCase();
    this.setState({
      color: color.rgb,
      color16
    })
  };

  hexIfy16=(color)=> {
    var values = color
      .replace(/rgba?\(/, '')
      .replace(/\)/, '')
      .replace(/[\s+]/g, '')
      .split(',');
    var a = parseFloat(values[3] || 1),
      r = Math.floor(a * parseInt(values[0]) + (1 - a) * 255),
      g = Math.floor(a * parseInt(values[1]) + (1 - a) * 255),
      b = Math.floor(a * parseInt(values[2]) + (1 - a) * 255);
    return "#" +
      ("0" + r.toString(16)).slice(-2) +
      ("0" + g.toString(16)).slice(-2) +
      ("0" + b.toString(16)).slice(-2);
  };

  // 保存
  saveOnClick=()=>{
    const {form}=this.props;
    const {infoData}=this.state;
    this.setState({saveSubmitting:true});
    form.validateFields((err, fieldsValue) => {
      if (!err) {
        infoData.portalIconUrl=this.state.logoImgObject?this.state.logoImgObject.imageUrl:infoData.portalIconUrl; // 门户logo
        infoData.iconRedirectUrl=this.state.labelLogoImgObject?this.state.labelLogoImgObject.imageUrl:infoData.iconRedirectUrl; // 标签logo
        infoData.portalName=fieldsValue.portalName; // 门户名称
        infoData.portalCode=fieldsValue.portalCode; // 门户代码
        infoData.sloganText=fieldsValue.sloganText; // 显示名称
        infoData.description=fieldsValue.description; // 描述
        infoData.typeCode=fieldsValue.typeCode; // 门户类型
        infoData.permissionCode=fieldsValue.permissionCode; // 权限
        infoData.themeColor=this.state.color16; // 主题颜色
        infoData.__tls=this.state.multiLanguageValue; // 多语言

        ServicePortalStore.setEnabledFalse(this.organizationId,infoData).then(item=>{
          if(!item.failed){
            Choerodon.prompt(ServicePortalStore.languages[`save.success`]);
            this.getTabOne();
            this.props.handleTabOne();
            this.setState({
              saveSubmitting:false,
              TabPane_one_formClick:false,
            });
          }else {
            Choerodon.prompt(item.message);
            this.setState({
              saveSubmitting: false,
            });
          }
        })
          .catch((error) => {
            Choerodon.handleResponseError(error);
            this.setState({
              saveSubmitting: false,
            });
          });
      }else {
        this.setState({
          saveSubmitting: false,
        });
      }
    })
  };

  cancelOnClick=()=>{
    const {infoData}=this.state;

    this.setState({
      TabPane_one_formClick:false,
      color:infoData&&infoData.themeColor?infoData.themeColor:'',
      color16:infoData&&infoData.themeColor?infoData.themeColor:'',
      logoImgObject:'',
      labelLogoImgObject:'',
    });
  };

  checkPortalNames=(rule, value, callback)=>{
    if (value) {
      ServicePortalStore.checkPortal(this.organizationId,'portalName',value).then((data) => {
        if (data==='success') {
          callback();
        } else {
          callback(ServicePortalStore.languages[`${intlPrefix}.nameRepeat`]);
        }
      });
    } else {
      callback();
    }
  };

  checkPortalNamesInput=(e)=>{
    const value = e.target.value;
    if(value){
      ServicePortalStore.checkPortal(this.organizationId,'portalName',value).then((data) => {
        if (data==='success') {
          this.props.form.setFields({
            portalName: {
              value: value,
            },
          });
        } else {
          this.props.form.setFields({
            portalName: {
              value: value,
              errors: [new Error(ServicePortalStore.languages[`${intlPrefix}.nameRepeat`])],
            },
          });
        }
      });
    } else {
      this.props.form.setFields({
        portalName: {
          value: e.target.value,
        },
      });
    }
  };

  checkPortalCodes=(rule, value, callback)=>{
    if (value&&(value!==(this.state.infoData.portalCode))) {
      ServicePortalStore.checkPortal(this.organizationId,'portalCode',value).then((data) => {
        if (data==='success') {
          callback();
        } else {
          callback(ServicePortalStore.languages[`${intlPrefix}.codeRepeat`]);
        }
      });
    } else {
      callback();
    }
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const {infoData} = this.state;

    const styles = reactCSS({
      'default': {
        color: {
          width: '40px',
          height: '16px',
          borderRadius: '2px',
          background: `${this.state.color&&this.state.color.r?`rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b }, ${ this.state.color.a })`:this.state.color}`,
        },
        swatch: {
          padding: '3px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
          verticalAlign: 'bottom',
          position: 'relative',
          top: '2px',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    });


    const optionArr = [];
    let optionArrText = '';

    if(this.state.servicePortalTypeCode){
      this.state.servicePortalTypeCode.forEach(item=>{
        optionArr.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>)
        if(infoData){
          if(infoData.typeCode===item.lookupValue){
            optionArrText=item.lookupMeaning;
          }
        }
      })
    }

    let permissionOptionArrText = '';
    const permissionOptionArr = [];
    if(this.state.servicePortalPermissionCode){
      this.state.servicePortalPermissionCode.forEach(item=>{
        permissionOptionArr.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>)
        if(infoData){
          if(infoData.permissionCode===item.lookupValue){
            permissionOptionArrText=item.lookupMeaning;
          }
        }
      })
    }


    // let boxUrl = 'https://qyb.cloopm.com/'
    // let boxUrl = 'https://yqcloud.dev.hand-ams.com';
    let boxUrl = serviceUrl;
    boxUrl = boxUrl.split('servicePortals');
    boxUrl = boxUrl[1]
    // if(boxUrl.indexOf('demo')>=0){
    //   boxUrl = boxUrl.split('v2');
    //   boxUrl = boxUrl[1]
    // }else if(boxUrl.indexOf('dev')>=0){
    //   boxUrl = boxUrl.split('yqcloud');
    //   boxUrl = boxUrl[1]
    // }else if(boxUrl.indexOf('staging')>=0){
    //   boxUrl = boxUrl.split('yqcloud');
    //   boxUrl = boxUrl[1]
    // }else if(boxUrl.indexOf('cloopm')>=0 && boxUrl.indexOf('demo')<0){
    //   boxUrl = boxUrl.split('cloopm');
    //   boxUrl = `.theyancloud${boxUrl[1]}`
    // }

    let webRedirectUriText = `${boxUrl}/portal/`;
    let webRedirectUriTextCopy = `${boxUrl}/portal/`;

    if(webRedirectUriText.length>18){
      webRedirectUriText = (
        <Tooltip title={`${boxUrl}/portal/`}>
          <span>{webRedirectUriText.substring(0, 17)+'...'}</span>
        </Tooltip>
      )
    }
    return(
      <div className="tabOne">

        {/*logo*/}
        <Modal
          title={<span>{ServicePortalStore.languages[`${intlPrefix}.home.replaceLogo`]}</span>}
          className="service_logoModal"
          visible={this.state.LOGOvisible}
          width={900}
          // closable={false}
          maskClosable={false}
          onCancel={this.LOGOhandleCancel}
          onOk={this.LOGOhandleOk}
          footer={[
            <Button key="back" onClick={this.LOGOhandleCancel}>
              {ServicePortalStore.languages[`cancle`]}
            </Button>,
            <Button key="submit" type="primary" loading={this.state.LOGOSubmitting} onClick={this.LOGOhandleOk}>
              {ServicePortalStore.languages[`ok`]}
            </Button>,
          ]}
        >
          {this.renderContainer()}
        </Modal>

        {/*标签*/}
        <Modal
          title={<span>{ServicePortalStore.languages[`${intlPrefix}.edit.labelImg`]}</span>}
          className="service_logoModal"
          visible={this.state.labelLOGOVisible}
          width={600}
          // closable={false}
          maskClosable={false}
          onCancel={this.labelLOGOHandleCancel}
          onOk={this.labelLOGOHandleOk}
          footer={[
            <Button key="back" onClick={this.labelLOGOHandleCancel}>
              {ServicePortalStore.languages[`cancle`]}
            </Button>,
            <Button key="submit" type="primary" loading={this.state.labelLOGOSubmitting} onClick={this.labelLOGOHandleOk}>
              {ServicePortalStore.languages[`ok`]}
            </Button>,
          ]}
        >
          {this.renderContainerLabel()}
        </Modal>

        <div>
          <div style={{ borderLeft: '2px solid #2196F3',height: '14px',lineHeight: '14px',marginBottom: '18px'}}>
            <span style={{fontSize:'14px',fontWeight:'600',marginLeft:'4px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.essentialInformation`]}</span>

            {this.state.TabPane_one_formClick?"":(
              <Button style={{zIndex:'99', float: 'right',background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}} onClick={()=>this.setState({TabPane_one_formClick:true})}>
                {ServicePortalStore.languages[`edit`]}
              </Button>
            )}

          </div>
        </div>
        <div>
          <Form>
            <Row>
              <Col span={12}>

                {/* logo */}
                <div>
                  <span style={{display:'inline-block',verticalAlign: 'super',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.home.logo`]}</span>
                  <div style={{display:'inline-block',position: 'relative',}}>
                    <div style={{display:'inline-block',marginLeft:'16px',padding:'5px'}}>
                      <img style={{border:this.state.logoImgObject?'none':infoData&&infoData.portalIconUrl?'none':'1px solid rgba(232,232,232,1)'}} height='48px' src={this.state.logoImgObject?this.state.logoImgObject.imageUrl:infoData&&infoData.portalIconUrl?infoData.portalIconUrl:img} alt=""/>
                    </div>
                    {
                      this.state.TabPane_one_formClick?(
                        <a
                          style={{
                            position: 'absolute',
                            width: '65px',
                            bottom: '0',
                          }}
                          onClick={()=>{
                            this.setState({
                              LOGOvisible:true,
                              crop: {
                                x: 10,
                                y: 10,
                                aspect: 2.25,
                                width: 50,
                              },
                            })
                          }}
                        >
                          {ServicePortalStore.languages[`${intlPrefix}.home.replaceLogo`]}
                        </a>
                      ):''
                    }
                  </div>
                </div>
              </Col>

              <Col span={12}>

                {/* 标签 */}
                <div>
                  <span style={{display:'inline-block',verticalAlign: 'super',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.labelImgLogo`]}</span>
                  <div style={{display:'inline-block',position: 'relative',}}>
                    <div style={{display:'inline-block',marginLeft:'16px',padding:'5px'}}>
                      <img style={{border:this.state.labelLogoImgObject?'none':infoData&&infoData.iconRedirectUrl?'none':'1px solid rgba(232,232,232,1)'}} height='48px' src={this.state.labelLogoImgObject?this.state.labelLogoImgObject.imageUrl:infoData&&infoData.iconRedirectUrl?infoData.iconRedirectUrl:imgTwo} alt=""/>
                    </div>
                    {
                      this.state.TabPane_one_formClick?(
                        <a
                          style={{
                            position: 'absolute',
                            width: '65px',
                            bottom: '0',
                          }}
                          onClick={()=>{
                            this.setState({
                              labelLOGOVisible:true,
                              crop: {
                                x: 10,
                                y: 10,
                                aspect: 1,
                                width: 50,
                              },
                            })
                          }}
                        >
                          {ServicePortalStore.languages[`${intlPrefix}.home.replaceLogo`]}
                        </a>
                      ):''
                    }
                  </div>
                </div>
              </Col>
            </Row>

            <Row>
              <Col className='portalName_service' span={12}>
                {/* 门户名称 */}
                <div
                  style={{marginTop:'12px'}}
                >
                  <span style={{display:'inline-block',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.home.serviceName`]}<span style={{color: 'red'}}>*</span></span>
                  {this.state.TabPane_one_formClick?(
                    <FormItem
                      style={{display:'inline-block',marginLeft:'16px'}}
                    >
                      {getFieldDecorator('portalName', {
                        rules: [{
                          required: true,
                          message: ServicePortalStore.languages[`${intlPrefix}.home.fillInserviceName`]
                        }],
                        initialValue: infoData&&infoData.portalName?infoData.portalName : '',
                      })(
                        <MultiLanguageFormItem
                          onBlur={this.checkPortalNames}
                          onBlurInput={this.checkPortalNamesInput}
                          requestUrl="true"
                          requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.portal_name : {}}
                          handleMultiLanguageValue={({ retObj, retList }) => {
                            // 将多语言的值设置到当前表单
                            this.props.form.setFieldsValue({
                              portalName: retObj[this.props.AppState.currentLanguage],
                            });
                            this.setState({
                                multiLanguageValue: {
                                  ...this.state.multiLanguageValue,
                                  portal_name: retObj,
                                },
                                multiLanguageList: retList,
                              },()=>{
                                // this.onValuesChangeFrom()
                              }
                            );
                          }}
                          maxLength={50}
                          type="FormItem"
                          FormLanguage={this.state.multiLanguageValue}
                          languageEnv={this.state.languageEnv}
                          descriptionObject={ServicePortalStore.languages[`${intlPrefix}.home.serviceName`]}
                          required="true"
                          inputWidth={300}
                          placeholder={ServicePortalStore.languages[`${intlPrefix}.home.fillInserviceName`]}
                        />
                      )}
                    </FormItem>
                  ):(
                    <span
                      style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                    >
                      <Tooltip title={infoData&&infoData.portalName?infoData.portalName.length>20?infoData.portalName:'':''}>
                        <span>
                          {infoData&&infoData.portalName?infoData.portalName.length>20?infoData.portalName.substring(0, 19)+'...':infoData.portalName:''}
                        </span>
                      </Tooltip>
                    </span>
                  )}
                </div>
              </Col>
              <Col span={12}>
                {/* 门户代码 */}
                <div
                  style={{marginTop:'16px'}}
                >
                  <span style={{display:'inline-block',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.home.serviceCode`]}<span style={{color: 'red'}}>*</span></span>
                  {/*{this.state.TabPane_one_formClick?(*/}

                    {/*<FormItem*/}
                      {/*style={{width:'300px',display:'inline-block',marginLeft:'16px'}}*/}
                    {/*>*/}
                      {/*{getFieldDecorator('portalCode', {*/}
                        {/*rules: [{*/}
                          {/*required: true,*/}
                          {/*message: '请填写门户代码'*/}
                        {/*},*/}
                          {/*{*/}
                            {/*validator: this.checkPortalCodes,*/}
                          {/*}],*/}
                        {/*validateTrigger: 'onBlur',*/}
                        {/*initialValue: infoData.portalCode || '',*/}
                      {/*})(*/}
                        {/*<Input placeholder="输入门户代码" />*/}
                      {/*)}*/}
                    {/*</FormItem>*/}
                  {/*):(*/}
                    <span
                      style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                    >
                      <Tooltip title={infoData&&infoData.portalCode?infoData.portalCode.length>20?infoData.portalCode:'':''}>
                        <span>
                          {infoData&&infoData.portalCode?infoData.portalCode.length>20?infoData.portalCode.substring(0, 19)+'...':infoData.portalCode:''}
                        </span>
                      </Tooltip>
                    </span>
                  {/* })} */}
                </div>
              </Col>
            </Row>

            <Row>
              {/*<Col span={12}>*/}

                {/*/!* 显示名称 *!/*/}
                {/*<div*/}
                  {/*style={{marginTop:this.state.TabPane_one_formClick?'0':'24px'}}*/}
                {/*>*/}
                  {/*<span style={{display:'inline-block',width:'80px'}}>显示名称</span>*/}
                  {/*{this.state.TabPane_one_formClick?(*/}
                    {/*<FormItem*/}
                      {/*style={{display:'inline-block',marginLeft:'16px'}}*/}
                    {/*>*/}
                      {/*{getFieldDecorator('sloganText', {*/}
                        {/*initialValue: infoData&&infoData.sloganText? infoData.sloganText : '',*/}
                      {/*})(*/}
                        {/*<MultiLanguageFormItem*/}
                          {/*requestUrl="true"*/}
                          {/*requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.slogan_text : {}}*/}
                          {/*handleMultiLanguageValue={({ retObj, retList }) => {*/}
                            {/*// 将多语言的值设置到当前表单*/}
                            {/*this.props.form.setFieldsValue({*/}
                              {/*sloganText: retObj[this.props.AppState.currentLanguage],*/}
                            {/*});*/}
                            {/*this.setState({*/}
                                {/*multiLanguageValue: {*/}
                                  {/*...this.state.multiLanguageValue,*/}
                                  {/*slogan_text: retObj,*/}
                                {/*},*/}
                                {/*multiLanguageList: retList,*/}
                              {/*},()=>{*/}
                                {/*// this.onValuesChangeFrom()*/}
                              {/*}*/}
                            {/*);*/}
                          {/*}}*/}
                          {/*maxLength={50}*/}
                          {/*type="FormItem"*/}
                          {/*FormLanguage={this.state.multiLanguageValue}*/}
                          {/*languageEnv={this.state.languageEnv}*/}
                          {/*descriptionObject="多语言"*/}
                          {/*required="true"*/}
                          {/*inputWidth={300}*/}
                          {/*placeholder="输入显示名称"*/}
                        {/*/>*/}
                      {/*)}*/}
                    {/*</FormItem>*/}
                  {/*):(*/}
                    {/*<span*/}
                      {/*style={{width:'300px',display:'inline-block',marginLeft:'16px'}}*/}
                    {/*>*/}
                      {/*<Tooltip title={infoData&&infoData.sloganText?infoData.sloganText.length>20?infoData.sloganText:'':''}>*/}
                        {/*<span>*/}
                          {/*{infoData&&infoData.sloganText?infoData.sloganText.length>20?infoData.sloganText.substring(0, 19)+'...':infoData.sloganText:''}*/}
                        {/*</span>*/}
                      {/*</Tooltip>*/}
                    {/*</span>*/}
                  {/*)}*/}
                {/*</div>*/}
              {/*</Col>*/}
              <Col span={12}>

                {/* 门户描述 */}
                <div
                  style={{marginTop:this.state.TabPane_one_formClick?'0':'24px'}}
                >
                  <span style={{display:'inline-block',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.home.serviceDescription`]}</span>
                  {this.state.TabPane_one_formClick?(
                    <FormItem
                      style={{display:'inline-block',marginLeft:'16px'}}
                    >
                      {getFieldDecorator('description', {
                        initialValue: infoData&&infoData.description?infoData.description : '',
                      })(
                        <MultiLanguageFormItem
                          requestUrl="true"
                          requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.description : {}}
                          handleMultiLanguageValue={({ retObj, retList }) => {
                            // 将多语言的值设置到当前表单
                            this.props.form.setFieldsValue({
                              description: retObj[this.props.AppState.currentLanguage],
                            });
                            this.setState({
                                multiLanguageValue: {
                                  ...this.state.multiLanguageValue,
                                  description: retObj,
                                },
                                multiLanguageList: retList,
                              },()=>{
                                // this.onValuesChangeFrom()
                              }
                            );
                          }}
                          maxLength={50}
                          type="FormItem"
                          FormLanguage={this.state.multiLanguageValue}
                          languageEnv={this.state.languageEnv}
                          descriptionObject={ServicePortalStore.languages[`${intlPrefix}.home.serviceDescription`]}
                          required="true"
                          inputWidth={300}
                          placeholder={ServicePortalStore.languages[`${intlPrefix}.home.fillInserviceDescription`]}
                        />
                      )}
                    </FormItem>
                  ):(
                    <span
                      style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                    >
                      <Tooltip title={infoData&&infoData.description?infoData.description.length>20?infoData.description:'':''}>
                        <span>
                          {infoData&&infoData.description?infoData.description.length>20?infoData.description.substring(0, 19)+'...':infoData.description:''}
                        </span>
                      </Tooltip>
                    </span>
                  )}
                </div>
              </Col>

              <Col span={12}>

                {/* 门户类型 */}
                <div
                  style={{marginTop:this.state.TabPane_one_formClick?'0':'24px'}}
                >
                  <span style={{display:'inline-block',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.home.serviceType`]}<span style={{color: 'red'}}>*</span></span>
                  {this.state.TabPane_one_formClick?(
                    <FormItem
                      style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                    >
                      {getFieldDecorator('typeCode', {
                        rules: [{
                          required: true,
                          message: ServicePortalStore.languages[`${intlPrefix}.home.fillInserviceType`]
                        }],
                        initialValue: infoData&&infoData.typeCode?infoData.typeCode : '',
                      })(
                        <Select placeholder={ServicePortalStore.languages[`${intlPrefix}.home.fillInserviceType`]}>
                          {optionArr}
                        </Select>
                      )}
                    </FormItem>
                  ):(
                    <span
                      style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                    >
                      {optionArrText}
                    </span>
                  )}
                </div>
              </Col>
            </Row>

            <Row>
              <Col span={12}>

                {/* 门户域名 */}
                <div
                  style={{marginTop:this.state.TabPane_one_formClick?'0':'24px'}}
                >
                  <span style={{display:'inline-block',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.home.serviceWebRedirectUri`]}</span>
                  {this.state.TabPane_one_formClick?(
                    <FormItem
                      style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                    >
                      {getFieldDecorator('webRedirectUri', {
                      })(
                        <div>
                          <Input style={{width:'85px'}} value={this.state.organizations&&this.state.organizations.code?this.state.organizations.code.toLowerCase():''} disabled />
                          <span
                            style={{
                              display: 'inline-block',
                              width: '130px',
                              overflow: 'hidden',
                              verticalAlign: 'middle',
                              height: '22px',
                            }}
                          >
                            {webRedirectUriText}
                          </span>
                          <Input style={{width:'85px'}} value={infoData&&infoData.portalCode?infoData.portalCode.toLowerCase():''} disabled />
                        </div>
                      )}
                    </FormItem>
                  ):(
                    <span>
                  <span
                    style={{display:'inline-block',marginLeft:'16px'}}
                  >

                    <div style={{color:'#2196F3'}}>
                      <span>{this.state.organizations.code?this.state.organizations.code.toLowerCase():''}</span>
                      <span>{webRedirectUriTextCopy}</span>
                      <span>{infoData&&infoData.portalCode?infoData.portalCode.toLowerCase():''}</span>
                    </div>
                  </span>
                  <span style={{marginLeft:'8px'}}>
                    <Tooltip title={ServicePortalStore.languages[`${intlPrefix}.jump`]}>
                      <a target="_blank" href={`https://${this.state.organizations.code?this.state.organizations.code.toLowerCase():''}${webRedirectUriTextCopy}${infoData&&infoData.portalCode?infoData.portalCode.toLowerCase():''}`}>
                        <Icon
                          type="kongjian-dakaixindanchuang"
                          style={{
                            fontSize: '18px',
                            marginLeft: '8px',
                            cursor: 'pointer',
                            color:'#595959',
                          }}
                        />
                      </a>
                    </Tooltip>

                    <Tooltip title={ServicePortalStore.languages[`${intlPrefix}.copy`]}>
                      <Icon
                        onClick={()=>{this.copyToClip(`https://${this.state.organizations.code?this.state.organizations.code.toLowerCase():''}${webRedirectUriTextCopy}${infoData&&infoData.portalCode?infoData.portalCode.toLowerCase():''}`)}}
                        type="ziyuan"
                        style={{
                          fontSize: '18px',
                          marginLeft: '8px',
                          cursor: 'pointer',
                          color:'#595959',
                        }}
                      />
                    </Tooltip>
                  </span>
                </span>
                  )}
                </div>
              </Col>

              <Col span={12}>
                {/* 主题颜色 */}
                <div
                  style={{marginTop:this.state.TabPane_one_formClick?'0':'24px'}}
                >
                  <span style={{display:'inline-block',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.themeColor`]}<span style={{color: 'red'}}>*</span></span>
                  <span
                    style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                  >
                    <div style={ styles.swatch } onClick={ ()=>{this.state.TabPane_one_formClick?this.handleClickColor():''} }>
                      <div style={ styles.color } />
                    </div>
                    <span style={{marginLeft: '8px'}}>{this.state.color16}</span>
                    {/*<div style={{width:'40px',height:'20px',background:this.state.color16}}>*/}
                    {/*</div>*/}
                  </span>
                  <div style={{position:"relative"}}>
                    <div style={{position:"absolute",top:'-340px',zIndex:1000}}>
                      { this.state.displayColorPicker ? <div style={ styles.popover }>
                        <div style={ styles.cover } onClick={ this.handleCloseColor }/>
                        <SketchPicker color={ this.state.color } onChange={ this.handleChangeColor } />
                      </div> : null }
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            <Row style={{marginTop:this.state.TabPane_one_formClick?'0':'24px'}}>
              <Col span={12}>
                {/* 可见权限 */}
                {this.state.TabPane_one_formClick?(
                    <div>
                      <span style={{display:'inline-block',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.home.servicePermissionCode`]}<span style={{color: 'red'}}>*</span></span>
                      <FormItem
                        style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                      >
                        {getFieldDecorator('permissionCode', {
                          rules: [{
                            required: true,
                            message: ServicePortalStore.languages[`${intlPrefix}.home.fillInservicePermissionCode`],
                          }],
                          initialValue: infoData&&infoData.permissionCode?infoData.permissionCode : '',
                        })(
                          <Select placeholder={ServicePortalStore.languages[`${intlPrefix}.home.fillInservicePermissionCode`]}>
                            {permissionOptionArr}
                          </Select>
                        )}
                      </FormItem>
                    </div>
                  ):(
                  <div
                  >
                    <span style={{display:'inline-block',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.home.servicePermissionCode`]}<span style={{color: 'red'}}>*</span></span>
                    <span
                      style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                    >
                    {permissionOptionArrText}
                  </span>
                  </div>
                )
                }
              </Col>

              <Col span={12}>
                {/* 创建人 */}
                <div>
                  <span style={{display:'inline-block',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.createdBy`]}</span>
                  <span
                    style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                  >
                    {infoData?infoData.createdByName :''}
              </span>
                </div>
              </Col>
            </Row>

            <Row style={{marginTop:this.state.TabPane_one_formClick?'0':'24px'}}>
              <Col span={12}>
                {/* 创建时间 */}
                <div>
                  <span style={{display:'inline-block',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.createdTime`]}</span>
                  <span
                    style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                  >
                    {infoData?infoData.creationDate:''}
                  </span>
                </div>
              </Col>

              <Col span={12}>
                {/* 最后修改人 */}
                <div>
                  <span style={{display:'inline-block',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.lastUpdatedBy`]}</span>
                  <span
                    style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                  >
                    {infoData?infoData.lastUpdatedName:''}
                  </span>
                </div>
              </Col>
            </Row>

            <Row>
              <Col span={12}>
                {/* 最后修改时间 */}
                <div style={{marginTop:'24px'}}>
                  <span style={{display:'inline-block',width:'80px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.lastUpdatedTime`]}</span>
                  <span
                    style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                  >
                    {infoData?infoData.lastUpdateDate:''}
                  </span>
                </div>
              </Col>
            </Row>
          </Form>

          {this.state.TabPane_one_formClick?(
            <div style={{marginTop:'24px'}}>
              <Button onClick={this.saveOnClick} key="back" loading={this.state.saveSubmitting} style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}}>{ServicePortalStore.languages[`save`]}</Button>
              <Button
                onClick={this.cancelOnClick}
                key="back"
                style={{
                  border: '1px solid #ACB3BF',
                  color: '#818999',
                  marginLeft:'12px'
                }}
              >
                {ServicePortalStore.languages[`cancle`]}
              </Button>
            </div>
          ):""}
        </div>
      </div>
    )
  }

}

export default Form.create({})(TabOne);
