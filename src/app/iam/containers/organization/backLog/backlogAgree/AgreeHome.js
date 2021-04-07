/** 2018/10/30
*作者:高梦龙
*弹出同意页面form组件
*/
/*eslint-disable*/
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Button, Form, Input, Modal } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import backLogStore from "../../../../stores/organization/backLog/BackLogStore";
import './index.scss'
import automaticTransferStore from "../../../../stores/organization/automaticTransfer";

const FormItem = Form.Item
const intlPrefix = 'organization.backLog';
const { TextArea } = Input;

@inject('AppState')
@observer
class AgreeHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      value: '',
      text: '',
      agreeVisible: false,
      id: this.props.match.params.id,
      taskId: '',

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
  }
  /*
拒绝按钮
*/

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

  agreeSubmit = (e) => {
    e.preventDefault();
    const taskId = this.getQueryString('taskId');
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (!err) {
        const { AppState, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        const { id } = this.state;
        const menuType = AppState.currentMenuType;
        backLogStore.agreeApprovel(organizationId, id, data.taskComment, taskId).then(({ failed, message }) => {
          if (failed) {
            // Choerodon.prompt(message);
          } else {
            this.handleReset();
            this.props.history.push(`/iam/backLog?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
            this.setState({
              agreeVisible: false,
            });
          }
        });
      }
    });
  }





  agreeCancel = (e) => {
    this.handleReset();
    const {  onCancel } = this.props;
    onCancel();
  }



  render() {
    const {  intl, form,visible,onCancel } = this.props;
    const { getFieldDecorator } = form;
    return (

      <Modal
        title={backLogStore.languages[ `${intlPrefix}.agreeApprove`]}
        visible={visible}
        onCancel={this.agreeCancel}
        className="agree-content"
        footer={[   <Button
          onClick={this.agreeSubmit}
          style={{backgroundColor: '#2196f3', borderRadius: 5, }}
          type="primary"
          funcType="raised"
        >
          {backLogStore.languages["ok"]}
        </Button>, <Button
          onClick={this.agreeCancel}
          funcType="raised"
          style={{ marginRight: '20px' }}
        >
          {backLogStore.languages["cancle"]}
        </Button>]}
        center
      >
        <Form >
          <FormItem style={{ display: 'inline-block', marginTop: 20, marginLeft:15 }}>
            {getFieldDecorator('taskComment', {
              validateTrigger: 'onBlur',
              initialValue: '',
              validateFirst: true,
            })(
              <TextArea
                autoComplete="off"
                label={backLogStore.languages[ `${intlPrefix}.proverIdea`]}
                style={{ width: 400 }}
                autosize={{ minRows: 1, maxRows: 2 }}
                maxLength={50}
              />,
            )}
          </FormItem>
        </Form>

      </Modal>
    );
  }
}

export default Form.create()(withRouter(injectIntl(AgreeHome)));



