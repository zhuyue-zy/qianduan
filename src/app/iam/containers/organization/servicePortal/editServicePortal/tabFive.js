import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { Page, Header, Content, Permission, Action, axios } from 'yqcloud-front-boot';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Switch, Checkbox, Input, Popover, message, Popconfirm, Progress, Form, Select, Col, Row, } from 'yqcloud-ui';
import update from 'immutability-helper';
import md5 from 'md5';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
import ServicePortalStore from '../../../../stores/organization/servicePortal'
import KnowledgeSpaceModal from './knowledgeSpaceList'
import KnowledgeModal from './knowledgeList'
import ServiceModal from './serviceList'
import Robot from './robotList'
import MultiLanguageFormItem from "../NewMultiLanguageFormItem";
import bigImg from '../../../../assets/images/defaultLogo.svg';
import AvatarUploader from "./tabFive/AvatarUploader";
import WYSIWYGEditor from './tabFive/WYSIWYGEditor';

const FormItem = Form.Item;
const confirm = Modal.confirm;
const intlPrefix = 'organization.servicePortal';
const ICONS = ['xiangmutubiao-2', 'xiangmutubiao-', 'xiangmutubiao-1', 'xiangmutubiao-3', 'xiangmutubiao-4', 'customerservice', 'dianhua1'];

const defaultImgUrl = process.env.IMG_HOST;
// const defaultImgUrl = 'https://yanqian-common.bj.bcebos.com/defaultimages/dev';
const StructureIcon = `${defaultImgUrl}/knowledgeImg/structureTypeIcon.svg`;
const RichTextIcon = `${defaultImgUrl}/knowledgeImg/singleTypeIcon.svg`;
const DocumentIcon = `${defaultImgUrl}/knowledgeImg/doucmentTypeIcon.svg`;
const MarkDownIcon = `${defaultImgUrl}/knowledgeImg/markdownTypeIcon.svg`;

function dragDirection(
  dragIndex,
  hoverIndex,
  initialClientOffset,
  clientOffset,
  sourceClientOffset,
) {
  const hoverMiddleY = (initialClientOffset.y - sourceClientOffset.y) / 2;
  const hoverClientY = clientOffset.y - sourceClientOffset.y;
  if (dragIndex < hoverIndex && hoverClientY > hoverMiddleY) {
    return 'downward';
  }
  if (dragIndex > hoverIndex && hoverClientY < hoverMiddleY) {
    return 'upward';
  }
}

let BodyRow = (props) => {
  const {
    isOver,
    connectDragSource,
    connectDropTarget,
    moveRow,
    dragRow,
    clientOffset,
    sourceClientOffset,
    initialClientOffset,
    ...restProps
  } = props;
  const style = { ...restProps.style, cursor: 'move' };

  let className = restProps.className;
  if (isOver && initialClientOffset) {
    const direction = dragDirection(
      dragRow.index,
      restProps.index,
      initialClientOffset,
      clientOffset,
      sourceClientOffset
    );
    if (direction === 'downward') {
      className += ' drop-over-downward';
    }
    if (direction === 'upward') {
      className += ' drop-over-upward';
    }
  }

  return connectDragSource(
    connectDropTarget(
      <tr
        {...restProps}
        className={className}
        style={style}
      />
    )
  );
};

const rowSource = {
  beginDrag(props) {
    return {
      index: props.index,
    };
  },
};

const rowTarget = {
  drop(props, monitor) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Time to actually perform the action
    props.moveRow(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  },
};

BodyRow = DropTarget('row', rowTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  sourceClientOffset: monitor.getSourceClientOffset(),
}))(
  DragSource('row', rowSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    dragRow: monitor.getItem(),
    clientOffset: monitor.getClientOffset(),
    initialClientOffset: monitor.getInitialClientOffset(),
  }))(BodyRow)
);

@injectIntl
@inject('AppState')
@observer
class TabFive extends Component {

  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {
      key:1,
      TabPane_five_formClick:false, // tab1是否编辑状态
      data:[],
      saveSubmitting:false,
      knowledgeSpaceVisible:false,
      knowledgeVisible:false,
      serviceVisible:false,
      robotVisible:false,
      loadingTable:false,
      LOGONewVisible:false,
      deleteArr:[],
      // 存放多语言信息
      multiLanguageValue: {
        name: {},
        description:{},
      },
    };
  }

  componentWillMount() {
    this.getLanguage();
    this.getSideBars();
    this.getTypeCode();
    this.getTabOne();
  }

  getTabOne=()=> {
    const idData = this.props.urlId;
    ServicePortalStore.getPortalDetails(this.organizationId,idData).then(infoData=>{
      if(!infoData.failed){
        this.setState({
          infoDataOneColor:infoData&&infoData.themeColor?infoData.themeColor:'#232323',
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

  //  层级快码查询
  getTypeCode= () => {
    const code = "PORTAL_SIDEBAR_TYPE";
    axios.get(`fnd/v1/${this.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        if(!data.failed){
          this.setState({
            typeCode: data
          })
        }else {
          Choerodon.prompt(item.message);
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  getSideBars = ()=>{
    const idData = this.props.urlId;
    this.setState({loadingTable:true});
    ServicePortalStore.getSideBar(this.organizationId,idData).then(item=>{
      if(!item.failed){
        this.arrIs(item);
        this.setState({
          data:item || [],
          loadingTable:false,
          dataOriginal:JSON.parse(JSON.stringify(item?item:[])) || [],
        });
      }else {
        this.setState({loadingTable:false});
      }
    })
      .catch((error) => {
        Choerodon.handleResponseError(error);
        this.setState({loadingTable:false});
      });
  };

  // 判断数组是否为空
  arrIs=(Arr)=>{
    if (Arr.length <= 0) {
      // 空
      this.setState({
        isEdits:false
      })
    } else {
      this.setState({
        isEdits:true,
      })
    }
  };

  components = {
    body: {
      row: BodyRow,
    },
  };


  // 移动行时调用函数
  moveRow = (dragIndex, hoverIndex) => {
    const { data } = this.state;
    const dragRow = data[dragIndex];

    this.setState(
      update(this.state, {
        data: {
          $splice: [[dragIndex, 1], [hoverIndex, 0, dragRow]],
        },
      }),
    );
  };

  // 新建行
  newlyBuildRecord = () =>{
    if(this.state.data.length<10){
      this.setState({
        newModalVisible:true,
        stateModal:'NEW',
        rowRecordEditData:'',
      })
    }else {
      Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.numberOfSidebars`]);
    }

  };

  // 删除行
  deleteRecord = (record) =>{
    const newData = [...this.state.data];
    const dataArr=[];
    const {deleteArr}=this.state;
    if(record){
      newData.forEach(item=>{
        if(item===record){
          item.deleted=true;
          if(record.id){
            deleteArr.push(item)
          }
        }else {
          dataArr.push(item)
        }
      });
      this.setState({ data: dataArr,deleteArr });
    }
  };

  // 保存
  handleSubmission=()=>{
    const tableData = this.state.data;
    tableData.forEach((item,i)=>{
      item.rankNumber=i+1
    });

    if(this.state.deleteArr.length>0){
      tableData.push(...this.state.deleteArr)
    }
    this.setState({saveSubmitting:true});
    if(this.state.isEdits){
      ServicePortalStore.setSideBar(this.organizationId,tableData).then(item=>{
        if(!item.failed){
          Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.editSuccess`]);
          this.getSideBars();
          this.setState({
            saveSubmitting:false,
            TabPane_five_formClick:false,
            deleteArr:[],
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
      ServicePortalStore.newSideBar(this.organizationId,tableData).then(item=>{
        if(!item.failed){
          Choerodon.prompt(ServicePortalStore.languages[`save.success`]);
          this.getSideBars();
          this.setState({
            saveSubmitting:false,
            TabPane_five_formClick:false,
            deleteArr:[],
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

  // 知识传递
  handleknowledgeModal=(value,data)=>{
    const {editDelete}=this.state;
    this.setState({
      knowledgeRadio:data,
      knowledgeVisible:value,
      editDelete:data?false:editDelete,
    })
  };

  // 机器人传递
  handleRobotModal=(value,data)=>{
    const {editDelete}=this.state;
    this.setState({
      robotRadio:data,
      robotVisible:value,
      editDelete:data?false:editDelete,
    })
  };

  // 服务目录传递
  handleServiceModal=(value,data)=>{
    const {editDelete}=this.state;
    this.setState({
      serviceRadio:data,
      serviceVisible:value,
      editDelete:data?false:editDelete,
    })
  };

  // 新建modal保存
  handleOkNewly=()=>{
    const {form}=this.props;
    const {key,data,stateModal,content, rowRecordEditData,robotRadio,serviceRadio,knowledgeRadio,knowledgeSpaceRadio } = this.state;
    form.validateFields((err, fieldsValue) => {
      if(!err){
        if(this.state.imageUrl||(this.state.rowRecordEditData&&this.state.rowRecordEditData.iconUrl)){
          if((fieldsValue.typeCode==='ROBOT'||fieldsValue.typeCode==='SERVICE CATALOG'||fieldsValue.typeCode==='KNOWLEDGESPACE'||fieldsValue.typeCode==='KNOWLEDGE')&&!((serviceRadio||robotRadio||knowledgeRadio||knowledgeSpaceRadio||this.state.rowRecordEditData)&&!this.state.editDelete)){
            Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.relation`]);
          }else {
            if(stateModal!=='NEW'){ // 是否是新建
              if(rowRecordEditData.id||rowRecordEditData.key){
                data.forEach(item=>{
                  if((rowRecordEditData.id&&item.id===rowRecordEditData.id)||(rowRecordEditData.key&&item.key===rowRecordEditData.key)){
                    item.name=fieldsValue.name;
                    item.description=fieldsValue.description;
                    item.__tls=this.state.multiLanguageValue;
                    item.iconUrl=this.state.imageUrl;
                    if(item.typeCode==='RICH TEXT'){ // 富文本
                      Promise.all(this.promiseElementInfo(content)).then((content) => {
                        item.content=JSON.stringify(content);
                        // item.content=content;
                      })
                    }if(fieldsValue.typeCode==='ROBOT'){ // 机器人
                      item.content=this.state.robotRadio?`${this.state.robotRadio.chatrobotNickname?this.state.robotRadio.chatrobotNickname:''}（${this.state.robotRadio.chatrobotCode?this.state.robotRadio.chatrobotCode:''}）`:item.content;
                      item.identifierId=this.state.robotRadio?this.state.robotRadio.chatrobotId:item.identifierId;
                      item.logoUrl=this.state.robotRadio?this.state.robotRadio.chatrobotCover:item.chatrobotCover;
                    }if(fieldsValue.typeCode==='URL') { // 链接
                      item.redirectUrl=fieldsValue.redirectUrl;
                    }if(fieldsValue.typeCode==='KNOWLEDGESPACE') { // 知识空间
                      item.spaceCode=this.state.knowledgeSpaceRadio?this.state.knowledgeSpaceRadio.spaceCode:item.spaceCode;
                      item.logoUrl=this.state.knowledgeSpaceRadio?this.state.knowledgeSpaceRadio.spaceLogo:item.logoUrl;
                      item.content=this.state.knowledgeSpaceRadio?this.state.knowledgeSpaceRadio.spaceName:item.content;
                    }if(fieldsValue.typeCode==='SERVICE CATALOG') { // 服务目录
                      // item.spaceCode=this.state.serviceRadio?this.state.knowledgeSpaceRadio.spaceCode:item.spaceCode;
                      item.logoUrl=this.state.serviceRadio?this.state.serviceRadio.cataloguePicture:item.logoUrl;
                      item.content=this.state.serviceRadio?this.state.serviceRadio.catalogueName:item.content;
                      item.identifierId=this.state.serviceRadio?this.state.serviceRadio.id:item.identifierId;
                    }if(fieldsValue.typeCode==='KNOWLEDGE') { // 知识
                      if(this.state.knowledgeRadio&&this.state.knowledgeRadio.typeCode==='single'){
                        item.logoUrl=this.state.knowledgeRadio?(this.state.knowledgeRadio.typeCode+this.state.knowledgeRadio.contentTypeCode):item.logoUrl;
                      }else {
                        item.logoUrl=this.state.knowledgeRadio?this.state.knowledgeRadio.typeCode:item.logoUrl;
                      }
                      item.identifierId=this.state.knowledgeRadio?this.state.knowledgeRadio.id:item.identifierId;
                      item.content=this.state.knowledgeRadio?this.state.knowledgeRadio.knowledgeTitle:item.content;
                    }
                  }
                })
              }

              this.setState({
                data,
                imageUrl:'',
                knowledgeSpaceRadio:'',
                knowledgeRadio:'',
                serviceRadio:'',
                robotRadio:'',
                content:'',
                newModalVisible:false,
                rowRecordEditData:'',
                multiLanguageValue:{
                  name:{},
                  description:{},
                }
              })

            }else {
              let rankNumberMox=data.length>0?data[0].rankNumber:0;
              if(data.length>0){
                data.forEach(item=>{
                  if(item.rankNumber>rankNumberMox){
                    rankNumberMox = item.rankNumber
                  }
                });
              }
              const newDataRow={
                key:key,
                name:fieldsValue.name,
                description:fieldsValue.description,
                typeCode:fieldsValue.typeCode,
                iconUrl:this.state.imageUrl,
                __tls:this.state.multiLanguageValue,
                rankNumber:rankNumberMox+1,
                portalId:this.props.urlId,
              };
              if(fieldsValue.typeCode==='RICH TEXT'){ // 富文本
                Promise.all(this.promiseElementInfo(content)).then((content) => {
                  newDataRow.content=JSON.stringify(content);
                  // newDataRow.content=content;
                })
              }if(fieldsValue.typeCode==='ROBOT'){ // 机器人
                newDataRow.content=`${this.state.robotRadio.chatrobotNickname?this.state.robotRadio.chatrobotNickname:''}（${this.state.robotRadio.chatrobotCode?this.state.robotRadio.chatrobotCode:''}）`;
                newDataRow.identifierId=this.state.robotRadio.chatrobotId;
                newDataRow.logoUrl=this.state.robotRadio.chatrobotCover;
              }if(fieldsValue.typeCode==='URL') { // 链接
                newDataRow.redirectUrl=fieldsValue.redirectUrl;
              }if(fieldsValue.typeCode==='KNOWLEDGESPACE') { // 知识空间
                newDataRow.space=this.state.knowledgeSpaceRadio;
                newDataRow.spaceCode=this.state.knowledgeSpaceRadio.spaceCode;
                newDataRow.logoUrl=this.state.knowledgeSpaceRadio.spaceLogo;
                newDataRow.content=this.state.knowledgeSpaceRadio.spaceName;
              }if(fieldsValue.typeCode==='SERVICE CATALOG') { // 服务目录
                newDataRow.service=this.state.serviceRadio;
                newDataRow.logoUrl=this.state.serviceRadio.cataloguePicture;
                newDataRow.content=this.state.serviceRadio.catalogueName;
                newDataRow.identifierId=this.state.serviceRadio.id;
              }if(fieldsValue.typeCode==='KNOWLEDGE') { // 知识
                newDataRow.knowledge=this.state.knowledgeRadio;
                if(this.state.knowledgeRadio.typeCode==='single'){
                  newDataRow.logoUrl=this.state.knowledgeRadio.typeCode+this.state.knowledgeRadio.contentTypeCode;
                }else {
                  newDataRow.logoUrl=this.state.knowledgeRadio.typeCode;
                }
                newDataRow.identifierId=this.state.knowledgeRadio.knowledgeBaseId;
                newDataRow.content=this.state.knowledgeRadio.knowledgeTitle;
              }

              data.push(newDataRow);

              this.setState({
                key:key+1,
                data,
                imageUrl:'',
                knowledgeSpaceRadio:'',
                knowledgeRadio:'',
                serviceRadio:'',
                robotRadio:'',
                content:'',
                newModalVisible:false,
                rowRecordEditData:'',
                multiLanguageValue:{
                  name:{},
                  description:{},
                }
              })
            }
          }
        }else {
          Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.uploadLogo`]);
        }
      }
    });

  };

  // 新建取消
  handleCancelNewly=()=>{
    this.setState({
      newModalVisible:false,
      imageUrl:'',
      knowledgeSpaceRadio:'',
      knowledgeRadio:'',
      serviceRadio:'',
      content:'',
      robotRadio:'',
      editDelete:false,
      modalSubmitting:false,
      rowRecordEditData:'',
      multiLanguageValue:{
        name:{},
        description:{},
      }
    })
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


  /**
   * 处理文本框变化
   * @param
   */
  handleTextContent = (value) => {
    const { content } = this.state;
    // this.state.content = value;
    this.setState({ content: value });
  };

  /**
   * 处理异步，base64/URL转ID，
   * @param
   */
  promiseList = (elementContent) => {
    const { AppState } = this.props;
    const { imageList } = this.state;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    const promiseList = [];
    elementContent.forEach((element) => {
      promiseList.push(
        new Promise((resolve) => {
          if (element.insert && element.insert.image && element.insert.image.split && element.insert.image.split(':')[0] === 'data') {
            const config = {
              headers: { 'Content-Type': 'multipart/form-data' },
            };
            const formData = new FormData();
            formData.append('file', this.dataURLtoFile(element.insert.image));
            ServicePortalStore.submitFile(iamOrganizationId, formData, config).then((res) => {
              element.insert.image = res.imageUrl;
              resolve(element);
            });
          } else if (element.insert && element.insert.image && element.insert.image.split && element.insert.image.split(':')[0] === 'http') {
            resolve(element);
          } else {
            resolve(element);
          }
        }),
      );
    });
    return promiseList;
  };

  /**
   * 处理元素 与elementContentInfo的赋值
   * @param
   */
  promiseElementInfo = (elementInfos) => {
    const { content } = this.state;
    const result = [];
    if (JSON.stringify(elementInfos) !== '{}' && JSON.stringify(elementInfos) !== '""') {
      elementInfos.forEach((item) => {
        result.push(
          new Promise((resolve) => {
            if (content) {
              Promise.all(this.promiseList(content))
                .then((content) => {
                  const elementContent = JSON.stringify(content);
                  resolve({ ...item });
                });
            } else {
              const elementContent = '';
              resolve({ ...item });
            }
          }),
        );
      });
    }
    return result;
  };

  dataURLtoFile = (dataurl) => { // 将base64转换为文件
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = window.atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], `${md5((new Date()).getTime())}.${mime.split('/')[1]}`, { type: mime });
  };

  /* 渲染知识类型图标 */
  renderTitleIcon = (record) => {
    if(this.state.stateModal==="NEW"){
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
    }else {
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
    }
  };

  // 删除空间、知识、机器人
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
          serviceRadio:'',
          editDelete:true,
          robotRadio:'',
        })
      },
    });
  };

  typeCodeOnChange=()=>{
    this.setState({
      knowledgeSpaceRadio:'',
      knowledgeRadio:'',
      serviceRadio:'',
      editDelete:true,
      robotRadio:'',
    })
  }

  // 行内编辑
  editRecord = (record) =>{
    // if(record.typeCode==='KNOWLEDGESPACE'){
    //   this.setState({
    //     knowledgeSpaceRadio:{
    //       spaceLogo:record.logoUrl,
    //       spaceName:record.content,
    //     }
    //   })
    // }
    //
    // if(record.typeCode==='KNOWLEDGE'){
    //   this.setState({
    //     knowledgeRadio:{
    //       typeCode:record.typeCode,
    //       knowledgeTitle:record.content,
    //     }
    //   })
    // }
    //
    // if(record.typeCode==='ROBOT'){
    //   this.setState({
    //     knowledgeRadio:{
    //       typeCode:record.typeCode,
    //       content:record.content,
    //     }
    //   })
    // }

    this.setState({
      newModalVisible:true,
      stateModal:'EDIT',
      rowRecordEditData:record,
      imageUrl:record.iconUrl,
      multiLanguageValue:record.__tls?record.__tls:{
        name:{},
        description:{},
      }
    })
  };

  renderPreviewContent = (data) => {
    const fileOptions = [];
    const announcementContent = JSON.parse(data.content);
    const content = (new QuillDeltaToHtmlConverter(announcementContent, {})).convert();

    if (data.attachments) {
      data.attachments.forEach((item) => {
        fileOptions.push(
          <p>
            <span style={{ marginRight: 10, cursor: 'pointer' }} className="file-title" onClick={this.handleDownload.bind(this, item)}>
              {item.attachmentName}{item.fileType}
            </span>
            <span>
              <span style={{ color: '#818999' }}>({item.attachmentSize / (1024 * 1024) > 1 ? `${Math.round((item.attachmentSize / (1024 * 1024)) * 100) / 100} M` : `${Math.round(item.attachmentSize / 1024 * 100) / 100} kb`})</span>
              <Icon style={{ marginRight: 10, cursor: 'pointer', color: '#2196F3' }} onClick={this.handleDownload.bind(this, item)} type="vertical_align_bottom" />
            </span>
          </p>,
        );
      });
    }
    const contentStyle = {
      paddingTop: 10,
      color: '#3C4D73',
      wordWrap: 'break-word',
      wordBreak: 'break-all',
      overflow: 'scroll',
      maxHeight: '45vh',
      minHeight: '40vh',
    };
    return (
      <div style={{ padding: '20px 28px', borderRadius: 2 }}>
        <p
          style={{
            fontSize: 14,
            color: '#04173F',
            lineHeight: '20px',
            fontWeight: 400,
            marginBottom: 5,
          }}
        >
          {data.title || ''}
        </p>
        <div style={{ color: '#818899' }}>
        </div>
        <div className="ann-content" style={contentStyle} dangerouslySetInnerHTML={{ __html: `${content || ''}` }} />
        {data.attachments && data.attachments.length > 0 ? (
          <div style={{ paddingTop: 10, borderTop: '1px solid #EBF1F5' }}>{fileOptions}</div>
        ) : ''}
      </div>
    );
  };

  // 富文本详细点击
  detailsText=(record)=>{
    this.setState({
      detailsTextData:record,
      previewVisible:true,
    })
  };

  // inputSouClick=()=>{
  //   const {dataOriginal}=this.state;
  //   if(this.state.inputSou){
  //     const idData = this.props.urlId;
  //     ServicePortalStore.getSideBar(this.organizationId,idData,this.state.inputSou).then(item=>{
  //       if(!item.failed){
  //         this.arrIs(item);
  //         this.setState({
  //           data:item || [],
  //         });
  //       }
  //     })
  //   }else {
  //     this.setState({
  //       data:dataOriginal||[]
  //     })
  //   }
  // };

  render() {
    const { getFieldDecorator } = this.props.form;
    const columns=[{
      title:  ServicePortalStore.languages[`${intlPrefix}.edit.tableName`],
      dataIndex: 'name',
      width:'25%',
      render: (text, record) => {
        let textNew=text;
        if(text.length>15){
          textNew=text.slice(0,14)+'...';
        }
        return(
          <div>
            <img width="24px" height="24px" style={{borderRadius:'2px',background:this.state.infoDataOneColor?this.state.infoDataOneColor:'#fff'}} src={record.iconUrl} alt=""/>
            <div style={{lineHeight:'24px',height:"24px",marginLeft:'8px',color:'#595959',display: 'inline-block',verticalAlign: 'bottom'}}>
              {text.length>15?(
                <Tooltip title={text}>
                  <span>
                    {textNew}
                  </span>
                </Tooltip>
              ):(
                <span>
                    {textNew}
                  </span>
              )}
            </div>
          </div>
        )
      },
    },{
      title:  ServicePortalStore.languages[`${intlPrefix}.edit.tableType`],
      dataIndex: 'typeCode',
      width:'10%',
      render: (text, record) => {
        let typeCodeText;
        if(this.state.typeCode){
          this.state.typeCode.forEach(item=>{
            if(item.lookupValue===text){
              typeCodeText=item.lookupMeaning
            }
          })
        }
        return (
          <span style={{color:'#595959'}}>{typeCodeText}</span>
        )
      },
    },{
      title: ServicePortalStore.languages[`${intlPrefix}.edit.tableContent`],
      dataIndex: 'content',
      width:'20%',
      render: (text, record) => {
        if(record.typeCode==='URL'){
          if(record.redirectUrl.length>25){
            const textNew=record.redirectUrl.length>25?record.redirectUrl.slice(0,24)+'...':record.redirectUrl;
            return (
              <Tooltip title={record.redirectUrl}>
                <span>
                  {textNew}
                </span>
              </Tooltip>
            )
          }else {
            return(
              <span>
                {record.redirectUrl}
              </span>
            )
          }
        }else if(record.typeCode==='RICH TEXT'){
          return <a onClick={()=>this.detailsText(record)}>{ServicePortalStore.languages[`${intlPrefix}.edit.detailsText`]}</a>
        }else {
          if(text){
            if(text.length>25){
              let textNew=record.content&&record.content.length>25?record.content.slice(0,24)+'...':record.content;
              return (
                <Tooltip title={text}>
                <span>
                  {textNew}
                </span>
                </Tooltip>
              )
            }else {
              return(
                <span>
                {text}
              </span>
              )
            }
          }
        }
      },
    },{
      title: ServicePortalStore.languages[`${intlPrefix}.edit.description`],
      dataIndex: 'description',
      width:'20%',
      render: (text, record) => {
        let textNew=text;
        if(text.length>25){
          textNew=text.slice(0,24)+'...';
        }
        return(
          <Tooltip title={text}>
            <span>
              {textNew}
            </span>
          </Tooltip>
        )
      },
    }];

    if(this.state.TabPane_five_formClick){
      columns.push({
        title: ServicePortalStore.languages[`${intlPrefix}.edit.action`],
        dataIndex: 'operation',
        width:'10%',
        render: (text, record) => {
          return (
            <div className="editable-row-operations">
              <Tooltip title={ServicePortalStore.languages[`edit`]}>
                <Icon
                  onClick={()=>{
                    return(
                      this.editRecord(record)
                    )
                  }}
                  type="edit-surface"
                  style={{
                    color: '#2196F3',
                    cursor: 'pointer',
                  }}
                />
              </Tooltip>
              <Tooltip title={ServicePortalStore.languages[`delete`]}>
                <Icon
                  onClick={()=>{
                    return(
                      this.deleteRecord(record)
                    )
                  }}
                  type="delete-surface"
                  style={{
                    color: '#2196F3',
                    cursor: 'pointer',
                    marginLeft:'16px'
                  }}
                />
              </Tooltip>
            </div>
          );
        },
      })
    }

    const typeCodeArr = [];
    let isRobot = false;
    if(this.state.typeCode){
      this.state.typeCode.forEach(item=>{
        for (var i in this.state.data){
          if(this.state.data[i].typeCode==='ROBOT'){
            isRobot = true;
            break
          }
        }
        if(isRobot&&item.lookupValue==='ROBOT'){
          typeCodeArr.push(<Option disabled value={item.lookupValue}>{item.lookupMeaning}</Option>)
        }else {
          typeCodeArr.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>)
        }
      })
    }

    let robotRadioName;
    if(this.state.robotRadio||this.state.rowRecordEditData){
      const robotRadioText=this.state.robotRadio?`${this.state.robotRadio.chatrobotNickname?this.state.robotRadio.chatrobotNickname:''}（${this.state.robotRadio.chatrobotCode?this.state.robotRadio.chatrobotCode:''}）`:this.state.rowRecordEditData?this.state.rowRecordEditData.content:'';
      robotRadioName=robotRadioText&&robotRadioText.length>36?robotRadioText.slice(0,35)+'...':robotRadioText
    }

    let knowledgeSpaceRadioName;
    if(this.state.knowledgeSpaceRadio||this.state.rowRecordEditData){
      const knowledgeSpaceRadioText = this.state.knowledgeSpaceRadio?this.state.knowledgeSpaceRadio.spaceName:this.state.rowRecordEditData?this.state.rowRecordEditData.content:'';
      knowledgeSpaceRadioName=knowledgeSpaceRadioText&&knowledgeSpaceRadioText.length>36?knowledgeSpaceRadioText.slice(0,35)+'...':knowledgeSpaceRadioText
    }

    let serviceRadioName;
    if(this.state.serviceRadio||this.state.rowRecordEditData){
      const serviceRadioText = this.state.serviceRadio?this.state.serviceRadio.catalogueName:this.state.rowRecordEditData?this.state.rowRecordEditData.content:'';
      serviceRadioName=serviceRadioText&&serviceRadioText.length>36?serviceRadioText.slice(0,35)+'...':serviceRadioText
    }

    let knowledgeRadioName;
    if(this.state.knowledgeRadio||this.state.rowRecordEditData){
      const knowledgeRadioText = this.state.knowledgeRadio?this.state.knowledgeRadio.knowledgeTitle:this.state.rowRecordEditData?this.state.rowRecordEditData.content:'';
      knowledgeRadioName=knowledgeRadioText&&knowledgeRadioText.length>36?knowledgeRadioText.slice(0,35)+'...':knowledgeRadioText
    }

    return(
      <div className="tabFive">
        <div>
          <div
            style={{
              height: '32',
              // marginBottom: '16px'
            }}
          >
            {/*<div className="formInputSou">*/}
              {/*<Icon onClick={this.inputSouClick} className="input_icon" type="sousuo" />*/}
              {/*<input onKeyDown={this.inputSouClick} disabled={this.state.TabPane_five_formClick?true:false} value={this.state.inputSou} onChange={(e)=>this.setState({inputSou:e.target.value})} placeholder='搜索'/>*/}
            {/*</div>*/}
            {this.state.TabPane_five_formClick?(
              <Button
                style={{
                  zIndex:'99',
                  float: 'right',
                  background:'#2196F3 ',
                  border: '1px solid #2196F3',
                  color: '#fff'
                }}
                onClick={this.newlyBuildRecord}
              >
                <Icon style={{height:'32px',lineHeight:'32px',fontSize:'14px', color: '#fff'}} type="xinjian-"/>
                <span>{ServicePortalStore.languages[`create`]}</span>
              </Button>
              ):(
              <Button
                style={{
                  zIndex:'99',
                  float: 'right',
                  background:'#2196F3 ',
                  border: '1px solid #2196F3',
                  color: '#fff'
                }}
                onClick={()=>{
                  let newData;
                  if(this.state.inputSou&&this.state.dataOriginal){
                    newData = JSON.parse(JSON.stringify(this.state.dataOriginal));
                  }else {
                    newData = [...this.state.data];
                  }
                  newData.forEach(item=>{
                    item.editable=true;
                  });
                  this.setState({
                    TabPane_five_formClick:true,
                    data:newData
                  })
                }}
              >
                {ServicePortalStore.languages[`edit`]}
              </Button>
            )}

          </div>
        </div>

        <Modal
          title={this.state.rowRecordEditData?ServicePortalStore.languages[`edit`]:ServicePortalStore.languages[`create`]}
          visible={this.state.newModalVisible}
          className="tabFive_newModal"
          width={500}
          maskClosable={false}
          destroyOnClose={true}
          onOk={this.handleOkNewly}
          onCancel={this.handleCancelNewly}
          center
          style={{
            margin:'0',
            padding:'0'
          }}
          footer={[
            <Button key="back" onClick={this.handleCancelNewly}>
              {ServicePortalStore.languages[`cancle`]}
            </Button>,
            <Button key="submit" type="primary" loading={this.state.modalSubmitting} onClick={this.handleOkNewly}>
              {ServicePortalStore.languages[`ok`]}
            </Button>,
          ]}
        >
          <Form>
            <Row style={{marginTop:'24px'}}>
              <Col span={24}>
                {/* 名称 */}
                <span style={{display:'inline-block',width:'32px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.tableName`]}<span style={{color: 'red'}}>*</span></span>
                <FormItem
                  style={{display:'inline-block',marginLeft:'16px'}}
                >
                  {getFieldDecorator('name', {
                    rules: [{
                      required: true,
                      message: ServicePortalStore.languages[`${intlPrefix}.edit.fillInName`]
                    }],
                    initialValue: this.state.rowRecordEditData?this.state.rowRecordEditData.name : '',
                  })(
                    <MultiLanguageFormItem
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
                      type="FormItem"
                      FormLanguage={this.state.multiLanguageValue}
                      languageEnv={this.state.languageEnv}
                      descriptionObject={ServicePortalStore.languages[`${intlPrefix}.edit.tableName`]}
                      required="true"
                      inputWidth={400}
                      placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.fillInName`]}
                    />
                  )}
                </FormItem>
              </Col>
            </Row>

            <Row style={{marginTop:'24px'}}>
              <Col span={24}>
                {/* 描述 */}
                <span style={{display:'inline-block',width:'32px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.description`]}</span>
                <FormItem
                  style={{display:'inline-block',marginLeft:'16px'}}
                >
                  {getFieldDecorator('description', {
                    initialValue: this.state.rowRecordEditData?this.state.rowRecordEditData.description : '',
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
                      descriptionObject={ServicePortalStore.languages[`${intlPrefix}.edit.description`]}
                      required="true"
                      inputWidth={400}
                      placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.fillInDescription`]}
                    />
                  )}
                </FormItem>
              </Col>
            </Row>

            <Row style={{marginTop:'16px'}}>
              <Col span={12}>
                {/* 类型 */}
                <span style={{display:'inline-block',width:'32px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.tableType`]}<span style={{color: 'red'}}>*</span></span>
                <FormItem
                  style={{width:'120px',display:'inline-block',marginLeft:'16px'}}
                >
                  {getFieldDecorator('typeCode', {
                    rules: [{
                      required: true,
                      message: ServicePortalStore.languages[`${intlPrefix}.edit.choiceTableType`]
                    }],
                    initialValue: this.state.rowRecordEditData?this.state.rowRecordEditData.typeCode : '',
                  })(
                    <Select onChange={this.typeCodeOnChange} disabled={this.state.rowRecordEditData?true:false} placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.choiceTableType`]}>
                      {typeCodeArr}
                    </Select>
                  )}
                </FormItem>
              </Col>
            </Row>

            <Row>
              <Col span={24}>
                <div>
                  <span style={{verticalAlign: 'super',display:'inline-block',width:'32px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.logo`]}<span style={{color: 'red'}}>*</span></span>
                  <div style={{display:'inline-block',position: 'relative',}}>
                    <div style={{display:'inline-block',marginLeft:'16px',padding:'5px 5px 5px 0'}}>
                      <img style={{background:this.state.infoDataOneColor?this.state.infoDataOneColor:'#fff'}}  width="88px" height="88px" src={this.state.imageUrl?this.state.imageUrl:bigImg} alt=""/>
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
                      {this.state.imageUrl?ServicePortalStore.languages[`${intlPrefix}.edit.replaceLogoModel`]:ServicePortalStore.languages[`${intlPrefix}.edit.uploadLogoModel`]}
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
                      initialValue: this.state.rowRecordEditData?this.state.rowRecordEditData.redirectUrl : '',
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
                    {(this.state.knowledgeRadio||this.state.rowRecordEditData)&&!this.state.editDelete?(
                      <div style={{marginLeft: '8px'}}>
                        {this.renderTitleIcon(this.state.knowledgeRadio?this.state.knowledgeRadio:this.state.rowRecordEditData?this.state.rowRecordEditData:'')}
                        <span style={{marginLeft: '8px',verticalAlign: 'middle'}}>{knowledgeRadioName}</span>
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
                      (this.state.knowledgeSpaceRadio||this.state.rowRecordEditData)&&!this.state.editDelete?(
                        <div style={{marginLeft: '8px'}}>
                          <img style={{borderRadius:'4px'}} width='24px' height='24px' src={this.state.knowledgeSpaceRadio?this.state.knowledgeSpaceRadio.spaceLogo:this.state.rowRecordEditData?this.state.rowRecordEditData.logoUrl:''} alt=""/>
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

              {this.props.form.getFieldsValue().typeCode==='SERVICE CATALOG'?
                <div style={{marginBottom:'24px'}}>
                  <span>{ServicePortalStore.languages[`${intlPrefix}.edit.serviceCatalog`]}<span style={{color: 'red'}}>*</span></span>
                  <div style={{paddingTop:'8px'}}>
                    {
                      (this.state.serviceRadio||this.state.rowRecordEditData)&&!this.state.editDelete?(
                        <div style={{marginLeft: '8px'}}>
                          <img style={{borderRadius:'4px'}} width='24px' height='24px' src={this.state.serviceRadio?this.state.serviceRadio.cataloguePicture:this.state.rowRecordEditData?this.state.rowRecordEditData.logoUrl:''} alt=""/>
                          <span style={{marginLeft: '8px',verticalAlign: 'middle'}}>{serviceRadioName}</span>

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
                              serviceVisible:true
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

              {this.props.form.getFieldsValue().typeCode==='ROBOT'?
                <div style={{marginBottom:'24px'}}>
                  <span>{ServicePortalStore.languages[`${intlPrefix}.edit.relationRobot`]}<span style={{color: 'red'}}>*</span></span>
                  <div style={{paddingTop:'8px'}}>
                    {
                      (this.state.robotRadio||this.state.rowRecordEditData)&&!this.state.editDelete?(
                        <div style={{marginLeft: '8px'}}>
                          <img style={{borderRadius:'2px'}} width="20px" height="20px" src={this.state.robotRadio?this.state.robotRadio.chatrobotCover:this.state.rowRecordEditData?this.state.rowRecordEditData.logoUrl:''} alt=""/>
                          <span style={{marginLeft: '8px',verticalAlign: 'middle'}}>
                            {robotRadioName}
                          </span>

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
                              robotVisible:true
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

              {this.props.form.getFieldsValue().typeCode==='RICH TEXT'?
                <div style={{marginBottom:'24px',marginTop:'8px'}}>
                  <span>{ServicePortalStore.languages[`${intlPrefix}.edit.tableContent`]}<span style={{color: 'red'}}>*</span></span>
                  <WYSIWYGEditor
                    value={this.state.content?this.state.content:this.state.rowRecordEditData?JSON.parse(this.state.rowRecordEditData.content):''}
                    style={{ width: '100%' }}
                    onChange={value => this.handleTextContent(value)}
                  />
                </div>
                :''
              }
            </Row>
          </Form>
        </Modal>

        <KnowledgeSpaceModal visible={this.state.knowledgeSpaceVisible} handleknowledgeSpaceModal={this.handleknowledgeSpaceModal.bind(this)} />

        <KnowledgeModal visible={this.state.knowledgeVisible} handleknowledgeModal={this.handleknowledgeModal.bind(this)} />

        <Robot visible={this.state.robotVisible} handleRobotModal={this.handleRobotModal.bind(this)} />

        <AvatarUploader colorOne={this.state.infoDataOneColor} visible={this.state.LOGONewVisible?this.state.LOGONewVisible:false} handleLogoModal={this.handleLogoModal.bind(this)}  />

        <ServiceModal visible={this.state.serviceVisible?this.state.serviceVisible:false} handleServiceModal={this.handleServiceModal.bind(this)}  />

        {
          this.state.previewVisible? (
            <Modal
              title={ServicePortalStore.languages[`${intlPrefix}.edit.detailsTextModal`]}
              visible={this.state.previewVisible}
              okText={ServicePortalStore.languages[`ok`]}
              cancelText={ServicePortalStore.languages[`close`]}
              className="tabFive_previewModal"
              width="50%"
              footer={null}
              onOk={() => {
                this.setState({ previewVisible: false });
              }}
              onCancel={() => {
                this.setState({ previewVisible: false });
              }}
              style={{ top: 100 }}
            >
              {this.renderPreviewContent(this.state.detailsTextData)}
            </Modal>
          ) : ''
        }
        <Table
          className={this.state.TabPane_five_formClick?"edit_service_tab_table_five":''}
          rowKey={record => {
            if (record.id) {
              return ('id' + record.id);
            } else {
              return ('key' + record.key);
            }
          }}
          dataSource={this.state.data}
          columns={columns}
          filterBar={false}
          pagination={false}
          components={this.components}
          onRow={(record, index) => {
            if(this.state.TabPane_five_formClick){
              return ({
                index,
                moveRow: this.moveRow,
              })
            }
          }}
        />

        {this.state.TabPane_five_formClick?(
          <div style={{marginTop:'24px'}}>
            <Button loading={this.state.saveSubmitting} onClick={this.handleSubmission} key="back" style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}}>{ServicePortalStore.languages[`save`]}</Button>
            <Button
              onClick={()=>{
                if(this.state.dataOriginal){
                  const newData = JSON.parse(JSON.stringify(this.state.dataOriginal));
                  newData.forEach(item=>{
                    item.editable=false;
                  });
                  this.setState({
                    TabPane_five_formClick:false,
                    data:newData,
                    deleteArr:[],
                  })
                }else {
                  this.setState({
                    TabPane_five_formClick:false,
                    data:[],
                    deleteArr:[],
                  })
                }
              }}
              key="back"
              style={{border: '1px solid #ACB3BF',color: '#818999',marginLeft:'12px'}}
            >
              {ServicePortalStore.languages[`cancle`]}
            </Button>
          </div>
        ):""}
      </div>
    )
  }

}

export default Form.create({})(TabFive);
