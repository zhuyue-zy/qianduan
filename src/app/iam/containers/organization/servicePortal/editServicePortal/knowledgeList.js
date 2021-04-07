import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject } from 'mobx-react';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Switch, Checkbox, Input, Popover, message, Popconfirm, Progress, Form, Select, Col, Row, } from 'yqcloud-ui';
import { Page, Header, Content, Permission, Action, axios } from 'yqcloud-front-boot';
import ServicePortalStore from '../../../../stores/organization/servicePortal'
import './knowledgeList.scss'

const FormItem = Form.Item;
const intlPrefix = 'organization.servicePortal';

const defaultImgUrl = process.env.IMG_HOST;
// const defaultImgUrl = 'https://yanqian-common.bj.bcebos.com/defaultimages/dev';
const StructureIcon = `${defaultImgUrl}/knowledgeImg/structureTypeIcon.svg`;
const RichTextIcon = `${defaultImgUrl}/knowledgeImg/singleTypeIcon.svg`;
const DocumentIcon = `${defaultImgUrl}/knowledgeImg/doucmentTypeIcon.svg`;
const MarkDownIcon = `${defaultImgUrl}/knowledgeImg/markdownTypeIcon.svg`;

@inject('AppState')
@injectIntl
class KnowledgeModal extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {
      knowledgeData:[],
      knowledgeListKeys:[],
      loadingTable:false,
      knowledgeVisible:false,
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
    this.getKnowledges();
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

  /*  查询知识 */
  getKnowledges = () => {
    this.setState({loadingTable:true});
    ServicePortalStore.getKnowledge(this.organizationId).then(data=>{
      if(!data.failed){
        const dataArr = data.content || [];
        this.setState({
          knowledgeData:data.content,
          dataOriginalKnowledgeData:JSON.parse(JSON.stringify(dataArr)) || [],
          loadingTable:false,
          knowledgePagination: {
            current: 1,
            pageSize: 10,
            total: data.totalElements,
            pageSizeOptions: ['10', '20','50'],
          },
        })
      }else {
        this.setState({loadingTable:false});
      }
    })
  };


  // 知识取消
  knowledgeHandleCancel=()=>{
    const data = this.state.dataOriginalKnowledgeData ||[];
    this.props.handleknowledgeModal(false,'');
    this.setState({
      knowledgeVisible:false,
      knowledgeListKeys:[],
      knowledgeList:[],
      knowledgeInputSou:'',
      knowledgeData: JSON.parse(JSON.stringify(data)),
    })
  };

  // 知识确定
  knowledgeHandleOk=()=>{
    const row = this.state.knowledgeList;
    const data = this.state.dataOriginalKnowledgeData ||[];
    this.props.handleknowledgeModal(false,row);
    this.setState({
      knowledgeRadio:row,
      knowledgeVisible:false,
      knowledgeListKeys:[],
      knowledgeData: JSON.parse(JSON.stringify(data)),
      knowledgeList:[],
      knowledgeInputSou:'',
    })
  };

  // 知识表格改变时
  knowledgeHandlePageChange = (pagination, filters, sorter, params, ) => {
    this.setState({
      knowledgePagination:pagination,
      knowledgeListKeys:[],
      knowledgeList:[],
    }, () => {
      this.knowledgeQueryTableData(pagination);
    });
  };

  // 知识查询表格
  knowledgeQueryTableData =(pagination)=>{
    this.setState({loadingTable:true});
    if(this.state.knowledgeInputSouDetermine){
      ServicePortalStore.getKnowledge(this.organizationId,pagination.current,pagination.pageSize,this.state.knowledgeInputSouDetermine).then(data=>{
        if(!data.failed){
          this.setState({
            knowledgeData:data.content,
            loadingTable:false,
            knowledgeListKeys:[],
            knowledgeList:[],
          })
        }else {
          this.setState({loadingTable:false});
        }
      })
    }else {
      ServicePortalStore.getKnowledge(this.organizationId,pagination.current,pagination.pageSize).then(data=>{
        if(!data.failed){
          this.setState({
            knowledgeData:data.content,
            loadingTable:false,
            knowledgeListKeys:[],
            knowledgeList:[],
          })
        }else {
          this.setState({loadingTable:false});
        }
      })
    }

  };

  // 知识搜索按钮
  knowledgeInputSouClick=(stag , e)=>{
    const knowledgeInputSouDetermine=this.state.knowledgeInputSou;
    const {knowledgePagination}=this.state;
    const evt = window.event || e;
    if(stag==='Icon'||(stag==='key'&&evt.keyCode === 13)){
      this.setState({loadingTable:true});
      ServicePortalStore.getKnowledge(this.organizationId,1,knowledgePagination.pageSize,knowledgeInputSouDetermine).then(data=>{
        if(!data.failed){
          this.setState({
            knowledgeData:data.content,
            knowledgeInputSouDetermine,
            knowledgeListKeys:[],
            loadingTable:false,
            knowledgeList:[],
            knowledgePagination: {
              current: 1,
              pageSize: 10,
              total: data.totalElements,
              pageSizeOptions: ['10', '20','50'],
            },
          })
        }else {
          this.setState({loadingTable:false});
        }
      })
    }
  };

  /* 渲染知识类型图标 */
  renderTitleIcon = (record) => {
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
  };

  // 关联知识内容
  knowledgeContainer=()=>{
    const {statusData}=this.state;
    let statusOption=[];
    if (statusData) {
      statusData.forEach((item) => {
        statusOption.push({ value: item.lookupValue, text: item.lookupMeaning });
      });
    }

    const columns = [{
      title: ServicePortalStore.languages[`${intlPrefix}.edit.titleRobot`],
      dataIndex: 'knowledgeTitle',
      render: (value,record) => {
        return(
          <div>
            {this.renderTitleIcon(record)}
            <div style={{display: 'inline-block',verticalAlign: 'top',marginLeft:'8px'}}>
              <div style={{fontWeight:'600'}}>
                {record.knowledgeTitle&&record.knowledgeTitle.length>16?
                  (
                    <Tooltip title={record.knowledgeTitle}>
                      <span>
                        {record.knowledgeTitle.slice(0,15)+'...'}
                      </span>
                    </Tooltip>
                  )
                  :
                  record.knowledgeTitle
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
      title: ServicePortalStore.languages[`${intlPrefix}.edit.versionNo`],
      dataIndex: 'objectVersionNumber',
      render: (value,record) => {
        return(
          <span>
            v{value}
          </span>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.versionNo`],
      dataIndex: 'knowledgeBaseCode',
      render: (value,record) => {
        return(
          <span>
            {value}
          </span>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.creator`],
      dataIndex: 'createPerson',
      render: (value,record) => {
        return(
          <span>
            {value}
          </span>
        )
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.state`],
      dataIndex: 'knowledgeStatus',
      render: (value,record,change) => {
        statusData.forEach((v) => {
          if (value === v.lookupValue) {
            change = <span className={v.lookupValue}>{v.lookupMeaning}</span>;
            return v.lookupMeaning;
          }
        });
        return change;
      },
    }, {
      title: ServicePortalStore.languages[`${intlPrefix}.edit.latelyUpdatedBy`],
      dataIndex: 'lastUpdatedByWho',
      render: (value,record,change) => {
        return (<span>{value}</span>);
      },
    }, {
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
          knowledgeList:selectedRows[0],
          knowledgeListKeys:selectedRowKeys
        })
      },
      selectedRowKeys:this.state.knowledgeListKeys,
      type:'radio'
    };

    return (
      <div>
        <div className="formInputSou_newModal">
          <Icon onClick={()=>this.knowledgeInputSouClick('Icon')} className="input_icon" type="sousuo" />
          <input value={this.state.knowledgeInputSou} onKeyDown={(e)=>this.knowledgeInputSouClick('key',e)} onChange={(e)=>this.setState({knowledgeInputSou:e.target.value})} placeholder='输入搜索内容'/>
        </div>
        <Table
          className='service_knowledge'
          rowSelection={rowSelection}
          columns={columns}
          loading={this.state.loadingTable}
          dataSource={this.state.knowledgeData}
          // dataSource={data}
          filterBar={false}
          // showHeader={false}
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
          title={<span>{ServicePortalStore.languages[`${intlPrefix}.edit.relationKnowledge`]}</span>}
          className="knowledge_service_modal"
          visible={visible}
          width={1200}
          // closable={false}
          maskClosable={false}
          destroyOnClose={true}
          onCancel={this.knowledgeHandleCancel}
          onOk={this.knowledgeHandleOk}
          footer={[
            <Button key="back" onClick={this.knowledgeHandleCancel}>
              {ServicePortalStore.languages[`cancle`]}
            </Button>,
            <Button key="submit" type="primary" onClick={this.knowledgeHandleOk}>
              {ServicePortalStore.languages[`ok`]}
            </Button>,
          ]}
        >
          {this.knowledgeContainer()}
        </Modal>
      </div>
    )
  }

}

export default Form.create({})(KnowledgeModal);
