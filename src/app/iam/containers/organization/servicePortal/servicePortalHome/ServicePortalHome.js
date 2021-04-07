import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { Page, Header, Content, Permission, Action, axios } from 'yqcloud-front-boot';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Dropdown, Checkbox, Input, Menu, Select, Col, Row, Form } from 'yqcloud-ui';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/lib/ReactCrop.scss';
import 'react-image-crop/dist/ReactCrop.css';
import './index.scss';
import './LOGOUpload.scss'
import img from '../../../../assets/images/logo.svg'
import smallImg from "../../../../assets/images/default_image.svg";
import MultiLanguageFormItem from '../NewMultiLanguageFormItem';

const FormItem = Form.Item;
const intlPrefix = 'organization.servicePortal';
const serviceUrl = process.env.SERVICE_PORTALS_HOST||'https://servicePortals.bendi.hand-ams.com'

@injectIntl
@inject('AppState')
@observer
class ServicePortalHome extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {
      displaySelect:'none',
      iconType:'xialaxuanze',
      selectEnable:'ALL',
      ModalVisible: false,
      modalSubmitting:false,
      LOGOvisible:false,
      LOGOsubmitting: false,
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
      // 存放多语言信息
      multiLanguageValue: {
        portal_name: {},
        slogan_text:{},
        description:{},
      },
      data:[],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: ['10', '20','50'],
      },
      organizations:{}, // 租户信息
    };
  }

  componentWillMount() {
    this.loadLanguage();
    this.getLanguage();
    this.queryData();
    this.servicePortalTypeQuery();
    this.servicePortalPermissionQuery();
    this.getOrganizations()
    this.getUrl()
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState ,ServicePortalStore} = this.props;
    const { id } = AppState.currentMenuType;
    ServicePortalStore.queryLanguage(id, AppState.currentLanguage);
  };

  getOrganizations = () =>{
    const {ServicePortalStore}=this.props;
    ServicePortalStore.getOrganization(this.organizationId).then(item=>{
      if(!item.failed){
        this.setState({
          organizations:item
        })
      }
    })
  };

  getUrl = () =>{
    const url = window.location.host;
    // const Urldata = 'yqcloud.dev.cloopm.com';
    const  Urldata = url.substring(url.indexOf('.')+1);
    this.setState({
      DnsUrl: Urldata
    })
  };

  // 查询门户列表
  queryData=()=>{
    const {ServicePortalStore}=this.props;
    ServicePortalStore.getServicePortalListHome(this.organizationId ).then(data=>{
      if(!data.failed){
        ServicePortalStore.setServicePortalList(data.content);
        this.setState({
          data:data.content,
          pagination:{
            current: 1,
            pageSize: 10,
            total: data.totalElements,
            pageSizeOptions: ['10', '20','50'],
          }
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

  /* 多语言，获取系统支持的语言环境 */
  getLanguage = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        });
      });
  };

  showModal = () => {
    this.setState({
      ModalVisible: true,
    });
  };

  // 新建保存
  ModalHandleOk = () => {
    const {ServicePortalStore,form}=this.props;
    this.setState({modalSubmitting:true});
    form.validateFields((err, fieldsValue) => {
      if (!err) {
        if(this.state.imgObject){
          fieldsValue.portalIconUrl=this.state.imgObject.imageUrl;
        }

        fieldsValue.__tls=this.state.multiLanguageValue;
        fieldsValue.themeColor="#2196F3";
        // fieldsValue.iconRedirectUrl="https://yanqian-common.bj.bcebos.com/defaultimages/prod/logo/1.png";
        // fieldsValue.enabled=false;
        ServicePortalStore.establishPortal(this.organizationId,fieldsValue).then(item=>{
          if (item.failed) {
            Choerodon.prompt(item.message);
          } else {
            Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.CreatedSuccessfully`]);
            this.queryData();
            this.setState({
              ModalVisible: false,
            });
          }
          this.setState({
            modalSubmitting:false,
          });
        })
        .catch((error) => {
          Choerodon.handleResponseError(error);
          this.setState({ modalSubmitting: false });
        });
      }else {
        this.setState({ modalSubmitting: false });
      }
    });

  };

  ModalHandleCancel = () => {
    this.setState({
      ModalVisible: false,
      modalSubmitting: false
    });
  };

  // 上传文件的onChange事件
  LOGOonSelectFile = (e) => {
    const { intl,ServicePortalStore } = this.props;
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
  LOGOuploadImg = () => {
    const button = document.getElementById('uploadButton');
    button.click();
  };

 // logo Modal内容
  renderContainer() {
    const { croppedImageUrl } = this.state;
    const {ServicePortalStore}=this.props;
    return (
      <div className="App">
        <div className="App-left">
          <div className="App-left-title">
            <span style={{fontSize:'14px',color:'#595959'}}>{ServicePortalStore.languages[`${intlPrefix}.home.imgCustom`]}</span>
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
              {ServicePortalStore.languages[`${intlPrefix}.home.imgSizeUpload`]}
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
            <div className="App-left-footer-tip" style={{width:'240px',fontSize:'12px',color:'rgba(140,140,140,1)'}}>{ServicePortalStore.languages[`${intlPrefix}.home.imgFormat`]} </div>
            <div className="crop-upload-button" style={{ display: 'none' }}>
              <input type="file" id="uploadButton" onChange={this.LOGOonSelectFile} name='' accept=".jpg,.png,.jpeg" />
            </div>
            <a style={{ float: 'right' }} onClick={() => this.LOGOuploadImg()}>
              {this.state.src ?ServicePortalStore.languages[`${intlPrefix}.img.againUpload`]:ServicePortalStore.languages[`${intlPrefix}.img.Upload`]}
            </a>
          </span>
        </div>
        <div className="App-right">
          <div className="preview-title">{ServicePortalStore.languages[`${intlPrefix}.img.preview`]}}</div>
          {
            croppedImageUrl ?
              <div className="crop-content-preview-main" style={{background:'#fff'}}>
                <img className="preview-imgcontent" alt="Crop" src={croppedImageUrl} />
              </div>:
              <div className="crop-content-preview-main" style={{background:'#f0f5fa'}}>
                <img style={{width: '30px'}}  className="preview-imgcontent" alt="Crop" src={smallImg} />
              </div>
          }

        </div>
      </div>
    );
  }

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
    this.setState({ LOGOsubmitting: true });
    axios.post(`fileService/v1/${this.organizationId}/file/picture`, data, config)
      .then((res) => {
        if (res.failed) {
          Choerodon.prompt(res.message);
        } else {
          this.setState({
            imgObject: res,
            LOGOvisible:false,
          });
        }
        this.setState({ LOGOsubmitting: false });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
        this.setState({ LOGOsubmitting: false });
      });
  };

  // 关闭
  LOGOhandleCancel = () => {
    this.setState({
      croppedImageUrl: null,
      src: null,
      LOGOvisible:false,
      LOGOsubmitting: false
    });
  };

  checkPortalNames=(rule, value, callback)=>{
    const {ServicePortalStore}=this.props;
    if (value) {
      ServicePortalStore.checkPortal(this.organizationId,'portalName',value).then((data) => {
        if (data==='success') {
          callback();
        } else {
          callback(ServicePortalStore.languages[`${intlPrefix}.home.nameRepeat`]);
        }
      });
    } else {
      callback();
    }
  };

  checkPortalNamesInput=(e)=>{
    const {ServicePortalStore}=this.props;
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
              errors: [new Error(ServicePortalStore.languages[`${intlPrefix}.home.nameRepeat`])],
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
    const {ServicePortalStore}=this.props;
    if (value) {
      ServicePortalStore.checkPortal(this.organizationId,'portalCode',value).then((data) => {
        if (data==='success') {
          callback();
        } else {
          callback(ServicePortalStore.languages[`${intlPrefix}.home.codeRepeat`]);
        }
      });
    } else {
      callback();
    }
  };

  //  modal内容
  modalContent = () =>{
    const { getFieldDecorator } = this.props.form;

    const {ServicePortalStore}=this.props;
    const optionArr = [];

    if(this.state.servicePortalTypeCode){
      this.state.servicePortalTypeCode.forEach(item=>{
        optionArr.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>)
      })
    }

    const permissionOptionArr = [];

    if(this.state.servicePortalPermissionCode){
      this.state.servicePortalPermissionCode.forEach(item=>{
        permissionOptionArr.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>)
      })
    }

    const organizationsCode = this.state.organizations.code?this.state.organizations.code.toLowerCase():'';

    // let boxUrl = 'https://qyb.cloopm.com/'
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
    //   console.log(boxUrl)
    //   boxUrl = `.theyancloud${boxUrl[1]}`
    // }

    let webRedirectUriText = `${boxUrl}/portal/`;

    if(webRedirectUriText.length>18){
      webRedirectUriText = (
        <Tooltip title={`${boxUrl}/portal/`}>
          <span>{webRedirectUriText.substring(0, 17)+'...'}</span>
        </Tooltip>
      )
    }
    const contentData=(
        <div>
          <Modal
            title={<span>{ServicePortalStore.languages[`${intlPrefix}.img.uploadImg`]}</span>}
            className="service_logoModal"
            visible={this.state.LOGOvisible}
            width={914}
            // closable={false}
            maskClosable={false}
            onCancel={this.LOGOhandleCancel}
            onOk={this.LOGOhandleOk}
            footer={[
              <Button key="back" onClick={this.LOGOhandleCancel}>
                {ServicePortalStore.languages[`cancle`]}
              </Button>,
              <Button key="submit" loading={this.state.LOGOsubmitting} onClick={this.LOGOhandleOk}>
                {ServicePortalStore.languages[`ok`]}
              </Button>,
            ]}
          >
            {this.renderContainer()}
          </Modal>
          <Form>
            <Row style={{marginTop:'24px'}}>
              <Col span={12}>
                <div>
                  <span style={{verticalAlign: 'super',width: '55px', display: 'inline-block',}}>{ServicePortalStore.languages[`${intlPrefix}.home.logo`]}</span>
                  <div style={{display:'inline-block',position: 'relative',verticalAlign: 'text-top'}}>
                    <div style={{width:"160px",height:'64px',textAlign: 'center',display:'inline-block',marginLeft:'16px',verticalAlign: 'middle',border:'1px solid rgba(232,232,232,1)',borderRadius: '2px'}}>
                      <img width="156px" src={this.state.imgObject?this.state.imgObject.imageUrl:img} alt=""/>
                    </div>
                    <a
                      style={{
                        position: 'absolute',
                        width: '65px',
                        bottom: '0',
                        color: '#2196F3',
                        marginLeft:'8px',
                      }}
                      onClick={()=>{
                        this.setState({
                          LOGOvisible:true
                        })
                      }}
                    >
                      {ServicePortalStore.languages[`${intlPrefix}.home.replaceLogo`]}
                    </a>
                  </div>
                </div>
              </Col>

              <Col span={12} className='portalName_service'>
                {/* 门户名称 */}
                <span style={{width: '55px', display: 'inline-block', verticalAlign: 'middle',}}>{ServicePortalStore.languages[`${intlPrefix}.home.serviceName`]}<span style={{color: 'red'}}>*</span></span>
                <FormItem
                  style={{display:'inline-block',marginLeft:'16px'}}
                >
                  {getFieldDecorator('portalName', {
                    rules: [{
                      required: true,
                      message: ServicePortalStore.languages[`${intlPrefix}.home.fillInserviceName`]
                    },
                      {
                        // validator: this.checkPortalNames,
                      },],
                    // validateTrigger: 'onBlur',
                  })(
                    <MultiLanguageFormItem
                      requestUrl="true"
                      requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.portal_name : {}}
                      onBlur={this.checkPortalNames}
                      onBlurInput={this.checkPortalNamesInput}
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
              </Col>
            </Row>

            <Row style={{marginTop:'16px'}}>
              <Col span={12}>
                {/* 门户代码 */}
                <span style={{width: '55px', display: 'inline-block', verticalAlign: 'middle',}}>{ServicePortalStore.languages[`${intlPrefix}.home.serviceCode`]}<span style={{color: 'red'}}>*</span></span>
                <FormItem
                  style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                >
                  {getFieldDecorator('portalCode', {
                    rules: [{
                      required: true,
                      message: ServicePortalStore.languages[`${intlPrefix}.home.fillInserviceCode`]
                    },
                      {
                        validator: this.checkPortalCodes,
                      },],
                    validateTrigger: 'onBlur',
                  })(
                    <Input placeholder={ServicePortalStore.languages[`${intlPrefix}.home.fillInserviceCode`]} />
                  )}
                </FormItem>
              </Col>

              {/*<Col span={12}>*/}
                {/*/!* 显示名称 *!/*/}
                {/*<span>显示名称</span>*/}
                {/*<FormItem*/}
                  {/*style={{display:'inline-block',marginLeft:'16px'}}*/}
                {/*>*/}
                  {/*{getFieldDecorator('sloganText', {*/}
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
              {/*</Col>*/}

              <Col span={12}>
                {/* 门户描述 */}
                <span style={{width: '55px', display: 'inline-block', verticalAlign: 'middle',}}>{ServicePortalStore.languages[`${intlPrefix}.home.serviceDescription`]}</span>
                <FormItem
                  style={{display:'inline-block',marginLeft:'16px'}}
                >
                  {getFieldDecorator('description', {
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
              </Col>
            </Row>

            <Row style={{marginTop:'16px'}}>
              <Col span={12}>
                {/* 门户类型 */}
                <span style={{width: '55px', display: 'inline-block', verticalAlign: 'middle',}}>{ServicePortalStore.languages[`${intlPrefix}.home.serviceType`]}<span style={{color: 'red'}}>*</span></span>
                <FormItem
                  style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                >
                  {getFieldDecorator('typeCode', {
                    rules: [{
                      required: true,
                      message: ServicePortalStore.languages[`${intlPrefix}.home.fillInserviceType`]
                    }],
                  })(
                    <Select placeholder={ServicePortalStore.languages[`${intlPrefix}.home.fillInserviceType`]}>
                      {optionArr}
                    </Select>
                  )}
                </FormItem>
              </Col>

              <Col span={12}>
                {/* 门户域名 */}
                <span style={{width: '55px', display: 'inline-block', verticalAlign: 'middle',}}>{ServicePortalStore.languages[`${intlPrefix}.home.serviceWebRedirectUri`]}</span>
                <FormItem
                  style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                >
                  {getFieldDecorator('webRedirectUri', {
                  })(
                    <div>
                      <Input style={{width:'85px'}} value={this.state.organizations.code?this.state.organizations.code.toLowerCase():''} disabled />
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
                      <Input style={{width:'85px'}} value={this.props.form.getFieldsValue().portalCode?this.props.form.getFieldsValue().portalCode.toLowerCase():''} disabled />
                    </div>
                  )}
                </FormItem>
              </Col>
            </Row>

            <Row style={{marginTop:'16px'}}>
              <Col span={12}>
                {/* 可见权限 */}
                <span style={{width: '55px', display: 'inline-block', verticalAlign: 'middle',}}>{ServicePortalStore.languages[`${intlPrefix}.home.servicePermissionCode`]}<span style={{color: 'red'}}>*</span></span>
                <FormItem
                  style={{width:'300px',display:'inline-block',marginLeft:'16px'}}
                >
                  {getFieldDecorator('permissionCode', {
                    rules: [{
                      required: true,
                      message: ServicePortalStore.languages[`${intlPrefix}.home.fillInservicePermissionCode`]
                    }],
                  })(
                    <Select placeholder={ServicePortalStore.languages[`${intlPrefix}.home.fillInservicePermissionCode`]}>
                      {permissionOptionArr}
                    </Select>
                  )}
                </FormItem>
              </Col>
            </Row>

          </Form>
        </div>
      );

    return contentData
  };

  // 复制域名
  copyToClip=(copyTxt)=> {
    const {ServicePortalStore}=this.props;
    var createInput = document.createElement('input');
    createInput.value = copyTxt;
    document.body.appendChild(createInput);
    createInput.select(); // 选择对象
    document.execCommand("Copy"); // 执行浏览器复制命令
    createInput.className = 'createInput';
    createInput.style.display='none';
    Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.copySuccess`]);
  };

  // 表格改变时
  handlePageChange = (pagination, filters, sorter, params, ) => {
    this.setState({
      pagination,
    }, () => {
      this.queryTableData(pagination);
    });
  };

  // 查询表格
  queryTableData =(pagination)=>{
    const {ServicePortalStore}=this.props;
    if(this.state.inputSouDetermine){
      ServicePortalStore.getServicePortalListHome(this.organizationId,pagination.current,pagination.pageSize,this.state.inputSouDetermine).then(data=>{
        if(!data.failed){
          this.setState({
            data:data.content,
          })
        }else {
          Choerodon.prompt(data.message);
        }
      })
    }else {
      ServicePortalStore.getServicePortalListHome(this.organizationId,pagination.current,pagination.pageSize).then(data=>{
        if(!data.failed){
          this.setState({
            data:data.content,
          })
        }else {
          Choerodon.prompt(data.message);
        }
      })
    }
  };

  // 搜索按钮
  inputSouClick=()=>{
    const {ServicePortalStore}=this.props;
    const inputSouDetermine=this.state.inputSou;
    const {pagination}=this.state;
    ServicePortalStore.getServicePortalListHome(this.organizationId,1,pagination.pageSize,inputSouDetermine).then(data=>{
      if(!data.failed){
        this.setState({
          data:data.content,
          inputSouDetermine,
          selectEnable:'ALL',
          pagination: {
            current: 1,
            pageSize: 10,
            total: data.totalElements,
            pageSizeOptions: ['10', '20','50'],
          },
        })
      }else {
        Choerodon.prompt(data.message);
      }
    })
  };

  // 失效
  enabledFalse=(record)=>{
    const {ServicePortalStore}=this.props;
    record.enabled=false;
    ServicePortalStore.setEnabledFalse(this.organizationId,record).then(item=>{
      if(!item.failed){
        Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.invalid`]);
        this.queryData()
      }else {
        Choerodon.prompt(item.message);
      }
    })

  };

  // 移除
  deleteHome=(record)=>{
    const {ServicePortalStore}=this.props;
    record.deleted=true;
    ServicePortalStore.setEnabledFalse(this.organizationId,record).then(item=>{
      if(!item.failed){
        Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.remove`]);
        this.queryData()
      }else {
        Choerodon.prompt(item.message);
      }
    })
  };

  // 生效
  enabledTrue=(record)=>{
    const {ServicePortalStore}=this.props;
    record.enabled=true;
    ServicePortalStore.setEnabledFalse(this.organizationId,record).then(item=>{
      if(!item.failed){
        Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.takeEffect`]);
        this.queryData()
      }else {
        Choerodon.prompt(item.message);
      }
    })
  };

  // 查询全部
  selectEnableALL=()=>{
    const {ServicePortalStore}=this.props;
    const inputSouDetermine=this.state.inputSou;
    const {pagination}=this.state;
    ServicePortalStore.getServicePortalListHome(this.organizationId,1,pagination.pageSize,inputSouDetermine).then(data=>{
      if(!data.failed){
        this.setState({
          data:data.content,
          inputSouDetermine,
          selectEnable:'ALL',
          displaySelect:'none',
          iconType:'xialaxuanze',
          pagination: {
            current: 1,
            pageSize: 10,
            total: data.totalElements,
            pageSizeOptions: ['10', '20','50'],
          },
        })
      }else {
        Choerodon.prompt(data.message);
      }
    })
  };

  // 查询有效
  selectEnableTrue=()=>{
    const {ServicePortalStore}=this.props;
    const inputSouDetermine=this.state.inputSou;
    const {pagination}=this.state;
    ServicePortalStore.getServicePortalListHome(this.organizationId,1,pagination.pageSize,inputSouDetermine,'true').then(data=>{
      if(!data.failed){
        this.setState({
          data:data.content,
          inputSouDetermine,
          selectEnable:true,
          displaySelect:'none',
          iconType:'xialaxuanze',
          pagination: {
            current: 1,
            pageSize: 10,
            total: data.totalElements,
            pageSizeOptions: ['10', '20','50'],
          },
        })
      }else {
        Choerodon.prompt(data.message);
      }
    })
  };

  // 查询失效
  selectEnableFalse=()=>{
    const {ServicePortalStore}=this.props;
    const inputSouDetermine=this.state.inputSou;
    const {pagination}=this.state;
    ServicePortalStore.getServicePortalListHome(this.organizationId,1,pagination.pageSize,inputSouDetermine,'false').then(data=>{
      if(!data.failed){
        this.setState({
          data:data.content,
          inputSouDetermine,
          selectEnable:false,
          displaySelect:'none',
          iconType:'xialaxuanze',
          pagination: {
            current: 1,
            pageSize: 10,
            total: data.totalElements,
            pageSizeOptions: ['10', '20','50'],
          },
        })
      }else {
        Choerodon.prompt(data.message);
      }
    })
  };

  // 表格行移入
  onMouseEnterRow=(record)=>{
    const newData = [...this.state.data];
    const target = newData.filter(item => record === item)[0];
    if (target) {
      target.onMouse = true;
      this.setState({ data: newData });
    }
  };

  // 表格行移出
  onMouseLeaveRow=(record)=>{
    const newData = [...this.state.data];
    const target = newData.filter(item => record === item)[0];
    if (target) {
      delete target.onMouse;
      this.setState({ data: newData });
    }
  };

  render() {
    const {ServicePortalStore} =this.props;
    const columns = [{
      title: ServicePortalStore.languages[`${intlPrefix}.home.serviceName`],
      dataIndex: 'portalName',
      width:'430px',
      key: 'portalName',
      render: (value,record) => {
        let colorData='';
        let typeCodeData='';
        if(this.state.servicePortalTypeCode){
          this.state.servicePortalTypeCode.forEach(item=>{
            if(record){
              if(record.typeCode===item.lookupValue){
                typeCodeData=item.lookupMeaning;
                if(record.typeCode==='KNOWLEDGE'){
                  colorData = '#FFAD29';
                }else if(record.typeCode==='SERVICE'){
                  colorData = '#9080FF';
                }else if(record.typeCode==='PROJECT'){
                  colorData = '#4DB5FF';
                }else if(record.typeCode==='PRODUCT'){
                  colorData = '#43DCD6';
                }
              }
            }
          })
        }

        let title = record.portalName;
        if(title){
          if(title.length>12){
            title = title.substring(0, 12)+'...'
          }
        }

        return (
          <div>
            <div style={{float: 'left',width:'100px'}}>
              <img width='95px' src={record.portalIconUrl?record.portalIconUrl:img} alt=""/>
            </div>
            <div style={{float: 'right',width:'280px'}}>
              <div>
                <Tooltip title={record.portalName}>
                <span
                  className={!record.enabled?"":"service_table_title"}
                  style={{fontSize:'14px',fontWeight: '600'}}
                  onClick={() => {
                    if(record.enabled){
                      return this.props.history.push(`servicePortals/edit?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}&idData=${record.id}`);
                    }
                  }}
                >
                  {title}
                </span>
                </Tooltip>

                <Tooltip title={typeCodeData}>
                  <span
                    className='typeCodeData_span'
                    style={{
                      background: colorData,
                    }}
                  >
                    {typeCodeData}
                  </span>
                </Tooltip>

                {
                  !record.enabled?(
                    <Tooltip title={typeCodeData}>
                      <span
                        className='invalid_span'
                        style={{
                        }}
                      >
                        {ServicePortalStore.languages[`${intlPrefix}.invalid`]}
                      </span>
                    </Tooltip>
                  ):''
                }

              </div>
              <div>
                {record.description&&record.description.length>22?(
                  <Tooltip title={record.description}>
                    <span style={{color:'#6e6e6e'}}>
                      {record.description.substring(0, 21)+'...'}
                    </span>
                  </Tooltip>
                ):(
                  <span>{record.description}</span>
                )}
              </div>
            </div>

          </div>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.home.serviceWebRedirectUri`],
      dataIndex: 'webRedirectUri',
      key: 'webRedirectUri',
      width:'300px',
      render: (value,record) => {
        const organizationsCode = this.state.organizations.code?this.state.organizations.code.toLowerCase():'';
        const portalCode=record.portalCode?record.portalCode.toLowerCase():'';
        // let boxUrl = 'https://xxasa.cloopm.com';
        let boxUrl = serviceUrl;
        boxUrl = boxUrl.replace('servicePortals', organizationsCode);
        // if(boxUrl.indexOf('demo')>=0){
        //   boxUrl = boxUrl.replace('v2', organizationsCode);
        // }else if(boxUrl.indexOf('dev')>=0){
        //   boxUrl = boxUrl.replace('yqcloud', organizationsCode);
        // }else if(boxUrl.indexOf('staging')>=0){
        //   boxUrl = boxUrl.replace('yqcloud', organizationsCode);
        // }else if(boxUrl.indexOf('cloopm')>=0 && boxUrl.indexOf('demo')<0){
        //   // boxUrl = boxUrl.replace('yqcloud', organizationsCode);
        //   boxUrl = boxUrl.split('cloopm');
        //   boxUrl = `${organizationsCode}.theyancloud${boxUrl[1]}`
        // }

        let textData=`${boxUrl}/portal/${portalCode}`;
        const textDatas=`${boxUrl}/portal/${portalCode}`;
        if(textData&&textData.length>34){
          textData = textData.substring(0, 33)+'...'
        }

        return (
          <div>
            <div><span style={{color:'#6e6e6e'}}>{ServicePortalStore.languages[`${intlPrefix}.home.webRedirectUri`]}</span></div>
            <div>
              <Tooltip title={textDatas}><span style={{display: 'inline-block',height: '21px'}} className={!record.enabled?"":"service_table_title"}>{textData}</span></Tooltip>
              {record.enabled&&record.onMouse?(
                <span>
                <Tooltip title={ServicePortalStore.languages[`${intlPrefix}.jump`]}>
                  <a target="_blank" href={`${textDatas}`}>
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
                    onClick={()=>{this.copyToClip(textDatas)}}
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
              ):''}
            </div>
          </div>
        )
      }
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.home.UpdatedBy`],
      dataIndex: 'lastUpdatedName',
      key: 'lastUpdatedName',
      render: (value) => {
        return (
          <div>
            <div><span style={{color:'#6e6e6e'}}>{ServicePortalStore.languages[`${intlPrefix}.home.UpdatedBy`]}</span></div>
            <div><span>{value}</span></div>
          </div>
        )
      }
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.home.UpdatedTime`],
      dataIndex: 'lastUpdateDate',
      key: 'lastUpdateDate',
      render: (value) => {
        return (
          <div>
            <div><span style={{color:'#6e6e6e'}}>{ServicePortalStore.languages[`${intlPrefix}.home.UpdatedTime`]}</span></div>
            <div><span>{value}</span></div>
          </div>
        )
      }
    }, {
      title:  ServicePortalStore.languages[`${intlPrefix}.home.servicePermissionCode`],
      dataIndex: 'permissionCode',
      key: 'root',
      render: (value,record) =>{
        let valuetext = value;
        if(this.state.servicePortalPermissionCode){
          this.state.servicePortalPermissionCode.forEach(item=>{
            if(value===item.lookupValue){
              valuetext=item.lookupMeaning
            }
          })
        }
        return (
          <span
            style={{
              padding:'0 8px',
              border: '1px solid #dadfe8',
              borderRadius: '4px',
              color: '#69758c',
              height: '24px',
              lineHeight: '24px',
              display: 'inline-block',
            }}
          >
          {valuetext}
        </span>
        )
      }
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.action`],
      key: 'action',
      width:'60px',
      render: (text, record) =>{
        const serviceMenu = (
          <Menu>
            <Menu.Item>
              <a onClick={()=>this.enabledTrue(record)}>{ServicePortalStore.languages[`${intlPrefix}.takeEffect_text`]}</a>
            </Menu.Item>
            <Menu.Item>
              <a onClick={()=>this.deleteHome(record)}>{ServicePortalStore.languages[`${intlPrefix}.remove_text`]}</a>
            </Menu.Item>
          </Menu>
        );

        const serviceMenu_false = (
          <Menu>
            <Menu.Item>
              <a onClick={()=>this.enabledFalse(record)}>{ServicePortalStore.languages[`${intlPrefix}.invalid_text`]}</a>
            </Menu.Item>
          </Menu>
        );

        return record.onMouse?(
          <Dropdown placement="bottomRight" trigger="click" overlay={!record.enabled?serviceMenu:serviceMenu_false}>
          <span
            style={{
              cursor: 'pointer',
              display: 'inline-block',
              width:'100%'
            }}
          >
            ...
          </span>
          </Dropdown>
        ):''
      }
    }];

    return (
      <Page className="page_servicePortal">
        <Header title={ServicePortalStore.languages[`${intlPrefix}.home.title`]} />
        <Content className="servicePortal">
          <div style={{paddingBottom:'10px',borderBottom:'1px solid #dce1e6',width:'100%',position: 'relative'}} className="servicePortal_harder">
            <div className="formInputSou">
              <Icon onClick={this.inputSouClick} className="input_icon" type="sousuo" />
              <input value={this.state.inputSou} onKeyDown={this.inputSouClick} onChange={(e)=>this.setState({inputSou:e.target.value})} placeholder={ServicePortalStore.languages[`${intlPrefix}.home.search`]}/>
            </div>
            <Button
              className="formNew"
              style={{background:"#2196F3",verticalAlign:"top",border:'1px solid #2196F3',color: '#fff',height:'32px'}}
              onClick={this.showModal}
            >
              <Icon style={{height:'32px',lineHeight:'32px',fontSize:'14px', color: '#fff'}} type="xinjian-"/>
              <span style={{ height:'32px',lineHeight:'32px',fontSize:'14px',color: '#fff'}}>{ServicePortalStore.languages[`create`]}</span>
            </Button>
            <span
              className="formChoice"
            >
              <Button
                style={{verticalAlign:"top",border:'1px solid #b8b8b8',height:'32px'}}
                onClick={()=>{
                  if(this.state.displaySelect==='none'){
                    this.setState({
                      displaySelect:'block',
                      iconType:'xialazhankai'
                    })
                  }else{
                    this.setState({
                      displaySelect:'none',
                      iconType:'xialaxuanze'
                    })
                  }
                }}
              >
                <span style={{ height:'32px',lineHeight:'32px',fontSize:'14px',color: '#8e8e8e'}}>{this.state.selectEnable==='ALL'?ServicePortalStore.languages[`${intlPrefix}.whole`]:this.state.selectEnable?ServicePortalStore.languages[`${intlPrefix}.effective`]:ServicePortalStore.languages[`${intlPrefix}.invalid_text`]}</span>
                <Icon style={{height:'32px',lineHeight:'32px',fontSize:'16px', color: '#8e8e8e'}} type={this.state.iconType}/>
              </Button>
              <div style={{display: this.state.displaySelect}} className="formChoice_select">
                <p onClick={this.selectEnableALL}>{ServicePortalStore.languages[`${intlPrefix}.whole`]}</p>
                <p onClick={this.selectEnableTrue}>{ServicePortalStore.languages[`${intlPrefix}.effective`]}</p>
                <p onClick={this.selectEnableFalse}>{ServicePortalStore.languages[`${intlPrefix}.invalid_text`]}</p>
              </div>
            </span>
          </div>
          <div>
            <Table
              showHeader={false}
              columns={columns}
              dataSource={this.state.data}
              filterBar={false}
              pagination={this.state.pagination}
              onChange={this.handlePageChange}
              onRow={(record, index) => {
                return ({
                  index,
                  onMouseEnter:()=>{this.onMouseEnterRow(record)}, // 移入
                  onMouseLeave: ()=>{this.onMouseLeaveRow(record)},// 移出
                })
              }}
            />
          </div>

          <Modal
            className="service_modal"
            title={ServicePortalStore.languages[`${intlPrefix}.newService`]}
            visible={this.state.ModalVisible}
            onOk={this.ModalHandleOk}
            onCancel={this.ModalHandleCancel}
            footer={[
              <Button key="back" onClick={this.ModalHandleCancel}>
                {ServicePortalStore.languages[`cancle`]}
              </Button>,
              <Button key="submit" type="primary" loading={this.state.modalSubmitting} onClick={this.ModalHandleOk}>
                {ServicePortalStore.languages[`ok`]}
              </Button>,
            ]}
            center
            width="924px"
            destroyOnClose
            afterClose={()=>{
              this.setState({
                imgObject:null,
                croppedImageUrl: null, // 上传的图片对象
                croppedImageObject: null, // 文件blob对象
                file: null, // 上传的文件对象
                src: null,
              })
            }}
            style={{
              margin:'0',
              padding:'0'
            }}
          >
            <div style={{paddingBottom:'24px'}}>
              {this.modalContent()}
            </div>
          </Modal>
        </Content>
      </Page>
    )
  }
}

export default Form.create({})(ServicePortalHome);
