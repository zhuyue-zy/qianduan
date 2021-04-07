/** 2018/11/22
 *作者:高梦龙
 *项目：替换编码规则新建和查看页面
 */
import React, { Component } from 'react';
import { Form, Input, Select, Table, Button, message, InputNumber, Row, Col, Modal, Checkbox } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import {axios, Content, Header, Page} from 'yqcloud-front-boot';
import encodingStore from '../../../../stores/organization/encodingRules/EncodingStore';
import './ReplaceType.scss';
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
      count: 1,
      deleteValueAll: [],
      selectedCodeValues: [],
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
      resetFrequency: 'never',
      naturalNum: false,
      // 存放多语言信息
      multiLanguageValue: {
        description: {},
        ruleName: {},
      },
      multiLanguageList: [],
      workflowChange: false,
      visibleState: '',
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

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    encodingStore.queryLanguage(id, AppState.currentLanguage);
  }





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


  /* 获取系统支持的语言环境 */
  getLanguage = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        }, () => this.setDispalyName());
      });
  };

  // 设定名字
  setDispalyName = () => {
    const { multiLanguageValue, languageEnv, id } = this.state;
    const { description } = multiLanguageValue;
    const { organizationId } = this.props.AppState.currentMenuType;
    languageEnv.forEach((val) => {
      description[val.code] = '';
    });
    this.setState({
      multiLanguageValue,
    }, () => this.getCodeRulesById(organizationId, id));
  }

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


  getCodeRulesById(organizationId, headerId) {
    const { multiLanguageValue } = this.state;
    encodingStore.getCodeRulesId(organizationId, headerId)
      .then((data) => {
        const description = Object.assign({}, multiLanguageValue.description, data.__tls.description);
        const rule_name = Object.assign({}, multiLanguageValue.rule_name, data.__tls.rule_name);
        let valId = 0;
        if (data) {
          if (data.codeRuleLineList) {
            data.codeRuleLineList.map((val) => {
              val.key = valId++;
              val.newDatas = true;
            });
          }
        }
        if (data.applicationCode === 'WF' || data.applicationCode === 'SYSTEM'){
          this.setState({
            visibleState: '',
            workflowChange: true,
            codeInfo: data,
            codeRuleLineList: data.codeRuleLineList || [],
            multiLanguageValue: { description, rule_name },
          });
        } else if (data.applicationCode === 'ITSM') {
          this.setState({
            visibleState: 'none',
            codeInfo: data,
            codeRuleLineList: data.codeRuleLineList || [],
            multiLanguageValue: { description, rule_name },
          });
        } else {
          this.setState({
            codeInfo: data,
            codeRuleLineList: data.codeRuleLineList || [],
            multiLanguageValue: { description, rule_name },
          });
        }

      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  handleAddTableRecord = () => {
    const { form: { validateFields } } = this.props;
    //  若表单必填项未填则不允许新增数据
    if (this.state.tableState !== 'uncompleted') {
      validateFields((err) => {
        if (!err) {
          const { codeRuleLineList } = this.state;
          if (codeRuleLineList.length > 0) {
            const count = codeRuleLineList.slice(-1)[0].fieldSequence;
            //  定义一条新数据，暂时先填充两个字段
            const newData = {
              key: count,
              fieldSequence: count + 1, //  count为了防止报key重复错误
              stepNumber: false,
              newDatas: false,
            };

            this.setState({
              //  将新定义的数据加入到数据集中
              codeRuleLineList: [...codeRuleLineList, newData],
              count: count + 1,
            });
          } else {
            const count = 0;
            //  定义一条新数据，暂时先填充两个字段
            const newData = {
              key: count,
              fieldSequence: count + 1, //  count为了防止报key重复错误
              stepNumber: false,
              newDatas: false,
            };

            this.setState({
              //  将新定义的数据加入到数据集中
              codeRuleLineList: [...codeRuleLineList, newData],
              count: count + 1,

            });
          }
        }
      });
    } else {
      message.error('请输入必填字段');
    }
  };


  /**
   *  处理删除表格行的事件
   */
  handleDeleteTableRecords = () => {
    if (this.state.selectedCodeValues.length > 0) {
      const { intl } = this.props;
      //  若至少选择了一行才弹出窗口
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
        >
          {dataOption}
        </Select>
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
          disabled={false}
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
          disabled
          allowClear
        >
          {dataOption}
        </Select>
      );
    }
  }

  // 渲染重置频率列表
  renderTableSelectResetFrequency = ({ record, value, field }) => {
    const { edit, workflowChange } = this.state;
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
          disabled={record.newDatas ? workflowChange : false}
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
          disabled
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
      return (<div>
        <Input
          type={type || 'text'}
          defaultValue={value}
          onChange={(e) => {
            record[field] = e.target.value;
            callback();
          }}
          disabled={false}
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
      return (<div>
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
      return (<div>
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
      return (<div>
        <Input
          type={type || 'text'}
          defaultValue={value}
          onChange={(e) => {
            record[field] = e.target.value;
            callback();
          }}
          disabled
        />
              </div>
      );
    }
  }

  // 自然数
  renderTableStepNumber = ({ record, value, field, callback = noop }) => {
    const { edit } = this.state;
    if (record.fieldType === 'CONSTANT' || record.fieldType === 'DATE') {
      return (<div>
        <Checkbox
          onChange={() => {
            record[field] = !record[field] ;
            const { naturalNum } = this.state;
            this.setState({
              naturalNum: !naturalNum,
            });
          }
            }
          disabled={edit}
          checked={record[field]}
        />
              </div>
      );
    } else if (record.fieldType === 'SEQUENCE') {
      return (<div>
        <Checkbox
          onChange={() => {
            record[field] = !record[field] ;
            const { naturalNum } = this.state;
            this.setState({
              naturalNum: !naturalNum,
            });
            record.fieldLength = naturalNum ? '' : record.fieldLength;
          }
            }
          disabled={false}
          checked={record[field]}
        />
              </div>
      );
    } else {
      return (<div>
        <Checkbox
          onChange={() => {
            record[field] = !record[field] ;
            const { naturalNum } = this.state;
            this.setState({
              naturalNum: !naturalNum,
            });
          }
            }
          disabled={edit}
          checked={record[field]}
        />
              </div>
      );
    }
  }

  // 渲染数字框列表
  renderTableInputNumber = ({ record, value, field, callback = noop }) => {
    const { edit, codeRuleLineList } = this.state;
    if (record.fieldType === 'CONSTANT' || record.fieldType === 'DATE') {
      return (<div>
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
      return (<div>
        <InputNumber
          value={value}
          min={1}
          onChange={(value) => {
            codeRuleLineList.find(v => v.key === record.key)[field] = value;
            this.setState({ codeRuleLineList });
          }}
          disabled={!!record.stepNumber}
          onBlur={() => {
            if (record[field]) {
              if (!/^\d+$/.test(record[field])) {
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
      return (<div>
        <InputNumber
          defaultValue={value}
          min={1}
          onChange={(value) => {
            record[field] = value;
          }}
          disabled
          onBlur={() => {
            if (record[field]) {
              if (!/^\d+$/.test(record[field])) {
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
    }
  }

  // 渲染开始值列表
  renderTableStartValue = ({ record, value, field, callback = noop }) => {
    const { edit} = this.state;
    if (record.fieldType === 'CONSTANT' || record.fieldType === 'DATE') {
      return (<div>
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
      return (<div>
        <InputNumber
          defaultValue={value}
          min={1}
          onChange={(value) => {
            record[field] = value;
          }}
          disabled={false}
          onBlur={() => {
            if (record.startValue) {
              if (!/^\d+$/.test(record.startValue)) {
                // message.warning(encodingStore.languages[`${intlPrefix}.startValue.cannot.decimals`]);
                encodingStore.getCode('startValue.cannot.decimals');
              } else if (record.startValue >= value) {
                if (record.fieldLength) {
                  const { length } = record.startValue.toString();
                  if (length <= record.fieldLength) {
                    return true;
                  } else {
                    // message.warning(encodingStore.languages[`${intlPrefix}.startValue.lessthan.number`]);
                    encodingStore.getCode('startValue.lessthan.number');
                  }
                }
              } else {
                // message.warning(encodingStore.languages[`${intlPrefix}.modifyStartValue.lessthan.startValue`]);
                encodingStore.getCode('modifyStartValue.lessthan.startValue');
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
      return (<div>
        <InputNumber
          defaultValue={value}
          min={1}
          onChange={(value) => {
            record[field] = value;
          }}
          disabled
          onBlur={() => {
            if (record.startValue) {
              if (!/^\d+$/.test(record.startValue)) {
                // message.warning(encodingStore.languages[`${intlPrefix}.startValue.cannot.decimals`]);
                encodingStore.getCode('startValue.cannot.decimals');
              } else {
                const { length } = record.startValue.toString();
                if (length <= record.fieldLength) {
                  return true;
                } else {
                  // message.warning(encodingStore.languages[`${intlPrefix}.startValue.lessthan.number`]);
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
    }
  }

  // 渲染序号列表
  renderTableFieldSequence = ({ record, value, field, type, callback = noop }) => (<div>
    <InputNumber
      defaultValue={record.fieldSequence}
      min={1}
      onChange={(value) => {
        record[field] = value;
      }}
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
  )

  // 当前值列表
  renderTableCurrentValue = ({ record, value, field, type, callback = noop }) => {
    const { edit, workflowChange } = this.state;
    if (record.fieldType === 'SEQUENCE') {
      return (<div>
        <InputNumber
          defaultValue={value}
          min={1}
          onChange={(value) => {
            record[field] = value;
          }}
          disabled={record.newDatas ? workflowChange : false}
          onBlur={() => {
            if (record.currentValue >= value) {
              if (record.startValue) {
                const startValues = record.startValue;
                if (record.currentValue >= startValues) {
                  return true;
                } else {
                  // message.warning(encodingStore.languages[`${intlPrefix}.currentValue.morethan.startValue`]);
                  encodingStore.getCode('currentValue.morethan.startValue');
                }
              }
            } else {
              // message.warning(encodingStore.languages[`${intlPrefix}.modifyCurrentValue.morethan.currentValue`]);
              // encodingStore.getCode('modifyCurrentValue.morethan.currentValue');
            }
          }
            }
        />
      </div>
      );
    } else {
      return (<div>
        <InputNumber
          defaultValue={value}
          min={1}
          onChange={(value) => {
            record[field] = value;
          }}
          disabled
        />
              </div>
      );
    }
  }

  handleSubmit = (e) => {
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (!err) {
        const { AppState, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        const { codeRuleLineList, codeInfo } = this.state;
        const { headerId } = codeInfo;
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
                // message.warning(encodingStore.languages[`${intlPrefix}.constant.cannot.chinese`]);
                encodingStore.getCode('constant.cannot.chinese');
              } else {
                encodingStore.repalceCodeRules(organizationId, Object.assign({}, {
                  ...data,
                  headerId,
                  codeRuleLineList,
                  __tls: this.state.multiLanguageValue,
                  language: this.state.multiLanguageList,
                })).then((data) => {
                  if (data.failed) {
                    if (data.code === "data.is.null") {
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
                      __tls: this.state.multiLanguageValue,
                      language: this.state.multiLanguageList,
                    });
                  }
                }).catch((error) => {
                  Choerodon.handleResponseError(error);
                });
              }
            } else {
              encodingStore.repalceCodeRules(organizationId, Object.assign({}, {
                ...data,
                headerId,
                codeRuleLineList,
                __tls: this.state.multiLanguageValue,
                language: this.state.multiLanguageList,
              })).then((data) => {
                if (data.failed) {
                  if (data.code === "data.is.null") {
                    encodingStore.getCode('mandatoryField.not.filled');
                  } else if (data.code === 'value.new.current.less.start') {
                    encodingStore.getCode('currentValue.morethan.startValue');
                  } else if (data.code === 'coderule.data.is.identical') {
                    encodingStore.getCode('coderule.data.is.identical');
                  }
                } else {
                  // Choerodon.prompt(encodingStore.languages['create.success']);
                  encodingStore.getCode('create.success');
                  this.props.history.goBack();
                  this.setState({
                    selectedCodeValues: [],
                  });
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            }
          } else {
            // message.warning(encodingStore.languages[`${intlPrefix}.crate.leastSegmentType`]);
            encodingStore.getCode('create.leastSegmentType');
          }
        } else {
          // message.warning(encodingStore.languages[`${intlPrefix}.crate.SectionList`]);
          encodingStore.getCode('create.SectionList');
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
            disabled={record.newDatas ? edit : false}
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
        align: 'center',
        width: 100,
        render: (value, record) => (this.renderTableStepNumber({ record, value, field: 'stepNumber',
        })),
      },
      {
        title: encodingStore.languages[`${intlPrefix}.numberDigits`],
        dataIndex: 'fieldLength',
        key: 'fieldLength',
        align: 'center',
        render: (value, record) => (this.renderTableInputNumber({ record, value, field: 'fieldLength',
        })),
      },
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
        rowSelection={rowSelection}
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

  handleOk = (e) => {
    this.props.history.goBack();
  }

  handleCancel = (e) => {
    this.setState({
      visible: false,
    });
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
    docTypeCode.forEach((item) => {
      docOption.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    return (
      <Page>
        <Header
          title={encodingStore.languages[`${intlPrefix}.replaceEncodingRule`]}
          backPath={`/iam/encodingRules?type=organization&id=${organizationId}&name=${name}&organizationId=${organizationId}`}
        />
        <Content className="sidebar-content replaceEncodingRuleStyle">
          <div style={{ width: '1000px', marginTop: '30px', marginLeft: 50 }}>
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
                      </Select>
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
                        pattern: /^[A-Z`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘’，。、]+$/,
                        message: encodingStore.languages[`${intlPrefix}.ruleCode.code.pattern`],
                      },
                    ],
                    initialValue: codeInfo.ruleCode || '',
                    })(
                      <Input
                        style={{ width: 300, marginLeft: 25 }}
                        placeholder={encodingStore.languages[`${intlPrefix}.ruleCodes`]}
                        disabled={edit}
                        autoComplete="off"
                      />,
                    )}
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem>
                    <span className="formEncoding"><span style={{ color: 'red', textAlign: 'center' }}>*</span>{encodingStore.languages[`${intlPrefix}.ruleName`]}:</span>
                    {getFieldDecorator('ruleName', { rules: [
                      {
                        required: true,
                        message: encodingStore.languages[`${intlPrefix}.ruleName.require.msg`],
                      },
                    ],
                    initialValue: codeInfo.ruleName || '',

                    })(
                      <Input
                        placeholder={encodingStore.languages[`${intlPrefix}.ruleNames`]}
                        style={{ width: 300, marginLeft: 25 }}
                        disabled={edit}
                        autoComplete="off"
                      />,
                    )}
                  </FormItem>
                </Col>
              </Row>
              <Row>
                <span style={{ marginLeft: 5 }}>{encodingStore.languages[`${intlPrefix}.descriptions`]}:</span>
                <div className='langIconstyle'>
                  <FormItem style={{ display: 'inline-block', marginLeft: '47px' }}>
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
                        />,
                      
                      {/*  <Input
                        style={{ width: 425, marginLeft: 53 }}
                        placeholder={encodingStore.languages[`${intlPrefix}.descrip`]}
                        maxLength={30}
                        autoComplete="off"*/}
                    )}
                  </FormItem>
                </div>
              </Row>
            </Form>
          </div>
          <div style={{ marginBottom: 5 }}>
            <span style={{ fontSize: '18px', marginLeft: 45 }}>{encodingStore.languages[`${intlPrefix}.segment.list`]}</span>
            <Button
              icon="playlist_add"
              type="primary"
              onClick={this.handleAddTableRecord}
            >
              {encodingStore.languages[`${intlPrefix}.create`]}
            </Button>
            <Button
              icon="delete_sweep"
              type="danger"
              onClick={this.handleDeleteTableRecords}
            >
              {encodingStore.languages.delete}
            </Button>
          </div>
          {/* 渲染表格结构 */}
          <div>{this.renderTable()}
          </div>
          <div style={{ position: 'relative', bottom: -10, marginLeft: 40 }}>
            <Button type="primary" funcType="raised" style={{ borderRadius: 5 }} onClick={this.handleSubmit.bind(this)}>保存</Button>
            <Button type="raised" style={{ marginLeft: 15, borderRadius: 5 }} onClick={this.showModal}>取消</Button>
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
