/*
* @description:报错信息页面
* @author：张凯强
* @update 2018-09-18 16:33
*/
import React, { Component } from 'react';
import { Table, Button, Popover, Form, Modal, Checkbox, Icon, Tooltip } from 'yqcloud-ui';
import { inject, observer } from 'mobx-react';
import { Page, Header, Content } from 'yqcloud-front-boot';
import { injectIntl } from 'react-intl';

//  导入自定义侧边栏组件
import { withRouter } from 'react-router-dom';
import MessageEditor from '../messageEditor';
import MessageStore from '../../../../stores/organization/message/MessageStore';

const { confirm } = Modal;
const intlPrefix = 'organization.message';

@inject('AppState')
@observer
class MessageHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      showEditorSidebar: false, //  显示编辑侧边栏
      operationType: 'create', //  操作类型
      selectedRecord: {}, //  存放点击编辑按钮的记录
      dataSource: [], //  数据源，放在state中，数据改变后可自动重新渲染
      showPopover: false, //  控制弹窗的显示与隐藏
      deleteVisible: false,
      edit: false, // 编辑状态
      selectedData: '', // 所有的数据项
      selectedRowKeys: [],
      deleteValueAll: [],
      confirmDeleteLoading: false,
      sort: '',
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
    };
  }

  componentWillMount() {
    this.fetch(this.props);
  }

  componentDidMount() {
    // 第一次加载报错信息数据
    this.loadCodes();
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    if (this.props.AppState.currentMenuType.type === 'site') {
      MessageStore.queryLanguage(0, AppState.currentLanguage);
    } else {
      MessageStore.queryLanguage(id, AppState.currentLanguage);
    }
  };

  fetch() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    MessageStore.getPlacements(organizationId);
    MessageStore.getIsEnabled();
  }

  placementState=(values) => {
    const typeLists = MessageStore.getPlacement;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  // 生效快码
  enabledState = (values) => {
    const enabled = MessageStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  // 值集分页加载
  loadCodes = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    MessageStore.loadCodeInfo(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      // 将后台获取的分页信息手动set表格里
      MessageStore.setCodeList(data.content);
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
      });
    })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
      );
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

  //  根据id请求数据
  loadCodeById = () => MessageStore.loadCodeById(1);

  // 创建
  showModal = () => {
    this.setState({
      showEditorSidebar: true,
      edit: false,
      operationType: 'create',
    });
  };

  // 编辑
  onEdit = (record) => {
    this.setState({
      showEditorSidebar: true,
      selectedData: record.messageId,
      edit: true,
      operationType: 'modify',
    });
  };

  // 启用
  onEnable = (record) => {
    MessageStore.enableMessage(record)
      .then(() => {
        //  取消显示popover
        record.showPopover = false;
        this.setState({
          showPopover: false,
        });
        this.loadCodes();
      });
  };

  // 禁用
  onDisable = (record) => {
    MessageStore.disableMessage(record)
      .then(() => {
        //  取消显示popover
        record.showPopover = false;
        this.setState({
          showPopover: false,
        });
        this.loadCodes();
      });
  };

  //  渲染编辑按钮
  renderEdit = (record) => {
    //  定义泡泡弹出框的内容
    const content = (
      <div>
        <Button style={{ display: 'block' }} onClick={this.onEdit.bind(this, record)}>
          {MessageStore.languages.edit}
        </Button>
        <Button style={{ display: 'block' }} onClick={this.onDisable.bind(this, record)}>
          {MessageStore.languages[`${intlPrefix}.disable`]}
        </Button>
        <Button style={{ display: 'block' }} onClick={this.onEnable.bind(this, record)}>
          {MessageStore.languages[`${intlPrefix}.enable`]}
        </Button>
      </div>
    );

    //  获取状态信息
    const { showPopover } = this.state;

    return (
      <Popover
        placement="right"
        content={content}
        trigger="click"
        visible={record.showPopover}
        onVisibleChange={(visible) => {
          record.showPopover = visible;
          this.setState({
            showPopover: visible,
          });
        }}
      >
        <Button
          size="small"
        >
          ...
        </Button>
      </Popover>
    );
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
    const { deleteValueAll, selectedRowKeys } = this.state;
    const { intl } = this.props;
    /* eslint-disable */
    const data = deleteValueAll;
    // console.log(selectedRowKeys)
    const messageIds = [];
    data.forEach((val) => {
      messageIds.push(val.messageId);
    });

    MessageStore.deleteMessage(
      messageIds,
    ).then((data) => {
      this.setState({
        deleteVisible: false,
        confirmDeleteLoading: false,
        selectedRowKeys: [],
        deleteValueAll: [],
      });
      this.handleRefresh();
      Choerodon.prompt(MessageStore.languages[ `${intlPrefix}.action.delete.msg`]);
    });
  }

  // 取消删除按钮
  handleDeleteCancel = () => {
    this.setState({
      deleteVisible: false,
    });
  }
  //  处理数据变化后的更新
  handleRefresh = () => {
    this.loadCodes();
    this.setState({
      showEditorSidebar: false,
    });
  };

  render() {
    const { showEditorSidebar, selectedRecord, operationType, selectedData, edit ,selectedRowKeys, dataSource, pagination} = this.state;
    //  获取store
    const { intl, form: { resetFields } } = this.props;
    const placement = MessageStore.getPlacement;
    const enabled = MessageStore.getEnabled;
    //  定义表格列
    let data = [];
    if (MessageStore.getCodeList) {
      data = MessageStore.codeList.slice();
      data.map((v) => {
        v.key = v.messageId;
      });
    }
    const columns = [
      {
        title: MessageStore.languages[`${intlPrefix}.messageCode`],
        dataIndex: 'messageCode',
        key: 'messageCode',
        filters: [],
        onFilter: (messageCode, record) => record.messageCode.indexOf(messageCode) !== -1,
        render: (value, record) => <a onClick={this.onEdit.bind(this, record)}>{value}</a>,
      },
      {
        title: MessageStore.languages[`${intlPrefix}.content`],
        dataIndex: 'content',
        key: 'content',
        filters: [],
        onFilter: (content, record) => record.content.indexOf(content) !== -1,
      },
      {
        title: MessageStore.languages[`${intlPrefix}.placement`],
        code: 'placement',
        dataIndex: 'placement',
        width: 100,
        key: 'placement',
        onFilter: (placement, record) => record.placement.indexOf(placement) !== -1,
        filters: [
          {
            text: MessageStore.languages[ `${intlPrefix}.topLeft`],
            value: 'topLeft',
          },
          {
            text: MessageStore.languages[ `${intlPrefix}.top`],
            value: 'top',
          },
          {
            text: MessageStore.languages[ `${intlPrefix}.topRight`],
            value: 'topRight',
          },
          {
            text: MessageStore.languages[ `${intlPrefix}.left`],
            value: 'left',
          },
          {
            text: MessageStore.languages[ `${intlPrefix}.right`],
            value: 'right',
          },
          {
            text: MessageStore.languages[ `${intlPrefix}.leftBottom`],
            value: 'leftBottom',
          },
          {
            text: MessageStore.languages[ `${intlPrefix}.bottom`],
            value: 'bottom',
          },
          {
            text: MessageStore.languages[ `${intlPrefix}.rightBottom`],
            value: 'rightBottom',
          },
        ],
        render: (text, record) => this.placementState(record.placement),
      },
      {
        title: MessageStore.languages[`${intlPrefix}.type`],
        dataIndex: 'type',
        key: 'type',
        width: 100,
        filters: [],
        onFilter: (type, record) => record.type.indexOf(type) !== -1,
      },
      {
        title: MessageStore.languages[`${intlPrefix}.status`],
        dataIndex: 'isEnabled',
        key: 'isEnabled',
        width: 100,
        filters: [
          {
            text: '启用',
            value: 'Y',
          },
          {
            text: '禁用',
            value: 'N',
          },
        ],
        onFilter: (value, record) => record.isEnabled === value,
        render: (values, record) => this.enabledState(record.isEnabled),
      },
      {
        title: MessageStore.languages["operation"],
        key: 'action',
        align: 'left',
        width: '120px',
        render: (text, record) => (
          <div>
            <Tooltip
              title={MessageStore.languages["modify"]}
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
                title={MessageStore.languages["disable"]}
                placement="bottom"
              >
                <Button
                  icon="jinyongzhuangtai"
                  style={{ cursor: 'pointer' }}
                  shape="circle"
                  size="small"
                  onClick={this.onDisable.bind(this, record)}
                />
              </Tooltip>
            ) : (
              <Tooltip
                title={MessageStore.languages["enable"]}
                placement="bottom"
              >
                <Button
                  icon="yijieshu"
                  shape="circle"
                  style={{ cursor: 'pointer', color: '#2196F3' }}
                  size="small"
                  onClick={this.onEnable.bind(this, record)}
                />
              </Tooltip>)}
          </div>),
      },
    ];

    // 控制复选框
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        this.setState({ selectedRowKeys, deleteValueAll: selectedRows });// 将valueAll全部的值赋值给selectedRowKeys
      },
      selectedRowKeys,
    };
    return (
      <Page>
        <Header title={MessageStore.languages[`${intlPrefix}.header.title`]}>
          <Button
            onClick={() => this.showModal()}
            style={{ color: '#04173F' }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {MessageStore.languages[`${intlPrefix}.header.create`]}
          </Button>
          <Button
            onClick={this.handleDelete}
            style={{ color: '#04173F' }}
          >
            <Icon type="shanchu" style={{ color: '#2196F3', width: 25 }} />
            {MessageStore.languages["delete"]}
          </Button>
        </Header>
        <Content >
          <Table
            columns={columns}
            dataSource={dataSource}
            rowSelection={rowSelection}
            loading={MessageStore.isLoading}
            pagination={pagination}
            onChange={this.handlePageChange.bind(this)}
          />

          <MessageEditor
            visible={showEditorSidebar}
            operationType={operationType}
            selectedData={selectedData}
            edit={edit}
            record={selectedRecord}
            reset={resetFields}
            createRef={(node) => {
              this.MessageEditor = node;
            }}
            onCancel={(hasChange) => {
              const { intl } = this.props;
              if (hasChange) {
                confirm({
                  title: MessageStore.languages[ `${intlPrefix}.editor.confirmClose`],
                  onOk: () => {
                    this.setState({
                      showEditorSidebar: false,
                    });
                  },
                });
              } else {
                this.setState({
                  showEditorSidebar: false,
                });
              }
            }}
            store={MessageStore}
            handleRefresh={this.handleRefresh}
          />
          <Modal
            title={MessageStore.languages[ `${intlPrefix}.delete.model`]}
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

export default Form.create({})(withRouter(injectIntl(MessageHome)));
