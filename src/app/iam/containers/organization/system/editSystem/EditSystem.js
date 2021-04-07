import React, { Component } from 'react';
import { Form, Input} from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import CreateSystemStore from '../../../../stores/organization/system/createSystem/CreateSystemStore';


const FormItem = Form.Item;

const intlPrefix = 'organization.system'; //语言前缀

const inputWidth = 512; // input框的长度
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 100 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 10 },
  },
};


function noop() {
}

@inject('AppState')
@observer
class EditSystem extends Component {
  state = this.getInitState();

  componentWillMount() {
    this.props.onRef(this);
    this.fetch(this.props);
    this.loadLanguage();

  }



  handleRefush=() => {
    this.setState(this.getInitState(), () => {
      this.loadLanguage();
      this.fetch(this.props);
    });
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.visible) {
      nextProps.form.resetFields();
      this.setState(this.getInitState());
    } else if (!this.props.visible) {
      this.fetch(nextProps);
    }
  }

  getInitState() {
    return {
      rePasswordDirty: false,
      systemInfo: {
        systemId: '',
        systemName: '',
        systemDescription: '',
        objectVersionNumber: '',
      },

      oldSystemId: 0,
      oldSystemIsEnabled: 'Y',
      oldSystemIsDeleted: 'N',

    };
  }

  loadLanguage=() => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CreateSystemStore.queryLanguage(id, AppState.currentLanguage);
  }

  getSystemInfoById(organizationId, systemId) {
    CreateSystemStore.getSystemInfoById(organizationId, systemId)
      .then((data) => {
        // console.log("EditSystem.js line101");
        // console.log(data);
        // console.log("EditSystem.js line101");
        this.setState({
          systemInfo: data,
          oldSystemId: data.systemId,
          oldSystemIsEnabled: data.isEnabled,
          oldSystemIsDeleted: data.isDeleted,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }


  fetch(props) {
    const { AppState, edit, systemId } = props;
    const { id: organizationId } = AppState.currentMenuType;

    if (edit) {
      this.getSystemInfoById(organizationId, systemId);

    } 

  }


  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!err) {
        const { oldSystemId,oldSystemIsEnabled, oldSystemIsDeleted} = this.state;
        const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
        const menuType = AppState.currentMenuType;
        const organizationId = menuType.id;
        onSubmit(data.systemId);
        data.systemId = data.systemId || 0;

        if (edit) {
          if (!modify) {
            Choerodon.prompt(CreateSystemStore.languages['modify.success']);
            OnUnchangedSuccess();
            return;
          }
          const { id, objectVersionNumber } = this.state.systemInfo;
          CreateSystemStore.updateSystem(organizationId, id, {
            ...data = {

              systemName: data.systemName,
              systemDescription: data.systemDescription,
              systemId:  oldSystemId,
              iamOrganizationId: organizationId,
              isEnabled: oldSystemIsEnabled,
              isDeleted: oldSystemIsDeleted

            },
            objectVersionNumber,
          }).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(CreateSystemStore.languages['modify.success']);
              this.handleRefush();
              onSuccess();
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else {
          CreateSystemStore.createSystem(data, organizationId).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(CreateSystemStore.languages['create.success']);
              onSuccess();
              this.handleRefush();
            }
          }).catch((error) => {
            onError();
            Choerodon.handleResponseError(error);
          });
        }
      }
    });
  };



  render() {
    const { AppState} = this.props;
    //const menuType = AppState.currentMenuType;
    const { getFieldDecorator } = this.props.form;
   
    const { systemInfo } = this.state;
    
    return (
      <Content className="sidebar-content">
        <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical" autocomplete="off">
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('systemName', {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: CreateSystemStore.languages[`${intlPrefix}.systemname.require.msg`],
                  },
                ],
              validateTrigger: 'onBlur',
              initialValue: systemInfo.systemName ? systemInfo.systemName : '', 
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CreateSystemStore.languages[`${intlPrefix}.systemname`]}
                type="text"
                style={{ width: inputWidth }}
                maxLength={64}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {
              getFieldDecorator('systemDescription', {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: CreateSystemStore.languages[`${intlPrefix}.systemdescription.require.msg`],
                  },
                ],
                initialValue:systemInfo.systemDescription ? systemInfo.systemDescription : systemInfo.systemName, //???
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={CreateSystemStore.languages[`${intlPrefix}.systemdescription`]}
                  type="text"
                  rows={1}
                  style={{ width: inputWidth }}
                  maxLength={60}
                />,
              )
            }
          </FormItem>



        </Form>
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EditSystem)));
