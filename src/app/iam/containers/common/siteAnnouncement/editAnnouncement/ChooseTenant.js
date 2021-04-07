import React, { Component } from 'react';
import { Form, Input, Select, Table, Modal, DatePicker, Checkbox } from 'yqcloud-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import AnnouncementStore from '../../../../stores/globalStores/siteAnnouncement';

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
      ValueAll: [],
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

  handlePostCancel = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    const { selectedRowKeys, ValueAll } = this.state;
    if (selectedRowKeys.length > 0) {
      Modal.confirm({
        title: intl.formatMessage({ id: `${intlPrefix}.cancel.title` }),
        content: intl.formatMessage({ id: `${intlPrefix}.cancel.content` }),
        onOk: () => (
          OnCloseModel()
        ),
      });
    } else {
      OnCloseModel();
    }
  }

  getAllEmployeePostionById(organizationId, id) {
    AnnouncementStore.getEmployeePostions(organizationId, id)
      .then((data) => {
        if (data) AnnouncementStore.setAllPostions(data);
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  fetch(props) {
    const { AppState, employeeId } = props;
    const { id: organizationId } = AppState.currentMenuType;
    this.getAllEmployeePostionById(organizationId, employeeId);
  }

  // 渲染选择主岗位
  renderColumns(defaultChecked, record, column) {
    return (
      <div>
        <Checkbox
          disabled
          style={{ margin: '-5px 0' }}
          checked={defaultChecked}
          // onChange={e => this.handleChange(e.target.checked, record.key, column)}
        />
      </div>
    );
  }

  handlePostSubmit = (e) => {
    e.preventDefault();
    const { selectedRowKeys, ValueAll } = this.state;
    const { AppState, intl, employeeId, onSuccess = noop, OnUnchangedSuccess = noop, havePrimaryPosition } = this.props;
    if (selectedRowKeys.length > 0) {
      const { id: organizationId } = AppState.currentMenuType;
      const position = selectedRowKeys.map((v, i) => ({
        iamOrganizationId: organizationId,
        employeeId,
        positionId: v,
        isPrimaryPosition: ValueAll[i].managerPosition == true ? 'Y' : 'N',
      }));
      AnnouncementStore.createEmployeeePosition(organizationId, position)
        .then((data) => {
          Choerodon.prompt(intl.formatMessage({ id: 'modify.success' }));
          onSuccess();
        })
        .catch((error) => {
          Choerodon.handleResponseError(error);
        });
    } else {
      Choerodon.prompt(intl.formatMessage({ id: 'modify.success' }));
      OnUnchangedSuccess();
    }
  };

  renderAssignEmployee() {
    const { filters, selectedRowKeys } = this.state;
    const { intl } = this.props;
    const columns = [
      {
        title: intl.formatMessage({ id: `${intlPrefix}.position.positioncode` }),
        dataIndex: 'positionCode',
        key: 'positionCode',
      },
      {
        title: intl.formatMessage({ id: `${intlPrefix}.position.positionname` }),
        dataIndex: 'positionName',
        key: 'positionName',
      },
      {
        title: intl.formatMessage({ id: `${intlPrefix}.position.isprimaryposition` }),
        dataIndex: 'managerPosition',
        key: 'managerPosition',
        render: (text, record) => this.renderColumns(text === true, record, 'managerPosition'),

      },
      {
        title: intl.formatMessage({ id: `${intlPrefix}.position.description` }),
        dataIndex: 'description',
        key: 'description',

      },
      {
        title: intl.formatMessage({ id: `${intlPrefix}.position.organizationname` }),
        dataIndex: 'organizationName',
        key: 'organizationName',
      },
    ];

    const rowSelection = {
      onChange: (v, valAll) => {
        this.setState({ selectedRowKeys: v, ValueAll: valAll });
      },
      selectedRowKeys,
    };

    let data = [];
    if (AnnouncementStore.getAllPostions) {
      data = AnnouncementStore.allPostions.slice();
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
