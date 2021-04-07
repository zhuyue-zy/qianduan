/**
 *  kaicheng.liu@hand-china.com
 *  
 *  edit by jyjin at 2019.06.03
 *     - 添加宽度自定义
 *     - 添加宽高比自定义缩放
 *     - [WARING] 此组件必须使用 "react-image-crop": "^6.0.18"版本
 *   
**/
import React, { Component } from 'react';
import { Button, Form, Icon, Input, Modal, Select, Upload, message } from 'yqcloud-ui';
import { axios } from 'yqcloud-front-boot';
import './index.scss';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/lib/ReactCrop.scss';
import 'react-image-crop/dist/ReactCrop.css';
import defaultImage from './imgs/default_image.svg'
import WithLanguage from '../language/WithLanguage'
const PREFIX = 'iam.jui.'

class PictureCutAndUpload extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    submitting: false,
    croppedImageUrl: null, // 上传的图片对象
    croppedImageObject: null, // 文件blob对象
    file: null, // 上传的文件对象
    imgObject: '', // 返回父级的图片对象
    src: null,
    crop: {
      x: 10,
      y: 10,
      // aspect: this.props.aspectRatio ? this.props.aspectRatio : 1,
      // aspect: (this.props.ratioRequire) ? (this.props.aspectRatio ? this.props.aspectRatio : 1) : '',
      aspect: (this.props.ratioRequire === undefined && true) ? (this.props.aspectRatio ? this.props.aspectRatio : 1) : '',
      width: 50,
    },
    ext: 'jpeg',
  };

  // 上传文件的onChange事件
  onSelectFile = (e) => {
    const { intl } = this.props;
    let fileSize = 0;
    let ext = this.state.ext
    const fileMaxSize = (this.props.fileMaxSize || 1) * 1024; // 1M
    const fileTypes = this.props.accept && this.props.accept.split(',') || ['.jpg', '.png', '.jpeg'];

    if (e.target.files && e.target.files.length > 0) {
      fileSize = e.target.files[0].size;
      const size = fileSize / 1024;
      const arr = e.target.files[0].name.split('.')
      if (arr.length) {
        ext = arr[arr.length - 1]
      }
      this.setState({ ext })
      let isNext = false;
      const fileEnd = e.target.value.substring(e.target.value.lastIndexOf('.')).toLowerCase();
      for (let i = 0; i < fileTypes.length; i++) {
        if (fileTypes[i] === fileEnd) {
          isNext = true;
          break;
        }
      }
      if (!isNext) {
        // code here wait to finish [应该提示]
        e.target.value = '';
        message.warning(this.props.i18n(PREFIX + 'extError'))
        return false;
      } else if (size > fileMaxSize) {
        // 判断是否大于1M
        // code here wait to finish [应该提示]
        message.warning(this.props.i18n(PREFIX + 'sizeError', size));
        e.target.value = '';
        return false;
        // 判断是否为0
      } else if (size <= 0) {
        // code here wait to finish [应该提示]
        message.warning(this.props.i18n(PREFIX + 'atLeastSelectOne'));
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
  onDragStart = (e) => {
    // console.log('onDragStart');
  };

  // 结束拖拽
  onDragEnd = (e) => {
    // console.log('onDragEnd');
  };

  // 这个是画预览图啦  用canvas,水印那块快搞死的东西
  getCroppedImg(image, pixelCrop, fileName) {
    // console.log('getCroppedImg', { image, pixelCrop, fileName });
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#ffffff";

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
      }, 'image/' + this.state.ext);
    });
  }

  makeClientCrop(crop, pixelCrop) {
    if (this.imageRef && crop.width && crop.height) {
      this.getCroppedImg(
        this.imageRef,
        pixelCrop,
        'newFile.' + this.state.ext,
      ).then(data => this.setState({ croppedImageUrl: data.croppedImageUrl, croppedImageObject: data.croppedImageObject }));
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
        onClick={() => this.handleOk()}
      >
        {this.props.i18n(PREFIX + 'confirm')}
      </button>
    </span>
  );

  // 提交
  handleOk = () => {
    const { croppedImageUrl, croppedImageObject } = this.state;
    const files = new window.File([croppedImageObject], 'newFile.' + this.state.ext, { type: 'image/' + this.state.ext });
    const data = new FormData();
    data.append('file', files);
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
    };
    this.setState({ submitting: true });
    axios.post(`${this.props.actionUrl}`, data, config)
      .then((res) => {
        if (res.failed) {
          Choerodon.prompt(res.message);
        } else {
          this.setState({
            imgObject: res,
          });
          message.success(this.props.i18n(PREFIX + 'uploadSuccess'))
          this.close('submit');
        }
        this.setState({ submitting: false });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
        this.setState({ submitting: false });
      });
  };

  // 关闭方法
  close(type) {
    this.props.onVisibleChange(false);
    this.props.response(this.state.imgObject, type);
    this.setState({
      croppedImageUrl: null,
      src: null,
      imgObject: '',
    });
  }

  // 关闭
  handleCancel = () => {
    this.close('cancel');
  };

  // 上传图片
  uploadImg = () => {
    const button = document.getElementById('uploadButton');
    button.click();
  };

  renderContainer() {
    const { croppedImageUrl, croppedImageObject } = this.state;
    const ratio = this.props.ratio ? (1 / this.props.ratio) : 1;
    return (
      <div className="App">
        <div className="App-left">
          <div className="App-left-title">{this.props.i18n(PREFIX + 'uploadImage')}</div>
          <div className={this.state.src ? 'App-left-content' : 'App-left-content noborder'}>
            <div className="ratio-wrap crop-content-out">
              <div style={{ marginTop: ratio * 100 + '%' }}></div>
              <div className='ratio-content'>
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
                  // renderSelectionAddon={this.renderSelectionAddon}
                  />
                ) : (
                    <div
                      onClick={() => this.uploadImg()}
                      style={{
                        width: '100%',
                        height: '100%',
                        // background: '#F0F5FA',
                        position: 'relative'

                      }}>
                      <img
                        style={{
                          width: 80,
                          height: 60,
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          margin: '-30px -40px'
                        }}
                        alt="Crop" src={defaultImage} />
                    </div>
                  )}
              </div>

            </div>
          </div>
          <span className="App-left-footer">
            <div className="App-left-footer-tip">
              {/* 底部提示 */}
            </div>
            <div className="crop-upload-button" style={{ display: 'none' }}>
              <input type="file" id="uploadButton" onChange={this.onSelectFile} name="上传图片" accept={this.props.accept || ".jpg,.png,.jpeg"} />
            </div>
            {this.state.src ? <span className="crop-upload-button-display" onClick={() => this.uploadImg()}> {this.props.i18n(PREFIX + 'changeImage')}</span> : null}
          </span>
        </div>
        <div className="App-right">
          <div className="preview-title">{this.props.i18n(PREFIX + 'preview')}</div>
          <div
            className="crop-content-preview-main ratio-wrap"
          >
            <div className="ratio-gap" style={{ marginTop: ratio * 100 + '%' }}></div>
            <div className='ratio-content-preview' style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              {croppedImageUrl ?
                <img className="preview-imgcontent" alt="Crop" src={croppedImageUrl} /> : <div
                  style={{
                    width: '100%',
                    height: '100%',
                    // background: '#F0F5FA',
                    position: 'relative'
                  }}>
                  <img style={{ width: 80 / 2, height: 60 / 2, position: 'absolute', top: '50%', left: '50%', margin: '-15px -20px' }} alt="Crop" src={defaultImage} />
                </div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { visible } = this.props;
    const { src, submitting } = this.state;
    const modalFooter = [
      <Button key="save" type="primary" disabled={!src} loading={submitting} onClick={this.handleOk}>
        {this.props.i18n(PREFIX + 'save')}
      </Button>,
      <Button disabled={submitting} key="cancel" onClick={this.handleCancel}>
        {this.props.i18n(PREFIX + 'cancel')}
      </Button>,
    ];
    return (
      <Modal
        title={this.props.title ? this.props.title : this.props.i18n(PREFIX + 'uploadImage')}
        className="j-with-cut-image-upload"
        visible={visible}
        width={this.props.width || 861}
        closable={false}
        maskClosable={false}
        footer={modalFooter}
      >
        {this.renderContainer()}
      </Modal>
    );
  }
}

export default WithLanguage(PictureCutAndUpload)