import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject } from 'mobx-react';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Switch, Checkbox, Input, Popover, message, Popconfirm, Progress, Form, Select, Col, Row, } from 'yqcloud-ui';
import { Page, Header, Content, Permission, Action, axios } from 'yqcloud-front-boot';
import ServicePortalStore from '../../../../stores/organization/servicePortal'
import './serviceList.scss'

const FormItem = Form.Item;
const { Option } = Select;
const intlPrefix = 'organization.servicePortal';

@inject('AppState')
@injectIntl
class ServiceModal extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {
      serviceData:[],
      serviceListKeys:[],
      serviceVisible:false,
      // 存放多语言信息
      servicePagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: ['10', '20','50'],
      },
    }
  }

  componentWillMount() {
    // this.getServices();
    this.getProjectAlls();
  }

  /*  查询租户下项目 */
  getProjectAlls = () => {
    ServicePortalStore.getProjectAll(this.organizationId).then(data=>{
      if(!data.failed){
        this.getServices(data[0].projectId)
        this.setState({
          projectList:data,
        })
      }
    })
  };

  /*  查询服务目录 */
  getServices = (projectId) => {
    this.setState({loadingTable:true});
    ServicePortalStore.getServiceList(this.organizationId,projectId).then(data=>{
      if(!data.failed){
        this.setState({
          serviceData:data.result,
          loadingTable:false,
          servicePagination: {
            current: 1,
            pageSize: 10,
            total: data.totalElements,
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


  // 服务目录取消
  serviceHandleCancel=()=>{
    this.props.handleServiceModal(false,'');
    this.getServices(this.state.projectList[0].projectId);
    this.setState({
      serviceVisible:false,
      serviceListKeys:[],
      serviceList:[],
      servicePagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: ['10', '20','50'],
      },
    })
  };

  // 服务目录确定
  serviceHandleOk=()=>{
    const row = this.state.serviceList;
    this.props.handleServiceModal(false,row);
    this.getServices(this.state.projectList[0].projectId);
    this.setState({
      serviceRadio:row,
      serviceListKeys:[],
      serviceList:[],
      serviceVisible:false,
      loadingTable:false,
      servicePagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: ['10', '20','50'],
      },
    })
  };

  handleChangeSelect=(value)=>{
    if(value){
      this.setState({
        serviceData:[],
        selectId:value,
        servicePagination: {
          current: 1,
          pageSize: 10,
          total: 0,
          pageSizeOptions: ['10', '20','50'],
        },
      });
      this.getServices(value)
    }
  };

  openRecord=(record)=>{
    if(record){
      const newData =[...this.state.serviceData];
      const target = newData.filter(item => record === item)[0];
      if (target) {
        target.openRecord=true;
        this.setState({ data:newData});
      }
    }
  };

  retractRecord=(record)=>{
    if(record){
      const newData =[...this.state.serviceData];
      const target = newData.filter(item => record === item)[0];
      if (target) {
        delete target.openRecord;
        this.setState({ data:newData});
      }
    }
  };

  // 服务目录表格改变时
  serviceHandlePageChange = (pagination, filters, sorter, params, ) => {
    this.setState({
      servicePagination:pagination,
      serviceList:[],
      serviceListKeys:[]
    }, () => {
      this.serviceQueryTableData(pagination);
    });
  };


  // 机器人查询表格
  serviceQueryTableData =(pagination)=>{
    console.log(pagination)
    this.setState({loadingTable:true});
      ServicePortalStore.getServiceList(this.organizationId,this.state.selectId,pagination.current,pagination.pageSize).then(data=>{
        if(!data.failed){
          this.setState({
            serviceData:data.result,
            loadingTable:false,
            serviceListKeys:[],
            serviceList:[],
          })
        }else {
          this.setState({loadingTable:false});
        }
      })

  };

  // 关联服务目录内容
  serviceContainer=()=>{

    const columns = [{
      title: ServicePortalStore.languages[`${intlPrefix}.edit.serviceCatalog`],
      dataIndex: 'catalogueName',
      render: (value,record) => {
        return(
          <div>
            <img width={20} height={20} src={record.cataloguePicture} alt=""/>
            <div style={{display: 'inline-block',verticalAlign: 'text-top',marginLeft:'8px'}}>
              {record.catalogueName&&record.catalogueName.length>16?
                (
                  <Tooltip title={record.catalogueName}>
                    <span>
                      {record.catalogueName.slice(0,15)+'...'}
                    </span>
                  </Tooltip>
                )
                :
                record.catalogueName
              }
            </div>
          </div>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.showName`],
      dataIndex: 'catalogueDisplayName',
      render: (value,record) => {
        return(
          <span>
             {value&&value.length>16?
               (
                 <Tooltip title={value}>
                    <span>
                      {value.slice(0,15)+'...'}
                    </span>
                 </Tooltip>
               )
               :
               value
             }
          </span>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.description`],
      dataIndex: 'catalogueDescription',
      render: (value,record) => {
        return(
          <span>
             {value&&value.length>16?
               (
                 <Tooltip title={value}>
                    <span>
                      {value.slice(0,15)+'...'}
                    </span>
                 </Tooltip>
               )
               :
               value
             }
          </span>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.documentType`],
      dataIndex: 'categoryName',
      render: (value,record) => {
        return(
          <span>
            {value}
          </span>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.relationType`],
      dataIndex: 'structureName',
      render: (value,record) => {
        // const valueArr=[];
        // if(record.catalogueStructureList){
        //   record.catalogueStructureList.forEach(item=>{
        //     valueArr.push(<div>{item.structureName}</div>)
        //   })
        // }
        //
        // if(record.openRecord){
        //   valueArr.push(<a onClick={()=>{this.retractRecord(record)}}>{ServicePortalStore.languages[`${intlPrefix}.edit.retract`]}</a>)
        // }
        //
        // const valueArr_new=[];
        // if(valueArr.length>1){
        //   valueArr_new.push(valueArr[0]);
        //   valueArr_new.push(<a onClick={()=>{this.openRecord(record)}}>{ServicePortalStore.languages[`${intlPrefix}.edit.open`]}</a>)
        // }
        //
        // return <div>{record.openRecord?valueArr:valueArr.length>1?valueArr_new:valueArr}</div>;
        return value
      },
    },  {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.createdTime`],
      dataIndex: 'creationDate',
      render: (value,record,change) => {
        return (<span>{value}</span>);
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.home.UpdatedTime`],
      dataIndex: 'lastUpdateDate',
      render: (value,record,change) => {
        return (<span>{value}</span>);
      },
    }];

    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          serviceList:selectedRows[0],
          serviceListKeys:selectedRowKeys
        })
      },
      selectedRowKeys:this.state.serviceListKeys,
      type:'radio'
    };

    const projectListArr=[];
    if(this.state.projectList){
      this.state.projectList.forEach(item=>{
        projectListArr.push(
          <Option value={item.projectId}>{item.projectName}({item.projectCode})</Option>
        )
      })
    }


    return (
      <div>
        <div className="formInputSou_newModal">
          <Select
            style={{ width: 212 }}
            optionFilterProp="children"
            filterOption={(input, option) =>{
              if(option.props.children){
                return option.props.children.join("").toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            }}
            filter
            defaultValue={this.state.projectList?this.state.projectList[0].projectId:''}
            placeholder={ServicePortalStore.languages[`${intlPrefix}.edit.selectProject`]}
            onChange={this.handleChangeSelect}
          >
            {projectListArr}
          </Select>
        </div>
        <Table
          className='service_service'
          rowSelection={rowSelection}
          columns={columns}
          dataSource={this.state.serviceData}
          // dataSource={data}
          // filterBar={false}
          // showHeader={false}
          loading={this.state.loadingTable}
          pagination={this.state.servicePagination}
          onChange={this.serviceHandlePageChange}
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
          title={<span>{ServicePortalStore.languages[`${intlPrefix}.edit.relationText`]}{ServicePortalStore.languages[`${intlPrefix}.edit.serviceCatalog`]}</span>}
          className="service_service_modal"
          visible={visible}
          width={1200}
          // closable={false}
          maskClosable={false}
          destroyOnClose={true}
          onCancel={this.serviceHandleCancel}
          onOk={this.serviceHandleOk}
          footer={[
            <Button key="back" onClick={this.serviceHandleCancel}>
              {ServicePortalStore.languages[`cancle`]}
            </Button>,
            <Button key="submit" type="primary" onClick={this.serviceHandleOk}>
              {ServicePortalStore.languages[`ok`]}
            </Button>,
          ]}
        >
          {this.serviceContainer()}
        </Modal>
      </div>
    )
  }

}

export default Form.create({})(ServiceModal);
