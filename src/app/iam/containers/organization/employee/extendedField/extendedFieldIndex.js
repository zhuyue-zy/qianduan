import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page ,axios } from 'yqcloud-front-boot';
import { Button, Form, Table, Tooltip, Row,Input, Icon,Checkbox ,message,Switch } from 'yqcloud-ui';
import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';
import update from 'immutability-helper';
import CreateEmployeeStore from '../../../../stores/organization/employee/createEmployee/CreateEmployeeStore';
import './index.scss';
import plateTimeStore from "../../../../stores/organization/plateFormTimer";

const intlPrefix = 'organization.employee';

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


@inject('AppState')
@observer
class extendedFields extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state={
      // 存放多语言信息
      multiLanguageValue: {
        field_name: {},
      },
      extendFieldId:0,
      multiLanguageList: [],
      extendFieldData:[],
      rowData:{},
      codeRepeat:false,
    };
  }

  componentWillMount(){
    this.loadLanguage();
    this.getLanguage();
    const _this = this;
    CreateEmployeeStore.queryExtendedFieldExtend(this.organizationId).then(data=>{
      _this.setState({
        extendFieldData:data.result,
        rowData:data.result[0],
        multiLanguageValue: {
          field_name: data.result[0].__tls.field_name,
        },
      })
    })
  }

  /* 获取系统支持的语言环境 */
  getLanguage = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        });
      });
  };

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    CreateEmployeeStore.queryLanguage(this.organizationId, AppState.currentLanguage);
  };

  components = {
    body: {
      row: BodyRow,
    },
  };

  moveRow = (dragIndex, hoverIndex,record) => {
    const { extendFieldData,rowData } = this.state;

    const dragRow = extendFieldData[dragIndex];
    const extendFieldDataNew = this.moveRowExtendFieldData(dragIndex,hoverIndex,rowData,extendFieldData);
    this.setState({
      extendFieldData:extendFieldDataNew
    });
    this.setState(update(this.state, {
      extendFieldData: {
        $splice: [[dragIndex, 1], [hoverIndex, 0, dragRow]],
      },
    }))
  };

  moveRowExtendFieldData=(dragIndex,hoverIndex,rowData,extendFieldData)=>{
    let arr = extendFieldData;
    for(var i in extendFieldData){
        if((dragIndex+1===hoverIndex)||(dragIndex===hoverIndex+1)){
          let serial;
          serial = extendFieldData[dragIndex].sort;
          extendFieldData[dragIndex].sort=extendFieldData[hoverIndex].sort;
          extendFieldData[hoverIndex].sort = serial;
          arr = extendFieldData;
          break
        }else {
          extendFieldData[dragIndex].sort=extendFieldData[hoverIndex].sort;
          for(var j in extendFieldData){
            if(dragIndex<hoverIndex){
              if(extendFieldData[j]!==extendFieldData[dragIndex]&&j<=hoverIndex&&j>dragIndex){
                extendFieldData[j].sort -= 1
              }
            }else {
              if(extendFieldData[j]!==extendFieldData[dragIndex]&&j>=hoverIndex&&j<dragIndex){
                extendFieldData[j].sort += 1
              }
            }
          }
          arr = extendFieldData;
          break
        }
      }

    return arr;

  };

  // 点击行
  onDoubleClickTable = (record) =>{
    this.props.form.setFieldsValue({fieldName:record.fieldName,fieldCode:record.fieldCode,required:record.required});
    this.setState({
      rowData:record,
      multiLanguageValue: {
        field_name: record.__tls? (record.__tls.field_name||{}):{},
      },
    });
  };

  extendFieldAdd = ()=>{
    const {extendFieldData,extendFieldId}= this.state;
    let indexData=0;
    let sort_s=0;
    extendFieldData.forEach(item=>{
      if(item.sort>sort_s){
        sort_s=item.sort
      }
      if(item.enabled){
        indexData++
      }
    });

    const today = new Date();
    const date = Date.parse(today);

    // if(indexData<10){
      const newRecord = {
        extendFieldId,
        fieldName:'默认标题',
        fieldCode:'',
        fieldType:'text',
        required:false,
        enabled:true,
        sort:sort_s+1,
        __tls:{field_name: {en_US: "", zh_CN: "默认标题"},},
      };
      extendFieldData.push(newRecord);
      const i = extendFieldId+1;
      this.props.form.setFieldsValue({fieldName:newRecord.fieldName,fieldCode:newRecord.fieldCode,required:newRecord.required});
      this.setState({
        extendFieldId:i,
        extendFieldData,
        rowData:newRecord,
        multiLanguageValue: {
          field_name: {en_US: "", zh_CN: "默认标题"},
        },
      })
    // }else {
    //   message.info(`${CreateEmployeeStore.languages[`${intlPrefix}.fieldHint`]}`,undefined, undefined,'bottomLeft' );
    // }

  };

  onValuesChangeFrom =(e,type) =>{
    const {rowData,extendFieldData} = this.state;
    let fieldCodeData= true;
    let counter = 0;
    if(e&&type==='fieldCode'){
      for (var j in extendFieldData) {
        counter++;
        if(!rowData.id){
          if(extendFieldData[j].fieldCode===e.target.value&&extendFieldData[j].extendFieldId!==rowData.extendFieldId){
            fieldCodeData = false;
          }
        }else {
          if(extendFieldData[j].fieldCode===e.target.value&&extendFieldData[j].id!==rowData.id){
            fieldCodeData = false;
          }
        }
        if(counter===extendFieldData.length){
          if(!fieldCodeData){
            this.setState({
              codeRepeat:true
            });
            message.info(`${CreateEmployeeStore.languages[`${intlPrefix}.fieldUniqueness`]}`,undefined, undefined,'bottomLeft' );
          }else {
            this.setState({
              codeRepeat:false
            });
          }
        }
      }
    }

    for(var i in extendFieldData){
      if(!rowData.id){
        if(rowData.extendFieldId===extendFieldData[i].extendFieldId){
          extendFieldData[i].fieldName=this.props.form.getFieldsValue().fieldName;
          extendFieldData[i].__tls=this.state.multiLanguageValue;
          if(type==='fieldCode'){
            extendFieldData[i].fieldCode=e.target.value;
          }
          if(type==='required'){
            extendFieldData[i].required=e.target.checked;
          }
          if(type==='show'){
            extendFieldData[i].show=e.target.checked;
          }
        }
      }else {
        if(rowData.id===extendFieldData[i].id){
          extendFieldData[i].fieldName=this.props.form.getFieldsValue().fieldName;
          extendFieldData[i].__tls=this.state.multiLanguageValue;
          if(type==='fieldCode'){
            extendFieldData[i].fieldCode=e.target.value;
          }
          if(type==='required'){
            extendFieldData[i].required=e.target.checked;
          }
          if(type==='show'){
            extendFieldData[i].show=e.target.checked;
          }
        }
      }
    }

    this.setState({
      extendFieldData
    })
  };

  // 行类名赋值函数
  setRowClassName = (record) => {
    let calssName = '';
    if(record.id){
      if(record.id===this.state.rowData.id){
        calssName = 'clickRowStyl'
      }
    }else {
      if(record.extendFieldId===this.state.rowData.extendFieldId){
        calssName = 'clickRowStyl'
      }
    }

    return calssName
  };

  onChangeSwitch = (e,record)=>{
    const {extendFieldData} = this.state;
    let indexData=0;
    extendFieldData.forEach(item=>{
      if(item.enabled){
        indexData++
      }
    });
    if(e){
      // if(indexData<10){
        for(var i in extendFieldData){
          if(!record.id){
            if(record.extendFieldId===extendFieldData[i].extendFieldId){
              extendFieldData[i].enabled=e;
              this.setState({
                extendFieldData
              })
            }
          }else {
            if(record.id===extendFieldData[i].id){
              extendFieldData[i].enabled=e;
              this.setState({
                extendFieldData
              })
            }
          }
        }
      // }else {
      //   message.info(`${CreateEmployeeStore.languages[`${intlPrefix}.fieldHint`]}`,undefined, undefined,'bottomLeft' );
      // }
    }else {
      for(var i in extendFieldData){
        if(!record.id){
          if(record.extendFieldId===extendFieldData[i].extendFieldId){
            extendFieldData[i].enabled=e;
            this.setState({
              extendFieldData
            })
          }
        }else {
          if(record.id===extendFieldData[i].id){
            extendFieldData[i].enabled=e;
            this.setState({
              extendFieldData
            })
          }
        }
      }
    }



  };

  handleSubmit=()=>{
    let isNoneNull = false;
    const {extendFieldData} = this.state;
    extendFieldData.forEach((item,i)=>{
      if((!item.fieldName)||(!item.fieldCode)){
        isNoneNull = true;
      }
      if(i===(extendFieldData.length-1)){
        if(isNoneNull){
          message.info(`${CreateEmployeeStore.languages[`${intlPrefix}.valueFillNull`]}`,undefined, undefined,'bottomLeft' );
        }else {
          if(this.state.codeRepeat){
            message.info(`${CreateEmployeeStore.languages[`${intlPrefix}.fieldUniqueness`]}`,undefined, undefined,'bottomLeft' );
          }else {
            CreateEmployeeStore.saveExtendField(this.organizationId,this.state.extendFieldData).then(data=>{
              if(data.result.data==='success'){
                message.info(`${CreateEmployeeStore.languages['save.success']}`,undefined, undefined,'bottomLeft' );
                this.props.history.push(`/iam/employee/extendedField?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
              }
            })
          }
        }
      }
    });

  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const columns = [{
      title: '',
      dataIndex: 'value',
      key: 'value',
      render: (value, record) => {
          return (
            <div style={{height:'25px',position: 'relative'}}>
              <div style={{width:'35px',height:'26px',display: 'inline-block',position: 'absolute',top:0,left:0}}>
                <span className="title" style={{display: 'inline-block',width:'35px',height:'26px'}}><Icon className="title_Icon" style={{fontSize:'16px',lineHeight:'21px',color:'#8e8e8e',position: 'absolute',top:5,left:0}} type="paixu"/></span>
              </div>

              <Tooltip placement="top" title={record.fieldName}>
                <span style={{display: 'inline-block',width:'120px',paddingLeft:'10px',position: 'absolute',top:5,left:35}}>{record.fieldName?record.fieldName.length>6 ?(record.fieldName.substring(0, 6)+'...'):(record.fieldName):'' }：</span>
              </Tooltip>
              <Input style={{width:'220px',position: 'absolute',top:0,left:155}} placeholder="请输入内容"/>
              <Switch onChange={(e)=>{this.onChangeSwitch(e,record)}} checked={record.enabled} style={{height:'22px',marginLeft:'10px',position: 'absolute',top:0,left:375}} checkedChildren={<Icon style={{fontSize:'16px',lineHeight:'21px'}} type="jiejue"/>} unCheckedChildren={<Icon style={{fontSize:'16px',lineHeight:'21px'}} type="fenzux5"/>}/>
            </div>
          )
      }
      }];
    return(
      <Page className="extendField">
        <Header
          title={CreateEmployeeStore.languages[`${intlPrefix}.extendedField`]}
          backPath={`/iam/employee?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`}
        />
        <Content style={{paddingBottom:'100px'}}>

          <div className='extendField_left'>
            <Table
              className="extendField_leftTable"
              size="middle"
              showHeader={false}
              columns={columns}
              dataSource={this.state.extendFieldData}
              // scroll={{ x: 1 }}
              bordered={false}
              pagination={false}
              filterBar={false}
              components={this.components}
              rowClassName={this.setRowClassName}
              onRow={(record, index) => {
                return {
                  index,
                  moveRow: (dragIndex, hoverIndex) => {
                    this.moveRow(dragIndex,hoverIndex,record)
                  },
                  // 点击行
                  onMouseDown:()=>{
                    this.onDoubleClickTable(record)
                  },
                }
              }}
            />
          </div>

          <div className='extendField_right'>
            <div>
              <span style={{width: '2px',height: '18px',background: '#43acff',verticalAlign: 'text-bottom',display: 'inline-block'}}/>
              <span style={{fontSize:'18px',marginLeft:'10px'}}>{CreateEmployeeStore.languages[`${intlPrefix}.clickAdd`]}</span>
              <Button
                style={{ color: '#1d1d1d', marginLeft: 8 }}
                onClick={this.extendFieldAdd}
              >
                <Icon type="caozuoguanliIcon-9" style={{ color: '#2196F3' }} />
              </Button>
            </div>

            {
              this.state.extendFieldData.length>0 ? (
                <Form style={{marginTop:'20px'}}>
                  <Row>
                    <div style={{display: 'inline-block',paddingRight:'10px',height: '26px', lineHeight: '26px'}}>
                      <span style={{fontSize: '14px'}}><span style={{color:'#d50000',padding:'0 5px'}}>*</span><span style={{color:'#313E59'}}>{CreateEmployeeStore.languages[`${intlPrefix}.Code`]}：</span></span>
                    </div>
                    <Form.Item style={{ display: 'inline-block' }}>
                      {getFieldDecorator('fieldCode', {
                        rules: [
                          {
                            required: true,
                            message: CreateEmployeeStore.languages[`${intlPrefix}.CodeNone`],
                          }],
                        initialValue:`${this.state.rowData.fieldCode||''}`,
                      })(
                        <Input
                          onChange={(e)=>this.onValuesChangeFrom(e,'fieldCode')}
                          style={{width:'300px'}}
                        />
                      )}
                    </Form.Item>
                  </Row>
                  <Row>
                    <div style={{display: 'inline-block',paddingRight:'10px',height: '26px', lineHeight: '26px'}}>
                      <span style={{fontSize: '14px'}}><span style={{color:'#d50000',padding:'0 5px'}}>*</span><span style={{color:'#313E59'}}>{CreateEmployeeStore.languages[`${intlPrefix}.Title`]}：</span></span>
                    </div>
                    <Form.Item style={{ display: 'inline-block' }}>
                      {getFieldDecorator('fieldName', {
                        rules: [
                          {
                            required: true,
                            message: CreateEmployeeStore.languages[`${intlPrefix}.TitleNone`],
                          }],
                        initialValue:`${this.state.rowData.fieldName||''}`,
                      })(
                        <MultiLanguageFormItem
                          placeholder={CreateEmployeeStore.languages[`${intlPrefix}.Title`]}
                          requestUrl="true"
                          requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.field_name : {}}
                          handleMultiLanguageValue={({ retObj, retList }) => {
                            // 将多语言的值设置到当前表单
                            this.props.form.setFieldsValue({
                              fieldName: retObj[this.props.AppState.currentLanguage],
                            });
                            this.setState({
                                multiLanguageValue: {
                                  ...this.state.multiLanguageValue,
                                  field_name: retObj,
                                },
                                multiLanguageList: retList,
                              },()=>{
                                this.onValuesChangeFrom()
                              }
                            );
                          }}
                          maxLength={50}
                          // disabled={isView === '1' ? 'true' : ''}
                          type="FormItem"
                          FormLanguage={this.state.multiLanguageValue}
                          languageEnv={this.state.languageEnv}
                          descriptionObject={CreateEmployeeStore.languages.multiLanguage}
                          required="true"
                          inputWidth={300}
                        />
                      )}
                    </Form.Item>
                  </Row>

                  <Row>
                    <Form.Item style={{ display: 'inline-block' ,paddingLeft:'15px'}}>
                      {getFieldDecorator('required', {
                        rules: [
                          {
                            required: true,
                          }],
                        //initialValue: this.state.rowData?this.state.rowData.required : false,
                      })(
                        <Checkbox
                          checked={this.state.rowData?this.state.rowData.required : false}
                          onChange={(e)=>this.onValuesChangeFrom(e,'required')}
                        >
                          {CreateEmployeeStore.languages[`${intlPrefix}.mustFill`]}
                        </Checkbox>,
                      )}
                    </Form.Item>
                  </Row>

                  <Row>
                    <Form.Item style={{ display: 'inline-block' ,paddingLeft:'15px'}}>
                      {getFieldDecorator('show', {
                        rules: [
                          {
                            required: true,
                          }],
                        //initialValue: this.state.rowData?this.state.rowData.required : false,
                      })(
                        <Checkbox
                          checked={this.state.rowData?this.state.rowData.show : false}
                          onChange={(e)=>this.onValuesChangeFrom(e,'show')}
                        >
                          {CreateEmployeeStore.languages[`${intlPrefix}.show`]}
                        </Checkbox>,
                      )}
                    </Form.Item>
                  </Row>
                </Form>
              ):''
            }
          </div>
          <div className='extendField_bottom'>
            <Button
              style={{background:'#2196F3 ',border: '1px solid #2196F3',color: '#fff',marginLeft:'15px'}}
              onClick={this.handleSubmit}
            >
              {CreateEmployeeStore.languages[`${intlPrefix}.Save`]}
            </Button>
            <Button
              style={{border: '1px solid #818999',color:'#818999',marginLeft:'15px'}}
              onClick={() => {
                this.props.history.push(`/iam/employee?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
              }}
            >
              {CreateEmployeeStore.languages[`${intlPrefix}.Return`]}
            </Button>
          </div>
        </Content>
      </Page>
    )
  }

}

const Demo = Form.create()(extendedFields);
const extendedField = DragDropContext(HTML5Backend)(Demo);

export default withRouter(injectIntl(extendedField));
