import React, { Component } from 'react';
import { Form, Input, Modal, Select, Table, Collapse, Switch, Tooltip, Button, Icon, message, Row, Col } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import ConfigurationStore from '../../../../stores/organization/accountConfiguration';
import './index.scss';

const FormItem = Form.Item;
const Option = Select.Option;
const Panel = Collapse.Panel;
const intlPrefixs = 'account.configuration';

const inputWidth = 350;
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
class EditConfiguration extends Component {
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
      departureDateVisable: false,
      certificateTypePattern: '',
      selectedRowKeys: [],
      configurationData: {
        configCode: '',
        description: '',
        host: '',
        port: '',
      },
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      loading: false,
      tableState: 'unchanged',
      selectedCodeValues: [], // 存放被选中的记录
      count: 1000, //  记录的index,用于新建数据时作为其key
      flexValuesList: [],
      cellEditable: false, // 控制单元格是否可编辑
      deleteValueAll: [], // 存放被选中的数据
    };
  }

  fetch(props) {
    const { AppState, edit, selectedData } = props;
    const { organizationId } = AppState.currentMenuType;
    if (edit) {
      this.getCompanyInfoById(organizationId, selectedData);
    }
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    ConfigurationStore.queryLanguage(id, AppState.currentLanguage);
  }

  // 根据ID查询数据
  getCompanyInfoById = (organizationId, id) => {
    ConfigurationStore.loadconfig(organizationId, id)
      .then((data) => {
        this.setState({
          configurationData: data,
          ssL:data.ssL,
          flexValuesList: data.accountList,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  // 取消关闭弹框
  handleCancel = (e) => {
    const { onCloseModel = noop, edit, intl, history, AppState } = this.props;
    const { organizationId, name, type, id } = AppState.currentMenuType;
    const url = `accountConfiguration?type=${type}&id=${id}&name=${name}&organizationId=${organizationId}`;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify && edit) {
        onCloseModel();
      } else if (modify && edit) {
        Modal.confirm({
          title: ConfigurationStore.languages[ `${intlPrefixs}.cancel`],
          content: ConfigurationStore.languages[ `${intlPrefixs}.confirm.cancel`],
          onOk: () => (
            onCloseModel()
          ),
        });
      } else {
        history.push(url);
      }
    });
  };

  // 检查表格中必填字段是否填完
  checkTableData = () => {
    const { flexValuesList } = this.state;
    let ret = true;
    flexValuesList.forEach((val) => {
      if (!(val.accountCode && val.password && val.userName)) {
        ret = false;
      }
    });
    return ret;
  };

  // 检查账户代码和用户名格式是否正确
  checkTableDataWhether = (accountList) => {
    const code = /^[a-zA-Z\d]+$/; const 
      pass = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/;
    let Whether = false;
    const { intl } = this.props;
    accountList.forEach((list) => {
      if (!code.test(list.accountCode)) {
        message.error(ConfigurationStore.languages[ `${intlPrefixs}.account.code.alphabetic.numeric`]);
      } else if (!pass.test(list.userName)) {
        message.error(ConfigurationStore.languages[ `${intlPrefixs}.user.name.correct.mailbox.account`]);
      } else {
        Whether = true;
      }
    });
    return Whether;
  };

  // 保存按钮
  handleSubmit = () => {
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      data.accountList = this.state.flexValuesList;
      if (data.accountList.length === 0) {
        const { intl } = this.props;
        message.error(ConfigurationStore.languages[ `${intlPrefixs}.please.add.least.account`]);
      } else if (!err && this.checkTableData()) {
        const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl, history } = this.props;
        const { organizationId, name, type, id } = AppState.currentMenuType;
        const url = `accountConfiguration?type=${type}&id=${id}&name=${name}&organizationId=${organizationId}`;
        onSubmit();
        if (this.checkTableDataWhether(data.accountList)) {
          if (edit) {
            const { configurationData } = this.state;
            data.configId = configurationData.configId;
            data.objectVersionNumber = configurationData.objectVersionNumber;
            ConfigurationStore.updateaccount(organizationId, data).then(({ code, failed, message }) => {
              if (failed) {
                if (code === 'code.is.repeat') {
                  Choerodon.prompt(ConfigurationStore.languages[ `${intlPrefixs}.account.code.duplication`]);
                } else if (code === 'user.name.is.repeat') {
                  Choerodon.prompt(ConfigurationStore.languages[ `${intlPrefixs}.repeat.user.name`]);
                } else {
                  Choerodon.prompt(message);
                  onError();
                }
              } else {
                Choerodon.prompt(ConfigurationStore.languages[ 'modify.success']);
                this.setState({
                  selectedCodeValues: [],
                });
                onSuccess();
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
            });
          } else {
            ConfigurationStore.addaccount(organizationId, data).then(({ code, failed, message }) => {
              if (failed) {
                if (code === 'code.is.repeat') {
                  Choerodon.prompt(ConfigurationStore.languages[ `${intlPrefixs}.account.code.duplication`]);
                } else if (code === 'user.name.is.repeat') {
                  Choerodon.prompt(ConfigurationStore.languages[ `${intlPrefixs}.repeat.user.name`]);
                } else {
                  Choerodon.prompt(message);
                  onError();
                }
              } else {
                Choerodon.prompt(ConfigurationStore.languages[ 'create.success']);
                this.setState({
                  selectedCodeValues: [],
                });
                history.push(url);
              }
            }).catch((error) => {
              onError();
              Choerodon.handleResponseError(error);
            });
          }
        }
      } else {
        const { intl } = this.props;
        message.error(ConfigurationStore.languages[ `${intlPrefixs}.please.enter.account.username.password`]);
      }
    });
  };

  addShowModal = () => {
    const { form: { validateFields }, intl } = this.props;
    if (this.checkTableData()) {
      validateFields((err) => {
        if (!err) {
          const { flexValuesList, count } = this.state;
          //  将其他行设置为不可编辑
          flexValuesList.forEach((val) => {
            val.editable = false;
          });
          //  定义一条新数据，暂时先填充两个字段
          const newData = {
            key: 0 + flexValuesList.length, //  count为了防止报key重复错误
            //  默认启用、可编辑
            editable: true,
            falseData: true,
            accountCode: '',
            userName: '',
            password: '',
          };
          this.setState({
            //  将新定义的数据加入到数据集中
            flexValuesList: flexValuesList ? [...flexValuesList, newData] : [newData],
            count: count + 1,
            newCodeValueLine: true,
            selectedCodeValues: [],
            deleteValueAll: [],
          });
        }
      });
    } else {
      message.error(ConfigurationStore.languages[ `${intlPrefixs}.please.complete.information.account`]);
    }
  };

  // 删除
  deleteShowModal = () => {
    const { deleteValueAll, flexValuesList, selectedCodeValues, count } = this.state;
    const accountList = [];
    // 如果选择了多选框 才会进入删除
    if (deleteValueAll.length > 0) {
      deleteValueAll.forEach((d) => {
        if (d.accountId) {
          accountList.push(d);
          return accountList;
        }
      });
      const { AppState, intl, selectedData } = this.props;
      const { organizationId } = AppState.currentMenuType;
      if (accountList.length > 0) {
        Modal.confirm({
          title: ConfigurationStore.languages[ `${intlPrefixs}.confirm.deletion`],
          okType: 'danger',
          onOk: () => {
            ConfigurationStore.deleteaccount(organizationId, accountList).then((test) => {
              if (test) {
                ConfigurationStore.loadconfig(organizationId, selectedData)
                  .then((data) => {
                    selectedCodeValues.forEach((s, c) => {
                      flexValuesList.forEach((f, l) => {
                        if (f.falseData && selectedCodeValues[c] === f.key) {
                          flexValuesList.splice(l, 1);
                        }
                      });
                      return flexValuesList;
                    });
                    flexValuesList.forEach((f, v) => {
                      data.accountList.forEach((a, l) => {
                        if (f.falseData) {
                          data.accountList.push(f);
                        }
                      });
                      return data.accountList;
                    });
                    data.accountList.forEach((f, v) => {
                      if (f.configId && f.configId) {
                        f.key = v + count;
                      }
                      return data.accountList;
                    });
                    this.setState({
                      configurationData: data,
                      flexValuesList: data.accountList,
                      selectedCodeValues: [],
                      deleteValueAll: [],
                    });
                    message.error(ConfigurationStore.languages[ `${intlPrefixs}.deletion.success`]);
                  })
                  .catch((error) => {
                    Choerodon.handleResponseError(error);
                  });
              } else {
                message.error(ConfigurationStore.languages[ `${intlPrefixs}.deletion.error`]);
              }
            });
          },
        });
      } else {
        Modal.confirm({
          title: ConfigurationStore.languages[ `${intlPrefixs}.confirm.deletion`],
          okType: 'danger',
          onOk: () => {
            selectedCodeValues.forEach((s, c) => {
              flexValuesList.forEach((f, l) => {
                if (f.falseData && selectedCodeValues[c] === f.key) {
                  flexValuesList.splice(l, 1);
                }
              });
              return flexValuesList;
            });
            this.setState({
              selectedCodeValues: [],
              deleteValueAll: [],
              flexValuesList,
            });
          },
        });
      }
    }
  };

  renderTestTableCell = (record, value, field, type, onlyLetters, required, focus) => {
    const { cellEditable, flexValuesList } = this.state;
    const { editable, key } = record;
    return (
      <Input
        autoFocus={focus}
        underline={editable || false}
        readOnly={!editable || false}
        defaultValue={value}
        type={type}
        onChange={(e) => {
          record[field] = e.target.value;
        }}
        onDoubleClick={() => {
          if (!editable && this.state.tableState !== 'uncompleted') {
            flexValuesList.forEach((val, f) => {
              if (val.key === key) {
                val.editable = !editable;
              } else {
                val.editable = editable;
              }
            });
            this.setState({
              cellEditable: !cellEditable,
            });
          }
        }}
        onKeyUp={(e) => {
          if (onlyLetters) {
            e.target.value = e.target.value.replace(/[\W]/g, '');
          }
        }}
        onBlur={(e) => {
          if (required && !e.target.value) {
            this.state.tableState = 'uncompleted';
          } else {
            this.state.tableState = 'completed';
          }
        }}
      />
    );
  };

  renderTestTable = (record, value, field, type, onlyLetters, required, focus) => {
    const { cellEditable, flexValuesList } = this.state;
    const { intl } = this.props;
    const { editable, key } = record;
    return (
      <FormItem
        {...formItemLayout}
        style={{ display: 'contents', width: 250 }}
      >
        <Input
          autoFocus={focus}
          underline={editable || false}
          readOnly={!editable || false}
          defaultValue={record.accountCode}
          type={type}
          maxlength={20}
          onChange={(e) => {
            record[field] = e.target.value;
          }}
          onDoubleClick={() => {
            if (!editable && this.state.tableState !== 'uncompleted') {
              flexValuesList.forEach((val, f) => {
                if (val.key === key) {
                  val.editable = !editable;
                } else {
                  val.editable = editable;
                }
              });
              this.setState({
                cellEditable: !cellEditable,
              });
            }
          }}
          onBlur={(e) => {
            const reg = /^[a-zA-Z\d]+$/;
            if (!reg.test(e.target.value)) {
              message.error(ConfigurationStore.languages[ `${intlPrefixs}.account.code.alphabetic.numeric`]);
            }
          }}
        />
      </FormItem>
    );
  };

  renderTestTableUser = (record, value, field, type, onlyLetters, required, focus) => {
    const { cellEditable, flexValuesList } = this.state;
    const { intl } = this.props;
    const { editable, key } = record;
    return (
      <FormItem
        {...formItemLayout}
        style={{ display: 'contents', width: 250 }}
      >
        <Input
          autoFocus={focus}
          underline={editable || false}
          readOnly={!editable || false}
          defaultValue={record.userName}
          type={type}
          onChange={(e) => {
            record[field] = e.target.value;
          }}
          onDoubleClick={() => {
            if (!editable && this.state.tableState !== 'uncompleted') {
              flexValuesList.forEach((val, f) => {
                if (val.key === key) {
                  val.editable = !editable;
                } else {
                  val.editable = editable;
                }
              });
              this.setState({
                cellEditable: !cellEditable,
              });
            }
          }}
          onBlur={(e) => {
            const reg = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/;
            if (!reg.test(e.target.value)) {
              message.error(ConfigurationStore.languages[ `${intlPrefixs}.user.name.correct.mailbox.account`]);
            }
          }}
        />
      </FormItem>
    );
  };

  renderTestTablePassword = (record, value, field, type, onlyLetters, required, focus) => {
    const { cellEditable, flexValuesList } = this.state;
    const { editable, key } = record;
    return (
      <FormItem
        {...formItemLayout}
        style={{ display: 'contents', width: 250 }}
      >
        <Input
          type="password"
          autoFocus={focus}
          underline={editable || false}
          readOnly={!editable || false}
          defaultValue={record.password}
          onChange={(e) => {
            record[field] = e.target.value;
          }}
          onDoubleClick={() => {
            if (!editable && this.state.tableState !== 'uncompleted') {
              flexValuesList.forEach((val, f) => {
                if (val.key === key) {
                  val.editable = !editable;
                } else {
                  val.editable = editable;
                }
              });
              this.setState({
                cellEditable: !cellEditable,
              });
            }
          }}
        />
      </FormItem>
    );
  };

  onChangeSsL = (e) =>{
    this.setState({
      ssL:e
    })
    this.props.form.setFieldsValue({
      ssL: e,
    });
  }

  render() {
    const { AppState, intl, edit } = this.props;
    const menuType = AppState.currentMenuType;
    const { getFieldDecorator } = this.props.form;
    const { flexValuesList, configurationData, pagination } = this.state;
    const rowSelection = {
      onChange: (selectedRows, selectValue) => {
        this.setState({ selectedCodeValues: selectedRows, deleteValueAll: selectValue });
      },
      selectedRowKeys: this.state.selectedCodeValues,
    };
    const columns = [{
      title: ConfigurationStore.languages[ `${intlPrefixs}.account.code`],
      dataIndex: 'accountCode',
      key: 'accountCode',
      filters: [],
      render: (value, record) => this.renderTestTable(record, value, 'accountCode'),
    }, {
      title: ConfigurationStore.languages[ `${intlPrefixs}.user.name`],
      dataIndex: 'userName',
      key: 'userName',
      filters: [],
      render: (value, record) => this.renderTestTableUser(record, value, 'userName'),
    }, {
      title: ConfigurationStore.languages[ `${intlPrefixs}.password`],
      dataIndex: 'password',
      key: 'password',
      filters: [],
      render: (value, record) => this.renderTestTablePassword(record, value, 'password'),
    }];
    return (
      <Content className="sidebar-content">
        <Form layout="vertical" onSubmit={this.handleSubmit.bind(this)}>
          <Row>
            <Col span={12}>
              <FormItem
                {...formItemLayout}
                style={{ display: 'inline-block', width: 412 }}
              >
                {getFieldDecorator('configCode', {
                  rules: [
                    {
                      required: true,
                      message: ConfigurationStore.languages[ `${intlPrefixs}.please.input.configuration.code`],
                    },
                    {
                      pattern: /^[A-Z0-9]+$/,
                      message: ConfigurationStore.languages[ `${intlPrefixs}.only.numbers.and.letters.entered`],
                    },
                  ],
                  normalize: (value) => {
                    if (value) {
                      return value.toUpperCase();
                    }
                  },
                  validateFirst: true,
                  validateTrigger: 'onBlur',
                  initialValue: configurationData.configCode || '',
                })(
                  <Input
                    autoComplete="off"
                    label={ConfigurationStore.languages[ `${intlPrefixs}.configuration.code`]}
                    style={{ width: inputWidth }}
                    maxLength={20}
                    disabled={edit}
                  />,
                )}
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                {...formItemLayout}
                style={{ display: 'inline-block' }}
              >
                {getFieldDecorator('description', {
                  initialValue: configurationData.description || '',
                  validateFirst: true,
                  validateTrigger: 'onBlur',
                })(
                  <Input
                    autoComplete="off"
                    label={ConfigurationStore.languages[ `${intlPrefixs}.describe`]}
                    style={{ width: inputWidth }}
                    maxLength={30}
                  />,
                )}
              </FormItem>
            </Col>
          </Row>

          <Row>
            <Col span={12}>
              <FormItem
                {...formItemLayout}
                style={{ display: 'inline-block' }}
              >
                {getFieldDecorator('host', {
                  rules: [
                    {
                      required: true,
                      message: ConfigurationStore.languages[ `${intlPrefixs}.please.input.mail.server`],
                    },
                    {
                      pattern: /[^\u4e00-\u9fa5]/,
                      message: ConfigurationStore.languages[ `${intlPrefixs}.mail.server.is.non-Chinese`],
                    },
                  ],
                  initialValue: configurationData.host || '',
                  validateFirst: true,
                  validateTrigger: 'onBlur',
                })(
                  <Input
                    autoComplete="off"
                    label={ConfigurationStore.languages[ `${intlPrefixs}.mail.server`]}
                    style={{ width: inputWidth }}
                    maxLength={30}
                  />,
                )}
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                {...formItemLayout}
                style={{ display: 'inline-block' }}
              >
                {getFieldDecorator('port', {
                  rules: [
                    {
                      required: true,
                      message: ConfigurationStore.languages[ `${intlPrefixs}.please.input.port`],
                    },
                    {
                      pattern: /^[0-9]*$/,
                      message: ConfigurationStore.languages[ `${intlPrefixs}.ports.must.digital`],
                    },
                  ],
                  initialValue: configurationData.port || '',
                  key: configurationData.port,
                })(
                  <Input
                    autoComplete="off"
                    label={ConfigurationStore.languages[ `${intlPrefixs}.port`]}
                    style={{ width: inputWidth }}
                    maxLength={10}
                  />,
                )}
              </FormItem>
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <span style={{marginRight:'16px'}}>SSL</span>
              <FormItem
                {...formItemLayout}
                style={{ display: 'inline-block' }}
              >
                {getFieldDecorator('ssL', {
                  initialValue: configurationData.ssL || '',
                })(
                  <Switch onChange={this.onChangeSsL} checked={this.state.ssL || ''} />,
                )}
              </FormItem>
            </Col>
          </Row>
          <div className="account-size">
            {ConfigurationStore.languages[`${intlPrefixs}.account`]}
            <Button
              className="new-account"
              onClick={() => this.addShowModal()}
              icon="playlist_add"
            >
              {ConfigurationStore.languages[`${intlPrefixs}.new.account`]}
            </Button>
            <Button
              className="delete-account"
              onClick={() => this.deleteShowModal()}
              icon="delete_sweep"
            >
              {ConfigurationStore.languages[`${intlPrefixs}.delete.account`]}
            </Button>
          </div>
          <div className="table-margin">
            <Table
              style={{ marginTop: 5 }}
              rowSelection={rowSelection}
              pagination={false}
              columns={columns}
              dataSource={flexValuesList}
              filterBar={false}
            />
          </div>
        </Form>
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EditConfiguration)));
