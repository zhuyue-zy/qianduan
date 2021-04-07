/** 2018/11/7
*作者:高梦龙
*项目：业务参数管理页面
*/

import React, { Component } from 'react';
import { Button, Modal, Table, Tooltip } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page } from 'yqcloud-front-boot';
import businessParamStore from '../../../../stores/organization/businessParam/BusinessParamStore';

const intlPrefix = 'organization.businessParam';

@inject('AppState')
@observer
class BusinessParamHome extends Component {
  state=this.getInitState();

  getInitState() {
    return {
      edit: false,
      page: 0,
      isLoading: true,
      params: [],
      filters: {},
      count: 0,
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      sort: 'id,desc',
      visible: false,
    };
  }

  componentWillMount() {
    this.fetch(this.props);
  }

  componentDidMount() {
    this.loadParam();
  }

  fetch() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    businessParamStore.getApplicationTypes(organizationId);
    businessParamStore.getTransactionNameTypes(organizationId);
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    businessParamStore.queryLanguage(id, AppState.currentLanguage);
  }

  // 业务参数列表分页

  loadParam =(paginationIn, sortIn, filtersIn, paramsIn) => {
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = this.props.AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    Object.keys(filters).forEach((i) => {
      if (i === 'paramCode') {
        if (filters.paramCode[0]) {
          filters.paramCode[0] = filters.paramCode[0].replace(/[&\|\\\*^{}%$#@\-]/g, '');
        }
      }
    });
    businessParamStore.loadBussinessParam(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      let { count } = this.state;
      data.content.forEach((v) => {
        v.key = count;
        count += 1;
      });

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
        dataSource: data.content,
        count,
      });
    });
  }

  handlePageChange(pagination, filters, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadParam(pagination, sorter.join(','), filters, params);
  }

  // 应用系统快码解析
  applicationCodeState=(values) => {
    const typeLists = businessParamStore.getApplicationType;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  // 事务名称快码解析
  transactionNameState=(values) => {
    const typeLists = businessParamStore.getTransactionNameType;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  render() {
    const { AppState, intl, form } = this.props;
    const { filters, pagination, dataSource } = this.state;
    const { orgType } = this.props.AppState.currentMenuType.type;
    const { selectedRowKeys, selectedCodeValues } = this.state;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
    const ApplicationCodes = businessParamStore.getApplicationType; // 应用系统快码
    const applicationOption = [];
    const applicationText = [];
    const transactionNames = businessParamStore.getTransactionNameType; // 事务名称快码
    const transactionNameOption = [];
    const transactionNameText = [];

    ApplicationCodes.forEach((item) => {
      applicationOption.push({ text1: item.lookupMeaning, value1: item.lookupValue });
    });
    applicationOption.forEach((values) => {
      applicationText.push({ text: values.text1, value: values.value1 });
    });

    transactionNames.forEach((item) => {
      transactionNameOption.push({ text1: item.lookupMeaning, value1: item.lookupValue });
    });
    transactionNameOption.forEach((values) => {
      transactionNameText.push({ text: values.text1, value: values.value1 });
    });

    const columns = [
      {
        title: businessParamStore.languages[`${intlPrefix}.applyName`],
        dataIndex: 'applicationCode',
        key: 'applicationCode',
        filters: applicationText,
        filteredValue: filters.applicationCode || [],
        width: 200,
        render: (values, record) => this.applicationCodeState(record.applicationCode),
      },
      // {
      //   title: businessParamStore.languages[`${intlPrefix}.transactionName`],
      //   dataIndex: 'transactionName',
      //   key: 'transactionName',
      //   filters: transactionNameText,
      //   filteredValue: filters.transactionName || [],
      //   width: 200,
      //   render: (values, record) => this.transactionNameState(record.transactionName),
      // },
      {
        title: businessParamStore.languages[`${intlPrefix}.paramName`],
        dataIndex: 'paramName',
        key: 'paramName',
        width: 200,
        filters: [],
        filteredValue: filters.paramName || [],
      },
      {
        title: businessParamStore.languages[`${intlPrefix}.paramValue`],
        dataIndex: 'paramCode',
        key: 'paramCode',
        width: 200,
        filters: [],
        filteredValue: filters.paramCode || [],
      },


    ];

    return (

      <Page>
        <Header title={businessParamStore.languages[`${intlPrefix}.businessParamTitle`]} />
        <Content>
          <div style={{ marginTop: '5px' }}>
            <Table
              size="middle"
              pagination={pagination}
              columns={columns}
              dataSource={dataSource}
              loading={businessParamStore.isLoading}
              onChange={this.handlePageChange.bind(this)}
            />
          </div>

        </Content>
      </Page>


    );
  }
}

export default withRouter(injectIntl(BusinessParamHome));
