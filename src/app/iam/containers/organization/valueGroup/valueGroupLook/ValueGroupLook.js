/*eslint-disable*/
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import querystring from 'query-string';
import { Button, Form, Input, Modal, Table, Tooltip, DatePicker, Select } from 'yqcloud-ui';
import { axios, Content, Header, Page, Permission, stores } from 'yqcloud-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import LOV from '../../../../components/lov'
import LOVInput from '../../../../components/lov/LOVInput'

const FormItem = Form.Item


@inject('AppState')
@observer
class ValueGroupLook extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      value: '',
      text: '',
      LOVVisible: false,
      formItemCode: '',
      LOVCode: '',
      lov: '',
    };
  }


   getSearchString = (key, Url) =>{
    const { AppState } =this.props;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    var str = Url;
    str = str.substring(1, str.length); // 获取URL中?之后的字符（去掉第一位的问号）
    // 以&分隔字符串，获得类似name=xiaoli这样的元素数组
    var arr = str.split("&");
    var arrs = str.split("?");
    var obj = new Object();
    if (organizationId === undefined ){
      // 将每一个数组元素以=分隔并赋给obj对象
      for (var i = 0; i < arrs.length; i++) {
        var tmp_arr = arrs[i].split("=");
        obj[decodeURIComponent(tmp_arr[0])] = decodeURIComponent(tmp_arr[1]);
      }
      return obj[key];
    } else {
      // 将每一个数组元素以=分隔并赋给obj对象
      for (var i = 0; i < arr.length; i++) {
        var tmp_arr = arr[i].split("=");
        obj[decodeURIComponent(tmp_arr[0])] = decodeURIComponent(tmp_arr[1]);
      }
      return obj[key];
    }
  }


  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, { lov }, modify) => {
      if (!err) {
        this.setState({ lov })
        this.handleReset();
      }
    });
  };
  handleReset = () => {
    this.props.form.resetFields();
  }
  render() {
    const { getFieldDecorator } = this.props.form
    const hash = window.location.hash
    const code = this.getSearchString('code', hash)
    const {
      value, text, LOVVisible, formItemCode, LOVCode, lov
    } = this.state;
    const formItemLayout = {
      labelCol: {
        md: { span: 12 },
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        md: { span: 24 },
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };
    return (
      <Page
        service={[
          'iam-service.organization.list',
          'iam-service.organization.check',
          'iam-service.organization.query',
          'iam-service.organization.create',
          'iam-service.organization.update',
          'iam-service.organization.disableOrganization',
          'iam-service.organization.enableOrganization',
        ]}
      >
        <Header title="LOV预览"></Header>
        <Content>
          <Form style={{ display: 'inline-block', width: 550 }}>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator('lov', {
                rules: [],
                initialValue: value,
              })(
                <LOVInput
                  code={code}
                  label="lov"
                  form={this.props.form}
                  formCode="lov"
                  organizationId={this.props.AppState.currentMenuType.organizationId}
                  style={{ width: 512 }}
                  text={text}
                  onLOV={() => {
                    this.setState({
                      LOVVisible: true,
                      formItemCode: 'lov',
                      LOVCode: code,
                    })
                  }}
                  onSelect={(text) => {
                    this.setState({
                      text
                    })
                  }}
                />,
              )}
            </FormItem>
          </Form>
          <LOV
            code={LOVCode}
            firstForm={this.props.form}
            formItem={formItemCode}
            organizationId={this.props.AppState.currentMenuType.organizationId}
            visible={LOVVisible}
            onChange={(visible, text = text) => {
              this.setState({
                LOVVisible: visible,
                text,
              })
            }}
          />
          <Button style={{ display: 'inline-block' }} type="primary" funcType="raised" onClick={this.handleSubmit}>显示</Button>
          <p>{lov}</p>
        </Content>
      </Page>
    );
  }
}

export default Form.create()(withRouter(injectIntl(ValueGroupLook)));
