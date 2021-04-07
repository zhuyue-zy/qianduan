/** 2018/10/30
*作者:高梦龙
*转交页面form组件
*/
/*eslint-disable*/
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Button, Form, Input, Modal, Table, Tooltip, DatePicker, Select, Divider } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import backLogStore from "../../../../stores/organization/backLog/BackLogStore";
import LOVInput from "../../../../components/lov/LOVInput";
import LOV from "../../../../components/lov";
import './index.scss'

const FormItem = Form.Item
const { TextArea } = Input;

const intlPrefix = 'organization.backLog';
@inject('AppState')
@observer
class TransferHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      rejectVisible: false,
      transferVisible: false,
      id: this.props.match.params.id,
      selectEmployee: '',
      assignee: '',
      LOVVisible: false,
      visible: false,
      text: '',
      LOVCode: '',

    };
  }

  componentWillMount() {
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    backLogStore.queryLanguage(id, AppState.currentLanguage);
  }

  handleReset = () => {
    this.props.form.resetFields();
    this.setState({
      text: '',
    })
  }

  getQueryString = (name) => {
    const url = window.location.hash;
    const theRequest = {};
    if (url.indexOf('?') !== -1) {
      const str = url.substr(1);
      const strs = str.split('&');
      for (let i = 0; i < strs.length; i += 1) {
        theRequest[strs[i].split('=')[0]] = decodeURI(strs[i].split('=')[1]);
        if (theRequest[name]) {
          return theRequest[name];
        }
      }
    }
  };


  /*
转交按钮
*/
  transferSubmit = (e) => {
    e.preventDefault();
    const taskId = this.getQueryString('taskId');
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (!err) {
        const { AppState, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        const { id } = this.state;
        const menuType = AppState.currentMenuType;
        backLogStore.transferApprovel(organizationId, id, data.assignee,data.taskComment, taskId).then(({ failed, message }) => {
          if (failed) {
            Choerodon.prompt(message);
          } else {
            this.handleReset();
            this.props.history.push(`/iam/takePartProcess?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
            this.setState({
              agreeVisible: false,
            });
          }
        });
      }
    });
  }

  transferCancel = (e) => {
    this.handleReset();
    const { onCancel } =this.props;
    onCancel();
  }





  render() {
    const {  intl, form,visible,onCancel } = this.props;
    const { getFieldDecorator } = form;
    const {
      value, text, LOVVisible, formItemCode, LOVCode, assignee,
      selectEmployee } = this.state;
    return (
      <Modal
        title={backLogStore.languages[ `${intlPrefix}.transferApprove`]}
        visible={visible}
        onCancel={this.transferCancel}
        className='transfer-content'
        footer={[  <Button
          onClick={this.transferSubmit}
          style={{backgroundColor: '#2196f3', borderRadius: 5, }}
          type="primary"
          funcType="raised"
        >
          {backLogStore.languages["ok"]}
        </Button>,
          <Button
            onClick={this.transferCancel}
            funcType="raised"
            style={{ marginRight: '20px' }}
          >
            {backLogStore.languages.cancel}
          </Button>]}
        center
      >
        <Form>
          <FormItem style={{ display: 'inline-block', marginTop: 20, marginLeft: 15 }}>
            {getFieldDecorator('assignee', {
              rules: [
                {
                  required: true,
                  message: backLogStore.languages[ `${intlPrefix}.employeeId`],
                },
              ],
              initialValue: '',
            })(
              <LOVInput
                code="selectEmployee"
                label={backLogStore.languages[ `${intlPrefix}.employeeId`]}
                form={this.props.form}
                formCode="assignee"
                organizationId={this.props.AppState.currentMenuType.organizationId}
                style={{ width: 400 }}
                text={text}
                onLOV={() => {
                  this.setState({
                    LOVVisible: true,
                    formItemCode: 'assignee',
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
          <FormItem style={{ display: 'inline-block', marginLeft: 15 }}>
            {getFieldDecorator('taskComment', {
              validateTrigger: 'onBlur',
              rules: [{
                required: true,
                message: backLogStore.languages[ `${intlPrefix}.taskComment`],

              }],
              initialValue: '',
              validateFirst: true,
            })(
              <TextArea
                autoComplete="off"
                label={backLogStore.languages[ `${intlPrefix}.proverIdea`]}
                style={{ width: 400 }}
                maxLength={50}
                autosize={{ minRows: 1, maxRows: 2 }}
              />,
            )}
          </FormItem>
        </Form>
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

      </Modal>
    );
  }
}

export default Form.create()(withRouter(injectIntl(TransferHome)));



