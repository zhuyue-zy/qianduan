import React, { Component } from 'react';
import { Input, Icon } from 'yqcloud-ui';
import { axios } from 'yqcloud-front-boot';
import { inject } from 'mobx-react';
import { injectIntl } from 'react-intl';
import MultiLanguageModal from './MultiLanguageModal';

import './MultiLanguageFormItem.scss';

@injectIntl
@inject('AppState')
class MultiLanguageFormItem extends Component {
  constructor() {
    super();
    this.multiLanguageValue = {}; //  存放此字段的多语言值
    this.state = {
      showMultiLanguageModal: false, //  控制多语言弹窗的显示与隐藏
      modifyValue: '',
    };
  }

  componentDidMount() {
    // this.fetch(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.value !== nextProps.value) {
      this.setState({ modifyValue: nextProps.value });
    }
  }

  componentWillMount() {
    const { required } = this.props;
    // if (typeof (required) === 'undefined') {
    //   throw new Error('required is 必填的')
    // } else {
    //   this.fetch(this.props);
    // }
    // this.fetch(this.props);
  }

  // fetch(props) {
  //   const { languageEnv } = props;
  // }

  /**
   *  渲染表单组件
   */
  renderMultiFormItem = () => {
    const { value, inputWidth, maxLength, label, type, editable, handleDoubleClick } = this.props;
    const { modifyValue } = this.state;
    return (
      <div onDoubleClick={() => {
        if (handleDoubleClick) {
          handleDoubleClick();
        }
      }}
      >
        {
          type === 'FormItem' //  根据类型决定返回何种input控件
            ? (
              <Input
                defaultValue={modifyValue === '' ? value : modifyValue}
                onChange={(e) => {
                  this.setState({
                    modifyValue: e.target.value,
                  });
                  this.changeMultiLanguageModalValue(e.target.value);
                }}
                value={modifyValue === '' ? value : modifyValue}
                label={label}
                style={{ width: inputWidth, marginLeft: 10 }}
                // maxLength={maxLength}
                // readOnly
              />
            )
            : (
              <Input
                value={modifyValue === '' ? value : modifyValue}
                onChange={(e) => {
                  this.changeMultiLanguageModalValue(e.target.value);
                  this.setState({
                    modifyValue: e.target.value,
                  });
                }}
                readOnly={!editable}
                underline={editable || false}
                style={{ width: inputWidth }}
                // maxLength={maxLength}
              />
            )
        }
        {
          type === 'FormItem'
            ? (
              <Icon
                className="btn-multi-language_Form"
                type="language"
                style={{ marginTop: 7 }}
                onClick={() => {
                  this.handleMultiLanguageBtnClick();
                }}
              />
            )
            : (
              <Icon
                className={`${editable ? 'show' : 'hidden'} btn-multi-language_Table`}
                type="language"
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

  /* 改变多语言组件中的值 */
  changeMultiLanguageModalValue = (value) => {
    const { requestUrl, AppState, languageEnv } = this.props;
    const { multiLanguageValue } = this.state;
    let retObjs = [];
    const retLists = [];
    let keys = [];
    const currentLanguage1 = AppState.currentLanguage;
    //  无论如何需要获取当前所有语言
    if (requestUrl) {
      axios.get(requestUrl)
        .then((data) => {
          this.multiLanguageValue = Object.assign({}, data);
          keys = Object.keys(data);
          keys.forEach((key) => {
            retLists.push(key);
          });
          retObjs = Object.assign({}, data);
          Object.keys(retObjs).forEach((v) => {
            retObjs[v] = value;
          });
          this.handleMultiLanguageValue({
            retObj: retObjs,
            retList: retLists,
          });
        });
    } else {
      //  若是新建记录的多语言控件，则将对语言模态框的语言字段初始化为空，保证有内容显示
      // this.multiLanguageValue = language;
      const language = {};
      languageEnv.forEach((val) => {
        language[val.code] = '';
      });
      keys = Object.keys(language);
      keys.forEach((key) => {
        retLists.push(key);
      });
      retObjs = Object.assign({}, language);
      Object.keys(retObjs).forEach((v) => {
        retObjs[v] = value;
      });
      this.handleMultiLanguageValue({
        retObj: retObjs,
        retList: retLists,
      });
    }
  };

  /**
   *  渲染多语言弹窗
   */
  renderMultiLanguageModal = () => {
    const { required, languageEnv } = this.props;
    const { showMultiLanguageModal } = this.state;
    return (
      <MultiLanguageModal
        visible={showMultiLanguageModal}
        multiLanguageValue={this.multiLanguageValue}
        handleMultiLanguageValue={this.handleMultiLanguageValue.bind(this)}
        required={required}
        languageEnv={languageEnv}
        onCancel={() => {
          this.setState({
            showMultiLanguageModal: false,
          });
        }}
        createRef={(node) => {
          this.modal = node;
        }}
      />
    );
  };

  /**
   *  处理多语言按钮点击事件
   */
  handleMultiLanguageBtnClick = () => {
    const { requestUrl, FormLanguage } = this.props;
    //  清除缓存
    if (FormLanguage && Object.keys(FormLanguage).length < 1) {
      this.modal.clearBuffer();
    }
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
              //  显示多语言模态框
              this.setState({
                showMultiLanguageModal: true,
              });
            });
        } else {
          //  若是新建记录的多语言控件，则将对语言模态框的语言字段初始化为空，保证有内容显示
          this.modal.clearBuffer();
          this.multiLanguageValue = language;
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
