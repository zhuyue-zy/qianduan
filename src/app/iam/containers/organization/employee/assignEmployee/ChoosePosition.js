/**
 * Create By liuchuan on 2018/9/10.
 */
import React, { Component } from 'react';
import { Form, Input, Select, Table, Modal, DatePicker } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import AssginEmployeeStore from '../../../../stores/organization/employee/assginEmployee';

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
      visible: false,
      page: 0,
      isLoading: true,
      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 10,
        total: '',
      },
    };
  }

  handleCancel = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    const { selectedRowKeys } = this.state;
    if (selectedRowKeys.length > 0) {
      Modal.confirm({
        title: AssginEmployeeStore.languages[ `${intlPrefix}.cancel.title`],
        content: AssginEmployeeStore.languages[ `${intlPrefix}.cancel.content`],
        onOk: () => (
          OnCloseModel()
        ),
      });
    } else {
      OnCloseModel();
    }
  }

  getAllEmployeePostionById(organizationId) {
    AssginEmployeeStore.getEmployeePostions(organizationId)
      .then((data) => {
        if (data) AssginEmployeeStore.setAllPostions(data);
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  fetch(props) {
    const { AppState, employeeId } = props;
    const { id: organizationId } = AppState.currentMenuType;
    this.getAllEmployeePostionById(organizationId);
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    AssginEmployeeStore.queryLanguage(id, AppState.currentLanguage);
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { selectedRowKeys } = this.state;
    const { AppState, intl, employeeId, onSuccess = noop, OnUnchangedSuccess = noop, havePrimaryPosition } = this.props;
    if (selectedRowKeys.length > 0) {
      const { id: organizationId } = AppState.currentMenuType;
      const position = selectedRowKeys.map((v, i) => {
        if (!havePrimaryPosition && i === 0) {
          return {
            iamOrganizationId: organizationId,
            employeeId,
            positionId: v,
            isPrimaryPosition: 'Y',
          };
        } else {
          return {
            iamOrganizationId: organizationId,
            employeeId,
            positionId: v,
            isPrimaryPosition: 'N',
          };
        }
      });
      AssginEmployeeStore.createEmployeeePosition(organizationId, position)
        .then((data) => {
          Choerodon.prompt(AssginEmployeeStore.languages[ 'modify.success']);
          onSuccess();
        })
        .catch((error) => {
          Choerodon.handleResponseError(error);
        });
    } else {
      Choerodon.prompt(AssginEmployeeStore.languages[ 'modify.success']);
      OnUnchangedSuccess();
    }
  };

  renderAssignEmployee() {
    const { filters, selectedRowKeys } = this.state;
    const { intl } = this.props;
    const columns = [
      {
        title: AssginEmployeeStore.languages[ `${intlPrefix}.position.positioncode`],
        dataIndex: 'positionCode',
        key: 'positionCode',
      },
      {
        title: AssginEmployeeStore.languages[ `${intlPrefix}.position.positionname`],
        dataIndex: 'positionName',
        key: 'positionName',
      },
      {
        title: AssginEmployeeStore.languages[ `${intlPrefix}.position.description`],
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: AssginEmployeeStore.languages[ `${intlPrefix}.position.organizationname`],
        dataIndex: 'organizationName',
        key: 'organizationName',
      },
    ];

    const rowSelection = {
      onChange: (v) => {
        this.setState({ selectedRowKeys: v });
      },
      selectedRowKeys,
    };

    let data = [];
    if (AssginEmployeeStore.getAllPostions) {
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
        dataSource={data}
        rowSelection={rowSelection}
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
