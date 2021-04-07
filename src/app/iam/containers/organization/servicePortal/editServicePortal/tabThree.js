import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { Page, Header, Content, Permission, Action, axios } from 'yqcloud-front-boot';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Switch, Checkbox, Input, Popover, message, Popconfirm, Progress, Form, Select, Col, Row, } from 'yqcloud-ui';
import MultiLanguageFormItem from '../NewMultiLanguageFormItem';
import update from 'immutability-helper';
import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
import ServicePortalStore from "../../../../stores/organization/servicePortal";

const FormItem = Form.Item;
const { Option, OptGroup } = Select;
const intlPrefix = 'organization.servicePortal';

const ICONS = ['xiangmutubiao-2', 'xiangmutubiao-', 'xiangmutubiao-1', 'xiangmutubiao-3', 'xiangmutubiao-4', 'xiangmutubiao-5', 'xiangmutubiao-6'];

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
class TabThree extends Component {

  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {
      i:1,
      TabPane_three_formClick:false, // tab3是否编辑状态
      saveSubmitting:false,
      // 存放多语言信息
      multiLanguageValue: {
        catalogue_name:{},
        description:{},
      },
      editDataArr:[],
      loadingTable:false,
      data:[]
    };
  }

  componentWillMount() {
    this.getLanguage();
    this.getCatalogs();
    this.getProjectList();
  }

  components = {
    body: {
      row: BodyRow,
    },
  };

  getCatalogs = ()=>{
    const idData = this.props.urlId;
    this.setState({loadingTable:true});
    ServicePortalStore.getCatalog(this.organizationId,idData).then(item=>{
      if(!item.failed){
        this.setState({loadingTable:false});
        if(item){
          this.setState({
            infoData:item || {},
            infoDataOriginal:JSON.parse(JSON.stringify(item)) || {},
            data:item.portalCatalogueProjects||[],
            dataOriginal:JSON.parse(JSON.stringify(item.portalCatalogueProjects?item.portalCatalogueProjects:''))||[],
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
  };

  moveRow = (dragIndex, hoverIndex) => {
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
          editDataArrs.push(data[hoverIndex]);
          editDataArrs.push(data[dragIndex]);
          this.setState({
            editDataArr: editDataArrs
          });
        }else {
          const editDataArrs = this.state.editDataArr;
          data[dragIndex].rankNumber = data[hoverIndex].rankNumber;
          editDataArrs.push(data[dragIndex]);
          for (var j in data) {
            if (dragIndex < hoverIndex) {
              if (data[j] !== data[dragIndex] && j <= hoverIndex && j > dragIndex) {
                data[j].rankNumber -= 1;
                editDataArrs.push(data[j]);
              }
            } else {
              if (data[j] !== data[dragIndex] && j >= hoverIndex && j < dragIndex) {
                data[j].rankNumber += 1;
                editDataArrs.push(data[j]);
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
      }
    }
    if (arr) {
      return arr;
    }else {
      return data;
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

  /*  获取项目 */
  getProjectList = () => {
    axios.get(`/project/v1/${this.organizationId}/pm/able`)
      .then((data) => {
        this.setState({
          projectList: data,
        });
      });
  };

  renderColumns(text, record, column) {
    const editable = record.editable;
    const projectListArr = [];
    if(this.state.projectList){
      this.state.projectList.forEach(item=>{
        let isProjectId=false;
        for (var i in this.state.data){
          if(this.state.data[i].projectId===item.projectId){
            isProjectId=true;
            break
          }
        }

        if(isProjectId){
          projectListArr.push(
            <Option disabled value={item.projectCode} optionName={item.projectName}>
                <span style={{width:'100%',display: 'inline-block',height: '100%'}}>
                  {`${item.projectCode} （${item.projectName}）`}
                </span>
            </Option>
          )
        }else {
          projectListArr.push(
            <Option value={item.projectCode} optionName={item.projectName}>
                <span style={{width:'100%',display: 'inline-block',height: '100%'}} onClick={()=>{this.optionClick(item,record)}}>
                  {`${item.projectCode} （${item.projectName}）`}
                </span>
            </Option>
          )
        }
      })
    }
    return (
      <div
        // style={{width:'80px'}}
      >
        {editable
          ? (
            <Select
              className="tabThree_select"
              // style={{ margin: '-5px 0',width:'300px'}}
              value={record.projectCode?`${record.projectCode} （${record.projectName}）`:''}
              dropdownMatchSelectWidth={false}
              optionFilterProp="children"
              notFoundContent={ServicePortalStore.languages[`${intlPrefix}.edit.noData`]}
              // onChange={e => this.handleChange(e, record, column)}
              filterOption={(input, option) =>option.props.optionName.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              filter
            >
              {projectListArr}
            </Select>
          )
          :
          (
            <span>
              {text}
            </span>
          )
        }
      </div>
    );
  }

  optionClick=(data,record)=>{
    const newData = [...this.state.data];
    newData.forEach(item=>{
      if(item===record){
        item.projectId= data.projectId;
        item.projectCode= data.projectCode;
        item.projectName= data.projectName;
        item.projectAbbreviation= data.projectAbbreviation;
        item.lastUpdateDate= data.lastUpdateDate;
      }
    });
    this.setState({ data: newData });
  };

  // handleChange(value, record, column) {
    // const newData = [...this.state.data];
    // newData.forEach(item=>{
    //   if(item.key===record.key){
    //     item.projectCode= value;
    //   }
    // });
    // this.setState({ data: newData });
  // }

  // 删除行
  deleteRecord = (record) =>{
    const newData = [...this.state.data];
    const {editDataArr}=this.state;
    const newArr = [];
    let index;
    let indexText=false;
    if(record){
      newData.forEach((item,i)=>{
        if(item!==record){
          newArr.push(JSON.parse(JSON.stringify(item?item:''))||[])
        }else {
          index=item.rankNumber;
          indexText=true;
          item.deleted=true;
          editDataArr.push(JSON.parse(JSON.stringify(item?item:''))||[])
        }
      });
      newArr.forEach(item=>{
        if(indexText&&item.rankNumber>index){
          // newArr.push(JSON.parse(JSON.stringify(item?item:''))||[]);
          item.rankNumber=item.rankNumber-1;
        }
      })

      this.setState({ data: newArr });
    }
  };

  // 新建行
  newlyBuildRecord = () =>{
    const newData = [...this.state.data];
    const ii = this.state.i;
    const {editDataArr}=this.state;
    newData.forEach(item=>{
      item.rankNumber=item.rankNumber+1;
    });
    const newDataObj={
      key:ii,
      rankNumber:1,
      isAdd: true,
      projectId: '',
      projectCode: '',
      projectName: '',
      projectIcon: ICONS[0],
      isFoldInPortal: 'N',
      lastUpdateDate: '',
      openSelectList: false,
      editable: true,
    };
    newData.unshift(newDataObj);
    editDataArr.push(newDataObj);
    this.setState({
      data: newData,
      i:ii+1,
      editDataArr
    });
  };

  // 开关改变时
  enableOnChange =(e)=>{
    this.setState({
      enabledName:e,
      isenabledName:true,
    })
  };

  // 项目图标点击
  serviceProjectIconClick = (record, index, icon) =>{
    const newData = [...this.state.data];
    const {editDataArr}=this.state;
    const target = newData.filter(item => record === item)[0];
    if (target) {
      target.projectIcon = icon;
      editDataArr.push(target);
      this.setState({ data: newData,editDataArr });
    }
  };

  // 项目图标弹出框
  getProjectIcon(record, index) {
    const content = (
      <div key={`pop_${record.projectId}_${index}`} className="jflex-wrap-space" style={{ width: 157, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {ICONS.map(item => <Icon className="serviceProject-icon" type={item} onClick={() =>{this.serviceProjectIconClick(record, index, item)}} />)}
      </div>
    );
    return (
      <Popover placement="right" title={ServicePortalStore.languages[`${intlPrefix}.edit.customIcon`]} content={content} trigger="click">
        <Icon className="serviceProject-icon serviceProject-icon-checked" type={record.projectIcon} />
      </Popover>
    );
  }

  onSwitchChange=(record, checked)=>{
    const newData = [...this.state.data];
    const {editDataArr}=this.state;
    if(record){
      newData.forEach(item=>{
        if(item===record){
          editDataArr.push(item);
          if(checked){
            item.isFoldInPortal='Y'
          }else {
            item.isFoldInPortal='N'
          }
        }
      });
      this.setState({ data: newData });
    }
  };

  // 表格行移入
  onMouseEnterRow=(record)=>{
    const newData = [...this.state.data];
    const target = newData.filter(item => record === item)[0];
    // const target = this.recordData(newData,record);
    if (target) {
      target.newlyBuild = true;
      this.setState({ data: newData });
    }
  };

  // 表格行移出
  onMouseLeaveRow=(record)=>{
    const newData = [...this.state.data];
    const target = newData.filter(item => record === item)[0];
    // const target = this.recordData(newData,record);
    if (target) {
      delete target.newlyBuild;
      this.setState({ data: newData });
    }
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

  saveOnClick=()=>{
    const {form}=this.props;
    this.setState({ saveSubmitting: true });
    const dataArr = this.uniq(this.state.editDataArr);
    form.validateFields((err, fieldsValue, ) => {
        fieldsValue.enabledName=this.state.enabledName?this.state.enabledName:this.state.isenabledName?false: this.state.infoData?this.state.infoData.enabledName : false ? true:false;
      if (!err||(!fieldsValue.enabledName)) {
        fieldsValue.portalCatalogueProjects=dataArr;
        fieldsValue.portalId=this.props.urlId;
        fieldsValue.__tls=this.state.multiLanguageValue;
        if(this.state.isEdit){
          fieldsValue.id=this.state.infoData.id;
          fieldsValue.objectVersionNumber=this.state.infoData.objectVersionNumber;
          ServicePortalStore.editCatalog(this.organizationId,fieldsValue).then(item=>{
            if (item.failed) {
              Choerodon.prompt(res.message);
              this.setState({ saveSubmitting: false });
            } else {
              Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.edit.editSuccess`]);
              this.setState({
                TabPane_three_formClick:false,
                saveSubmitting:false,
                editDataArr:[],
              });
              this.getCatalogs()
            }
          })
            .catch((error) => {
              Choerodon.handleResponseError(error);
              this.setState({ saveSubmitting: false });
            });
        }else {
          ServicePortalStore.newCatalog(this.organizationId,fieldsValue).then(item=>{
            if (item.failed) {
              Choerodon.prompt(res.message);
              this.setState({ saveSubmitting: false });
            } else {
              Choerodon.prompt(ServicePortalStore.languages[`save.success`]);
              this.setState({
                TabPane_three_formClick:false,
                saveSubmitting:false,
                editDataArr:[],
              });
              this.getCatalogs()
            }
          })
            .catch((error) => {
              Choerodon.handleResponseError(error);
            });
        }
      }else {
        this.setState({ saveSubmitting: false });
      }
    }
    )
  };

  render() {
    const { getFieldDecorator } = this.props.form;

    const columns = [{
      title: ServicePortalStore.languages[`${intlPrefix}.edit.projectCode`],
      dataIndex: 'projectCode',
      render: (text, record) => this.renderColumns(text, record, 'code')
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.projectName`],
      dataIndex: 'projectName',
      render: (text, record) => {
        return (
          <span>
            {text?text:'--'}
          </span>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.projectAbbreviation`],
      dataIndex: 'projectAbbreviation',
      render: (text, record) => {
        return (
          <span>
            {text?text:'--'}
          </span>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.modifyTime`],
      dataIndex: 'lastUpdateDate',
      render: (text, record) => {
        return (
          <span>
            {text?text:'--'}
          </span>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.projectIcon`],
      dataIndex: 'projectIcon',
      render: (text, record,index) => {
        return (
          <span>
            {record.editable?(
              this.getProjectIcon(record, index)
            ):(
              <Icon
                type={text}
                style={{
                  color: '#b4b7bf',
                  cursor: 'pointer',
                }}
              />
            )}
          </span>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.catalogExpansion`],
      dataIndex: 'isFoldInPortal',
      render: (text, record) => {
        return (
          <div>
            <Switch
              disabled={record.editable?false:true}
              checked={record.isFoldInPortal === 'Y'}
              onChange={(checked) => {
                this.onSwitchChange(record, checked);
              }}
            />
          </div>
        );
      },
    }];

    if(this.state.TabPane_three_formClick){
      columns.push({
        title: ServicePortalStore.languages[`${intlPrefix}.edit.action`],
        dataIndex: 'operation',
        render: (text, record) => {
          const { editable } = record;
          return (
            <div className="editable-row-operations">
              <Icon
                onClick={()=>{this.deleteRecord(record)}}
                type="delete-surface"
                style={{
                  color: '#2196F3',
                  cursor: 'pointer',
                }}
              />
            </div>
          );
        },
      })
    }

    const enabledNameRow = (
      <Row style={{marginBottom:this.state.TabPane_three_formClick?"0":"24px"}}>
        <Col span={12}>
          {/* 名称 */}
          <span style={{display:'inline-block'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.tableName`]}<span style={{color: 'red'}}>*</span></span>
          {
            this.state.TabPane_three_formClick?(
              <FormItem
                style={{display:'inline-block',marginLeft:'16px'}}
              >
                {getFieldDecorator('catalogueName', {
                  rules: [{
                    required: true,
                    message:ServicePortalStore.languages[`${intlPrefix}.edit.fillInName`]
                  }],
                  initialValue: this.state.infoData?this.state.infoData.catalogueName : '',
                })(
                  <MultiLanguageFormItem
                    requestUrl="true"
                    requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.catalogue_name : {}}
                    handleMultiLanguageValue={({ retObj, retList }) => {
                      // 将多语言的值设置到当前表单
                      this.props.form.setFieldsValue({
                        catalogueName: retObj[this.props.AppState.currentLanguage],
                      });
                      this.setState({
                          multiLanguageValue: {
                            ...this.state.multiLanguageValue,
                            catalogue_name: retObj,
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
              <span style={{display:'inline-block',marginLeft:'16px',marginBottom:'24px'}}>{this.state.infoData?this.state.infoData.catalogueName : ''}</span>
            )
          }
        </Col>
        <Col span={12}>
          {/* 描述 */}
          <span style={{display:'inline-block'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.description`]}</span>
          {
            this.state.TabPane_three_formClick?(
              <FormItem
                style={{display:'inline-block',marginLeft:'16px'}}
              >
                {getFieldDecorator('description', {
                  initialValue: this.state.infoData?this.state.infoData.description : '',
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
                    inputWidth={240}
                    placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.fillInDescription`]}
                  />
                )}
              </FormItem>
            ):(
              <span style={{display:'inline-block',marginLeft:'16px'}}>{this.state.infoData?this.state.infoData.description : ''}</span>
            )
          }
        </Col>
      </Row>
    );

    return(
      <div className="tabThree">
        {/* 基本信息 */}
        <div>
          <div style={{marginBottom:'24px'}}>
            <div style={{ borderLeft: '2px solid #2196F3',height: '14px',lineHeight: '14px'}}>
              <span style={{fontSize:'14px',fontWeight:'600',marginLeft:'4px'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.essentialInformation`]}</span>
              {this.state.TabPane_three_formClick?"":(
                <Button
                  style={{
                    zIndex:'99',
                    float: 'right',
                    background:'#2196F3 ',
                    border: '1px solid #2196F3',
                    color: '#fff'
                  }}
                  onClick={()=>{
                    const {data}=this.state;
                    data.forEach(item=>{
                      item.editable=true
                    });
                    // const {infoDataOriginal}=this.state;
                    // const newInfoData = JSON.parse(JSON.stringify(infoDataOriginal));
                    // const {dataOriginal}=this.state;
                    // const newData = JSON.parse(JSON.stringify(dataOriginal));
                    // const {multiLanguageValueOriginal}=this.state;
                    // const newMultiLanguageValue = JSON.parse(JSON.stringify(multiLanguageValueOriginal));
                    // newData.forEach(item=>{
                    //   item.editable=true;
                    // });
                    this.setState({
                      TabPane_three_formClick:true,
                      data,
                      // data:newData,
                      // infoData:newInfoData,
                      // multiLanguageValue:newMultiLanguageValue,
                    })
                  }}
                >
                  {ServicePortalStore.languages[`edit`]}
                </Button>
              )}
            </div>
          </div>

          <div>
            <Form>
              <Row>
                <Col span={12}>
                  <FormItem
                    style={{display:'inline-block'}}
                  >
                    {getFieldDecorator('enabledName', {
                    })(
                      <span>
                        <Switch
                          defaultChecked={this.state.infoData?this.state.infoData.enabledName : false}
                          checked={(this.state.enabledName?this.state.enabledName:this.state.isenabledName?false: this.state.infoData?this.state.infoData.enabledName : false)}
                          onChange={this.enableOnChange}
                          disabled={this.state.TabPane_three_formClick?false:true}
                        />
                        <span style={{marginLeft:'8px'}}>
                        {(this.state.enabledName?this.state.enabledName:this.state.isenabledName?false: this.state.infoData?this.state.infoData.enabledName : false)?ServicePortalStore.languages[`${intlPrefix}.edit.isNameDisplay`]:ServicePortalStore.languages[`${intlPrefix}.edit.noNameDisplay`]}
                        </span>
                      </span>
                    )}
                  </FormItem>
                </Col>
              </Row>
              {(this.state.enabledName?this.state.enabledName:this.state.isenabledName?false: this.state.infoData?this.state.infoData.enabledName : false)?enabledNameRow:''}

            </Form>
          </div>

        </div>
          {/* 门户项目 */}
          <div style={{height: '14px',lineHeight: '14px',marginBottom:'30px'}}>
            <span style={{fontSize:'14px',fontWeight:'600',display: 'inline-block',paddingLeft: '4px',height: '14px',borderLeft: '2px solid #2196F3'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.serviceProject`]}</span>
            {this.state.TabPane_three_formClick?(
              <Button
                style={{marginLeft:'8px'}}
                onClick={this.newlyBuildRecord}
              >
                <Icon
                  type="caozuoguanliIcon-9"
                  style={{
                    fontSize: '14px',
                    color: '#2196F3',
                  }}
                />
                {ServicePortalStore.languages[`${intlPrefix}.edit.showProject`]}
              </Button>
            ):null}

          </div>
          <Table
            rowKey={record => {
              if (record.id) {
                  return ('id' + record.id);
              } else {
                  return ('key' + record.key);
              }
            }}
            dataSource={this.state.data}
            className={this.state.TabPane_three_formClick?"edit_service_tab_table_three":''}
            columns={columns}
            loading={this.state.loadingTable}
            pagination={false}
            filterBar={false}
            components={
              this.components
            }
            onRow={(record, index) => {
              if(this.state.TabPane_three_formClick){
                return ({
                  index,
                  moveRow: this.moveRow,
                  onMouseDown: () => {
                    this.setState({
                      mouseDownRecord: record,
                    })
                  },
                  // onMouseEnter:()=>{this.onMouseEnterRow(record)}, // 移入
                  // onMouseLeave: ()=>{this.onMouseLeaveRow(record)},// 移出
                })
              }
            }}
          />
        <div>

        </div>

        {this.state.TabPane_three_formClick?(
          <div style={{marginTop:'24px'}}>
            <Button loading={this.state.saveSubmitting} onClick={this.saveOnClick} key="back" style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff'}}>{ServicePortalStore.languages[`save`]}</Button>
            <Button
              onClick={()=>{
                const {infoDataOriginal}=this.state;
                const newInfoData = JSON.parse(JSON.stringify(infoDataOriginal?infoDataOriginal:{}));
                const {dataOriginal}=this.state;
                const newData = JSON.parse(JSON.stringify(dataOriginal?dataOriginal:[]));
                const {multiLanguageValueOriginal}=this.state;
                const newMultiLanguageValue = JSON.parse(JSON.stringify(multiLanguageValueOriginal?multiLanguageValueOriginal:{
                  catalogue_name:{},
                  description:{},
                }));
                newData.forEach(item=>{
                  delete item.editable;
                });
                this.setState({
                  TabPane_three_formClick:false,
                  data:newData,
                  infoData:newInfoData,
                  multiLanguageValue:newMultiLanguageValue,
                  enabledName:'',
                  isenabledName:false,
                })
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

export default Form.create({})(TabThree);
