/** 2018/11/22
*作者:高梦龙
*项目：编码规则
*/
import React, { Component } from 'react';
import { Button, Modal, Table, Tooltip, Form, Input, Select, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page } from 'yqcloud-front-boot';
import encodingStore from '../../../../stores/organization/encodingRules/EncodingStore';

const intlPrefix = 'organization.encodingRules';

@inject('AppState')
@observer
class EncodingHome extends Component {
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
      sort: 'isEnabled,effectiveDate,desc',
      visible: false,
      messageTestInfo: {},
      testVisible: false,
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadEncoding();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    encodingStore.queryLanguage(id, AppState.currentLanguage);
  }

  fetch() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    encodingStore.getApplicationTypes(organizationId);
    encodingStore.getDocTypeCodes(organizationId);
    encodingStore.getIsEnabled(organizationId);
  }
  // 编码规则分页

  loadEncoding =(paginationIn, sortIn, filtersIn, paramsIn) => {
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    Object.keys(filters).forEach((i) => {
      if (i === 'applicationCode') {
        filters.applicationCodeList = [filtersIn.applicationCode];
      }
      if (i === 'docTypeCode') {
        filters.docTypeCodeList = [filtersIn.docTypeCode];
      }
    });
    encodingStore.loadEncodingRules(
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
    this.loadEncoding(pagination, sorter.join(','), filters, params);
  }

  // 打开消息模板页面
  openNewPage = (id) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const menuType = AppState.currentMenuType;
    this.props.history.push(`/iam/encodingRules/${id ? `edit/${id}` : 'create'}?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
  };

  // 打开替换编码页面
  openReplacePage = (id) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const menuType = AppState.currentMenuType;
    this.props.history.push(`/iam/encodingRules/replace/${id}?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
  };

  // 编辑消息模板界面
  onEdit = (id) => {
    this.openNewPage(id);
  };

  // 替换编码页面
  onReplace = (id) => {
    this.openReplacePage(id);
  }

  // 创建消息模板页面
  onCreate = () => {
    this.openNewPage();
  };
  // 更新页面数据

  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadMessage();
    });
  };


  /*
 * 有效和无效
 * */
  handleAble = (record) => {
    const { AppState, intl } = this.props;
    const { id } = AppState.currentMenuType;
    if (record.enabled === true) {
      encodingStore.disableMessage(id, record).then(
        (data) => {
          if (data) {
            const { failed, message } = data;
            if (failed) {
              // Choerodon.prompt(message);
            } else {
              Choerodon.prompt(encodingStore.languages['disable.success']);
              this.handleRefresh();
            }
          }
        },
      ).catch((error) => {
        Choerodon.prompt(encodingStore.languages['disable.error']);
      });
    } else {
      encodingStore.enableMessage(id, record).then((data) => {
        if (data) {
          const { failed, message } = data;
          if (failed) {
            // Choerodon.prompt(message);
          } else {
            Choerodon.prompt(encodingStore.languages['enable.success']);
            this.handleRefresh();
          }
        }
      }).catch((error) => {
        Choerodon.prompt(encodingStore.languages['enable.error']);
      });
    }
  };

  // 获取流程状态

  applicationCodeState = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const ApplicationTypes = encodingStore.getApplicationType;
    const temp = ApplicationTypes.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  docTypeCodeState = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const DocTypeCodes = encodingStore.getDocTypeCode;
    const temp = DocTypeCodes.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  enabledState = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const enabled = encodingStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  handleReset = () => {
    this.setState({
      text: '',
    });
    this.props.form.resetFields();
  }


  render() {
    const { AppState, intl } = this.props;
    const { filters, pagination, dataSource } = this.state;
    const { orgType } = this.props.AppState.currentMenuType.type;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
    const DocTypeCodes = encodingStore.getDocTypeCode;
    const ApplicationTypes = encodingStore.getApplicationType;
    const lanOption = [];
    const text1 = [];

    const DocOption = [];
    const text2 = [];
    ApplicationTypes.forEach((item) => {
      lanOption.push({ text1: item.lookupMeaning, value1: item.lookupValue });
    });
    lanOption.forEach((values) => {
      text1.push({ text: values.text1, value: values.value1 });
    });

    DocTypeCodes.forEach((items) => {
      DocOption.push({ text2: items.lookupMeaning, value2: items.lookupValue });
    });
    DocOption.forEach((v) => {
      text2.push({ text: v.text2, value: v.value2 });
    });
    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '130px',
      wordBreak: 'normal',
    };
    const tableRuleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '90px',
      wordBreak: 'normal',
    };
    const tableRuleCode = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '90px',
      wordBreak: 'normal',
    };
    const columns = [
      {
        title: encodingStore.languages[`${intlPrefix}.applicationSystem`],
        dataIndex: 'applicationCode',
        key: 'applicationCode',
        filters: text1,
        filteredValue: filters.applicationCode || [],
        width: 100,
        filterMultiple: true,
        render: (values, record) => this.applicationCodeState(record.applicationCode),
      },
      {
        title: encodingStore.languages[`${intlPrefix}.documentType`],
        dataIndex: 'docTypeCode',
        key: 'docTypeCode',
        filteredValue: filters.docTypeCode || [],
        width: 120,
        filters: text2,
        filterMultiple: true,
        render: (values, record) => this.docTypeCodeState(record.docTypeCode),
      },
      {
        title: encodingStore.languages[`${intlPrefix}.ruleCode`],
        dataIndex: 'ruleCode',
        key: 'ruleCode',
        width: 90,
        filters: [],
        filteredValue: filters.ruleCode || [],
        render: (values, record) => (
          <span style={tableRuleCode}>
            <Tooltip title={values} lines={20}>
              <div style={{ textAlign: 'left' }}>{`${record.ruleCode}` }</div>
            </Tooltip>
          </span>
        ),
      },
      {
        title: encodingStore.languages[`${intlPrefix}.ruleName`],
        dataIndex: 'ruleName',
        key: 'ruleName',
        width: 90,
        filters: [],
        filteredValue: filters.ruleName || [],
        render: (text, record) => (
          <span style={tableRuleName}>
            <Tooltip title={text} lines={20}>
              <a onClick={this.onEdit.bind(this, record.headerId)}>{text}</a>
            </Tooltip>
          </span>
        ),
      },
      {
        title: encodingStore.languages[`${intlPrefix}.descriptions`],
        dataIndex: 'description',
        key: 'description',
        width: 130,
        filters: [],
        filteredValue: filters.description || [],
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={20}>
              <div style={{ textAlign: 'left' }}>{`${record.description}` === 'null' ? '' : `${record.description}` }</div>
            </Tooltip>
          </span>
        ),
      },

      {
        title: encodingStore.languages[`${intlPrefix}.status`],
        dataIndex: 'isEnabled',
        key: 'isEnabled',
        width: 80,
        filters: [{
          text: encodingStore.languages[`${intlPrefix}.isenabled.y`],
          value: 'true',
        }, {
          text: encodingStore.languages[`${intlPrefix}.isenabled.n`],
          value: 'false',
        }],
        sorter: true,
        render: (values, record) => this.enabledState(record.isEnabled),

      },
      {
        title: encodingStore.languages[`${intlPrefix}.effectiveTime`],
        dataIndex: 'effectiveDate',
        key: 'effectiveDate',
        width: 160,
        filteredValue: filters.effectiveDate || [],
      },
      {
        title: encodingStore.languages[`${intlPrefix}.invalidTime`],
        dataIndex: 'disableDate',
        key: 'disableDate',
        width: 160,
        filteredValue: filters.disableDate || [],
      },
      {
        code: 'actions',
        title: '操作',
        dataIndex: 'actions',
        key: 'actions',
        width: 50,
        render: (text, record) => (
          <div>
            {
                record.isEnabled ? (
                  <Tooltip placement="bottom" title={encodingStore.languages[`${intlPrefix}.replace`]}>
                    <Button
                      key="finished"
                      style={{ cursor: 'pointer', color: '#2196F3' }}
                      icon="tihuan"
                      onClick={this.onReplace.bind(this, record.headerId)}
                      disabled={!record.isEnabled}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip placement="bottom" title={encodingStore.languages[`${intlPrefix}.replace`]}>
                    <Button
                      key="finished"
                      style={{ cursor: 'pointer' }}
                      icon="tihuan"
                      onClick={this.onReplace.bind(this, record.headerId)}
                      disabled={!record.isEnabled}
                    />
                  </Tooltip>
                )}
          </div>
        ),
      },
    ];

    return (

      <Page>
        <Header title={encodingStore.languages[`${intlPrefix}.encodingTitle`]}>
          <Button
            onClick={this.onCreate}
            style={{ color: '#04173F' }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {encodingStore.languages[`${intlPrefix}.createEncoding`]}
          </Button>
        </Header>
        <Content>
          <div style={{ marginTop: '5px' }}>
            <Table
              size="middle"
              pagination={pagination}
              columns={columns}
              dataSource={dataSource}
              loading={encodingStore.isLoading}
              onChange={this.handlePageChange.bind(this)}
            />
          </div>

        </Content>
      </Page>


    );
  }
}

export default Form.create()(withRouter(injectIntl(EncodingHome)));
