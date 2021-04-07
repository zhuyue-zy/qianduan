import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page } from 'yqcloud-front-boot';
import { Button,Table,Modal,Divider,List, Icon, Popover , Form,Tooltip } from 'yqcloud-ui';

const intlPrefix = 'global.apiCallManagement';
const confirm = Modal.confirm;
import ApiCallManagementStore from '../../../../stores/globalStores/apiCallManagement/index';

@inject('AppState')
@observer
class tenantApiCallManagementHomes extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state={
      dataSource:[],
      current:1,
      total:1,
    };
  }

  componentDidMount() {
    this.getList()
    this.loadLanguage()
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    ApiCallManagementStore.queryLanguage(id, AppState.currentLanguage);
  }

  getList=()=>{
    const { TenantApiCallManagementStores }=this.props;
    const _this = this;
    TenantApiCallManagementStores.gitApiList(this.organizationId,0,25).then(data=>{
      _this.setState({
        dataSource:data.content,
        total:data.totalElements
      })
    })
  };

  stateInfo =(data)=> {
    Modal.info({
      title: ApiCallManagementStore.languages[`${intlPrefix}.failureDetails`],
      okText:ApiCallManagementStore.languages[`${intlPrefix}.close`],
      content: (
        <div>
          <Divider style={{margin:'10px 0'}} />
          <p>{data}</p>
        </div>
      ),
      onOk() {},
    });
  };

  pagOnChang=(current, filters, sorter, params)=>{
    this.setState({
      current:current.current,
      size:current.pageSize,
      filteredValueArr:filters.isEnabled
    });
    const { TenantApiCallManagementStores } = this.props;
    const _this = this;
    TenantApiCallManagementStores.gitApiList(this.organizationId,current.current-1,current.pageSize).then((data) => {
      _this.setState({
        dataSource:data.content,
        total:data.totalElements
      })
    });
  };

  parameterInfo =(data)=> {
    Modal.info({
      title:ApiCallManagementStore.languages[`${intlPrefix}.parameterValue`],
      okText:ApiCallManagementStore.languages[`${intlPrefix}.close`],
      content: (
        <div>
          <Divider style={{margin:'10px 0'}} />
          <p>{data}</p>
        </div>
      ),
      onOk() {},
    });
  };

  returnInfo =(data)=> {
    Modal.info({
      title: ApiCallManagementStore.languages[`${intlPrefix}.returnValue`],
      okText:ApiCallManagementStore.languages[`${intlPrefix}.close`],
      content: (
        <div>
          <Divider style={{margin:'10px 0'}} />
          <p>{data}</p>
        </div>
      ),
      onOk() {},
    });
  };

  export = () =>{
    const _this = this;
    return confirm({
      title: ApiCallManagementStore.languages[`${intlPrefix}.export`],
      content: ApiCallManagementStore.languages[`${intlPrefix}.determineExport`],
      onOk() {
        const { TenantApiCallManagementStores } = _this.props;
        TenantApiCallManagementStores.exportTenant(_this.organizationId).then((data) => {

        });
      },
      onCancel() {
        // console.log('取消');
      },
    });
  };

  render() {

    const columns = [
      // {
      //   title: <span>租户Code</span>,
      //   dataIndex: 'iamOrganizationCode',
      //   key: 'iamOrganizationCode',
      // },
      // {
      //   title: <span>租户名称</span>,
      //   dataIndex: 'iamOrganizationName',
      //   key: 'iamOrganizationName',
      // },
      // {
      //   title: <span>所属AK ID</span>,
      //   dataIndex: 'akId',
      //   key: 'akId',
      // },
      {
        title: <span>{ApiCallManagementStore.languages[`${intlPrefix}.APICode`]}</span>,
        dataIndex: 'apiCode',
        key: 'apiCode',
      },
      {
        title: <span>{ApiCallManagementStore.languages[`${intlPrefix}.callURL`]}</span>,
        dataIndex: 'requestUrl',
        key: 'requestUrl',
      },
      {
        title: <span>{ApiCallManagementStore.languages[`${intlPrefix}.APIDescribe`]}</span>,
        dataIndex: 'apiDescription',
        key: 'apiDescription',
      },
      {
        title: <span>{ApiCallManagementStore.languages[`${intlPrefix}.callTime`]}</span>,
        dataIndex: 'apiCallTime',
        key: 'apiCallTime',
      },
      {
        title: <span>{ApiCallManagementStore.languages[`${intlPrefix}.state`]}</span>,
        dataIndex: 'status',
        key: 'status',
        render: (text, record) => {
          if(text===200){
            return '成功'
          }else {
            return <a onClick={()=>{ return this.stateInfo(record.responseData)}}>{ApiCallManagementStore.languages[`${intlPrefix}.fail`]}</a>
          }
        }
      },
      {
        title: <span>{ApiCallManagementStore.languages[`${intlPrefix}.parameterValue`]}</span>,
        dataIndex: 'requestParam',
        key: 'requestParam',
        render: (text, record) => {
          return <a onClick={()=>{return this.parameterInfo(text)}}>{ApiCallManagementStore.languages[`${intlPrefix}.see`]}</a>
        }
      },
      {
        title: <span>{ApiCallManagementStore.languages[`${intlPrefix}.returnValue`]}</span>,
        dataIndex: 'responseData',
        key: 'responseData',
        render: (text, record) => {
          if(record.status===200){
            return <a onClick={()=>{return this.returnInfo(text)}}>{ApiCallManagementStore.languages[`${intlPrefix}.see`]}</a>
          }else {
            return <span style={{color: '#999'}}>{ApiCallManagementStore.languages[`${intlPrefix}.see`]}</span>
          }

        }
      },
    ];

    return(
      <Page>
        <Header title={ApiCallManagementStore.languages[`${intlPrefix}.ApiCall`]} >
          <Button
            icon="piliangdaochu"
            onClick={this.export}
          >
            <span style={{ color: '#04173F',paddingLeft:'5px' }}>{ApiCallManagementStore.languages[`${intlPrefix}.export`]}</span>
          </Button>
        </Header>
        <Content>
          <Table
            size="middle"
            columns={columns}
            dataSource={this.state.dataSource}
            scroll={{ x: 1 }}
            filterBar={false}
            onChange={this.pagOnChang}
            pagination={{
              current: this.state.current,
              defaultPageSize: 25,
              total: this.state.total,
              pageSizeOptions: ['25', '50', '100', '200'],
            }}
          />
        </Content>
      </Page>
    )
  }
}

const tenantApiCallManagementHome = Form.create()(tenantApiCallManagementHomes);

export default withRouter(injectIntl(tenantApiCallManagementHome));
