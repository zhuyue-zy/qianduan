/** 2018/10/24
*作者:高梦龙
*项目名称：审批工作流测试
*/

import React, { Component } from 'react';
import { Form, Input, Button, Select, message, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page } from 'yqcloud-front-boot';
import LOV from '../../../../components/lov';
import LOVInput from '../../../../components/lov/LOVInput';
import workFlowStore from '../../../../stores/organization/workFlowTest/WorkFlowStore';
import './index.scss';

const intlPrefix = 'organization.workflowTest';
const FormItem = Form.Item;
const { Option } = Select;

@inject('AppState')
@observer
class WorkFlowHome extends Component {
  state=this.getInitState();

  getInitState() {
    return {
      isLoading: true,
      params: [],
      filters: {},
      sort: 'id,desc',
      forwardStartDate: null,
      forwardEndDate: null,
      endOpen: false,
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      applicant: '',
      LOVVisible: false,
      LOVVisibleProcess: false,
      visible: false,
      text: '',
      textProcess: '',
      LOVCode: '',
      formItemCode: '',
      dataSource: [],
      count: 1,
      selectEmployee: '',
      selectProcess: '',
    };
  }

  componentWillMount() {
    this.fetch(this.props);
  }

  fetch() {
    // 获取类型数据
    this.loadLanguage();
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    workFlowStore.queryProcess(organizationId);
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    workFlowStore.queryLanguage(id, AppState.currentLanguage);
  };

  // 清除表单
  handleReset = () => {
    this.props.form.resetFields();
    this.setState({
      text: '',
      textProcess: '',
    });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, { applicant }) => {
      if (!err) {
        const { AppState, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        workFlowStore.createWorkFlow(organizationId,
          data.applicant, data.key).then(({ failed, message }) => {
          if (failed) {
            Choerodon.prompt(message);
          } else {
            workFlowStore.getCode('startup.success');
            this.handleReset();
          }
        }).catch((error) => {
          Choerodon.handleResponseError(error);
        });
      } else {
        workFlowStore.getCode('enter.required');
      }
    });
  };


  render() {
    const { AppState, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
    const processLists = workFlowStore.getProcesslist;
    const lanOption = [];
    const {
      value, text, textProcess, LOVVisible, LOVVisibleProcess, formItemCode, LOVCode, applicant, selectEmployee, selectProcess } = this.state;
    processLists.forEach((item) => {
      lanOption.push(<Option key={item.key} value={item.key}>{item.name}</Option>);
    });
    return (
      <Page>
        <Header title={workFlowStore.languages[`${intlPrefix}.workflowTestTitle`]}>
          <Button
            onClick={this.handleSubmit}
            style={{ color: '#04173F' }}
          >
            <Icon type="amhbk" style={{ color: '#2196F3', width: 25 }} />
            {workFlowStore.languages[`${intlPrefix}.workflowTest`]}
          </Button>
        </Header>
        <Content>
          <Form layout="vertical">
            <span style={{ marginLeft: '120px' }} />

            <div className="workFolow" style={{ height: '20px', marginBottom: '5px' }}>
              <FormItem style={{ display: 'inline-block' }}>
                <span>{workFlowStore.languages[`${intlPrefix}.applicant`]}<span style={{ color: 'red', textAlign: 'center' }}>*</span></span>
                {getFieldDecorator('applicant', {
                  rules: [
                    {
                      required: true,
                      message: workFlowStore.languages[`${intlPrefix}.applicant.require.msg`],
                    },
                  ],
                  initialValue: '',
                })(
                  <LOVInput
                    code="selectEmployee"
                    form={this.props.form}
                    formCode="applicant"
                    organizationId={this.props.AppState.currentMenuType.organizationId}
                    style={{ width: 300, marginLeft: 10 }}
                    text={text}
                    onLOV={() => {
                      this.setState({
                        LOVVisible: true,
                        formItemCode: 'applicant',
                        LOVCode: selectEmployee,
                      });
                    }}
                    onSelect={(text) => {
                      this.setState({
                        text,
                      });
                    }}
                  />,
                )}
              </FormItem>
              <LOV
                code="selectEmployee"
                firstForm={this.props.form}
                formItem={formItemCode}
                organizationId={this.props.AppState.currentMenuType.organizationId}
                visible={LOVVisible}
                onChange={(visible, text = text) => {
                  this.setState({
                    LOVVisible: visible,
                    text,
                  });
                }}
              />
            </div>
            <div className="workFolow" style={{ marginTop: '40px' }}>
              <FormItem style={{ display: 'inline-block' }}>
                <span>{workFlowStore.languages[`${intlPrefix}.process`]}<span style={{ color: 'red', textAlign: 'center' }}>*</span></span>
                {getFieldDecorator('key', {
                  rules: [
                    {
                      required: true,
                      message: workFlowStore.languages[`${intlPrefix}.key.require.msg`],
                    },
                  ],
                  initialValue: '',
                })(
                  <LOVInput
                    code="selectProcess"
                    form={this.props.form}
                    formCode="key"
                    organizationId={this.props.AppState.currentMenuType.organizationId}
                    style={{ width: 300, marginLeft: 10 }}
                    text={textProcess}
                    onLOV={() => {
                      this.setState({
                        LOVVisibleProcess: true,
                        formItemCode: 'key',
                        LOVCode: selectProcess,
                      });
                    }}
                    onSelect={(textProcess) => {
                      this.setState({
                        textProcess,
                      });
                    }}
                  />,
                )}
              </FormItem>
              <LOV
                code="selectProcess"
                firstForm={this.props.form}
                formItem="key"
                organizationId={this.props.AppState.currentMenuType.organizationId}
                visible={LOVVisibleProcess}
                onChange={(visible, textProcess = textProcess) => {
                  this.setState({
                    LOVVisibleProcess: visible,
                    textProcess,
                  });
                }}
              />
            </div>
          </Form>

        </Content>
      </Page>
    );
  }
}
export default Form.create({})(withRouter(injectIntl(WorkFlowHome)));
