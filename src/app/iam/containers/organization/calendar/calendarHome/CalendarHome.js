/**
 * Create By liuchuan on 2018/9/17.
 */
import React, { Component } from 'react';
import { Button, Modal, Table, Tooltip, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Action, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import CalendarStore from '../../../../stores/organization/calendar';

const intlPrefix = 'organization.calendar';

@inject('AppState')
@observer
class CalendarHome extends Component {
  state = this.getInitState();

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
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      sort: 'id,desc',
      visible: false,
      deleteVisible: false,
      selectedData: '',
      selectedRowKeys: [],
      confirmLoading: false,
      confirmDeleteLoading: false,
      visibleAssign: false,
      calendarLookupType: [],
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadCalendar();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CalendarStore.queryLanguage(id, AppState.currentLanguage);
  };

  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadCalendar();
    });
  };

  onEdit = (id) => {
    this.openNewPage(id);
  };

  fetch=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    CalendarStore.getIsEnabled(organizationId);
  }

  /**
   * 加载数据
   * @param paginationIn
   * @param sortIn
   * @param filtersIn
   * @param paramsIn
   */
  loadCalendar = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    CalendarStore.lookupValueDto(
      id,
      'ITSM_CALENDAR_TYPE',
      true,
    )
      .then((data) => {
        this.setState({ calendarLookupType: data });
      })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
      );
    CalendarStore.loadCalendars(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      CalendarStore.setCalendars(data.content);
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
      });
    })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
      );
  };

  openNewPage = (id) => {
    this.props.history.push(`/iam/calendar${id ? `/edit/${id}` : '/create'}?type=organization&id=${this.props.AppState.currentMenuType.id}&name=${this.props.AppState.currentMenuType.name}&organizationId=${this.props.AppState.currentMenuType.organizationId}`);
  };

  onCreate = () => {
    this.openNewPage();
  };

  /*
 * 失效有效
 * */
  handleAble = (record) => {
    const { AppState, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    let { calendarStatus } = record;
    calendarStatus = calendarStatus === 'Y' ? 'N' : 'Y';
    CalendarStore.calendarsRevision(organizationId, {
      ...record,
      calendarStatus,
    }).then(
      ({ failed, message }) => {
        if (failed) {
          Choerodon.prompt(message);
        } else {
          Choerodon.prompt(CalendarStore.languages[calendarStatus === 'N' ? 'disable.success' : 'enable.success']);
          this.handleRefresh();
        }
      },
    ).catch((error) => {
      Choerodon.prompt(CalendarStore.languages[calendarStatus === 'N' ? 'disable.error' : 'enable.error']);
    });
  };

  // 启用快码
  enabledState = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const enabled = CalendarStore.getEnabled;
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
    this.loadCalendar(pagination, sorter.join(','), filters, params);
  }

  render() {
    const { AppState, intl } = this.props;
    const { filters, calendarLookupType, pagination, visible, edit, visibleAssign, submitting, params, selectedRowKeys } = this.state;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    const orgname = menuType.name;
    const enabled = CalendarStore.getEnabled;
    let type = '';
    if (AppState.getType) {
      type = AppState.getType;
    } else if (sessionStorage.type) {
      type = sessionStorage.type;
    } else {
      type = menuType.type;
    }
    let data = [];
    if (CalendarStore.getCalendars) {
      data = CalendarStore.calendars.slice();
      data.map((v) => {
        v.key = v.calendarId;
        return v;
      });
    }
    const columns = [
      {
        title: CalendarStore.languages[`${intlPrefix}.calendarName`],
        dataIndex: 'calendarName',
        key: 'calendarName',
        render: (text, record) => (
          <span>
            <a onClick={this.onEdit.bind(this, record.calendarId)}>{record.calendarName}</a>
          </span>
        ),
      },
      {
        title: CalendarStore.languages[`${intlPrefix}.calendarType`],
        dataIndex: 'calendarType',
        key: 'calendarType',
        render: (text, record) => {
          const [temp] = calendarLookupType.filter(v => v.lookupValue === text);
          if (text === 'WORK') {
            return '工作日历';
          }
          return temp ? temp.lookupMeaning : text;
        },
      },
      {
        title: CalendarStore.languages[`${intlPrefix}.calendarStatus`],
        dataIndex: 'calendarStatus',
        key: 'calendarStatus',
        render: (values, record) => this.enabledState(record.calendarStatus),

      },
      {
        title: CalendarStore.languages.operation,
        key: 'action',
        align: 'left',
        fixed: 'right',
        width: '100px',
        render: (text, record) => (
          <div>
            <Tooltip
              title={CalendarStore.languages.modify}
              placement="bottom"
            >
              <Button
                size="small"
                icon="bianji-"
                shape="circle"
                style={{ cursor: 'pointer', color: '#2196F3' }}
                onClick={this.onEdit.bind(this, record.calendarId)}
              />
            </Tooltip>
            {record.calendarStatus === 'Y' ? (
              <Tooltip
                title={CalendarStore.languages.disable}
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
                title={CalendarStore.languages.enable}
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
        <Header title={CalendarStore.languages[`${intlPrefix}.header.title`]}>
          <Button
            onClick={this.onCreate}
            style={{ color: '#04173F' }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {CalendarStore.languages[`${intlPrefix}.create`]}
          </Button>
        </Header>
        <Content>
          <Table
            size="middle"
            pagination={pagination}
            columns={columns}
            dataSource={data}
            onChange={this.handlePageChange.bind(this)}
            loading={CalendarStore.isLoading}
          />

        </Content>
      </Page>
    );
  }
}

export default withRouter(injectIntl(CalendarHome));
