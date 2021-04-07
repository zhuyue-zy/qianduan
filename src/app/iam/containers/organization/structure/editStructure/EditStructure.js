import React, { Component } from 'react';
import { Form, Input} from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import CreateStructureStore from '../../../../stores/organization/structure/createStructure/CreateStructureStore';


const FormItem = Form.Item;

const intlPrefix = 'organization.structure'; //语言前缀

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
class EditStructure extends Component {
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
      structureInfo: {
        structureId: '',
        structureName: '',
        structureDescription: '',
        objectVersionNumber: '',
      },

      oldStructureId: 0,
      oldStructureIsEnabled: 'Y',
      oldStructureIsDeleted: 'N',

    };
  }

  loadLanguage=() => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CreateStructureStore.queryLanguage(id, AppState.currentLanguage);
  }

  getStructureInfoById(organizationId, structureId) {
    CreateStructureStore.getStructureInfoById(organizationId, structureId)
      .then((data) => {
        this.setState({
          structureInfo: data,
          oldStructureId: data.structureId,
          oldStructureIsEnabled: data.isEnabled,
          oldStructureIsDeleted: data.isDeleted,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }


  fetch(props) {
    const { AppState, edit, structureId } = props;
    const { id: organizationId } = AppState.currentMenuType;

    if (edit) {
      this.getStructureInfoById(organizationId, structureId);

    } 

  }


  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!err) {
        const { oldStructureId,oldStructureIsEnabled, oldStructureIsDeleted} = this.state;
        const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
        const menuType = AppState.currentMenuType;
        const organizationId = menuType.id;
        onSubmit(data.structureId);
        data.structureId = data.structureId || 0;

        if (edit) {
          if (!modify) {
            Choerodon.prompt(CreateStructureStore.languages['modify.success']);
            OnUnchangedSuccess();
            return;
          }
          const { id, objectVersionNumber } = this.state.structureInfo;
          CreateStructureStore.updateStructure(organizationId, id, {
            ...data = {

              structureName: data.structureName,
              structureDescription: data.structureDescription,
              structureId:  oldStructureId,
              iamOrganizationId: organizationId,
              isEnabled: oldStructureIsEnabled,
              isDeleted: oldStructureIsDeleted

            },
            objectVersionNumber,
          }).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(CreateStructureStore.languages['modify.success']);
              this.handleRefush();
              onSuccess();
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else {
          CreateStructureStore.createStructure(data, organizationId).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(CreateStructureStore.languages['create.success']);
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
   
    const { structureInfo } = this.state;
    
    return (
      <Content className="sidebar-content">
        <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical" autocomplete="off">
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('structureName', {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: CreateStructureStore.languages[`${intlPrefix}.structurename.require.msg`],
                  },
                ],
              validateTrigger: 'onBlur',
              initialValue: structureInfo.structureName ? structureInfo.structureName : '', 
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CreateStructureStore.languages[`${intlPrefix}.structurename`]}
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
              getFieldDecorator('structureDescription', {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: CreateStructureStore.languages[`${intlPrefix}.structuredescription.require.msg`],
                  },
                ],
                initialValue:structureInfo.structureDescription ? structureInfo.structureDescription : structureInfo.structureName, //???
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={CreateStructureStore.languages[`${intlPrefix}.structuredescription`]}
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

export default Form.create({})(withRouter(injectIntl(EditStructure)));
