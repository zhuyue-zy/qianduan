/*
* @description:报错信息侧边栏
* @author：张凯强
* @update 2018-09-18 16:33
*/
import React, { Component } from 'react';
import { Modal, Form, Input, Table, Checkbox, Button, Icon, Select, message } from 'yqcloud-ui';
import { inject, observer } from 'mobx-react';
import { injectIntl } from 'react-intl';
import { Content, Header } from 'yqcloud-front-boot';

//  加载自定义组件组件

import MultiLanguageFormItem from './MultiLanguageFormItem';
import MessageStore from '../../../../stores/organization/message/MessageStore';

const { Sidebar, confirm } = Modal;
const { Item: FormItem } = Form;
const { Search } = Input;
const intlPrefix = 'organization.message';
@inject('AppState')
@observer
@injectIntl
@Form.create({})
class MessageEditor extends Component {
  state = this.getInitState();

  //  存放原始数据，用于和修改后的数据比较，判断是否有改动
  originData = [];

  multiLanguageValue = {};

  // 存放多语言信息
  multiLanguageList = [];

  contentChanged = false; //  记录页面上的内容有没有被修改

  getInitState() {
    return {
      dataSource: [], //  存放数据源
      submitting: false,
      selectedRecord: [], // 查询返回所有数据
      toggleMultiLanguageTableCell: false, //  控制带多语言的表格单元的刷新
    };
  }

  componentWillMount() {
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

  fetch(props) {
    const { AppState, edit, id, selectedData } = props;
    if (edit) {
      MessageStore.loadMessageById(selectedData)
        .then((data) => {
          this.originData = data;
          this.setState({
            showEditorSidebar: true,
            operationType: 'modify',
            selectedRecord: data,
            showPopover: false,
            edit: true,
          });
        });
    }
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    if(this.props.AppState.currentMenuType.type==='site'){
      MessageStore.queryLanguage(0, AppState.currentLanguage);
    }else {
      MessageStore.queryLanguage(id, AppState.currentLanguage);
    }
  };

  //  渲染标题
  renderTitle = () => {
    const { edit } = this.state;
    if (edit) {
      return MessageStore.languages[`${intlPrefix}.modify`];
    } else {
      return MessageStore.languages[`${intlPrefix}.create`];
    }
  };

  /**
   *  处理表单输入控件返回的多语言信息
   *  @param value 多语言表单控件中返回的数据
   */
  handleMultiLanguageValue = ({ retObj, retList, field }) => {
    const { form: { setFieldsValue } } = this.props;
    this.multiLanguageValue[field] = retObj;
    this.multiLanguageList = retList;
    setFieldsValue({
      [field]: retObj.zh_CN,
    });
  };

  /**
   *  渲染多语言表单输入框
   */
  renderMultiLanguageInput = (field) => {
    const inputWidth = 512;
    const { operationType, edit } = this.props;
    const { selectedRecord } = this.state;
    const { messageId, languageField } = selectedRecord;
    const requestUrl = `fnd/v1/sys/messages/info/${messageId}/${languageField}?columnName=${field}`;
    return (
      <MultiLanguageFormItem
        label={MessageStore.languages[`${intlPrefix}.content`]}
        requestUrl={!edit ? null : requestUrl}
        handleMultiLanguageValue={this.handleMultiLanguageValue.bind(this)}
        inputWidth={inputWidth}
        maxLength={500}
        type="FormItem"
        field={field}
      />
    );
  };

  // 验证信息编码
  verificationCode = (rule, code, callback, data) => {
    const { edit, AppState, intl, store } = this.props;
    const { selectedRecord } = this.state;
    if (!edit || code !== selectedRecord.messageCode) {
      if (/\s/.test(code)) {
        callback(MessageStore.languages[`${intlPrefix}.code.space.msg`]);
        return;
      }
      store.verificationCode({
        ...data,
      }).then((failed) => {
        if (failed) {
          callback(MessageStore.languages[`${intlPrefix}.code.exist.msg`]);
        } else {
          callback();
        }
      });
    } else {
      callback();
    }
  };

  //  渲染表单
  renderForm = () => {
    //  获取表单控件
    const { form: { getFieldDecorator }, operationType, intl } = this.props;
    const { selectedRecord } = this.state;
    const inputWidth = 512;
    return (
      <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical">
        {/* 代码字段 */}
        <FormItem>
          {getFieldDecorator('messageCode', {
            rules: [
              {
                required: true, //  必填字段
                //  若未填报出的警告
                message: MessageStore.languages[`${intlPrefix}.warning.messageCode`],
              },
              {
                pattern: /^([A-Za-z0-9.])+$/,
                message: MessageStore.languages[`${intlPrefix}.correct.messageCode`],
              },
              {
                validator: this.verificationCode,
                validateTrigger: 'onChange',
              },
            ],
            initialValue: selectedRecord.messageCode ? selectedRecord.messageCode : '',
          })(<Input
            autoComplete="off"
            maxLength={50}
            label={MessageStore.languages[`${intlPrefix}.messageCode`]}
            style={{ width: inputWidth }}
            disabled={operationType === 'modify'}
          />)}
        </FormItem>
        {/* 提示内容字段 */}
        <FormItem>
          {getFieldDecorator('content', {
            rules: [
              {
                required: true, //  必填字段
                //  若未填报出的警告
                message: MessageStore.languages[`${intlPrefix}.warning.content`],
              },
            ],
            initialValue: selectedRecord.content ? selectedRecord.content : '',
          })(this.renderMultiLanguageInput('content'))}
        </FormItem>
        {/* 位置字段 */}
        <FormItem>
          {getFieldDecorator('placement', {
            initialValue: selectedRecord.placement ? selectedRecord.placement : '',
          })(
            <Select
              label={MessageStore.languages[`${intlPrefix}.placement`]}
              style={{ width: inputWidth }}
            >
              <Option value="topLeft">{MessageStore.languages[`${intlPrefix}.topLeft`]}</Option>
              <Option value="top">{MessageStore.languages[`${intlPrefix}.top`]}</Option>
              <Option value="topRight">{MessageStore.languages[`${intlPrefix}.topRight`]}</Option>
              <Option value="left">{MessageStore.languages[`${intlPrefix}.left`]}</Option>
              <Option value="right">{MessageStore.languages[`${intlPrefix}.right`]}</Option>
              <Option value="leftBottom">{MessageStore.languages[`${intlPrefix}.leftBottom`]}</Option>
              <Option value="bottom">{MessageStore.languages[`${intlPrefix}.bottom`]}</Option>
              <Option value="rightBottom">{MessageStore.languages[`${intlPrefix}.rightBottom`]}</Option>
            </Select>,
          )}
        </FormItem>
        {/* 信息类型字段 */}
        <FormItem>
          {getFieldDecorator('type', {
            initialValue: selectedRecord.type ? selectedRecord.type : '',
          })(
            <Select
              label={MessageStore.languages[`${intlPrefix}.type`]}
              style={{ width: inputWidth }}
            >
              <Option value="info">{MessageStore.languages[`${intlPrefix}.info`]}</Option>
              <Option value="warning">{MessageStore.languages[`${intlPrefix}.warning`]}</Option>
              <Option value="error">{MessageStore.languages[`${intlPrefix}.error`]}</Option>
              <Option value="success">{MessageStore.languages[`${intlPrefix}.success`]}</Option>
            </Select>,
          )}
        </FormItem>
      </Form>
    );
  };

  handleTabClose = () => {
    this.setState({
      sidebar: false,
      submitting: false,
    });
  };

  //  处理submit请求
  handleSubmit = (e) => {
    const { operationType, record, store, edit, form: { validateFields }, handleRefresh } = this.props;
    const { selectedRecord } = this.state;
    const { messageId, objectVersionNumber } = selectedRecord;
    //  根据操作类型决定进行何种操作
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!err) {
        if (edit) {
          //  更新操作
          MessageStore.updateMessage(Object.assign({}, {
            messageId,
            objectVersionNumber,
            ...data,
            __tls: this.multiLanguageValue,
            language: this.multiLanguageList,
          }))
            .then(() => {
              const { intl } = this.props;
              Choerodon.prompt(MessageStore.languages['modify.success']);
              handleRefresh();
            });
        } else {
          this.setState({ submitting: true });
          if (operationType === 'create') {
            MessageStore.createCode({
              ...data,
              __tls: this.multiLanguageValue,
              language: this.multiLanguageList,
            })
              .then((data) => {
                const { intl } = this.props;
                Choerodon.prompt(MessageStore.languages['create.success']);
                handleRefresh();
              });
          }
        }
      }
    });
  };

  /**
   *  处理取消按钮事件
   */
  handleCancel = (e) => {
    const { form: { isModifiedFields }, edit } = this.props;
    const { selectedRecord } = this.state;
    // const origin = [];
    //  若表单或表格数据有变化，则设置contentChanged为true
    if (edit) {
      this.contentChanged = !(Object.is(selectedRecord, this.originData) && !isModifiedFields());
    } else if (this.originData.length == 0) {
      this.contentChanged = !(true && !isModifiedFields());
    } else {
      this.contentChanged = !(Object.is(selectedRecord, this.originData) && !isModifiedFields());
    }
  };

  render() {
    this.handleCancel();
    //  获取父组件参数
    const { visible, onCancel } = this.props;

    return (
      <Sidebar
        visible={visible}
        title={this.renderTitle()}
        okText={MessageStore.languages.save}
        cancelText={MessageStore.languages.cancel}
        onOk={this.handleSubmit.bind(this)}
        onCancel={() => {
          onCancel(this.contentChanged);
        }}
      >
        <Content
          className="sidebar-content"
        >
          {/* 渲染表单结构 */}
          {this.renderForm()}
        </Content>
      </Sidebar>
    );
  }
}

MessageEditor.propTypes = {};

export default MessageEditor;
