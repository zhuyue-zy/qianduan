import React, { Component } from 'react';
import {
  Form,
  Input,
  Modal,
  Select,
  Table,
  Collapse,
  DatePicker,
  Tooltip,
  Button,
  Col,
  Icon,
  Popconfirm,
  Upload,
} from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, axios } from 'yqcloud-front-boot';
import { CLIENT_ID, CLIENT_TYPE } from 'yqcloud-front-boot/lib/containers/common/constants';
import moment from 'moment';
import CompanyStore from '../../../../stores/organization/partnerProject';
import YQQuill from '../../../../components/YQQuill';
import YQQuillStore from '../../../../stores/components/YQQuillStore';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';
import './index.scss';

const FormItem = Form.Item;
const { Option } = Select;
const { Panel } = Collapse;
const intlPrefix = 'organization.management';

const inputWidth = 512;
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

let page ={
  page:0,
  size:20
}
let htmlContent = '{}';

let htmlFileData = [];

function noop() {
}

@inject('AppState')
@observer
class EditPartner extends Component {
  state = this.getInitState();


  componentWillMount() {
    this.props.onRef(this);
    htmlContent = '{}';
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


  getInitState() {
    htmlContent = '{}';
    htmlFileData = [];
    return {
      employeeInfo: {
        address: '',
        companyCode: '',
        companyFullName: '',
        companyId: '',
        companyShortName: '',
        companyType: '',
        contact: '',
        createdBy: '',
        creationDate: '',
        iamOrganizationId: '',
        isEnabled: 'Y',
        lastUpdateDate: '',
        lastUpdatedBy: '',
        objectVersionNumber: '',
        parentCompanyId: '',
        parentCompanyName: '',
        phone: '',
        taxNumber: '',
      },
      departureDateVisable: false,
      certificateTypePattern: '',
      organizationInfo: {},
      dataList: [],
      dataKey: 0,
      togglePermission: {},
      multiLanguageValue: {
        company_full_name: {},
        company_short_name: {},
      },
      multiLanguageList: [],
    };
  }

  fetch(props) {
    const { AppState, edit, id } = props;
    const { id: organizationId } = AppState.currentMenuType;
    // CompanyStore.loadparentCompany(organizationId);
    
    CompanyStore.loadEmployee(organizationId,'',{
      page:0,
      size:99999
    });
    CompanyStore.queryComNature(organizationId);
    CompanyStore.queryLookUp(organizationId);
    this.loadLanguage();
    this.getLanguage(edit, id);
  }

  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CompanyStore.queryLanguage(id, AppState.currentLanguage);
  };

  /* 获取系统支持的语言环境 */
  getLanguage = (edit, id) => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        }, () => this.setDispalyName(edit, id));
      });
  };


  // 设定名字
  setDispalyName = (edit, id) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { multiLanguageValue, languageEnv } = this.state;
    const { company_full_name, company_short_name } = multiLanguageValue;
    languageEnv.forEach((val) => {
      company_full_name[val.code] = '';
      company_short_name[val.code] = '';
    });
    this.setState({
      multiLanguageValue,
    }, () => {
      if (edit) {
        this.getCompanyInfoById(organizationId, id);
      }
    });
  }

  getCompanyInfoById = (organizationId, id) => {
    CompanyStore.getCompanyInfoById(organizationId, id)
      .then((data) => {
        htmlContent = data.remark || '{}';
        htmlFileData = JSON.parse(JSON.stringify(data.fileList || []));
        let { dataKey } = this.state;
        const dataList = data.contractList || [];
        dataList.forEach((v) => {
          v.key = dataKey;
          v.oldCode = v.categoryCode;
          if (!v.contractFile) v.contractFile = [];
          if (v.contractFile && v.contractFile.length > 1) {
            v.contractFile = v.contractFile.splice(1);
          }
          dataKey += 1;
        });
        const { multiLanguageValue } = this.state;
        const company_full_name = Object.assign({}, multiLanguageValue.company_full_name, data.__tls.company_full_name);
        const company_short_name = Object.assign({}, multiLanguageValue.company_short_name, data.__tls.company_short_name);
        this.setState({
          multiLanguageValue: { company_full_name, company_short_name },
          organizationInfo: data,
          dataList,
          dataKey,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  handleCancel = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        OnCloseModel();
      } else {
        Modal.confirm({
          title: CompanyStore.languages[`${intlPrefix}.cancel.title`],
          content: CompanyStore.languages[`${intlPrefix}.cancel.content`],
          onOk: () => (
            OnCloseModel()
          ),
        });
      }
    });
  };

  permissionExpansion = (item) => {
    const { togglePermission } = this.state;
    togglePermission[item] = !togglePermission[item];
    this.setState({
      togglePermission,
    });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!err) {
        const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
        const { organizationInfo } = this.state;
        const menuType = AppState.currentMenuType;
        const tenantId = menuType.id;

        data.remark = htmlContent;

        let supplier = {};
        let customer = {};
        if (data.crInChargePersonId) {
          customer.crInChargePersonId = data.crInChargePersonId;
        } else{
          customer.crInChargePersonId = null;
        }
        if (data.sales) {
          customer.sales = data.sales.split('-')[0];
        } else{
          customer.sales = null;
        }
        if (data.customerContact) {
          customer.customerContact = data.customerContact.split('-')[0];
        }else{
          customer.customerContact = null;
        }
        if (data.srInChargePersonId) {
          supplier.srInChargePersonId = data.srInChargePersonId;
        }else{
          supplier.srInChargePersonId = null;
        }
        if (data.supplierContact) {
          supplier.supplierContact = data.supplierContact.split('-')[0];
        }else{
          supplier.supplierContact = null;
        }
        if (data.buyer) {
          supplier.buyer = data.buyer.split('-')[0];
        }else{
          supplier.buyer = null;
        }
        if (data.contact) {
          data.contact = data.contact.split('-')[0];
        }

        if (Object.keys(supplier).length === 0) {
          supplier = null;
        }
        if (Object.keys(customer).length === 0) {
          customer = null;
        }

        const { dataList } = this.state;
        if (!dataList.every((v) => {
          if (v.contractOwner) {
            v.contractOwner = v.contractOwner.split('-')[0];
          }
          if (v.startDate) {
            v.startDate += ' 00:00:00';
            v.startDate = v.startDate.substr(0, 19);
          }
          if (v.endDate) {
            v.endDate += ' 00:00:00';
            v.endDate = v.endDate.substr(0, 19);
          }
          if (edit) v.partnerId = organizationInfo.companyId;
          if (v.contractFile && v.contractFile.length > 0 && v.contractFile[0].id) {
            v.contractFile = [];
          }
          if (v.deleteContractFile) {
            v.contractFile = [...v.contractFile || [], v.deleteContractFile];
          }
          return v.contractNumber && v.contractName && v.contractTypeCode && v.startDate && v.endDate && v.contractStatusCode && v.contractOwner;
        })) {
          Choerodon.prompt(CompanyStore.languages[`${intlPrefix}.partner.contractInformationFillIn`]);
          return;
        }
        onSubmit();
        if (edit) {
          const reqFilelist = [];
          const oldHtmlFileData = JSON.parse(JSON.stringify(organizationInfo.fileList || []));
          const newHtmlFileData = JSON.parse(JSON.stringify(htmlFileData || []));
          oldHtmlFileData.forEach((v) => {
            if (!newHtmlFileData.find(v2 => v2.fileId === v.fileId)) {
              reqFilelist.push({ ...v });
            }
          });
          newHtmlFileData.forEach((v) => {
            if (!oldHtmlFileData.find(v2 => v2.fileId === v.fileId)) {
              reqFilelist.push({ ...v });
            }
          });
          data.fileList = reqFilelist;
          if (!modify && reqFilelist.length === 0 && organizationInfo.remark === htmlContent && dataList.filter(v => v.modify).length === 0) {
            Choerodon.prompt(CompanyStore.languages['modify.success']);
            OnUnchangedSuccess();
            return;
          }
          const { companyId, objectVersionNumber } = organizationInfo;
          const parentCompanyId = data.parentCompanyId ? data.parentCompanyId : 0;

          CompanyStore.updateCompany(tenantId, {
            ...organizationInfo,
            companyId,
            objectVersionNumber,
            ...data,
            ...parentCompanyId,
            supplier: supplier ? {
              ...organizationInfo.supplier,
              ...supplier,
              partnerId: organizationInfo.companyId,
            } : null,
            customer: customer ? {
              ...organizationInfo.customer,
              ...customer,
              partnerId: organizationInfo.companyId,
            } : null,
            contractList: dataList.filter(v => v.modify),
            __tls: this.state.multiLanguageValue,
            language: this.state.multiLanguageList,
          })
            .then(({ failed, message }) => {
              if (failed) {
                Choerodon.prompt(message);
                onError();
              } else {
                Choerodon.prompt(CompanyStore.languages['modify.success']);
                onSuccess();
              }
            })
            .catch((error) => {
              Choerodon.handleResponseError(error);
            });
        } else {
          if (htmlFileData.length !== 0) {
            data.fileList = htmlFileData;
          } else {
            data.fileList = [];
          }
          CompanyStore.createCompany(tenantId, {
            ...data,
            supplier,
            customer,
            contractList: dataList.filter(v => v.modify),
            __tls: this.state.multiLanguageValue,
            language: this.state.multiLanguageList,
          })
            .then(({ failed, message, code }) => {
              if (failed) {
                if (code === 'error.company.same.code') {
                  Choerodon.prompt(CompanyStore.languages[`${intlPrefix}.error.company.same.code`]);
                } else {
                  Choerodon.prompt(message);
                }
                Choerodon.prompt(message);
                onError();
              } else {
                Choerodon.prompt(CompanyStore.languages['create.success']);
                onSuccess();
              }
            })
            .catch((error) => {
              onError();
              Choerodon.prompt(error.toString());
            });
        }
      }
    });
  };


  render() {
    const { AppState, edit, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const { getFieldDecorator } = this.props.form;
    const companyName = menuType.name;
    const organizationId = menuType.id;
    const { organizationInfo } = this.state;
    const queryComNature = CompanyStore.getCompanysNature;
    const organizations = CompanyStore.getCompanyNameList;
    const lanOption = [];

    queryComNature.forEach((item) => {
      lanOption.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    return (
      <Content
        className="sidebar-content iam-partner"
      >
        <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical">
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('companyFullName', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: CompanyStore.languages[`${intlPrefix}.enter.company.name`],
                },
              ],
              sorter: true,
              fixed: 'right',
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.companyFullName,
              validateFirst: true,
            })(
              <MultiLanguageFormItem
                label={CompanyStore.languages[`${intlPrefix}.company.name`]}
                requestUrl="true"
                requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.company_full_name : {}}
                handleMultiLanguageValue={({ retObj, retList }) => {
                  this.props.form.setFieldsValue({
                    companyFullName: retObj[this.props.AppState.currentLanguage],
                  });
                  this.setState({
                    multiLanguageValue: {
                      ...this.state.multiLanguageValue,
                      company_full_name: retObj,
                    },
                    multiLanguageList: retList,
                  });
                }}
                maxLength={50}
                type="FormItem"
                FormLanguage={this.state.multiLanguageValue}
                languageEnv={this.state.languageEnv}
                descriptionObject={CompanyStore.languages.multiLanguage}
                required="true"
                inputWidth={inputWidth}
              />,
              // <Input
              //   autoComplete="off"
              //   label={CompanyStore.languages[`${intlPrefix}.company.name`]}
              //   style={{ width: inputWidth }}
              //   maxLength={50}
              // />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('companyShortName', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: CompanyStore.languages[`${intlPrefix}.enter.company.Short.name`],
                },
              ],
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.companyShortName,
              validateFirst: true,
            })(
              <MultiLanguageFormItem
                label={CompanyStore.languages[`${intlPrefix}.company.short.name`]}
                requestUrl="true"
                requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.company_short_name : {}}
                handleMultiLanguageValue={({ retObj, retList }) => {
                  this.props.form.setFieldsValue({
                    companyShortName: retObj[this.props.AppState.currentLanguage],
                  });
                  this.setState({
                    multiLanguageValue: {
                      ...this.state.multiLanguageValue,
                      company_short_name: retObj,
                    },
                    multiLanguageList: retList,
                  });
                }}
                maxLength={20}
                type="FormItem"
                FormLanguage={this.state.multiLanguageValue}
                languageEnv={this.state.languageEnv}
                descriptionObject={CompanyStore.languages.multiLanguage}
                required="true"
                inputWidth={inputWidth}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
            label="DatePicker"
          >
            {getFieldDecorator('companyCode', {
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: CompanyStore.languages[`${intlPrefix}.enter.company.code`],
                },
                {
                  pattern: /^[.A-Z0-9]+$/,
                  message: CompanyStore.languages[`${intlPrefix}.only.company.code`],
                },
              ],
              normalize: (value) => {
                if (value) {
                  return value.toUpperCase();
                }
              },
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.companyCode,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.company.code`]}
                style={{ width: inputWidth }}
                maxLength={20}
              />,
            )}

          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('industryCode', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.industryCode,
              validateFirst: true,
            })(
              <Select
                label={CompanyStore.languages[`${intlPrefix}.partner.industry`]}
                style={{ width: inputWidth }}
                allowClear
              >
                {CompanyStore.lookUp.FND_PARTNER_INDUSTRY.map(data => (
                  <Option
                    key={data.lookupValue}
                    title={data.lookupMeaning}
                    value={data.lookupValue}
                  >{data.lookupMeaning}
                  </Option>
                ))}
              </Select>,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('scaleCode', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.scaleCode,
              validateFirst: true,
            })(
              <Select
                label={CompanyStore.languages[`${intlPrefix}.partner.companySize`]}
                allowClear
                style={{ width: inputWidth }}
              >
                {CompanyStore.lookUp.FND_PARTNER_SCALE.map(data => (
                  <Option
                    key={data.lookupValue}
                    title={data.lookupMeaning}
                    value={data.lookupValue}
                  >{data.lookupMeaning}
                  </Option>
                ))}
              </Select>,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('taxNumber', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.taxNumber,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.partner.taxpayerIdentificationNumber`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('postalCode', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.postalCode,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.partner.zipCode`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>


          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('companyType', {

              validateTrigger: 'onBlur',
              initialValue: organizationInfo.companyType || '',
              validateFirst: true,

            })(
              <Select
                allowClear
                label={CompanyStore.languages[`${intlPrefix}.company.type`]}
                style={{ width: inputWidth }}
              >
                {lanOption}
              </Select>,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('contact', {
              initialValue: organizationInfo.contact || '',
            })(
              <Select
                mode="combobox"
                label={CompanyStore.languages[`${intlPrefix}.company.contacts`]}
                allowClear
                getPopupContainer={trigger => trigger.parentNode}
                optionLabelProp="title"
                onSearch={(value)=>{
                  CompanyStore.loadEmployee(organizationId,value,page)
                }}
                onFocus={()=>{
                  CompanyStore.loadEmployee(organizationId,'',page)
                }}
                style={{ width: inputWidth }}
              >
                {CompanyStore.employee.map(element => (
                  <Option
                    value={element.employeeNameCode}
                    key={element.employeeName}
                    title={element.employeeName}
                  >
                    {element.employeeName}
                  </Option>
                ))}
              </Select>,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('phone', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.phone || '',
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.phone`]}
                style={{ width: inputWidth }}
                maxLength={20}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('address', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.address || '',
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.company.address`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>

          <div
            style={{
              fontSize: '14px',
              color: '#04173F',
              margin: '10px -10px',
              fontWeight: 600,
            }}
          >
            <Icon
              type={!this.state.togglePermission.crInChargePersonId ? 'arrow_drop_down' : 'baseline-arrow_right'}
              onClick={() => {
                this.permissionExpansion('crInChargePersonId');
              }}
            />
            <span>
              {CompanyStore.languages[`${intlPrefix}.partner.client`]}
            </span>
          </div>

          {!this.state.togglePermission.crInChargePersonId && (
            <div>
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('crInChargePersonId', {
                  // rules: [
                  //   {
                  //     required: true,
                  //     message: '必输',
                  //   },
                  // ],
                  validateTrigger: 'onBlur',
                  initialValue: organizationInfo.customer ? organizationInfo.customer.crInChargePersonId : '',
                  validateFirst: true,
                })(
                  <Select
                    label={CompanyStore.languages[`${intlPrefix}.partner.customerInCharge`]}
                    allowClear
                    optionFilterProp="children"
                    getPopupContainer={trigger => trigger.parentNode}
                    filterOption={(input, option) => option.props.title.toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0}
                    filter
                    onSearch={(value)=>{
                      CompanyStore.loadEmployee(organizationId,value,page)
                    }}
                    onFocus={()=>{
                      CompanyStore.loadEmployee(organizationId,'',page)
                    }}
                    optionLabelProp="title"
                    style={{ width: inputWidth }}
                  >
                    {CompanyStore.employee.map(element => (
                      <Option
                        value={element.employeeId}
                        key={element.employeeId}
                        title={element.employeeName}
                      >
                        <Tooltip title={`${element.employeeCode}   ${element.employeeName}   ${element.email}`}
                                 placement="topLeft">
                          <div style={{
                            width: 500,
                            display: '-webkit-box',
                          }}
                          >
                            <Col
                              span={5}
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {element.employeeCode}
                            </Col>
                            <Col
                              span={5}
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginLeft: 3,
                              }}
                            >
                              {element.employeeName}
                            </Col>
                            <Col
                              span={5}
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginLeft: 6,
                              }}
                            >
                              {element.email}
                            </Col>
                          </div>
                        </Tooltip>
                      </Option>
                    ))}
                  </Select>,
                )}
              </FormItem>

              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('sales', {
                  validateTrigger: 'onBlur',
                  initialValue: organizationInfo.customer ? organizationInfo.customer.sales : '',
                  validateFirst: true,
                })(
                  <Select
                    mode="combobox"
                    label={CompanyStore.languages[`${intlPrefix}.partner.salesManager`]}
                    allowClear
                    getPopupContainer={trigger => trigger.parentNode}
                    optionLabelProp="title"
                    style={{ width: inputWidth }}
                    onSearch={(value)=>{
                      CompanyStore.loadEmployee(organizationId,value,page)
                    }}
                    onFocus={()=>{
                      CompanyStore.loadEmployee(organizationId,'',page)
                    }}
                  >
                    {CompanyStore.employee.map(element => (
                      <Option
                        value={element.employeeNameCode}
                        key={element.employeeName}
                        title={element.employeeName}
                      >
                        {element.employeeName}
                      </Option>
                    ))}
                  </Select>,
                )}
              </FormItem>

              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('customerContact', {
                  validateTrigger: 'onBlur',
                  initialValue: organizationInfo.customer ? organizationInfo.customer.customerContact : '',
                  validateFirst: true,
                })(
                  <Select
                    mode="combobox"
                    label={CompanyStore.languages[`${intlPrefix}.partner.customerContact`]}
                    allowClear
                    getPopupContainer={trigger => trigger.parentNode}
                    optionLabelProp="title"
                    style={{ width: inputWidth }}
                    onSearch={(value)=>{
                      CompanyStore.loadEmployee(organizationId,value,page)
                    }}
                    onFocus={()=>{
                      CompanyStore.loadEmployee(organizationId,'',page)
                    }}
                  >
                    {CompanyStore.employee.map(element => (
                      <Option
                        value={element.employeeNameCode}
                        key={element.employeeName}
                        title={element.employeeName}
                      >
                        {element.employeeName}
                      </Option>
                    ))}
                  </Select>,
                )}
              </FormItem>
            </div>
          )}

          <div
            style={{
              fontSize: '14px',
              color: '#04173F',
              margin: '10px -10px',
              fontWeight: 600,
            }}
          >
            <Icon
              type={!this.state.togglePermission.srInChargePersonId ? 'arrow_drop_down' : 'baseline-arrow_right'}
              onClick={() => {
                this.permissionExpansion('srInChargePersonId');
              }}
            />
            <span>
              {CompanyStore.languages[`${intlPrefix}.partner.supplier`]}
            </span>
          </div>

          {!this.state.togglePermission.srInChargePersonId && (
            <div>
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('srInChargePersonId', {
                  // rules: [
                  //   {
                  //     required: true,
                  //     message: '必输',
                  //   },
                  // ],
                  validateTrigger: 'onBlur',
                  initialValue: organizationInfo.supplier ? organizationInfo.supplier.srInChargePersonId : '',
                  validateFirst: true,
                })(
                  <Select
                    label={CompanyStore.languages[`${intlPrefix}.partner.supplierLeader`]}
                    allowClear
                    optionFilterProp="children"
                    getPopupContainer={trigger => trigger.parentNode}
                    filterOption={(input, option) => option.props.title.toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0}
                    filter
                    optionLabelProp="title"
                    style={{ width: inputWidth }}
                    onSearch={(value)=>{
                      CompanyStore.loadEmployee(organizationId,value,page)
                    }}
                    onFocus={()=>{
                      CompanyStore.loadEmployee(organizationId,'',page)
                    }}
                  >
                    {CompanyStore.employee.map(element => (
                      <Option
                        value={element.employeeId}
                        key={element.employeeId}
                        title={element.employeeName}
                      >
                        <Tooltip title={`${element.employeeCode}   ${element.employeeName}   ${element.email}`}
                                 placement="topLeft">
                          <div style={{
                            width: 500,
                            display: '-webkit-box',
                          }}
                          >
                            <Col
                              span={5}
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {element.employeeCode}
                            </Col>
                            <Col
                              span={5}
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginLeft: 3,
                              }}
                            >
                              {element.employeeName}
                            </Col>
                            <Col
                              span={5}
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginLeft: 6,
                              }}
                            >
                              {element.email}
                            </Col>
                          </div>
                        </Tooltip>
                      </Option>
                    ))}
                  </Select>,
                )}
              </FormItem>

              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('buyer', {
                  validateTrigger: 'onBlur',
                  initialValue: organizationInfo.supplier ? organizationInfo.supplier.buyer : '',
                  validateFirst: true,
                })(
                  <Select
                    mode="combobox"
                    label={CompanyStore.languages[`${intlPrefix}.partner.buyer`]}
                    allowClear
                    getPopupContainer={trigger => trigger.parentNode}
                    optionLabelProp="title"
                    style={{ width: inputWidth }}
                    onSearch={(value)=>{
                      CompanyStore.loadEmployee(organizationId,value,page)
                    }}
                    onFocus={()=>{
                      CompanyStore.loadEmployee(organizationId,'',page)
                    }}
                  >
                    {CompanyStore.employee.map(element => (
                      <Option
                        value={element.employeeNameCode}
                        key={element.employeeName}
                        title={element.employeeName}
                      >
                        {element.employeeName}
                      </Option>
                    ))}
                  </Select>,
                )}
              </FormItem>

              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('supplierContact', {
                  validateTrigger: 'onBlur',
                  initialValue: organizationInfo.supplier ? organizationInfo.supplier.supplierContact : '',
                  validateFirst: true,
                })(
                  <Select
                    mode="combobox"
                    label={CompanyStore.languages[`${intlPrefix}.partner.supplierContact`]}
                    allowClear
                    getPopupContainer={trigger => trigger.parentNode}
                    optionLabelProp="title"
                    style={{ width: inputWidth }}
                    onSearch={(value)=>{
                      CompanyStore.loadEmployee(organizationId,value,page)
                    }}
                    onFocus={()=>{
                      CompanyStore.loadEmployee(organizationId,'',page)
                    }}
                  >
                    {CompanyStore.employee.map(element => (
                      <Option
                        value={element.employeeNameCode}
                        key={element.employeeName}
                        title={element.employeeName}
                      >
                        {element.employeeName}
                      </Option>
                    ))}
                  </Select>,
                )}
              </FormItem>
            </div>
          )}


          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('isEnabled', {
              rules: [
                {
                  required: true,
                  message: CompanyStore.languages[`${intlPrefix}.please.choose.state`],
                },
              ],
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.isEnabled || 'Y',
              validateFirst: true,
            })(
              <Select
                label={CompanyStore.languages[`${intlPrefix}.state`]}
                style={{ width: inputWidth }}
              >
                <Option value="Y">{CompanyStore.languages[`${intlPrefix}.state.y`]}</Option>
                <Option value="N">{CompanyStore.languages[`${intlPrefix}.state.n`]}</Option>
              </Select>,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('ext1', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.ext1,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.partner.alternate1`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('ext2', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.ext2,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.partner.alternate2`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('ext3', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.ext3,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.partner.alternate3`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('ext4', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.ext4,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.partner.alternate4`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('ext5', {
              validateTrigger: 'onBlur',
              initialValue: organizationInfo.ext5,
              validateFirst: true,
            })(
              <Input
                autoComplete="off"
                label={CompanyStore.languages[`${intlPrefix}.partner.alternate5`]}
                style={{ width: inputWidth }}
                maxLength={50}
              />,
            )}
          </FormItem>

          <div
            style={{}}
          >
            <label
              style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '12px',
                color: 'rgba(0,0,0,.6)',
              }}
            >
              {CompanyStore.languages[`${intlPrefix}.remarks`]}
            </label>
            <div style={{
              minHeight: 280,
              width: '80%'
            }}>
              <YQQuill
                isNow
                edit
                noFile
                content={htmlContent}
                defaultFileList={htmlFileData}
                style={{
                  width: '100%',
                  height: 200,
                }}
                onSubmit={(content, file) => {
                  const fileData = [];
                  file.forEach((value) => {
                    fileData.push({
                      fileId: value.fileId,
                      fileName: value.fileName,
                      size: `${value.size}`,
                      uId: value.uId,
                      category: 'project',
                      sourceType: 'projectFileList',
                    });
                  });
                  htmlContent = content;
                  htmlFileData = fileData;
                }}
              />
            </div>
          </div>
        </Form>
        {
          [''].map(() => {
            const comInputWidth = 131;

            const requireTitle = title => (
              <span>{title}
                <span style={{ color: 'red' }}>*</span>
              </span>
            );

            const editComponent = (data, component) => {
              if (!data.record.isEdit) {
                if (data.field === 'contractTypeCode' || data.field === 'currencyTypeCode' || data.field === 'contractStatusCode' || data.field === 'contractOwner') {
                  return (
                    <span style={{
                      display: 'inline-block',
                      width: comInputWidth,
                    }}>{data.record[data.textName] || (data.data.find(v => v[data.selectValue] === data.text) || {})[data.selectName] || data.text}</span>);
                } else {
                  return (
                    <span style={{
                      display: 'inline-block',
                      width: comInputWidth
                    }}>{data.field === 'startDate' || data.field === 'endDate' ? (data.text || '').substr(0, 10) : data.record[data.textName] || data.text}</span>);
                }
              }
              return (component(data));
            };

            const inputComponent = ({ type, record, text, field }) => (
              <Input
                type={type || 'text'}
                defaultValue={text}
                style={{ width: comInputWidth }}
                onChange={(e) => {
                  record.modify = true;
                  record[field] = e.target.value;
                }}
              />
            );

            const dateComponent = ({ type, record, text, field }) => (
              <DatePicker
                format="YYYY-MM-DD"
                defaultValue={moment(record[field]) || null}
                style={{ width: comInputWidth }}
                getCalendarContainer={triggerNode => triggerNode.parentNode.parentNode}
                onChange={(date, dateString) => {
                  record.modify = true;
                  record[field] = dateString;
                }}
              />
            );

            const selectComponent = ({ record, text, field, data, selectName, selectValue }) => (
              <Select
                getPopupContainer={trigger => trigger.parentNode}
                defaultValue={text}
                optionLabelProp="title"
                style={{ width: comInputWidth }}
                mode={field === 'contractOwner' && 'combobox'}
                onChange={(value) => {
                  record.modify = true;
                  record[field] = value;
                }}
              >
                {data.map(element => (
                  <Option
                    value={element[selectValue]}
                    key={element[selectValue]}
                    title={element[selectName]}
                  >
                    {element[selectName]}
                  </Option>
                ))}
              </Select>
            );

            const fileComponent = ({ type, record, text, field }) => {
              if (text && text.length > 0){
                text.forEach((v) => {
                  if (!v.uid) {
                    v.uid = v.uId;
                  }
                  if (!v.name) {
                    v.name = v.fileName;
                  }
                });
              }
              return (
                <div style={{
                  width: 240,
                  maxHeight: 30,
                  marginTop: -6,
                  // overflow: 'hidden',
                }}>
                  <Upload
                    className="partner-upload"
                    name="file"
                    listType="text-down"
                    action={`${process.env.API_HOST}/fileService/v1/${this.props.AppState.currentMenuType.id}/file/attachment`}
                    headers={{
                      Authorization: `bearer ${Choerodon.getCookie('access_token')}`,
                      'X-Client-ID': CLIENT_ID,
                      'X-Client-Type': CLIENT_TYPE,
                    }}
                    defaultFileList={text || []}
                    showUploadList={{
                      showDownloadIcon: true,
                      showPreviewIcon: false,
                      showRemoveIcon: !!record.isEdit,
                    }}
                    onChange={(info) => {
                      info.fileList.forEach((v) => {
                        v.uId = v.uid;
                        v.fileName = v.name;
                        if (v.response) {
                          v.fileId = v.response.fileId;
                          v.sourceType = v.response.fileType;
                        }
                        if (record.id) {
                          v.partnerId = record.id;
                        }
                      });
                      record.modify = true;
                      record.contractFile = info.fileList;
                      this.setState({ dataList: this.state.dataList });
                    }}
                    onRemove={(file) => {
                      record.modify = true;
                      record.contractFile = [];
                      if (file.id) {
                        record.deleteContractFile = file;
                      }
                      this.setState({ dataList: this.state.dataList });
                    }}
                    onDownload={(element) => {
                      if (element.fileId){
                        YQQuillStore.loadFile(element.fileId).then((url) => {
                          window.open(url);
                        });
                      }
                    }}
                  >
                    {(!record.contractFile || record.contractFile.length === 0) && record.isEdit ? (
                      <Button type="primary" funcType="flat" icon="file_upload" style={{ marginTop: 5 }}>
                        {CompanyStore.languages[`${intlPrefix}.partner.uploadFiles`]}
                      </Button>
                    ) : (null)}

                  </Upload>
                </div>
              );
            };

            const { dataList } = this.state;

            const columns = [
              {
                title: requireTitle(CompanyStore.languages[`${intlPrefix}.partner.contractNumber`]),
                dataIndex: 'contractNumber',
                key: 'contractNumber',
                width: comInputWidth,
                render: (text, record) => editComponent({
                  text,
                  record,
                  field: 'contractNumber',
                }, inputComponent),
              },
              {
                title: requireTitle(CompanyStore.languages[`${intlPrefix}.partner.contractName`]),
                dataIndex: 'contractName',
                key: 'contractName',
                width: comInputWidth,
                render: (text, record) => editComponent({
                  text,
                  record,
                  field: 'contractName',
                }, inputComponent),
              },
              {
                title: requireTitle(CompanyStore.languages[`${intlPrefix}.partner.contractTypeCode`]),
                dataIndex: 'contractTypeCode',
                key: 'contractTypeCode',
                width: comInputWidth,
                render: (text, record) => editComponent({
                  text,
                  record,
                  field: 'contractTypeCode',
                  data: CompanyStore.lookUp.FND_CONTRACT_TYPE,
                  selectName: 'lookupMeaning',
                  selectValue: 'lookupValue',
                  textName: 'contractTypeName',
                }, selectComponent),
              },
              {
                title: CompanyStore.languages[`${intlPrefix}.partner.contractAmount`],
                dataIndex: 'contractAmount',
                key: 'contractAmount',
                width: comInputWidth,
                render: (text, record) => editComponent({
                  text,
                  record,
                  field: 'contractAmount',
                }, inputComponent),
              },
              {
                title: CompanyStore.languages[`${intlPrefix}.partner.currencyTypeCode`],
                dataIndex: 'currencyTypeCode',
                key: 'currencyTypeCode',
                width: comInputWidth,
                render: (text, record) => editComponent({
                  text,
                  record,
                  field: 'currencyTypeCode',
                  data: CompanyStore.lookUp.FND_CURRENCY_TYPE,
                  selectName: 'lookupMeaning',
                  selectValue: 'lookupValue',
                  textName: 'currencyTypeName',
                }, selectComponent),
              },
              {
                title: requireTitle(CompanyStore.languages[`${intlPrefix}.partner.startDate`]),
                dataIndex: 'startDate',
                key: 'startDate',
                width: comInputWidth,
                render: (text, record) => editComponent({
                  text,
                  record,
                  field: 'startDate',
                }, dateComponent),
              },
              {
                title: requireTitle(CompanyStore.languages[`${intlPrefix}.partner.endDate`]),
                dataIndex: 'endDate',
                key: 'endDate',
                width: comInputWidth,
                render: (text, record) => editComponent({
                  text,
                  record,
                  field: 'endDate',
                }, dateComponent),
              },
              {
                title: requireTitle(CompanyStore.languages[`${intlPrefix}.partner.contractStatusCode`]),
                dataIndex: 'contractStatusCode',
                key: 'contractStatusCode',
                width: comInputWidth,
                render: (text, record) => editComponent({
                  text,
                  record,
                  data: CompanyStore.lookUp.FND_CONTRACT_STATUS,
                  selectName: 'lookupMeaning',
                  selectValue: 'lookupValue',
                  field: 'contractStatusCode',
                  textName: 'contractStatusName',
                }, selectComponent),
              },
              {
                title: requireTitle(CompanyStore.languages[`${intlPrefix}.partner.contractOwner`]),
                dataIndex: 'contractOwner',
                key: 'contractOwner',
                width: comInputWidth,
                render: (text, record) => editComponent({
                  text,
                  record,
                  field: 'contractOwner',
                  data: CompanyStore.employee,
                  selectName: 'employeeName',
                  selectValue: 'employeeNameCode',
                }, selectComponent),
              },
              {
                title: CompanyStore.languages[`${intlPrefix}.partner.remark`],
                dataIndex: 'remark',
                key: 'remark',
                width: comInputWidth,
                render: (text, record) => editComponent({
                  text,
                  record,
                  field: 'remark',
                }, inputComponent),
              },
              {
                title: CompanyStore.languages[`${intlPrefix}.partner.contractFile`],
                dataIndex: 'contractFile',
                key: 'contractFile',
                render: (text, record) => {
                  return fileComponent({
                    text,
                    record,
                  });
                },
              },
              {
                title: CompanyStore.languages[`${intlPrefix}.partner.action`],
                dataIndex: 'action',
                key: 'action',
                width: 101,
                fixed: 'right',
                render: (text, record, index) => {
                  const deleteBtn = (
                    <Button
                      size="small"
                      shape="circle"
                      icon="delete"
                      onClick={() => {
                        if (!record.id) {
                          dataList.splice(index, 1);
                          this.setState({
                            dataList,
                          });
                        } else {
                          const { id: organizationId } = AppState.currentMenuType;
                          CompanyStore.deleteContractNo(organizationId, record)
                            .then(() => {
                              const { id } = this.props;
                              this.getCompanyInfoById(organizationId, id);
                            });
                        }
                      }}
                    />
                  );
                  if (record.isEdit) {
                    return (
                      <span>
                        <Icon
                          type="yijieshu"
                          style={{
                            marginRight: 10,
                            color: 'rgb(33, 150, 243)',
                          }}
                          onClick={() => {
                            record.isEdit = false;
                            this.setState({
                              dataList,
                            });
                          }}
                        />
                       <Icon
                         type="yizhongzhi"
                         style={{ color: '#B8BABF' }}
                         onClick={() => {
                           record.isEdit = false;
                           this.setState({
                             dataList,
                           });
                         }}
                       />
                      </span>
                    );
                  } else {
                    return (
                      <span>
                        <Icon
                          type="bianji-"
                          style={{
                            marginRight: 10,
                            color: '#2196f3',
                          }}
                          onClick={() => {
                            record.isEdit = true;
                            this.setState({
                              dataList,
                            });
                          }}
                        />
                        {deleteBtn}
                      </span>
                    );
                  }
                },
              },
            ];
            return (
              <div style={{ marginTop: 20 }}>
                <Button
                  icon="add"
                  type="primary"
                  onClick={() => {
                    const { dataKey } = this.state;
                    dataList.forEach((val) => {
                      val.isEdit = false;
                    });
                    const newData = {
                      isEdit: true,
                      modify: true,
                      key: dataKey,
                      startDate: moment().format('YYYY-MM-DD'),
                      endDate: moment().format('YYYY-MM-DD'),
                    };
                    this.setState({
                      dataList: [newData, ...dataList],
                      dataKey: dataKey + 1,
                    });
                  }}
                >
                  {CompanyStore.languages[`${intlPrefix}.partner.add`]}
                </Button>
                <Table
                  size="middle"
                  columns={columns}
                  dataSource={dataList}
                  scroll={{ x: 1900 }}
                  pagination={false}
                />
              </div>
            );
          })
        }
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EditPartner)));
