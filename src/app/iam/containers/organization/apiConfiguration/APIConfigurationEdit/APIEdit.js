/** 2019/5/24
*作者:高梦龙
*项目： 分配API权限
*/

import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Form, Input, Table, Button, Modal, message, Row, Col, Tabs, Tooltip, Icon } from 'yqcloud-ui';
import { Content } from 'yqcloud-front-boot';
import ApiConfigurationStore from '../../../../stores/organization/apiConfiguration/ApiConfigurationStore';

const FormItem = Form.Item;
const intlPrefix = 'organization.apiConfiguration';
const { TabPane } = Tabs;
function noop() {
}
@inject('AppState')
@observer
class APIEdit extends React.Component {
  state = this.getInitState();

  getInitState() {
    return {
      visible: false,
      showModal: false,
      sort: '',
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      paginations: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      filters: {},
      dataSource: [], // 子表数据
      funSource: [], // 子表弹出框数据
      accessInfo: [], // 获取后台数据表
    };
  }

  componentDidMount() {
    const { onRef } = this.props;
    onRef(this);
    this.loadLanguage();
  }

  componentWillMount() {
    this.props.onRef(this);
    this.fetch(this.props);
    const { AppState, records } = this.props;// props从父组件传值
    const { organizationId } = AppState.currentMenuType;
    this.getAccessKey(organizationId, records.clientId);
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.visible) {
      nextProps.form.resetFields();
      this.setState(this.getInitState());
    } else if (!this.props.visible) {
      this.fetch(nextProps);
    }
  }

  fetch(props) {
    const { AppState, records } = props;// props从父组件传值
    const { organizationId } = AppState.currentMenuType;
    this.getAccessKey(organizationId, records.clientId);
  }

  getAccessKey=(organizationId, id, paginationIn, sortIn, filtersIn, paramsIn) => {
    const { paginations: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    ApiConfigurationStore.getAccessMessage(
      organizationId,
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      this.setState({
        pagination: {
          current: (data.number || 0) + 1,
          pageSize: data.size || 25,
          total: data.totalElements || '',
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        filters,
        params,
        sort,
        accessInfo: data.content,
      });
    });
  }

  getAccessList=(paginationIn, sortIn, filtersIn, paramsIn) => {
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    const { records } = this.props;
    const openApiTokenId = records.id;
    ApiConfigurationStore.loadFunction(
      openApiTokenId,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      this.setState({
        pagination: {
          current: (data.number || 0) + 1,
          pageSize: data.size || 25,
          total: data.totalElements || '',
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        filters,
        params,
        sort,
        funSource: data.content,
      });
    });
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    ApiConfigurationStore.queryLanguage(id, AppState.currentLanguage);
  };


  handleCancel = (e) => {
    const { OnCloseModel, intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        OnCloseModel();
      } else {
        Modal.confirm({
          title: ApiConfigurationStore.languages['form.cancel.title'],
          content: ApiConfigurationStore.languages['form.cancel.content'],
          okText: ApiConfigurationStore.languages.ok,
          cancelText: ApiConfigurationStore.languages.cancle,
          onOk: () => (
            OnCloseModel()
          ),
        });
      }
    });
  }

  showModal=() => {
    this.setState({
      showModal: true,
    });
    this.getAccessList();
  }

  cancelModal=() => {
    this.setState({
      showModal: false,
      selectedRowKeys: [],
    });
  }

  addAccess=() => {
    const { selectedCodeValues, accessInfo } = this.state;
    const dataValue = [];
    if (accessInfo.length > 0) {
      selectedCodeValues.forEach((data) => {
        dataValue.push(Object.assign({}, data, { apiCode: data.code }, { deleteType: 'create' }));
      });
      const codes = accessInfo.concat(dataValue);
      this.setState({
        dataSource: codes,
        showModal: false,
        selectedRowKeys: [],
      });
    } else {
      selectedCodeValues.forEach((data) => {
        dataValue.push(Object.assign({}, data, { apiCode: data.code }, { deleteType: 'create' }));
      });
      this.setState({
        dataSource: dataValue,
        showModal: false,
        selectedRowKeys: [],
      });
    }
  }


  handlePageChange(pagination, filters, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.getAccessList(pagination, sorter.join(','), filters, params);
  }

  handlePageChanges(pagination, filters, { field, order }, params) {
    const sorter = [];
    const { AppState, records } = this.props;// props从父组件传值
    const { organizationId } = AppState.currentMenuType;
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.getAccessKey(organizationId, records.clientId, pagination, sorter.join(','), filters, params);
  }


  // 保存权限api
  handleSubmit=() => {
    const { AppState, records } = this.props;
    const { onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
    const { id } = AppState.currentMenuType;
    const { dataSource } = this.state;
    this.props.form.validateFieldsAndScroll((err, data) => {
      const openId = { openApiTokenId: records.id };
      const temp = [];
      dataSource.forEach((data) => {
        temp.push(Object.assign({}, data, openId));
      });
      records.openApiPermissionList = temp;
      records.description = data.description;
      ApiConfigurationStore.saveAPI(id, records).then(({ failed, message }) => {
        if (failed) {
          onError();
        } else {
          onSuccess();
          Choerodon.prompt(ApiConfigurationStore.languages['save.success']);
        }
      }).catch((error) => {
        Choerodon.handleResponseError(error);
      });
    });
  }

   deleteApi=(record) => {
     const { AppState, records } = this.props;
     const { id } = AppState.currentMenuType;
     const { dataSource } = this.state;
     if (record.deleteType === 'create') {
       for (let i = dataSource.length - 1; i >= 0; i -= 1) {
         if (record.code === dataSource[i].code) {
           dataSource.splice(i, 1);
         }
         this.setState({
           dataSource,
         });
       }
     } else {
       ApiConfigurationStore.deleteAPI(id, record).then((data) => {
         if (data) {
           this.getAccessKey(id, records.clientId);
           Choerodon.prompt(ApiConfigurationStore.languages['delete.success']);
         }
       }).catch((error) => {
         Choerodon.handleResponseError(error);
       });
     }
   }


   render() {
     const { AppState: { menuType: { organizationId } }, records } = this.props;
     const { getFieldDecorator } = this.props.form;
     const { accessInfo, dataSource, showModal, funSource, pagination, paginations } = this.state;
     const rowSelection = {
       //  选择记录后，将选中的记录加入selectedCodeValue状态中
       onChange: (selectedRowKeys, selectedCodeValues) => {
         this.setState({ selectedCodeValues, selectedRowKeys });
       },
       selectedRowKeys: this.state.selectedRowKeys,
     };
     const functionColums = [
       {
         title: ApiConfigurationStore.languages[`${intlPrefix}.service`],
         dataIndex: 'serviceName',
         key: 'serviceName',
         filters: [],
       },
       {
         title: ApiConfigurationStore.languages[`${intlPrefix}.code`],
         dataIndex: 'apiCode',
         key: 'apiCode',
         filters: [],
       },
       {
         title: ApiConfigurationStore.languages[`${intlPrefix}.description`],
         dataIndex: 'description',
         key: 'description',
         filters: [],
       },
       {
         title: ApiConfigurationStore.languages.operation,
         key: 'action',
         render: (text, record) => (
           <div>
             <Tooltip placement="bottom" title={ApiConfigurationStore.languages.delete}>
               <Button
                 key="delete"
                 icon="shanchu-icon"
                 style={{ cursor: 'pointer' }}
                 size="small"
                 onClick={this.deleteApi.bind(this, record)}
               />
             </Tooltip>
           </div>
         ),
       },
     ];

     const colums = [
       {
         title: ApiConfigurationStore.languages[`${intlPrefix}.service`],
         dataIndex: 'serviceName',
         key: 'serviceName',
         filters: [],
       },
       {
         title: ApiConfigurationStore.languages[`${intlPrefix}.code`],
         dataIndex: 'code',
         key: 'code',
         filters: [],
       },
       {
         title: ApiConfigurationStore.languages[`${intlPrefix}.description`],
         dataIndex: 'description',
         key: 'description',
         filters: [],
       },
     ];


     return (
       <Content className="sidebar-content">
         <Form layout="vertical">
           <Row>
             <Col span={12}>
               <FormItem
                 style={{ display: 'inline-block', width: 412 }}
               >
                 <span className="formEncoding" style={{display: 'inline-block',width: '75px'}}>{ApiConfigurationStore.languages[`${intlPrefix}.AccessKeyID`]}</span>
                 {getFieldDecorator('clientId', {
                   initialValue: records.clientId || '',
                 })(
                   <Input
                     autoComplete="off"
                     style={{ width: 300, marginLeft: 30 }}
                     disabled
                   />,
                 )}
               </FormItem>
             </Col>
             <Col span={12}>
               <FormItem
                 style={{ display: 'inline-block' }}
               >
                 <span className="formEncoding">{ApiConfigurationStore.languages[`${intlPrefix}.AccessKeySecret`]}</span>
                 {getFieldDecorator('secret', {
                   initialValue: records.secret || '',
                 })(
                   <Input
                     autoComplete="off"
                     style={{ width: 300, marginLeft: 30 }}
                     disabled
                   />,
                 )}
               </FormItem>
             </Col>
           </Row>
           <Row>
             <Col span={12}>
               <FormItem
                 style={{ display: 'inline-block', width: 412 }}
               >
                 <span className="formEncoding" style={{display: 'inline-block',width: '75px'}}>{ApiConfigurationStore.languages[`${intlPrefix}.description`]}</span>
                 {getFieldDecorator('description', {
                   initialValue: records.description || '',
                 })(
                   <Input
                     autoComplete="off"
                     style={{ width: 300, marginLeft: 30 }}
                     maxLength={30}
                   />,
                 )}
               </FormItem>
             </Col>
           </Row>
         </Form>
         <Tabs defaultActiveKey="1">
           <TabPane tab={ApiConfigurationStore.languages[`${intlPrefix}.function.permission`]} key="1">
             <div>
               <Button
                 style={{ marginBottom: 4, color: '#000000' }}
                 type="primary"
                 onClick={this.showModal}
               >
                 <Icon type="xinjian" style={{ color: '#2196F3', width: 15 }} />
                 {ApiConfigurationStore.languages.add}
               </Button>
             </div>
             <Table
               columns={functionColums}
               dataSource={dataSource.length > 0 ? dataSource : accessInfo}
               onChange={this.handlePageChanges.bind(this)}
               pagination={paginations}
             />
           </TabPane>
         </Tabs>
         <Modal
           title={ApiConfigurationStore.languages[`${intlPrefix}.function.permission`]}
           visible={showModal}
           className="api-content"
           onCancel={this.cancelModal}
           footer={[
             <Button
               onClick={this.addAccess}
               style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
               type="primary"
               funcType="raised"
             >
               {ApiConfigurationStore.languages.ok}
             </Button>,
             <Button
               onClick={this.cancelModal}
               style={{ marginRight: '15px' }}
               funcType="raised"
             >
               {ApiConfigurationStore.languages.cancel}
             </Button>,
           ]}
         >
           <Table
             columns={colums}
             dataSource={funSource}
             onChange={this.handlePageChange.bind(this)}
             loading={ApiConfigurationStore.isLoading}
             pagination={pagination}
             rowSelection={rowSelection}
           />
         </Modal>

       </Content>
     );
   }
}
export default Form.create({})(withRouter(injectIntl(APIEdit)));
