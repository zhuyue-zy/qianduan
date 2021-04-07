import React, { Component } from 'react';
import { Form, Input} from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import CreateCustomerStore from '../../../../stores/organization/customer/createCustomer/CreateCustomerStore';
import CustomerStore from '../../../../stores/organization/customer/CustomerStore';
import { Select } from 'yqcloud-ui';
import { Cascader } from 'yqcloud-ui';
import { Col, Row } from 'choerodon-ui';
const FormItem = Form.Item;
const { Option } = Select;
const intlPrefix = 'organization.customer'; //语言前缀
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
class EditCustomer extends Component {
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
      customerInfo: {
        customerId: '',
        customerName: '',
        customerCode: '',
        customerShortName: '',
        industry: '',
        scale: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        city: '',
        province: '',
        country: '',
        address: '',
        area: '',
        postcode: '',
        customerManagerName: '',
        customerManager: '',
        remark: '',
        objectVersionNumber: '',
      },
      
      oldCustomerId: 0,
      oldCustomerIsEnabled: 'Y',
      oldCustomerIsDeleted: 'N',
      provinceList:[],
      cityList:[],

    };
  }

  loadLanguage=() => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CreateCustomerStore.queryLanguage(id, AppState.currentLanguage);
  }

  getCustomerInfoById(organizationId, customerId) {
    CreateCustomerStore.getCustomerInfoById(organizationId, customerId)
      .then((data) => {
        this.setState({
          customerInfo: data,
          oldCustomerId: data.customerId,
          oldCustomerIsEnabled: data.isEnabled,
          oldCustomerIsDeleted: data.isDeleted,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }


  fetch(props) {
    const { AppState, edit, customerId } = props;
    const { id: organizationId } = AppState.currentMenuType;
    let conditionStr = typeof(condition) == "undefined" ? "" : condition;
    if (edit) {
      this.getCustomerInfoById(organizationId, customerId);

    } 
    CreateCustomerStore.queryScaleList(organizationId);
    CreateCustomerStore.queryIndustryList(organizationId);
    CreateCustomerStore.queryAreaList(organizationId);
    CreateCustomerStore.queryEmployeeList(organizationId,conditionStr);
    CreateCustomerStore.queryCountryList(organizationId);
    
  }


  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!err) {
        const {oldCustomerId,oldCustomerIsEnabled, oldCustomerIsDeleted} = this.state;
        const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
        const menuType = AppState.currentMenuType;
        const organizationId = menuType.id;
        onSubmit(data.customerId);
        data.customerId = data.customerId || 0;
        if (edit) {
          if (!modify) {
            Choerodon.prompt(CreateCustomerStore.languages['modify.success']);
            OnUnchangedSuccess();
            return;
          }
          const { id, objectVersionNumber } = this.state.customerInfo;
          CreateCustomerStore.updateCustomer(organizationId, id, {
            ...data = {

              customerName: data.customerName,
              customerCode: data.customerCode,
              customerShortName: data.customerShortName,
              industry: data.industry,
              scale: data.scale,
              area: data.area,
              contactPerson: data.contactPerson,
              contactEmail: data.contactEmail,
              contactPhone: data.contactPhone,
              address: data.address,
              postcode: data.postcode,
              customerManagerName: data.customerManagerName,
              customerManager: data.customerManager,
              remark: data.remark,
              country: data.country,
              province: data.province,
              city: data.city,
              customerId:  oldCustomerId,
              iamOrganizationId: organizationId,
              isEnabled: oldCustomerIsEnabled,
              isDeleted: oldCustomerIsDeleted

            },
            objectVersionNumber,
          }).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(CreateCustomerStore.languages['modify.success']);
              this.handleRefush();
              onSuccess();
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else {
            CreateCustomerStore.createCustomer(data, organizationId).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(CreateCustomerStore.languages['create.success']);
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

  //handleChangeCity=(value)=>{
    //const countryLists =CreateCustomerStore.getCountryList;
   // const provinceLists = countryLists.filter(i=>i.lookupValue===value)[0].children
    //this.setState({provinceLists})
 // }

  handleChangeProvince=(value)=>{
    const countryLists = CreateCustomerStore.getCountryList;
    const provinceList=countryLists.filter(i=>i.lookupValue===value)[0].childrenList||[]
    console.log('countryLists.filter(i=>i.lookupValue===value)',countryLists.filter(i=>i.lookupValue===value) );
    this.setState({provinceList})
  this.props.form.setFieldsValue({
        province: '',
        city: '',
      })
  }
  handleChangeCity=(value)=>{
    console.log('value',value)
     const {provinceList}=this.state
          const cityList=provinceList.filter(i=>i.lookupValue===value)[0].childrenList||[]
          this.setState({cityList})
      this.props.form.setFieldsValue({
        province: '',
        city: '',
      })
  }
  handleEdit=(record)=>{

  }
  render() {
    const { AppState} = this.props;
    //const menuType = AppState.currentMenuType;
    const { getFieldDecorator } = this.props.form;
    const scaleLists = CreateCustomerStore.getScaleList;
    const areaLists = CreateCustomerStore.getAreaList;
    const employeeLists = CreateCustomerStore.getEmployeeList;
    const industryLists = CreateCustomerStore.getIndustryList;
    const countryLists = CreateCustomerStore.getCountryList;
    const { customerInfo,provinceList,cityList } = this.state;
    const lanOption_Sca = [];
    const lanOption_Are = [];
    const lanOption_Ind = [];
    const lanOption_Emp = [];
    const lanOption_Cou = [];//全部数据
    const lanOption_Pro = [];// 省份
    const lanOption_city = [];// 市

    

    scaleLists.forEach((item) => {
      lanOption_Sca.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    industryLists.forEach((item) => {
      lanOption_Ind.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    areaLists.forEach((item) => {
      lanOption_Are.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    employeeLists.forEach((item) => {
      lanOption_Emp.push(<Option key={item.employeeId} value={item.employeeId}>{item.employeeName}</Option>);
    });
    countryLists.forEach((item) => {
      lanOption_Cou.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
  
    provinceList.forEach((item) => {
      lanOption_Pro.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    cityList.forEach((item) => {
      lanOption_city.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    return (
      <Content className="sidebar-content">
        <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical" autocomplete="off">
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('customerName', {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: CreateCustomerStore.languages[`${intlPrefix}.customername.require.msg`],
                  },
                ],
              validateTrigger: 'onBlur',
              initialValue: customerInfo.customerName ? customerInfo.customerName : '', 
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CreateCustomerStore.languages[`${intlPrefix}.customername`]}
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
              getFieldDecorator('customerCode', {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: CreateCustomerStore.languages[`${intlPrefix}.customercode.require.msg`],
                  },
                ],
                initialValue:customerInfo.customerCode ? customerInfo.customerCode : '', // : customerInfo.customerName, //???
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={CreateCustomerStore.languages[`${intlPrefix}.customercode`]}
                  type="text"
                  rows={1}
                  style={{ width: inputWidth }}
                  maxLength={60}
                  disabled={customerInfo.customerCode}
                />,
              )
            }
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {
              getFieldDecorator('customerShortName', {
                rules: [
                  {
                    required: false,
                    whitespace: true,
                    message: CreateCustomerStore.languages[`${intlPrefix}.customershortname.require.msg`],
                  },
                ],
                
                initialValue:customerInfo.customerShortName ? customerInfo.customerShortName : '',//customerInfo.customerName, //???
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={CreateCustomerStore.languages[`${intlPrefix}.customershortname`]}
                  type="text"
                  rows={1}
                  style={{ width: inputWidth }}
                  maxLength={60}
                />,
              )
            }
          </FormItem>                 
             <FormItem
                      {...formItemLayout}
                    >
                      {getFieldDecorator('industry', {
                        initialValue: customerInfo.industry || 'INTER',
                        rules: [{
                          required: true,
                          message: CreateCustomerStore.languages[`${intlPrefix}.industry.require.msg`],
                        }],

                      })(
                        <Select

                          label={CreateCustomerStore.languages[`${intlPrefix}.industry`]}
                          style={{ width: inputWidth }}
                          onChange={this.handleInsideChange}
                        >
                          {lanOption_Ind}
                        </Select>,
                      )}
                    </FormItem>
                    
                    <FormItem
                      {...formItemLayout}
                    >
                      {getFieldDecorator('scale', {
                        initialValue: customerInfo.scale || 'BIG',
                        rules: [{
                          required: true,
                          message: CreateCustomerStore.languages[`${intlPrefix}.scale.require.msg`],
                        }],

                      })(
                        <Select

                          label={CreateCustomerStore.languages[`${intlPrefix}.scale`]}
                          style={{ width: inputWidth }}
                          onChange={this.handleInsideChange}
                        >
                          {lanOption_Sca}
                        </Select>,
                      )}
                    </FormItem>
                    
                    <FormItem
            {...formItemLayout}
          >
            {
              getFieldDecorator('contactPerson', {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: CreateCustomerStore.languages[`${intlPrefix}.contactperson.require.msg`],
                  },
                ],
                
                initialValue:customerInfo.contactPerson ? customerInfo.contactPerson : '',//customerInfo.customerName, //???
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={CreateCustomerStore.languages[`${intlPrefix}.contactperson`]}
                  type="text"
                  rows={1}
                  style={{ width: inputWidth }}
                  maxLength={60}
                />,
              )
            }
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {
              getFieldDecorator('contactEmail', {
                rules: [
                  {
                    required: false,
                    whitespace: true,
                    message: CreateCustomerStore.languages[`${intlPrefix}.contactemail.require.msg`],
                  },
                ],
                
                initialValue:customerInfo.contactEmail ? customerInfo.contactEmail : '',//customerInfo.customerName, //???
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={CreateCustomerStore.languages[`${intlPrefix}.contactemail`]}
                  type="text"
                  rows={1}
                  style={{ width: inputWidth }}
                  maxLength={60}
                />,
              )
            }
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {
              getFieldDecorator('contactPhone', {
                rules: [
                  {
                    required: false,
                    whitespace: true,
                    message: CreateCustomerStore.languages[`${intlPrefix}.contactphone.require.msg`],
                  },
                ],
                
                initialValue:customerInfo.contactPhone ? customerInfo.contactPhone : '',//customerInfo.customerName, //???
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={CreateCustomerStore.languages[`${intlPrefix}.contactphone`]}
                  type="text"
                  rows={1}
                  style={{ width: inputWidth }}
                  maxLength={60}
                />,
              )
            }
          </FormItem>
      <Row>
        <Col span={6}>                   
          <FormItem
                      {...formItemLayout}
                    >
                      {getFieldDecorator('country', {
                      //  initialValue: customerInfo.countryMeaning || '中国',
                        rules: [{
                          required: true,
                          message: CreateCustomerStore.languages[`${intlPrefix}.country.require.msg`],
                        }],
                        initialValue:customerInfo.country ? customerInfo.country : '',
                      })(
                        <Select

                          label={CreateCustomerStore.languages[`${intlPrefix}.country`]}
                          style={{ width: 200 }}
                          onChange={this.handleChangeProvince}
                        >
                          {lanOption_Cou}
                        </Select>,
                      )}
                    </FormItem>
                    </Col>
                    <Col span={6}>
                    <FormItem
                      {...formItemLayout}
                    >
                      {getFieldDecorator('province', {
                        // initialValue: customerInfo.province || '四川',
                        rules: [{
                          required: true,
                          message: CreateCustomerStore.languages[`${intlPrefix}.province.require.msg`],
                        }],
                        //initialValue:customerInfo.province ? customerInfo.province : '',
                      })(
                        <Select

                          label={CreateCustomerStore.languages[`${intlPrefix}.province`]}
                          style={{ width: 200 }}
                          onChange={this.handleChangeCity}
                        >
                          {lanOption_Pro}
                        </Select>,
                      )}
                  </FormItem>
                  </Col>
                  <Col span={6}>
                  <FormItem
                      {...formItemLayout}
                    >
                      {getFieldDecorator('city', {
                        // initialValue: customerInfo.city || '成都',
                        rules: [{
                          required: true,
                          message: CreateCustomerStore.languages[`${intlPrefix}.city.require.msg`],
                        }],
                        //initialValue:customerInfo.city ? customerInfo.city : '',
                      })(
                        <Select

                          label={CreateCustomerStore.languages[`${intlPrefix}.city`]}
                          style={{ width: 200 }}
                        >
                          {lanOption_city}
                        </Select>,
                      )}
                  </FormItem>
                </Col>
              </Row>  
          <FormItem
            {...formItemLayout}
          >
            {
              getFieldDecorator('address', {
                rules: [
                  {
                    required: false,
                    whitespace: true,
                    message: CreateCustomerStore.languages[`${intlPrefix}.address.require.msg`],
                  },
                ],
                
                initialValue:customerInfo.address ? customerInfo.address : '',//customerInfo.customerName, //???
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={CreateCustomerStore.languages[`${intlPrefix}.address`]}
                  type="text"
                  rows={1}
                  style={{ width: inputWidth }}
                  maxLength={60}
                />,
              )
            }
          </FormItem>
          <FormItem
                      {...formItemLayout}
                    >
                      {getFieldDecorator('area', {
                        initialValue: customerInfo.area || 'EASTCHINA',
                        rules: [{
                          required: true,
                          message: CreateCustomerStore.languages[`${intlPrefix}.area.require.msg`],
                        }],

                      })(
                        <Select

                          label={CreateCustomerStore.languages[`${intlPrefix}.area`]}
                          style={{ width: inputWidth }}
                          onChange={this.handleInsideChange}
                        >
                          {lanOption_Are}
                        </Select>,
                      )}
                    </FormItem>
                    <FormItem
            {...formItemLayout}
          >
            {
              getFieldDecorator('postcode', {
                rules: [
                  {
                    required: false,
                    whitespace: true,
                    message: CreateCustomerStore.languages[`${intlPrefix}.postcode.require.msg`],
                  },
                ],
                
                initialValue:customerInfo.postcode ? customerInfo.postcode : '',//customerInfo.customerName, //???
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={CreateCustomerStore.languages[`${intlPrefix}.postcode`]}
                  type="text"
                  rows={1}
                  style={{ width: inputWidth }}
                  maxLength={60}
                />,
              )
            }
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {
              getFieldDecorator('remark', {
                rules: [
                  {
                    required: false,
                    whitespace: true,
                    message: CreateCustomerStore.languages[`${intlPrefix}.remark.require.msg`],
                  },
                ],
                
                initialValue:customerInfo.remark ? customerInfo.remark : '',//customerInfo.customerName, //???
                validateTrigger: 'onBlur',
              })(
                <Input
                  autoComplete="off"
                  label={CreateCustomerStore.languages[`${intlPrefix}.remark`]}
                  type="text"
                  rows={1}
                  style={{ width: inputWidth }}
                  maxLength={60}
                />,
              )
            }
          </FormItem>
          <FormItem
                      {...formItemLayout}
                    >
                      {getFieldDecorator('customerManagerName', {
                        initialValue:customerInfo.customerManagerName ? customerInfo.customerManagerName : '',
                        rules: [{
                          required: true,
                          message: CreateCustomerStore.languages[`${intlPrefix}.customermanagername.require.msg`],
                        }],
                      })(
                        <Select
                          getPopupContainer={triggerNode => triggerNode.parentNode}
                          style={{ width: inputWidth }}
                          label={CreateCustomerStore.languages[`${intlPrefix}.customermanagername`]}
                          //style={{ width: inputWidth }}
                          optionFilterProp="children"
                          filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                           filter
                          onChange={this.handleInsideChange}
                        >
                          {lanOption_Emp}
                        </Select>,
                      )}
                    </FormItem>
        </Form>
      </Content>
    );
  };

}

export default Form.create({})(withRouter(injectIntl(EditCustomer)));
