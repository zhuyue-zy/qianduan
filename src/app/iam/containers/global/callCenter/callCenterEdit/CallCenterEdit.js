import React, { Component } from 'react';
import { Form, Input, Select, InputNumber, Table, Button, Checkbox, Modal, message } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import CallCenterStore from '../../../../stores/globalStores/callCenter/CallCenterStore';
import './CallCenteEditStyle.scss'
const FormItem = Form.Item;
const Option = Select.Option;
const intlPrefix = 'organization.callCenter';
function noop() {
}
@inject('AppState')
@observer
class CallCenterEdit extends Component{
  state = this.getInitState();

  getInitState() {
    return{
      callCenterInfo: {},
      submitting: false,
      open: false,
      edit: false,
      id: '',
      searchLoading: false,
    }
  }


  componentWillMount() {
    this.loadLanguage();
    this.searchCode();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    CallCenterStore.queryLanguage(0, AppState.currentLanguage);
  };


  componentDidMount() {
    const {onRef} = this.props;
    onRef(this);
  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.visible) {
      if (nextProps.edit) {
        this.getCallCenter(nextProps.id);
      }
    } else {
      nextProps.form.resetFields();
      this.setState(this.getInitState());
    }
  }

  getCallCenter=(id) => {
    CallCenterStore.queryDetail(id).then((data) => {
      if (data.success){
          this.setState({
            callCenterInfo: data.result
          })
      }
    })
  }



  searchCode=(value) => {
    if (value){
      CallCenterStore.queryCodeode(value).then((data) => {
        this.setState({
          searchCodeData: data.result.content,
          searchLoading: false,
        });
      })
    } else {
      CallCenterStore.queryCodeode(value).then((data) => {
        this.setState({
          searchCodeData: data.result.content,
          searchLoading: false,
        });
      })
    }
  }

  renderOption = (data) => {
    const result = [];
    if (Array.isArray(data)) {
      if (data.length) {
        data.forEach((item) => {
          result.push(<Option key={item.id} value={item.id} title={item.name} >{item.name}</Option>);
        });
      }
    }
    return result;
  };

  handleSubmit=(e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data) => {
      const { edit, onSubmit = noop, onSuccess = noop } = this.props;
      const { callCenterInfo, id } = this.state;
      onSubmit();
      if (edit){
        const body = {
          iamOrganizationId: callCenterInfo.iamOrganizationId,
          websocketAddress: data.websocketAddress,
          apiAddress: data.apiAddress,
          accessKey: data.accessKey,
          id: callCenterInfo.id,
          objectVersionNumber: callCenterInfo.objectVersionNumber,
        }
        CallCenterStore.handleEdit(body).then((values) => {
          if (values.success){
            onSuccess();
            message.success(CallCenterStore.languages['modify.success'])
          }
        })
      } else {
        const body = {
          iamOrganizationId: data.id,
          websocketAddress: data.websocketAddress,
          apiAddress: data.apiAddress,
          accessKey: data.accessKey,
        }
        CallCenterStore.handleCreate(body).then((values) => {
          if (values.success){
            onSuccess();
            message.success(CallCenterStore.languages['create.success'])
          }
        })
      }
    })
  }

  /*
* @parma弹出页面取消新建或者修改按钮
* */
  handleCancel = () => {
    const {OnCloseModel = noop } = this.props;
    OnCloseModel();
  }

  render(){
    const { getFieldDecorator } = this.props.form;
    const { edit, intl } = this.props;
    const { callCenterInfo, searchCodeData } = this.state;

    return(
      <Content className="sidebar-content">
        <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical">
          <div className="callCenter-edit" style={{ marginTop: 20 }}>
            <div className="callCenter-edit-style">
              <div className="callCenter-edit-name">
                {CallCenterStore.languages['Tenant']}
              </div>
              <FormItem>
                {getFieldDecorator('id', {
                  initialValue: callCenterInfo.name || '',
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    style={{ width: 350 }}
                    placeholder={CallCenterStore.languages[`${intlPrefix}.select.tenant`]}
                    filter
                    allowClear
                    loading={this.state.searchLoading}
                    filterOption={false}
                    optionLabelProp="title"
                    virtualized
                    onSearch={value => this.searchCode(value)}
                    disabled={edit}
                  >


                    {this.renderOption(searchCodeData)}


                  </Select>,
                )}
              </FormItem>
            </div>
          </div>
          <div className="callCenter-edit">
            <div className="callCenter-edit-style">
              <div className="callCenter-edit-name">
                {CallCenterStore.languages[`${intlPrefix}.socket`]}
              </div>
              <FormItem>
                {getFieldDecorator('websocketAddress', {
                  initialValue: callCenterInfo.websocketAddress || '',
                })(
                  <Input
                    autoComplete="off"
                    placeholder={CallCenterStore.languages[`${intlPrefix}.fill.socket`]}
                    style={{ width: 350 }}
                    maxLength={200}
                  />,
                )}
              </FormItem>
            </div>
          </div>
          <div className="callCenter-edit">
            <div className="callCenter-edit-style">
              <div className="callCenter-edit-name">
                {CallCenterStore.languages[`${intlPrefix}.domainName`]}
              </div>
              <FormItem>
                {getFieldDecorator('apiAddress', {
                  initialValue: callCenterInfo.apiAddress || '',
                })(
                  <Input
                    autoComplete="off"
                    placeholder={CallCenterStore.languages[`${intlPrefix}.fill.domainName`]}
                    style={{ width: 350 }}
                    maxLength={200}
                  />,
                )}
              </FormItem>
            </div>
          </div>
          <div className="callCenter-edit">
            <div className="callCenter-edit-style">
              <div className="callCenter-edit-name">
                {CallCenterStore.languages[`${intlPrefix}.key`]}
              </div>
              <FormItem>
                {getFieldDecorator('accessKey', {
                  initialValue: callCenterInfo.accessKey ||'',
                })(
                  <Input
                    autoComplete="off"
                    placeholder={CallCenterStore.languages[`${intlPrefix}.fill.key`]}
                    style={{ width: 350 }}
                    maxLength={100}
                  />,
                )}
              </FormItem>
            </div>
          </div>
        </Form>
      </Content>
    )
  }

}
export default Form.create({})(withRouter(injectIntl(CallCenterEdit)));
