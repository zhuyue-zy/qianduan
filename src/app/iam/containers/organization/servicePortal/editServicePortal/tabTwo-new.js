import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { Page, Header, Content, Permission, Action, axios } from 'yqcloud-front-boot';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Switch, Checkbox, Input, Popover, message, Popconfirm, Progress, Form, Select, Col, Row, } from 'yqcloud-ui';
import MultiLanguageFormItem from '../NewMultiLanguageFormItem';
import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
import update from 'immutability-helper';
import KnowledgeSpaceModal from './knowledgeSpaceList'
import KnowledgeModal from './knowledgeList'
import ServicePortalStore from "../../../../stores/organization/servicePortal";
import ServiceModal from './serviceList'

const FormItem = Form.Item;
const confirm = Modal.confirm;
const intlPrefix = 'organization.servicePortal';

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
class TabTwoNew extends Component {

  constructor(props) {
    super(props);

    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {
      TabPane_twoNew_formClick:false, // tab2是否编辑状态
      data:[],
      expandedRowKey: [],
      key:1,
      // 存放多语言信息
      multiLanguageValue: {
        name:{},
        description:{},
      },
      newModalVisible:false,
      knowledgeSpaceVisible:false,
      knowledgeVisible:false,
      serviceVisible:false,
      modalSubmitting:false,
      loadingTable:false,
      editRecord:'',
      editDataArr:[],
      saveSubmitting:false,
    };
  }

  componentWillMount() {
    this.getLanguage();
    this.getTopContents();
    this.getTypeCodeQuery();
    this.getHierarchyTypeQuery();
  }

  getTopContents = ()=>{
    const idData = this.props.urlId;
    this.setState({loadingTable:true});
    ServicePortalStore.getTopContent(this.organizationId,idData).then(item=>{
      if(!item.failed){
        if(item.length>0){
          item=this.forInfoData(item)
        }
        this.setState({
          data:item || [],
          loadingTable:false,
          dataOriginal:JSON.parse(JSON.stringify(item)) || [],
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

  forInfoData=(data)=>{
    if(data){
      if(data.length>0){
        data.forEach(item=>{
          item.children=item.childPortalTopBar&&item.childPortalTopBar.length>0?item.childPortalTopBar:'';
          if(item.childPortalTopBar&&item.childPortalTopBar.length>0){
            item.children=this.forInfoData(item.childPortalTopBar)
          }
        })
      }
    }
    return data
  };

  // 搜索
  inputSouClick =(stag , e)=>{
    const idData = this.props.urlId;
    const evt = window.event || e;
    if(stag==='Icon'||(stag==='key'&&evt.keyCode === 13)){
      this.setState({loadingTable:true});
      ServicePortalStore.getTopContent(this.organizationId,idData,this.state.inputSou).then(item=>{
        if(!item.failed){
          if(item.length>0){
            item=this.forInfoData(item)
          }
          this.setState({
            data:item || [],
            loadingTable:false,
          });
        }else {
          this.setState({loadingTable:false});
        }
      })
        .catch((error) => {
          Choerodon.handleResponseError(error);
          this.setState({loadingTable:false});
        });
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

  //  层级快码查询
  getHierarchyTypeQuery= () => {
    const code = "PORTAL_NAV_LEVEL";
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

  //  层级快码查询
  getTypeCodeQuery= () => {
    const code = "PORTAL_NAV_TYPE";
    axios.get(`fnd/v1/${this.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        if(!data.failed){
          this.setState({
            typeCodeList: data
          })
        }else {
          Choerodon.prompt(item.message);
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  // 表格行移入
  onMouseEnterRow=(record)=>{
    const newData = [...this.state.data];
    // const target = newData.filter(item => record === item)[0];
    const target = this.recordData(newData,record);
    if (target) {
      target.newlyBuild = true;
      this.setState({ data: newData });
    }
  };

  // 表格行移出
  onMouseLeaveRow=(record)=>{
    const newData = [...this.state.data];
    // const target = newData.filter(item => record === item)[0];
    const target = this.recordData(newData,record);
    if (target) {
      delete target.newlyBuild;
      this.setState({ data: newData });
    }
  };

  components = {
    body: {
      row: BodyRow,
    },
  };

  moveRow = (dragIndex, hoverIndex,record) => {
    const { data,mouseDownRecord } = this.state;
    const dataArr = this.ergodicFunMove(data, mouseDownRecord,dragIndex, hoverIndex);
    this.setState({
      data:dataArr
    });
  };

  // 点击展开按钮
  onExpandData = (e, rend) => {
    const {SetValueStore} = this.props;
    const _this = this;
    if (e) {
      const arr = this.state.expandedRowKey;
      if (rend.id) {
        arr.push('id' + rend.id);
      } else {
        arr.push('key' + rend.key);
      }
      this.setState({
        expandedRowKey: arr
      })
    } else {
      const arr = this.state.expandedRowKey;
      if(arr&&arr.length>0){
        arr.forEach((item, index) => {
          if ((item === ('id' + rend.id)) || (item === ('key' + rend.key))) {
            arr.splice(index, 1)
          }
        });
      }
      this.setState({
        expandedRowKey: arr
      })
    }
  };

  // 遍历树，获得移动层级
  ergodicFunMove = (data, record,dragIndex, hoverIndex) => {
    let arr;
    for (let i in data) {
      if (data[i] === record) {
        if ((dragIndex + 1 === hoverIndex) || (dragIndex === hoverIndex + 1)) {
          const serial = data[dragIndex].rankNumber;
          data[dragIndex].rankNumber = data[hoverIndex].rankNumber;
          data[hoverIndex].rankNumber = serial;
          const editDataArrs = this.state.editDataArr;
          if(!data[i].parentKey){
            editDataArrs.push(data[hoverIndex]);
            editDataArrs.push(data[dragIndex]);
            this.setState({
              editDataArr: editDataArrs
            });
          }
        }else {
          const editDataArrs = this.state.editDataArr;
          data[dragIndex].rankNumber = data[hoverIndex].rankNumber;
          editDataArrs.push(data[dragIndex]);
          for (var j in data) {
            if (dragIndex < hoverIndex) {
              if (data[j] !== data[dragIndex] && j <= hoverIndex && j > dragIndex) {
                data[j].rankNumber -= 1;
                if(!data[i].parentKey){
                  editDataArrs.push(data[j]);
                }
              }
            } else {
              if (data[j] !== data[dragIndex] && j >= hoverIndex && j < dragIndex) {
                data[j].rankNumber += 1;
                if(!data[i].parentKey){
                  editDataArrs.push(data[j]);
                }
              }
            }
          }

          this.setState({
            editDataArr: editDataArrs
          });
        }

        const dragRow = data[dragIndex];
        const dataNew = update(data, {
          $splice: [[dragIndex, 1], [hoverIndex, 0, dragRow]],
        });
        arr = dataNew;
        break
      } else {
        if (data[i].children) {
          data[i].children = this.ergodicFunMove(data[i].children, record,dragIndex, hoverIndex);
          arr = data;
        }
      }
    }
    if (arr) {
      return arr;
    }else {
      return data;
    }
  };

  // 新建
  newlyBuild=()=>{
    this.setState({
      newModalVisible:true,
      newState:'NEW',
    })
  };

  // 新建
  newlyBuildRecordTitle=(record)=>{
    this.setState({
      newModalVisible:true,
      newState:'NEW_Children',
      parentRecord:record,
    })
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

  recordData=(data,record)=>{
    let arr;
    if(data){
      for (var i in data){
        if(data[i]===record){
          arr=data[i];
          break
        }else {
          if(data[i].children){
            arr=this.recordData(data[i].children,record)
            if (arr) {
              break
            }
          }
        }
      }
    }
    return arr
  };

  // 新建保存
  handleOkNewly=()=>{
    const {form}=this.props;
    const {key,data,editRecord,editDataArr,parentRecord,serviceRadio,knowledgeRadio,knowledgeSpaceRadio} = this.state;
    form.validateFields((err, fieldsValue) => {
      if(!err){
        if(editRecord&&this.state.newState==='EDIT'){
          editRecord.name=fieldsValue.name;
          editRecord.description=fieldsValue.description;
          editRecord.typeCode=fieldsValue.typeCode;
          editRecord.__tls=this.state.multiLanguageValue;
          if(fieldsValue.hierarchy==='MENU'&&fieldsValue.typeCode!=='URL'){
            if((serviceRadio||knowledgeRadio||knowledgeSpaceRadio||this.state.editRecord)&&!this.state.editDelete){
              if(fieldsValue.typeCode==='SERVICE CATALOG') { // 服务目录
                // item.spaceCode=this.state.serviceRadio?this.state.knowledgeSpaceRadio.spaceCode:item.spaceCode;
                editRecord.logoUrl=this.state.serviceRadio?this.state.serviceRadio.cataloguePicture:editRecord.logoUrl;
                editRecord.content=this.state.serviceRadio?this.state.serviceRadio.catalogueName:editRecord.content;
                editRecord.identifierId=this.state.serviceRadio?this.state.serviceRadio.id:editRecord.identifierId;
              }if(editRecord.typeCode==='KNOWLEDGESPACE') { // 知识空间
                if(this.state.knowledgeSpaceRadio){
                  editRecord.space=this.state.knowledgeSpaceRadio;
                  editRecord.spaceCode=this.state.knowledgeSpaceRadio.spaceCode;
                  editRecord.logoUrl=this.state.knowledgeSpaceRadio.spaceLogo;
                  editRecord.content=this.state.knowledgeSpaceRadio.spaceName;
                }
              }if(editRecord.typeCode==='KNOWLEDGE') { // 知识
                if(this.state.knowledgeRadio){
                  editRecord.knowledge=this.state.knowledgeRadio;
                  if(this.state.knowledgeRadio.typeCode==='single'){
                    editRecord.logoUrl=this.state.knowledgeRadio.typeCode+this.state.knowledgeRadio.contentTypeCode;
                  }else {
                    editRecord.logoUrl=this.state.knowledgeRadio.typeCode;
                  }
                  editRecord.identifierId=this.state.knowledgeRadio.knowledgeBaseId;
                  editRecord.content=this.state.knowledgeRadio.knowledgeTitle;
                }
              }
              editDataArr.push(editRecord);
              this.setState({
                data,
                editDataArr,
                newModalVisible:false,
                editRecord:'',
                multiLanguageValue:{
                  name:{},
                  description:{},
                }
              });

            }else {
              Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.relation`]);
            }
          }else {
            if(editRecord.typeCode==='URL') { // 链接
              editRecord.redirectUrl=fieldsValue.redirectUrl;
            }
            if(!editRecord.parentKey){
              editDataArr.push(editRecord);
            }
            this.setState({
              data,
              editDataArr,
              newModalVisible:false,
              editRecord:'',
              multiLanguageValue:{
                name:{},
                description:{},
              }
            });
          }
        }else {
          if(this.state.newState==="NEW"){
            let rankNumberMox=data.length>0?data[0].rankNumber:0;
            if(data&&data.length>0){
              data.forEach(item=>{
                if(item.rankNumber>rankNumberMox){
                  rankNumberMox = item.rankNumber
                }
              });
            }
            const newData = {
              name:fieldsValue.name,
              hierarchy:fieldsValue.hierarchy,
              description:fieldsValue.description,
              typeCode:fieldsValue.typeCode,
              rankNumber:rankNumberMox+1,
              level:1,
              portalId:this.props.urlId,
              parentId:0,
              key:key,
              __tls:this.state.multiLanguageValue,
              childPortalTopBar: null,
            };
            if(fieldsValue.hierarchy==='MENU'&&fieldsValue.typeCode!=='URL'){
              if((serviceRadio||knowledgeRadio||knowledgeSpaceRadio||this.state.editRecord)&&!this.state.editDelete){
                if(fieldsValue.typeCode==='KNOWLEDGESPACE') { // 知识空间
                  newData.space=this.state.knowledgeSpaceRadio;
                  newData.spaceCode=this.state.knowledgeSpaceRadio.spaceCode;
                  newData.logoUrl=this.state.knowledgeSpaceRadio.spaceLogo;
                  newData.content=this.state.knowledgeSpaceRadio.spaceName;
                }if(fieldsValue.typeCode==='SERVICE CATALOG') { // 服务目录
                  newData.service=this.state.serviceRadio;
                  newData.logoUrl=this.state.serviceRadio.cataloguePicture;
                  newData.content=this.state.serviceRadio.catalogueName;
                  newData.identifierId=this.state.serviceRadio.id;
                }if(fieldsValue.typeCode==='KNOWLEDGE') { // 知识
                  newData.knowledge=this.state.knowledgeRadio;
                  if(this.state.knowledgeRadio.typeCode==='single'){
                    newData.logoUrl=this.state.knowledgeRadio.typeCode+this.state.knowledgeRadio.contentTypeCode;
                  }else {
                    newData.logoUrl=this.state.knowledgeRadio.typeCode;
                  }
                  newData.identifierId=this.state.knowledgeRadio.knowledgeBaseId;
                  newData.content=this.state.knowledgeRadio.knowledgeTitle;
                }
                editDataArr.push(newData);
                data.push(newData);
                this.setState({
                  data,
                  editDataArr,
                  newModalVisible:false,
                  editRecord:'',
                  knowledgeSpaceRadio:'',
                  knowledgeRadio:'',
                  serviceRadio:'',
                  key:key+1,
                  multiLanguageValue:{
                    name:{},
                    description:{},
                  }
                })
              }else {
                Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.relation`]);
              }
            }else {
              if(fieldsValue.typeCode==='URL') { // 链接
                newData.redirectUrl=fieldsValue.redirectUrl;
              }
              editDataArr.push(newData);
              data.push(newData);
              this.setState({
                data,
                editDataArr,
                newModalVisible:false,
                editRecord:'',
                knowledgeSpaceRadio:'',
                knowledgeRadio:'',
                serviceRadio:'',
                key:key+1,
                multiLanguageValue:{
                  name:{},
                  description:{},
                }
              })
            }
          }

          if(this.state.newState==='NEW_Children'){
            const arr = this.state.expandedRowKey;
            if(parentRecord) {
              let rankNumberMox = 0;
              if (parentRecord.children) {
                if (parentRecord.children.length > 0) {
                  rankNumberMox = parentRecord.children[0].rankNumber;
                  parentRecord.children.forEach(item => {
                    if (item.rankNumber > rankNumberMox) {
                      rankNumberMox = item.rankNumber
                    }
                  });
                }
              }
              const newData = {
                name:fieldsValue.name,
                hierarchy:fieldsValue.hierarchy,
                description:fieldsValue.description,
                typeCode:fieldsValue.typeCode,
                rankNumber:rankNumberMox+1,
                level:parentRecord.level+1,
                portalId:this.props.urlId,
                parentId:parentRecord.id?parentRecord.id:null,
                key:key,
                __tls:this.state.multiLanguageValue,
                childPortalTopBar: null,
              };

              if(fieldsValue.hierarchy==='MENU'&&fieldsValue.typeCode!=='URL'){
                if((serviceRadio||knowledgeRadio||knowledgeSpaceRadio||this.state.editRecord)&&!this.state.editDelete){
                  if(fieldsValue.typeCode==='KNOWLEDGESPACE') { // 知识空间
                    newData.space=this.state.knowledgeSpaceRadio;
                    newData.spaceCode=this.state.knowledgeSpaceRadio.spaceCode;
                    newData.logoUrl=this.state.knowledgeSpaceRadio.spaceLogo;
                    newData.content=this.state.knowledgeSpaceRadio.spaceName;
                  }if(fieldsValue.typeCode==='SERVICE CATALOG') { // 服务目录
                    newData.service=this.state.serviceRadio;
                    newData.logoUrl=this.state.serviceRadio.cataloguePicture;
                    newData.content=this.state.serviceRadio.catalogueName;
                    newData.identifierId=this.state.serviceRadio.id;
                  }if(fieldsValue.typeCode==='KNOWLEDGE') { // 知识
                    newData.knowledge=this.state.knowledgeRadio;
                    if(this.state.knowledgeRadio.typeCode==='single'){
                      newData.logoUrl=this.state.knowledgeRadio.typeCode+this.state.knowledgeRadio.contentTypeCode;
                    }else {
                      newData.logoUrl=this.state.knowledgeRadio.typeCode;
                    }
                    newData.identifierId=this.state.knowledgeRadio.knowledgeBaseId;
                    newData.content=this.state.knowledgeRadio.knowledgeTitle;
                  }
                  if(!parentRecord.children){
                    parentRecord.children=[];
                    parentRecord.children.push(newData);
                  }else {
                    parentRecord.children.push(newData);
                  }
                  if(parentRecord.id){
                    newData.parentId=parentRecord.id;
                    editDataArr.push(newData);
                    arr.push('id' + parentRecord.id);
                  }
                  if(parentRecord.key){
                    newData.parentKey=parentRecord.key;
                    arr.push('key' + parentRecord.key);
                    // editDataArr.push(parentRecord);
                  }
                  this.setState({
                    data,
                    editDataArr,
                    newModalVisible:false,
                    editRecord:'',
                    knowledgeSpaceRadio:'',
                    knowledgeRadio:'',
                    serviceRadio:'',
                    key:key+1,
                    multiLanguageValue:{
                      name:{},
                      description:{},
                    },
                    expandedRowKey: arr,
                    parentRecord:'',
                  })
                }else {
                  Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.relation`]);
                }
              }else {
                if(fieldsValue.typeCode==='URL') { // 链接
                  newData.redirectUrl=fieldsValue.redirectUrl;
                }
                if(!parentRecord.children){
                  parentRecord.children=[];
                  parentRecord.children.push(newData);
                }else {
                  parentRecord.children.push(newData);
                }
                if(parentRecord.id){
                  newData.parentId=parentRecord.id;
                  editDataArr.push(newData);
                  arr.push('id' + parentRecord.id);
                }
                if(parentRecord.key){
                  newData.parentKey=parentRecord.key;
                  arr.push('key' + parentRecord.key);
                  // editDataArr.push(parentRecord);
                }
                this.setState({
                  data,
                  editDataArr,
                  newModalVisible:false,
                  editRecord:'',
                  knowledgeSpaceRadio:'',
                  knowledgeRadio:'',
                  serviceRadio:'',
                  key:key+1,
                  multiLanguageValue:{
                    name:{},
                    description:{},
                  },
                  expandedRowKey: arr,
                  parentRecord:'',
                })
              }
            }
          }
        }
      }
    })
  };

  // 新建取消
  handleCancelNewly=()=>{
    this.setState({
      newModalVisible:false,
      knowledgeSpaceRadio:'',
      knowledgeRadio:'',
      serviceRadio:'',
      modalSubmitting:false,
      editRecord:'',
      editDelete:false,
      multiLanguageValue:{
        name:{},
        description:{},
      }
    })
  };

  // 行编辑
  rowEdit = (record) =>{
    this.setState({
      newModalVisible:true,
      editRecord:record,
      multiLanguageValue:record.__tls,
      newState:"EDIT",
    })
  };

  // 去重
  uniq = (array) => {
    const temp = []; //一个新的临时数组
    if(array&&array.length>0){
      array.forEach(data_1=>{
        let isData=false;
        if(temp&&temp.length>0){
          temp.forEach(data_2=>{
            if(data_2.id){
              if(data_2.id===data_1.id){
                isData=true;
              }
            }
            if(data_2.key){
              if(data_2.key===data_1.key){
                isData=true;
              }
            }
          });
        }
        if(!isData){
          temp.push(data_1)
        }
      });
    }
    return temp;
  };

  forInfoData_reverse=(data)=>{
    if(data){
      if(data.length>0){
        data.forEach(item=>{
          if(item.children&&item.children.length>0){
            item.childPortalTopBar=this.forInfoData_reverse(item.children)
          }
        })
      }
    }
    return data
  };

  // 保存
  saveOnClick=()=>{
    const dataArr = this.forInfoData_reverse(this.uniq(this.state.editDataArr));
    this.setState({ saveSubmitting: true });
    ServicePortalStore.setTopContent(this.organizationId,this.props.urlId,dataArr).then(item=>{
      if(!item.failed){
        Choerodon.prompt(ServicePortalStore.languages[`save.success`]);
        this.getTopContents();
        this.setState({
          saveSubmitting: false,
          editDataArr:[],
          TabPane_twoNew_formClick:false,
        });
      }else {
        Choerodon.prompt(res.message);
        this.setState({ saveSubmitting: false });
      }
    })
      .catch((error) => {
        Choerodon.handleResponseError(error);
        this.setState({ saveSubmitting: false });
      });
  };

  // 删除行
  deleteRecord = (record) =>{
    if(!(record.children&&record.children.length>0)){
      const newData =[...this.state.data];
      const {editDataArr}=this.state;
      const target = this.recordData(newData,record);
      if (target) {
        target.deleted=true;
        editDataArr.push(target);
        const dataNew=this.deleteRecordNewData(newData,target)
        this.setState({ data: dataNew ,editDataArr});
      }
    }else {
      Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.thereAreChildren`]);
    }
  };

  deleteRecordNewData=(data,record)=>{
    if(data&&data.length>0){
      data.forEach((item,i)=>{
        if(item===record){
          data.splice(i, 1);
          return
        }else {
          if(item.children&&item.children.length>0){
            item.children=this.deleteRecordNewData(item.children,record)
            if(!(item.children.length>0)){
              item.children=null
            }
          }
        }
      });
    }

    return data
  };

  typeCodeOnChange=()=>{
    this.setState({
      knowledgeSpaceRadio:'',
      knowledgeRadio:'',
      serviceRadio:'',
      editDelete:true,
    })
  }

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
          serviceRadio:'',
          editDelete:true,
        })
      },
    });
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

  /* 渲染知识类型图标 */
  renderTitleIcon = (record) => {
    if(this.state.editRecord){
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

  isHOMEAndList=(data,isData)=>{
    let datastg = isData
    data.forEach((item)=>{
      if(item.hierarchy==='HOME'){
        datastg.isHome=true
      }
      if(item.hierarchy==='LIST'){
        datastg.isList=true
      }
      if(item.children&&item.children.length>0){
        datastg=this.isHOMEAndList(item.children,datastg)
      }
    });
    return datastg
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const columns= [{
      title: ServicePortalStore.languages[`${intlPrefix}.edit.tableName`],
      dataIndex: 'name',
      width:"35%",
      key: 'name',
      render: (text,record) =>{
        return (
          <span style={{display: 'inline-block', verticalAlign: 'middle'}}>
            <span>{text}</span>
            {record.newlyBuild&&record.hierarchy==='MENU_GROUP'&&this.state.TabPane_twoNew_formClick&&record.level<3?(
              <span
                style={{
                  marginLeft:'25px'
                }}
              >
                <Tooltip title={ServicePortalStore.languages[`create`]}>
                  <Icon
                    onClick={()=>{
                      return(
                        this.newlyBuildRecordTitle(record)
                      )
                    }}
                    type="tianjiaziduan"
                    style={{
                      color: '#2196F3',
                      cursor: 'pointer',
                    }}
                  />
                </Tooltip>
                </span>):''
            }
        </span>)
      }
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.tableType`],
      dataIndex: 'hierarchy',
      key: 'hierarchy',
      render: (text,record) =>{
        let hierarchyText='';
        if(this.state.hierarchyType&&this.state.hierarchyType.length>0&&record.hierarchy!=='MENU'&&record.hierarchy!=='MENU_GROUP'){
          this.state.hierarchyType.forEach(item=>{
            if(item.lookupValue===text){
              hierarchyText=item.lookupMeaning
            }
          });
        }

        if(record.hierarchy&&record.hierarchy==='MENU_GROUP'){
          hierarchyText= ServicePortalStore.languages[`${intlPrefix}.edit.type`]
        }

        if(record.hierarchy&&record.hierarchy==='MENU'){
          if(this.state.typeCodeList&&this.state.typeCodeList.length>0){
            this.state.typeCodeList.forEach(item=>{
              if(item.lookupValue===record.typeCode){
                hierarchyText=item.lookupMeaning
              }
            });
          }
        }

        if(!text){
          return '-'
        }else {
          return hierarchyText
        }
      }
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.tableContent`],
      dataIndex: 'content',
      key: 'content',
      render: (text,record) =>{
        if(record.hierarchy!=='MENU'){
          return '-'
        }else {
          if(record.typeCode==='URL'){
            return record.redirectUrl
          }else {
            return text
          }
        }
      }
    },  {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.description`],
      dataIndex: 'description',
      key: 'description',
    }];

    if(this.state.TabPane_twoNew_formClick){
      columns.push({
        title: ServicePortalStore.languages[`${intlPrefix}.edit.action`],
        key: 'action',
        width:'100px',
        render: (text, record) =>{
          return(
            <span>
            { this.state.TabPane_twoNew_formClick?(
              <span>
                <Tooltip title={ServicePortalStore.languages[`edit`]}>
                  <Icon
                    onClick={()=>this.rowEdit(record)}
                    // type="delete-surface"
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
                      marginLeft:'8px',
                    }}
                  />
                </Tooltip>
              </span>
            ):''}
          </span>
          )
        },
      })
    }

    const hierarchyOptionArr = [];
    let IsData={isList:false,isHome:false}
    if(this.state.hierarchyType){
      this.state.hierarchyType.forEach(item=>{
        // if(item.lookupValue!=='MENU'&&item.lookupValue!=='MENU_GROUP'){
        if(this.state.data&&this.state.data.length>0){
          this.state.data.forEach(item=>{
            IsData = this.isHOMEAndList(this.state.data,IsData)
            // if(item.hierarchy==='HOME'){
            //   isHome=true
            // }
            // if(item.hierarchy==='LIST'){
            //   isList=true
            // }
          });

        }
          if(item.lookupValue==='HOME'&&!IsData.isHome){
            hierarchyOptionArr.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>)
          }

          if(item.lookupValue==='HOME'&&IsData.isHome){
            hierarchyOptionArr.push(<Option disabled value={item.lookupValue}>{item.lookupMeaning}</Option>)
          }

          if(item.lookupValue==='LIST'&&!IsData.isList){
            hierarchyOptionArr.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>)
          }

          if(item.lookupValue==='LIST'&&IsData.isList){
            hierarchyOptionArr.push(<Option disabled value={item.lookupValue}>{item.lookupMeaning}</Option>)
          }

          if(item.lookupValue==='MENU'){
            hierarchyOptionArr.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>)
          }
          if(item.lookupValue==='MENU_GROUP'){
            if(this.state.parentRecord&&this.state.parentRecord.level>=2){
              hierarchyOptionArr.push(<Option disabled value={item.lookupValue}>{item.lookupMeaning}</Option>)
            }else {
              hierarchyOptionArr.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>)
            }
          }
        // }
      })
    }

    const typeCodeArr = [];
    if(this.state.typeCodeList&&this.state.typeCodeList.length>0){
      this.state.typeCodeList.forEach(item=>{
        // if(item.lookupValue!=='SERVICE CATALOG'){
          typeCodeArr.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>)
        // }
      })
    }

    let knowledgeSpaceRadioName;
    if(this.state.knowledgeSpaceRadio||this.state.editRecord){
      const knowledgeSpaceRadioText = this.state.knowledgeSpaceRadio?this.state.knowledgeSpaceRadio.spaceName:this.state.editRecord?this.state.editRecord.content:'';
      knowledgeSpaceRadioName=knowledgeSpaceRadioText?knowledgeSpaceRadioText.length>36?knowledgeSpaceRadioText.slice(0,35)+'...':knowledgeSpaceRadioText:''
    }

    let knowledgeRadioName;
    if(this.state.knowledgeRadio||this.state.editRecord){
      const knowledgeRadioText = this.state.knowledgeRadio?this.state.knowledgeRadio.knowledgeTitle:this.state.editRecord?this.state.editRecord.content:'';
      knowledgeRadioName=knowledgeRadioText?knowledgeRadioText.length>36?knowledgeRadioText.slice(0,35)+'...':knowledgeRadioText:''
    }

    let serviceRadioName;
    if(this.state.serviceRadio||this.state.editRecord){
      const serviceRadioText = this.state.serviceRadio?this.state.serviceRadio.catalogueName:this.state.editRecord?this.state.editRecord.content:'';
      serviceRadioName=serviceRadioText&&serviceRadioText.length>36?serviceRadioText.slice(0,35)+'...':serviceRadioText
    }

    return(
      <div className='tabTwo-new'>
        <div className='tabTwo-new-harder'>
          <div style={{ height: '32',marginBottom: '16px'}}>
            <div className="formInputSou">
              <Icon onClick={()=>this.inputSouClick('Icon')} className="input_icon" type="sousuo" />
              <input disabled={this.state.TabPane_twoNew_formClick?true:false} onKeyDown={(e)=>this.inputSouClick('key',e)} value={this.state.inputSou} onChange={(e)=>this.setState({inputSou:e.target.value})} placeholder={ServicePortalStore.languages[`${intlPrefix}.home.search`]}/>
            </div>
            {this.state.TabPane_twoNew_formClick?(
              <Button style={{zIndex:'99', float: 'right',background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}} onClick={this.newlyBuild}>
                <Icon style={{height:'32px',lineHeight:'32px',fontSize:'14px', color: '#fff'}} type="xinjian-"/>
                {ServicePortalStore.languages[`create`]}
              </Button>
              ):(
              <Button
                style={{
                  zIndex:'99',
                  float: 'right',
                  background:'#2196F3',
                  border: '1px solid #2196F3',
                  color: '#fff'
                }}
                onClick={()=>{
                  const {dataOriginal}=this.state;
                  let newData;
                  if(dataOriginal){
                    newData = JSON.parse(JSON.stringify(dataOriginal));
                    this.setState({
                      TabPane_twoNew_formClick:true,
                      inputSou:'',
                      data:newData
                    })
                  }else {
                    this.setState({
                      TabPane_twoNew_formClick:true,
                      inputSou:'',
                    })
                  }
                }}
              >
                {ServicePortalStore.languages[`edit`]}
              </Button>
            )}
          </div>
        </div>

        <div className='tabTwo-new-table'>
          <Table
            rowKey={record => {
              if (record.id) {
                return ('id' + record.id);
              } else {
                return ('key' + record.key);
              }
            }}
            className={this.state.TabPane_twoNew_formClick?"edit_service_tab_table_twoNew":''}
            columns={columns}
            expandedRowKeys={this.state.expandedRowKey}
            components={this.components}
            loading={this.state.loadingTable}
            dataSource={this.state.data}
            onExpand={this.onExpandData}
            filterBar={false}
            pagination={false}
            // onChange={this.handlePageChange}
            onRow={(record, index) => {
              if(this.state.TabPane_twoNew_formClick){
                return ({
                  index,
                  moveRow: (dragIndex, hoverIndex)=> {
                    this.moveRow(dragIndex, hoverIndex, record)
                  },
                  onMouseDown: () => {
                    this.setState({
                      mouseDownRecord: record,
                    })
                  },
                  onMouseEnter:()=>{this.onMouseEnterRow(record)}, // 移入
                  onMouseLeave: ()=>{this.onMouseLeaveRow(record)},// 移出
                })
              }

            }}
          />
        </div>

        <Modal
          title={this.state.editRecord?ServicePortalStore.languages[`edit`]:ServicePortalStore.languages[`create`]}
          visible={this.state.newModalVisible}
          className="tabTwoNew_newMode"
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
                    initialValue: this.state.editRecord?this.state.editRecord.name : '',
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
                      maxLength={this.state.newState==='NEW'|| this.state.editRecord.level===1?6:50}
                      enMaxLength={this.state.newState==='NEW'|| this.state.editRecord.level===1?14:50}
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
                    initialValue: this.state.editRecord?this.state.editRecord.description : '',
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
                {/* 层级 */}
                <span style={{display:'inline-block',width:'32px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.hierarchy`]}<span style={{color: 'red'}}>*</span></span>
                <FormItem
                  style={{width:'160px',display:'inline-block',marginLeft:'16px'}}
                >
                  {getFieldDecorator('hierarchy', {
                    rules: [{
                      required: true,
                      message: ServicePortalStore.languages[`${intlPrefix}.edit.choiceHierarchy`]
                    }],
                    initialValue: this.state.editRecord?this.state.editRecord.hierarchy : '',
                  })(
                    <Select disabled={this.state.editRecord?true:false} placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.choiceHierarchy`]}>
                      {hierarchyOptionArr}
                    </Select>
                  )}
                </FormItem>
              </Col>

              { this.props.form.getFieldsValue().hierarchy==='MENU'?
                <Col span={12}>
                  {/* 类型 */}
                  <span style={{display:'inline-block',width:'32px',marginLeft: '16px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.tableType`]}<span style={{color: 'red'}}>*</span></span>
                  <FormItem
                    style={{width:'160px',display:'inline-block',marginLeft:'15px'}}
                  >
                    {getFieldDecorator('typeCode', {
                      rules: [{
                        required: true,
                        message: ServicePortalStore.languages[`${intlPrefix}.edit.choiceTableType`]
                      }],
                      initialValue: this.state.editRecord?this.state.editRecord.typeCode : '',
                    })(
                      <Select onChange={this.typeCodeOnChange} placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.choiceTableType`]}>
                        {typeCodeArr}
                      </Select>
                    )}
                  </FormItem>
                </Col>
                :''
              }
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
                      initialValue: this.state.editRecord?this.state.editRecord.redirectUrl : '',
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
                    {(this.state.knowledgeRadio||this.state.editRecord)&&!this.state.editDelete?(
                      <div style={{marginLeft: '8px'}}>
                        {this.renderTitleIcon(this.state.knowledgeRadio?this.state.knowledgeRadio:this.state.editRecord?this.state.editRecord:'')}
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

              {this.props.form.getFieldsValue().typeCode==='SERVICE CATALOG'?
                <div style={{marginBottom:'24px'}}>
                  <span>{ServicePortalStore.languages[`${intlPrefix}.edit.serviceCatalog`]}<span style={{color: 'red'}}>*</span></span>
                  <div style={{paddingTop:'8px'}}>
                    {
                      (this.state.serviceRadio||this.state.editRecord)&&!this.state.editDelete?(
                        <div style={{marginLeft: '8px'}}>
                          <img style={{borderRadius:'4px'}} width='24px' height='24px' src={this.state.serviceRadio?this.state.serviceRadio.cataloguePicture:this.state.editRecord?this.state.editRecord.logoUrl:''} alt=""/>
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

              {this.props.form.getFieldsValue().typeCode==='KNOWLEDGESPACE'?
                <div style={{marginBottom:'24px'}}>
                  <span>{ServicePortalStore.languages[`${intlPrefix}.edit.relationKnowledgeSpace`]}<span style={{color: 'red'}}>*</span></span>
                  <div style={{paddingTop:'8px'}}>
                    {
                      (this.state.knowledgeSpaceRadio||this.state.editRecord)&&!this.state.editDelete?(
                        <div style={{marginLeft: '8px'}}>
                          <img style={{borderRadius:'4px'}} width='24px' height='24px' src={this.state.knowledgeSpaceRadio?this.state.knowledgeSpaceRadio.spaceLogo:this.state.editRecord?this.state.editRecord.logoUrl:''} alt=""/>
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
        </Modal>


        <KnowledgeSpaceModal visible={this.state.knowledgeSpaceVisible} handleknowledgeSpaceModal={this.handleknowledgeSpaceModal.bind(this)} />

        <KnowledgeModal visible={this.state.knowledgeVisible} handleknowledgeModal={this.handleknowledgeModal.bind(this)} />

        <ServiceModal visible={this.state.serviceVisible?this.state.serviceVisible:false} handleServiceModal={this.handleServiceModal.bind(this)}  />

        {this.state.TabPane_twoNew_formClick?(
          <div style={{marginTop:'24px'}}>
            <Button loading={this.state.saveSubmitting} onClick={this.saveOnClick} key="back" style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}}>{ServicePortalStore.languages[`save`]}</Button>
            <Button
              onClick={()=>{
                const {dataOriginal}=this.state;
                if(dataOriginal){
                  const newData = JSON.parse(JSON.stringify(dataOriginal));
                  this.setState({
                    TabPane_twoNew_formClick:false,
                    data:newData,
                  })
                }else {
                  this.setState({
                    TabPane_twoNew_formClick:false,
                    data:[],
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

export default Form.create({})(TabTwoNew);
