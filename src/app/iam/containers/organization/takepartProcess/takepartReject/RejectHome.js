/** 2018/10/30
*作者:高梦龙
*拒绝页面form组件
*/
/*eslint-disable*/
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import querystring from 'query-string';
import { Form, Input, Modal, Divider, Button } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import backLogStore from "../../../../stores/organization/backLog/BackLogStore";
import './index.scss'

const FormItem = Form.Item
const { TextArea } = Input;
const intlPrefix = 'organization.backLog';
@inject('AppState')
@observer
class RejectHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      value: '',
      text: '',
      rejectVisible: false,
      id: this.props.match.params.id,


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
拒绝按钮
*/

  rejectSubmit = () => {
    const taskId = this.getQueryString('taskId');
    this.props.form.validateFields((err, data) => {
      if (!err) {
        const { id }=this.state;
        const { AppState, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        const menuType = AppState.currentMenuType;
        backLogStore.rejectApprovel(organizationId, id, data.taskComment, taskId).then(({ failed, message }) => {
          if (failed) {
            Choerodon.prompt(message);
          } else {
            this.handleReset();
            this.props.history.push(`/iam/takePartProcess?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
            this.setState({
              rejectVisible: false,
            });
          }
        });
      }
    });
  }


  rejectCancel = (e) => {
    this.handleReset();
    const {  onCancel } = this.props;
    onCancel();
  }



  render() {
    const {  intl, form,visible,onCancel } = this.props;
    const { getFieldDecorator } = form;
    return (
      <Modal
        title={backLogStore.languages[ `${intlPrefix}.rejectApprove`]}
        visible={visible}
        onCancel={this.rejectCancel}
        className='reject-content'
        footer={[  <Button
          onClick={this.rejectSubmit}
          style={{backgroundColor: '#2196f3', borderRadius: 5, }}
          type="primary"
          funcType="raised"
        >
          {backLogStore.languages["ok"]}
        </Button>,
        <Button
          onClick={this.rejectCancel}
          funcType="raised"
          style={{ marginRight: '20px' }}
          >
          {backLogStore.languages["cancel"]}
        </Button>
          ]}
        center
      >
        <Form>
          <FormItem style={{ display: 'inline-block', marginTop: 20, marginLeft:15 }}>
            {getFieldDecorator('taskComment', {
              rules: [{
                required: true,
                message: backLogStore.languages[ `${intlPrefix}.taskComment`],
              }],
              validateTrigger: 'onBlur',
              initialValue: '',
              validateFirst: true,
            })(
              <TextArea
                autoComplete="off"
                label={backLogStore.languages[ `${intlPrefix}.rejectIdea`]}
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

export default Form.create()(withRouter(injectIntl(RejectHome)));



