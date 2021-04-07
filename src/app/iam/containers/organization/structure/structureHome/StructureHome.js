import React, { Component } from 'react';
import { Button, Modal, Table, Tooltip, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, Permission } from 'yqcloud-front-boot';
import EditStructure from '../editStructure';
import StructureStore from '../../../../stores/organization/structure/StructureStore';

import './StructureHome.scss';

const { Sidebar } = Modal;
const intlPrefix = 'organization.structure';

@inject('AppState')
@observer
class Structure extends Component {
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
      sort: 'structureName,desc',
      visible: false,
      selectedData: '',
      structureId: 0,
    };
  }

  componentWillMount() {
    this.fetch(this.props);
  }

  componentDidMount() {
    this.loadStructure();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    StructureStore.queryLanguage(id, AppState.currentLanguage);
  }


  handleRefresh = () => {
    this.setState(this.getInitState(),
      () => {
        this.loadStructure();
      });
  };

  onEdit = (id, structureId) => {
    this.setState({
      visible: true,
      edit: true,
      selectedData: id,
      structureId,
    });
  };

  fetch = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    StructureStore.getIsEnabled(organizationId);
  }

  //启用快码
  enabledState = (values) => {
    const enabled = StructureStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  loadStructure = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    StructureStore.loadStructures(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
        StructureStore.setStructures(data.content);
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

    this.loadStructure(pagination, sorter.join(','), filters, params);
  }

  renderSideTitle() {
    if (this.state.edit) {
      return StructureStore.languages[`${intlPrefix}.modify`];
    } else {
      return StructureStore.languages[`${intlPrefix}.create`];
    }
  }

  renderSideBar() {
    const { selectedData, edit, visible, structureId } = this.state;
    return (
      <EditStructure
        id={selectedData}
        structureId={structureId}
        visible={visible}
        edit={edit}
        onRef={(node) => {
          this.editStructure = node;
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
          this.loadStructure();
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
    if (StructureStore.getStructures) {
      data = StructureStore.structures.slice();

      data.forEach((element) => {
        if (element.structure) {
          element.structureName = element.structure.structureName;
        }
      });
    }
    const columns = [
      {
        title: StructureStore.languages[`${intlPrefix}.structurename`],
        dataIndex: 'structureName',
        key: 'structureName',
        filters: [],
        filteredValue: filters.structureName || [],
      }, {
        title: StructureStore.languages[`${intlPrefix}.structuredescription`],
        key: 'structureDescription',
        dataIndex: 'structureDescription',
        filters: [],
        filteredValue: filters.structureDescription || [],
      
      }, 

      {
        title: StructureStore.languages.publictime,
        key: 'creationDate',
        dataIndex: 'creationDate',
        filters: [],
        filteredValue: filters.creationDate || [],
      }, 
      {
        title: StructureStore.languages[`${intlPrefix}.enabled`],
        key: 'isEnabled',
        dataIndex: 'isEnabled',
        filters: [
          {
            text: StructureStore.languages.enable,
            value: 'Y',
          }, {
            text: StructureStore.languages.disable,
            value: 'N',
          },
        ],
        filteredValue: filters.enabled || [],
        render: (values, record) => this.enabledState(record.isEnabled),
      },
      {
        title: StructureStore.languages.operation,
        key: 'action',
        align: 'left',
        width: '130px',
        render: (text, record) => (
          <div>
            <Permission
                service={[
                  'yqcloud-itsm-service.application-system.updateStructure',
                ]}
              type={type}
              organizationId={organizationId}
            >
              <Tooltip
                title={StructureStore.languages.modify}
                placement="bottom"
              >
                <Button
                  size="small"
                  icon="bianji-"
                  shape="circle"
                  style={{ cursor: 'pointer', color: '#2196F3' }}
                  onClick={this.onEdit.bind(this, record.structureId, record.structureId ? record.structureId : 0)}
                />
              </Tooltip>
            </Permission>
          </div>
        ),
      }];


    return (
      <Page
        service={[
          'yqcloud-itsm-service.application-system.queryStructure',
          'yqcloud-itsm-service.application-system.pageQueryStructure',
          'yqcloud-itsm-service.application-system.saveStructure',
          'yqcloud-itsm-service.application-system.updateStructure',
          //'yqcloud-itsm-service.application-system.disableStructure',
          //'yqcloud-itsm-service.application-system.enableStructure'
        ]}
      >
        <Header title={StructureStore.languages[`${intlPrefix}.header.title`]}>
          <Permission
            service={['yqcloud-itsm-service.application-system.saveStructure',
                      'yqcloud-itsm-service.application-system.updateStructure',]}
            type={type}
            organizationId={organizationId}
          >
            <Button
              onClick={this.openNewPage}
              style={{ color: '#04173F' }}

            >
              <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
              {StructureStore.languages[`${intlPrefix}.create`]}
            </Button>
          </Permission>
        </Header>
        <Content className='structure-page'>
          <Table
            size="middle"
            pagination={pagination}
            columns={columns}
            dataSource={data}
            rowKey="id"
            onChange={this.handlePageChange.bind(this)}
            loading={StructureStore.isLoading}
            filters={params}
          />
          <Sidebar
            title={this.renderSideTitle()}
            visible={visible}
            okText={edit ? StructureStore.languages.save : StructureStore.languages.create}
            cancelText={StructureStore.languages.cancel}
            onOk={e => this.editStructure.handleSubmit(e)}
            onCancel={() => {
              this.setState({
                visible: false,
                selectedData: '',
                structureId: '',
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

export default withRouter(injectIntl(Structure));
