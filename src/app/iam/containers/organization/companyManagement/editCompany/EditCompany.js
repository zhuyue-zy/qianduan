/**
 * Created by Nanjiangqi on 2018-9-28 0028.
 */
import React, { Component } from 'react';
import { Form, Input, Modal, Select, Table, Collapse, Popconfirm, Tooltip, Button, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import CompanyStore from '../../../../stores/organization/companyManagement';

const FormItem = Form.Item;
const { Option } = Select;
const { Panel } = Collapse;
const intlPrefix = 'organization.management';

const inputWidth = 512;
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
class EditCompany extends Component {
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
      employeeInfo: {
        address: '',
        companyCode: '',
        companyFullName: '',
        companyId: '',
        companyShortName: '',
        companyType: '',
        contact: '',
        createdBy: '',
        creationDate: '',
        iamOrganizationId: '',
        isEnabled: 'Y',
        lastUpdateDate: '',
        lastUpdatedBy: '',
        objectVersionNumber: '',
        parentCompanyId: '',
        parentCompanyName: '',
        phone: '',
        taxNumber: '',
      },
      departureDateVisable: false,
      certificateTypePattern: '',
      organizationInfo: {},
    };
  }

  fetch(props) {
    const { AppState, edit, id } = props;
    const { id: organizationId } = AppState.currentMenuType;
    CompanyStore.loadparentCompany(organizationId);
    if (edit) {
      this.getCompanyInfoById(organizationId, id);
    }
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CompanyStore.queryLanguage(id, AppState.currentLanguage);
  };

  // 根据ID查询数据
  getCompanyInfoById = (organizationId, id) => {
    CompanyStore.getCompanyInfoById(organizationId, id)
      .then((data) => {
        this.setState({
          organizationInfo: data.content[0],
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  // 公司名称验证
  checkCompanyFullName = (rule, name, callback) => {
    const { edit, intl } = this.props;
    if (!edit || name !== this.state.organizationInfo.companyFullName) {
      if (/\s/.test(name)) {
        callback(CompanyStore.languages[`${intlPrefix}.name.space.msg`]);
      }
    } else {
      callback();
    }
  };

  // 公司简称验证
  checkCompanyShortName = (rule, name, callback) => {
    const { edit, intl } = this.props;
    if (!edit || name !== this.state.organizationInfo.companyShortName) {
      if (/\s/.test(name)) {
        callback(CompanyStore.languages[`${intlPrefix}.name.space.msg`]);
      }
    } else {
      callback();
    }
  };

  // 公司编码验证
  checkCompanyCode = (rule, name, callback) => {
    const { edit, intl } = this.props;
    if (!edit || name !== this.state.organizationInfo.companyCode) {
      if (/\s/.test(name)) {
        callback(CompanyStore.languages[`${intlPrefix}.only.company.code`]);
      }
    } else {
      callback();
    }
  };

  // 上级公司下拉框
  handleOrganizationIdChange = () => {
    const { AppState } = this.props;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    CompanyStore.loadparentCompany(iamOrganizationId);
  };

  // 取消关闭弹框
  handleCancel = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        OnCloseModel();
      } else {
        Modal.confirm({
          title: CompanyStore.languages[`${intlPrefix}.cancel.title`],
          content: CompanyStore.languages[`${intlPrefix}.cancel.content`],
          onOk: () => (
            OnCloseModel()
          ),
        });
      }
    });
  };

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
            Choerodon.prompt(CompanyStore.languages['modify.success']);
            OnUnchangedSuccess();
            return;
          }
          const { organizationInfo } = this.state;
          const { companyId, objectVersionNumber } = organizationInfo;
          const parentCompanyId = data.parentCompanyId ? data.parentCompanyId : 0;
          CompanyStore.updateCompany(tenantId, {
            ...organizationInfo,
            companyId,
            objectVersionNumber,
            ...data,
            ...parentCompanyId,
          }).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(CompanyStore.languages['modify.success']);
              onSuccess();
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else {
          CompanyStore.createCompany(tenantId, data).then(({ failed, message, code }) => {
            if (failed) {
              if (code === 'error.company.same.code') {
                Choerodon.prompt(CompanyStore.languages[`${intlPrefix}.error.company.same.code`]);
              } else {
                Choerodon.prompt(message);
              }
              onError();
            } else {
              Choerodon.prompt(CompanyStore.languages['create.success']);
              onSuccess();
            }
          }).catch((error) => {
            onError();
            Choerodon.prompt(error.toString());
          });
        }
      }
    });
  };


  render() {
    const { AppState, edit, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const { getFieldDecorator } = this.props.form;
    const companyName = menuType.name;
    const { organizationInfo } = this.state;
    const organizations = CompanyStore.getCompanyNameList;
    const orgOption = [];
    organizations && organizations.forEach((item) => {
      orgOption.push(<Option value={item.companyId}>{item.companyFullName}</Option>);
    });
    return (
      <Content
        className="sidebar-content"
      >
        <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical">
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('companyFullName', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: CompanyStore.languages[`${intlPrefix}.enter.company.name`],
                },
                /* {
                  validator: this.checkCompanyFullName,
                } */
              ],
              sorter: true,
              fixed: 'right',
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.companyFullName,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.company.name`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('companyShortName', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: CompanyStore.languages[`${intlPrefix}.enter.company.Short.name`],
                },
                /* {
                  validator: this.checkCompanyShortName,
                } */
              ],
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.companyShortName,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.company.short.name`]}
                style={{ width: inputWidth }}
                maxLength={20}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
            label="DatePicker"
          >
            {getFieldDecorator('companyCode', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: CompanyStore.languages[`${intlPrefix}.enter.company.code`],
                },
                {
                  pattern: /^[.A-Z0-9]+$/,
                  message: CompanyStore.languages[`${intlPrefix}.only.company.code`],
                },
                /* {
                  validator: this.checkCompanyCode,
                } */
              ],
              normalize: (value) => {
                if (value) {
                  return value.toUpperCase();
                }
              },
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.companyCode,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.company.code`]}
                style={{ width: inputWidth }}
                maxLength={20}
              />,
            )}

          </FormItem>

          <FormItem
            {...formItemLayout}
            label="DatePicker"
          >
            {getFieldDecorator('taxNumber', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.taxNumber || '',
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.tax.number`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('companyType', {
              rules: [
                {
                  required: true,
                  message: CompanyStore.languages[`${intlPrefix}.please.choose.company.type`],
                },
              ],
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.companyType || '',
              validateFirst: true,
            })(
              <Select
                label={CompanyStore.languages[`${intlPrefix}.company.type`]}
                style={{ width: inputWidth }}
              >
                <Option value="enterprise">{CompanyStore.languages[`${intlPrefix}.state.sowned.enterprise`]}</Option>
                <Option value="private enterprise">{CompanyStore.languages[`${intlPrefix}.private.enterprise`]}</Option>
              </Select>,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('parentCompanyId', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.parentCompanyId || '',
              validateFirst: true,
            })(
              <Select
                getPopupContainer={() => document.getElementsByClassName('sidebar-content')[0].parentNode}
                label={CompanyStore.languages[`${intlPrefix}.parent.company.name`]}
                style={{ width: inputWidth }}
                onChange={this.handleOrganizationIdChange}
                allowClear
              >
                {orgOption}
              </Select>,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('contact', {
              initialValue: organizationInfo.contact || '',
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.company.contacts`]}
                style={{ width: inputWidth }}
                maxLength={20}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('phone', {
              rules: [
                {
                  pattern: /^[1][3,4,5,7,8][\d]{9}$/,
                  message: CompanyStore.languages[`${intlPrefix}.enter.true.phone`],
                },
              ],
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.phone || '',
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.phone`]}
                style={{ width: inputWidth }}
                maxLength={20}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('address', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.address || '',
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.company.address`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('isEnabled', {
              rules: [
                {
                  required: true,
                  message: CompanyStore.languages[`${intlPrefix}.please.choose.state`],
                },
              ],
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.isEnabled || 'Y',
              validateFirst: true,
            })(
              <Select
                label={CompanyStore.languages[`${intlPrefix}.state`]}
                style={{ width: inputWidth }}
              >
                <Option value="Y">{CompanyStore.languages[`${intlPrefix}.state.y`]}</Option>
                <Option value="N">{CompanyStore.languages[`${intlPrefix}.state.n`]}</Option>
              </Select>,
            )}
          </FormItem>
        </Form>
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EditCompany)));
