/**
 * Created by kanghua.pang on 2018-12-14.
 */
import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content, Permission, Action } from 'yqcloud-front-boot';
import {
  Row, Col, Form, Card, Button, Table, Tabs, Modal, Tooltip,
} from 'yqcloud-ui';
import './FunctionPermission.scss';
import FunctionStore from '../../../../stores/globalStores/function/FunctionStore';

const intlPrefix = 'global.function';

@inject('AppState')
@observer
class FunctionPermission extends Component {
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
      sort: 'functionCode',
    };
  }

  componentWillMount() {
    this.loadFunctions();
    this.loadLanguage();
  }

  reload = () => {
    this.setState(this.getInitState(), () => {
      this.loadFunctions();
    });
  };

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const id = 0;
    FunctionStore.queryLanguage(id, AppState.currentLanguage);
  };

  /**
   * 加载组织列表
   * @param paginationIn 分页
   */
  loadFunctions = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    FunctionStore.loadFunctions(
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
    })
      .catch(error => Choerodon.handleResponseError(error));
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
    this.loadFunctions(pagination, sorter.join(','), filters, params);
  };

  render() {
    const { intl } = this.props;
    const { submitting, visible, edit, dataSource, params, filters, sort, pagination } = this.state;

    const columns = [
      {
        title: FunctionStore.languages[`${intlPrefix}.permission.parentFunctionCode`],
        dataIndex: 'parentFunctionCode',
        key: 'parentFunctionCode',
        filters: [],
        filteredValue: filters.parentFunctionCode || [],
      }, {
        title: FunctionStore.languages[`${intlPrefix}.permission.functionName`],
        dataIndex: 'functionName',
        key: 'functionName',
        filters: [],
        filteredValue: filters.functionName || [],
      }, {
        title: FunctionStore.languages[`${intlPrefix}.permission.functionCode`],
        dataIndex: 'functionCode',
        key: 'functionCode',
        filters: [],
        filteredValue: filters.functionCode || [],
      }, {
        title: FunctionStore.languages[`${intlPrefix}.permission.functionType`],
        dataIndex: 'functionType',
        key: 'functionType',
        filters: [
          { text: FunctionStore.languages.menu, value: 'menu' },
          { text: FunctionStore.languages.button, value: 'button' },
          { text: FunctionStore.languages.default, value: 'default' },
        ],
        filteredValue: filters.functionType || [],
        render: (text, record) => {
          if (record.functionType === 'menu') {
            return (<span>{FunctionStore.languages.menu}</span>);
          } else if (record.functionType === 'button') {
            return (<span>{FunctionStore.languages.button}</span>);
          } else {
            return (<span>{FunctionStore.languages.default}</span>);
          }
        },
      }, {
        title: FunctionStore.languages[`${intlPrefix}.permission.permissionCode`],
        dataIndex: 'permissionCode',
        key: 'permissionCode',
        filteredValue: filters.permissionCode || [],
      }, {
        title: FunctionStore.languages[`${intlPrefix}.permission.isBarely`],
        dataIndex: 'isBarely',
        key: 'isBarely',
        filteredValue: filters.isBarely || [],
        filters: [
          { text: FunctionStore.languages.yes, value: 'Y' },
          { text: FunctionStore.languages.no, value: 'N' },
        ],
        render: (text, record) => {
          if (record.isBarely === 'Y') {
            return (<span>{FunctionStore.languages.yes}</span>);
          } else if (record.isBarely === 'N') {
            return (<span>{FunctionStore.languages.no}</span>);
          } else {
            return (<span />);
          }
        },
      }, {
        title: <FormattedMessage id={`${intlPrefix}.permission.level`} />,
        dataIndex: 'level',
        key: 'level',
        filters: [
          { text: FunctionStore.languages.Tenant, value: 'organization' },
          { text: FunctionStore.languages.site, value: 'site' },
          { text: FunctionStore.languages.user, value: 'user' },
          { text: FunctionStore.languages.project, value: 'project' },
        ],
        filteredValue: filters.level || [],
        render: (text, record) => {
          if (record.level === 'organization') {
            return (<span>{FunctionStore.languages.Tenant}</span>);
          } else if (record.level === 'site') {
            return (<span>{FunctionStore.languages.site}</span>);
          } else if (record.level === 'user') {
            return (<span>{FunctionStore.languages.user}</span>);
          } else if (record.level === 'project') {
            return (<span>{FunctionStore.languages.project}</span>);
          }
        },
      }, {
        title: FunctionStore.languages[`${intlPrefix}.permission.creationDate`],
        dataIndex: 'creationDate',
        key: 'creationDate',
        filters: [],
        filteredValue: filters.creationDate || [],
      }, {
        title: FunctionStore.languages[`${intlPrefix}.permission.lastUpdateDate`],
        dataIndex: 'lastUpdateDate',
        key: 'lastUpdateDate',
        filters: [],
        filteredValue: filters.lastUpdateDate || [],
      }];
    return (
      <Page
        service={[
          'iam-service.function-permission.getFunctionPermission',
        ]}
      >
        <Header title={FunctionStore.languages[`${intlPrefix}.management`]}>
        </Header>
        <Content>
          <Table
            size="middle"
            columns={columns}
            pagination={pagination}
            rowKey="id"
            dataSource={dataSource}
            onChange={this.handlePageChange.bind(this)}
            loading={FunctionStore.isLoading}
            filters={params}
            scroll={{ x: 1750 }}
          />
        </Content>
      </Page>
    );
  }
}


export default withRouter(injectIntl(FunctionPermission));
