import React, { Component } from 'react';
import { Form, Input, Modal, Select, Table, Collapse, Popconfirm, Tooltip, Button, Icon, Card } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Permission } from 'yqcloud-front-boot';
import OrganizationStore from '../../../../stores/organization/organizationManagement';
import './index.scss';

const FormItem = Form.Item;
const { Option } = Select;
const { Panel } = Collapse;
const intlPrefix = 'organization.management';
const intlPrefixEmp = 'organization.employee';

const inputWidth = 512; // input框的长度
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 100 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 10 },
  },
};

function noop() {
}

@inject('AppState')
@observer
class EditOrganization extends Component {
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
      showMainVisible: false,
      rePasswordDirty: false,
      organizationInfo: {},
      dataEmpPosition: [],
      selectedRowKeys: [],
      ValueAll: [],
      empPositionId: '',
      pagination: {
        current: 1,
        pageSize: 8,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
    };
  }

  fetch(props) {
    const { AppState, edit, id } = props;
    const { id: tenantId } = AppState.currentMenuType;
    OrganizationStore.loadOrganizationList(tenantId);
    if (edit) {
      this.getOrganizationInfoById(tenantId, id);
      OrganizationStore.getPosInfo(tenantId, id);
      this.handleShowModal();
    }
  }

  getOrganizationInfoById = (tenantId, id) => {
    OrganizationStore.getOrganizationInfoById(tenantId, id)
      .then((data) => {
        this.setState({
          organizationInfo: data,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  checkOrganizationName = (rule, name, callback) => {
    const { edit, AppState, intl } = this.props;
    if (!edit || name !== this.state.organizationInfo.organizationName) {
      if (/\s/.test(name)) {
        callback(OrganizationStore.languages[`${intlPrefix}.name.space.msg`]);
        return;
      }
      const { id } = AppState.currentMenuType;
      OrganizationStore.checkOrganizationName(id, name).then(({ failed }) => {
        if (failed) {
          callback(OrganizationStore.languages[`${intlPrefix}.name.exist.msg`]);
        } else {
          callback();
        }
      });
    } else {
      callback();
    }
  };


  handleCancel = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        OnCloseModel();
      } else {
        Modal.confirm({
          title: OrganizationStore.languages[`${intlPrefix}.cancel.title`],
          content: OrganizationStore.languages[`${intlPrefix}.cancel.content`],
          okText: OrganizationStore.languages.confirm,
          cancelText: OrganizationStore.languages.cancel,
          onOk: () => (
            OnCloseModel()
          ),
        });
      }
    });
  }

  /**
   * 提交表单
   * @param
   */
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!err) {
        const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
        const menuType = AppState.currentMenuType;
        const tenantId = menuType.id;
        onSubmit();
        if (edit) {
          if (!modify) {
            Choerodon.prompt(OrganizationStore.languages['modify.success']);
            OnUnchangedSuccess();
            return;
          }
          const { organizationInfo } = this.state;
          const { organizationId, objectVersionNumber } = organizationInfo;
          const parentOrganizationId = data.parentOrganizationId ? data.parentOrganizationId : 0;
          OrganizationStore.updateOrganization(tenantId, {
            organizationId,
            ...data,
            objectVersionNumber,
            parentOrganizationId,
          }).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(OrganizationStore.languages['modify.success']);
              onSuccess();
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else {
          OrganizationStore.createOrganization(tenantId, data).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(OrganizationStore.languages['create.success']);
              onSuccess();
            }
          }).catch((error) => {
            onError();
            Choerodon.handleResponseError(error);
          });
        }
      }
    });
  };

  /**
   * 选择是否为主管岗位
   * @param
   */
  handleManagerPosition = (record) => {
    const { organizationInfo } = this.state;
    const { AppState, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const tenantId = menuType.id;
    if (record.isManagerPosition) {
      // 取消主管岗位
      // debugger;
    } else {
      const { objectVersionNumber } = this.state.organizationInfo;
      OrganizationStore.handleManagerPosition(tenantId, organizationInfo.organizationId, record.positionId, objectVersionNumber).then(() => {
        Choerodon.prompt(OrganizationStore.languages['modify.success']);
        OrganizationStore.getPosInfo(tenantId, organizationInfo.organizationId);
        this.fetch(this.props);
      }).catch((error) => {
        Choerodon.prompt(OrganizationStore.languages['modify.success']);
        Choerodon.handleResponseError(error);
      });
    }
  }

  checkOrganizationCode = (rule, code, callback) => {
    const { edit, AppState, intl } = this.props;
    if (!edit || code !== this.state.organizationInfo.organizationCode) {
      if (/\s/.test(code)) {
        callback(OrganizationStore.languages[`${intlPrefix}.code.space.msg`]);
        return;
      }
      const { id } = AppState.currentMenuType;
      OrganizationStore.checkOrganizationCode(id, code).then(({ failed }) => {
        if (failed) {
          callback(OrganizationStore.languages[`${intlPrefix}.code.exist.msg`]);
        } else {
          callback();
        }
      });
    } else {
      callback();
    }
  };

  // 根据Id查询绑定此岗位得员工
  queryEmpByPositionId=(record) => {
    const { AppState, intl, id } = this.props;
    const { organizationInfo } = this.state;
    const { objectVersionNumber } = this.state.organizationInfo;
    const menuType = AppState.currentMenuType;
    const tenantId = menuType.id;
    OrganizationStore.queryEmpByPositionIds(tenantId, record.positionId).then((data) => {
      this.setState({
        dataEmpPosition: data,
      });
    });
  }

  // 设置主岗弹出框
  // 展示弹出框
  showMainModal = (record) => {
    this.setState({
      showMainVisible: true,
      empPositionId: record.positionId,
    });
  }

  // 弹出框的XXX
  handleShowMain = () => {
    this.setState({
      value: '',
      showMainVisible: false,
      selectedRowKeys: [],
      empPositionId: '',
    });
  }

  // 弹出框的取消按钮
  showMainCancel = (e) => {
    this.handleShowMain();
    this.setState({
      value: '',
      showMainVisible: false,
      selectedRowKeys: [],
      empPositionId: '',
    });
  };

  // 渲染主岗弹出框
  handleShowModal = () => {
    const { AppState, edit, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { showMainVisible, dataEmpPosition, selectedRowKeys, pagination } = this.state;
    const { organizationId } = AppState.currentMenuType;
    const columns = [
      {
        title: OrganizationStore.languages[`${intlPrefixEmp}.employeecode`],
        dataIndex: 'employeeCode',
        key: 'employeeCode',
        width: 100,
        render: (text, record) => <span>{text}</span>,
      },
      {
        title: OrganizationStore.languages[`${intlPrefixEmp}.employeename`],
        dataIndex: 'employeeName',
        key: 'employeeName',
        width: 100,
      },
      {
        title: OrganizationStore.languages[`${intlPrefixEmp}.email`],
        dataIndex: 'email',
        key: 'email',
      },
    ];
    const rowSelection = {

      onChange: (selectedRowKeys, valAll) => {
        this.setState({ selectedRowKeys, ValueAll: valAll });
      },
      selectedRowKeys,
      type: 'radio',
    };
    return (
      <Modal
        title={OrganizationStore.languages[`${intlPrefix}.empPositionModal`]}
        visible={showMainVisible}
        onOk={this.handleShowModalSubmit}
        onCancel={this.showMainCancel}
        className="empPositionMoadl"
        style={{ width: 575, height: 407 }}
        footer={[<Button
          onClick={this.handleShowModalSubmit}
          style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
          type="primary"
          funcType="raised"
        >
          {OrganizationStore.languages.ok}
        </Button>,
          <Button
            onClick={this.showMainCancel}
            funcType="raised"
            style={{ marginRight: '20px' }}
          >
            {OrganizationStore.languages.cancel}
          </Button>]}
        center
      >
        <Table
          filterBar={false}
          rowSelection={rowSelection}
          size="middle"
          columns={columns}
          dataSource={dataEmpPosition}
          pagination={false}
          scroll={{ y: 250 }}
        />

      </Modal>
    );
  };

  // 确认按钮
  handleShowModalSubmit = (e) => {
    const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const tenantId = menuType.id;
    const { selectedRowKeys, ValueAll, dataEmpPosition, organizationInfo, empPositionId } = this.state;
    const { objectVersionNumber } = this.state.organizationInfo;
    if (selectedRowKeys.length < 1) {
      Choerodon.prompt(OrganizationStore.languages[`${intlPrefix}.submitFiled`]);
    } else {
      const dev = dataEmpPosition.filter(v => (v.invitation === false));
      if (dev.length == 1 && dev[0].employeeId == ValueAll[0].employeeId) {
        OrganizationStore.setMainPositionsIn(tenantId, organizationInfo.organizationId, empPositionId, objectVersionNumber, false, ValueAll[0].employeeId).then(() => {
          OrganizationStore.getPosInfo(tenantId, organizationInfo.organizationId);
          Choerodon.prompt(OrganizationStore.languages['modify.success']);
          this.fetch(this.props);
          this.setState({
            showMainVisible: false,
            empPositionId: '',
          });
        });
      } else if (dev.length == 0) {
        OrganizationStore.setMainPositionsIn(tenantId, organizationInfo.organizationId, empPositionId, objectVersionNumber, false, ValueAll[0].employeeId).then(() => {
          OrganizationStore.getPosInfo(tenantId, organizationInfo.organizationId);
          Choerodon.prompt(OrganizationStore.languages['modify.success']);
          this.fetch(this.props);
          this.setState({
            showMainVisible: false,
            empPositionId: '',
          });
        });
      } else {
        Choerodon.prompt(OrganizationStore.languages[`${intlPrefix}.haveManyEmp`]);
      }
    }
  }

  // 取消主岗
  cancleMainPosition=(record) => {
    const { AppState, intl, id } = this.props;
    const { organizationInfo } = this.state;
    const { objectVersionNumber } = this.state.organizationInfo;
    const menuType = AppState.currentMenuType;
    const tenantId = menuType.id;
    OrganizationStore.cancleMainPositions(tenantId, organizationInfo.organizationId, record.positionId, objectVersionNumber, true).then(() => {
      OrganizationStore.getPosInfo(tenantId, organizationInfo.organizationId);
      Choerodon.prompt(OrganizationStore.languages['modifyCancle.success']);
      this.fetch(this.props);
    });
  }

  //  校验岗位是否绑定了多员工
  checkPositionBind=(record) => {
    const { AppState, intl, id } = this.props;
    const { organizationInfo } = this.state;
    const { objectVersionNumber } = this.state.organizationInfo;
    const menuType = AppState.currentMenuType;
    const tenantId = menuType.id;
    OrganizationStore.checkPositionBinds(tenantId, record.positionId).then((data) => {
      if (data == true) {
        OrganizationStore.setMainPositionsOut(tenantId, organizationInfo.organizationId, record.positionId, objectVersionNumber, true).then(() => {
          OrganizationStore.getPosInfo(tenantId, organizationInfo.organizationId);
          Choerodon.prompt(OrganizationStore.languages['modify.success']);
          this.fetch(this.props);
        });
      } else if (data == false) {
        this.queryEmpByPositionId(record);
        this.showMainModal(record);
      }
    });
  }


  render() {
    const { AppState, edit, intl } = this.props;
    const { id: tenantId, name: organizationName } = AppState.currentMenuType;
    const { getFieldDecorator } = this.props.form;
    const { organizationInfo } = this.state;
    const organizations = OrganizationStore.getOrganizationList;
    const organizationTypes = OrganizationStore.getOrganizationType;
    const oranizationOptions = [];
    const orgOption = [];
    let vtype;
    if (AppState.getType) {
      vtype = AppState.getType;
    } else if (sessionStorage.type) {
      vtype = sessionStorage.type;
    } else {
      // type = menuType.type;
    }

    organizations.forEach((item) => {
      orgOption.push(<Option value={item.organizationId}>{item.organizationCode}-{item.organizationName}</Option>);
    });

    organizationTypes.forEach((items) => {
      oranizationOptions.push(<Option key={items.lookupValue} value={items.lookupValue}>{items.lookupMeaning}</Option>);
    });
    const columns = [{
      title: OrganizationStore.languages['position.management.name'],
      dataIndex: 'positionName',
      key: 'name',
      width: 100,
    }, {
      title: OrganizationStore.languages[`${intlPrefix}.description`],
      dataIndex: 'description',
      key: 'name',
      width: 100,
    }, {
      title: OrganizationStore.languages[`${intlPrefix}.action`],
      key: 'action',
      width: 40,
      render: (text, record) => (
        <div>
          {record.managerPosition ? (
            <Tooltip
              title={OrganizationStore.languages['position.management.supervisor.no']}
              placement="bottom"
            >
              <Button
                style={{ color: '#2196F3' }}
                icon="person"
                shape="circle"
                size="small"
                onClick={this.cancleMainPosition.bind(this, record)}
              />
            </Tooltip>
          ) : (
            <Tooltip
              title={OrganizationStore.languages['position.management.supervisor.yes']}
              placement="bottom"
            >
              <Button
                icon="person"
                style={{ color: '#DCE1E6' }}
                shape="circle"
                size="small"
                // onClick={this.handleManagerPosition.bind(this, record)}
                onClick={this.checkPositionBind.bind(this, record)}
              />
            </Tooltip>
          )
          }
          <Popconfirm
            title={OrganizationStore.languages['confirm.delete']}
            okText={OrganizationStore.languages.ok}
            cancelText={OrganizationStore.languages.cancel}
          >
            <Tooltip
              title={OrganizationStore.languages.delete}
              placement="bottom"
            >
              <a
                role="none"
                className="operateIcon small-tooltip"
                style={{ paddingLeft: '10px', width: '30px', display: 'inline-block' }}
              >
                <Icon type="shanchu-icon" />
              </a>
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    }];

    return (
      <Content className="sidebar-content">
        <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical">
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('organizationCode', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: OrganizationStore.languages[`${intlPrefix}.code.require.msg`],
                },
                {
                  pattern: /^[A-Z0-9]+$/,
                  message: OrganizationStore.languages[`${intlPrefix}.code.test.msg`],
                },
                {
                  validator: this.checkOrganizationCode,
                },
              ],
              normalize: (value) => {
                if (value) {
                  return value.toUpperCase();
                }
              },
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.organizationCode,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                maxLength={15}
                label={OrganizationStore.languages[`${intlPrefix}.code`]}
                style={{ width: inputWidth }}
                disabled={edit}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('organizationName', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: OrganizationStore.languages[`${intlPrefix}.name.require.msg`],
                },
                {
                  validator: this.checkOrganizationName,
                },
              ],
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.organizationName,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                maxLength={15}
                label={OrganizationStore.languages[`${intlPrefix}.name`]}
                style={{ width: inputWidth }}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('category', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: OrganizationStore.languages[`${intlPrefix}.category.require.msg`],
                },
              ],
              initialValue: organizationInfo.category,
            })(
              <Select
                getPopupContainer={() => document.getElementsByClassName('sidebar-content')[0].parentNode}
                label={OrganizationStore.languages[`${intlPrefix}.category`]}
                style={{ width: inputWidth }}
              >
                {oranizationOptions}
              </Select>,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('parentOrganizationId', {
              rules: [],
              initialValue: organizationInfo.parentOrganizationId || '',
            })(
              <Select
                getPopupContainer={() => document.getElementsByClassName('sidebar-content')[0].parentNode}
                label={OrganizationStore.languages[`${intlPrefix}.upperName`]}
                style={{ width: inputWidth }}
                allowClear
              >
                {orgOption}
              </Select>,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {
              getFieldDecorator('description', {
                rules: [
                  {
                    whitespace: true,
                  },
                ],
                initialValue: organizationInfo.description,
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={OrganizationStore.languages[`${intlPrefix}.description`]}
                  type="text"
                  maxLength={30}
                  rows={1}
                  style={{ width: inputWidth }}
                />,
              )
            }
          </FormItem>
          {edit && (
            <Card style={{ width: 514, marginTop: '-15px' }} title={OrganizationStore.languages['position.management.list.description']} bordered={false}>
              <Table
                size="middle"
                columns={columns}
                pagination={false}
                loading={OrganizationStore.isLoading}
                dataSource={OrganizationStore.getPositionList}
                scroll={{ y: 280 }}
                filterBar={false}
                rowKey={
                      record => record.userId
                    }
              />
            </Card>
          )}
        </Form>
        {this.handleShowModal()}
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EditOrganization)));
