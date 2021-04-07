import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject } from 'mobx-react';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Switch, Checkbox, Input, Popover, message, Popconfirm, Progress, Form, Select, Col, Row, } from 'yqcloud-ui';
import { Page, Header, Content, Permission, Action, axios } from 'yqcloud-front-boot';
import ServicePortalStore from '../../../../stores/organization/servicePortal'
import './knowledgeSpaceList.scss'
import { deepClone } from '../../../../common/utils';

const FormItem = Form.Item;
const spaceDomainUrl = process.env.KNOWLEDGE_SPACE_DOMAIN;
// const spaceDomainUrl = 'https://orgCode.ks.dev.hand-ams.com';
const intlPrefix = 'organization.servicePortal';

@inject('AppState')
@injectIntl
class knowledgeSpaceModal extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {
      knowledgeSpaceData:[],
      knowledgeSpaceListKeys:[],
      knowledgeSpaceVisible:false,
      loadingTable:false,
      // 存放多语言信息
      knowledgePagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: ['10', '20','50'],
      },
    }
  }

  componentWillMount() {
    this.getKnowledgeSpaces();
    this.getOrgCodes();
  }

  getOrgCodes=()=>{
    ServicePortalStore.getOrgCodeFun(this.organizationId).then(item=> {
      if (!item.failed) {
        this.setState({
          orgCode:item.code
        })
      }
    })
  };

  /*  查询知识空间 */
  getKnowledgeSpaces = () => {
    this.setState({loadingTable:true});
    ServicePortalStore.getKnowledgeSpace(this.organizationId).then(data=>{
      if(!data.failed){
        const dataArr = data.result.content || [];
        this.setState({
          knowledgeSpaceData:data.result.content,
          dataOriginalKnowledgeSpaceData:JSON.parse(JSON.stringify(dataArr)) || [],
          loadingTable:false,
          knowledgePagination: {
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


  // 知识空间取消
  knowledgeSpaceHandleCancel=()=>{
    const data = this.state.dataOriginalKnowledgeSpaceData ||[];
    this.props.handleknowledgeSpaceModal(false,'');
    this.setState({
      knowledgeSpaceVisible:false,
      knowledgeSpaceListKeys:[],
      knowledgeSpaceList:[],
      knowledgeSpaceInputSou:'',
      knowledgeSpaceData: JSON.parse(JSON.stringify(data)),
    })
  };

  // 知识空间确定
  knowledgeSpaceHandleOk=()=>{
    const row = this.state.knowledgeSpaceList;
    const data = this.state.dataOriginalKnowledgeSpaceData ||[];
    this.props.handleknowledgeSpaceModal(false,row);
    this.setState({
      knowledgeSpaceRadio:row,
      knowledgeSpaceVisible:false,
      knowledgeSpaceListKeys:[],
      knowledgeSpaceList:[],
      knowledgeSpaceInputSou:'',
      knowledgeSpaceData: JSON.parse(JSON.stringify(data)),
    })
  };

  // 知识空间表格改变时
  knowledgeHandlePageChange = (pagination, filters, sorter, params, ) => {
    this.setState({
      knowledgePagination:pagination,
      knowledgeSpaceListKeys:[],
      knowledgeSpaceList:[],
    }, () => {
      this.knowledgeQueryTableData(pagination);
    });
  };

  // 知识空间查询表格
  knowledgeQueryTableData =(pagination)=>{
    this.setState({loadingTable:true});
    if(this.state.knowledgeSpaceInputSouDetermine){
      ServicePortalStore.getKnowledgeSpace(this.organizationId,pagination.current,pagination.pageSize,this.state.knowledgeSpaceInputSouDetermine).then(data=>{
        if(!data.failed){
          this.setState({
            knowledgeSpaceData:data.result.content,
            knowledgeSpaceListKeys:[],
            loadingTable:false,
            knowledgeSpaceList:[],
          })
        }else {
          this.setState({
            loadingTable:false,
          })
        }
      })
    }else {
      ServicePortalStore.getKnowledgeSpace(this.organizationId,pagination.current,pagination.pageSize).then(data=>{
        if(!data.failed){
          this.setState({
            knowledgeSpaceData:data.result.content,
            loadingTable:false,
            knowledgeSpaceListKeys:[],
            knowledgeSpaceList:[],
          })
        }else {
          this.setState({
            loadingTable:false,
          })
        }
      })
    }

  };

  // 知识空间搜索按钮
  knowledgeSpaceInputSouClick=(stag , e)=>{
    const knowledgeSpaceInputSouDetermine=this.state.knowledgeSpaceInputSou;
    const {knowledgePagination}=this.state;
    const evt = window.event || e;
    if(stag==='Icon'||(stag==='key'&&evt.keyCode === 13)){
      this.setState({loadingTable:true});
      ServicePortalStore.getKnowledgeSpace(this.organizationId,1,knowledgePagination.pageSize,knowledgeSpaceInputSouDetermine).then(data=>{
        if(!data.failed){
          this.setState({
            knowledgeSpaceData:data.result.content,
            knowledgeSpaceInputSouDetermine,
            loadingTable:false,
            knowledgeSpaceListKeys:[],
            knowledgeSpaceList:[],
            knowledgePagination: {
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

  /** 渲染域名 */
  renderDoMain = (text, record) => {
    if(this.state.orgCode){
      const orgCodeCopy = deepClone(this.state.orgCode);
      const urlBefore = spaceDomainUrl.replace('orgCode', orgCodeCopy.toLowerCase());
      let urlAfter = '';
      if (record && record.spaceCode) {
        urlAfter = record.spaceCode.toLowerCase();
      }
      return `${urlBefore}/${urlAfter}`;
    }
  };

  // 复制域名
  copyToClip=(copyTxt)=> {
    var createInput = document.createElement('input');
    createInput.value = copyTxt;
    document.body.appendChild(createInput);
    createInput.select(); // 选择对象
    document.execCommand("Copy"); // 执行浏览器复制命令
    createInput.className = 'createInput';
    createInput.style.display='none';
    Choerodon.prompt(ServicePortalStore.languages[`${intlPrefix}.copySuccess`]);
  };

  // 关联知识空间内容
  knowledgeSpaceContainer=()=>{
    const columns = [{
      title: 'spaceName',
      dataIndex: 'spaceName',
      render: (value,record) => {
        return(
          <div>
            <img style={{borderRadius:'4px'}} width='44px' height='44px' src={record.spaceLogo} alt=""/>
            <div style={{display: 'inline-block',verticalAlign: 'top',marginLeft:'8px'}}>
              <div style={{fontWeight:'600'}}>
                {record.spaceName&&record.spaceName.length>16?
                  (
                    <Tooltip title={record.spaceName}>
                      <span>
                        {record.spaceName.slice(0,15)+'...'}
                      </span>
                    </Tooltip>
                  )
                  :
                  record.spaceName
                }
              </div>
              <div style={{marginTop:'6px'}}>
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
      title: 'spaceCode',
      dataIndex: 'spaceCode',
      render: (value,record) => {
        const url = this.renderDoMain(value,record);
        return(
          <div>
            <div style={{display: 'inline-block',verticalAlign: 'top'}}>
              <div>{ServicePortalStore.languages[`${intlPrefix}.edit.webRedirectUri`]}</div>
              <div style={{marginTop:'6px'}}>
                {url&&url.length>42?
                  (
                    <Tooltip title={url}>
                      <span>
                        {url.slice(0,41)+'...'}
                      </span>
                    </Tooltip>
                  )
                  :
                  url
                }
                <span style={{marginLeft:'8px'}}>
                    <Tooltip title={ServicePortalStore.languages[`${intlPrefix}.jump`]}>
                      <a target="_blank" href={url}>
                        <Icon
                          type="kongjian-dakaixindanchuang"
                          style={{
                            fontSize: '18px',
                            marginLeft: '8px',
                            cursor: 'pointer',
                            color:'#595959',
                          }}
                        />
                      </a>
                    </Tooltip>

                    <Tooltip title={ServicePortalStore.languages[`${intlPrefix}.copy`]}>
                      <Icon
                        onClick={()=>{this.copyToClip(url)}}
                        type="ziyuan"
                        style={{
                          fontSize: '18px',
                          marginLeft: '8px',
                          cursor: 'pointer',
                          color:'#595959',
                        }}
                      />
                    </Tooltip>
                  </span>
              </div>
            </div>
          </div>
        )
      },
    }, {
      title: 'creationDate',
      dataIndex: 'creationDate',
      render: (value,record) => {
        return(
          <div>
            <div style={{display: 'inline-block',verticalAlign: 'top'}}>
              <div>{ServicePortalStore.languages[`${intlPrefix}.edit.createdTime`]}</div>
              <div style={{marginTop:'6px'}}>{value}</div>
            </div>
          </div>
        )
      },
    }, {
      title: 'spaceAdminName',
      dataIndex: 'spaceAdminName',
      render: (value,record) => {
        return(
          <div>
            <div style={{display: 'inline-block',verticalAlign: 'top'}}>
              <div>{ServicePortalStore.languages[`${intlPrefix}.edit.ownerKS`]}</div>
              <div style={{marginTop:'6px'}}>{value}</div>
            </div>
          </div>
        )
      },
    }, {
      title: 'spaceUserNumber',
      dataIndex: 'spaceUserNumber',
      render: (value,record) => {
        return(
          <div>
            <div style={{display: 'inline-block',verticalAlign: 'top'}}>
              <div>{ServicePortalStore.languages[`${intlPrefix}.edit.member`]}</div>
              <div style={{marginTop:'6px'}}>
                <Icon style={{color:'#8e8e8e',fontSize:'14px',verticalAlign: 'baseline'}} type="xiezuo" />
                <span style={{marginLeft:'6px'}}>{value}</span>
              </div>
            </div>
          </div>
        )
      },
    }];

    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({
          knowledgeSpaceList:selectedRows[0],
          knowledgeSpaceListKeys:selectedRowKeys
        })
      },
      selectedRowKeys:this.state.knowledgeSpaceListKeys,
      type:'radio'
    };

    return (
      <div>
        <div className="formInputSou_newModal">
          <Icon onClick={()=>this.knowledgeSpaceInputSouClick('Icon')} className="input_icon" type="sousuo" />
          <input value={this.state.knowledgeSpaceInputSou} onKeyDown={(e)=>this.knowledgeSpaceInputSouClick('key',e)} onChange={(e)=>this.setState({knowledgeSpaceInputSou:e.target.value})} placeholder='输入搜索内容'/>
        </div>
        <Table
          className='service_knowledgeSpace'
          rowSelection={rowSelection}
          columns={columns}
          loading={this.state.loadingTable}
          dataSource={this.state.knowledgeSpaceData}
          // dataSource={data}
          filterBar={false}
          showHeader={false}
          pagination={this.state.knowledgePagination}
          onChange={this.knowledgeHandlePageChange}
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
          title={<span>{ServicePortalStore.languages[`${intlPrefix}.edit.relationText`]}{ServicePortalStore.languages[`${intlPrefix}.edit.relationKnowledgeSpace`]}</span>}
          className="knowledgeSpace_service_modal"
          visible={visible}
          width={1040}
          // closable={false}
          maskClosable={false}
          destroyOnClose={true}
          onCancel={this.knowledgeSpaceHandleCancel}
          onOk={this.knowledgeSpaceHandleOk}
          footer={[
            <Button key="back" onClick={this.knowledgeSpaceHandleCancel}>
              {ServicePortalStore.languages[`cancle`]}
            </Button>,
            <Button key="submit" type="primary" onClick={this.knowledgeSpaceHandleOk}>
              {ServicePortalStore.languages[`ok`]}
            </Button>,
          ]}
        >
          {this.knowledgeSpaceContainer()}
        </Modal>
      </div>
    )
  }

}

export default Form.create({})(knowledgeSpaceModal);
