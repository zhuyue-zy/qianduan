/**
 * Create By liuchuan on 2018/9/10.
 */
import React, { Component } from 'react';
import { Form, Select, Checkbox, Button, Modal, Table } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import AssginEmployeeStore from '../../../../stores/organization/employee/assginEmployee';
import ChoosePosition from './ChoosePosition';

const intlPrefix = 'organization.employee';

const { Sidebar } = Modal;

function noop() {
}

@inject('AppState')
@observer
class AssignEmployee extends Component {
  state = this.getInitState();

  componentWillMount() {
    this.props.onRef(this);
    this.fetch(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.visibleAssign) {
      nextProps.form.resetFields();
      this.setState(this.getInitState());
    } else if (!this.props.visibleAssign) {
      this.fetch(nextProps);
    }
  }

  getInitState() {
    return {
      filters: {},
      selectedRowKeys: [],
      selectedRows: [],
      visible: false,
      employeeId: '',
      submitting: false,
      deleteVisible: false,
      confirmDeleteLoading: false,
      data: [],
      oldData: [],
    };
  }

  getEmployeePostionById(organizationId, id) {
    AssginEmployeeStore.getEmployeePostionById(organizationId, id)
      .then((data) => {
        if (data) {
          data.map((v) => {
            v.key = v.positionId;
            return v;
          });
          this.setState({
            data,
          });

          const oldData = [];
          data.forEach((v) => {
            oldData.push({ ...v });
          });
          this.setState({
            oldData,
          });
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  fetch(props) {
    const { AppState, id } = props;
    const { id: organizationId } = AppState.currentMenuType;
    this.getEmployeePostionById(organizationId, id);
    this.setState({
      employeeId: id,
    });
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    AssginEmployeeStore.queryLanguage(id, AppState.currentLanguage);
  }

  handleDelete = () => {
    this.setState({
      deleteVisible: true,
    });
  }

  handleDeleteOk = () => {
    this.setState({
      confirmDeleteLoading: true,
    });
    const { selectedRowKeys, selectedRows, employeeId } = this.state;
    const { AppState, intl } = this.props;
    const { id } = AppState.currentMenuType;
    AssginEmployeeStore.deletePositionById(
      id,
      [...selectedRows],
    ).then((data) => {
      if (!data.failed) {
        this.setState({
          deleteVisible: false,
          confirmDeleteLoading: false,
          selectedRowKeys: [],
          selectedRows: [],
        });
        this.handleRefresh();
        Choerodon.prompt(AssginEmployeeStore.languages[`${intlPrefix}.action.delete.msg`]);
      } else {
        this.setState({
          deleteVisible: false,
          confirmDeleteLoading: false,
          selectedRowKeys: [],
          selectedRows: [],
        });
        this.handleRefresh();
        Choerodon.prompt(data.message);
      }
    }).catch((e) => {
      this.setState({
        deleteVisible: false,
        confirmDeleteLoading: false,
        selectedRowKeys: [],
        selectedRows: [],
      });
      this.handleRefresh();
      Choerodon.prompt(e.toString());
    });
  }


  handleDeleteCancel = () => {
    this.setState({
      deleteVisible: false,
    });
  }

  handleSubmit = (e) => {
    e.preventDefault();

    const { AppState, id, intl, onSuccess = noop, onSubmit = noop } = this.props;
    onSubmit();
    const { id: organizationId } = AppState.currentMenuType;
    const { data } = this.state;
    const dataLen = data.filter(v => v.isPrimaryPosition === 'Y').length;
    if (dataLen === 1 || data.length === 0) {
      AssginEmployeeStore.updateEmployeeePosition(organizationId, data)
        .then(() => {
          Choerodon.prompt(AssginEmployeeStore.languages['modify.success']);
          this.handleRefresh();
          onSuccess();
        })
        .catch((error) => {
          Choerodon.handleResponseError(error);
        });
    } else {
      AssginEmployeeStore.getCode('set.mainPost');
      onSuccess();
    }
  }


  handleCancel = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    const { oldData, data } = this.state;
    let judge = false;
    data.some((v, i) => {
      if (oldData[i].isEnabled !== v.isEnabled || oldData[i].isPrimaryPosition !== v.isPrimaryPosition) {
        judge = true;
        return true;
      }
      return false;
    });
    if (judge) {
      Modal.confirm({
        title: AssginEmployeeStore.languages[`${intlPrefix}.cancel.title`],
        content: AssginEmployeeStore.languages[`${intlPrefix}.cancel.content`],
        onOk: () => (
          OnCloseModel()
        ),
      });
    } else {
      OnCloseModel();
    }
  }

  handleRefresh() {
    const { AppState, id } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    this.getEmployeePostionById(organizationId, id);
    this.setState({
      selectedRowKeys: [],
      selectedRows: [],
    });
  }

  openNewPage = () => {
    this.setState({
      visible: true,
    });
  }

  renderColumns(defaultChecked, record, column) {
    return (
      <div>
        <Checkbox
          style={{ margin: '-5px 0' }}
          checked={defaultChecked}
          onChange={e => this.handleChange(e.target.checked, record.key, column)}
        />
      </div>
    );
  }

  handleChange(value, key, column) {
    const newData = [...this.state.data];
    const target = newData.filter(item => key === item.key)[0];
    if (column === 'isPrimaryPosition') {
      newData.forEach((v) => {
        v.isPrimaryPosition = 'N';
      });
    }
    if (target) {
      target[column] = value ? 'Y' : 'N';
      this.setState({
        data: newData,
      });
    }
  }

  renderAssignEmployee() {
    const { filters, selectedRowKeys, data } = this.state;
    const { intl } = this.props;
    const columns = [
      {
        title: AssginEmployeeStore.languages[`${intlPrefix}.position.name`],
        dataIndex: 'positionName',
        key: 'positionName',
      },
      {
        title: AssginEmployeeStore.languages[`${intlPrefix}.position.isprimaryposition`],
        dataIndex: 'isPrimaryPosition',
        key: 'isPrimaryPosition',
        render: (text, record) => this.renderColumns(text === 'Y', record, 'isPrimaryPosition'),
      },
      {
        title: AssginEmployeeStore.languages[`${intlPrefix}.position.isenabled`],
        dataIndex: 'isEnabled',
        key: 'isEnabled',
        render: (text, record) => this.renderColumns(text === 'Y', record, 'isEnabled'),
      },
    ];

    const rowSelection = {
      onChange: (v, selectedRows) => {
        this.setState({ selectedRowKeys: v, selectedRows });
      },
      selectedRowKeys,
    };

    return (
      <Table
        size="middle"
        dataSource={data}
        columns={columns}
        loading={AssginEmployeeStore.isLoading}
        rowSelection={rowSelection}
      />
    );
  }

  renderNewAssignSideBar() {
    const { visible, employeeId } = this.state;
    return (
      <ChoosePosition
        employeeId={employeeId}
        visible={visible}
        onRef={(node) => {
          this.choosePosition = node;
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
          this.handleRefresh();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
        OnCloseModel={() => {
          this.setState({
            visible: false,
          });
        }}
        havePrimaryPosition={this.state.data.length > 0}
      />
    );
  }

  render() {
    const { AppState, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const { selectedRowKeys, visible, submitting } = this.state;

    return (
      <Content
        className="sidebar-content"
      >
        <div>
          <Button
            onClick={this.openNewPage}
            icon="playlist_add"
          >
            {AssginEmployeeStore.languages[`${intlPrefix}.action.new`]}
          </Button>

          <Button
            onClick={this.handleDelete}
            disabled={selectedRowKeys.length < 1}
            icon="delete"
          >
            {AssginEmployeeStore.languages["delete"]}
          </Button>

          <Button
            onClick={this.handleRefresh.bind(this)}
            icon="refresh"
          >
            {AssginEmployeeStore.languages.refresh}
          </Button>
        </div>
        {this.renderAssignEmployee()}

        {/* 员工分配岗位 */}
        <Sidebar
          title={AssginEmployeeStore.languages[`${intlPrefix}.action.selectposition`]}
          visible={visible}
          okText={AssginEmployeeStore.languages.save}
          cancelText={AssginEmployeeStore.languages.cancel}
          onOk={e => this.choosePosition.handleSubmit(e)}
          onCancel={(e) => {
            this.choosePosition.handleCancel(e);
          }}
          confirmLoading={submitting}
        >
          {
            this.renderNewAssignSideBar()
          }
        </Sidebar>
        <Modal
          title={AssginEmployeeStore.languages[`${intlPrefix}.action.delete.model`]}
          visible={this.state.deleteVisible}
          onOk={this.handleDeleteOk}
          onCancel={this.handleDeleteCancel}
          confirmLoading={this.state.confirmDeleteLoading}
          center
        >
          <p>{AssginEmployeeStore.languages[`${intlPrefix}.action.delete.model`]}</p>
        </Modal>
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(AssignEmployee)));
