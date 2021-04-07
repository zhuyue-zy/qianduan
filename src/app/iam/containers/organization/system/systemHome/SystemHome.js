import React, { Component } from 'react';
import { Button, Modal, Table, Tooltip, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission } from 'yqcloud-front-boot';
import EditSystem from '../editSystem';
import SystemStore from '../../../../stores/organization/system/SystemStore';

import './SystemHome.scss';

const { Sidebar } = Modal;
const intlPrefix = 'organization.system';

@inject('AppState')
@observer
class System extends Component {
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
      sort: 'systemName,desc',
      visible: false,
      selectedData: '',
      systemId: 0,
    };
  }

  componentWillMount() {
    this.fetch(this.props);
  }

  componentDidMount() {
    this.loadSystem();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    SystemStore.queryLanguage(id, AppState.currentLanguage);
  }


  handleRefresh = () => {
    this.setState(this.getInitState(),
      () => {
        this.loadSystem();
      });
  };

  onEdit = (id, systemId) => {
    this.setState({
      visible: true,
      edit: true,
      selectedData: id,
      systemId,
    });
  };

  fetch = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;

  }


  loadSystem = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    SystemStore.loadSystems(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      SystemStore.setSystems(data.content);
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

    this.loadSystem(pagination, sorter.join(','), filters, params);
  }

  renderSideTitle() {
    if (this.state.edit) {
      return SystemStore.languages[`${intlPrefix}.modify`];
    } else {
      return SystemStore.languages[`${intlPrefix}.create`];
    }
  }

  renderSideBar() {
    const { selectedData, edit, visible, systemId } = this.state;
    return (
      <EditSystem
        id={selectedData}
        systemId={systemId}
        visible={visible}
        edit={edit}
        onRef={(node) => {
          this.editSystem = node;
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
          this.loadSystem();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
      />
    );
  }


  render() {
    const { AppState, intl } = this.props;
    const { filters, pagination, visible, edit, submitting, params } = this.state;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
 
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
    if (SystemStore.getSystems) {
      data = SystemStore.systems.slice();

      data.forEach((element) => {
        if (element.system) {
          element.systemName = element.system.systemName;
        }
      });
    }
    const columns = [
      {
        title: SystemStore.languages[`${intlPrefix}.systemname`],
        dataIndex: 'systemName',
        key: 'systemName',
        filters: [],
        filteredValue: filters.systemName || [],
      }, {
        title: SystemStore.languages[`${intlPrefix}.systemdescription`],
        key: 'systemDescription',
        dataIndex: 'systemDescription',
        filters: [],
        filteredValue: filters.systemDescription || [],
      
      }, 

      {
        title: SystemStore.languages.publictime,
        key: 'creationDate',
        dataIndex: 'creationDate',
        filters: [],
        filteredValue: filters.creationDate || [],
      }, 
      {
        title: SystemStore.languages.operation,
        key: 'action',
        align: 'left',
        width: '130px',
        render: (text, record) => (
          <div>
            <Permission
                service={[
                  'yqcloud-itsm-service.application-system.updateSystem',
                ]}
              type={type}
              organizationId={organizationId}
            >
              <Tooltip
                title={SystemStore.languages.modify}
                placement="bottom"
              >
                <Button
                  size="small"
                  icon="bianji-"
                  shape="circle"
                  style={{ cursor: 'pointer', color: '#2196F3' }}
                  onClick={this.onEdit.bind(this, record.systemId, record.systemId ? record.systemId : 0)}
                />
              </Tooltip>
            </Permission>
          </div>
        ),
      }];


    return (
      <Page
        service={[
          'yqcloud-itsm-service.application-system.query',
          'yqcloud-itsm-service.application-system.pageQuery',
          'yqcloud-itsm-service.application-system.saveSystem',
          'yqcloud-itsm-service.application-system.updateSystem'
        ]}
      >
        <Header title={SystemStore.languages[`${intlPrefix}.header.title`]}>
          <Permission
            service={['yqcloud-itsm-service.application-system.saveSystem',
                      'yqcloud-itsm-service.application-system.updateSystem',]}
            type={type}
            organizationId={organizationId}
          >
            <Button
              onClick={this.openNewPage}
              style={{ color: '#04173F' }}

            >
              <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
              {SystemStore.languages[`${intlPrefix}.create`]}
            </Button>
          </Permission>
        </Header>
        <Content className='system-page'>
          <Table
            size="middle"
            pagination={pagination}
            columns={columns}
            dataSource={data}
            rowKey="id"
            onChange={this.handlePageChange.bind(this)}
            loading={SystemStore.isLoading}
            filters={params}
          />
          <Sidebar
            title={this.renderSideTitle()}
            visible={visible}
            okText={edit ? SystemStore.languages.save : SystemStore.languages.create}
            cancelText={SystemStore.languages.cancel}
            onOk={e => this.editSystem.handleSubmit(e)}
            onCancel={() => {
              this.setState({
                visible: false,
                selectedData: '',
                systemId: '',
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

export default withRouter(injectIntl(System));
