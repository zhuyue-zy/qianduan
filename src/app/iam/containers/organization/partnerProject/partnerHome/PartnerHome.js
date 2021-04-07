import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content, Permission, Action } from 'yqcloud-front-boot';
import { Form, Button, Table, Tabs, Modal, Tooltip, Icon,
} from 'yqcloud-ui';
import PartnerStore from '../../../../stores/organization/partnerProject';
import EditPartner from '../editPartner';

const FormItem = Form.Item;
const intlPrefix = 'organization.management';
const { Sidebar } = Modal;

@inject('AppState')
@observer
class PartnerHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      dataSource: [],
      visible: false,
      edit: false,
      submitting: false,
      selectedData: '',
      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      sort: 'companyCode',
    };
  }

  componentWillMount() {
    const { AppState, edit, id } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    PartnerStore.queryComNature(organizationId)
      .then(() => {
        this.forceUpdate();
      });
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadCompany();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    PartnerStore.queryLanguage(id, AppState.currentLanguage);
  };

  /**
   * 加载组织列表
   * @param paginationIn 分页
   */
  loadCompany = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    PartnerStore.loadCompanys(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      PartnerStore.setCompanys(data);
      this.setState({
        dataSource: data.content,
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        filters,
        params,
        sort,
      });
    })
      .catch(error => Choerodon.handleResponseError(error));
  };

  /**
   * 弹层
   */
  showModal = () => {
    this.setState({
      visible: true,
      edit: false,
    });
  };

  // 编辑
  onEdit = (record) => {
    this.setState({
      visible: true,
      selectedData: record.companyId,
      edit: true,
    });
  };
  // 获取公司性质

  queryComNature = (values) => {
    const typeLists = PartnerStore.getCompanysNature;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  // 启用失效
  handleAble = (record) => {
    const { AppState, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const tenantId = menuType.id;
    const { iamOrganizationId } = record;
    const company = {
      companyId: record.companyId,
      isEnabled: record.isEnabled === 'Y' ? 'N' : 'Y',
      objectVersionNumber: record.objectVersionNumber,
    };
    if (record.isEnabled === 'Y') {
      PartnerStore.ableCompany(iamOrganizationId, company).then(({ failed, message }) => {
        if (failed) {
          Choerodon.prompt(message);
        } else {
          Choerodon.prompt(PartnerStore.languages[`${intlPrefix}.invalid.success`]);
          this.loadCompany();
        }
      }).catch((error) => {
        Choerodon.prompt(PartnerStore.languages[`${intlPrefix}.invalid.error`]);
      });
    } else {
      PartnerStore.ableCompany(iamOrganizationId, company).then(({ failed, message }) => {
        if (failed) {
          Choerodon.prompt(message);
        } else {
          Choerodon.prompt(PartnerStore.languages['enable.success']);
          this.loadCompany();
        }
      }).catch((error) => {
        Choerodon.prompt(PartnerStore.languages['enabled.error']);
      });
    }
  };

  renderSideTitle = () => {
    const { edit } = this.state;
    if (edit) {
      return PartnerStore.languages[`${intlPrefix}.edit.partnerProject`];
    } else {
      return PartnerStore.languages[`${intlPrefix}.new.partnerProject`];
    }
  };

  renderSidebar = () => {
    const { visible, selectedData, edit } = this.state;
    return (
      <EditPartner
        visible={visible}
        id={selectedData}
        edit={edit}
        onRef={(node) => {
          this.EditPartner = node;
        }}
        OnUnchangedSuccess={() => {
          this.setState({
            visible: false,
            submitting: false,
          });
        }}
        onSubmit={() => {
          this.setState({
            submitting: true,
          });
        }}
        onSuccess={() => {
          this.setState({
            visible: false,
            submitting: false,
          });
          this.loadCompany();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
        OnCloseModel={() => {
          this.setState({
            visible: false,
            selectedData: '',
          });
        }}
      />
    );
  };

  /**
   * 分页处理
   * @param pagination 分页
   */
   handlePageChange = (pagination, filters, { field, order }, params) => {
     const sorter = [];
     if (field) {
       sorter.push(field);
       if (order === 'descend') {
         sorter.push('desc');
       }
     }
     this.loadCompany(pagination, sorter.join(','), filters, params);
   };

   render() {
     const { intl, AppState } = this.props;
     const { submitting, visible, edit, dataSource, params, filters, sort, pagination } = this.state;

     const columns = [
       {
         title: PartnerStore.languages[`${intlPrefix}.company.name`],
         code: 'companyFullName',
         dataIndex: 'companyFullName',
         key: 'companyFullName',
         width: 280,
         filters: [],
         filteredValue: filters.companyFullName || [],
         render: (text, record) => <a onClick={this.onEdit.bind(this, record)}>{text}</a>,
       },
       {
         title: PartnerStore.languages[`${intlPrefix}.company.short.name`],
         dataIndex: 'companyShortName',
         key: 'companyShortName',
         filters: [],
         width: 120,
       },
       {
         title: PartnerStore.languages[`${intlPrefix}.company.code`],
         code: 'companyCode',
         dataIndex: 'companyCode',
         key: 'companyCode',
         width: 140,
         filters: [],
         filteredValue: filters.companyCode || [],
       },

       {
         title: PartnerStore.languages[`${intlPrefix}.company.type`],
         dataIndex: 'companyType',
         key: 'companyType',
         filters: [],
         width: 140,
         render: (text, record) => this.queryComNature(record.companyType),
       },

       {
         title: PartnerStore.languages[`${intlPrefix}.company.contacts`],
         dataIndex: 'contact',
         key: 'contact',
         filters: [],
         width: 140,
       },
       {
         title: PartnerStore.languages[`${intlPrefix}.phone`],
         dataIndex: 'phone',
         key: 'phone',
         filters: [],
         width: 140,
       },
       {
         title: PartnerStore.languages[`${intlPrefix}.company.address`],
         dataIndex: 'address',
         key: 'address',
         filters: [],
         width: 220,
         render: (text, record) => {
           if (record.address == null) {
             return '';
           } else {
             return (
               <Tooltip title={record.address}>
                 <span>{record.address.length > 14 ? `${record.address.slice(0, 13)}...` : record.address}</span>
               </Tooltip>
             );
           }
         }

         ,
       },
       {
         title: PartnerStore.languages[`${intlPrefix}.state`],
         code: 'isEnabled',
         dataIndex: 'isEnabled',
         key: 'isEnabled',
         width: 100,
         filters: [{
           text: PartnerStore.languages[`${intlPrefix}.state.y`],
           value: 'Y',
         }, {
           text: PartnerStore.languages[`${intlPrefix}.state.n`],
           value: 'N',
         }],
         onFilter: (value, record) => record.isEnabled.indexOf(value) === 0,
         render: (text, record) => (
           record.isEnabled === 'N'
             ? PartnerStore.languages[`${intlPrefix}.state.n`]
             : PartnerStore.languages[`${intlPrefix}.state.y`]
         ),
       },
       {
         title: PartnerStore.languages[`${intlPrefix}.creation.date`],
         code: 'creationDate',
         dataIndex: 'creationDate',
         key: 'creationDate',
         width: 200,
         filters: [],
       },
       {
         title: PartnerStore.languages[`${intlPrefix}.operation`],
         width: 100,
         fixed: 'right',
         render: (text, record) => (
           <div>
             <Tooltip
               title={PartnerStore.languages.edit}
               placement="bottom"
               overlayClassName={`${visible && 'ant-tooltip-hidden'}`}
             >
               <Button
                 size="small"
                 icon="bianji-"
                 shape="circle"
                 style={{ color: '#2196F3' }}
                 onClick={this.onEdit.bind(this, record)}
               />
             </Tooltip>
             {record.isEnabled === 'Y'
               ? (
                 <Tooltip
                   title={PartnerStore.languages.disableN}
                   placement="bottom"
                 >
                   <Button
                     size="small"
                     icon="jinyongzhuangtai"
                     shape="circle"
                     onClick={this.handleAble.bind(this, record)}
                   />
                 </Tooltip>
               )
               : (
                 <Tooltip
                   title={PartnerStore.languages.enableY}
                   placement="bottom"
                 >
                   <Button
                     size="small"
                     icon="yijieshu"
                     shape="circle"
                     style={{ color: '#2196F3' }}
                     onClick={this.handleAble.bind(this, record)}
                   />
                 </Tooltip>
               )}
           </div>
         ),
       },
     ];


     return (
       <Page>
         <Header title={PartnerStore.languages[`${intlPrefix}.partnerProject`]}>
           <Button
             onClick={() => this.showModal()}
             style={{ color: '#04173F' }}
           >
             <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
             {PartnerStore.languages[`${intlPrefix}.new.partnerProject`]}
           </Button>
         </Header>
         <Content>
           <Table
             size="middle"
             pagination={pagination}
             columns={columns}
             dataSource={dataSource}
             onChange={this.handlePageChange.bind(this)}
             loading={PartnerStore.isLoading}
             scroll={{ x: 1600 }}
           />

           {/* 值集编辑 */}
           <Sidebar
             title={this.renderSideTitle()}
             visible={visible}
             okText={PartnerStore.languages[edit ? 'save' : 'create']}
             cancelText={PartnerStore.languages.cancel}
             onOk={(e) => {
               this.EditPartner.handleSubmit(e);
             }}
             onCancel={(e) => {
               this.EditPartner.handleCancel(e);
             }}
             confirmLoading={submitting}
           >
             {
              this.renderSidebar()
            }
           </Sidebar>
         </Content>
       </Page>
     );
   }
}

export default Form.create({})(withRouter(injectIntl(PartnerHome)));
