/**
 * Created by Nanjiangqi on 2018-9-26 0026.
 */
import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content, Permission, Action } from 'yqcloud-front-boot';
import {
  Row, Col, Form, Card, Button, Table, Tabs, Modal, Tooltip, Icon,
} from 'yqcloud-ui';
import CompanyStore from '../../../../stores/organization/companyManagement';
import './index.scss';
import EditCompany from '../editCompany';

const intlPrefix = 'organization.management';
const { TabPane } = Tabs;
const { Sidebar } = Modal;

@inject('AppState')
@observer
class CompanyHome extends Component {
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
    this.fetch(this.props);
  }

  componentDidMount() {
    this.loadCompanys();
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CompanyStore.queryLanguage(id, AppState.currentLanguage);
  };

  /**
   * 加载组织列表
   * @param paginationIn 分页
   */
  loadCompanys = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    CompanyStore.loadCompanys(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      CompanyStore.setCompanys(data.content);
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

  fetch=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    CompanyStore.getIsEnabled(organizationId);
  }

  // 生效快码
  enabledState = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const enabled = CompanyStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

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
      CompanyStore.ableCompany(iamOrganizationId, company).then(({ failed, message }) => {
        if (failed) {
          Choerodon.prompt(message);
        } else {
          Choerodon.prompt(CompanyStore.languages[`${intlPrefix}.invalid.success`]);
          this.loadCompanys();
        }
      }).catch((error) => {
        Choerodon.prompt(CompanyStore.languages[`${intlPrefix}.invalid.error`]);
      });
    } else {
      CompanyStore.ableCompany(iamOrganizationId, company).then(({ failed, message }) => {
        if (failed) {
          Choerodon.prompt(message);
        } else {
          Choerodon.prompt(CompanyStore.languages['enable.success']);
          this.loadCompanys();
        }
      }).catch((error) => {
        Choerodon.prompt(CompanyStore.languages['enabled.error']);
      });
    }
  };

  renderSideTitle = () => {
    const { edit } = this.state;
    if (edit) {
      return CompanyStore.languages[`${intlPrefix}.edit`];
    } else {
      return CompanyStore.languages[`${intlPrefix}.new.company`];
    }
  };

  renderSidebar = () => {
    const { visible, selectedData, edit } = this.state;
    return (
      <EditCompany
        visible={visible}
        id={selectedData}
        edit={edit}
        onRef={(node) => {
          this.editCompany = node;
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
          this.loadCompanys();
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
    this.loadCompanys(pagination, sorter.join(','), filters, params);
  };

  render() {
    const { intl, AppState } = this.props;
    const { submitting, visible, edit, dataSource, params, filters, sort, pagination } = this.state;
    const enabled = CompanyStore.getEnabled;

    const ListColumns = [
      {
        title: CompanyStore.languages[`${intlPrefix}.company.name`],
        code: 'companyFullName',
        dataIndex: 'companyFullName',
        key: 'companyFullName',
        width: 150,
        filters: [],
        filteredValue: filters.companyFullName || [],
        render: (text, record) => <a onClick={this.onEdit.bind(this, record)}>{text}</a>,
      },
      {
        title: CompanyStore.languages[`${intlPrefix}.company.code`],
        code: 'companyCode',
        dataIndex: 'companyCode',
        key: 'companyCode',
        width: 150,
        filters: [],
        filteredValue: filters.companyCode || [],
      },
      {
        title: CompanyStore.languages[`${intlPrefix}.company.short.name`],
        dataIndex: 'companyShortName',
        key: 'companyShortName',
        hidden: true,
        filters: [],
      },
      {
        title: CompanyStore.languages[`${intlPrefix}.tax.number`],
        dataIndex: 'taxNumber',
        key: 'taxNumber',
        hidden: true,
        filters: [],
      },
      {
        title: CompanyStore.languages[`${intlPrefix}.employee.number`],
        dataIndex: '',
        key: '',
        width: 100,
        // filters: [],
      },
      {
        title: CompanyStore.languages[`${intlPrefix}.company.type`],
        dataIndex: 'companyType',
        key: 'companyType',
        hidden: true,
        filters: [],
      },
      {
        title: CompanyStore.languages[`${intlPrefix}.parent.company.name`],
        dataIndex: 'parentCompanyName',
        key: 'parentCompanyName',
        hidden: true,
        filters: [],
      },
      {
        title: CompanyStore.languages[`${intlPrefix}.company.contacts`],
        dataIndex: 'contact',
        key: 'contact',
        hidden: true,
        filters: [],
      },
      {
        title: CompanyStore.languages[`${intlPrefix}.phone`],
        dataIndex: 'phone',
        key: 'phone',
        hidden: true,
        filters: [],
      },
      {
        title: CompanyStore.languages[`${intlPrefix}.company.address`],
        dataIndex: 'address',
        key: 'address',
        hidden: true,
        filters: [],
      },
      {
        title: CompanyStore.languages[`${intlPrefix}.state`],
        code: 'isEnabled',
        dataIndex: 'isEnabled',
        width: 70,
        key: 'isEnabled',
        filters: [{
          text: CompanyStore.languages[`${intlPrefix}.state.y`],
          value: 'Y',
        }, {
          text: CompanyStore.languages[`${intlPrefix}.state.n`],
          value: 'N',
        }],
        onFilter: (value, record) => record.isEnabled.indexOf(value) === 0,
        render: (values, record) => this.enabledState(record.isEnabled),

      },
      {
        title: CompanyStore.languages[`${intlPrefix}.creation.date`],
        code: 'creationDate',
        dataIndex: 'creationDate',
        key: 'creationDate',
        width: 120,
        filters: [],
      },
      {
        title: CompanyStore.languages.operation,
        key: 'action',
        align: 'left',
        width: 80,
        render: (text, record) => (
          <div>
            <Tooltip
              title={CompanyStore.languages.modify}
              placement="bottom"
            >
              <Button
                size="small"
                icon="bianji-"
                shape="circle"
                style={{ cursor: 'pointer', color: '#2196F3' }}
                onClick={this.onEdit.bind(this, record)}
              />
            </Tooltip>
            {record.isEnabled === 'Y' ? (
              <Tooltip
                title={CompanyStore.languages.disableN}
                placement="bottom"
              >
                <Button
                  icon="jinyongzhuangtai"
                  style={{ cursor: 'pointer' }}
                  shape="circle"
                  size="small"
                  onClick={this.handleAble.bind(this, record)}
                />
              </Tooltip>
            ) : (
              <Tooltip
                title={CompanyStore.languages.enableY}
                placement="bottom"
              >
                <Button
                  icon="yijieshu"
                  shape="circle"
                  style={{ cursor: 'pointer', color: '#2196F3' }}
                  size="small"
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
        <Header title={CompanyStore.languages[`${intlPrefix}.company.management`]}>
          <Button
            onClick={() => this.showModal()}
            style={{ color: '#04173F' }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {CompanyStore.languages[`${intlPrefix}.new.company`]}
          </Button>
        </Header>
        <Content>
          <Table
            size="middle"
            columns={ListColumns}
            pagination={pagination}
            rowKey="id"
            dataSource={dataSource}
            onChange={this.handlePageChange.bind(this)}
            loading={CompanyStore.isLoading}
            filters={params}
          />
          <Sidebar
            title={this.renderSideTitle()}
            visible={visible}
            okText={CompanyStore.languages[edit ? 'save' : 'create']}
            cancelText={CompanyStore.languages.cancel}
            onOk={(e) => {
              this.editCompany.handleSubmit(e);
            }}
            onCancel={(e) => {
              this.editCompany.handleCancel(e);
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


export default withRouter(injectIntl(CompanyHome));
