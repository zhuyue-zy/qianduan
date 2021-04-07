import React, { Component } from 'react';
import { Form, Input, Select, Table, Modal, DatePicker } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import AssginEmployeeStore from '../../../../stores/organization/employee/assginEmployee';
import CreateEmployeeStore from '../../../../stores/organization/employee/createEmployee/CreateEmployeeStore';

const intlPrefix = 'organization.employee';

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
    if (!nextProps.visible) {
      nextProps.form.resetFields();
      this.setState(this.getInitState());
    } else if (!this.props.visible) {
      this.fetch(nextProps);
    }
  }

  getInitState() {
    return {
      rePasswordDirty: false,
      selectedRowKeys: [],
      dataSourceRole: [],
      visible: false,
      page: 0,
      isLoading: true,
      params: [],
      filters: {},
      roleValueAll: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: '',
      },
      pagination_role: {
        current: 1,
        pageSize: 10,
        total: '',
      },
    };
  }

  handlePostCancel = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length > 0) {
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

  // 加载角色
  getAllEmployeePostionById(organizationId, employeeId) {
    AssginEmployeeStore.loadRoleUn(organizationId,  this.props.employeeId || 0)
      .then((data) => {
        CreateEmployeeStore.setRoles(data.content);
        this.setState({
          dataSourceRole: data,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  fetch(props) {
    const { AppState, employeeId } = props;
    const { id: organizationId } = AppState.currentMenuType;
    this.getAllEmployeePostionById(organizationId, employeeId);
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    AssginEmployeeStore.queryLanguage(id, AppState.currentLanguage);
  };

  handleRoleSubmit = (e) => {
    e.preventDefault();
    const { selectedRowKeys, roleValueAll } = this.state;
    const roleIdObj = [];
    const { AppState, intl, employeeId, onSuccess = noop, OnUnchangedSuccess = noop, havePrimaryPosition } = this.props;
    this.props.handleChildCheckRole(selectedRowKeys, roleValueAll);
    onSuccess();
  };

  renderAssignEmployee() {
    const { filters, selectedRowKeys, dataSourceRole } = this.state;
    const { intl } = this.props;
    const columns = [
      {
        title: AssginEmployeeStore.languages[`${intlPrefix}.role.name`],
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: AssginEmployeeStore.languages[`${intlPrefix}.role.description`],
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: AssginEmployeeStore.languages[`${intlPrefix}.role.addtime`],
        dataIndex: 'creationDate',
        key: 'creationDate',
      },
    ];

    const rowSelection = {
      onChange: (selectedRowKeys, valAll) => {
        this.setState({ selectedRowKeys, roleValueAll: valAll });// 将valueAll全部的值赋值给selectedRowKeys
      },
      selectedRowKeys,
    };

    let data = [];
    if (AssginEmployeeStore.getAllRoles) {
      data = AssginEmployeeStore.allPostions.slice();
      data.map((v) => {
        v.key = v.positionId;
        return v;
      });
    }

    return (
      <Table
        size="middle"
        columns={columns}
        pagination
        dataSource={dataSourceRole}
        rowSelection={rowSelection}
        rowKey={recode =>recode.id}
      />
    );
  }

  render() {
    return (
      <Content
        className="sidebar-content"
      >
        {this.renderAssignEmployee()}
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(AssignEmployee)));
