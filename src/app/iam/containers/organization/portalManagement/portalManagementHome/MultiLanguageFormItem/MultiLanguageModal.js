import React, { Component } from 'react';
import { Modal, Form, Input, Button } from 'yqcloud-ui';
import { Content, Header } from 'yqcloud-front-boot';
import { FormattedMessage, injectIntl } from 'react-intl';
import { inject } from 'mobx-react';
import './MultiLanguageModal.scss';


const intlPrefix = 'organization.lookup';
const { Item: FormItem } = Form;

@Form.create({})
@injectIntl
@inject('AppState')
class MultiLanguageModal extends Component {
  componentWillMount() {
    const { AppState } = this.props;
  }

  componentDidMount() {
    const { createRef } = this.props;
    createRef(this);
  }

  renderLable = (key, languageEnv) => {
    let change = '';
    languageEnv.forEach((item, index) => {
      if (item.code === key) {
        change = item.name;
      }
    });
    return change;
  };

  /**
   *  根据传入的多语言信息动态渲染表单
   */
  renderForm = () => {
    const { multiLanguageValue, form: { getFieldDecorator }, AppState, required, languageEnv } = this.props;
    const formItems = []; //  定义FormItem数组
    const keys = Object.keys(multiLanguageValue);
    keys.forEach((key) => {
      formItems.push(
        <FormItem key={key}>
          {getFieldDecorator(key, {
            rules: [
              {
                required: required ? AppState.currentLanguage === key : false, //  必填字段
                message: 'please enter code!', //  若未填报出的警告
              },
            ],
            initialValue: multiLanguageValue[key],
          })(
            <Input label={this.renderLable(key, languageEnv)} />,
          )}
        </FormItem>,
      );
    });
    return (
      <Form layout="vertical">
        {formItems}
      </Form>
    );
  };

  /**
   *  处理点击确认按钮操作
   */
  handleOk = () => {
    const { form: { validateFields }, handleMultiLanguageValue, onCancel } = this.props;
    validateFields((err, data) => {
      if (!err) {
        const retObj = Object.assign({}, data);
        const keys = Object.keys(data);
        const retList = [];
        keys.forEach((key) => {
          retList.push(key);
        });
        handleMultiLanguageValue({
          retObj,
          retList,
        });
        onCancel();
      }
    });
  };

  /**
   *  清除表单缓存
   */
  clearBuffer = () => {
    const { form: { resetFields } } = this.props;
    resetFields();
  };

  render() {
    const { visible, onCancel } = this.props;
    return (
      <Modal
        className="itsm-language-modal"
        visible={visible}
        onCancel={onCancel}
        title={<FormattedMessage id={`${intlPrefix}.editor.multiLanguage`} />}
        onOk={this.handleOk.bind(this)}
        footer={[
          <Button
            key="submit"
            funcType="raised"
            type="primary"
            onClick={(e) => {
              this.handleOk(e);
            }}
          >
            保存
          </Button>,
          <Button
            key="back"
            funcType="raised"
            onClick={() => {
              onCancel();
            }}
          >
            取消
          </Button>,
        ]}
      >
        <Content>
          {this.renderForm()}
        </Content>
      </Modal>
    );
  }
}

MultiLanguageModal.propTypes = {};

export default MultiLanguageModal;
