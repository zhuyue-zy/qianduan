import React, { Component } from 'react';
import { Button, Input } from 'yqcloud-ui';
import { axios } from 'yqcloud-front-boot';
import { injectIntl } from 'react-intl';
import MultiLanguageModal from '../MultiLanguageModal';

import './MultiLanguageFormItem.scss';

const intlPrefix = 'organization.message';
@injectIntl
class MultiLanguageFormItem extends Component {
  constructor() {
    super();
    this.multiLanguageValue = {}; //  存放此字段的多语言值
    this.state = {
      showMultiLanguageModal: false, //  控制多语言弹窗的显示与隐藏
    };
  }

  /**
   *  渲染表单组件
   */
  renderMultiFormItem = () => {
    const { value, inputWidth, maxLength, label, type, editable, handleDoubleClick } = this.props;
    return (
      <div onDoubleClick={() => {
        handleDoubleClick();
      }}
      >
        {
          type === 'FormItem' //  根据类型决定返回何种input控件
            ? (
              <Input
                value={value}
                onChange={() => {
                }}
                label={label}
                style={{ width: inputWidth }}
                maxLength={maxLength}
                readOnly
              />
            )
            : (
              <Input
                value={value}
                onChange={() => {
                }}
                readOnly
                underline={editable || false}
                style={{ width: inputWidth }}
              />
            )
        }
        {
          type === 'FormItem'
            ? (
              <Button
                icon="language"
                size="large"
                id="content"
                onClick={() => {
                  this.handleMultiLanguageBtnClick();
                }}
              />
            )
            : (
              <Button
                className={editable ? 'show' : 'hidden'}
                icon="language"
                size="small"
                id="content"
                onClick={() => {
                  this.handleMultiLanguageBtnClick();
                }}
              />
            )
        }

        {this.renderMultiLanguageModal()}
      </div>
    );
  };

  /**
   *  渲染多语言弹窗
   */
  renderMultiLanguageModal = () => {
    const { showMultiLanguageModal } = this.state;
    return (
      <MultiLanguageModal
        visible={showMultiLanguageModal}
        multiLanguageValue={this.multiLanguageValue}
        handleMultiLanguageValue={this.handleMultiLanguageValue.bind(this)}
        onCancel={() => {
          this.setState({
            showMultiLanguageModal: false,
          });
        }}
        createRef={(node) => {
          this.multiLanguageModal = node;
        }}
      />
    );
  };

  /**
   *  处理多语言按钮点击事件
   */
  handleMultiLanguageBtnClick = () => {
    const { requestUrl } = this.props;
    //  无论如何需要获取当前所有语言
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        const language = {};
        allLanguage.forEach((val) => {
          language[val.code] = '';
        });
        if (requestUrl) {
          axios.get(requestUrl)
            .then((data) => {
              this.multiLanguageValue = Object.assign({}, language, data);
              //  清除缓存
              this.multiLanguageModal.clearBuffer();
              //  显示多语言模态框
              this.setState({
                showMultiLanguageModal: true,
              });
            });
        } else {
          //  若是新建记录的多语言控件，则将对语言模态框的语言字段初始化为空，保证有内容显示
          this.multiLanguageValue = language;
          //  清除缓存
          this.multiLanguageModal.clearBuffer();
          this.setState({
            showMultiLanguageModal: true,
          });
        }
      });
  };

  /**
   *  处理多语言框中的值在表单控件上的显示
   *  @param value 多语言对话框返回的多语言信息
   */
  handleMultiLanguageValue = (value) => {
    //  获取父组件上的值信息
    const { handleMultiLanguageValue, field } = this.props;
    //  调用父组件中的方法，处理多语言信息
    handleMultiLanguageValue({
      ...value,
      field,
    });
  };

  render() {
    return (
      this.renderMultiFormItem()
    );
  }
}

MultiLanguageFormItem.propTypes = {};

export default MultiLanguageFormItem;
