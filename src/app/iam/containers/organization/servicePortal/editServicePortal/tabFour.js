import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { Page, Header, Content, Permission, Action, axios } from 'yqcloud-front-boot';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Switch, Radio, Input, Popover, message, Popconfirm, Progress, Form, Select, Col, Row, } from 'yqcloud-ui';
import MultiLanguageFormItem from '../NewMultiLanguageFormItem';
import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
import update from 'immutability-helper';
import NewModal from './tabFour/newModal';
import ServicePortalStore from "../../../../stores/organization/servicePortal";

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const ICONS = ['xiangmutubiao-2', 'xiangmutubiao-', 'xiangmutubiao-1', 'xiangmutubiao-3', 'xiangmutubiao-4', 'xiangmutubiao-5', 'xiangmutubiao-6'];
const intlPrefix = 'organization.servicePortal';

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
class TabFour extends Component {

  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {
      key:1,
      newModal:false,
      saveSubmitting:false,
      TabPane_four_formClick:false, // tab1是否编辑状态
      // 存放多语言信息
      multiLanguageValue: {
        area_name: {},
        area_description:{},
      },
      expandedRowKey: [],
      loadingTable:false,
      data: [],
      editDataArr:[],
    };
  }

  componentWillMount() {
    this.getLanguage();
    this.getStyleTypeQuery();
    this.getResourcesTypeQuery();
    this.getResourcess();
    this.getHierarchyTypeQuery();
  }

  getResourcess = ()=>{
    const idData = this.props.urlId;
    this.setState({loadingTable:true});
    ServicePortalStore.getResources(this.organizationId,idData).then(item=>{
      if(!item.failed){
        this.setState({loadingTable:false});
        if(item){
          if(item.portalContentAreaList&&item.portalContentAreaList.length>0){
            item.portalContentAreaList=this.forInfoData(item.portalContentAreaList)
          }
          this.setState({
            infoData:item || {},
            infoDataOriginal:JSON.parse(JSON.stringify(item)) || {},
            data:item.portalContentAreaList||[],
            dataOriginal:JSON.parse(JSON.stringify(item.portalContentAreaList?item.portalContentAreaList:[]))||[],
            multiLanguageValue:item.__tls,
            multiLanguageValueOriginal:JSON.parse(JSON.stringify(item.__tls)),
          });
        }
        if(item){
          this.setState({
            isEdit:true,
          });
        }else {
          this.setState({
            isEdit:false,
          });
        }
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
          if(item.childPortalContentArea&&item.childPortalContentArea.length>0){
            item.children=this.forInfoData(item.childPortalContentArea)
          }
        })
      }
    }
    return data
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

  // 资源区域样式快码查询
  getStyleTypeQuery= () => {
    const code = "PORTAL_RESOURCE_SYTLE";
    axios.get(`fnd/v1/${this.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        if(!data.failed){
          this.setState({
            styleType: data
          })
        }else {
          Choerodon.prompt(item.message);
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
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

  // 资源类型码查询
  getResourcesTypeQuery= () => {
    const code = "PORTAL_RESOURCE_TYPE";
    axios.get(`fnd/v1/${this.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        if(!data.failed){
          this.setState({
            resourcesType: data
          })
        }else {
          Choerodon.prompt(item.message);
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
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

  // 点击展开按钮
  onExpandData = (e, rend) => {
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
      arr.forEach((item, index) => {
        if ((item === ('id' + rend.id)) || (item === ('key' + rend.key))) {
          arr.splice(index, 1)
        }
      });
      this.setState({
        expandedRowKey: arr
      })
    }
  };

  // 新建资源
  newlyBuildRecord = () =>{
    this.setState({
      newModal:true,
      stateModal:'NEW',
    })
  };

  // 行内新建
  newlyBuildRecordTitle = (record) =>{
    this.setState({
      newModal:true,
      stateModal:'NEW_Children',
      parentRecord:record,
    })
  };

  // 行内编辑
  editRecord = (record) =>{
    this.setState({
      newModal:true,
      stateModal:'EDIT',
      editRecord:record,
    })
  };

  styleOnChange = (e) =>{
    this.setState({
      styleValue: e.target.value,
    });
  };

  // 获得modal传值
  handleNewModal=(dataNew,newModal,state)=>{
    const { data ,parentRecord,editRecord,editDataArr} = this.state;
    this.setState({
      newModal:newModal,
    });
    if(dataNew){
      if(state==='NEW'){
        let rankNumberMox=data.length>0?data[0].rankNumber:0;
        if(data.length>0){
          data.forEach(item=>{
            if(item.rankNumber>rankNumberMox){
              rankNumberMox = item.rankNumber
            }
          });
        }
        const {key} =this.state;
        dataNew.key = key;
        dataNew.rankNumber = rankNumberMox+1;
        dataNew.level=1;
        data.push(dataNew);
        editDataArr.push(dataNew);
        this.setState({
          data,
          key:key+1,
          editDataArr,
          parentRecord:'',
          editRecord:'',
        })
      }
      if(state==='NEW_Children'){
        const {key} =this.state;
        const arr = this.state.expandedRowKey;
        dataNew.key = key;
        if(parentRecord){
          const new_children_record=this.recordData(data,parentRecord);
          let rankNumberMox=0;
          if(parentRecord.children){
            if(parentRecord.children.length>0){
              rankNumberMox=parentRecord.children[0].rankNumber;
              parentRecord.children.forEach(item=>{
                if(item.rankNumber>rankNumberMox){
                  rankNumberMox = item.rankNumber
                }
              });
            }
          }

          dataNew.rankNumber=rankNumberMox+1;
          dataNew.level=parentRecord.level+1;

          if(!new_children_record.children){
            new_children_record.children=[];
            new_children_record.children.push(dataNew);
          }else {
            new_children_record.children.push(dataNew);
          }
          if(parentRecord.id){
            dataNew.parentId=parentRecord.id;
            editDataArr.push(dataNew);
            arr.push('id' + parentRecord.id);
          }
          if(parentRecord.key){
            dataNew.parentKey=parentRecord.key;
            arr.push('key' + parentRecord.key);
            // editDataArr.push(parentRecord);
          }
          this.setState({
            data,
            key:key+1,
            expandedRowKey: arr,
            editDataArr,
            parentRecord:'',
            editRecord:'',
          })
        }
      }
      if(state==='EDIT'){
        if(editRecord){
          editRecord.name=dataNew.name?dataNew.name:editRecord.name;
          editRecord.description=dataNew.description?dataNew.description:editRecord.description;
          editRecord.pictureUrl=dataNew.pictureUrl?dataNew.pictureUrl:editRecord.pictureUrl;
          editRecord.typeCode=dataNew.typeCode?dataNew.typeCode:editRecord.typeCode;
          editRecord.__tls=dataNew.__tls?dataNew.__tls:editRecord.__tls;
          if(editRecord.hierarchy==='RESOURCE'){
            if(editRecord.typeCode==='KNOWLEDGE'){
              editRecord.knowledge=dataNew.knowledgeRadio?dataNew.knowledgeRadio:editRecord.knowledge?editRecord.knowledge:'';
              editRecord.logoUrl=dataNew.logoUrl?dataNew.logoUrl:editRecord.logoUrl;
              editRecord.knowledgeId=dataNew.knowledgeId?dataNew.knowledgeId:editRecord.knowledgeId;
              editRecord.content=dataNew.content?dataNew.content:editRecord.content;
            }
            if(editRecord.typeCode==='KNOWLEDGESPACE'){
              editRecord.space=dataNew.space?dataNew.space:editRecord.space?editRecord.space:'';
              editRecord.spaceCode=dataNew.spaceCode?dataNew.spaceCode:editRecord.spaceCode;
              editRecord.logoUrl=dataNew.logoUrl?dataNew.logoUrl:editRecord.logoUrl;
              editRecord.content=dataNew.content?dataNew.content:editRecord.content;
            }
            if(editRecord.typeCode==='URL'){
              editRecord.redirectUrl=dataNew.redirectUrl?dataNew.redirectUrl:editRecord.redirectUrl;
            }
          }
          if(!editRecord.parentKey){
            editDataArr.push(editRecord);
          }

          this.setState({
            data,
            editDataArr,
            parentRecord:'',
            editRecord:'',
          })
        }
      }
    }else {
      this.setState({
        parentRecord:'',
        editRecord:'',
      })
    }

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
    return data
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

  // 启用开关
  enableOnChange=(e)=>{
    this.props.form.setFieldsValue({
      areaNameDisplay: e,
    });
    this.setState({
      areaNameDisplay:true
    })
  };


  // 去重
  uniq = (array) => {
    const temp = []; //一个新的临时数组
    array.forEach(data_1=>{
      let isData=false;
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
      if(!isData){
        temp.push(data_1)
      }
    });
    return temp;
  };

  forInfoData_reverse=(data)=>{
    if(data){
      if(data.length>0){
        data.forEach(item=>{
          if(item.children&&item.children.length>0){
            item.childPortalContentArea=this.forInfoData_reverse(item.children)
          }
        })
      }
    }
    return data
  };

  // 保存
  saveOnClick=()=>{
    const {form}=this.props;
    this.setState({ saveSubmitting: true });
    const dataArr = this.forInfoData_reverse(this.uniq(this.state.editDataArr));
    form.validateFields((err, fieldsValue, ) => {
      const isName = (this.state.areaNameDisplay?this.props.form.getFieldsValue().areaNameDisplay:this.state.infoData?this.state.infoData.areaNameDisplay : false)?true:false
      if (!err||(!isName&&!err.styleCode)) {
        fieldsValue.portalContentAreaList=dataArr;
        fieldsValue.portalId=this.props.urlId;
        // fieldsValue.areaNameDisplay=fieldsValue.areaNameDisplay?fieldsValue.areaNameDisplay:false;
        fieldsValue.__tls=this.state.multiLanguageValue;
        if(this.state.isEdit){
          const {infoData}=this.state;
          infoData.portalContentAreaList=dataArr;
          infoData.areaDescription=fieldsValue.areaDescription?fieldsValue.areaDescription:infoData.areaDescription;
          infoData.areaName=fieldsValue.areaName?fieldsValue.areaName:infoData.areaName;
          infoData.styleCode=fieldsValue.styleCode?fieldsValue.styleCode:infoData.styleCode;
          infoData.__tls=this.state.multiLanguageValue;
          infoData.areaNameDisplay=fieldsValue.areaNameDisplay?fieldsValue.areaNameDisplay:this.state.areaNameDisplay?false:infoData.areaNameDisplay;
          ServicePortalStore.editResources(this.organizationId,infoData).then(item=>{
            if (item.failed) {
              Choerodon.prompt(res.message);
              this.setState({ saveSubmitting: false });
            } else {
              Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.editSuccess`]);
              this.setState({
                TabPane_four_formClick:false,
                saveSubmitting:false,
                editDataArr:[],
              });
              this.getResourcess()
            }
          })
            .catch((error) => {
              Choerodon.handleResponseError(error);
              this.setState({ saveSubmitting: false });
            });
        }else {
          ServicePortalStore.newResources(this.organizationId,fieldsValue).then(item=>{
            if (item.failed) {
              Choerodon.prompt(res.message);
              this.setState({ saveSubmitting: false });
            } else {
              Choerodon.prompt(ServicePortalStore.languages[`save.success`]);
              this.setState({
                TabPane_four_formClick:false,
                saveSubmitting:false,
                editDataArr:[],
              });
              this.getResourcess()
            }
          })
            .catch((error) => {
              Choerodon.handleResponseError(error);
              this.setState({ saveSubmitting: false });
            });
        }
      }else {
        this.setState({ saveSubmitting: false });
      }
    })
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const columns = [{
      title: ServicePortalStore.languages[`${intlPrefix}.edit.tableName`],
      dataIndex: 'name',
      key: 'name',
      width:'35%',
      render: (text, record) => {
        const recordData= record.hierarchy==='RESOURCE_GROUP'?(
          <span>
            <img width='28px' height="28px" src={record.pictureUrl} />
              <span>
                <span style={{fontWeight:'600',marginLeft:'12px',
                  opacity:record.deleted?'0.5':'1',}}>
                  {text}
                </span>
                {
                  !record.deleted&&record.newlyBuild&&this.state.TabPane_four_formClick&&(record.level<4)?(
                    <span
                      style={{
                        marginLeft:'16px'
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
                    </span>
                  ):''
                }
              </span>
          </span>
        ):(
          <span>
            <img width='28px' height="28px" src={record.pictureUrl} />
            <span style={{color:'#8e8e8e',marginLeft:'12px',
              opacity:record.deleted?'0.5':'1'}}>{text}</span>
          </span>
        );

        return recordData;
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.tableType`],
      dataIndex: 'typeCode',
      key: 'typeCode',
      width:'10%',
      render: (text, record) => {
        let resourcesText = '';
        if(record.hierarchy==='RESOURCE_GROUP'){
          resourcesText = ServicePortalStore.languages[`${intlPrefix}.edit.type`]

        }else {
          if (this.state.resourcesType) {
            this.state.resourcesType.forEach(item => {
              if (item.lookupValue === text) {
                resourcesText = item.lookupMeaning
              }
            });
          }
        }
        return <span style={{ opacity:record.deleted?'0.5':'1'}}>{resourcesText}</span>
      }
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.tableContent`],
      dataIndex: 'content',
      key: 'content',
      width:'20%',
      render: (text, record) => {
        if(record.typeCode==='URL'){
          return <span style={{opacity:record.deleted?'0.5':'1'}}>{record.redirectUrl}</span>
        }else {
          return <span style={{opacity:record.deleted?'0.5':'1'}}>{text}</span>
        }

      }
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.description`],
      dataIndex: 'description',
      key: 'description',
      width:'20%',
      render: (text, record) => {
        return <span style={{opacity:record.deleted?'0.5':'1'}}>{text}</span>
      }
    }];

    if(this.state.TabPane_four_formClick){
      columns.push({
        title: ServicePortalStore.languages[`${intlPrefix}.edit.action`],
        dataIndex: 'operation',
        render: (text, record) => {
          return (
            <div className="editable-row-operations">
              {record.deleted?(
                <Icon
                  type="edit-surface"
                  style={{
                    color: '#2196F3',
                    cursor: 'pointer',
                    opacity:'0.5',
                  }}
                />
              ):(
                <Tooltip title={ServicePortalStore.languages[`edit`]}>
                  <Icon
                    onClick={()=>{
                      return(
                        this.editRecord(record)
                      )
                    }}
                    // type="delete-surface"
                    type="edit-surface"
                    style={{
                      color: '#2196F3',
                      cursor: 'pointer',
                    }}
                  />
                </Tooltip>
              )}

              {
                record.deleted?(
                  <Icon
                    type="delete-surface"
                    style={{
                      color: '#2196F3',
                      cursor: 'pointer',
                      marginLeft:'16px',
                      opacity:'0.5',
                    }}
                  />
                ):(
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
                )
              }

            </div>
          );
        },
      })
    }

    const styleTypeArr = [];
    const styleTypeArrText = [];
    if(this.state.styleType){
      this.state.styleType.forEach(item=>{
        if(item.lookupValue==='ONE'){
          if(this.state.infoData&&this.state.infoData.styleCode==='ONE'){
            styleTypeArrText.push(
              <div>
                <div className="box_radio">
                  <div className="one_radio"/>
                </div>
                <span style={{marginLeft:'8px'}}>{item.lookupMeaning}</span>
              </div>
            )
          }
          styleTypeArr.push(
            <Radio value={item.lookupValue}>
              <div className="box_radio">
                <div className="one_radio"/>
              </div>
              <span style={{marginLeft:'8px'}}>{item.lookupMeaning}</span>
            </Radio>
          )
        }
        if(item.lookupValue==='TWO'){
          if(this.state.infoData&&this.state.infoData.styleCode==='TWO'){
            styleTypeArrText.push(
              <div>
                <div className="box_radio">
                  <div className="two_radio"/>
                  <div className="two_radio" style={{marginLeft:'2px'}} />
                </div>
                <span style={{marginLeft:'8px'}}>{item.lookupMeaning}</span>
              </div>
            )
          }
          styleTypeArr.push(
            <Radio style={{marginLeft:'32px'}} value={item.lookupValue}>
              <div className="box_radio">
                <div className="two_radio"/>
                <div className="two_radio" style={{marginLeft:'2px'}} />
              </div>
              <span style={{marginLeft:'8px'}}>{item.lookupMeaning}</span>
            </Radio>
          )
        }
        if(item.lookupValue==='THREE'){
          if(this.state.infoData&&this.state.infoData.styleCode==='THREE'){
            styleTypeArrText.push(
              <div>
                <div className="box_radio">
                  <div className="three_radio"/>
                  <div className="three_radio" style={{marginLeft:'2px'}} />
                  <div className="three_radio" style={{marginLeft:'2px'}} />
                </div>
                <span style={{marginLeft:'8px'}}>{item.lookupMeaning}</span>
              </div>
            )
          }
          styleTypeArr.push(
            <Radio style={{marginLeft:'32px'}} value={item.lookupValue}>
              <div className="box_radio">
                <div className="three_radio"/>
                <div className="three_radio" style={{marginLeft:'2px'}} />
                <div className="three_radio" style={{marginLeft:'2px'}} />
              </div>
              <span style={{marginLeft:'8px'}}>{item.lookupMeaning}</span>
            </Radio>
          )
        }
        if(item.lookupValue==='FOUR'){
          if(this.state.infoData&&this.state.infoData.styleCode==='FOUR'){
            styleTypeArrText.push(
              <div>
                <div className="box_radio">
                  <div className="four_radio"/>
                  <div className="four_radio" style={{marginLeft:'2px'}}/>
                  <div className="four_radio" style={{marginLeft:'2px'}}/>
                  <div className="four_radio" style={{marginLeft:'2px'}}/>
                </div>
                <span style={{marginLeft:'8px'}}>{item.lookupMeaning}</span>
              </div>
            )
          }
          styleTypeArr.push(
            <Radio style={{marginLeft:'32px'}} value={item.lookupValue}>
              <div className="box_radio">
                <div className="four_radio"/>
                <div className="four_radio" style={{marginLeft:'2px'}}/>
                <div className="four_radio" style={{marginLeft:'2px'}}/>
                <div className="four_radio" style={{marginLeft:'2px'}}/>
              </div>
              <span style={{marginLeft:'8px'}}>{item.lookupMeaning}</span>
            </Radio>
          )
        }
      })
    }

    const areaNameDisplayRow = (
      <Row style={{marginBottom:this.state.TabPane_four_formClick?0:'24px'}}>
        <Col span={12}>
          {/* 名称 */}
          <span style={{display:'inline-block',width:'32px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.tableName`]}<span style={{color: 'red'}}>*</span></span>
          {
            this.state.TabPane_four_formClick?(
              <FormItem
                style={{display:'inline-block',marginLeft:'16px'}}
              >
                {getFieldDecorator('areaName', {
                  rules: [{
                    required: true,
                    message:ServicePortalStore.languages[`${intlPrefix}.edit.fillInName`]
                  }],
                  initialValue: this.state.infoData?this.state.infoData.areaName : '',
                })(
                  <MultiLanguageFormItem
                    requestUrl="true"
                    requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.area_name : {}}
                    handleMultiLanguageValue={({ retObj, retList }) => {
                      // 将多语言的值设置到当前表单
                      this.props.form.setFieldsValue({
                        areaName: retObj[this.props.AppState.currentLanguage],
                      });
                      this.setState({
                          multiLanguageValue: {
                            ...this.state.multiLanguageValue,
                            area_name: retObj,
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
                    inputWidth={240}
                    placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.fillInName`]}
                  />
                )}
              </FormItem>
            ):(
              <span style={{display:'inline-block',marginLeft:'16px'}}>{this.state.infoData?this.state.infoData.areaName : ''}</span>
            )
          }
        </Col>
        <Col span={12}>
          {/* 描述 */}
          <span style={{display:'inline-block',width:'32px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.description`]}</span>
          {
            this.state.TabPane_four_formClick?(
              <FormItem
                style={{display:'inline-block',marginLeft:'16px'}}
              >
                {getFieldDecorator('areaDescription', {
                  initialValue: this.state.infoData?this.state.infoData.areaDescription : '',
                })(
                  <MultiLanguageFormItem
                    requestUrl="true"
                    requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.area_description : {}}
                    handleMultiLanguageValue={({ retObj, retList }) => {
                      // 将多语言的值设置到当前表单
                      this.props.form.setFieldsValue({
                        areaDescription: retObj[this.props.AppState.currentLanguage],
                      });
                      this.setState({
                          multiLanguageValue: {
                            ...this.state.multiLanguageValue,
                            area_description: retObj,
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
                    inputWidth={240}
                    placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.fillInDescription`]}
                  />
                )}
              </FormItem>
            ):(
              <span style={{display:'inline-block',marginLeft:'16px'}}>{this.state.infoData?this.state.infoData.areaDescription : ''}</span>
            )
          }
        </Col>
      </Row>
    );

    return(
      <div className='tabFour'>
        <NewModal
          parentRecord={this.state.parentRecord?this.state.parentRecord:''}
          editRecord={this.state.editRecord?this.state.editRecord:''}
          stateModal={this.state.stateModal}
          visible={this.state.newModal}
          resourcesType={this.state.resourcesType}
          handleNewModal={this.handleNewModal.bind(this)}
        />

        <div>
          {/*基本信息1*/}
          <div style={{ borderLeft: '2px solid #2196F3',height: '14px',lineHeight: '14px',marginBottom:'24px'}}>
            <span style={{fontSize:'14px',fontWeight:'600',marginLeft:'4px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.essentialInformation`]}</span>

            {this.state.TabPane_four_formClick?"":(

              <Button
                style={{
                  zIndex:'99',
                  float: 'right',
                  background:'#2196F3 ',
                  border: '1px solid #2196F3',
                  color: '#fff'
                }}
                onClick={()=>{
                  const newData = [...this.state.data];
                  newData.forEach(item=>{
                    item.editable=true;
                  });
                  this.setState({
                    TabPane_four_formClick:true,
                    data:newData
                  })
                }}
              >
                {ServicePortalStore.languages[`edit`]}
              </Button>
            )}
          </div>

          <Form>
            <Row>
              <Col span={12}>
                <FormItem
                  style={{display:'inline-block'}}
                >
                  {getFieldDecorator('areaNameDisplay', {
                  })(
                    <span>
                      <Switch
                        checked={this.state.areaNameDisplay?this.props.form.getFieldsValue().areaNameDisplay:this.state.infoData?this.state.infoData.areaNameDisplay : false}
                        defaultChecked={this.state.infoData?this.state.infoData.areaNameDisplay : false}
                        onChange={this.enableOnChange}
                        disabled={this.state.TabPane_four_formClick?false:true}
                      />
                      <span style={{marginLeft:'8px'}}>
                        {(this.state.areaNameDisplay?this.props.form.getFieldsValue().areaNameDisplay:this.state.infoData?this.state.infoData.areaNameDisplay : false)?ServicePortalStore.languages[`${intlPrefix}.edit.isNameDisplay`]:ServicePortalStore.languages[`${intlPrefix}.edit.noNameDisplay`]}
                      </span>
                    </span>
                  )}
                </FormItem>
              </Col>
            </Row>
            {this.state.areaNameDisplay?this.props.form.getFieldsValue().areaNameDisplay?areaNameDisplayRow:'':this.state.infoData?this.state.infoData.areaNameDisplay? areaNameDisplayRow: '' : ''}
            <Row style={{marginTop:(!this.state.TabPane_four_formClick)&&(this.props.form.getFieldsValue().areaNameDisplay)?'24px':'0px'}}>
              <Col span={24}>
                {/* 样式 */}
                <span style={{display:'inline-block',width:'32px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.style`]}<span style={{color: 'red'}}>*</span></span>
                {
                  this.state.TabPane_four_formClick?(
                    <FormItem
                      style={{display:'inline-block',marginLeft:'16px'}}
                      className="style_radio"
                    >
                      {getFieldDecorator('styleCode', {
                        rules: [{
                          required: true,
                          message: ServicePortalStore.languages[`${intlPrefix}.edit.choiceStyle`]
                        }],
                        initialValue: this.state.infoData?this.state.infoData.styleCode : '',
                      })(
                        <RadioGroup onChange={this.styleOnChange} value={this.state.styleValue}>
                          {styleTypeArr}
                        </RadioGroup>
                      )}
                    </FormItem>
                  ):(
                    <span className="style_radio" style={{display:'inline-block',marginLeft:'16px'}}>
                      {styleTypeArrText}
                    </span>
                  )
                }
              </Col>
            </Row>

          </Form>
        </div>

        <div>
          {/* 资源 */}
          <div style={{height: '14px',lineHeight: '14px',marginTop:this.state.TabPane_four_formClick?'8px':'30px',marginBottom:'30px'}}>
            <span style={{fontSize:'14px',fontWeight:'600',display: 'inline-block',paddingLeft: '4px',height: '14px',borderLeft: '2px solid #2196F3'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.resources`]}</span>
            {this.state.TabPane_four_formClick?(
              <Button
                style={{marginLeft:'8px'}}
                onClick={this.newlyBuildRecord}
              >
                <Icon
                  type="tianjia3"
                  style={{
                    fontSize: '14px',
                    color: '#2196F3',
                  }}
                />
                {ServicePortalStore.languages[`create`]}
              </Button>
            ):null}

          </div>
        </div>
        <Table
          className={this.state.TabPane_four_formClick?"edit_service_tab_table_four":''}
          rowKey={record => {
            if (record.id) {
              return ('id' + record.id);
            } else {
              return ('key' + record.key);
            }
          }}
          columns={columns}
          expandedRowKeys={this.state.expandedRowKey}
          dataSource={this.state.data}
          pagination={false}
          defaultExpandAllRows={true}
          loading={this.state.loadingTable}
          filterBar={false}
          components={this.components}
          onExpand={this.onExpandData}
          onRow={(record, index) => {
            if(this.state.TabPane_four_formClick){
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

        {this.state.TabPane_four_formClick?(
          <div style={{marginTop:'24px'}}>
            <Button loading={this.state.saveSubmitting} onClick={this.saveOnClick} key="back" style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}}>{ServicePortalStore.languages[`save`]}</Button>
            <Button
              onClick={()=>{
                const {infoDataOriginal}=this.state;
                let newInfoData={};
                if(infoDataOriginal){
                  newInfoData = JSON.parse(JSON.stringify(infoDataOriginal));
                }
                const {dataOriginal}=this.state;
                let newData=[];
                if(dataOriginal){
                   newData = JSON.parse(JSON.stringify(dataOriginal));
                }
                const {multiLanguageValueOriginal}=this.state;
                let newMultiLanguageValue = {
                    area_name: {},
                    area_description:{},
                  };
                if(multiLanguageValueOriginal){
                  newMultiLanguageValue = JSON.parse(JSON.stringify(multiLanguageValueOriginal));
                }
                newData.forEach(item=>{
                  delete item.editable;
                });
                this.setState({
                  TabPane_four_formClick:false,
                  data:newData,
                  infoData:newInfoData,
                  multiLanguageValue:newMultiLanguageValue,
                  areaNameDisplay:false,
                });
                this.props.form.setFieldsValue({
                  areaNameDisplay: '',
                });
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

export default Form.create({})(TabFour);
