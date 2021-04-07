/*eslint-disable*/
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import querystring from 'query-string';
import { Button, Form, Input, Modal, Table, Tooltip, DatePicker, Select,Icon ,Switch } from 'yqcloud-ui';
import { axios, Content, Header, Page, Permission, stores } from 'yqcloud-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import moment from 'moment';
import './Organization.scss';
import UserStore from '../../../stores/organization/user/UserStore';

const intlPrefix = 'global.organization';
const { HeaderStore } = stores;
const { Sidebar } = Modal;
const FormItem = Form.Item;
const Option = Select.Option;


@inject('AppState')
@observer
class OrganizationHome extends Component {

  state= this.getInitState();
  getInitState() {
    return {
      visible: false,
      content: null,
      show: '',
      submitting: false,
      loading: false,
      editData: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: 0,
        pageSizeOptions: [25, 50, 100, 200]
      },
      sort: {
        columnKey: null,
        order: null,
      },
      filters: {},
      params: [],
      languageLists: [],
      tempCheck:false,
      tempCheckEmail:true,

      msgVisible:false,
      msgName:[],
      msgStatus:[],
      msgDataSource:[],
      id:'',
      initId: '',
      initState: '',
      tenantType:{}
    };
  }


  componentWillMount() {
    this.loadOrganizations();
    this.loadLanguage();
    this.languageList();
    this.getTenantType()
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const  id  = 0;
    UserStore.queryLanguage(id, AppState.currentLanguage);
  }

  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadOrganizations();
      this.languageList();
    });
  };

  loadOrganizations(paginationIn, sortIn, filtersIn, paramsIn) {
    const {
      pagination: paginationState,
      sort: sortState,
      filters: filtersState,
      params: paramsState,
    } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    this.fetch(pagination, sort, filters, params).then(data => {
      this.setState({
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
          pageSizeOptions: [25, 50, 100, 200]
        },
        content: data.content,
        loading: false,
        sort,
        filters,
        params,
      });
    });
  }

  queryMsg=(id)=>{
    axios.get(`/iam/v1/init/data/records/${id}`).then(data => {
      this.setState({
        msgDataSource:data
      })
    })
  }


  fetch({ current, pageSize }, { columnKey, order }, { name, code, enabled, isLdapUser }, params) {
    this.setState({
      loading: true,
    });
    const queryObj = {
      page: current - 1,
      size: pageSize,
      name,
      code,
      isLdapUser,
      enabled,
      params,
    };
    if (columnKey) {
      const sorter = [];
      sorter.push(columnKey);
      if (order === 'descend') {
        sorter.push('desc');
      }
      queryObj.sort = sorter.join(',');
    }
    this.queryMsgName()
    this.queryMsgStatus()
    return axios.get(`/iam/v1/organizations?${querystring.stringify(queryObj)}`);
  }

  //  快码初始化内容查询
  queryMsgName=()=>{
    const {AppState}=this.props;
     const code="FND_INITIAL_CONTENT";
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
    data => {
      this.setState({
        msgName:data
      })
    })
  }
  // 获取初始化名称
  selectMsgName = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const{msgName}=this.state;
    const temp_Emp = msgName.filter(v => (v.lookupValue === values));
    if (temp_Emp.length > 0) {
      return temp_Emp[0].lookupMeaning;
    } else {
      return values;
    }
  }
  queryMsgStatus=()=>{
    const {AppState}=this.props;
    const code="FND_MSG_SENDSTATUS";
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
    data => {
      this.setState({
        msgStatus:data
      })
    })
  }

  // 获取初始化状态
  selectMsgStatus = (values) => {
    if(values==='Y'){
      values="true"
    }else {
      values="false"
    }
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const{msgStatus}=this.state;
    const temp_Emp = msgStatus.filter(v => (v.lookupValue === values));
    if (temp_Emp.length > 0) {
      if (temp_Emp[0].lookupMeaning === '成功') {
        return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#eee', fontSize: 12, padding: '3px 8px', textDecoration: 'none', backgroundColor: '#6CC846' }}>{temp_Emp[0].lookupMeaning}</span>);
      } else if (temp_Emp[0].lookupMeaning === '失败') {
        return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#eee', fontSize: 12, padding: '3px 8px', textDecoration: 'none', backgroundColor: '#8092C0' }}>{temp_Emp[0].lookupMeaning}</span>);
      }
      return temp_Emp[0].lookupMeaning;
    } else {
      return values;
    }
  }
  languageList=() => {
    return axios.get('/iam/v1/languages/list').then((data) => {
      this.setState({
        languageLists : data,
      });
    })
  }

  openNewPage = () => {
    this.props.history.push('/iam/organization/organizationCreate');
  };

  onCreate = () => {
    this.openNewPage();
  };

  openEditPage = (id) => {
    this.props.history.push(`/iam/organization/organizationEdit/${id}`);
  };

  onEditOrg = (id) => {
    this.openEditPage(id);
  };

  handleDisable = ({ enabled, id }) => {
    const { intl } = this.props;
    axios.put(`/iam/v1/organizations/${id}/${enabled ? 'disable' : 'enable'}`).then((data) => {
      Choerodon.prompt(enabled ? UserStore.languages['disable.success'] : UserStore.languages['enable.success']);
      this.loadOrganizations();
    }).catch(Choerodon.handleResponseError);
  };

  handlePageChange = (pagination, filters, sorter, params) => {
    this.loadOrganizations(pagination, sorter, filters, params);
  };

  handleResetMsg=()=>{
    this.setState({
      text: '',
    });
    this.props.form.resetFields();
  }

  msgCancel = (e) => {
    this.handleResetMsg();
    this.setState({
      msgVisible: false,
    });
  }

  msgShowModal = (record) => {
    this.setState({
      msgVisible: true,
      initId : record.id,
    });
    this.queryMsg(record.id);
  }

  initialConfirm = (record) => {
    const { initId,initState } =this.state;
    this.setState({
      initState: record.id,
    })
    UserStore.initialData(record.organizationId, record.type).then((data) => {
      if (data === 0){
        UserStore.getCode('data.is.existed');
        this.queryMsg(initId);
        this.setState({
          initState: ''
        });
      } else if (data >= 1) {
        this.setState({
          initState: ''
        });
        this.queryMsg(initId);
      }
    })
  }

  msgRender = () => {
    const { intl, form } = this.props;
    const { getFieldDecorator } = form;
    const {msgVisible,msgDataSource, initState} = this.state;
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const columns = [{
      title:  UserStore.languages[`${intlPrefix}.name`],
      dataIndex: 'type',
      key: 'type',
      render:(text,record)=>{
        return this.selectMsgName(record.type)
    }
    }, {
      title:  UserStore.languages[`status`],
      dataIndex: 'isCompleted',
      key: 'isCompleted',
      render:(text,record)=>{
        return this.selectMsgStatus(record.isCompleted)
      }
    },
      {
        title:  UserStore.languages[`operation`],
        key: 'action',
        render:(text,record)=>(
          <div style={{ marginLeft:-15 }}>
          <Button
          loading={record.id === initState}
          style={{ display: record.isCompleted === 'Y'? 'none' : '', cursor: 'pointer', color: '#2196F3', fontSize: 14, marginRight: -15 }}
          onClick={this.initialConfirm.bind(this, record)} >{UserStore.languages[`${intlPrefix}.manual.initial`]}</Button>
          </div>)
      }];
    return (
      <Modal
        title={UserStore.languages[`${intlPrefix}.message`]}
        visible={msgVisible}
        className="organization-content"
        onCancel={this.msgCancel}
        footer={false}
        destroyOnClose={true}
      >
        <Table
          dataSource={msgDataSource}
          columns={columns}
          scroll={{ y: 350 }}
          pagination={false}
        />
      </Modal>
    );
  }

  // 租户类型快码
  getTenantType =() =>{
    const {AppState}=this.props;
    const code = 'FND_TENANT_TYPE';
    axios.get(`fnd/v1/${AppState.userInfo.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          tenantType: data
        })
      })
  };


  render() {
    const { intl } = this.props;
    let ENTERPRISE ='';
    for(var i in this.state.tenantType){
      if(this.state.tenantType[i].lookupValue==='ENTERPRISE'){
        ENTERPRISE = this.state.tenantType[i].lookupMeaning
      }
    }
    let PUBLIC ='';
    for(var i in this.state.tenantType){
      if(this.state.tenantType[i].lookupValue==='PUBLIC'){
        PUBLIC = this.state.tenantType[i].lookupMeaning
      }
    }
    const {
      sort: { columnKey, order }, filters, pagination,
      params, content, loading, visible, show, submitting,
    } = this.state;
    const columns = [{
      title: UserStore.languages.code,
      dataIndex: 'code',
      key: 'code',
      filters: [],
      // width:100,
      sorter: true,
      sortOrder: columnKey === 'code' && order,
      filteredValue: filters.code || [],
    },{
      title: UserStore.languages.name,
      dataIndex: 'name',
      key: 'name',
      filters: [],
      sorter: true,
      // width:150,
      render: text => <span>{text}</span>,
      sortOrder: columnKey === 'name' && order,
      filteredValue: filters.name || [],
    },  {
      title: UserStore.languages[`${intlPrefix}.remark`],
      dataIndex: 'remark',
      key: 'remark',
      filters: [],
      filteredValue: filters.remark || [],
      // width:150,
    }, {
      title: UserStore.languages[`${intlPrefix}.tenantType`],
      dataIndex: 'type',
      key: 'type',
      filters: [],
      render:(text,record)=>(
        record.typeCode==="ENTERPRISE"
          ? ENTERPRISE
          : PUBLIC
      )
    }, {
      title: UserStore.languages[`${intlPrefix}.ldap`],
      dataIndex: 'isLdapUser',
      key: 'isLdapUser',
      filters: [
        {
          text: UserStore.languages.yes,
          value: "Y",
        }, {
          text: UserStore.languages.no,
          value: "N",
        },
      ],
      filteredValue: filters.isLdapUser || [],
      width:100,
      render:(text,record)=>(
        record.isLdapUser==="Y"
          ? UserStore.languages.yes
          : UserStore.languages.no
    )
    }, {
      title: UserStore.languages[`${intlPrefix}.effectdate`],
      dataIndex: 'effectDate',
      key: 'effectDate',
      filters: [],
      width:120,
      sortOrder: columnKey === 'effectDate' && order,
      filteredValue: filters.effectDate || [],
      render: effectDate => effectDate && effectDate.split(' ')[0]
    }, {
      title:  UserStore.languages[`${intlPrefix}.expirydate`],
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      filters: [],
      // sorter: true,
      width:120,
      sortOrder: columnKey === 'expiryDate' && order,
      filteredValue: filters.expiryDate || [],
      render: expiryDate => expiryDate && expiryDate.split(' ')[0]
    }, {
      title: UserStore.languages.status,
      dataIndex: 'enabled',
      key: 'enabled',
      width:80,
      filters: [{
        text: UserStore.languages.effective,
        value: 'true',
      }, {
        text: UserStore.languages.invalid,
        value: 'false',
      }],
      filteredValue: filters.enabled || [],
      sorter: true,
      sortOrder: columnKey === 'enabled' && order,
      render: enable => enable ? UserStore.languages.effective :  UserStore.languages.invalid,
    }, {
      title: UserStore.languages.operation,
      width: '120px',
      key: 'action',
      align: 'left',
      render: (text, record) => (
        <div className="operation">
            <Tooltip
              title={UserStore.languages.modify}
              placement="bottom"
            >
              <Button
                size="small"
                icon="bianji-"
                shape="circle"
                style={{ cursor: 'pointer', color: '#2196F3' }}
                onClick={this.onEditOrg.bind(this, record.id)}
              />
            </Tooltip>
            <Tooltip
              title={record.enabled ? UserStore.languages.disableN : UserStore.languages.enableY }
              placement="bottom"
            >
              {
                record.enabled ?(<Button
                  size="small"
                  icon='jinyongzhuangtai'
                  shape="circle"
                  onClick={() => this.handleDisable(record)}
                />):(<Button
                  size="small"
                  icon= 'yijieshu'
                  shape="circle"
                  style={{ cursor: 'pointer', color: '#2196F3' }}
                  onClick={() => this.handleDisable(record)}
                />)
              }

            </Tooltip>
            <Tooltip
              title={UserStore.languages[`${intlPrefix}.message`]}
              placement="bottom"
            >
             <Button
                  size="small"
                  icon='assignment'
                  shape="circle"
                  style={{color:'#2196f3'}}
                  onClick={() => this.msgShowModal(record)}
                />
            </Tooltip>
        </div>
      ),
    }];
    return (
      <Page
        service={[
          'iam-service.organization.list',
          'iam-service.organization.check',
          'iam-service.organization.query',
          'iam-service.organization.create',
          'iam-service.organization.update',
          'iam-service.organization.disableOrganization',
          'iam-service.organization.enableOrganization',
        ]}
      >
        <Header title={UserStore.languages[`${intlPrefix}.header.title`]}>
          <Permission service={['iam-service.organization.list']}>
            <Button
              onClick={this.onCreate}
              style={{ color: '#04173F' }}
            >
              <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
              {UserStore.languages[`${intlPrefix}.create`]}
            </Button>
          </Permission>
        </Header>
        <Content>
          <Table
            columns={columns}
            dataSource={content}
            pagination={pagination}
            onChange={this.handlePageChange}
            filters={params}
            loading={loading}
            rowKey="id"
          />
          {this.msgRender()}
        </Content>
      </Page>
    );
  }
}

export default Form.create()(withRouter(injectIntl(OrganizationHome)));
