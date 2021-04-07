import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject } from 'mobx-react';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Switch, Checkbox, Input, Popover, message, Popconfirm, Progress, Form, Select, Col, Row, } from 'yqcloud-ui';
import { Page, Header, Content, Permission, Action, axios } from 'yqcloud-front-boot';
import ServicePortalStore from '../../../../stores/organization/servicePortal'
import './robotList.scss'

const intlPrefix = 'organization.servicePortal';

@inject('AppState')
@injectIntl
class Robot extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {
      robotData:[],
      robotKeys:[],
      robotVisible:false,
      loadingTable:false,
      // 存放多语言信息
      robotPagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: ['10', '20','50'],
      },
    }
  }

  componentWillMount() {
    this.getRobots();
    this.getStatusDataQuery();
  }

  //  状态快码查询
  getStatusDataQuery= () => {
    const code = "KMS_STATUS";
    axios.get(`fnd/v1/${this.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          statusData: data
        })
      })
  };

  /*  查询机器人 */
  getRobots = () => {
    this.setState({loadingTable:true});
    ServicePortalStore.getRobot(this.organizationId).then(data=>{
      if(!data.failed){
        const dataArr = data.result.content || [];
        this.setState({
          robotData:data.result.content,
          dataOriginalRobotData:JSON.parse(JSON.stringify(dataArr)) || [],
          loadingTable:false,
          robotPagination: {
            current: 1,
            pageSize: 10,
            total: data.result.totalElements,
            pageSizeOptions: ['10', '20','50'],
          },
        })
      }else {
        this.setState({
          loadingTable:false,
        })
      }
    })
  };


  // 机器人取消
  robotHandleCancel=()=>{
    const data = this.state.dataOriginalRobotData ||[];
    this.props.handleRobotModal(false,'');
    this.setState({
      robotVisible:false,
      robotListKeys:[],
      robotList:[],
      robotInputSou:'',
      robotData: JSON.parse(JSON.stringify(data)),
    })
  };

  // 机器人确定
  robotHandleOk=()=>{
    const row = this.state.robotList;
    const data = this.state.dataOriginalRobotData ||[];
    this.props.handleRobotModal(false,row);
    this.setState({
      robotRadio:row,
      robotVisible:false,
      robotListKeys:[],
      robotList:[],
      robotInputSou:'',
      robotData: JSON.parse(JSON.stringify(data)),
    })
  };

  // 机器人表格改变时
  robotHandlePageChange = (pagination, filters, sorter, params, ) => {
    this.setState({
      robotPagination:pagination,
      robotListKeys:[],
      robotList:[],
    }, () => {
      this.robotQueryTableData(pagination);
    });
  };

  // 机器人查询表格
  robotQueryTableData =(pagination)=>{
    this.setState({loadingTable:true});
    if(this.state.robotInputSouDetermine){
      ServicePortalStore.getRobot(this.organizationId,pagination.current,pagination.pageSize,this.state.robotInputSouDetermine).then(data=>{
        if(!data.failed){
          this.setState({
            robotData:data.result.content,
            robotListKeys:[],
            robotList:[],
            loadingTable:false,
          })
        }else {
          this.setState({loadingTable:false});
        }
      })
    }else {
      ServicePortalStore.getRobot(this.organizationId,pagination.current,pagination.pageSize).then(data=>{
        if(!data.failed){
          this.setState({
            robotData:data.result.content,
            robotListKeys:[],
            robotList:[],
            loadingTable:false,
          })
        }else {
          this.setState({loadingTable:false});
        }
      })
    }

  };

  // 机器人搜索按钮
  robotInputSouClick=(stag , e)=>{
    const robotInputSouDetermine=this.state.robotInputSou;
    const {robotPagination}=this.state;
    const evt = window.event || e;
    if(stag==='Icon'||(stag==='key'&&evt.keyCode === 13)){
      this.setState({loadingTable:true});
      ServicePortalStore.getRobot(this.organizationId,1,robotPagination.pageSize,robotInputSouDetermine).then(data=>{
        if(!data.failed){
          this.setState({
            robotData:data.result.content,
            robotInputSouDetermine,
            robotListKeys:[],
            loadingTable:false,
            robotList:[],
            robotPagination: {
              current: 1,
              pageSize: 10,
              total: data.result.totalElements,
              pageSizeOptions: ['10', '20','50'],
            },
          })
        }else {
          this.setState({
            loadingTable:false,
          })
        }
      })
    }
  };

  // 关联机器人内容
  robotContainer=()=>{
    const {statusData}=this.state;
    let statusOption=[];
    if (statusData) {
      statusData.forEach((item) => {
        statusOption.push({ value: item.lookupValue, text: item.lookupMeaning });
      });
    }

    const columns = [{
      title: ServicePortalStore.languages[`${intlPrefix}.edit.titleRobot`],
      dataIndex: 'robotTitle',
      render: (value,record) => {
        let text=`${record.chatrobotNickname?record.chatrobotNickname:''}（${record.chatrobotCode?record.chatrobotCode:''}）`;
        let textCopy;
        if(text.length>16){
          textCopy=text.slice(0,15)+'...'
        }else {
          textCopy=text
        }
        return(
          <div style={{fontSize:'14px',}}>
            <img width="48px" height="48px" style={{borderRadius:'4px'}} src={record.chatrobotCover} alt=""/>
            <div style={{display: 'inline-block',verticalAlign: 'top',marginLeft:'8px'}}>
              <div style={{fontWeight:'600',color:'#000'}}>
                <Tooltip title={text}>
                  <span>
                    {textCopy}
                  </span>
                </Tooltip>
              </div>

              <div style={{marginTop:'6px',color:'#262626',height:"21px"}}>
                {record.description&&record.description.length>16?
                  (
                    <Tooltip title={record.description}>
                      <span>
                        {record.description.slice(0,15)+'...'}
                      </span>
                    </Tooltip>
                  )
                  :
                  record.description
                }
              </div>
            </div>
          </div>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.creator`],
      dataIndex: 'createPerson',
      render: (value,record) => {
        return(
          <div>
            <div style={{fontSize:'14px',color:'#a3acbf'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.creator`]}</div>
            <div style={{fontSize:'14px',marginTop:'6px',color:'#262626',height:"21px"}}>{value}</div>
          </div>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.createdTime`],
      dataIndex: 'creationDate',
      render: (value,record) => {
        return(
          <div>
            <div style={{fontSize:'14px',color:'#a3acbf'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.createdTime`]}</div>
            <div style={{fontSize:'14px',marginTop:'6px',color:'#262626',height:"21px"}}>{value}</div>
          </div>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.owner`],
      dataIndex: 'adminPerson',
      render: (value,record) => {
        return (
          <div>
            <div style={{fontSize:'14px',color:'#a3acbf'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.owner`]}</div>
            <div style={{fontSize:'14px',marginTop:'6px',color:'#262626',height:"21px"}}>{value}</div>
          </div>
        )
      },
    }, {
      title:  ServicePortalStore.languages[`${intlPrefix}.edit.enableLibrary`],
      dataIndex: 'enableLibrary',
      render: (value,record) => {
        return (
          <div>
            <div style={{fontSize:'14px',color:'#a3acbf'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.enableLibrary`]}</div>
            <div style={{fontSize:'14px',marginTop:'6px',color:'#262626',height:"21px"}}>{value}</div>
          </div>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.onlineService`],
      dataIndex: 'enableIm',
      render: (value,record) => {
        return (
          <div>
            <div style={{fontSize:'14px',color:'#a3acbf'}}>{ServicePortalStore.languages[`${intlPrefix}.edit.onlineService`]}</div>
            <div style={{fontSize:'14px',marginTop:'6px',color:'#262626',height:"21px"}}>{value ? ServicePortalStore.languages[`${intlPrefix}.edit.yes`] : ServicePortalStore.languages[`${intlPrefix}.edit.no`]}</div>
          </div>
        )
      },
    }];

    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          robotList:selectedRows[0],
          robotListKeys:selectedRowKeys
        })
      },
      selectedRowKeys:this.state.robotListKeys,
      type:'radio'
    };

    return (
      <div>
        <div className="formInputSou_newModal">
          <Icon onClick={()=>this.robotInputSouClick('Icon')} className="input_icon" type="sousuo" />
          <input value={this.state.robotInputSou} onKeyDown={(e)=>this.robotInputSouClick('key',e)} onChange={(e)=>this.setState({robotInputSou:e.target.value})} placeholder={ServicePortalStore.languages[`${intlPrefix}.search`]}/>
        </div>
        <Table
          className='service_robot'
          rowSelection={rowSelection}
          columns={columns}
          loading={this.state.loadingTable}
          dataSource={this.state.robotData}
          // dataSource={data}
          filterBar={false}
          showHeader={false}
          pagination={this.state.robotPagination}
          onChange={this.robotHandlePageChange}
          style={{
          }}
        />
      </div>
    )
  };

  render() {
    const { visible } = this.props;
    return(
      <div>
        <Modal
          title={<span>{ServicePortalStore.languages[`${intlPrefix}.edit.relationRobot`]}</span>}
          className="robot_service_modal"
          visible={visible}
          width={1200}
          // closable={false}
          maskClosable={false}
          destroyOnClose={true}
          onCancel={this.robotHandleCancel}
          onOk={this.robotHandleOk}
          footer={[
            <Button key="back" onClick={this.robotHandleCancel}>
              {ServicePortalStore.languages[`cancle`]}
            </Button>,
            <Button key="submit" type="primary" onClick={this.robotHandleOk}>
              {ServicePortalStore.languages[`ok`]}
            </Button>,
          ]}
        >
          {this.robotContainer()}
        </Modal>
      </div>
    )
  }

}

export default Form.create({})(Robot);
