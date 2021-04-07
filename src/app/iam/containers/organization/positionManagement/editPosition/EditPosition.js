import React, { Component } from 'react';
import { Form, Input, Select, Card, Collapse, Table, Modal, Switch, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import PositionStore from '../../../../stores/organization/positionManagement';

const FormItem = Form.Item;
const { Option } = Select;
const { Panel } = Collapse;
const intlPrefix = 'position.management';

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
class EditPosition extends Component {
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
      isManagerPosition: true,
      positionInfo: {},
      managerCheck: false,
    };
  }

  fetch(props) {
    const { AppState, edit, id } = props;
    const { id: tenantId } = AppState.currentMenuType;
    PositionStore.loadOrganizationList(tenantId);
    PositionStore.queryStatusList(tenantId);
    if (edit) {
      PositionStore.loadPositionList(tenantId, id);
      this.getPositionInfoById(tenantId, id);
    } else {
      PositionStore.loadPositionList(tenantId);
    }
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id: tenantId } = AppState.currentMenuType;
    PositionStore.queryLanguage(tenantId, AppState.currentLanguage);
  }

  getPositionInfoById = (tenantId, id) => {
    PositionStore.getPositionInfoById(tenantId, id)
      .then((data) => {
        this.setState({
          positionInfo: data,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  checkPositionName = (rule, name, callback) => {
    const { edit, AppState, intl } = this.props;
    if (!edit || name !== this.state.positionInfo.positionName) {
      if (/\s/.test(name)) {
        callback(PositionStore.languages[`${intlPrefix}.name.space.msg`]);
        return;
      }
      callback();
    } else {
      callback();
    }
  };

  checkPositionCode = (rule, code, callback) => {
    const { edit, AppState, intl } = this.props;
    if (!edit || code !== this.state.positionInfo.positionCode) {
      if (/\s/.test(code)) {
        callback(PositionStore.languages[`${intlPrefix}.code.space.msg`]);
        return;
      }
      const tenantId = AppState.currentMenuType.id;
      PositionStore.checkPositionCode(tenantId, code).then((data) => { 
        if (data === false) {
          callback();
        } else {
          const { failed, message } = data;
          
          if (failed) {
            callback(message);
          } else {
            callback(PositionStore.languages[`${intlPrefix}.code.exist.msg`]);
          }
        }
      });
    } else {
      callback();
    }
  };

  /**
   * 提交表单
   * @param
   */
  handleSubmit = (e) => {
    const { isManagerPosition } = this.state;
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!err) {
        const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
        const menuType = AppState.currentMenuType;
        const tenantId = menuType.id;
        onSubmit();
        if (edit) {
          if (!modify) {
            Choerodon.prompt(PositionStore.languages['modify.success']);
            OnUnchangedSuccess();
            return;
          }
          const { positionInfo } = this.state;
          const { positionId, objectVersionNumber } = positionInfo;
          const parentPositionId = data.parentPositionId ? data.parentPositionId : 0;
          PositionStore.updatePosition(tenantId, positionId, {
            positionId,
            ...data,
            objectVersionNumber,
            parentPositionId,
          }).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(PositionStore.languages['modify.success']);
              onSuccess();
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else {
          PositionStore.createPosition(tenantId, data, isManagerPosition).then(({ failed, message }) => {
            if (failed) {
              // Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(PositionStore.languages['create.success']);
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


  // 是否为主管岗位
  handleChangeSwitch = (checked) => {
    this.setState({ isManagerPosition: checked });
  }

  // 组织改变后设置主岗位的状态
  handleOrganizationIdChange = (value) => {
    const { AppState } = this.props;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    PositionStore.handleManagerPosition(iamOrganizationId, value).then((data) => {
      if (data) {
        this.setState({
          isManagerPosition: false,
          managerCheck: true,
        });
      } else {
        this.setState({
          isManagerPosition: true,
          managerCheck: false,
        });
      }
    });
  }

  handleCancel = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        OnCloseModel();
      } else {
        Modal.confirm({
          title: PositionStore.languages[`${intlPrefix}.cancel.title`],
          content: PositionStore.languages[`${intlPrefix}.cancel.content`],
          okText: PositionStore.languages.confirm,
          cancelText: PositionStore.languages.cancel,
          onOk: () => (
            OnCloseModel()
          ),
        });
      }
    });
  }

  render() {
    const { AppState, edit, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationName = menuType.name;
    const { getFieldDecorator } = this.props.form;
    const { positionInfo, disabled } = this.state;
    const positions = PositionStore.getPositionList;
    const organizations = PositionStore.getOrganizationList;
    const statusLists = PositionStore.getStatusList;
    const posOption = [];
    const orgOption = [];

    positions.forEach((item) => {
      posOption.push(<Option value={item.positionId}>{item.positionName}</Option>);
    });
    organizations.forEach((item) => {
      orgOption.push(<Option value={item.organizationId}>{item.organizationCode}-{item.organizationName}</Option>);
    });

    const columns = [{
      title: PositionStore.languages['employee.management.name'],
      dataIndex: 'employeeName',
      key: 'name',
      width: 100,
    }, /* {
      title: PositionStore.languages['employee.management.type'],
      dataIndex: 'employeeType',
      key: 'role',
      width: 130,
      render: (text, record) => <span> {record.employeeType ? (statusLists.find(v => v.lookupValue === record.employeeType) || {}).lookupMeaning : ''}</span>,

    } */ {
      title: PositionStore.languages['employee.management.email'],
      dataIndex: 'email',
      key: 'email',
    }];

    return (
      <Content
        className="sidebar-content"
      >
        <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical">
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('positionCode', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: PositionStore.languages[`${intlPrefix}.code.require.msg`],
                },
                {
                  pattern: /^[A-Z0-9]+$/,
                  message: PositionStore.languages[`${intlPrefix}.code.test.msg`],
                },
                {
                  validator: this.checkPositionCode,
                },
              ],
              normalize: (value) => {
                if (value) {
                  return value.toUpperCase();
                }
              },
              validateTrigger: 'onBlur',
              initialValue: positionInfo.positionCode,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                maxLength={15}
                label={PositionStore.languages[`${intlPrefix}.code`]}
                style={{ width: inputWidth }}
                disabled={edit}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('positionName', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: PositionStore.languages[`${intlPrefix}.name.require.msg`],
                },
                {
                  validator: this.checkPositionName,
                },
              ],
              validateTrigger: 'onBlur',
              initialValue: positionInfo.positionName,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                maxLength={15}
                label={PositionStore.languages[`${intlPrefix}.name`]}
                style={{ width: inputWidth }}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('organizationId', {
              rules: [
                {
                  required: true,
                  message: PositionStore.languages[`${intlPrefix}.organizationid.require.msg`],
                },
              ],
              initialValue: positionInfo.organizationId,
            })(
              <Select
                getPopupContainer={() => document.getElementsByClassName('sidebar-content')[0].parentNode}
                label={PositionStore.languages[`${intlPrefix}.organizationName`]}
                style={{ width: inputWidth }}
                onChange={this.handleOrganizationIdChange}
              >
                {orgOption}
              </Select>,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('parentPositionId', {
              rules: [],
              initialValue: positionInfo.parentPositionId ? positionInfo.parentPositionId : null,
            })(
              <Select
                getPopupContainer={() => document.getElementsByClassName('sidebar-content')[0].parentNode}
                label={PositionStore.languages[`${intlPrefix}.upperName`]}
                style={{ width: inputWidth }}
                allowClear
              >
                {posOption}
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
                initialValue: positionInfo.description,
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={PositionStore.languages[`${intlPrefix}.description`]}
                  type="text"
                  maxLength={30}
                  rows={1}
                  style={{ width: inputWidth }}
                />,
              )
            }
          </FormItem>
          {!edit && (
            <div>
              {PositionStore.languages[`${intlPrefix}.supervisor.is`]} :
              <Switch
                checkedChildren={PositionStore.languages.yes}
                unCheckedChildren={PositionStore.languages.no}
                checked={this.state.isManagerPosition}
                disabled={this.state.managerCheck}
                onChange={checked => this.handleChangeSwitch(checked)}
                style={{ marginLeft: 8 }}
              />
            </div>
          )
          }
          {edit && (
            <Card title={PositionStore.languages[`${intlPrefix}.employee.information`]} bordered={false} style={{ width: 514, marginTop: '-15px' }}>
              <Table
                size="middle"
                columns={columns}
                pagination={false}
                dataSource={positionInfo.employeeList}
                scroll={{ y: 280 }}
                filterBar={false}
                rowKey={
                      record => record.userId
                    }
              />
            </Card>
          )}
        </Form>
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EditPosition)));
