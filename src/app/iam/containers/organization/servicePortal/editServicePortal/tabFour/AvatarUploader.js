import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject } from 'mobx-react';
import { Button, Icon, Modal } from 'yqcloud-ui';
import { axios } from 'yqcloud-front-boot';
import './AvatarUploader.scss';
// import KnowledgeTemplateStore from '../../../../stores/knowledgeTemplate';
import UtilStore from '../../../../../stores/util';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/lib/ReactCrop.scss';
import 'react-image-crop/dist/ReactCrop.css';
import bigImg from '../../../../../assets/images/defaultLogo.svg';
import class_logo from '../../../../../assets/images/res_class.png';
import remarks_logo from '../../../../../assets/images/res_remarks_1.png';
import remarks_logo_2 from '../../../../../assets/images/res_remarks_2.png';
import space_logo from '../../../../../assets/images/res_space.png';
import link_logo from '../../../../../assets/images/res_url.png';
import knowledge_logo from '../../../../../assets/images/res_knowledge.png';
import ServicePortalStore from "../../../../../stores/organization/servicePortal";

const intlPrefix = 'organization.servicePortal';

const BackgroundUrl = [];
BackgroundUrl.push(class_logo);
BackgroundUrl.push(remarks_logo);
BackgroundUrl.push(remarks_logo_2);
BackgroundUrl.push(space_logo);
BackgroundUrl.push(link_logo);
BackgroundUrl.push(knowledge_logo);

@inject('AppState')
@injectIntl
export default class AvatarUploader extends Component {
  constructor(props) {
    super(props);
    // this.loadLanguage();
  }

  componentDidMount() {
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { intl, AppState } = this.props;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    UtilStore.queryLanguage(iamOrganizationId, AppState.currentLanguage);
  };

  state = {
    submitting: false,
    jianTouL: true,
    jianTouR: true,
    tuBiaoVs1: false,
    tuBiaoVs2: false,
    tuBiaoVs3: false,
    cutVisible: false,
    tuBiaoVs: {},

    croppedImageUrl: null, // 上传的图片对象
    croppedImageObject: null, // 文件blob对象
    file: null, // 上传的文件对象
    src: null,
    crop: {
      x: 0,
      y: 0,
      aspect: 1,
      width: 100,
    },
  };

  handleOk = () => {
    const { croppedImageUrl, tuBiaoVs } = this.state;
    const keys = Object.keys(tuBiaoVs)
    if (keys.length !== 0) {
      new Promise(resolve => this.uploadPictureToServer(resolve)).then((data) => {
      });
      this.close();
    } else if (croppedImageUrl) {
      new Promise(resolve => this.uploadPictureToServer(resolve)).then((data) => {
      });
      this.close();
    } else {
      Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.logoNull`]);
    }
  };

  close(croppedImageUrl) {
    this.setState({
      croppedImageUrl: null,
      src: null,
      tuBiaoVs: {},
    });
    // this.props.onVisibleChange(false);
  }

  /* 打开头像截取工具 */
  openAvatorUploader = () => {
    this.setState({
      cutVisible: true,
    });
  };

  handleVisibleChange = (visible) => {
    this.setState({ cutVisible: visible });
  };

  changeCover = (value) => {
    if (value !== '') {
      this.setState({ croppedImageUrl: value.imageUrl });
    }
  };

  bgTuBiaoClickAll = (object, index) => {
    const tuBiaoVs = {};
    tuBiaoVs[index] = !tuBiaoVs[index];
    this.setState({
      croppedImageUrl: object,
      tuBiaoVs,
      src: BackgroundUrl[index],
    });
  };

  tuBiaoRightClick=() => {
    /* const element = document.getElementById('kb-tuBiao-ul-id');
    const elementRight = element.style.right;
    const elementRightInt = elementRight ? parseInt(elementRight.substring(0, elementRight.length - 2), 10) : 0;
    if (elementRightInt >= 0) {
      const rightUl = elementRightInt + '636px';
      $('.kb-tuBiao-ul').animate({ right: rightUl });
    } */
    // 先注释掉   后期有用
    $('.kb-tuBiao-ul').animate({ right: '500px' });
  };

  tuBiaoLeftClick=() => {
    /* const element = document.getElementById('kb-tuBiao-ul-id');
    const elementLeft = element.style.right;
    const elementLeftInt = elementLeft ? parseInt(elementLeft.substring(0, elementLeft.length - 2), 10) : 0;
    if (elementLeftInt <= 636 && elementLeftInt >= 0) {
      const leftUl = elementLeftInt - '636px';
      $('.kb-tuBiao-ul').animate({ right: leftUl });
    } */
    $('.kb-tuBiao-ul').animate({ right: '0' });
  };

  renderBackgroundKu() {
    const { tuBiaoVs, jianTouL, jianTouR } = this.state;
    return (
      <div>
        <div className="render-bgColor-box">
          <div onClick={() => this.tuBiaoLeftClick()} className="kb-tubiao-left-jiantou"><Icon type="fenye2" /></div>
          <div className="test">
            <ul className="kb-tuBiao-ul" id="kb-tuBiao-ul-id">
              {BackgroundUrl.map((v, i) => (
                <li onClick={() => this.bgTuBiaoClickAll(v, i)}>
                  <span
                    className="img-style"
                  >
                    {tuBiaoVs[i] ? <Icon type="shu-bianjibaocun" /> : null}
                    <img
                      src={v}
                      style={{
                        border: tuBiaoVs[i] ? 'solid 1px rgba(33, 150, 243, 0.65)' : 'none' ,
                        borderRadius: '2px'
                      }}
                      alt=""
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div onClick={() => this.tuBiaoRightClick()} className="kb-tubiao-right-jiantou"><Icon type="fenye3" /></div>
        </div>
      </div>
    );
  }

  // 上传文件的onChange事件
  onSelectFile = (e) => {
    const { intl } = this.props;
    let fileSize = 0;
    const fileMaxSize = 1024; // 1M
    const fileTypes = ['.jpg', '.png', '.jpeg'];

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
        // Choerodon.prompt(`${UtilStore.language['yqkm.picture.cut.upload.type.tipbefore']}${fileEnd}${UtilStore.language['yqkm.picture.cut.upload.type.tipafter']}`);
        Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.img.format`]);
        e.target.value = '';
        return false;
      } else if (size > fileMaxSize) {
        // 判断是否大于1M
        // Choerodon.prompt(UtilStore.language['yqkm.picture.cut.upload.maxSize.tip']);
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
          this.setState({ src: reader.result, tuBiaoVs: {} });
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
      }, 'image/jpeg');
    });
  }

  makeClientCrop(crop, pixelCrop) {
    if (this.imageRef && crop.width && crop.height) {
      this.getCroppedImg(
        this.imageRef,
        pixelCrop,
        'newFile.jpeg',
      ).then(data => this.setState({ croppedImageUrl: data.croppedImageUrl, croppedImageObject: data.croppedImageObject }));
    }
  }

  // 提交
  uploadPictureToServer = (resolve) => {
    const { AppState } = this.props;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    const { croppedImageUrl, croppedImageObject } = this.state;
    const files = new window.File([croppedImageObject], 'newFile.jpeg', { type: 'image/jpeg' });
    const data = new FormData();
    data.append('file', files);
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
    };
    this.setState({ submitting: true });
    axios.post(`fileService/v1/${iamOrganizationId}/file/picture`, data, config)
      .then((res) => {
        if (res.failed) {
          Choerodon.prompt(res.message);
        } else {
          resolve(res);
          this.props.handleLogoModal(false,res.imageUrl);
        }
        this.setState({ submitting: false });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
        this.setState({ submitting: false });
      });
  };

  // 关闭
  handleCancel = () => {
    this.props.handleLogoModal(false);
    this.close();
  };

  // 上传图片
  uploadImg = () => {
    const button = document.getElementById('uploadButton_tabFour');
    button.click();
  };

  renderContainer() {
    const { croppedImageUrl, croppedImageObject } = this.state;
    return (
      <div className="App">
        <div className="App-left">
          {/*<div className="App-left-title">{UtilStore.language['yqkm.picture.cut.upload.original.title']}</div>*/}
          <div className="App-left-title">
            <span style={{fontSize:'14px',color:'#595959',fontWeight:600}}>{ServicePortalStore.languages[`${intlPrefix}.home.imgCustom`]}</span>
            <Icon
              type="jieshi"
              style={{
                fontSize: '14px',
                marginLeft: '8px',
                cursor: 'pointer',
                color: '#2196F3',
                verticalAlign: 'inherit',
              }}
            />
            <span style={{fontSize:'12px',color:'#8C8C8C',marginLeft:'4px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.labelImg_one`]}</span>
          </div>
          <div className={this.state.src ? 'App-left-content' : 'App-left-content noborder'}>
            <div className="crop-content-out">
              {this.state.src ? (
                <ReactCrop
                  className="crop-content"
                  src={this.state.src}
                  crop={this.state.crop}
                  onImageLoaded={this.onImageLoaded}
                  onComplete={this.onCropComplete}
                  onChange={this.onCropChange}
                  onDragStart={() => this.onDragStart}
                  onDragEnd={this.onDragEnd}
                />
              ) : (
                <img width='240px' height='240px' className="default-imgcontent-big" alt="Crop" src={bigImg} />
              )}
            </div>
          </div>
          <span className="App-left-footer">
            {/*<div className="App-left-footer-tip">{UtilStore.language['yqkm.picture.cut.upload.tip']}</div>*/}
            <div className="App-left-footer-tip">{ServicePortalStore.languages[`${intlPrefix}.edit.pictureFormat_two`]}</div>
            <div className="crop-upload-button" style={{ display: 'none' }}>
              <input type="file" id="uploadButton_tabFour" onChange={this.onSelectFile} name='图片名字' accept=".jpg,.png,.jpeg" />
            </div>
            <a style={{float: 'right'}} onClick={() => this.uploadImg()}>{this.state.src ? ServicePortalStore.languages[`${intlPrefix}.img.againUpload`] : ServicePortalStore.languages[`${intlPrefix}.img.uploadImg`]}</a>
          </span>
        </div>
        <div className="App-right">
          {/*<div className="preview-title">{UtilStore.language.preview}</div>*/}
          <div className="preview-title">{ServicePortalStore.languages[`${intlPrefix}.img.preview`]}</div>
          <div className="crop-content-preview-main">
            {croppedImageUrl ? <img className="preview-imgcontent" alt="Crop" src={croppedImageUrl} /> : <img className="preview-imgcontent" alt="Crop" src={bigImg} />}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { visible, AppState } = this.props;
    const { croppedImageUrl, submitting, cutVisible } = this.state;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    const modalFooter = [
      <Button disabled={submitting} key="cancel" onClick={this.handleCancel}>
        {/*{UtilStore.language['cancel']}*/}
        {ServicePortalStore.languages[`cancle`]}
      </Button>,
      <Button key="save" type="primary" loading={submitting} onClick={this.handleOk}>
        {/*{UtilStore.language['save']}*/}
        {ServicePortalStore.languages[`ok`]}
      </Button>,
    ];
    return (
      <div>
        <Modal
          // title={UtilStore.language[`${intlPrefix}.title`]}
          title={<span style={{fontWeight:600,fontSize:'16px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.replaceLogoModel`]}</span>}
          className="service_tab_four_template-info-avatar-modal-kb"
          visible={visible}
          // visible={true}
          width={600}
          // closable={false}
          maskClosable={false}
          footer={modalFooter}
          onCancel={this.handleCancel}
        >
          {this.renderBackgroundKu()}
          <div className="upload-content">
            {/*<div className="upload-content-left">{UtilStore.language[`${intlPrefix}.userset.tip`]}</div>*/}
            <div className="upload-content-left">{ServicePortalStore.languages[`${intlPrefix}.edit.uploadFour`]}</div>
            <div className="upload-content-right" />
          </div>
          <div className="showimg-content">
            {this.renderContainer()}
          </div>
        </Modal>
      </div>
    );
  }
}
