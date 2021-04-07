  /*
* @description:编辑快码的侧边栏
* @author：郭杨
* @update 2018-09-18 16:44
*/
import React, { Component } from 'react';
import { Icon, Modal, Form, Input, Table, Checkbox, Button, message, Select } from 'yqcloud-ui';
import { inject, observer } from 'mobx-react';
import { injectIntl } from 'react-intl';
import { Content, axios } from 'yqcloud-front-boot';
//  加载自定义组件组件
import MultiLanguageFormItem from './MultiLanguageFormItem';
import './LookUpEditor.scss';
import LookupHomeStore from '../../../../stores/organization/lookup/LookupHomeStore';

const { Sidebar, confirm } = Modal;
const { Item: FormItem } = Form;
const { Option } = Select;
const intlPrefix = 'organization.lookup';

@inject('AppState')
@observer
@injectIntl
@Form.create({})
class LookUpEditor extends Component {
  constructor(props) {
    super(props);
    this.typeList = [
      { value: '1', meaning: 'organization.lookup.tenant.code' },
      { value: '2', meaning: 'organization.lookup.project.document.code' },
    ];
    this.selectedCodeValues = []; // 存放被选中的快码值记录
    this.contentChanged = false; //  记录页面上的内容有没有被修改
    this.originData = []; //  存放原始数据，用于和修改后的数据比较，判断是否有改动
    this.multiLanguageValue = {}; // 存放多语言信息
    this.multiLanguageList = []; // 存放多语言列表
    this.state = { //  初始化状态
      isOrder: true,
      dataSource: [], //  存放表格数据源
      count: 1000, //  记录的index,用于新建数据时作为其key，方便定位数据
      toggleCheck: false, //  控制复选框的正反选
      toggleMultiLanguageTableCell: false, //  控制带多语言的表格单元的刷新
      canAddTableRecord: false, //  只有完成表单必填项之后才能新增表格行
      tableState: 'unchanged', //  表格必填字段未填完，有些操作无法进行
      pagination: { //  控制分页
        current: 0,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      dataLoading: true,
      parentLookupList: [], // 父级快码列表
      parentLookupValueList: [], // 父级快码的值
      multiLanguageValue: {},
      selectedRowKeys: [],
      flag: 1,
      lookUpbyCategory: [],
    };
  }

  componentWillMount() {
    const { AppState } = this.props;
    const { employeeId: userId } = AppState.userInfo;
    const { id: organizationId, type } = AppState.currentMenuType;
    if (type === 'organization') {
      LookupHomeStore.loadLookUpbyPMProjectType(organizationId, userId);
    }
    LookupHomeStore.queryLanguageEnv();
  }

  componentDidMount() {
    const { createRef } = this.props;
    createRef(this);
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.visible) {
      this.setState({
        parentLookupList: [],
        parentLookupValueList: [],
        lookUpbyCategory: [],
        projectId: '',
        categoryCode: '',
      });
      LookupHomeStore.setLookupbyCategory([]);
    } else if (!this.props.visible) {
      this.reqParentLookup(nextProps);
    }
  }

  reqParentLookup = (nextProps, projectId, categoryCode) => {
    const { record: { lookupTypeId, parentLookupTypeCode, projectId: oriProjectId, categoryCode: oriCategoryCode }, AppState, record, form: { getFieldValue } } = nextProps;
    const { id: organizationId, type } = AppState.currentMenuType;
    let requestUrl = '';

    const { flag } = this.state;
    const homeType = record.type;
    projectId = projectId || getFieldValue('projectId') || oriProjectId;
    categoryCode = categoryCode || getFieldValue('categoryCode') || oriCategoryCode;

    // 租户
    if (type === 'organization') {
      if (lookupTypeId) { // 编辑
        requestUrl = `/fnd/v1/${organizationId}/lookup/parent/${lookupTypeId}/proTic`;
        if (homeType == 2) {
          if (projectId && categoryCode) {
            requestUrl = `/fnd/v1/${organizationId}/lookup/parent/${lookupTypeId}/proTic?projectId=${projectId}&categoryCode=${categoryCode}`;
          }
          if (projectId) {
            LookupHomeStore.loadLookupbyCategory(organizationId, projectId);
          }
        }
      } else { // 新建
        requestUrl = `/fnd/v1/${organizationId}/lookup/list/proTic`;
        if (!homeType || homeType === '0') {
          if (flag == 2) {
            if (projectId && categoryCode) {
              requestUrl = `/fnd/v1/${organizationId}/lookup/list/proTic?projectId=${projectId}&categoryCode=${categoryCode}`;
            }
          }
        }
      }
    } else if (lookupTypeId) { // 编辑 有快码id lookupTypeId
      requestUrl = `/fnd/v1/lookup/parent/${lookupTypeId}`;
    } else { // 新建
      requestUrl = '/fnd/v1/lookup/list';
    }

    let requestValueUrl = '';
    if (type === 'organization') {
      requestValueUrl = `/fnd/v1/${organizationId}/lookup/code?lookupTypeCode=${parentLookupTypeCode}`;
      if (homeType == 2) {
        if (projectId && categoryCode) {
          requestValueUrl = `/fnd/v1/${organizationId}/lookup/code/proTic?lookupTypeCode=${parentLookupTypeCode}&projectId=${projectId}&categoryCode=${categoryCode}`;
        }
      }
    } else {
      requestValueUrl = `/fnd/v1/lookup/code?lookupTypeCode=${parentLookupTypeCode}`;
    }
    const { store } = this.props;
    if (parentLookupTypeCode) { // 根据上级快码查询上级快码的值
      axios.get(requestValueUrl)
        .then((data) => {
          this.setState({
            parentLookupValueList: data.lookupValuesList,
          });
        });
    }
    axios.get(requestUrl) // 上级快码的值
      .then((res) => {
        this.setState({
          parentLookupList: res,
        });
      });
  };

  /**
   *  初始化数据源
   *  @param data 选中快码记录的快码值字段（数组）
   */
  initDataSource = (data) => {
    //  初始化数据域
    this.originData = data;
    this.setState({
      dataSource: data,
      dataLoading: false,
    });
  };

  /**
   *  清除表单缓存
   */
  clearBuffer = () => {
    const { form: { resetFields } } = this.props;
    resetFields();
  };

  /**
   *  渲染标题
   */
  renderTitle = () => {
    const { operationType } = this.props;
    return operationType === 'create' ? LookupHomeStore.languages.create : LookupHomeStore.languages.modify;
  };

  /**
   *  处理表单输入控件返回的多语言信息
   *  @param value 多语言表单控件中返回的数据
   */
  handleMultiLanguageValue = ({ retObj, retList, field }) => {
    const { form: { setFieldsValue } } = this.props;
    this.multiLanguageValue[field] = retObj;
    this.setState({
      multiLanguageValue: {
        ...this.state.multiLanguageValue,
        description: retObj,
      },
    });
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
    const { record: { lookupTypeId }, AppState: { menuType: { organizationId } }, operationType } = this.props;
    const requestUrl = this.props.AppState.currentMenuType.type === 'organization' ? (`fnd/v1/${organizationId}/lookup/language/${lookupTypeId}/proTic?columnName=${field}`)
      : (`fnd/v1/lookup/language/${lookupTypeId}/?columnName=${field}`);
    return (
      <MultiLanguageFormItem
        label={LookupHomeStore.languages[`${intlPrefix}.description`]}
        requestUrl={operationType === 'create' ? null : requestUrl}
        handleMultiLanguageValue={this.handleMultiLanguageValue.bind(this)}
        inputWidth={inputWidth}
        maxLength={40}
        type="FormItem"
        field={field}
        FormLanguage={this.state.multiLanguageValue}
        languageEnv={LookupHomeStore.languageEnv}
      />
    );
  };

  /**
   *  渲染多语言表格单元
   *  @param text 用于表格单元的数据显示
   *  @param record 多语言弹窗中点击确定后改变记录中的数据，
   *  @param requestUrl 请求的url
   *  @param field 要更新的字段名称
   *  @param type 多语言控件的类型，目前只有表单元素和表格元素两种
   */
  renderMultiLanguageTableCell = (text, record, requestUrl, field, type = 'TableCell') => (
    <MultiLanguageFormItem
      label={LookupHomeStore.languages[`${intlPrefix}.description`]}
      requestUrl={requestUrl}
      handleMultiLanguageValue={({ retObj, retList }) => {
        /* eslint-disable */
        record.__tls = Object.assign(record.__tls || {}, {
          [field]: retObj,
        });
        /* eslint-enable */
        record = Object.assign(record, {
          language: retList,
          [field]: retObj.zh_CN,
        });
        const { toggleMultiLanguageTableCell } = this.state;
        this.setState({
          toggleMultiLanguageTableCell: !toggleMultiLanguageTableCell,
        });
      }}
      type={type}
      value={text}
      inputWidth="80%"
      maxLength={20}
      editable={record.editable}
      languageEnv={LookupHomeStore.languageEnv}
      handleDoubleClick={() => {
        const { dataSource, cellEditable } = this.state;
        const { editable } = record;
        if (!editable && this.state.tableState !== 'uncompleted') {
          dataSource.forEach((val) => {
            if (val.key === record.key) {
              val.editable = !editable;
            } else {
              val.editable = editable;
            }
          });
          this.setState({
            cellEditable: !cellEditable,
          });
        }
      }
      }
    />
  );

  /**
   *  检查快码值是否重复
   */
  checkLookupTypeCode = (rule, value, callback) => {
    const { intl, AppState: { menuType: { organizationId } }, store, operationType } = this.props;
    let { flag, projectId, categoryCode } = this.state;
    if (operationType === 'create') {
      // 单据快码 如果没填项目和单据不校验
      if (flag === 2) {
        projectId = projectId || -1;
        categoryCode = categoryCode || -1;
      }

      store.checkDuplicateRecord(organizationId, value, projectId, categoryCode)
        .then((duplicated) => {
          if (duplicated) {
            callback(LookupHomeStore.languages[`${intlPrefix}.editor.warning.duplicated`]);
          } else {
            callback();
          }
        });
    } else {
      callback();
    }
  };

  /**
   * 代码类型变化
   *
   */
  typeLookupOnChange = (value) => {
    const { flag } = this.state;
    if (value) {
      this.setState({
        flag: value * 1,
      }, () => {
        this.reqParentLookup(this.props);
      });
    }
  }


  /**
   * 父级快码变化时调用
   * @param rule
   * @param value
   * @param callback
   */
  parentLookupOnChange = (value) => {
    const { record: { lookupTypeId, parentLookupTypeCode, projectId: oriProjectId, categoryCode: oriCategoryCode }, AppState, record, form: { getFieldValue } } = this.props;
    const { id: organizationId, type } = AppState.currentMenuType;
    const requestUrl = '';

    const { flag } = this.state;
    const homeType = record.type;
    const projectId = getFieldValue('projectId') || oriProjectId;
    const categoryCode = getFieldValue('categoryCode') || oriCategoryCode;
    let requestValueUrl = '';
    if (type === 'organization') {
      requestValueUrl = `/fnd/v1/${organizationId}/lookup/code/proTic?lookupTypeCode=${value}`;
      if (lookupTypeId) {
        if (homeType == 2) {
          if (projectId && categoryCode) {
            requestValueUrl = `/fnd/v1/${organizationId}/lookup/code/proTic?lookupTypeCode=${value}&projectId=${projectId}&categoryCode=${categoryCode}`;
          }
        }
      } else if (!homeType || homeType === '0') {
        if (flag == 2) {
          if (projectId && categoryCode) {
            requestValueUrl = `/fnd/v1/${organizationId}/lookup/code/proTic?lookupTypeCode=${value}&projectId=${projectId}&categoryCode=${categoryCode}`;
          }
        }
      }
    } else {
      requestValueUrl = `/fnd/v1/lookup/code/?lookupTypeCode=${value}`;
    }
    if (value) {
      axios.get(requestValueUrl)
        .then((data) => {
          this.setState({
            parentLookupValueList: data.lookupValuesList,
          });
        });
    } else {
      this.setState({
        parentLookupValueList: [],
      });
    }
    const { dataSource } = this.state;
    dataSource.forEach((v) => {
      v.parentLookupValue = null;
    });
    document.querySelectorAll('ted-.ant-table .ant-select-selection-selecvalue').forEach((v) => {
      v.innerHTML = '';
    });
    this.setState({ dataSource });
  };

  /**
   *  渲染表单
   */
  renderForm = () => {
    const { form: { getFieldDecorator }, record, operationType, intl } = this.props;
    const inputWidth = 512; //  定义input控件的宽度
    const options = [];
    const typeOptions = [];
    const homeType = record.type;
    const { flag, parentLookupList } = this.state;
    const { type } = this.props.AppState.currentMenuType;


    this.typeList.forEach((v) => {
      typeOptions.push(
        <Option value={v.value} key={v.value}>{LookupHomeStore.languages[`${v.meaning}`]}</Option>,
      );
    });
    parentLookupList.forEach((v) => {
      options.push(
        <Option value={v.lookupTypeCode} key={v.lookupTypeCode}>{v.lookupTypeCode}</Option>,
      );
    });
    return (
      // Steven add comment: homeType 0 平台层 1 租户层 2 项目层
      homeType && homeType !== '0'
        ? homeType == 1
          ? (
            // 代码类型 -> 租户级别
            <Form layout="vertical">
              {type == 'organization' ? (
                <FormItem>
                  {getFieldDecorator('type', {
                    rules: [
                      {
                        required: true,
                        whitespace: true,
                        message: LookupHomeStore.languages[`${intlPrefix}.codeType`],
                      },
                    ],
                    initialValue: record.type ? record.type : '',
                    validateFirst: true,
                  })(
                    <Select
                      disabled
                      label={LookupHomeStore.languages[`${intlPrefix}.codeType`]}
                      style={{ width: inputWidth }}
                      getPopupContainer={trigger => trigger.parentNode}
                      allowClear
                      onChange={this.typeLookupOnChange}
                    >
                      {typeOptions}
                    </Select>,
                  )}
                </FormItem>
              ) : ''}
              <FormItem>
                {getFieldDecorator('lookupTypeCode', {
                  rules: [
                    {
                      required: true, //  必填字段
                      message: LookupHomeStore.languages[`${intlPrefix}.editor.warning.code`], //  若未填报出的警告
                    },
                    {
                      validator: this.checkLookupTypeCode,
                    },
                  ],
                  initialValue: record.lookupTypeCode ? record.lookupTypeCode : '',
                })(
                  <Input
                    autoComplete="off"
                    maxLength={50}
                    label={LookupHomeStore.languages[`${intlPrefix}.code`]}
                    style={{ width: inputWidth }}
                    disabled={operationType === 'modify'}
                    onKeyUp={(e) => {
                      e.target.value = e.target.value.replace(/[\W]/g, '');
                    }}
                  />,
                )}
              </FormItem>
              <FormItem>
                {getFieldDecorator('parentLookupTypeCode', {

                  initialValue: record.parentLookupTypeCode ? record.parentLookupTypeCode : '',
                })(
                  <Select
                    label={LookupHomeStore.languages[`${intlPrefix}.editor.parentCode`]}
                    style={{ width: inputWidth }}
                    getPopupContainer={trigger => trigger.parentNode}
                    allowClear
                    onChange={this.parentLookupOnChange}
                  >
                    {options}
                  </Select>,
                )}
              </FormItem>
              <FormItem>
                {getFieldDecorator('description', {
                  rules: [
                    {
                      required: true, //  必填字段
                      message: LookupHomeStore.languages[`${intlPrefix}.editor.warning.description`], //  若未填报出的警告
                    },
                  ],
                  initialValue: record.description,
                })(this.renderMultiLanguageInput('description'))}
              </FormItem>
            </Form>
          )
          : (
            // 代码类型 -> 项目级别
            <Form layout="vertical">
              {type == 'organization' ? (
                <FormItem>
                  {getFieldDecorator('type', {
                    rules: [
                      {
                        required: true,
                        whitespace: true,
                        message: LookupHomeStore.languages[`${intlPrefix}.codeType`],
                      },
                    ],
                    initialValue: record.type ? record.type : '',
                    validateFirst: true,
                  })(
                    <Select
                      disabled
                      label={LookupHomeStore.languages[`${intlPrefix}.codeType`]}
                      style={{ width: inputWidth }}
                      getPopupContainer={trigger => trigger.parentNode}
                      allowClear
                      onChange={this.typeLookupOnChange}
                    >
                      {typeOptions}
                    </Select>,
                  )}
                </FormItem>
              ) : ''}
              <FormItem>
                {getFieldDecorator('projectId', {
                  rules: [
                    {
                      required: true,
                    },
                  ],
                  initialValue: record.projectId || '',
                })(
                  <Select
                    label={LookupHomeStore.languages.project}
                    style={{ width: inputWidth }}
                    getPopupContainer={trigger => trigger.parentNode}
                    optionFilterProp="children"
                    disabled={operationType === 'modify'}
                    onChange={(value) => {
                      const { AppState, form: { setFieldsValue } } = this.props;
                      const { id: organizationId } = AppState.currentMenuType;
                      LookupHomeStore.loadLookupbyCategory(organizationId, value)
                        .then((lookUpbyCategory) => {
                          if (lookUpbyCategory) {
                            this.setState({ lookUpbyCategory });
                          }
                        });
                      setFieldsValue({
                        categoryCode: '',
                      });
                      this.reqParentLookup(this.props, value, null);
                    }}
                  >

                    {LookupHomeStore.lookUpbyPMProjectType.map(element => (
                      <Option
                        value={element.projectId}
                        key={element.projectId}
                        title={element.projectName}
                      >
                        {element.projectName}
                      </Option>
                    ))}
                  </Select>,
                )}
              </FormItem>
              <FormItem>
                {getFieldDecorator('categoryCode', {
                  rules: [
                    {
                      required: true,
                    },
                  ],
                  initialValue: record.categoryCode || '',
                })(
                  <Select
                    label={LookupHomeStore.languages[`${intlPrefix}.receipts`]}
                    style={{ width: inputWidth }}
                    disabled={operationType === 'modify'}
                    getPopupContainer={trigger => trigger.parentNode}
                    optionFilterProp="children"
                    onChange={value => this.reqParentLookup(this.props, null, value)}
                  >

                    {this.state.lookUpbyCategory.map(element => (
                      <Option
                        value={element.categoryCode}
                        key={element.categoryCode}
                        title={element.categoryMeaning}
                      >
                        {element.categoryMeaning}
                      </Option>
                    ))}
                  </Select>,
                )}
              </FormItem>
              <FormItem>
                {getFieldDecorator('lookupTypeCode', {
                  rules: [
                    {
                      required: true, //  必填字段
                      message: LookupHomeStore.languages[`${intlPrefix}.editor.warning.code`], //  若未填报出的警告
                    },
                    {
                      validator: !this.checkLookupTypeCode,
                    },
                  ],
                  initialValue: record.lookupTypeCode ? record.lookupTypeCode : '',
                })(
                  <Input
                    autoComplete="off"
                    maxLength={50}
                    label={LookupHomeStore.languages[`${intlPrefix}.code`]}
                    style={{ width: inputWidth }}
                    disabled={operationType === 'modify'}
                    onKeyUp={(e) => {
                      e.target.value = e.target.value.replace(/[\W]/g, '');
                    }}
                  />,
                )}
              </FormItem>
              <FormItem>
                {getFieldDecorator('parentLookupTypeCode', {

                  initialValue: record.parentLookupTypeCode ? record.parentLookupTypeCode : '',
                })(
                  <Select
                    label={LookupHomeStore.languages[`${intlPrefix}.editor.parentCode`]}
                    style={{ width: inputWidth }}
                    getPopupContainer={trigger => trigger.parentNode}
                    allowClear
                    onChange={this.parentLookupOnChange}
                  >
                    {options}
                  </Select>,
                )}
              </FormItem>
              <FormItem>
                {getFieldDecorator('description', {
                  rules: [
                    {
                      required: true, //  必填字段
                      message: LookupHomeStore.languages[`${intlPrefix}.editor.warning.description`], //  若未填报出的警告
                    },
                  ],
                  initialValue: record.description,
                })(this.renderMultiLanguageInput('description'))}
              </FormItem>
            </Form>
          )
        : (
          // 代码类型 -> 默认平台级别
          <Form layout="vertical">
            {type == 'organization' ? (
              <FormItem>
                {getFieldDecorator('type', {
                  rules: [
                    {
                      required: true,
                      whitespace: true,
                      message: LookupHomeStore.languages[`${intlPrefix}.codeType`],
                    },
                  ],
                  initialValue: record.type ? record.type : '',
                  validateFirst: true,
                })(
                  <Select
                    // disabled={true}
                    label={LookupHomeStore.languages[`${intlPrefix}.codeType`]}
                    style={{ width: inputWidth }}
                    getPopupContainer={trigger => trigger.parentNode}
                    allowClear
                    onChange={(val) => {
                      if (val == 1) {
                        this.setState({
                          projectId: '',
                          categoryCode: '',
                        });
                      }
                      this.typeLookupOnChange(val);
                    }}

                  >
                    {typeOptions}
                  </Select>,
                )}
              </FormItem>
            ) : ''}
            {flag == 1 ? null
              : (
                <FormItem>
                  {getFieldDecorator('projectId', {
                    rules: [
                      {
                        required: true,
                      },
                    ],
                    initialValue: record.projectId || '',
                  })(
                    <Select
                      label={LookupHomeStore.languages.project}
                      style={{ width: inputWidth }}
                      getPopupContainer={trigger => trigger.parentNode}
                      optionFilterProp="children"
                      disabled={operationType === 'modify'}
                      onChange={(value) => {
                        const { AppState, form: { setFieldsValue } } = this.props;
                        const { id: organizationId } = AppState.currentMenuType;
                        LookupHomeStore.loadLookupbyCategory(organizationId, value)
                          .then((lookUpbyCategory) => {
                            if (lookUpbyCategory) {
                              this.setState({ lookUpbyCategory });
                            }
                          });
                        setFieldsValue({
                          categoryCode: '',
                        });
                        this.setState({ projectId: value });
                        this.reqParentLookup(this.props, value, null);
                      }}
                    >

                      {LookupHomeStore.lookUpbyPMProjectType.map(element => (
                        <Option
                          value={element.projectId}
                          key={element.projectId}
                          title={element.projectName}
                        >
                          {element.projectName}
                        </Option>
                      ))}
                    </Select>,
                  )}
                </FormItem>
              )
            }
            {
              flag == 1 ? null
                : (
                  <FormItem>
                    {getFieldDecorator('categoryCode', {
                      rules: [
                        {
                          required: true,
                          // whitespace: true,
                        },
                      ],
                      initialValue: record.categoryCode || '',
                      validateFirst: true,
                    })(
                      <Select
                        label={LookupHomeStore.languages[`${intlPrefix}.receipts`]}
                        style={{ width: inputWidth }}
                        getPopupContainer={trigger => trigger.parentNode}
                        optionFilterProp="children"
                        disabled={operationType === 'modify'}
                        onChange={(value) => {
                          this.setState({ categoryCode: value });
                          this.reqParentLookup(this.props, null, value);
                        }
                        }
                      >

                        {this.state.lookUpbyCategory.map(element => (
                          <Option
                            value={element.categoryCode}
                            key={element.categoryCode}
                            title={element.categoryMeaning}
                          >
                            {element.categoryMeaning}
                          </Option>
                        ))}
                      </Select>,
                    )}
                  </FormItem>
                )
            }
            <FormItem>
              {getFieldDecorator('lookupTypeCode', {
                rules: [
                  {
                    required: true, //  必填字段
                    message: LookupHomeStore.languages[`${intlPrefix}.editor.warning.code`], //  若未填报出的警告
                  },
                  {
                    validator: this.checkLookupTypeCode,
                  },
                ],
                initialValue: record.lookupTypeCode ? record.lookupTypeCode : '',
              })(
                <Input
                  autoComplete="off"
                  maxLength={50}
                  label={LookupHomeStore.languages[`${intlPrefix}.code`]}
                  style={{ width: inputWidth }}
                  disabled={operationType === 'modify'}
                  onKeyUp={(e) => {
                    e.target.value = e.target.value.replace(/[\W]/g, '');
                  }}
                />,
              )}
            </FormItem>
            <FormItem>
              {getFieldDecorator('parentLookupTypeCode', {

                initialValue: record.parentLookupTypeCode ? record.parentLookupTypeCode : '',
              })(
                <Select
                  label={LookupHomeStore.languages[`${intlPrefix}.editor.parentCode`]}
                  style={{ width: inputWidth }}
                  getPopupContainer={trigger => trigger.parentNode}
                  allowClear
                  onChange={this.parentLookupOnChange}
                >
                  {options}
                </Select>,
              )}
            </FormItem>
            <FormItem>
              {getFieldDecorator('description', {
                rules: [
                  {
                    required: true, //  必填字段
                    message: LookupHomeStore.languages[`${intlPrefix}.editor.warning.description`], //  若未填报出的警告
                  },
                ],
                initialValue: record.description,
              })(this.renderMultiLanguageInput('description'))}
            </FormItem>
          </Form>
        )
    );
  };

  /**
   *  处理新建一条表格数据的事件
   */
  handleAddTableRecord = () => {
    const { form: { validateFields }, store } = this.props;
    //  若表单必填项未填则不允许新增数据
    if (this.state.tableState !== 'uncompleted' && this.state.isOrder) {
      validateFields((err) => {
        if (!err) {
          const { dataSource, count } = this.state;
          //  将其他行设置为不可编辑
          dataSource.forEach((val) => {
            val.editable = false;
          });
          //  定义一条新数据，暂时先填充两个字段
          const newData = {
            //  count为了防止报key重复错误
            key: count,
            //  默认启用、可编辑
            isEnabled: 'Y',
            orderSeq: 0,
            editable: true,
            __tls: {
              meaning: store.languageInfo,
              description: store.languageInfo,
            },
          };
          this.setState({
            //  将新定义的数据加入到数据集中
            dataSource: dataSource ? [newData, ...dataSource] : [newData],
            count: count + 1,
          });
        }
      });
    } else if (!this.state.isOrder) {
      LookupHomeStore.getCode('enter.integer')
    } else {
      LookupHomeStore.getCode('enter.required')
    }
  };

  /**
   *  处理删除表格行的事件
   */
  handleDeleteTableRecords = () => {
    if (this.selectedCodeValues.length > 0) { //  若至少选择了一行才弹出窗口
      const { AppState, intl } = this.props;
      const { organizationId } = AppState.currentMenuType;
      //  删除前弹窗确认
      confirm({
        title: LookupHomeStore.languages[`${intlPrefix}.editor.confirmDelete`],
        okType: 'danger',
        onOk: () => {
          const { store, record, AppState: { menuType: { organizationId } } } = this.props;
          this.setState({ tableState: 'completed', selectedRowKeys: [] });
          const selectedCodeValue = {};
          store.deleteCodeValues(organizationId, this.selectedCodeValues)
            .then(() => {
              //  删除后重新加载快码值数据并渲染
              store.loadCodeById(organizationId, record.lookupTypeId)
                .then((data) => {
                  this.initDataSource(data);
                });
            });
        },
      });
    }
  };

  /**
   *  渲染按钮组
   */
  renderButtonGroup = () => {
    const { canAddTableRecord, selectedRowKeys } = this.state;
    return (
      <div>
        <Button
          style={{ color: '#04173F' }}
          disabled={canAddTableRecord}
          onClick={this.handleAddTableRecord.bind(this)}
        >
          <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
          {LookupHomeStore.languages[`${intlPrefix}.header.create`]}
        </Button>
        <Button
          icon="shanchu"
          type="danger"
          disabled={selectedRowKeys.length === 0}
          onClick={this.handleDeleteTableRecords.bind(this)}
        >
          {LookupHomeStore.languages.delete}
        </Button>

      </div>
    );
  };

  //  处理列选择事件
  rowSelection = {
    onSelect: (record, selected, selectedRows) => {
      //  选择记录后，将选中的记录加入selectedCodeValue状态中
      this.selectedCodeValues = selectedRows;
      this.setState({ selectedRowKeys: selectedRows });
    },
    onSelectAll: (selected, selectedRows) => {
      //  全选同理
      if (selected) {
        this.selectedCodeValues = selectedRows;
        this.setState({ selectedRowKeys: selectedRows });
      } else {
        this.selectedCodeValues = [];
        this.setState({ selectedRowKeys: [] });
      }
    },
  };

  /**
   *  渲染表格
   */
  renderTable = () => {
    //  获取dataSource
    const { dataSource, dataLoading, pagination } = this.state;
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    //  定义表格列
    const columns = [
      {
        title: LookupHomeStore.languages[`${intlPrefix}.editor.value`],
        dataIndex: 'lookupValue',
        key: 'lookupValue',
        width: '20%',
        filters: [],
        onFilter: (lookupValue, record) => record.lookupValue.indexOf(lookupValue) !== -1,
        render: (value, record) => this.renderTestTableCell(record, value, 'lookupValue', true, true, true),
      },
      {
        title: LookupHomeStore.languages[`${intlPrefix}.editor.meaning`],
        dataIndex: 'meaning',
        key: 'meaning',
        width: '20%',
        filters: [],
        onFilter: (meaning, record) => record.meaning.indexOf(meaning) !== -1,
        render: (text, record) => this.renderMultiLanguageTableCell(
          text,
          record,
          this.props.AppState.currentMenuType.type === 'organization'
            ? (record.lookupValueId ? `fnd/v1/${organizationId}/lookup/value/language/${record.lookupValueId}?columnName=meaning` : null)
            : (record.lookupValueId ? `fnd/v1/lookup/value/language/${record.lookupValueId}?columnName=meaning` : null),
          'meaning',
        ),
      },
      {
        title: LookupHomeStore.languages[`${intlPrefix}.description`],
        dataIndex: 'description',
        key: 'description',
        width: '15%',
        filters: [],
        onFilter: (description, record) => record.description.indexOf(description) !== -1,
        render: (text, record) => this.renderMultiLanguageTableCell(
          text,
          record,
          this.props.AppState.currentMenuType.type == 'organization'
            ? (record.lookupValueId ? `fnd/v1/${organizationId}/lookup/value/language/${record.lookupValueId}?columnName=description` : null)
            : (record.lookupValueId ? `fnd/v1/lookup/value/language/${record.lookupValueId}?columnName=description` : null),
          'description',
        ),
      },
      {
        title: LookupHomeStore.languages[`${intlPrefix}.editor.sortCode`],
        dataIndex: 'orderSeq',
        key: 'orderSeq',
        width: '10%',
        align: 'center',
        filters: [],
        onFilter: (orderSeq, record) => record.orderSeq.indexOf(orderSeq) !== -1,
        sorter: (a, b) => a.orderSeq - b.orderSeq,
        render: (value, record) => this.renderOrdTableCell(record, value, 'orderSeq', false, false, false, 'number'),
      },
      {
        title: LookupHomeStore.languages[`${intlPrefix}.editor.parentCodeValue`],
        dataIndex: 'parentLookupValue',
        key: 'parentLookupValue',
        align: 'center',
        filters: [],
        onFilter: (parentLookupValue, record) => record.parentLookupValue.indexOf(parentLookupValue) !== -1,
        render: (value, record) => this.renderParentLookup(record, value, 'parentLookupValue', true, true, true),
      },
      {
        title: LookupHomeStore.languages[`${intlPrefix}.editor.tag`],
        dataIndex: 'tag',
        key: 'tag',
        width: '10%',
        align: 'center',
        filters: [],
        onFilter: (tag, record) => record.tag.indexOf(tag) !== -1,
        render: (value, record) => this.renderTestTableCell(record, value, 'tag'),
      },
      {
        title: LookupHomeStore.languages[`${intlPrefix}.editor.isEnabled`],
        dataIndex: 'isEnabled',
        key: 'isEnabled',
        width: '10%',
        align: 'center',
        filters: [
          {
            text: LookupHomeStore.languages.yes,
            value: 'Y',
          },
          {
            text: LookupHomeStore.languages.no,
            value: 'N',
          },
        ],
        onFilter: (isEnabled, record) => isEnabled === record.isEnabled,
        render: (text, record) => (
          <Checkbox
            onChange={() => {
              record.isEnabled = record.isEnabled === 'Y' ? 'N' : 'Y';
              const { toggleCheck } = this.state;
              this.setState({
                toggleCheck: !toggleCheck,
              });
            }}
            checked={record.isEnabled === 'Y'}
          />
        ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={dataLoading}
        rowSelection={this.rowSelection}
      />
    );
  };

  /**
   *  检查表格中必填字段是否填完
   */
  checkTableData = () => {
    const { dataSource } = this.state;
    let ret = true;
    dataSource.forEach((val) => {
      if (!(val.lookupValue && val.meaning)) {
        ret = false;
      }
      /* eslint-disable */
      if (!val.__tls || Object.keys(val.__tls).length < 1) {
        delete val.language;
      }
      /* eslint-enable */
    });
    return ret;
  };

  /**
   *  处理submit请求
   */
  handleSubmit = () => {
    const { operationType, store, form: { validateFields }, handleRefresh, record, AppState: { menuType: { organizationId } } } = this.props;
    const { dataSource, isOrder } = this.state;
    //  每个快码值增加一些字段
    validateFields((err, data) => {
      //  若校验没有错误，则开始发送请求
      if (!err && this.checkTableData() && isOrder) {
        if (dataSource.length) {
          dataSource.map(val => Object.assign(val, {
            iamOrganizationId: organizationId,
            projectId: record.projectId || data.projectId,
            categoryCode: record.categoryCode || data.categoryCode,
          }));
        }
        data.lookupValuesList = dataSource;
        //  根据操作类型决定进行何种操作
        if (operationType === 'create') {
          //  检查数据是否重复
          if (!data.projectId) {
            data.projectId = 0;
          }
          data.lookupValuesList.forEach((v) => {
            v.isSite = this.props.AppState.currentMenuType.type === 'organization' ? 'N' : 'Y';
          });
          const proId = data.projectId || '',
                caCode = data.categoryCode|| '';
          store.checkDuplicateRecord(organizationId, data.lookupTypeCode,proId,caCode)
            .then((duplicated) => {
              if (duplicated) {
                //  提醒数据冲突
              } else {
                //  新建操作
                store.createCode(organizationId, Object.assign({}, data, {
                  iamOrganizationId: organizationId,
                  // projectId : data.proejectId?data.projectId:0,
                  __tls: Object.assign(
                    {
                      description: store.languageInfo,
                    },
                    this.state.multiLanguageValue,
                  ),
                  language: store.languageList,
                }))
                  .then(({ failed, message: inmessage }) => {
                    if (failed) {
                    } else {
                      const { intl } = this.props;
                      Choerodon.prompt(LookupHomeStore.languages['create.success']);
                      this.setState({ multiLanguageValue: {} });
                      handleRefresh();
                    }
                  });
              }
            });
        } else {
          //  更新操作
          const submitData = Object.assign({}, record, {
            ...data,
            iamOrganizationId: organizationId,
            __tls: this.state.multiLanguageValue,
            parentLookupTypeCode: data.parentLookupTypeCode || null,
            projectId: data.projectId ? data.projectId : 0,
          });
          if (Object.keys(this.multiLanguageList).length < 1) {
            /* eslint-disable */
            delete submitData.__tls;
            /* eslint-enable */
            delete submitData.language;
          }
          store.updateCode(organizationId, submitData)
            .then(({ failed, message: inmessage }) => {
              if (failed) {
              } else {
                const { intl } = this.props;
                Choerodon.prompt(LookupHomeStore.languages['modify.success']);
                this.setState({ multiLanguageValue: {} });
                handleRefresh();
              }
            });
        }
      } else if (!isOrder) {
        LookupHomeStore.getCode('enter.integer')
      } else {
        //  输出报错信息
        LookupHomeStore.getCode('enter.required')
      }
    });
    this.multiLanguageValue = {};
  };

  /**
   *  处理取消按钮事件
   */
  handleCancel = () => {
    const { form: { isModifiedFields } } = this.props;
    const { dataSource } = this.state;
    //  若表单或表格数据有变化，则设置contentChanged为true
    this.contentChanged = !(Object.is(dataSource, this.originData) && !isModifiedFields());
  };

  /**
   *  渲染可编辑表格单元格
   */
  renderOrdTableCell = (record, value, field, onlyLetters, required, focus, type) => {
    const { cellEditable, dataSource } = this.state;
    const { editable, key } = record;

    const props = {
      className: 'input',
      type: type || 'text',
      // maxLength: field === 'orderSeq' ? 10 : 20,
      autoFocus: focus,
      underline: editable || false,
      readOnly: !editable || false,
      defaultValue: value,
      onChange: (e) => {
        if (e.target.value < 0) {
          this.setState({
            isOrder: false,
          });
          LookupHomeStore.getCode('enter.integer')
        } else {
          this.setState({
            isOrder: true,
          });
          record[field] = e.target.value;
        }
      },
      onDoubleClick: () => {
        if (!editable && this.state.tableState !== 'uncompleted') {
          dataSource.forEach((val) => {
            if (val.key === key) {
              val.editable = !editable;
            } else {
              val.editable = editable;
            }
          });
          this.setState({
            cellEditable: !cellEditable,
          });
        }
      },
      onBlur: (e) => {
        if (required && !e.target.value) {
          this.state.tableState = 'uncompleted';
        } else {
          this.state.tableState = 'completed';
        }
      },
    };
    return (
      <Input {...props} />
    );
  };

  /**
   *  渲染可编辑表格单元格
   */
  renderTestTableCell = (record, value, field, onlyLetters, required, focus, type) => {
    const { cellEditable, dataSource } = this.state;
    const { editable, key } = record;
    const props = {
      className: 'input',
      type: type || 'text',
      // maxLength: field === 'orderSeq' ? 10 : 20,
      autoFocus: focus,
      underline: editable || false,
      readOnly: !editable || false,
      defaultValue: value,
      onChange: (e) => {
        record[field] = e.target.value;
      },
      onDoubleClick: () => {
        if (!editable && this.state.tableState !== 'uncompleted') {
          dataSource.forEach((val) => {
            if (val.key === key) {
              val.editable = !editable;
            } else {
              val.editable = editable;
            }
          });
          this.setState({
            cellEditable: !cellEditable,
          });
        }
      },
      onBlur: (e) => {
        if (required && !e.target.value) {
          this.state.tableState = 'uncompleted';
        } else {
          this.state.tableState = 'completed';
        }
      },
    };
    return (
      <Input {...props} />
    );
  };

  /**
   *  渲染可编辑表格单元格
   */
  renderParentLookup = (record, value, field, onlyLetters, required, focus, type) => {
    const { cellEditable, dataSource, parentLookupValueList } = this.state;
    const options = [];
    parentLookupValueList.forEach((v) => {
      options.push(
        <Option value={v.lookupValue} parentLookupValueSingle={v} key={v.lookupValue}>{v.lookupValue}</Option>,
      );
    });
    const { editable, key } = record;
    const props = {
      autoFocus: focus,
      onChange: (v, option) => {
        if (v) {
          record[field] = v;
          record.parentLookupValueId = option.props.parentLookupValueSingle.lookupValueId;
        } else {
          record[field] = null;
          record.parentLookupValueId = null;
        }
      },
      allowClear: true,
      style: { width: 100 },
      getPopupContainer: trigger => trigger.parentNode,
      onDoubleClick: () => {
        if (!editable && this.state.tableState !== 'uncompleted') {
          dataSource.forEach((val) => {
            if (val.key === key) {
              val.editable = !editable;
            } else {
              val.editable = editable;
            }
          });
          this.setState({
            cellEditable: !cellEditable,
          });
        }
      },
    };
    if (value) {
      props.defaultValue = value;
    }
    return (
      <Select {...props}>
        {options}
      </Select>
    );
  };

  render() {
    this.handleCancel();
    //  获取父组件参数
    const { visible, onCancel } = this.props;
    return (
      <Sidebar
        visible={visible}
        title={this.renderTitle()}
        okText={LookupHomeStore.languages.save}
        cancelText={LookupHomeStore.languages.cancel}
        onOk={this.handleSubmit.bind(this)}
        onCancel={() => {
          this.multiLanguageValue = {};
          this.setState({ multiLanguageValue: {} });
          this.setState({
            tableState: 'unchanged',
          });
          onCancel(this.contentChanged);
        }}
      >
        <Content
          className="sidebar-content"
        >
          {this.renderForm()}
          {this.renderButtonGroup()}
          {this.renderTable()}
        </Content>
      </Sidebar>
    );
  }
}

LookUpEditor.propTypes = {};

export default LookUpEditor;
