/** 2018/11/22
*作者:高梦龙
*项目：编码规则新建和查看页面n
*/
import React, { Component } from 'react';
import { Form, Input, Select, Table, Button, message, InputNumber, Row, Col, Modal, Checkbox } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { axios, Content, Header, Page } from 'yqcloud-front-boot';
import encodingStore from '../../../../stores/organization/encodingRules/EncodingStore';
import './encodingType.scss';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';


const FormItem = Form.Item;
const { Option } = Select;
const intlPrefix = 'organization.encodingRules';

function noop() {
}
@inject('AppState')
@observer
class EncodingEdit extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      open: false,
      edit: !!this.props.match.params.id, // 页面是否是编辑状态
      id: this.props.match.params.id,
      page: 0,
      isLoading: true,
      params: [],
      filters: {},
      codeInfo: {},
      codeRuleLineList: [],
      deleteValueAll: [],
      selectedCodeValues: [],
      dataKey: 0,
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      sort: 'templateId,desc',
      tableState: 'unchanged',
      visible: false,
      fieldType: '',
      startValue: '',
      fieldLength: '',
      naturalNum: true,
      // 存放多语言信息
      multiLanguageValue: {
        rule_name: {},
        description: {},
      },
      multiLanguageList: [],
      visibleState: '',
      currentDefault: '',
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
    this.getLanguage();
  }

  componentDidMount() {
    this.loatAllData();
  }

  /* 获取系统支持的语言环境 */
  getLanguage = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        });
      });
  };

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    encodingStore.queryLanguage(id, AppState.currentLanguage);
  };

  fetch() {
    // 获取类型数据
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    encodingStore.getApplicationTypes(organizationId);
    encodingStore.getDocTypeCodes(organizationId);
    encodingStore.getDateTypes(organizationId);
    encodingStore.getResetFrequencys(organizationId);
    encodingStore.getSequences(organizationId);
  }

  // 初始化数据
  loatAllData=() => {
    const { AppState } = this.props;
    const { id, edit } = this.state;
    const { organizationId } = AppState.currentMenuType;
    if (edit) {
      this.getCodeRulesById(organizationId, id);
    }
    this.setState({
      isLoading: false,
    });
  }

  // 通过id获取数据
  getCodeRulesById(organizationId, headerId) {
    encodingStore.getCodeRulesId(organizationId, headerId)
      .then((data) => {
        let valId = 0;
        if (data) {
          if (data.codeRuleLineList) {
            data.codeRuleLineList.map((val) => {
              val.key = valId++;
            });
          }
        }
        if (data.applicationCode === 'ITSM') {
          this.setState({
            visibleState: 'none',
            codeInfo: data,
            codeRuleLineList: data.codeRuleLineList || [],
          });
        } else {
          this.setState({
            visibleState: '',
            codeInfo: data,
            codeRuleLineList: data.codeRuleLineList || [],
          });
        }

      })
  }

  // 新增按钮
  handleAddTableRecord = () => {
    const { form: { validateFields } } = this.props;
    //  若表单必填项未填则不允许新增数据
    validateFields((err) => {
      if (!err) {
        const { codeRuleLineList, dataKey } = this.state;
        //  定义一条新数据，暂时先填充两个字段
        const newData = {
          key: dataKey,
          fieldSequence: dataKey + 1,
          stepNumber: false,
        };
        this.setState({
          //  将新定义的数据加入到数据集中
          codeRuleLineList: [...codeRuleLineList, newData],
          dataKey: dataKey + 1,
        });
      }
    });
  };

  // 校验单据类型
  checkDocTypeCode = (rule, value, callback) => {
    const { AppState, intl } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    const { form } = this.props;
    const applicationCode = form.getFieldValue('applicationCode');
    if (applicationCode && value){
      encodingStore.checkDocTypeCode(organizationId, applicationCode, value).then((data) => {
        if (data === false) {
          callback(encodingStore.languages[`${intlPrefix}.docTypeCode.exist.msg`]);
        } else {
          callback();
        }
      });
    }

  }

  // 校验单据类型
  checkRuleCode = (rule, value, callback) => {
    const { AppState, intl } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    const reg = /^[A-Z_-]+$/;
    if (value) {
      if (reg.test(value)) {
        encodingStore.checkRuleCode(organizationId, value).then((data) => {
          if (data === false) {
            callback(encodingStore.languages[`${intlPrefix}.ruleCode.exist.msg`]);
          } else {
            callback();
          }
        });
      } else {
        callback(encodingStore.languages[`${intlPrefix}.ruleCode.require.msg`]);
      }
    } else {
      callback();
    }
  }


  /**
   *  处理删除表格行的事件
   */
  handleDeleteTableRecords = () => {
    if (this.state.tableState === 'uncompleted') {
    } else if (this.state.selectedCodeValues.length > 0) {
      const { intl } = this.props;
      const { codeRuleLineList, selectedCodeValues, deleteValueAll } = this.state;
      //  删除前弹窗确认
      Modal.confirm({
        title: encodingStore.languages[`${intlPrefix}.editor.confirmDelete`],
        okType: 'danger',
        onOk: () => {
          for (let i = codeRuleLineList.length - 1; i >= 0; i -= 1) {
            if (selectedCodeValues.includes(codeRuleLineList[i].key)) {
              codeRuleLineList.splice(i, 1);
            }
            this.setState({
              codeRuleLineList,
              selectedCodeValues: [],
              deleteValueAll,
              constantState: false,
              sysmbolState: false,
              dateType: false,
            });
          }
        },
      });
    }
  };

  // 渲染日期掩码列表
  renderTableSelectFieldMask = ({ record, value, field }) => {
    const { edit } = this.state;
    const dataOption = [];
    const dataTypes = encodingStore.getDateType;
    dataTypes.forEach((values) => {
      dataOption.push(<Option key={values.lookupValue} value={values.lookupValue}>{values.lookupMeaning}</Option>);
    });
    if (record.fieldType === 'CONSTANT') {
      return (
        <Select
          onChange={(e) => {
            record[field] = e.target.value;
            callback();
          }}
          getPopupContainer={triggerNode => triggerNode.parentNode}
          defaultValue={record.fieldMask}
          style={{ width: 100 }}
          disabled={edit || true}
          allowClear
        >
          {dataOption}
        </Select>
      );
    } else if (record.fieldType === 'SEQUENCE') {
      return (
        <Select
          onChange={(value) => {
            record.fieldMask = value;
          }}
          getPopupContainer={triggerNode => triggerNode.parentNode}
          defaultValue={record.fieldMask}
          style={{ width: 100 }}
          disabled={edit || true}
          allowClear
        />
      );
    } else if (record.fieldType === 'DATE') {
      return (
        <Select
          onChange={(value) => {
            record.fieldMask = value;
          }}
          getPopupContainer={triggerNode => triggerNode.parentNode}
          defaultValue={record.fieldMask}
          style={{ width: 100 }}
          disabled={edit || false}
          allowClear
          onBlur={() => {
            if (record.fieldMask) {
              //
            } else {
              encodingStore.getCode('dateMask.cannot.empty');
            }
          }}
        >
          {dataOption}
        </Select>
      );
    } else {
      return (
        <Select
          onChange={(value) => {
            record.fieldMask = value;
          }}
          getPopupContainer={triggerNode => triggerNode.parentNode}
          defaultValue={record.fieldMask}
          style={{ width: 100 }}
          disabled={edit || true}
          allowClear
        >
          {dataOption}
        </Select>
      );
    }
  }

  // 渲染重置频率列表
  renderTableSelectResetFrequency = ({ record, value, field }) => {
    const { edit } = this.state;
    const resetOptions = [];
    const resetTypes = encodingStore.getResetFrequency;
    resetTypes.forEach((values) => {
      resetOptions.push(<Option key={values.lookupValue} value={values.lookupValue}>{values.lookupMeaning}</Option>);
    });
    if (record.fieldType === 'CONSTANT') {
      return (
        <Select
          onChange={(value) => {
            record.resetFrequency = value;
          }}
          getPopupContainer={triggerNode => triggerNode.parentNode}
          defaultValue={record.resetFrequency}
          style={{ width: 90 }}
          disabled={edit || true}
          allowClear
        >
          {resetOptions}
        </Select>
      );
    } else if (record.fieldType === 'DATE') {
      return (
        <Select
          onChange={(value) => {
            record.resetFrequency = value;
          }}
          getPopupContainer={triggerNode => triggerNode.parentNode}
          defaultValue={record.resetFrequency}
          style={{ width: 90 }}
          disabled={edit || true}
          allowClear
        >
          {resetOptions}
        </Select>
      );
    } else if (record.fieldType === 'SEQUENCE') {
      return (
        <Select
          onChange={(value) => {
            record.resetFrequency = value;
          }}
          getPopupContainer={triggerNode => triggerNode.parentNode}
          style={{ width: 90 }}
          defaultValue={record.resetFrequency}
          disabled={edit || false}
          allowClear
          onBlur={() => {
            if (record.resetFrequency) {
              //
            } else {
              encodingStore.getCode('resetFrequency.cannot.empty');
            }
          }}
        >
          {resetOptions}
        </Select>
      );
    } else {
      return (
        <Select
          onChange={(value) => {
            record.resetFrequency = value;
          }}
          getPopupContainer={triggerNode => triggerNode.parentNode}
          style={{ width: 90 }}
          disabled={edit || true}
          allowClear
        >
          {resetOptions}
        </Select>
      );
    }
  }

  // 渲染段值列表
  renderTableInput = ({ record, value, field, type, callback = noop }) => {
    const { edit } = this.state;
    if (record.fieldType === 'CONSTANT') {
      return (
        <div>
          <Input
            type={type || 'text'}
            defaultValue={value}
            onChange={(e) => {
              record[field] = e.target.value;
              callback();
            }}
            disabled={edit || false}
            onBlur={() => {
              const re = /^[\u4e00-\u9fa5]+$/;
              if (record.fieldValue) {
                if (re.test(record.fieldValue)) {
                  // message.warning(encodingStore.languages[`${intlPrefix}.cannot.be.empty`]);
                  encodingStore.getCode('segmentValue.cannot.empty');
                }
              } else {
                // message.warning(encodingStore.languages[`${intlPrefix}.cannot.be.empty`]);
                encodingStore.getCode('segmentValue.cannot.empty');
              }
            }}
          />
        </div>
      );
    } else if (record.fieldType === 'DATE') {
      return (
        <div>
          <Input
            type={type || 'text'}
            defaultValue={value}
            onChange={(e) => {
              record[field] = e.target.value;
              callback();
            }}
            disabled={edit || true}
          />
        </div>
      );
    } else if (record.fieldType === 'SEQUENCE') {
      return (
        <div>
          <Input
            type={type || 'text'}
            defaultValue={value}
            onChange={(e) => {
              record[field] = e.target.value;
              callback();
            }}
            disabled={edit || true}
          />
        </div>
      );
    } else {
      return (
        <div>
          <Input
            type={type || 'text'}
            defaultValue={value}
            onChange={(e) => {
              record[field] = e.target.value;
              callback();
            }}
            disabled={edit || true}
          />
        </div>
      );
    }
  }

  // 渲染位数输入框
  renderTableInputNumber = ({ record, value, field, callback = noop }) => {
    const { edit, codeRuleLineList } = this.state;
    if (record.fieldType === 'CONSTANT' || record.fieldType === 'DATE') {
      return (
        <div>
          <InputNumber
            defaultValue={value}
            min={1}
            onChange={(value) => {
              record[field] = value;
            }}
            disabled={edit || true}
          />
        </div>
      );
    } else if (record.fieldType === 'SEQUENCE') {
      return (
        <div>
          <InputNumber
            // defaultValue={value}
            value={value}
            min={1}
            onChange={(value) => {
              codeRuleLineList.find(v => v.key === record.key)[field] = value;
              this.setState({ codeRuleLineList });
            }
            }
            disabled={edit ? true : !!record.stepNumber}
            onBlur={() => {
              if (record[field]) {
                if (!/^\d+$/.test(record[field])) {
                  // message.warning(encodingStore.languages[`${intlPrefix}.NumberDigits.not.decimals`]);
                  encodingStore.getCode('NumberDigits.not.decimals');
                }
              } else {
                encodingStore.getCode('NumberDigits.not.empty');
              }
            }
            }
          />
        </div>
      );
    } else {
      return (
        <div>
          <InputNumber
            defaultValue={value}
            min={1}
            onChange={(value) => {
              record[field] = value;
            }}
            disabled={edit || true}
            onBlur={() => {
              if (record[field]) {
                if (!/^\d+$/.test(record[field])) {
                  // message.warning(encodingStore.languages[`${intlPrefix}.NumberDigits.not.decimals`]);
                  encodingStore.getCode('NumberDigits.not.decimals');
                }
              }
            }
            }
          />
        </div>
      );
    }
  }

  // 自然数
  renderTableStepNumber = ({ record, value, field, callback = noop }) => {
    const { edit } = this.state;
    if (record.fieldType === 'CONSTANT' || record.fieldType === 'DATE') {
      return (
        <div>
          <Checkbox
            onChange={() => {
              const { naturalNum } = this.state;
              record[field] = this.state.naturalNum;
              this.setState({
                naturalNum: !naturalNum,
              });
            }
            }
            disabled={edit || true}
            defaultValue={value}
            checked={record[field]}
          />
        </div>
      );
    } else if (record.fieldType === 'SEQUENCE') {
      return (
        <div>
          <Checkbox
            onChange={() => {
              const { naturalNum } = this.state;
              record[field] = this.state.naturalNum;
              this.setState({
                naturalNum: !naturalNum,
                fieldLength: record.fieldLength,
              });
              record.fieldLength = naturalNum ? '' : record.fieldLength;
            }
            }
            disabled={edit || false}
            defaultValue={value}
            checked={record[field]}
          />
        </div>
      );
    } else {
      return (
        <div>
          <Checkbox
            onChange={() => {
              const { naturalNum } = this.state;
              record[field] = this.state.naturalNum;
              this.setState({
                naturalNum: !naturalNum,
              });
            }
            }
            disabled={edit || true}
            defaultValue={value}
            checked={record[field]}
          />
        </div>
      );
    }
  }


  // 渲染开始值列表
  renderTableStartValue = ({ record, value, field, callback = noop }) => {
    const { edit, currentDefault } = this.state;
    if (record.fieldType === 'CONSTANT' || record.fieldType === 'DATE') {
      return (
        <div>
          <InputNumber
            defaultValue={value}
            min={1}
            onChange={(value) => {
              record[field] = value;
            }}
            disabled={edit || true}
          />
        </div>
      );
    } else if (record.fieldType === 'SEQUENCE') {
      return (
        <div>
          <InputNumber
            defaultValue={value}
            min={1}
            onChange={(value) => {
              record[field] = value;
              this.setState({
                currentDefault: value
              })
            }}
            disabled={edit || false}
            onBlur={() => {
              if (record.startValue) {
                if (!/^\d+$/.test(record.startValue)) {
                  encodingStore.getCode('startValue.cannot.decimals');
                  // message.warning(encodingStore.languages[`${intlPrefix}.startValue.cannot.decimals`]);
                } else if (record.fieldLength) {
                  const { length } = record.startValue.toString();
                  if (length <= record.fieldLength) {
                    return true;
                  } else {
                    // message.warning(encodingStore.languages[`${intlPrefix}.startValue.cannot.decimals`]);
                    encodingStore.getCode('startValue.lessthan.number');
                  }
                }
              } else {
                // message.warning(encodingStore.languages[`${intlPrefix}.startValue.not.empty`]);
                encodingStore.getCode('startValue.cannot.empty');
              }
            }
            }
          />
        </div>
      );
    } else {
      return (
        <div>
          <InputNumber
            defaultValue={value}
            min={1}
            onChange={(value) => {
              record[field] = value;
            }}
            disabled={edit || true}
            onBlur={() => {
              if (record.startValue) {
                if (!/^\d+$/.test(record.startValue)) {
                  encodingStore.getCode('startValue.cannot.decimals');
                  // message.warning(encodingStore.languages[`${intlPrefix}.startValue.cannot.decimals`]);
                } else {
                  const { length } = record.startValue.toString();
                  if (length <= record.fieldLength) {
                    return true;
                  } else {
                    encodingStore.getCode('startValue.lessthan.number');
                    // message.warning(encodingStore.languages[`${intlPrefix}.startValue.lessthan.number`]);
                  }
                }
              } else {
                encodingStore.getCode('startValue.cannot.empty');
              }
            }
            }
          />
        </div>
      );
    }
  }

  // 渲染序号列表
  renderTableFieldSequence = ({ record, value, field, type, callback = noop }) => {
    const { edit } = this.state;
    if (record.fieldType === 'SEQUENCE' || record.fieldType === 'DATE' || record.fieldType === 'CONSTANT') {
      return (
        <div>
          <InputNumber
            defaultValue={record.fieldSequence}
            min={1}
            onChange={(value) => {
              record[field] = value;
            }}
            disabled={edit || false}
          />
        </div>
      );
    } else {
      return (
        <div>
          <InputNumber
            defaultValue={record.fieldSequence}
            min={0}
            onChange={(value) => {
              record[field] = value;
            }}
            disabled={edit || false}
            onBlur={() => {
              const s = new Set();
              const { codeRuleLineList } = this.state;
              codeRuleLineList.forEach(i => s.add(i.fieldSequence));
              if (codeRuleLineList.length !== s.size) {
                // message.warning(encodingStore.languages[`${intlPrefix}.serialNumber.duplicated`]);
                encodingStore.getCode('serialNumber.duplicated');
              } else {
                return true;
              }
            }
            }
          />
        </div>
      );
    }
  }

  // 当前值列表
  renderTableCurrentValue = ({ record, value, field, type, callback = noop }) => {
    const { edit, currentDefault } = this.state;
    if (record.fieldType === 'SEQUENCE') {
      return (
        <div>
          <InputNumber
            defaultValue={value}
            disabled={edit || false}
            min={1}
            onChange={(value) => {
              if (value) {
                record[field] = value;
              } else {
                record[field] = currentDefault;
              }
            }}
            onBlur={() => {
              if (record.startValue) {
                const startValues = record.startValue;
                if (record.currentValue >= startValues) {
                  return true;
                } else {
                  encodingStore.getCode('currentValue.morethan.startValue');
                  // message.warning(encodingStore.languages[`${intlPrefix}.currentValue.morethan.startValue`]);
                }
              }
            }
            }
          />
        </div>
      );
    } else {
      return (
        <div>
          <InputNumber
            defaultValue={value}
            min={1}
            disabled={edit || false}
            onChange={(value) => {
              record[field] = value;
            }}
            disabled
          />
        </div>
      );
    }
  }

  // 提交按钮
  handleSubmit = (e) => {
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (!err) {
        const { AppState, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        const { codeRuleLineList } = this.state;
        if (codeRuleLineList.length > 0) {
          const result = codeRuleLineList.some((item) => {
            if (item.fieldType == 'SEQUENCE') {
              return true;
            }
          });
          const results = codeRuleLineList.some((item) => {
            if (item.fieldType == 'CONSTANT') {
              return true;
            }
          });
          if (result) {
            const s = new Set();
            codeRuleLineList.forEach(i => s.add(i.fieldSequence));
            codeRuleLineList.forEach((item) => {
              if (item.fieldType == 'SEQUENCE') {
                if (!item.currentValue) {
                  item.currentValue = item.startValue;
                }
              }
            })
            this.setState({
              codeRuleLineList,
            })
            if (codeRuleLineList.length !== s.size) {
              // message.warning(encodingStore.languages[`${intlPrefix}.serialNumber.duplicated`]);
              encodingStore.getCode('serialNumber.duplicated');
            } else if (results) {
              const logs = codeRuleLineList.filter(item => (item.fieldType === 'CONSTANT'));
              let judgeChinese = false;
              logs.forEach((v) => {
                const re = /^[\u4e00-\u9fa5]+$/;
                if (re.test(v.fieldValue)) {
                  judgeChinese = true;
                }
              });
              if (judgeChinese) {
                encodingStore.getCode('constant.cannot.enter');
              } else {
                this.setState({
                  isLoading: true,
                });
                encodingStore.createCodeRules(organizationId, Object.assign({}, {
                  ...data,
                  codeRuleLineList,
                  __tls: this.state.multiLanguageValue,
                  language: this.state.multiLanguageList,
                })).then((data) => {
                  if (data.failed) {
                    if (data.code === "data.is.null") {
                      this.setState({
                        isLoading: false,
                      });
                      encodingStore.getCode('mandatoryField.not.filled');
                    } else if (data.code === 'value.new.current.less.start') {
                      encodingStore.getCode('currentValue.morethan.startValue');
                    } else if (data.code === 'coderule.data.is.identical') {
                      encodingStore.getCode('coderule.data.is.identical');
                    }
                  } else {
                    encodingStore.getCode('create.success');
                   // Choerodon.prompt(encodingStore.languages['create.success']);
                    this.props.history.goBack();
                    this.setState({
                      selectedCodeValues: [],
                    });
                  }
                }).catch((error) => {
                  this.setState({
                    isLoading: false,
                  });
                  Choerodon.handleResponseError(error);
                });
              }
            } else {
              this.setState({
                isLoading: true,
              });
              encodingStore.createCodeRules(organizationId, Object.assign({}, {
                ...data,
                codeRuleLineList,
                __tls: this.state.multiLanguageValue,
                language: this.state.multiLanguageList,
              })).then((data) => {
                if (data.failed) {
                  if (data.code === "data.is.null") {
                    this.setState({
                      isLoading: false,
                    });
                    encodingStore.getCode('mandatoryField.not.filled');
                  } else if (data.code === 'value.new.current.less.start') {
                    encodingStore.getCode('currentValue.morethan.startValue');
                  } else if (data.code === 'coderule.data.is.identical') {
                    encodingStore.getCode('coderule.data.is.identical');
                  }
                } else {
                  encodingStore.getCode('create.success');
                  this.props.history.goBack();
                  this.setState({
                    selectedCodeValues: [],
                  });
                }
              }).catch((error) => {
                this.setState({
                  isLoading: false,
                });
                Choerodon.handleResponseError(error);
              });
            }
          } else {
            message.warning(encodingStore.languages[`${intlPrefix}.crate.leastSegmentType`]);
          }
        } else {
          message.warning(encodingStore.languages[`${intlPrefix}.crate.SectionList`]);
        }
      }
    });
  };

  //  渲染表格
  renderTable = () => {
    //  处理列选择事件
    const rowSelection = {
      //  选择记录后，将选中的记录加入selectedCodeValue状态中
      onChange: (selectedRows, selectValue) => {
        this.setState({ selectedCodeValues: selectedRows, deleteValueAll: selectValue });
      },
      selectedRowKeys: this.state.selectedCodeValues,
    };


    //  获取dataSource
    const { codeRuleLineList, pagination, edit } = this.state;
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const sequenceOption = [];
    const sequenceTypes = encodingStore.getSequence;
    sequenceTypes.forEach((values) => {
      sequenceOption.push(<Option key={values.lookupValue} value={values.lookupValue}>{values.lookupMeaning}</Option>);
    });
    //  定义表格列
    const columns = [

      {
        title: encodingStore.languages[`${intlPrefix}.serialNumber`],
        dataIndex: 'fieldSequence',
        key: 'fieldSequence',
        align: 'center',
        filters: [],
        width: 80,
        render: (value, record) => (this.renderTableFieldSequence({ record, value, field: 'fieldSequence',
        })),
      },
      {
        title: encodingStore.languages[`${intlPrefix}.segmentType`],
        dataIndex: 'fieldType',
        key: 'fieldType',
        filters: [],
        align: 'center',
        width: 100,
        render: (value, record) => (
          <Select
            onChange={(value) => {
              record.fieldType = value;
              this.setState({
                fieldType: value,
              });
            }}
            getPopupContainer={triggerNode => triggerNode.parentNode}
            defaultValue={record.fieldType}
            style={{ width: 90 }}
            disabled={edit}
            allowClear
          >
            {sequenceOption}
          </Select>
        ),
      },
      {
        title: encodingStore.languages[`${intlPrefix}.segmentValue`],
        dataIndex: 'fieldValue',
        key: 'fieldValue',
        align: 'center',
        width: 100,
        filters: [],
        render: (value, record) => (this.renderTableInput({ record, value, field: 'fieldValue',
        })),
      },
      {
        title: encodingStore.languages[`${intlPrefix}.dateMask`],
        dataIndex: 'fieldMask',
        align: 'center',
        key: 'fieldMask',
        render: (value, record) => (this.renderTableSelectFieldMask({ record, value })),
      },
      {
        title: encodingStore.languages[`${intlPrefix}.resetFrequency`],
        dataIndex: 'resetFrequency',
        key: 'resetFrequency',
        align: 'center',
        render: (value, record) => (this.renderTableSelectResetFrequency({ record, value })),

      },
      {
        title: encodingStore.languages[`${intlPrefix}.sequenceUpdate`],
        dataIndex: 'stepNumber',
        key: 'stepNumber',
        width: 100,
        align: 'center',
        render: (value, record) => (this.renderTableStepNumber({ record, value, field: 'stepNumber',
        })) },
      {
        title: encodingStore.languages[`${intlPrefix}.numberDigits`],
        dataIndex: 'fieldLength',
        key: 'fieldLength',
        align: 'center',
        render: (value, record) => (this.renderTableInputNumber({ record, value, field: 'fieldLength',
        })) },
      {
        title: encodingStore.languages[`${intlPrefix}.startValue`],
        dataIndex: 'startValue',
        key: 'startValue',
        align: 'center',
        render: (value, record) => (this.renderTableStartValue({ record, value, field: 'startValue',
        })),
      },
      {
        title: encodingStore.languages[`${intlPrefix}.currentValue`],
        dataIndex: 'currentValue',
        key: 'currentValue',
        align: 'center',
        render: (value, record) => (this.renderTableCurrentValue({ record, value, field: 'currentValue',
        })) },
    ];
    return (
      <Table
        columns={columns}
        dataSource={codeRuleLineList}
        rowSelection={edit ? '' : rowSelection}
        pagination={pagination}
        filterBar={false}
        style={{ width: '1050px', marginLeft: '20px' }}
        bordered
      />
    );
  };

  showModal = () => {
    this.setState({
      visible: true,
    });
  }

  handleOk = () => {
    this.props.history.goBack();
  }

  handleCancel = (e) => {
    this.setState({
      visible: false,
    });
  }

  changeDocTypeCode=(value) => {
    if (value === 'ITSM') {
      this.props.form.resetFields('docTypeCode', []);
      this.setState({
        visibleState: 'none',
      });
    } else {
      this.props.form.resetFields('docTypeCode', []);
      this.setState({
        visibleState: '',
      });
    }
  }

  render() {
    const { intl, id } = this.props;
    const { AppState: { menuType: { organizationId, name } }, form } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { edit, codeInfo, visibleState } = this.state;
    const applicationType = encodingStore.getApplicationType;
    const appOption = [];
    const docTypeCode = encodingStore.getDocTypeCode;
    const docOption = [];
    applicationType.forEach((values) => {
      appOption.push(<Option key={values.lookupValue} value={values.lookupValue}>{values.lookupMeaning}</Option>);
    });
    const docTypeCodeFilter = docTypeCode.filter(v => (v.isEnabled === 'Y'));
    docTypeCodeFilter.forEach((item) => {
      docOption.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    return (
      <Page>
        <Header
          title={edit ? encodingStore.languages[`${intlPrefix}.modifyMessageTemplate`]
            : encodingStore.languages[`${intlPrefix}.createMessageTemplate`]}
          backPath={`/iam/encodingRules?type=organization&id=${organizationId}&name=${name}&organizationId=${organizationId}`}
        />
        <Content className="sidebar-content">
          <div className="encoding-content" style={{ width: '1000px', marginTop: '30px', marginLeft: 50 }}>
            <Form layout="vertical">
              <Row>
                <Col span={12}>
                  <FormItem>
                    <span className="formEncoding"><span style={{ color: 'red', textAlign: 'center' }}>*</span>{encodingStore.languages[`${intlPrefix}.applicationSystem`]}:</span>
                    {getFieldDecorator('applicationCode', {
                      rules: [
                        {
                          required: true,
                          message: encodingStore.languages[`${intlPrefix}.applicationCode.require.msg`],
                          style: { marginLeft: 80 },
                        },

                      ],
                      initialValue: codeInfo.applicationCode || '',
                    })(
                      <Select
                        placeholder={encodingStore.languages[`${intlPrefix}.applicationSystems`]}
                        getPopupContainer={triggerNode => triggerNode.parentNode}
                        style={{ width: 300, marginLeft: 25 }}
                        allowClear
                        onChange={this.changeDocTypeCode}
                        disabled={edit}
                      >
                        {appOption}
                      </Select>,
                    )}
                  </FormItem>
                </Col>
                <Col span={12} style={{ display: visibleState }}>
                  <FormItem>
                    <span className="formEncoding"><span style={{ color: 'red', textAlign: 'center' }}>*</span>{encodingStore.languages[`${intlPrefix}.documentType`]}:</span>
                    {getFieldDecorator('docTypeCode', { rules: [
                      {
                        required: visibleState !== 'none',
                        message: encodingStore.languages[`${intlPrefix}.docTypeCode.require.msg`],
                      },
                      {
                        validator: visibleState === 'none' ? '' : this.checkDocTypeCode,
                      },
                    ],
                    initialValue: codeInfo.docTypeCode || '',

                    })(
                      <Select
                        placeholder={encodingStore.languages[`${intlPrefix}.documentTypeses`]}
                        getPopupContainer={triggerNode => triggerNode.parentNode}
                        style={{ width: 300, marginLeft: 25 }}
                        allowClear
                        disabled={edit}
                      >
                        {docOption}
                      </Select>,
                    )}
                  </FormItem>
                </Col>
              </Row>
              <Row>
                <Col span={12}>
                  <FormItem>
                    <span className="formEncoding"><span style={{ color: 'red', textAlign: 'center' }}>*</span>{encodingStore.languages[`${intlPrefix}.ruleCode`]}:</span>
                    {getFieldDecorator('ruleCode', { rules: [
                      {
                        required: true,
                        message: encodingStore.languages[`${intlPrefix}.ruleCode.require.msg`],
                      },
                      {
                        validator: this.checkRuleCode,
                      },
                      {
                        //pattern: /^[A-Z`~!@#$%^&*()_\-+=<>?:"{}|,\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘’，。、]+$/,  暂时注释
                        pattern: /^[A-Z_-]+$/,
                        message: encodingStore.languages[`${intlPrefix}.ruleCode.code.pattern`],
                      },

                    ],
                    initialValue: codeInfo.ruleCode || '',
                    })(
                      <Input
                        style={{ width: 300, marginLeft: 25, height: 20 }}
                        placeholder={encodingStore.languages[`${intlPrefix}.ruleCodes`]}
                        disabled={edit}
                        maxLength={20}
                        autoComplete="off"
                      />,
                    )}
                  </FormItem>
                </Col>
                <Col span={12}>
                  <span className="formEncoding"><span style={{ color: 'red', textAlign: 'center' }}>*</span>{encodingStore.languages[`${intlPrefix}.ruleName`]}:</span>
                  <div className="langIconStyle"><FormItem className="endcodingDesCallBack" style={{ display: 'inline-block', marginLeft: 25 }}>
                    {getFieldDecorator('ruleName', { rules: [
                      {
                        required: true,
                        message: encodingStore.languages[`${intlPrefix}.ruleName.require.msg`],
                      },
                    ],
                    initialValue: codeInfo.ruleName || '',

                    })(
                      <MultiLanguageFormItem
                        placeholder={encodingStore.languages[`${intlPrefix}.ruleNames`]}
                        requestUrl="true"
                        requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.rule_name : {}}
                        handleMultiLanguageValue={({ retObj, retList }) => {
                          // 将多语言的值设置到当前表单
                          this.props.form.setFieldsValue({
                            ruleName: retObj[this.props.AppState.currentLanguage],
                          });
                          this.setState({
                            multiLanguageValue: {
                              ...this.state.multiLanguageValue,
                              rule_name: retObj,
                            },
                            multiLanguageList: retList,
                          });
                        }}
                        maxLength={20}
                        type="FormItem"
                        FormLanguage={this.state.multiLanguageValue}
                        languageEnv={this.state.languageEnv}
                        descriptionObject={encodingStore.languages.multiLanguage}
                        required="true"
                        inputWidth={300}
                        disabled={edit}
                      />,
                    )}
                  </FormItem></div>
                </Col>
              </Row>
              <Row>
                <span style={{ marginLeft: 5 }}>{encodingStore.languages[`${intlPrefix}.descriptions`]}:</span>
                <div className="langIconStyle"><FormItem style={{ display: 'inline-block', marginLeft: '47px' }}>
                  {getFieldDecorator('description', {
                    initialValue: codeInfo.description || '',
                  })(
                    <MultiLanguageFormItem
                      placeholder={encodingStore.languages[`${intlPrefix}.ruleNames`]}
                      requestUrl="true"
                      requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.description : {}}
                      handleMultiLanguageValue={({ retObj, retList }) => {
                        // 将多语言的值设置到当前表单
                        this.props.form.setFieldsValue({
                          description: retObj[this.props.AppState.currentLanguage],
                        });
                        this.setState({
                          multiLanguageValue: {
                            ...this.state.multiLanguageValue,
                            description: retObj,
                          },
                          multiLanguageList: retList,
                        });
                      }}
                      maxLength={30}
                      type="FormItem"
                      FormLanguage={this.state.multiLanguageValue}
                      languageEnv={this.state.languageEnv}
                      descriptionObject={encodingStore.languages.multiLanguage}
                      required="true"
                      inputWidth={425}
                      disabled={edit}
                    />,
                  )}
                </FormItem></div>
              </Row>
            </Form>
          </div>
          <div style={{ marginBottom: 5 }}>
            <span style={{ fontSize: '18px', marginLeft: 45 }}>{encodingStore.languages[`${intlPrefix}.segment.list`]}</span>
            <Button
              icon="playlist_add"
              type="primary"
              onClick={this.handleAddTableRecord}
              style={{ display: edit ? 'none' : '' }}
            >
              {encodingStore.languages[`${intlPrefix}.create`]}
            </Button>
            <Button
              icon="delete_sweep"
              type="danger"
              onClick={this.handleDeleteTableRecords}
              style={{ display: edit ? 'none' : '' }}
            >
              {encodingStore.languages.delete}
            </Button>
          </div>
          {/* 渲染表格结构 */}
          <div>{this.renderTable()}
          </div>
          <div style={{ position: 'relative', bottom: -10, marginLeft: 40 }}>
            <Button type="primary" funcType="raised" style={{ borderRadius: 5, display: edit ? 'none' : '' }} loading={this.state.isLoading} onClick={this.handleSubmit.bind(this)}>{encodingStore.languages.save}</Button>
            <Button type="raised" style={{ marginLeft: 15, borderRadius: 5, display: edit ? 'none' : '' }} onClick={this.showModal}>{encodingStore.languages.cancel}</Button>
          </div>
          <Modal
            title={encodingStore.languages.cancel}
            visible={this.state.visible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            center
          >
            <p>{encodingStore.languages[`${intlPrefix}.confirm.cancellation`]}</p>

          </Modal>
        </Content>
      </Page>
    );
  }
}
export default Form.create({})(withRouter(injectIntl(EncodingEdit)));
