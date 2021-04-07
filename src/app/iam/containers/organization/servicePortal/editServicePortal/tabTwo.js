import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { Page, Header, Content, Permission, Action, axios } from 'yqcloud-front-boot';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Switch, Checkbox, Input, Popover, message, Popconfirm, Progress, Form, Select, Col, Row, } from 'yqcloud-ui';
import img from '../../../../assets/images/logo.svg'
import ReactCrop from 'react-image-crop';
import smallImg from "../../../../assets/images/default_image.svg";
import MultiLanguageFormItem from '../NewMultiLanguageFormItem';
import ServicePortalStore from '../../../../stores/organization/servicePortal'

const FormItem = Form.Item;
const intlPrefix = 'organization.servicePortal';

@injectIntl
@inject('AppState')
@observer
class TabTwo extends Component {
  constructor(props) {
    super(props);

    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {
      infoData:{},
      backgroundVisible:false, // 背景图
      backgroundSubmitting: false,
      croppedImageUrl: null, // 上传的图片对象
      croppedImageObject: null, // 文件blob对象
      file: null, // 上传的文件对象
      src: null,
      crop: {
        x: 10,
        y: 10,
        aspect: 6,
        width: 50,
      },
      TabPane_two_formClick:false, // tab2是否编辑状态
      // 存放多语言信息
      multiLanguageValue: {
        banner_name:{},
        search_prompt:{},
      },
      saveSubmitting: false,
    };
  }

  componentWillMount() {
    this.getLanguage();
    this.getBanners();
  }

  getBanners = ()=>{
    const idData = this.props.urlId;
    ServicePortalStore.getBanner(this.organizationId,idData).then(item=>{
      if(!item.failed){
        this.objIs(item);
        this.setState({
          infoData:item || {},
          infoDataOriginal:JSON.parse(JSON.stringify(item?item:{})) || {},
        });
      }
    })
  };

  // 判断对象是否为空
  objIs=(obj)=>{
    if (Object.keys(obj).length  === 0) {
      // 空
      this.setState({
        isEdits:false
      })
    } else {
      this.setState({
        isEdits:true,
        multiLanguageValue: obj.__tls,
      })
    }
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
    const fileTypes = ['.png','.jpg','.jpeg'];

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
      }
      // else if (size > fileMaxSize) {
      //   // 判断是否大于1M
      //   Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.img.size`]);
      //   e.target.value = '';
      //   return false;
      //   // 判断是否为0
      // }
      else if (size <= 0) {
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
    const button = document.getElementById('uploadButton_tabTwo');
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
              {ServicePortalStore.languages[`${intlPrefix}.edit.proposalImg_two`]}
            </span>
          </div>
          <div style={{width:'540px',height:'90px'}} className={this.state.src ? 'App-left-content' : 'App-left-content noborder'}>
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
            <div className="App-left-footer-tip" style={{width:'240px',fontSize:'12px',color:'rgba(140,140,140,1)'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.pictureFormat_two`]}</div>
            <div className="crop-upload-button" style={{ display: 'none' }}>
              <input type="file" id="uploadButton_tabTwo" onChange={this.LOGOonSelectFile} name='' accept=".jpg,.png,.jpeg" />
            </div>
            <a style={{ float: 'right' }} onClick={() => this.LOGOuploadImg()}>
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
                  width: '360px',
                  height: '60px',
                  lineHeight: '60px',
                }}
              >
                <img style={{width: '360px'}} className="preview-imgcontent" alt="Crop" src={croppedImageUrl} />
              </div>:
              <div
                className="crop-content-preview-main"
                style={{
                  background:'#f0f5fa',
                  width: '360px',
                  height: '60px',
                  lineHeight: '60px',
                }}
              >
                <img style={{width: '30px'}}  className="preview-imgcontent" alt="Crop" src={smallImg} />
              </div>
          }

        </div>
      </div>
    );
  }

  // 背景图modal提交
  backgroundHandleOk = () => {
    const { intl, AppState } = this.props;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    const { croppedImageUrl, croppedImageObject } = this.state;
    const files = new window.File([croppedImageObject], 'newFile.png', { type: 'image/png' });
    const data = new FormData();
    data.append('file', files);
    const config = {
      headers: { 'Content-Type': 'multipart/form-data' },
    };
    this.setState({ backgroundSubmitting: true });
    axios.post(`fileService/v1/${this.organizationId}/file/picture`, data, config)
      .then((res) => {
        if (res.failed) {
          Choerodon.prompt(res.message);
        } else {
          this.setState({
            croppedImageUrl: null,
            src: null,
            backgroundImgObject: res,
            backgroundVisible:false,
          });
        }
        this.setState({ backgroundSubmitting: false });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
        this.setState({ backgroundSubmitting: false });
      });
  };

  // 背景modal图关闭
  backgroundHandleCancel = () => {
    this.setState({
      croppedImageUrl: null,
      src: null,
      backgroundVisible:false,
    });
  };

  // 数据汇总开关改变时
  dataAggregationOnChange =(e)=>{
    this.props.form.setFieldsValue({
      workbench: e,
    });
    this.setState({
      workbench: true,
    })
  };

  // 保存
  saveOnClick=()=>{
    const {form}=this.props;
    const {infoData}=this.state;
    this.setState({saveSubmitting:true});
    form.validateFields((err, fieldsValue) => {
      // if (!err) {
        infoData.bannerPictureUrl=this.state.backgroundImgObject?this.state.backgroundImgObject.imageUrl:infoData&&infoData.bannerPictureUrl?infoData.bannerPictureUrl:''; // 背景图片
        infoData.bannerName=fieldsValue.bannerName; // 欢迎语
        infoData.workbench=fieldsValue.workbench; // 服务台
        infoData.searchPrompt=fieldsValue.searchPrompt; // 搜索语
        infoData.__tls=this.state.multiLanguageValue; // 多语言
        infoData.portalId=parseInt(this.props.urlId);

        if(this.state.isEdits){
          ServicePortalStore.setBanner(this.organizationId,infoData).then(item=>{
            if(!item.failed){
              Choerodon.prompt(ServicePortalStore.languages[`save.success`]);
              this.getBanners();
              this.setState({
                saveSubmitting:false,
                TabPane_two_formClick:false,
              });
            }else {
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
          ServicePortalStore.newBanner(this.organizationId,infoData).then(item=>{
            if(!item.failed){
              Choerodon.prompt(ServicePortalStore.languages[`save.success`]);
              this.getBanners();
              this.setState({
                saveSubmitting:false,
                TabPane_two_formClick:false,
              });
            }else {
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
        }
      // }else {
      //   this.setState({
      //     saveSubmitting: false,
      //     TabPane_two_formClick:false,
      //   });
      // }
    })
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const {infoData} = this.state;
    return(
      <div>
        {/*背景图*/}
        <Modal
          title={<span>{ServicePortalStore.languages[`${intlPrefix}.edit.backgroundImg`]}</span>}
          className="service_logoModal"
          visible={this.state.backgroundVisible}
          width={1024}
          // closable={false}
          maskClosable={false}
          onCancel={this.backgroundHandleCancel}
          onOk={this.backgroundHandleOk}
          footer={[
            <Button key="back" onClick={this.backgroundHandleCancel}>
              {ServicePortalStore.languages[`cancle`]}
            </Button>,
            <Button key="submit" type="primary" loading={this.state.backgroundSubmitting} onClick={this.backgroundHandleOk}>
              {ServicePortalStore.languages[`ok`]}
            </Button>,
          ]}
        >
          {this.renderContainer()}
        </Modal>

        <div>

          <div>
            <div style={{ borderLeft: '2px solid #2196F3',height: '14px',lineHeight: '14px',marginBottom: '18px'}}>
              <span style={{fontSize:'14px',fontWeight:'600',marginLeft:'4px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.essentialInformation`]}</span>

              {this.state.TabPane_two_formClick?"":(
                <Button style={{zIndex:'99', float: 'right',background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}} onClick={()=>this.setState({TabPane_two_formClick:true})}>
                  {ServicePortalStore.languages[`edit`]}
                </Button>

                // <Tooltip title='编辑'>
                //   <Icon
                //     onClick={()=>{this.setState({TabPane_two_formClick:true})}}
                //     type="kongjian-bianji"
                //     className="editService_formEdit"
                //     style={{
                //       fontSize: '14px',
                //       marginLeft: '8px',
                //       cursor: 'pointer',
                //     }}
                //   />
                // </Tooltip>
              )}

            </div>
          </div>

          <div>
            <Form>
              <Row >
                <Col span={12}>
                  {/* 背景图 */}
                  <div>
                    <span style={{display:'inline-block',verticalAlign: 'top',width:'68px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.backgroundImg`]}</span>
                    <div style={{display:'inline-block',position: 'relative',}}>
                      <div style={{display:'inline-block'}}>
                        {this.state.backgroundImgObject?(
                          <img height='60px' src={this.state.backgroundImgObject.imageUrl} alt=""/>
                        ):infoData&&infoData.bannerPictureUrl?(
                          <img height='60px' src={infoData.bannerPictureUrl} alt=""/>
                        ):(
                          <div
                            style={{
                              display: 'inline-block',
                              height:'60px',
                              width:'216px',
                              border: '1px dashed #CCD3D9',
                              borderRadius: '4px',
                              lineHeight: '58px',
                              textAlign: 'center',
                            }}
                          >
                            <Icon
                              type="tianjia2"
                              style={{
                                fontSize: '24px',
                                color: '#CCD3D9',
                              }}
                            />
                          </div>
                        )}

                      </div>
                      {
                        this.state.TabPane_two_formClick?(
                          <a
                            style={{
                              position: 'absolute',
                              width: '65px',
                              bottom: '0',
                              marginLeft:'8px'
                            }}
                            onClick={()=>{
                              this.setState({
                                backgroundVisible:true
                              })
                            }}
                          >
                            {(this.state.backgroundImgObject&&this.state.backgroundImgObject.imageUrl)||(infoData&&infoData.bannerPictureUrl)?ServicePortalStore.languages[`${intlPrefix}.edit.replaceImg`]:ServicePortalStore.languages[`${intlPrefix}.img.Upload`]}
                          </a>
                        ):''
                      }
                    </div>
                  </div>
                </Col>

                <Col span={12}>
                  {/* 门户欢迎语 */}
                  <span style={{display:'inline-block',width:'68px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.welcome`]}</span>
                  {
                    this.state.TabPane_two_formClick?(
                      <FormItem
                        style={{
                          display:'inline-block',
                          marginLeft:'8px',
                        }}
                      >
                        {getFieldDecorator('bannerName', {
                          initialValue: infoData.bannerName || '',
                        })(
                          <MultiLanguageFormItem
                            requestUrl="true"
                            requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.banner_name:{}}
                            handleMultiLanguageValue={({ retObj, retList }) => {
                              // 将多语言的值设置到当前表单
                              this.props.form.setFieldsValue({
                                bannerName: retObj[this.props.AppState.currentLanguage],
                              });
                              this.setState({
                                  multiLanguageValue: {
                                    ...this.state.multiLanguageValue,
                                    banner_name: retObj,
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
                            descriptionObject={ServicePortalStore.languages[`${intlPrefix}.edit.welcome`]}
                            required="true"
                            inputWidth={240}
                            placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.inputWelcome`]}
                          />
                        )}
                      </FormItem>
                    ):(
                      <span style={{display:'inline-block',marginLeft:'8px'}}>{infoData?infoData.bannerName: ''}</span>
                    )
                  }

                </Col>
              </Row>

              <Row>
                <Col style={{marginTop:this.state.TabPane_two_formClick?'24px':'16px'}} span={12}>

                  {/* 数据汇总 */}
                  <span style={{display:'inline-block',width:'68px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.data`]}</span>
                  {
                    <FormItem
                      style={{display:'inline-block'}}
                    >
                      {getFieldDecorator('workbench', {
                        initialValue: infoData.workbench || '',
                      })(
                        <span>
                          <Switch checked={this.state.workbench?this.props.form.getFieldsValue().workbench:this.state.infoData?this.state.infoData.workbench : false} disabled={this.state.TabPane_two_formClick?false:true} onChange={this.dataAggregationOnChange} />
                          <span style={{marginLeft:'8px'}}>{this.props.form.getFieldsValue().workbench?ServicePortalStore.languages[`${intlPrefix}.edit.dataOpen`]:ServicePortalStore.languages[`${intlPrefix}.edit.dataClose`]}</span>
                        </span>
                      )}
                    </FormItem>
                  }
                </Col>
                <Col span={12} style={{marginTop:this.state.TabPane_two_formClick?'0':'-20px'}}>
                  {/* 搜索语 */}
                  <span style={{display:'inline-block',width:'68px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.searchText`]}</span>
                  {
                    this.state.TabPane_two_formClick?(
                      <FormItem
                        style={{display:'inline-block',marginLeft:'8px'}}
                      >
                        {getFieldDecorator('searchPrompt', {
                          initialValue: infoData.searchPrompt || '',
                        })(
                          <MultiLanguageFormItem
                            requestUrl="true"
                            requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.search_prompt:{}}
                            handleMultiLanguageValue={({ retObj, retList }) => {
                              // 将多语言的值设置到当前表单
                              this.props.form.setFieldsValue({
                                searchPrompt: retObj[this.props.AppState.currentLanguage],
                              });
                              this.setState({
                                  multiLanguageValue: {
                                    ...this.state.multiLanguageValue,
                                    search_prompt: retObj,
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
                            descriptionObject={ServicePortalStore.languages[`${intlPrefix}.edit.searchText`]}
                            required="true"
                            inputWidth={240}
                            placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.inputSearchText`]}
                          />
                        )}
                      </FormItem>
                    ):(
                      <span style={{display:'inline-block',marginLeft:'8px'}}>{infoData?infoData.searchPrompt: ''}</span>
                    )
                  }

                </Col>
              </Row>


            </Form>

            {this.state.TabPane_two_formClick?(
              <div style={{marginTop:'24px'}}>
                <Button onClick={this.saveOnClick} loading={this.state.saveSubmitting} key="back" style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}}>{ServicePortalStore.languages[`save`]}</Button>
                <Button
                  onClick={()=>{
                    const infoDataNew = JSON.parse(JSON.stringify(this.state.infoDataOriginal?this.state.infoDataOriginal:{}));
                    this.setState({
                      TabPane_two_formClick:false,
                      infoData:infoDataNew
                    })
                  }}
                  key="back"
                  style={{
                    border: '1px solid #ACB3BF'
                    ,color: '#818999',
                    marginLeft:'12px'
                  }}
                >
                  {ServicePortalStore.languages[`cancle`]}
                </Button>
              </div>
            ):""}
          </div>

        </div>
      </div>
    )
  }

}

export default Form.create({})(TabTwo);
