import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject } from 'mobx-react';
import { Button, Icon, Modal, Form, Col, Row,Input,Select,Table,Tooltip } from 'yqcloud-ui';
import { axios } from 'yqcloud-front-boot';
import AvatarUploader from "./AvatarUploader";
import MultiLanguageFormItem from "../../NewMultiLanguageFormItem";
import bigImg from '../../../../../assets/images/defaultLogo.svg';
import ServicePortalStore from '../../../../../stores/organization/servicePortal'
import './newModal.scss'
import KnowledgeSpaceModal from '../knowledgeSpaceList'
import KnowledgeModal from "../knowledgeList";

const FormItem = Form.Item;
const confirm = Modal.confirm;
const intlPrefix = 'organization.servicePortal';

const defaultImgUrl = process.env.IMG_HOST;
// const defaultImgUrl = 'https://yanqian-common.bj.bcebos.com/defaultimages/dev';
const StructureIcon = `${defaultImgUrl}/knowledgeImg/structureTypeIcon.svg`;
const RichTextIcon = `${defaultImgUrl}/knowledgeImg/singleTypeIcon.svg`;
const DocumentIcon = `${defaultImgUrl}/knowledgeImg/doucmentTypeIcon.svg`;
const MarkDownIcon = `${defaultImgUrl}/knowledgeImg/markdownTypeIcon.svg`;

@inject('AppState')
@injectIntl
class NewModal extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {
      newModal:false,
      knowledgeSpaceData:[],
      // 存放多语言信息
      multiLanguageValue: {
        name: {},
        description:{},
      },
    }
  }

  componentWillMount() {
    this.getLanguage();
    this.getHierarchyTypeQuery();
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

  // 资源层级快码查询
  getHierarchyTypeQuery= () => {
    const code = "PORTAL_RESOURCE_LEVEL";
    axios.get(`fnd/v1/${this.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        if(!data.failed){
          this.setState({
            hierarchyType: data
          })
        }else {
          Choerodon.prompt(item.message);
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  // 新建取消
  newHandleCancel=()=>{
    this.setState({
      imageUrl:'',
      knowledgeSpaceRadio:'',
      knowledgeRadio:'',
      multiLanguageValue:{
        name: {},
        description:{},
      },
      editDelete:false,
    });
    this.props.handleNewModal(false,false);
  };

  // 新建确定
  newHandleOk=()=>{
    const {form,editRecord}=this.props;
    let {multiLanguageValue} =this.state;
    multiLanguageValue = {
      name: this.state.multiLanguageValue&&!this.objIs(this.state.multiLanguageValue.name)? this.state.multiLanguageValue.name: editRecord?editRecord.__tls.name:{},
      description:this.state.multiLanguageValue&&!this.objIs(this.state.multiLanguageValue.description)? this.state.multiLanguageValue.description: editRecord?editRecord.__tls.description:{},
    }

    form.validateFields((err, fieldsValue, ) => {
      if (!err) {
        if(this.state.imageUrl||(this.props.editRecord&&this.props.editRecord.pictureUrl)){
            fieldsValue.pictureUrl=this.state.imageUrl||this.props.editRecord.pictureUrl;
            fieldsValue.__tls=multiLanguageValue;
            if(fieldsValue.hierarchy==='RESOURCE'&&fieldsValue.typeCode!=='URL'){
              if((this.state.knowledgeRadio||this.state.knowledgeSpaceRadio||this.props.editRecord)&&!this.state.editDelete){
                if(fieldsValue.typeCode==='KNOWLEDGE'){
                  if(this.state.knowledgeRadio){
                    fieldsValue.knowledge=this.state.knowledgeRadio;
                    if(this.state.knowledgeRadio.typeCode==='single'){
                      fieldsValue.logoUrl=this.state.knowledgeRadio.typeCode+this.state.knowledgeRadio.contentTypeCode;
                    }else {
                      fieldsValue.logoUrl=this.state.knowledgeRadio.typeCode;
                    }
                    fieldsValue.knowledgeId=this.state.knowledgeRadio.knowledgeBaseId;
                    fieldsValue.content=this.state.knowledgeRadio.knowledgeTitle;
                  }
                }
                if(fieldsValue.typeCode==='KNOWLEDGESPACE'){
                  if(this.state.knowledgeSpaceRadio){
                    fieldsValue.space=this.state.knowledgeSpaceRadio;
                    fieldsValue.spaceCode=this.state.knowledgeSpaceRadio.spaceCode;
                    fieldsValue.logoUrl=this.state.knowledgeSpaceRadio.spaceLogo;
                    fieldsValue.content=this.state.knowledgeSpaceRadio.spaceName;
                  }
                }
                this.setState({
                  imageUrl:'',
                  knowledgeSpaceRadio:'',
                  knowledgeRadio:'',
                  multiLanguageValue:{
                    name: {},
                    description:{},
                  }
                });
                this.props.handleNewModal(fieldsValue,false,this.props.stateModal);
              }else {
                Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.relation`]);
              }
            }else {
              this.setState({
                imageUrl:'',
                knowledgeSpaceRadio:'',
                knowledgeRadio:'',
                multiLanguageValue:{
                  name: {},
                  description:{},
                }
              });
              this.props.handleNewModal(fieldsValue,false,this.props.stateModal);
            }
        }else {
          Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.uploadLogo`]);
        }
      }
    });
  };

  /* 渲染知识类型图标 */
  renderTitleIcon = (record) => {
    if(this.props.editRecord){
      if (record.logoUrl === 'text') {
        //  结构化知识
        return <img style={{width:'20px',height: '20px',marginRight: '4px'}} src={StructureIcon} />;
      } else if (record.logoUrl === 'document') {
        //  文档知识
        return <img style={{width:'20px',height: '20px',marginRight: '4px'}} src={DocumentIcon} />;
      } else if (record.logoUrl === 'singleMARKDOWN') {
        //  单文本知识markdown
        return <img style={{width:'20px',height: '20px',marginRight: '4px'}} src={MarkDownIcon} />;
      } else if (record.logoUrl === 'singleRICH_TEXT') {
        //  单文本知识rich_text
        return <img style={{width:'20px',height: '20px',marginRight: '4px'}} src={RichTextIcon} />;
      }
    }else {
      if (record.typeCode === 'text') {
        //  结构化知识
        return <img style={{width:'20px',height: '20px',marginRight: '4px'}} src={StructureIcon} />;
      } else if (record.typeCode === 'document') {
        //  文档知识
        return <img style={{width:'20px',height: '20px',marginRight: '4px'}} src={DocumentIcon} />;
      } else if (record.typeCode === 'single' && record.contentTypeCode === 'MARKDOWN') {
        //  单文本知识markdown
        return <img style={{width:'20px',height: '20px',marginRight: '4px'}} src={MarkDownIcon} />;
      } else if (record.typeCode === 'single' && record.contentTypeCode === 'RICH_TEXT') {
        //  单文本知识rich_text
        return <img style={{width:'20px',height: '20px',marginRight: '4px'}} src={RichTextIcon} />;
      }
    }

  };

  // 删除空间和知识
  deleteSpace=()=>{
    const _this = this;
    confirm({
      className:'deleteSpace-servicePortal',
      title: <span>
        <Icon
          type="SLAchaoshi"
          style={{
            fontSize: '22px',
            color: '#F8353F',
            verticalAlign: 'inherit',
          }}
        />
        <span style={{marginLeft: '14px', fontSize:'16px', color:'rgba(0,0,0,0.85)'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.oKToDelete`]}</span>
      </span>,
      content: <span style={{marginLeft: '36px', fontSize:'14px', color:'rgba(0,0,0,0.65)',}}>{ServicePortalStore.languages[`${intlPrefix}.edit.oKToDeleteText`]}</span>,
      okText: ServicePortalStore.languages[`ok`],
      cancelText: ServicePortalStore.languages[`cancle`],
      onOk() {
        _this.setState({
          knowledgeSpaceRadio:'',
          knowledgeRadio:'',
          editDelete:true,
        })
      },
    });
  };

  typeCodeOnChange=()=>{
    this.setState({
      knowledgeSpaceRadio:'',
      knowledgeRadio:'',
      editDelete:true,
    })
  }

  // 判断对象是否为空
  objIs=(obj)=>{
    let objText;
    if (Object.keys(obj).length  === 0) {// 空
      objText= true
    } else {
      objText=  false
    }
    return objText
  };

  // 新建Modal内容
  newRenderContainer=()=>{
    const { getFieldDecorator } = this.props.form;
    const { editRecord,parentRecord } = this.props;

    const hierarchyOptionArr = [];
    if(this.state.hierarchyType){
      this.state.hierarchyType.forEach(item=>{
        if(parentRecord&&parentRecord.level>=3&&item.lookupValue==='RESOURCE_GROUP'){
          hierarchyOptionArr.push(<Option disabled value={item.lookupValue}>{item.lookupMeaning}</Option>)
        }else {
          hierarchyOptionArr.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>)
        }

      })
    }

    const resourcesTypeArr = [];
    if(this.props.resourcesType){
      this.props.resourcesType.forEach(item=>{
        resourcesTypeArr.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>)
      })
    }

    let knowledgeSpaceRadioName;
    if(this.state.knowledgeSpaceRadio||this.props.editRecord){
      const knowledgeSpaceRadioText = this.state.knowledgeSpaceRadio?this.state.knowledgeSpaceRadio.spaceName:this.props.editRecord?this.props.editRecord.content:'';
      knowledgeSpaceRadioName=knowledgeSpaceRadioText?knowledgeSpaceRadioText.length>36?knowledgeSpaceRadioText.slice(0,35)+'...':knowledgeSpaceRadioText:''
    }

    let knowledgeRadioName;
    if(this.state.knowledgeRadio||this.props.editRecord){
      const knowledgeRadioText = this.state.knowledgeRadio?this.state.knowledgeRadio.knowledgeTitle:this.props.editRecord?this.props.editRecord.content:'';
      knowledgeRadioName=knowledgeRadioText?knowledgeRadioText.length>36?knowledgeRadioText.slice(0,35)+'...':knowledgeRadioText:''
    }

    return(
      <div style={{padding:'15px 0'}}>
        <Form>
          <Row style={{marginTop:'24px'}}>
            <Col span={24}>
              {/* 名称 */}
              <span style={{display:'inline-block',width: '32px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.tableName`]}<span style={{color: 'red'}}>*</span></span>
              <FormItem
                style={{display:'inline-block',marginLeft:'24px'}}
              >
                {getFieldDecorator('name', {
                  rules: [{
                    required: true,
                    message: ServicePortalStore.languages[`${intlPrefix}.edit.fillInName`]
                  }],
                  initialValue: editRecord?editRecord.name : '',
                })(
                  <MultiLanguageFormItem
                    requestUrl="true"
                    requestData={
                      this.state.multiLanguageValue&&!this.objIs(this.state.multiLanguageValue.name)? this.state.multiLanguageValue.name: editRecord?editRecord.__tls.name:{}
                    }
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
                    type="FormItem"
                    FormLanguage={this.state.multiLanguageValue}
                    languageEnv={this.state.languageEnv}
                    descriptionObject={ServicePortalStore.languages[`${intlPrefix}.edit.tableName`]}
                    required="true"
                    inputWidth={340}
                    placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.fillInName`]}
                  />
                )}
              </FormItem>
            </Col>
          </Row>

          <Row style={{marginTop:'16px'}}>
            <Col span={24}>
              {/* 描述 */}
              <span style={{display:'inline-block',width: '32px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.description`]}</span>
              <FormItem
                style={{display:'inline-block',marginLeft:'24px'}}
              >
                {getFieldDecorator('description', {
                  initialValue: editRecord?editRecord.description : '',
                })(

                  <MultiLanguageFormItem
                    requestUrl="true"
                    requestData={
                      this.state.multiLanguageValue&&!this.objIs(this.state.multiLanguageValue.description)? this.state.multiLanguageValue.description: editRecord?editRecord.__tls.description:{}
                    }
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
                    descriptionObject={ServicePortalStore.languages[`${intlPrefix}.edit.description`]}
                    required="true"
                    inputWidth={340}
                    placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.fillInDescription`]}
                  />
                )}
              </FormItem>
            </Col>
          </Row>

          <Row style={{marginTop:'16px'}}>
            <Col span={12}>
              {/* 层级 */}
              <span style={{display:'inline-block',width: '32px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.hierarchy`]}<span style={{color: 'red'}}>*</span></span>
              <FormItem
                style={{width:'108px',display:'inline-block',marginLeft:'24px'}}
              >
                {getFieldDecorator('hierarchy', {
                  rules: [{
                    required: true,
                    message: ServicePortalStore.languages[`${intlPrefix}.edit.choiceHierarchy`]
                  }],
                  initialValue: editRecord?editRecord.hierarchy : '',
                })(
                  <Select disabled={editRecord?true:false} placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.choiceHierarchy`]}>
                    {hierarchyOptionArr}
                  </Select>
                )}
              </FormItem>
            </Col>

            { this.props.form.getFieldsValue().hierarchy==='RESOURCE'?
              <Col span={12}>
                {/* 类型 */}
                <span style={{display:'inline-block',width: '32px',marginLeft: '16px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.tableType`]}<span style={{color: 'red'}}>*</span></span>
                <FormItem
                  style={{width:'108px',display:'inline-block',marginLeft:'24px'}}
                >
                  {getFieldDecorator('typeCode', {
                    rules: [{
                      required: true,
                      message: ServicePortalStore.languages[`${intlPrefix}.edit.choiceTableType`]
                    }],
                    initialValue: editRecord?editRecord.typeCode : '',
                  })(
                    <Select onChange={this.typeCodeOnChange} placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.choiceTableType`]}>
                      {resourcesTypeArr}
                    </Select>
                  )}
                </FormItem>
              </Col>
              :''
            }
          </Row>

          <Row>
            <Col span={24}>
              <div>
                <span style={{verticalAlign: 'super',display:'inline-block',width: '32px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.logo`]}<span style={{color: 'red'}}>*</span></span>
                <div style={{display:'inline-block',position: 'relative',}}>
                  <div style={{display:'inline-block',marginLeft:'24px',padding:'5px 5px 5px 0'}}>
                    <img width="88px" height="88px" src={editRecord?editRecord.pictureUrl:this.state.imageUrl?this.state.imageUrl:bigImg} alt=""/>
                  </div>
                  <a
                    style={{
                      position: 'absolute',
                      width: '65px',
                      bottom: '0',
                    }}
                    onClick={()=>{
                      this.setState({
                        LOGONewVisible:true
                      })
                    }}
                  >
                    {editRecord?ServicePortalStore.languages[`${intlPrefix}.edit.replaceLogoModel`]:this.state.imageUrl?ServicePortalStore.languages[`${intlPrefix}.edit.replaceLogoModel`]:ServicePortalStore.languages[`${intlPrefix}.edit.uploadLogoModel`]}
                  </a>
                </div>
              </div>
            </Col>
          </Row>

          <Row style={{marginTop:'16px'}}>
            { this.props.form.getFieldsValue().typeCode==='URL'?
              <Col span={24}>
                {/* URL */}
                <span>{ServicePortalStore.languages[`${intlPrefix}.edit.url`]}<span style={{color: 'red'}}>*</span></span>
                <FormItem
                  style={{width:'340px',display:'inline-block',marginLeft:'24px'}}
                >
                  {getFieldDecorator('redirectUrl', {
                    rules: [{
                      required: true,
                      message: ServicePortalStore.languages[`${intlPrefix}.edit.fillInUrl`]
                    }],
                    initialValue: editRecord?editRecord.redirectUrl : '',
                  })(
                    <Input placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.fillInUrl`]} />
                  )}
                </FormItem>
              </Col>
              :''
            }
            {this.props.form.getFieldsValue().typeCode==='KNOWLEDGE'?
              <div style={{marginBottom:'24px'}}>
                <span>{ServicePortalStore.languages[`${intlPrefix}.edit.relationKnowledge`]}<span style={{color: 'red'}}>*</span></span>
                <div style={{paddingTop:'8px'}}>
                  {(this.state.knowledgeRadio||this.props.editRecord)&&!this.state.editDelete?(
                    <div style={{marginLeft: '8px'}}>
                      {this.renderTitleIcon(this.state.knowledgeRadio?this.state.knowledgeRadio:this.props.editRecord?this.props.editRecord:'')}
                      {knowledgeRadioName}
                      <Tooltip title={ServicePortalStore.languages[`delete`]}>
                        <Icon
                          type="wenjianshanchu"
                          style={{
                            fontSize: '14px',
                            cursor: 'pointer',
                            color:'#F8353F',
                            float:'right',
                          }}
                          onClick={this.deleteSpace}
                        />
                      </Tooltip>

                    </div>
                  ):(
                    <Button
                      style={{
                        border: '1px solid #CCD3D9',
                        width: '100%'
                      }}
                      onClick={()=>{
                        this.setState({
                          knowledgeVisible:true
                        })
                      }}
                    >
                      <Icon
                        type="tianjia2"
                        style={{
                          fontSize: '16px',
                          cursor: 'pointer',
                          color:'#2196F3'
                        }}
                      />
                      <span style={{color:'#2196F3'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.relationText`]}</span>
                    </Button>
                  )}

                </div>
              </div>
              :''
            }
            {this.props.form.getFieldsValue().typeCode==='KNOWLEDGESPACE'?
              <div style={{marginBottom:'24px'}}>
                <span>{ServicePortalStore.languages[`${intlPrefix}.edit.relationKnowledgeSpace`]}<span style={{color: 'red'}}>*</span></span>
                <div style={{paddingTop:'8px'}}>
                  {
                    (this.state.knowledgeSpaceRadio||this.props.editRecord)&&!this.state.editDelete?(
                      <div style={{marginLeft: '8px'}}>
                        <img style={{borderRadius:'4px'}} width='24px' height='24px' src={this.state.knowledgeSpaceRadio?this.state.knowledgeSpaceRadio.spaceLogo:this.props.editRecord?this.props.editRecord.logoUrl:""} alt=""/>
                        <span style={{marginLeft: '8px',verticalAlign: 'middle'}}>{knowledgeSpaceRadioName}</span>
                        <Tooltip title={ServicePortalStore.languages[`delete`]}>
                          <Icon
                            type="wenjianshanchu"
                            style={{
                              fontSize: '14px',
                              cursor: 'pointer',
                              color:'#F8353F',
                              float:'right',
                            }}
                            onClick={this.deleteSpace}
                          />
                        </Tooltip>
                      </div>
                    ):(
                      <Button
                        style={{
                          border: '1px solid #CCD3D9',
                          width: '100%'
                        }}
                        onClick={() => {
                          this.setState({
                            knowledgeSpaceVisible:true
                          })
                        }}
                      >
                        <Icon
                          type="tianjia2"
                          style={{
                            fontSize: '16px',
                            cursor: 'pointer',
                            color:'#2196F3'
                          }}
                        />
                        <span style={{color:'#2196F3'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.relationText`]}</span>
                      </Button>
                    )
                  }
                </div>
              </div>
              :''
            }
          </Row>
        </Form>
      </div>
    )
  };

  // logo传递
  handleLogoModal=(value,url)=>{
    if(url){
      this.setState({
        LOGONewVisible:value,
        imageUrl:url,
      })
    }else {
      this.setState({
        LOGONewVisible:value,
      })
    }

  };

  // 知识空间传递
  handleknowledgeSpaceModal=(value,data)=>{
    const {editDelete}=this.state;
    this.setState({
      knowledgeSpaceRadio:data,
      knowledgeSpaceVisible:value,
      editDelete:data?false:editDelete,
    })
  };

  // 知识空间传递
  handleknowledgeModal=(value,data)=>{
    const {editDelete}=this.state;
    this.setState({
      knowledgeRadio:data,
      knowledgeVisible:value,
      editDelete:data?false:editDelete,
    })
  };

  render() {
    const { visible,editRecord } = this.props;
    const { submitting } = this.state;
    const modalFooter = [
      <Button disabled={submitting} key="cancel" onClick={this.newHandleCancel}>
        {ServicePortalStore.languages[`cancle`]}
      </Button>,
      <Button key="save" type="primary" loading={submitting} onClick={this.newHandleOk}>
        {ServicePortalStore.languages[`save`]}
      </Button>,
    ];
    return (
      <div className='service_newModal'>
        <Modal
          title={editRecord?ServicePortalStore.languages[`edit`]:ServicePortalStore.languages[`create`]}
          className="tabFour_newModal"
          visible={visible}
          width={480}
          // closable={false}
          destroyOnClose
          maskClosable={false}
          footer={modalFooter}
          onCancel={this.newHandleCancel}
          onOk={this.newHandleOk}
        >
          {this.newRenderContainer()}
        </Modal>

        <KnowledgeSpaceModal visible={this.state.knowledgeSpaceVisible?this.state.knowledgeSpaceVisible:false} handleknowledgeSpaceModal={this.handleknowledgeSpaceModal.bind(this)} />

        <KnowledgeModal visible={this.state.knowledgeVisible} handleknowledgeModal={this.handleknowledgeModal.bind(this)} />

        <AvatarUploader visible={this.state.LOGONewVisible?this.state.LOGONewVisible:false} handleLogoModal={this.handleLogoModal.bind(this)}  />
      </div>
    );
  }
}

export default Form.create({})(NewModal);
