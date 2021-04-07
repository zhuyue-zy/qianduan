import React, { Component } from 'react';
import { Form, Input, Button, Select, message, Icon, Row, Col, Radio, Tree, Switch,Tooltip ,Tabs, Table, Popconfirm } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { axios, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import SettingWechatStore from '../../../../stores/organization/settingWechat';
import './index.scss';

const intlPrefix = 'organization.settingLDAP';
const { TreeNode } = Tree;
const TabPane = Tabs.TabPane;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const { Option } = Select;
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 100 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 10 },
  },
};

const data = [];
for (let i = 0; i < 100; i++) {
  data.push({
    key: i.toString(),
    name: `Edrward ${i}`,
    age: 32,
    address: `London Park no. ${i}`,
  });
}

const EditableCell = ({ editable, value, onChange }) =>{
  let classText = '';

  return (
    <div>
      <Input
        // className={classText}
        // onBlur={()=>{
        //   if(!value){
        //     classText = 'onBlurValue_on';
        //   }
        // }}
        style={{ margin: '-5px 0' }}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
};

function noop() {
}

@inject('AppState')
@observer
class SettingLDAPHome extends Component {
  state = this.getInitState();

  organizationId = this.props.AppState.currentMenuType.organizationId;

  type = this.props.match.params.type || '';

  allCheckedKeys = [];

  getInitState() {
    return {
      key:1,
      isLoading: true,
      params: [],
      filters: {},
      endOpen: false,
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      dataSource: {},
      isLDAP: false,
      edit: !!this.props.match.params.id,
      roleIdType: [],
      secretType: 1,
      checkedKeys: [],
      checkAll: false,
      syncLoading: false,
      checkedNodes: [],
      applicationData : {}
    };
  }

  componentWillMount() {
    this.queryRoleId();
    this.loadLanguage();
    this.fetch(this.props);
  }

  loopRoleData = (data, num) => data.map((item) => {
    const children = [];
    const result = {
      key: item.departmentId,
      id: item.departmentId,
      title: item.departmentName,
      description: item.departmentName,
    };
    if (!item.childList || item.childList.length === 0) {
      this.allCheckedKeys.push(`${item.departmentId}`);
    }
    if (item.childList && item.childList.length > 0) {
      if (children.length > 0) {
        result.children = [...this.loopRoleData(item.childList, num + 1), ...children];
      } else {
        result.children = this.loopRoleData(item.childList, num + 1);
      }
    } else if (children.length > 0) {
      result.children = children;
    }
    return result;
  });

  addShow = (data, parentLabel) => {
    if (data.children && data.children.length > 0) {
      data.show = parentLabel ? `${parentLabel}/${data.key}` : data.key;
      for (let i = 0; i < data.children.length; i += 1) {
        this.addShow(data.children[i], data.show);
      }
    } else {
      data.show = parentLabel ? `${parentLabel}/${data.key}` : data.key;
    }
    return data;
  };

  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    SettingWechatStore.queryLanguage(id, AppState.currentLanguage);
  };

  fetch() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    this.queryLDAP();
  }

  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.queryLDAP();
      this.queryRoleId();
    });
  };

  queryRoleId = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    return axios.post(`/iam/v1/${organizationId}/roles/list`)
      .then((data) => {
        this.setState({
          roleIdType: data,
        });
      });
  };

  queryLDAP = () => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    SettingWechatStore.queryLDAP(organizationId)
      .then(((data) => {
        if (data && !data.failed && data.id) {
          const miniProgramSecret = JSON.parse(data.miniProgramSecret);

          let applicationData = {};

          const newArr = [];
          if(data&&data.weChatApplicationConfigList&&data.weChatApplicationConfigList.length>0){
            data.weChatApplicationConfigList.forEach(item=>{
              if(item.distinguish==='message'){
                applicationData = item;
              }else {
                newArr.push(item)
              }
            });
          }
          this.setState({
            dataSource: { ...data, ...miniProgramSecret },
            treeModify: false,
            checkAll:data.selectAll,
            applicationData,
            applicationNewArr:newArr,
            applicationDeletedArr:JSON.parse(JSON.stringify(newArr)),
          });
          if (data.isDefaultPassword) {
            this.setState({ secretType: 2 });
          }
          if (data.weChatPositionList) {
            this.allCheckedKeys = [];
            const b = this.loopRoleData(data.weChatPositionList, 0);
            const a = [];
            b.forEach((item) => {
              a.push(this.addShow(item, ''));
            });
            SettingWechatStore.setRolesTree(a);

            SettingWechatStore.querySelect(organizationId)
              .then(((res) => {
                if (res && res.length > 0) {
                  this.setState({ checkedKeys: res });
                }
              }));
          }
        }
      }));
  };

  handleSubmit_tabOne = () => {
    const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { dataSource, checkedNodes, checkedKeys, secretType } = this.state;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if((!err)||(!err.corpId)&&(!err.description)&&(!err.corpSecret)&&(!err.initRoleId)&&(!err.defaultPassword)&&secretType){
        if (secretType === 1) {
          data.isDefaultPassword = false;
        } else {
          data.isDefaultPassword = true;
        }
        data.iamOrganizationId = organizationId;
        data.selectAll = this.state.checkAll?this.state.checkAll:this.state.checkAll;
        if (dataSource.id) {
          dataSource.corpId = data.corpId;
          dataSource.description = data.description;
          dataSource.corpSecret = data.corpSecret;
          dataSource.initRoleId = data.initRoleId;
          dataSource.defaultPassword = data.defaultPassword?data.defaultPassword:'';
          dataSource.isDefaultPassword = data.isDefaultPassword;
          dataSource.selectAll = data.selectAll;
          if (this.state.treeModify) {
            dataSource.weChatSynConfigList = checkedNodes
              .filter(v => (!v.props.children))
              .map(v => ({
                configId: dataSource.id,
                departmentId: v.key,
                iamOrganizationId: organizationId,
              }));
          } else {
            dataSource.weChatSynConfigList = checkedKeys
              .map(v => ({
                configId: dataSource.id,
                departmentId: v,
                iamOrganizationId: organizationId,
              }));
          }
          // const miniProgramSecret = {
          //   robot: data.robot,
          //   knowledgeBase: data.knowledgeBase,
          //   itsm: data.itsm
          // };
          // dataSource.miniProgramSecret = JSON.stringify(miniProgramSecret);
          SettingWechatStore.updateOrgLDAP(organizationId,
            { ...dataSource })
            .then(({ failed, message }) => {
              if (failed) {
                onError();
              } else {
                Choerodon.prompt(SettingWechatStore.languages['modify.success']);
                this.handleRefresh();
                onSuccess();
              }
            });

        }else {
          // const miniProgramSecret = {
          //   robot: data.robot,
          //   knowledgeBase: data.knowledgeBase,
          //   itsm: data.itsm
          // };
          // data.miniProgramSecret = JSON.stringify(miniProgramSecret);
          SettingWechatStore.updateOrgLDAP(organizationId,
            { ...data })
            .then(({ failed, message }) => {
              if (failed) {
                onError();
              } else {
                Choerodon.prompt(SettingWechatStore.languages['create.success']);
                this.handleRefresh();
                onSuccess();
              }
            });
        }
      }else {
        message.warning(SettingWechatStore.languages['account.configuration.please.enter.required.fields']);
      }
    })
  };

  handleSubmit_tabTwo = () =>{
    const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { dataSource, checkedNodes, checkedKeys, secretType } = this.state;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if(dataSource.id){
        const miniProgramSecret = {
          robot: data.robot,
          knowledgeBase: data.knowledgeBase,
          itsm: data.itsm
        }
        dataSource.miniProgramSecret = JSON.stringify(miniProgramSecret);
        SettingWechatStore.updateOrgLDAP(organizationId,
          { ...dataSource })
          .then(({ failed, message }) => {
            if (failed) {
              onError();
            } else {
              Choerodon.prompt(SettingWechatStore.languages['modify.success']);
              this.handleRefresh();
              onSuccess();
            }
          });
      }
    })
  };

  handleSubmit_tabThree = () =>{
    const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { dataSource, checkedNodes, checkedKeys, applicationNewArr,applicationData,deleteAppArr } = this.state;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if((!err)||(!err.applicationSecret_application)&&(!err.agentId_application)){
        if(dataSource.id){
          let isNull = true;
          for (var i in applicationNewArr) {
            if((!applicationNewArr[i].distinguish)||(!applicationNewArr[i].agentId)||(!applicationNewArr[i].applicationSecret)){
              isNull = false;
              break
            }
          }
          if(isNull){
            dataSource.agentId = data.agentId;
            dataSource.applicationSecret = data.applicationSecret;

            if(applicationNewArr){
              dataSource.weChatApplicationConfigList = JSON.parse(JSON.stringify(applicationNewArr));

              if(deleteAppArr){
                deleteAppArr.forEach(item=>{
                  dataSource.weChatApplicationConfigList.push(item)
                })
              }
              if(applicationData.agentId&&applicationData.applicationSecret){
                applicationData.agentId = data.agentId_application;
                applicationData.applicationSecret = data.applicationSecret_application;
                dataSource.weChatApplicationConfigList.push(applicationData);
              }else {
                applicationData.agentId = data.agentId_application;
                applicationData.applicationSecret = data.applicationSecret_application;
                applicationData.iamOrganizationId = dataSource.iamOrganizationId;
                applicationData.description = '推送消息应用';
                applicationData.distinguish =  'message';
                dataSource.weChatApplicationConfigList.push(applicationData);
              }
            }else {
              if(applicationData.agentId&&applicationData.applicationSecret){
                applicationData.agentId = data.agentId_application;
                applicationData.applicationSecret = data.applicationSecret_application;
                dataSource.weChatApplicationConfigList=[applicationData];
              }else {
                applicationData.agentId = data.agentId_application;
                applicationData.iamOrganizationId = dataSource.iamOrganizationId;
                applicationData.description = '推送消息应用';
                applicationData.distinguish =  'message';
                applicationData.applicationSecret = data.applicationSecret_application;
                dataSource.weChatApplicationConfigList=[applicationData];
              }

              if(deleteAppArr){
                deleteAppArr.forEach(item=>{
                  dataSource.weChatApplicationConfigList.push(item)
                })
              }
            }
            // if(dataSource.weChatApplicationConfigList){
            //   dataSource.weChatApplicationConfigList.push({
            //     iamOrganizationId: dataSource.iamOrganizationId,
            //     agentId: data.agentId_application,
            //     applicationSecret: data.applicationSecret_application,
            //     description: '推送消息应用',
            //     distinguish: 'message',
            //   })
            // }

            SettingWechatStore.updateOrgLDAP(organizationId,
              { ...dataSource })
              .then(({ failed, message }) => {
                if (failed) {
                  onError();
                } else {
                  Choerodon.prompt(SettingWechatStore.languages['modify.success']);
                  this.handleRefresh();
                  onSuccess();
                }
              });
          }else {
            message.warning(SettingWechatStore.languages['account.configuration.please.enter.required.fields']);
          }
        }
      }else {
        message.warning(SettingWechatStore.languages['account.configuration.please.enter.required.fields']);
      }
    })
  };

  // 未使用
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!err) {
        const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        const { dataSource, checkedNodes, checkedKeys, secretType } = this.state;
        if (secretType === 1) {
          data.isDefaultPassword = false;
        } else {
          data.isDefaultPassword = true;
        }
        data.iamOrganizationId = organizationId;
        data.selectAll = this.state.checkAll?this.state.checkAll:this.state.checkAll;
        if (dataSource.id) {
          data.objectVersionNumber = dataSource.objectVersionNumber;
          data.id = dataSource.id;
          if (this.state.treeModify) {
            data.weChatSynConfigList = checkedNodes
              .filter(v => (!v.props.children))
              .map(v => ({
                configId: dataSource.id,
                departmentId: v.key,
                iamOrganizationId: organizationId,
              }));
          } else {
            data.weChatSynConfigList = checkedKeys
              .map(v => ({
                configId: dataSource.id,
                departmentId: v,
                iamOrganizationId: organizationId,
              }));
          }
          const miniProgramSecret = {
            robot: data.robot,
            knowledgeBase: data.knowledgeBase,
            itsm: data.itsm
          }
          data.miniProgramSecret = JSON.stringify(miniProgramSecret);
          SettingWechatStore.updateOrgLDAP(organizationId,
            { ...data })
            .then(({ failed, message }) => {
              if (failed) {
                onError();
              } else {
                Choerodon.prompt(SettingWechatStore.languages['modify.success']);
                this.handleRefresh();
                onSuccess();
              }
            });
        } else {
          const miniProgramSecret = {
            robot: data.robot,
            knowledgeBase: data.knowledgeBase,
            itsm: data.itsm
          }
          data.miniProgramSecret = JSON.stringify(miniProgramSecret);
          SettingWechatStore.updateOrgLDAP(organizationId,
            { ...data })
            .then(({ failed, message }) => {
              if (failed) {
                onError();
              } else {
                Choerodon.prompt(SettingWechatStore.languages['create.success']);
                this.handleRefresh();
                onSuccess();
              }
            });
        }
      } else {
        message.warning(SettingWechatStore.languages['account.configuration.please.enter.required.fields']);
      }
    });
  };

  deepFlatten = arr => arr.map((v) => {
    if (Array.isArray(v.props.children) && v.props.children.length > 0) {
      this.list.push(v.key);
      this.deepFlatten(v.props.children);
    } else {
      this.result.push(v.key);
    }
  });

  distinctValuesOfArray = arr => [...new Set(arr)];

  onCheck = (value, e) => {
    this.list = [];
    this.result = [];
    // let checkLength = 0;
    // if (e.checked) {
    //   const a = e.node.props.show.split('/');
    //   if (e.node.props.children) {
    //     this.deepFlatten(e.node.props.children);
    //   }
    //   const checkNodes = this.distinctValuesOfArray([...a, ...value.checked, ...this.list, ...this.result]);
    //   checkLength = checkNodes.length;
    //   this.setState({ checkedKeys: checkNodes });
    // } else if (e.node.props.children) {
    //   this.deepFlatten(e.node.props.children);
    //   const filterCheckedNodes = value.checked.filter(v => (![...this.result, ...this.list].includes(v)));
    //   checkLength = filterCheckedNodes.length;
    //   this.setState({ checkedKeys: filterCheckedNodes });
    // } else {
    //   const filterCheckedNodes = value.checked.filter(v => (e.node.props.key !== v));
    //   checkLength = filterCheckedNodes.length;
    //   this.setState({ checkedKeys: filterCheckedNodes });
    // }
    this.setState({
      treeModify: true,
      checkedKeys: value,
      checkedNodes: e.checkedNodes,
    });
    if (e.checkedNodes.filter(v => (!v.props.children)).length === this.allCheckedKeys.length) {
      this.setState({ checkAll: true });
    } else {
      this.setState({ checkAll: false });
    }
  };

  onTitle = item => (<div title={item.description}>{item.title}</div>);

  renderTreeNodes = data => data.map((item) => {
    if (item.children) {
      return (
        <TreeNode title={this.onTitle(item)} key={item.key} {...item}>
          {this.renderTreeNodes(item.children)}
        </TreeNode>
      );
    }
    return <TreeNode {...item} title={this.onTitle(item)} />;
  });

  // 添加应用
  addApplication = () =>{
    let { dataSource,key,applicationNewArr }=this.state;
    if(applicationNewArr){
      const newApp = {
        key:key,
        agentId:'',
        distinguish:'',
        description:'',
        iamOrganizationId:dataSource.iamOrganizationId,
        applicationSecret:'',
      };
      applicationNewArr.push(newApp);
      this.setState({
        applicationNewArr,
        key:key+1,
      })
    }else {
      applicationNewArr = [
        {
          key:key,
          agentId:'',
          distinguish:'',
          description:'',
          applicationSecret:'',
          iamOrganizationId:dataSource.iamOrganizationId,
        }
      ];

      this.setState({
        applicationNewArr,
        key:key+1,
      })
    }
  };

  renderColumns(text, record, column) {
    return (
      <EditableCell
        editable={record.editable}
        value={text}
        onChange={value => this.handleChange(value, record, column)}
      />
    );
  }

  handleChange(value, record, column) {
    const newData = this.state.applicationNewArr;
    const target = this.recordData(record,newData);
    if (target) {
      target[column] = value;
      this.setState({ applicationNewArr: newData });
    }
  }

  deleteRecord(record) {
    let newData = this.state.applicationNewArr;
    const target = this.recordData(record,newData);
    const deleteArr = [];
    const deleteArrCopy = [];
    newData.forEach(item=>{
      if(target!==item){
        deleteArr.push(item)
      }else {
        item.deleted = true
        deleteArrCopy.push(item)
      }
    });
    if (target) {
      this.setState({
        applicationNewArr: deleteArr ,
        deleteAppArr: deleteArrCopy,
      });
    }
  }

  recordData = (record, data) =>{
    let arr;
    for( var i in data){
      if(data[i]===record){
        arr = data[i]
        break
      }
    }
    return arr
  };

  checkMobilApplicationSecretApplication = (rule, value, callback) =>{
    callback();
    if(!value){
      this.props.form.setFields({
        agentId_application: {
          value: this.props.form.getFieldsValue().agentId_application,
        },
      });
    }
  };

  checkMobilAgentIdApplication = (rule, value, callback) =>{
    callback();
    if(!value){
      this.props.form.setFields({
        applicationSecret_application: {
          value: this.props.form.getFieldsValue().applicationSecret_application,
        },
      });
    }
  };

  render() {
    const { AppState, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { dataSource, applicationNewArr, roleIdType,applicationData } = this.state;
    const menuType = AppState.currentMenuType;
    const data = SettingWechatStore.getRolesTree.slice();
    const orgname = menuType.name;
    const roleList = [];
    roleIdType.forEach((item) => {
      roleList.push(<Option value={item.id}>{item.name}</Option>);
    });

    const columns = [{
      title: <span><span style={{color:'#F8353F'}}>*</span><span>{SettingWechatStore.languages[`${intlPrefix}.appCode`]}</span></span>,
      dataIndex: 'distinguish',
      width: '23.5%',
      render: (text, record) => this.renderColumns(text, record, 'distinguish'),
    }, {
      title: <span><span style={{color:'#F8353F'}}>*</span><span>{SettingWechatStore.languages[`${intlPrefix}.agentId`]}</span></span>,
      dataIndex: 'agentId',
      width: '23.5%',
      render: (text, record) => this.renderColumns(text, record, 'agentId'),
    }, {
      title: <span><span style={{color:'#F8353F'}}>*</span><span>{SettingWechatStore.languages[`${intlPrefix}.applicationSecret`]}</span></span>,
      dataIndex: 'applicationSecret',
      width: '23.5%',
      render: (text, record) => this.renderColumns(text, record, 'applicationSecret'),
    }, {
      title: SettingWechatStore.languages[`${intlPrefix}.descriptions`],
      dataIndex: 'description',
      width: '23.5%',
      render: (text, record) => this.renderColumns(text, record, 'description'),
    }, {
      title: '',
      dataIndex: 'operation',
      width: '6%',
      render: (text, record) => {
        return (
          <div className="editable-row-operations">
            <Tooltip title={SettingWechatStore.languages[`delete`]}>
              <Popconfirm
                title={SettingWechatStore.languages[`${intlPrefix}.isDelete`]}
                onConfirm={() => this.deleteRecord(record)}
                cancelText={SettingWechatStore.languages[`cancle`]}
                okText={SettingWechatStore.languages[`ok`]}
              >
                <Icon className="deleteInput_icon" type="delete-surface" />
              </Popconfirm>
            </Tooltip>
          </div>
        );
      },
    }];

    return (
      <Page>
        <Header title={SettingWechatStore.languages[`${intlPrefix}.title`]}>
        </Header>
        <Content className="iam-setting-wechat">
          <Tabs defaultActiveKey="1">
            <TabPane tab={SettingWechatStore.languages[`${intlPrefix}.essentialInformation`]} key="1">
              <div
                // className="iam-setting-wechat-div-calc"
                style={{
                width: 'calc(50% - 12px)',
                display: 'inline-block',
                verticalAlign: 'top',
               }}
              >
            <span style={{
              fontSize: '15px',
              fontFamily: 'PingFangSC-Medium',
              color: '#04173F',
              paddingLeft: '7px',
              borderLeft: '2px solid #2196F3 ',
            }}
            >
              {/*{SettingWechatStore.languages[`${intlPrefix}.param`]}*/}
              {SettingWechatStore.languages[`${intlPrefix}.essentialInformation`]}
            </span>
                <Form layout="vertical" style={{ marginTop: '27px' }}>
                  <Row>
                    <Col span={6} className="is-required">
                      {SettingWechatStore.languages[`${intlPrefix}.enterpriseId`]}
                    </Col>
                    <Col span={18}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('corpId', {
                          rules: [{
                            required: true,
                            whitespace: true,
                            message: SettingWechatStore.languages[`${intlPrefix}.inputEnterpriseId`],
                          }],
                          validateFirst: true,
                          initialValue: dataSource.corpId || '',
                        })(
                          <Input
                            autoComplete="off"
                            size="default"
                            style={{
                              width: '320px',
                            }}
                            maxLength={200}
                          />,
                        )}
                      </FormItem>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={6} className="is-required">
                      {SettingWechatStore.languages[`${intlPrefix}.enterpriseDescription`]}
                    </Col>
                    <Col span={18}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('description', {
                          rules: [{
                            whitespace: true,
                            required: true,
                            message: SettingWechatStore.languages[`${intlPrefix}.inputEnterpriseDescription`],
                          }],
                          // validateFirst: true,
                          initialValue: dataSource.description || '',
                        })(
                          <Input
                            autoComplete="off"
                            size="default"
                            style={{
                              width: '320px',
                            }}
                            maxLength={200}
                          />,
                        )}
                      </FormItem>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={6} className="is-required">
                      {SettingWechatStore.languages[`${intlPrefix}.corpSecret`]}
                    </Col>
                    <Col span={18}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('corpSecret', {
                          rules: [{
                            required: true,
                            whitespace: true,
                            message: SettingWechatStore.languages[`${intlPrefix}.inoutCorpSecret`],
                          }],
                          validateFirst: true,
                          initialValue: dataSource.corpSecret || '',
                        })(
                          <Input
                            autoComplete="off"
                            size="default"
                            style={{
                              width: '320px',
                            }}
                            maxLength={200}
                          />,
                        )}
                      </FormItem>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={6} className="is-required">
                      {SettingWechatStore.languages[`${intlPrefix}.roleId`]}
                    </Col>
                    <Col span={18}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('initRoleId', {
                          rules: [{
                            required: true,
                            // whitespace: true,
                            message: SettingWechatStore.languages[`${intlPrefix}.choiceInitRole`],
                          }],
                          // validateTrigger: 'onBlur',
                          validateFirst: true,
                          initialValue: dataSource.initRoleId || '',
                        })(
                          <Select
                            dropdownClassName="iam-setting-wechat-select"
                            allowClear
                            style={{
                              width: '320px',
                            }}
                          >
                            {roleList}
                          </Select>,
                        )}
                      </FormItem>
                    </Col>
                  </Row>

                  <Row>
                    <Col span={6} className="is-required">
                      {SettingWechatStore.languages[`${intlPrefix}.initialPassword`]}
                    </Col>
                    <Col span={18}>
                      <div
                        style={{
                          display: 'inline-block',
                          width:'90px',
                          marginTop: '2px'
                        }}
                      >
                        <RadioGroup
                          onChange={(e) => {
                            this.setState({
                              secretType: e.target.value,
                            });
                          }}
                          value={this.state.secretType}
                        >
                          <Radio value={1}>{SettingWechatStore.languages[`${intlPrefix}.randomCipher`]}</Radio>
                          <Radio style={{marginTop:'24px'}} value={2}>
                            {SettingWechatStore.languages[`${intlPrefix}.defaultPassword`]}
                          </Radio>
                        </RadioGroup>
                      </div>
                      <FormItem
                        {...formItemLayout}
                        style={{
                          display: 'inline-block',
                          marginTop:'40px'
                        }}
                      >
                        {this.state.secretType === 2 ? getFieldDecorator('defaultPassword', {
                          validateFirst: true,
                          initialValue: dataSource.defaultPassword || '',
                        })(
                          <Input
                            autoComplete="off"
                            size="default"
                            style={{
                              width: '230px',
                            }}
                            maxLength={200}
                          />,
                        ) : null}
                      </FormItem>
                    </Col>
                  </Row>
                </Form>
              </div>

              <div style={{
                width: 'calc(50% - 12px)',
                display: 'inline-block',
                marginLeft: '20px'
              }}
              >
                <div>
                  <div style={{ marginTop: '0' }}>
                    <span
                      style={{
                        fontSize: '15px',
                        fontFamily: 'PingFangSC-Medium',
                        color: '#04173F',
                        paddingLeft: '7px',
                        borderLeft: '2px solid #2196F3',
                      }}
                    >
                      {SettingWechatStore.languages[`${intlPrefix}.synchronous.configuration`]}
                    </span>
                    <span>
                    <Button
                      onClick={() => {
                        const { organizationId } = AppState.currentMenuType;
                        this.setState({ syncLoading: true });
                        SettingWechatStore.synOrgLDAP(organizationId)
                          .then(((res) => {
                            if (res && !res.failed) {
                              Choerodon.prompt(SettingWechatStore.languages[`${intlPrefix}.synchronizationSuccessful`]);
                              this.handleRefresh();
                            }
                            this.setState({ syncLoading: false });
                          }))
                          .catch(() => {
                            this.setState({ syncLoading: false });
                          });
                      }}
                      style={{
                        borderRadius: 5,
                        marginLeft: 12,
                        fontSize: 14,
                      }}
                      loading={this.state.syncLoading}
                    >
                      <Icon type="tongbucaidan" style={{ color: '#2196F3' }} />
                      {SettingWechatStore.languages[`${intlPrefix}.synchronization`]}
                    </Button>
                  </span>
                  </div>
                  <div className="iam-switch">
                    <Switch
                      checked={this.state.checkAll}
                      onChange={(checked) => {
                        this.setState({ checkAll: checked });
                        if (checked) {
                          this.setState({
                            treeModify: false,
                            checkedKeys: this.allCheckedKeys,
                          });
                        } else {
                          this.setState({
                            checkedKeys: [],
                          });
                        }
                      }}
                    />
                    <span className="switch-word">
                      {SettingWechatStore.languages[`${intlPrefix}.selectAll`]}
                </span>
                  </div>
                  <Tree
                    checkable
                    // checkStrictly
                    onCheck={this.onCheck}
                    checkedKeys={this.state.checkedKeys}
                  >
                    {this.renderTreeNodes(data)}
                  </Tree>
                </div>
              </div>
              <div
                style={{
                  // position: 'fixed',
                  // bottom: '0',
                  // width: '100%',
                  // padding: '20px 0',
                  // background: '#fff',
                  marginTop:'30px'
                }}
              >
                <Button
                  onClick={this.handleSubmit_tabOne}
                  style={{
                    background:'#2196F3 ',
                    border: '1px solid #2196F3',
                    color: '#fff'
                  }}
                >
                  {SettingWechatStore.languages.save}
                </Button>
                <Button
                  style={{
                    border: '1px solid #ACB3BF',
                    color: '#818999',
                    marginLeft:'12px'
                  }}
                >
                  {SettingWechatStore.languages[`cancle`]}
                </Button>
              </div>
            </TabPane>

            <TabPane disabled={dataSource.id? false:true} tab={SettingWechatStore.languages[`${intlPrefix}.applet`]} key="2">
              <div style={{
                width: 'calc(50% - 12px)',
                display: 'inline-block',
                verticalAlign: 'top',
              }}
              >
                <Form layout="vertical">
                  <span style={{
                    fontSize: '15px',
                    fontFamily: 'PingFangSC-Medium',
                    color: '#04173F',
                    paddingLeft: '7px',
                    borderLeft: '2px solid #2196F3 ',
                  }}
                  >
                    {/*{SettingWechatStore.languages[`${intlPrefix}.param`]}*/}
                    {SettingWechatStore.languages[`${intlPrefix}.applet`]}
                  </span>
                  <Row style={{marginTop:'27px'}}>
                    <Col span={6}>
                      {SettingWechatStore.languages[`${intlPrefix}.itsmSecret`]}
                    </Col>
                    <Col span={18}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('itsm', {
                          validateFirst: true,
                          initialValue: dataSource.itsm || '',
                        })(
                          <Input
                            autoComplete="off"
                            size="default"
                            style={{
                              width: '320px',
                            }}
                            maxLength={200}
                          />,
                        )}
                      </FormItem>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={6}>
                      {SettingWechatStore.languages[`${intlPrefix}.knowledgeBaseSecret`]}
                    </Col>
                    <Col span={18}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('knowledgeBase', {
                          validateFirst: true,
                          initialValue: dataSource.knowledgeBase || '',
                        })(
                          <Input
                            autoComplete="off"
                            size="default"
                            style={{
                              width: '320px',
                            }}
                            maxLength={200}
                          />,
                        )}
                      </FormItem>
                    </Col>
                  </Row>

                  <Row>
                    <Col span={6}>
                      {SettingWechatStore.languages[`${intlPrefix}.robotSecret`]}
                    </Col>
                    <Col span={18}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('robot', {
                          validateFirst: true,
                          initialValue: dataSource.robot || '',
                        })(
                          <Input
                            autoComplete="off"
                            size="default"
                            style={{
                              width: '320px',
                            }}
                            maxLength={200}
                          />,
                        )}
                      </FormItem>
                    </Col>
                  </Row>
                </Form>
              </div>
              <div
                style={{
                  // position: 'fixed',
                  // bottom: '0',
                  // width: '100%',
                  // padding: '20px 0',
                  // background: '#fff',
                  marginTop:'30px'
                }}
              >
                <Button
                  onClick={this.handleSubmit_tabTwo}
                  style={{
                    background:'#2196F3 ',
                    border: '1px solid #2196F3',
                    color: '#fff'
                  }}
                >
                  {SettingWechatStore.languages.save}
                </Button>
                <Button
                  style={{
                    border: '1px solid #ACB3BF',
                    color: '#818999',
                    marginLeft:'12px'
                  }}
                >
                  {SettingWechatStore.languages[`cancle`]}
                </Button>
              </div>
            </TabPane>

            <TabPane disabled={dataSource.id? false:true}  tab={SettingWechatStore.languages[`${intlPrefix}.applicationManagement`]} key="3">
              <Form layout="vertical">
                <div style={{
                  width: 'calc(50% - 12px)',
                  display: 'inline-block',
                  verticalAlign: 'top',
                }}
                >
                  <span style={{
                    fontSize: '15px',
                    fontFamily: 'PingFangSC-Medium',
                    color: '#04173F',
                    paddingLeft: '7px',
                    borderLeft: '2px solid #2196F3 ',
                  }}
                  >
                    {SettingWechatStore.languages[`${intlPrefix}.scanningCode`]}
                  </span>

                  <Row style={{marginTop:'27px'}}>
                    <Col span={6}>
                      {SettingWechatStore.languages[`${intlPrefix}.agentId`]}
                    </Col>
                    <Col span={18}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('agentId', {
                          validateFirst: true,
                          initialValue: dataSource.agentId || '',
                        })(
                          <Input
                            autoComplete="off"
                            size="default"
                            style={{
                              width: '320px',
                            }}
                            maxLength={200}
                          />,
                        )}
                      </FormItem>
                    </Col>
                  </Row>

                  <Row>
                    <Col span={6}>
                      {SettingWechatStore.languages[`${intlPrefix}.applicationSecret`]}
                    </Col>
                    <Col span={18}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('applicationSecret', {
                          validateFirst: true,
                          initialValue: dataSource.applicationSecret || '',
                        })(
                          <Input
                            autoComplete="off"
                            size="default"
                            style={{
                              width: '320px',
                            }}
                            maxLength={200}
                          />,
                        )}
                      </FormItem>
                    </Col>
                  </Row>
                </div>
                <div
                  style={{
                    width: 'calc(50% - 12px)',
                    display: 'inline-block',
                    marginLeft: '20px'
                  }}
                >
                  <span style={{
                    fontSize: '15px',
                    fontFamily: 'PingFangSC-Medium',
                    color: '#04173F',
                    paddingLeft: '7px',
                    borderLeft: '2px solid #2196F3 ',
                  }}
                  >
                    {SettingWechatStore.languages[`${intlPrefix}.pushMessage`]}
                  </span>
                  <Row style={{marginTop:'27px'}}>
                    <Col span={6} className={this.props.form.getFieldsValue().applicationSecret_application?"is-required":''}>
                      {SettingWechatStore.languages[`${intlPrefix}.agentId`]}
                    </Col>
                    <Col span={18}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('agentId_application', {
                          rules: [{
                            required: this.props.form.getFieldsValue().applicationSecret_application?true:'',
                            message: this.props.form.getFieldsValue().applicationSecret_application?SettingWechatStore.languages[`${intlPrefix}.inputAgentId`]:'',
                          },
                            {
                              validator: this.checkMobilAgentIdApplication,
                            }],
                          validateTrigger: 'onBlur',
                          validateFirst: true,
                          initialValue: applicationData.agentId || '',
                        })(
                          <Input
                            autoComplete="off"
                            size="default"
                            style={{
                              width: '320px',
                            }}
                            maxLength={200}
                          />,
                        )}
                      </FormItem>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={6} className={this.props.form.getFieldsValue().agentId_application?"is-required":''}>
                      {SettingWechatStore.languages[`${intlPrefix}.applicationSecret`]}
                    </Col>
                    <Col span={18}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('applicationSecret_application', {
                          rules: [{
                            required: this.props.form.getFieldsValue().agentId_application?true:'',
                            message: this.props.form.getFieldsValue().agentId_application?SettingWechatStore.languages[`${intlPrefix}.inoutApplicationSecret`]:'',
                          },
                            {
                              validator: this.checkMobilApplicationSecretApplication,
                            },
                          ],
                          validateTrigger: 'onBlur',
                          validateFirst: true,
                          initialValue: applicationData.applicationSecret || '',
                        })(
                          <Input
                            autoComplete="off"
                            size="default"
                            style={{
                              width: '320px',
                            }}
                            maxLength={200}
                          />,
                        )}
                      </FormItem>
                    </Col>
                  </Row>
                </div>
              </Form>
              <div>
                <span
                  style={{
                    fontSize: '15px',
                    fontFamily: 'PingFangSC-Medium',
                    color: '#04173F',
                    paddingLeft: '7px',
                    borderLeft: '2px solid #2196F3 ',
                  }}
                >
                <span>{SettingWechatStore.languages[`${intlPrefix}.applicationManagement`]}</span>
                  <Tooltip title={SettingWechatStore.languages[`${intlPrefix}.newlyBuild`]}>
                    <Button
                      style={{
                        marginLeft: '8px' ,
                        height:'22px',
                        lineHeight: '22px'
                      }}
                      onClick={this.addApplication}
                    >
                      <Icon type="tianjia2" style={{ color: '#8C8C8C' }} />
                    </Button>
                  </Tooltip>
                </span>
                <div style={{marginTop:'14px'}}>
                  <Table
                    className="settingWechat_table"
                    filterBar={false}
                    dataSource={applicationNewArr}
                    columns={columns}
                  />
                </div>
              </div>

              <div
                style={{
                  // position: 'fixed',
                  // bottom: '0',
                  // width: '100%',
                  // padding: '20px 0',
                  // background: '#fff',
                  marginTop:'30px'
                }}
              >
                <Button
                  onClick={this.handleSubmit_tabThree}
                  style={{
                    background:'#2196F3 ',
                    border: '1px solid #2196F3',
                    color: '#fff'
                  }}
                >
                  {SettingWechatStore.languages.save}
                </Button>
                <Button
                  style={{
                    border: '1px solid #ACB3BF',
                    color: '#818999',
                    marginLeft:'12px'
                  }}
                >
                  {SettingWechatStore.languages[`cancle`]}
                </Button>
              </div>
            </TabPane>
          </Tabs>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(SettingLDAPHome)));
