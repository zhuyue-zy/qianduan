/*
* @description:快码主界面
* @author：赵星皓
* @update 2019-2-28 10:40
*/

import React, { Component } from 'react';
import { Table, Button, Popover, Form, Modal, Icon, Tooltip } from 'yqcloud-ui';
import { observer, inject } from 'mobx-react';
import { Page, Header, Content } from 'yqcloud-front-boot';
import { injectIntl } from 'react-intl';
import moment from 'moment';
import LookUpEditor from '../LookUpEditor';
import valueStore from '../../../../stores/organization/valueGroup/valueStore/ValueStore';


const { confirm } = Modal;
const intlPrefix = 'organization.lookup';


@observer
@injectIntl
@inject('AppState')
@Form.create({})
class LookupHome extends Component {
  constructor() {
    super();
    this.selectedCodes = []; //  存放被选中的快码记录
    this.dataSource = [];
    this.state = { //  初始化state
      showEditorSidebar: false, //  显示编辑侧边栏
      operationType: 'create', //  操作类型
      selectedRecord: {}, //  存放点击编辑按钮的记录
      dataLoading: true, //  控制表格渲染时机，数据加载完成后再加载表格数据
      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      sort: '',
    };
  }

  componentWillMount() {
    const { LookupHomeStore } = this.props;
    this.fetch(this.props);
    this.loadLanguage();
    LookupHomeStore.organizationType(this.props.AppState.currentMenuType.type);
  }

  componentDidMount() {
    const { LookupHomeStore } = this.props;
    this.loadCodes();
    LookupHomeStore.organizationType(this.props.AppState.currentMenuType.type);
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState, LookupHomeStore } = this.props;
    const { id } = AppState.currentMenuType;
    if (this.props.AppState.currentMenuType.type === 'site') {
      LookupHomeStore.queryLanguage(0, AppState.currentLanguage);
    } else {
      LookupHomeStore.queryLanguage(id, AppState.currentLanguage);
    }
  };

  componentDidUpdate() {
    const { LookupHomeStore } = this.props;
    LookupHomeStore.organizationType(this.props.AppState.currentMenuType.type);
  }

  fetch = () => {
    const { AppState, LookupHomeStore } = this.props;
    const { organizationId, type } = AppState.currentMenuType;
    if (type === 'organization') {
      LookupHomeStore.getIsEnabled(organizationId);
    }
  }

  /**
   *  加载快码数据
   */
  loadCodes = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { LookupHomeStore, AppState: { menuType: { organizationId } } } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    const enabled = LookupHomeStore.getEnabled;
    LookupHomeStore.loadCodesWithPage(
      organizationId,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      this.dataSource = data.content;
      this.setState({
        pagination: {
          current: (data.number || 0) + 1,
          pageSize: data.size || 25,
          total: data.totalElements || '',
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        dataLoading: false, //  设置dataLoading为false，表示数据已经加载完成，停止转圈
        filters,
        params,
        sort,
      });
    });
  };


  //  列处理事件
  rowSelection = {
    onSelect: (record, selected, selectedRows) => {
      this.selectedCodes = selectedRows;
    },
    onSelectAll: (selected, selectedRows) => {
      this.selectedCodes = selectedRows;
    },
  };

  /**
   *  处理新建快码事件
   */
  handleAddLookup = () => {
    //  清除缓存，在这里清除时为了防止子组件无限渲染
    this.lookupEditor.clearBuffer();
    this.lookupEditor.initDataSource([]); //  加载数据
    this.setState({
      operationType: 'create',
      showEditorSidebar: true,
      selectedRecord: {},
    });
  };

  /**
   *  处理...按钮中的编辑操作
   *  @param record 选中的数据行
   */
  handleEdit = (record) => {
    this.lookupEditor.clearBuffer(); //  清除缓存
    const { LookupHomeStore, AppState: { menuType: { organizationId } } } = this.props;
    //  加载数据
    LookupHomeStore.loadCodeById(organizationId, record.lookupTypeId)
      .then((data) => {
        //  调用子组件LookupEditor的初始化数据方法，将请求的数据保存到其中
        this.lookupEditor.initDataSource(data);
        this.setState({
          showEditorSidebar: true,
          operationType: 'modify',
          selectedRecord: record,
        });
      });
  };

  /**
   *  处理删除快码操作
   */
  handleDeleteLookups = () => {
    const { LookupHomeStore } = this.props;
    const { AppState, intl } = this.props;
    const { id } = AppState.currentMenuType;
    //  至少选中一行才会执行操作
    if (this.selectedCodes.length > 0) {
      const { intl } = this.props;
      confirm({
        title: LookupHomeStore.languages[`${intlPrefix}.confirmDelete`],
        okType: 'danger',
        onOk: () => {
          //  进行删除操作
          LookupHomeStore.deleteCodes(id, this.selectedCodes)
            .then(() => {
              this.handleRefresh();
            });
        },
      });
    }
  };

  /**
   *  处理数据发生变化后的更新
   */
  handleRefresh = () => {
    this.loadCodes();
    this.setState({
      showEditorSidebar: false,
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
    this.loadCodes(pagination, sorter.join(','), filters, params);
  }

  /**
   *  处理...按钮中的失效操作
   *  @param record 选中的数据行
   */
  handleDisable = (record) => {
    const { LookupHomeStore } = this.props;
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    LookupHomeStore.disableCode(id, record)
      .then(() => {
        this.loadCodes();
      });
  };

  /**
   *  处理...按钮中的生效按钮
   *  @param record 选中的数据行
   */
  handleEnable = (record) => {
    const { LookupHomeStore } = this.props;
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    LookupHomeStore.enableCode(id, record)
      .then(() => {
        this.loadCodes();
      });
  };


  /**
   *  渲染编辑侧边栏
   */
  renderEditorSidebar = () => {
    const { showEditorSidebar, selectedRecord, operationType } = this.state;
    const { LookupHomeStore, form: { resetFields } } = this.props;
    return (
      <LookUpEditor
        visible={showEditorSidebar}
        operationType={operationType}
        record={selectedRecord}
        reset={resetFields}
        createRef={(node) => {
          this.lookupEditor = node;
        }}
        onCancel={(hasChange) => {
          const { intl } = this.props;
          if (hasChange) {
            confirm({
              title: LookupHomeStore.languages[`${intlPrefix}.editor.confirmClose`],
              onOk: () => {
                this.setState({
                  showEditorSidebar: false,
                });
              },
              okText: LookupHomeStore.languages[`${intlPrefix}.editor.confirmText.ok`],
              cancelText: LookupHomeStore.languages[`${intlPrefix}.editor.confirmText.cancel`],
            });
          } else {
            this.setState({
              showEditorSidebar: false,
            });
            // this.loadCodes();
          }
        }}

        store={LookupHomeStore}
        handleRefresh={this.handleRefresh}
      />
    );
  };

  /**
   *  渲染表格
   */
  renderTable = () => {
    const { LookupHomeStore } = this.props;
    const { dataLoading, pagination, filters } = this.state;
    const { organizationId, type } = this.props.AppState.currentMenuType;
    const columns = [ //  定义表格列

      {
        title: LookupHomeStore.languages[`${intlPrefix}.codeType`],
        dataIndex: 'type',
        key: 'type',
        filters: [],
        hidden: type != 'organization',
        sorter: true,
        render: (value, record) => {
          if (value == 1) {
            return <span>{LookupHomeStore.languages[`${intlPrefix}.tenant.code`]}</span>;
          } else {
            return <span>{LookupHomeStore.languages[`${intlPrefix}.project.document.code`]}</span>;
          }
        },
      },
      {
        title: LookupHomeStore.languages[`${intlPrefix}.code`],
        dataIndex: 'lookupTypeCode',
        key: 'lookupTypeCode',
        filters: [],
        render: (value, record) => {
          if (record.isEnabled === 'Y') {
            return <a onClick={this.handleEdit.bind(this, record)}>{value}</a>;
          } else {
            return <span>{value}</span>;
          }
        },
      },
      {
        title: LookupHomeStore.languages[`${intlPrefix}.description`],
        dataIndex: 'description',
        key: 'description',
        filters: [],
      },
      {
        title: LookupHomeStore.languages[`${intlPrefix}.status`],
        dataIndex: 'isEnabled',
        key: 'isEnabled',
        filters: [
          {
            text: LookupHomeStore.languages.enableY,
            value: 'Y',
          },
          {
            text: LookupHomeStore.languages.disableN,
            value: 'N',
          },
        ],
        render: val => (val === 'Y' ? LookupHomeStore.languages.enableY : LookupHomeStore.languages.disableN),
      },
      {
        title: LookupHomeStore.languages.project,
        dataIndex: 'projectName',
        key: 'projectName',
        hidden: type != 'organization',
        filters: [],
        render: (value, record) => <span>{value}</span>,
      },
      {
        title: LookupHomeStore.languages[`${intlPrefix}.receipts`],
        dataIndex: 'categoryName',
        key: 'categoryCode',
        hidden: type != 'organization',
        filters: [],
        render: (value, record) => <span>{value}</span>,
      },
      {
        title: LookupHomeStore.languages.operation,
        key: 'action',
        align: 'left',
        fixed: 'right',
        width: '120px',
        render: (text, record) => (
          <div>
            <Tooltip
              title={LookupHomeStore.languages.modify}
              placement="bottom"
            >
              <Button
                size="small"
                icon="bianji-"
                shape="circle"
                style={{ cursor: 'pointer', color: '#2196F3' }}
                onClick={this.handleEdit.bind(this, record)}
              />
            </Tooltip>
            {record.isEnabled === 'Y' ? (
              <Tooltip
                title={LookupHomeStore.languages.disableN}
                placement="bottom"
              >
                <Button
                  icon="jinyongzhuangtai"
                  style={{ cursor: 'pointer' }}
                  shape="yijieshu"
                  size="small"
                  onClick={this.handleDisable.bind(this, record)}
                />
              </Tooltip>
            ) : (
              <Tooltip
                title={LookupHomeStore.languages.enableY}
                placement="bottom"
              >
                <Button
                  icon="yijieshu"
                  shape="circle"
                  style={{ cursor: 'pointer', color: '#2196F3' }}
                  size="small"
                  onClick={this.handleEnable.bind(this, record)}
                />
              </Tooltip>
            )}
          </div>
        ),
      },

    ];

    return (
      <Table
        columns={columns}
        dataSource={this.dataSource}
        rowSelection={this.rowSelection}
        loading={dataLoading}
        pagination={pagination}
        onChange={this.handlePageChange.bind(this)}
      />
    );
  };

  /**
   *  渲染按钮组
   */
  renderButtonGroup = () => (
    <div>
      <Button
        style={{ color: '#04173F' }}
        onClick={this.handleAddLookup.bind(this)}
      >
        <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
        {this.props.LookupHomeStore.languages[`${intlPrefix}.header.create`]}
      </Button>
      <Button
        style={{ color: '#04173F' }}
        onClick={this.handleDeleteLookups.bind(this)}
      >
        <Icon type="shanchu" style={{ color: '#2196F3', width: 25 }} />
        {this.props.LookupHomeStore.languages.delete}
      </Button>

    </div>
  );

  render() {
    const { LookupHomeStore } = this.props;
    return (
      <Page>
        <Header title={LookupHomeStore.languages[`${intlPrefix}.header.title`]}>
          {this.renderButtonGroup()}
        </Header>
        <Content>
          {this.renderTable()}
          {this.renderEditorSidebar()}
        </Content>
      </Page>
    );
  }
}

LookupHome.propTypes = {};

export default LookupHome;
