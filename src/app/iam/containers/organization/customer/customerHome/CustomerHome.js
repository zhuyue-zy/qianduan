import React, { Component } from 'react';
import { Button, Modal, Table, Tooltip, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission } from 'yqcloud-front-boot';
import EditCustomer from '../editCustomer';
import CustomerStore from '../../../../stores/organization/customer/CustomerStore';
import CreateCustomerStore from '../../../../stores/organization/customer/createCustomer/CreateCustomerStore';
import './CustomerHome.scss';


const { Sidebar } = Modal;
const intlPrefix = 'organization.customer';

@inject('AppState')
@observer
class Customer extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitState();
    this.loadLanguage();
  }

  getInitState() {
    return {
      submitting: false,
      open: false,
      edit: false,
      id: '',
      page: 0,
      isLoading: true,
      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: [25, 50, 100, 200],
      },
      sort: 'customerName,desc',
      visible: false,
      selectedData: '',
      customerId: 0,
    };
  }

  componentWillMount() {
    this.fetch(this.props);
  }

  componentDidMount() {
    this.loadCustomer();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CustomerStore.queryLanguage(id, AppState.currentLanguage);
  }


  handleRefresh = () => {
    this.setState(this.getInitState(),
      () => {
        this.loadCustomer();
      });
  };

  onEdit = (id, customerId) => {
    this.setState({
      visible: true,
      edit: true,
      selectedData: id,
      customerId,
    });
  };

  fetch = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    CreateCustomerStore.queryScaleList(organizationId);
    CreateCustomerStore.queryCityList(organizationId);
   // CustomerStore.getIsCityMeaning(organizationId);
  }

  loadCustomer = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    CustomerStore.loadCustomers(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
        CustomerStore.setCustomers(data.content);
      this.setState({
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
          pageSizeOptions: [25, 50, 100, 200],
        },
        filters,
        params,
        sort,
      });
    })
      .catch(error => Choerodon.handleResponseError(error));
  };

  openNewPage = () => {
    this.setState({
      visible: true,
      edit: false,
    });
  };

  

  handlePageChange(pagination, filters, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }

    this.loadCustomer(pagination, sorter.join(','), filters, params);
  }

  renderSideTitle() {
    if (this.state.edit) {
      return CustomerStore.languages[`${intlPrefix}.modify`];
    } else {
      return CustomerStore.languages[`${intlPrefix}.create`];
    }
  }

  renderSideBar() {
    const { selectedData, edit, visible, customerId } = this.state;
    return (
      <EditCustomer
        id={selectedData}
        customerId={customerId}
        visible={visible}
        edit={edit}
        onRef={(node) => {
          this.EditCustomer = node;
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
          this.loadCustomer();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
      />
    );
  }
  selectCityList = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const cityLists = CreateCustomerStore.getCityList;
    const temp_Cit = cityLists.filter(v => (v.lookupValue === values));
    if (temp_Cit.length > 0) {
      return temp_Cit[0].lookupMeaning;
    } else {
      return values;
    }
  };
  render() {
    const { AppState, intl } = this.props;
    const { filters, pagination, visible, edit, submitting, params } = this.state;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    //const enable = structureStore.getEnabled;
    //const orgname = menuType.name;
    let type;
    if (AppState.getType) {
      type = AppState.getType;
    } else if (sessionStorage.type) {
      type = sessionStorage.type;
    } else {
      type = menuType.type;
    }
    let data = [];
    if (CustomerStore.getCustomers) {
      data = CustomerStore.customers.slice();

      data.forEach((element) => {
        if (element.Customer) {
          element.customerName = element.Customer.customerName;
        }
      });
    }
    const columns = [
      {
        title: CustomerStore.languages[`${intlPrefix}.customername`],
        dataIndex: 'customerName',
        key: 'customerName',
        filters: [],
        filteredValue: filters.customerName || [],
      }, {
        title: CustomerStore.languages[`${intlPrefix}.customercode`],
        key: 'customerCode',
        dataIndex: 'customerCode',
        filters: [],
        filteredValue: filters.customerCode || [],
      
      },  {
        title: CustomerStore.languages[`${intlPrefix}.city`],
        key: 'city',
        dataIndex: 'city',
        filters: [],
        filteredValue: filters.city || [],
        render: (text, record) => this.selectCityList(record.city),
      },
      {
        title: CustomerStore.languages[`${intlPrefix}.contactphone`],
        dataIndex: 'contactPhone',
        key: 'contactPhone',
        filters: [],
        filteredValue: filters.contactPhone || [],
      },
      {
        title: CustomerStore.languages.operation,
        key: 'action',
        align: 'left',
        width: '130px',
        render: (text, record) => (
          <div>
            <Permission
                service={[
                  'yqcloud-itsm-service.customer.updateCustomer',
                ]}
              type={type}
              organizationId={organizationId}
            >
              <Tooltip
                title={CustomerStore.languages.modify}
                placement="bottom"
              >
                <Button
                  size="small"
                  icon="bianji-"
                  shape="circle"
                  style={{ cursor: 'pointer', color: '#2196F3' }}
                  onClick={this.onEdit.bind(this, record.customerId, record.customerId ? record.customerId : 0)}
                />
              </Tooltip>
            </Permission>
          </div>
        ),
      }];


    return (
      <Page
        service={[
          'yqcloud-itsm-service.customer.query',
          'yqcloud-itsm-service.customer.queryCustomerPage',
          'yqcloud-itsm-service.customer.insertCustomer',
          'yqcloud-itsm-service.customer.updateCustomer',
          //'yqcloud-itsm-service.application-system.disableStructure',
          //'yqcloud-itsm-service.application-system.enableStructure'
        ]}
      >
        <Header title={CustomerStore.languages[`${intlPrefix}.header.title`]}>
          <Permission
            service={['yqcloud-itsm-service.customer.insertCustomer',
                      'yqcloud-itsm-service.customer.updateCustomer',]}
            type={type}
            organizationId={organizationId}
          >
            <Button
              onClick={this.openNewPage}
              style={{ color: '#04173F' }}

            >
              <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
              {CustomerStore.languages[`${intlPrefix}.create`]}
            </Button>
          </Permission>
        </Header>
        <Content className='customer-page'>
          <Table
            size="middle"
            pagination={pagination}
            columns={columns}
            dataSource={data}
            rowKey="id"
            onChange={this.handlePageChange.bind(this)}
            loading={CustomerStore.isLoading}
            filters={params}
          />
          <Sidebar
            title={this.renderSideTitle()}
            visible={visible}
            okText={edit ? CustomerStore.languages.save : CustomerStore.languages.create}
            cancelText={CustomerStore.languages.cancel}
            onOk={e => this.EditCustomer.handleSubmit(e)}
            onCancel={() => {
              this.setState({
                visible: false,
                selectedData: '',
                customerId: '',
              });
            }}
            destroyOnClose={true}
            confirmLoading={submitting}
          >
            {
              this.renderSideBar()
            }
          </Sidebar>
        </Content>
      </Page>
    );
  }
}

export default withRouter(injectIntl(Customer));
