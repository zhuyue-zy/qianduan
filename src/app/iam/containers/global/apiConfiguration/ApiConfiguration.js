import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content } from 'yqcloud-front-boot';
import { message, Button, Table, Modal, Tooltip, Icon } from 'yqcloud-ui';
import ApiConfigurationStore from '../../../stores/globalStores/apiConfiguration/ApiConfigurationStore';
import './ApiStyle.scss';

const intlPrefix = 'organization.apiConfiguration';

@inject('AppState')
@observer
class ApiConfiguration extends React.Component {
  state = this.getInitState();

  getInitState() {
    return {
      dataSource: [],
      dataCreate: [],
      dataView: [],
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
      params: [],
      filters: {},
      filterCode: {},
      createVisible: false,
      viewVisible: false,
      disabledVisible: false,
      selectedRowKeys: [],
      selectedCodeValues: [],
      sort: '',
      id: '',
    };
  }

  componentWillMount() {
    this.fetch(this.props);
  }

  componentDidMount() {
    this.loadLanguage();
    this.loadApiConfiguration();
  }

  fetch() {
    ApiConfigurationStore.getIsEnabled();
  }

  loadLanguage=() => {
    const { AppState } = this.props;
    ApiConfigurationStore.queryLanguage(0, AppState.currentLanguage);
  }

  // 查询首页api
  loadApiConfiguration=(paginationIn, sortIn, filtersIn, paramsIn) => {

    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    ApiConfigurationStore.loadAPI(
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
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
    }).catch(error => Choerodon.handleResponseError(error));
  }

  // 查询未创建的api
  loadNoCreateApi=(paginationIn, sortIn, filtersIn, paramsIn) => {
    const { paginations: paginationState, sort: sortState, filterCode: filtersState, params: paramsState } = this.state;
    const paginations = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filterCode = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    ApiConfigurationStore.loadNoCreate(
      paginations,
      sort,
      filterCode,
      params,
    ).then((data) => {
      this.setState({
        dataCreate: data.content,
        paginations: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        filterCode,
        params,
        sort,
      }).catch(error => Choerodon.handleResponseError(error));
    });
  }

  viewAccessKey =(id) => {
    ApiConfigurationStore.getAPIMessage(id).then((data) => {
      this.setState({
        dataView: data,
      });
    });
  }


  enabledState = (values) => {
    const enabled = ApiConfigurationStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
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
    this.loadApiConfiguration(pagination, sorter.join(','), filters, params);
  }

  handlePageChanges(pagination, filterCode, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadNoCreateApi(pagination, sorter.join(','), filterCode, params);
  }

  showApiModal = () => {
    this.setState({
      createVisible: true,
    });
    this.loadNoCreateApi();
  };

 cancleApiModal =() => {
   this.setState({
     createVisible: false,
     selectedRowKeys: [],
   });
 }

  showModal =(id) => {
    this.setState({
      viewVisible: true,
    });
    this.viewAccessKey(id);
  }

  cancleModal=() => {
    this.setState({
      viewVisible: false,
    });
  }

  // 创建api租户
  createTenant=() => {
    const { selectedCodeValues, selectedRowKeys } = this.state;
    if (selectedRowKeys.length > 0) {
      const organizationId = selectedCodeValues[0].id;
      ApiConfigurationStore.createApi(Object.assign({}, { organizationId,
      })).then(({ code, failed, message }) => {
        if (failed) {
          //
        } else {
          Choerodon.prompt(ApiConfigurationStore.languages['create.success']);
          this.setState({
            createVisible: false,
            selectedRowKeys: [],
          });
          this.loadApiConfiguration();
        }
      }).catch(error => Choerodon.handleResponseError(error));
    } else {
      Choerodon.prompt(ApiConfigurationStore.languages[`${intlPrefix}.lastMessage`]);
    }
  }

  // 失效租户
   disabledTenant=(record) => {
     Modal.warning({
       title: ApiConfigurationStore.languages[`${intlPrefix}.disabledMessage.system`],
       okText: ApiConfigurationStore.languages.ok,
       okCancel: ApiConfigurationStore.languages.cancel,
       className: 'api-content',
       okType: 'primary',
       onOk: () => {


       },
       onCancel() {},
     });
   }

   disabledTenant=(record) => {
     this.setState({
       id: record.openApiId,
       disabledVisible: true,
     });
   }

   disableOk=() => {
     const { id } = this.state;
     ApiConfigurationStore.disableAPI(id)
       .then((data) => {
         this.setState({
           disabledVisible: false,
         });
         Choerodon.prompt(ApiConfigurationStore.languages['disable.success']);
         this.loadApiConfiguration();
       }).catch(error => Choerodon.handleResponseError(error));
   }

  cancelModal=() => {
    this.setState({
      disabledVisible: false,
    });
  }


  render() {
    const { pagination, createVisible, viewVisible, dataSource, dataCreate, paginations, dataView, disabledVisible } = this.state;
    const enabled = ApiConfigurationStore.getEnabled;
    const apiColumns = [
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.tenantCode`],
        dataIndex: 'code',
        key: 'code',
        filters: [],
      },
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.tenantName`],
        dataIndex: 'name',
        key: 'name',
        filters: [],
      },
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.AccessKeyID`],
        dataIndex: 'AccessKeyID',
        key: 'AccessKeyID',
        render: (text, record) => (
          <span style={{ color: '#2196F3', cursor: 'pointer' }} onClick={this.showModal.bind(this, record.organizationId)}>{ApiConfigurationStore.languages.see}</span>
        ),
      },

      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.createTime`],
        dataIndex: 'creationDate',
        key: 'creationDate',
      },

      {
        title: ApiConfigurationStore.languages.status,
        dataIndex: 'enabled',
        key: 'enabled',
        filters: [{
          text: ApiConfigurationStore.languages.enable,
          value: 'true',
        }, {
          text: ApiConfigurationStore.languages.disable,
          value: 'false',
        }],
        sorter: true,
        render: (values, record) => this.enabledState(record.enabled),
      },

      {
        title: ApiConfigurationStore.languages.operation,
        key: 'action',
        render: (operation, record) => {
          const style = {
            cursor: 'pointer',
          };
          return (
            <div>
              {
                record.enabled ? (
                  <Tooltip placement="bottom" title={ApiConfigurationStore.languages.disable}>
                    <Button
                      key="enable"
                      icon="jinyongzhuangtai"
                      style={style}
                      size="small"
                      shape="circle"
                      onClick={this.disabledTenant.bind(this, record)}
                    />
                  </Tooltip>
                )
                  : (
                    <Tooltip placement="bottom" title={ApiConfigurationStore.languages.enable}>
                      <Button
                        key="disable"
                        size="small"
                        shape="circle"
                        icon="yijieshu"
                        style={{ cursor: 'pointer', color: '#2196F3' }}
                        onClick={() => {
                          ApiConfigurationStore.enableAPI(record.openApiId)
                            .then(() => { Choerodon.prompt(ApiConfigurationStore.languages['enable.success']); this.loadApiConfiguration(); });
                        }}
                      />
                    </Tooltip>
                  )
              }
            </div>);
        },
      },

    ];

    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '120px',
      wordBreak: 'normal',
    };
    const newColumns = [
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.tenantCode`],
        dataIndex: 'code',
        key: 'code',
        filters: [],
        width: 150,
      },
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.tenantName`],
        dataIndex: 'name',
        key: 'name',
        filters: [],
        width: 150,
      },
    ];

    const veiwColumns = [
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.AccessKeyID`],
        dataIndex: 'clientId',
        key: 'clientId',
        width: 200,
      },
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.AccessKeySecret`],
        dataIndex: 'secret',
        key: 'secret',
        filters: [],
        width: 320,
      },
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.description`],
        dataIndex: 'description',
        key: 'description',
        width: 250,
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={20}>
              {`${record.description}` === 'null' ? '' : `${record.description}` }
            </Tooltip>
          </span>
        ),
      },
      {
        title: ApiConfigurationStore.languages.status,
        dataIndex: 'enabled',
        key: 'enabled',
        width: 80,
        render: (values, record) => this.enabledState(record.enabled),
      },
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.createTime`],
        dataIndex: 'creationDate',
        key: 'creationDate',
        width: 180,
      },

    ];


    const rowSelection = {
      type: 'radio',
      //  选择记录后，将选中的记录加入selectedCodeValue状态中
      onChange: (selectedRowKeys, selectedCodeValues) => {
        this.setState({ selectedCodeValues, selectedRowKeys });
      },
      selectedRowKeys: this.state.selectedRowKeys,
    };

    return (
      <Page>
        <Header title={ApiConfigurationStore.languages[`${intlPrefix}.apiAuthority.allocation`]}>
          <Button
            onClick={() => this.showApiModal()}
            style={{ color: '#000000' }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {ApiConfigurationStore.languages[`${intlPrefix}.new.tenant`]}
          </Button>
        </Header>
        <Content>
          <div style={{ color: '#FF9933', fontSize: 14, background: 'beige', marginBottom: 10 }}>{ApiConfigurationStore.languages[`${intlPrefix}.note`]}</div>
          <Table
            columns={apiColumns}
            pagination={pagination}
            dataSource={dataSource}
            onChange={this.handlePageChange.bind(this)}
            loading={ApiConfigurationStore.isLoading}
          />
        </Content>
        <Modal
          title={ApiConfigurationStore.languages[`${intlPrefix}.tenantList`]}
          visible={createVisible}
          onCancel={this.cancleApiModal}
          className="api-content"
          destroyOnClose
          footer={[
            <Button
              onClick={this.createTenant}
              style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
              type="primary"
              funcType="raised"
              // loading={loading}
            >
              {ApiConfigurationStore.languages.ok}
            </Button>,
            <Button
              onClick={this.cancleApiModal}
              funcType="raised"
              style={{ marginRight: '15px' }}
            >
              {ApiConfigurationStore.languages.cancel}
            </Button>,
          ]}
        >
          <Table
            columns={newColumns}
            dataSource={dataCreate}
            style={{ margin: 20 }}
            rowSelection={rowSelection}
            pagination={paginations}
            onChange={this.handlePageChanges.bind(this)}
            loading={ApiConfigurationStore.isLoading}
            scroll={{ y: 200 }}
          />
        </Modal>
        <Modal
          title={ApiConfigurationStore.languages[`${intlPrefix}.tenantList`]}
          visible={viewVisible}
          pagination={pagination}
          onCancel={this.cancleModal}
          className="view-content"
          width="77%"
          footer={[
            <Button
              onClick={this.cancleModal}
              funcType="raised"
              style={{ marginRight: 15 }}
            >
              {ApiConfigurationStore.languages.cancel}
            </Button>,
          ]}
          center
        >
          <Table
            style={{ margin: 20 }}
            columns={veiwColumns}
            dataSource={dataView}
            filterBar={false}
            scroll={{ y: 200 }}
            pagination={false}
          />
        </Modal>
        <Modal
          title={ApiConfigurationStore.languages[`${intlPrefix}.caveat`]}
          className="api-content"
          visible={disabledVisible}
          onCancel={this.cancelModal}
          footer={[
            <Button
              onClick={this.disableOk}
              style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
              type="primary"
              funcType="raised"
              onC
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
          <p style={{ fontSize: 14, margin: 20 }}><Icon type="shurutixing" style={{ color: '#f37f0b', marginRight: 5 }} />{ApiConfigurationStore.languages[`${intlPrefix}.disabledMessage.system`]}</p>
        </Modal>
      </Page>
    );
  }
}

export default withRouter(injectIntl(ApiConfiguration));
