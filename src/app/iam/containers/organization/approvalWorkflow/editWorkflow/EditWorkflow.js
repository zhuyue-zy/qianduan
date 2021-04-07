/**
 * Created by Nanjiangqi on 2018-10-16 0028.
 */
import React, { Component } from 'react';
import { Collapse, Form, Input, Modal, Select } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import WorkflowStore from '../../../../stores/organization/approvalWorkflow';

const FormItem = Form.Item;
const { Option } = Select;
const { Panel } = Collapse;
const intlPrefix = 'organization.management';
const intlPrefixs = 'approval.workflow';

const inputWidth = 512;
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
};

function noop() {
}

@inject('AppState')
@observer
class EditWorkflow extends Component {
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
      modelName: '',
      processDescription: '',
      modelCategory: '',
      departureDateVisable: false,
      certificateTypePattern: '',
    };
  }

  fetch(props) {
    const { AppState, edit, id } = props;
    const { organizationId } = AppState.currentMenuType;
    const code = 'WF_CLASSIFY';
    WorkflowStore.loadClassify(organizationId, code);
    if (edit) {
      this.getCompanyInfoById(organizationId, id);
    }
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    WorkflowStore.queryLanguage(organizationId, AppState.currentLanguage);
  }


  // 根据ID查询数据
  getCompanyInfoById = (organizationId, id) => {
    WorkflowStore.getCompanyInfoById(organizationId, id)
      .then((data) => {
        this.setState({
          organizationInfo: data.content[0],
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  // 上级公司下拉框
  handleOrganizationIdChange = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const code = 'WF_CLASSIFY';
    WorkflowStore.loadClassify(organizationId, code);
  };

  // 取消关闭弹框
  handleCancel = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        OnCloseModel();
      } else {
        Modal.confirm({
          title: WorkflowStore.languages[`${intlPrefix}.cancel.title`],
          content: WorkflowStore.languages[`${intlPrefix}.cancel.content`],
          onOk: () => (
            OnCloseModel()
          ),
        });
      }
    });
  };

  /**
   * 提交表单
   */
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!err) {
        const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        onSubmit();
        if (edit) {
          if (!modify) {
            Choerodon.prompt(WorkflowStore.languages['modify.success']);
            OnUnchangedSuccess();
            return;
          }
          const { organizationInfo } = this.state;
          const { companyId, objectVersionNumber } = organizationInfo;
          const parentCompanyId = data.parentCompanyId ? data.parentCompanyId : 0;
          WorkflowStore.updateCompany(organizationId, {
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
              Choerodon.prompt(WorkflowStore.languages['modify.success']);
              onSuccess();
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else {
          WorkflowStore.createCompany(organizationId, data).then((datas) => {
            if (datas.failed) {
              Choerodon.prompt(datas.message);
              onError();
            } else {
              Choerodon.prompt(WorkflowStore.languages['create.success']);
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


  render() {
    const { AppState, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const { getFieldDecorator } = this.props.form;
    const { modelName, processDescription, modelCategory } = this.state;
    const organizations = WorkflowStore.getCompanyNameList;
    const orgOption = [];

    organizations && organizations.forEach((item) => {
      orgOption.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    return (
      <Content className="sidebar-content">
        <Form layout="vertical" style={{ height: 625 }}>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('modelName', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: WorkflowStore.languages[`${intlPrefixs}.enter.process.name`],
                },
                {
                  pattern: /^[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5]*$/,
                  message: WorkflowStore.languages[`${intlPrefixs}.chinese.characters`],
                },
              ],
              validateTrigger: 'onBlur',
              initialValue: modelName || '',
              key: modelName,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={WorkflowStore.languages[`${intlPrefixs}.process.name`]}
                style={{ width: inputWidth }}
                maxLength={30}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('processDescription', {
              validateTrigger: 'onBlur',
              initialValue: processDescription,
              key: processDescription,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={WorkflowStore.languages[`${intlPrefixs}.process.description`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('modelCategory', {
              rules: [
                {
                  required: true,
                  message: WorkflowStore.languages[`${intlPrefixs}.choose.classification`],
                },
              ],
              initialValue: modelCategory || '',
              key: modelCategory,
            })(
              <Select
                getPopupContainer={() => document.getElementsByClassName('sidebar-content')[0].parentNode}
                label={WorkflowStore.languages[`${intlPrefixs}.classification`]}
                style={{ width: inputWidth }}
                onChange={this.handleOrganizationIdChange}
                allowClear
              >
                {orgOption}
              </Select>,
            )}
          </FormItem>
        </Form>
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EditWorkflow)));
