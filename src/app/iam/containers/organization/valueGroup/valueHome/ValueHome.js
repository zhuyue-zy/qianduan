/** 2018/9/18
 *作者:高梦龙
 *
 */

import React, { Component } from 'react';
import { Button, Modal, Table, Icon, Tooltip } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Action, Content, Header, Page } from 'yqcloud-front-boot';
import EditValue from '../editValue';
import valueStore from '../../../../stores/organization/valueGroup/valueStore/ValueStore';

const { Sidebar } = Modal;
const intlPrefix = 'organization.valueGroup';

@inject('AppState')
@observer
class ValueHome extends Component {
  state = this.getInitState();

  // 初始化状态
  getInitState() {
    return {
      submitting: false,
      edit: false,
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
      sort: 'flexValueSetId,desc',
      visible: false,
      deleteVisible: false,
      selectedData: '',
      selectedRowKeys: [],
      deleteValueAll: [],
      confirmLoading: false,
      confirmDeleteLoading: false,

    };
  }

  componentWillMount() {
    this.fetch(this.props);
    valueStore.organizationType(this.props.AppState.currentMenuType.type);
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadValue();
    valueStore.organizationType(this.props.AppState.currentMenuType.type);
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    if (this.props.AppState.currentMenuType.type === 'site') {
      valueStore.queryLanguage(0, AppState.currentLanguage);
    } else {
      valueStore.queryLanguage(id, AppState.currentLanguage);
    }
  }

  componentDidUpdate() {
    valueStore.organizationType(this.props.AppState.currentMenuType.type);
  }


  fetch=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    if (organizationId === undefined) {
      valueStore.getIsEnabled(0);
    } else {
      valueStore.getIsEnabled(organizationId);
    }
  }

  // 更新页面数据
  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadValue();
    });
  };

  // 修改按钮
  onEdit = (id) => {
    this.setState({
      visible: true,
      edit: true,
      selectedData: id,

    });
  };

  // 批量删除按钮
  handleDelete = () => {
    this.setState({
      deleteVisible: true,
    });
  }

  // 确认批量删除按钮
  handleDeleteOk = () => {
    this.setState({
      confirmDeleteLoading: true,
    });
    const { deleteValueAll } = this.state;
    const { AppState, intl } = this.props;
    const { id } = AppState.currentMenuType;
    /* eslint-disable */
    const data = deleteValueAll;
    valueStore.deleteVlaue(
      id,
      data,
    ).then((data) => {
      this.setState({
        deleteVisible: false,
        confirmDeleteLoading: false,
        selectedRowKeys: [],
        deleteValueAll: [],
      });
      this.handleRefresh();
      Choerodon.prompt(valueStore.languages[ `${intlPrefix}.action.delete.msg`]);
    });
  }

  // 生效快码
  enabledState = (values) => {
    const enabled = valueStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  // 取消删除按钮
  handleDeleteCancel = () => {
    this.setState({
      deleteVisible: false,
    });
  }

  // 值集分页加载
  loadValue = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const {AppState, ValueStore} = this.props;
    const {pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState} = this.state;
    const {id} = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    ValueStore.loadValues(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      // 将后台获取的分页信息手动set表格里
      ValueStore.setValueGroups(data.content);
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

  /**
   * 打开新的界面
   * @returns {*}
   */
  openNewPage = () => {
    this.setState({
      visible: true,
      edit: false,
    });
  };

  /**
   * 通过获取状态来更该标题信息
   * @returns {*}
   */
  renderSideTitle() {
    if (this.state.edit) {
      return valueStore.languages[`${intlPrefix}.modify`];
    } else {
      return valueStore.languages[`${intlPrefix}.create`];
    }
  }


  handlePageChange(pagination, filters, {field, order}, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadValue(pagination, sorter.join(','), filters, params);
  }


  /**
   * 编辑值集模态框
   * @returns {*}
   */

  renderSideBar() {
    const {selectedData, edit, visible} = this.state;
    return (
      <EditValue
        id={selectedData}
        visible={visible}
        edit={edit}

        onRef={(node) => {
          this.editValue = node;
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
          this.loadValue();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
        OnCloseModel={() => {
          this.setState({
            visible: false,
            submitting: false,
          });
        }}
      />
    );
  }

  /*
 * 启用停用
 * */
  handleAble = (record) => {
    const {AppState, intl} = this.props;
    const { id } = AppState.currentMenuType;
    let {isEnabled} = record;
    isEnabled = isEnabled === 'Y' ? 'N' : 'Y';
    if (isEnabled == 'N') {
      valueStore.disableValue(id, record).then(
        (data) => {
          if (data) {
            const {failed, message} = data;
            if (failed) {
              Choerodon.prompt(message);
            } else {
              Choerodon.prompt(valueStore.languages[ isEnabled === 'N' ? 'disable.success' : 'enable.success']);
              this.handleRefresh();
            }
          }
        },
      ).catch((error) => {
        Choerodon.prompt(valueStore.languages[ isEnabled === 'N' ? 'disable.error' : 'enable.error']);
      });
    } else {
      valueStore.enableValue(id, record).then(
        (data) => {
          if (data) {
            const {failed, message} = data;
            if (failed) {
              Choerodon.prompt(message);
            } else {
              Choerodon.prompt(valueStore.languages[ isEnabled === 'N' ? 'disable.success' : 'enable.success']);
              this.handleRefresh();
            }
          }
        },
      ).catch((error) => {
        Choerodon.prompt(valueStore.languages[ isEnabled === 'N' ? 'disable.error' : 'enable.error']);
      });
    }
  };

  render() {
    const {ValueStore, AppState, intl} = this.props;
    const {filters, pagination, visible, edit, submitting, selectedRowKeys} = this.state;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    const orgname = menuType.name;
    const enabled = valueStore.getEnabled;

    let data = [];
    if (ValueStore.getValueGroups) {
      data = ValueStore.valueGroups.slice();
     data.map((v) => {
        v.key = v.flexValueSetId;
      });
    }
    const columns = [
      {
        title: valueStore.languages[ `${intlPrefix}.valuecode`],
        dataIndex: 'flexValueSetName',
        key: 'flexValueSetName',
        filters: [],
        filteredValue: filters.flexValueSetName || [],
        width: 120,
        sorter: true,
        render: (text, record) => (
        record.isEnabled === 'Y' ? (<a onClick={this.onEdit.bind(this, record.flexValueSetId)}>{text}</a>) : (
        <span>{text}</span>)

        ),
      },
      {
        title: valueStore.languages[ `${intlPrefix}.valueDes`],
        dataIndex: 'description',
        key: 'description',
        filters: [],
        filteredValue: filters.description || [],
        width: 130,
        sorter: true,
      },
      {
        title: valueStore.languages[ `${intlPrefix}.isEnabled`],
        dataIndex: 'isEnabled',
        key: 'isEnabled',
        width: 130,
        filters: [{
          text: valueStore.languages[ `${intlPrefix}.isenabled.y`],
          value: 'Y',
        }, {
          text: valueStore.languages[ `${intlPrefix}.isenabled.n`],
          value: 'N',
        }],
        sorter: true,
        onFilter: (value, record) => record.isEnabled.indexOf(value) === 0,
        render: (values, record) => this.enabledState(record.isEnabled),

      },{
        title: valueStore.languages["operation"],
        key: 'action',
        align: 'left',
        width: '120px',
        render: (text, record) => (
          <div>
            <Tooltip
              title={valueStore.languages["modify"]}
              placement="bottom"
            >
              <Button
                size="small"
                icon="bianji-"
                shape="circle"
                style={{ cursor: 'pointer', color: '#2196F3' }}
                onClick={this.onEdit.bind(this, record.flexValueSetId)}
              />
            </Tooltip>
            {record.isEnabled === 'Y' ? (
              <Tooltip
                title={valueStore.languages["disableN"]}
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
                title={valueStore.languages["enableY"]}
                placement="bottom"
              >
                <Button
                  icon="yijieshu"
                  shape="circle"
                  style={{ cursor: 'pointer', color: '#2196F3' }}
                  size="small"
                  onClick={this.handleAble.bind(this, record)}
                />
              </Tooltip>)}
            <Tooltip
              title={valueStore.languages[`${intlPrefix}.lookup`]}
              placement="bottom"
            >
              <Button
                size="small"
                icon="chakan"
                shape="circle"
                style={{ cursor: 'pointer', color: '#2196F3' }}
                onClick={() => {
                  const url =  organizationId === undefined  ? `${window.location.href.replace('valueGroup', 'valueGroupLook')}?code=${record.flexValueSetName}` : `${window.location.href.replace('valueGroup', 'valueGroupLook')}&code=${record.flexValueSetName}` ;
                  window.open(url);
                }}
              />
            </Tooltip>
          </div>),
      }
    ];
    const rowSelection = {
      onChange: (selectedRowKeys, valAll) => {
        this.setState({selectedRowKeys, deleteValueAll: valAll});// 将valueAll全部的值赋值给selectedRowKeys
      },
      selectedRowKeys,
    };

    return (
      <Page>
        <Header title={valueStore.languages[`${intlPrefix}.valuetitle`]}>
          <Button
            onClick={this.openNewPage}
            style={{ color: '#04173F' }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {valueStore.languages[`${intlPrefix}.create`]}
          </Button>
        </Header>
        <Content>
          <Table
            size="middle"
            pagination={pagination}
            columns={columns}
            dataSource={data}
            onChange={this.handlePageChange.bind(this)}
            loading={ValueStore.isLoading}
            rowSelection={rowSelection}
          />

          {/* 值集编辑 */}
          <Sidebar
            title={this.renderSideTitle()}
            visible={visible}
            okText={valueStore.languages[edit ? 'save' : 'create']}
            cancelText={valueStore.languages["cancel"]}
            onOk={e => this.editValue.handleSubmit(e)}
            onCancel={(e) => {
              this.editValue.handleCancel(e);
              this.multiLanguageValue = {};
            }}
            confirmLoading={submitting}

          >
            {
              this.renderSideBar()
            }
          </Sidebar>
          <Modal
            title={valueStore.languages[ `${intlPrefix}.action.delete.model`]}
            visible={this.state.deleteVisible}
            onOk={this.handleDeleteOk}
            onCancel={this.handleDeleteCancel}
            confirmLoading={this.state.confirmDeleteLoading}
            center
          />
        </Content>
      </Page>
    );
  }
}

export default withRouter(injectIntl(ValueHome));
