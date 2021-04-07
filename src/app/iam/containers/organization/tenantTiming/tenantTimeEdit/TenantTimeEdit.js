/** 2019/8/8
*作者:高梦龙
*名称：定时任务编辑
*/

import React from 'react';
import { Form, Input, Select, Table, Button, Tooltip, Tabs, message, Row, Col, Switch, Icon, DatePicker, Radio } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Page, Header, axios } from 'yqcloud-front-boot';
import tenantTimeStore from "../../../../stores/organization/tenantTimeTask/TeantTimeStore";
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';
const { Item: FormItem } = Form;
const { Option } = Select;
const { TextArea } = Input;
const intlPrefix = 'organization.TenantTime';
const RadioGroup = Radio.Group;
const { TabPane } = Tabs;
import moment from 'moment';

@inject('AppState')
@observer
class TenantTimeEdit extends React.Component{
  state = this.getInitState();
  getInitState() {
    return{
      isLoading: true,
      edit: !!this.props.match.params.id, // 页面是否是编辑状态
      id: this.props.match.params.id,
      // 存放多语言信息
      multiLanguageValue: {
        task_name: {},
        description: {},
      },
      multiLanguageList: [],
      showExpress: 'SIMPLE',
      forwardStartDate: null,
      forwardEndDate: null,
      allDate: {},
      endOpen: false,
      taskList: [],
      taskParams: [],
      tenantInfo: {},
      repeatChecked: false,
      tabValue: '1',
      loading: false,
    }
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
    this.getLanguage();
    this.getTaskList();
  }

  componentDidMount = () => {
    const { AppState } = this.props;
    const { id } = this.state;
    const { organizationId } = AppState.currentMenuType;
    if (id){
      this.getTenantContent(organizationId, id);
    }
  }

  fetch() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    tenantTimeStore.getTimeTasks(organizationId);
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
    const { AppState } = this.props;
    const { id } = this.state;
    const { organizationId } = AppState.currentMenuType;
    const { multiLanguageValue, languageEnv } = this.state;
    const { task_name, description } = multiLanguageValue;
    languageEnv.forEach((val) => {
      task_name[val.code] = '';
      description[val.code] = '';
    });
    this.setState({
      multiLanguageValue,
    }, () => this.getTenantContent(organizationId, id));
  }

  getTenantContent=(organizationId, id) => {
    const { multiLanguageValue } =this.state;
    tenantTimeStore.getTenantEdit(organizationId, id).then((data) => {
      const task_name = Object.assign({}, multiLanguageValue.task_name, data.__tls.task_name);
      const description = Object.assign({}, multiLanguageValue.description, data.__tls.description);
      this.setState({
        tenantInfo: data,
        repeatChecked: data.repeat,
        showExpress: data.triggerType,
        taskParams: data.taskParams,
        multiLanguageValue: { task_name, description },
      })
    })
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    tenantTimeStore.queryLanguage(id, AppState.currentLanguage);
  };

  /*
  不可选的开始时间
  */
  disabledStartDate = forwardStartDate => forwardStartDate < moment().date(moment().date() - 1)



  /*
   不可选的截止时间
   */

  disabledEndDate = (forwardEndDate) => {
    const { forwardStartDate } = this.state;
    if (!forwardEndDate || !forwardStartDate) {
      return false;
    }
    return forwardEndDate.valueOf() <= forwardStartDate.valueOf();
  }


  onChange = (field, value) => {
    this.setState({
      [field]: value,
    });
  }


  onStartChange = (value) => {
    this.onChange('forwardStartDate', value);
    this.setState({
      forwardStartDate: value,
    });
  }

  onEndChange = (value, callback) => {
    this.onChange('forwardEndDate', value);
    const { intl } = this.props;
    const { forwardStartDate, allDate } = this.state;
    const forwardStart = moment(forwardStartDate).format(' YYYY-MM-DD HH:mm:ss ');
    const forwardEndDate = moment(value).format('YYYY-MM-DD HH:mm:ss');
    if (moment(forwardStart).isAfter(forwardEndDate)) {
      callback();
    }
    if (allDate.forwardStartDate) {
      const forwardStart1 = moment(allDate.forwardStartDate).format(' YYYY-MM-DD HH:mm:ss ');
      const forwardEndDate2 = moment(value).format('YYYY-MM-DD HH:mm:ss');
      if (moment(forwardStart1).isAfter(forwardEndDate2)) {
        message.error(automaticTransferStore.languages[`${intlPrefix}.error.tishi`], 3);
      }
    }
  }

  handleEndOpenChange = (open) => {
    this.setState({ endOpen: open });
  }

  handleStartOpenChange = (open) => {
    if (!open) {
      this.setState({ endOpen: true });
    }
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
  getTaskList=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    tenantTimeStore.queryTaskList(organizationId).then((data) => {
      this.setState({
        taskList: data,
      })
    })
  }

  // 选择任务列表显示内容
  onChangeList=(value) => {
    const { taskList, edit, tenantInfo } =this.state;
    if (edit){
      if (tenantInfo.taskSiteId === value){
        this.setState({
          taskParams: tenantInfo.taskParams
        })
      } else {
        const array = taskList.filter((v) => v.taskSiteId === value)
        this.setState({
          taskParams : array[0].taskParamSites,
        });
      }
    } else {
      const array = taskList.filter((v) => v.taskSiteId === value)
      this.setState({
        taskParams : array[0].taskParamSites,
      });
    }
  }

  handleSubmit=(e) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { edit, repeatChecked, taskParams, tabValue, tenantInfo } =this.state;
    e.preventDefault();
     this.props.form.validateFieldsAndScroll((err, data) => {
        if (!err) {
          this.setState({
            loading: true,
          });
         if (edit){
           let startTime = data.startTime || '';
           if (startTime) {
             startTime = startTime.format('YYYY-MM-DD HH:mm:ss');
           }
           let endTime = data.endTime || '';
           if (endTime) {
             endTime = endTime.format('YYYY-MM-DD HH:mm:ss');
           }
        const body = {
          description: data.description,
          taskName: data.taskName,
          startTime: startTime,
          endTime: endTime,
          triggerType: data.triggerType,
          repeat: data.repeat,
          repeatInterval: data.repeatInterval,
          repeatUnit: data.repeatUnit,
          repeatCount: data.repeatCount,
          cronExpression: tabValue === '1' ? data.cronExpression : `${data.second} ${data.minute} ${data.hour} ${data.day} ${data.month} ${data.week} ${data.year}`,
          taskId: tenantInfo.taskId,
          objectVersionNumber: tenantInfo.objectVersionNumber,
          taskSiteId: tenantInfo. taskSiteId,
          taskGroup: tenantInfo.taskGroup,
          requestBody: tenantInfo.requestBody,
          triggerState: tenantInfo.triggerState,
          priority: tenantInfo.priority,
          enabled: tenantInfo.enabled,
        }
           if (repeatChecked){
               tenantTimeStore.updateTask(organizationId, Object.assign({}, body,
                 {
                   __tls: this.state.multiLanguageValue,
                   language: this.state.multiLanguageList,
                   taskParams:taskParams,
                 })).then((data) => {
                 if (data) {
                   this.setState({
                     loading: false,
                   });
                   Choerodon.prompt(tenantTimeStore.languages['save.success']);
                   this.props.history.goBack();
                 } else {
                   Choerodon.prompt(tenantTimeStore.languages['save.error']);
                 }
               });
           } else {
             tenantTimeStore.updateTask(organizationId, Object.assign({}, body,
               {
                 __tls: this.state.multiLanguageValue,
                 language: this.state.multiLanguageList,
                 taskParams:taskParams,
               })).then((data) => {
               if (data) {
                 this.setState({
                   loading: false,
                 });
                 Choerodon.prompt(tenantTimeStore.languages['save.success']);
                 this.props.history.goBack();
               } else {
                 Choerodon.prompt(tenantTimeStore.languages['save.error']);
               }
             });
           }
          } else {
           if (repeatChecked){
             let startTime = data.startTime || '';
             if (startTime) {
               startTime = startTime.format('YYYY-MM-DD HH:mm:ss');
             }
             let endTime = data.endTime || '';
             if (endTime) {
               endTime = endTime.format('YYYY-MM-DD HH:mm:ss');
             }
             tenantTimeStore.commitTask(organizationId, Object.assign({}, data,
               {
                 cronExpression: tabValue === '1' ? data.cronExpression :`${data.second} ${data.minute} ${data.hour} ${data.day} ${data.month} ${data.week} ${data.year}`,
                 __tls: this.state.multiLanguageValue,
                 language: this.state.multiLanguageList,
                 taskParams: taskParams,
                 startTime,
                 endTime
               })).then((data) => {
               if (data) {
                 this.setState({
                   loading: false,
                 });
                 Choerodon.prompt(tenantTimeStore.languages['save.success']);
                 this.props.history.goBack();
               } else {
                 Choerodon.prompt(tenantTimeStore.languages['save.error']);
               }
             });
           } else {
             tenantTimeStore.commitTask(organizationId, Object.assign({}, data,
               {
                 cronExpression: tabValue === '1' ? data.cronExpression :`${data.second} ${data.minute} ${data.hour} ${data.day} ${data.month} ${data.week} ${data.year}`,
                 __tls: this.state.multiLanguageValue,
                 language: this.state.multiLanguageList,
                 taskParams: taskParams,
               })).then((data) => {
               if (data) {
                 this.setState({
                   loading: false,
                 });
                 Choerodon.prompt(tenantTimeStore.languages['save.success']);
                 this.props.history.goBack();
               } else {
                 Choerodon.prompt(tenantTimeStore.languages['save.error']);
               }
             });
           }
         }
        }
      })
  }


  // 对表格进行渲染
  renderTestTableCell = (record, value, field) => {
    const { getFieldDecorator } = this.props.form;
     return (
          <FormItem style={{ marginBottom: 0}} >
            {getFieldDecorator(`${record.paramSiteId}`, {
              initialValue: value,
            })(
              <Input
                defaultValue={value}
                onChange={(e) => {
                  record[field] = e.target.value;
                }}
                autoComplete='off'
              />
            )}
          </FormItem>
        );
  };

  // 判断是否必填
  isRepeat=(checked) => {
    this.props.form.validateFields((error, values) => {
      if (checked) {
        this.setState({
          repeatChecked: true,
        });

      } else {
        this.setState({
          repeatChecked: false,
        });
        this.props.form.setFields({
          repeatInterval: {
            value: values.repeatInterval,
          },
        });
        this.props.form.setFields({
          repeatUnit: {
            value: values.repeatUnit,
          },
        });
        this.props.form.setFields({
          repeatCount: {
            value: values.repeatCount,
          },
        });
      }
    });

  }
  // 切换tab页
  tabChange=(key) => {
    if (key === '1') {
      this.setState({
        tabValue: '1',
      });
    } else {
      this.setState({
        tabValue: '2',
      });
    }
  }

  changeInterval=(e) => {
    if (e.target.value) {
      this.props.form.setFields({
        repeatInterval: {
          value: e.target.value,
        },
      });
    }
  }
  changeUnit=(value) => {
    if (value) {
      this.props.form.setFields({
        repeatUnit: {
          value: value,
        },
      });
    }
  }

  changeCount=(e) => {
    if (e.target.value) {
      this.props.form.setFields({
        repeatCount: {
          value: e.target.value,
        },
      });
    }
  }

  render(){
    const { AppState: { menuType: { organizationId, name } }, form } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { taskParams, showExpress, endOpen, taskList, tenantInfo,repeatChecked, edit, loading } =this.state;
    const tenantTime =tenantTimeStore.getTaskTime;
    const lanOption = [];
    tenantTime.forEach((item) => {
      lanOption.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });

    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '150px',
      wordBreak: 'normal',
    };
    const columns =[   {
      title: tenantTimeStore.languages[`${intlPrefix}.paramName`],
      dataIndex: 'paramName',
      key: 'paramName',
    }, {
      title: tenantTimeStore.languages[`${intlPrefix}.paramDescription`],
      dataIndex: 'description',
      key: 'description',
      render: (text, record) => ((
        <span style={tableStyleName}>
            <Tooltip title={text} lines={20}>
              {text}
            </Tooltip>
          </span>
      )),
    }, {
      title: tenantTimeStore.languages[`${intlPrefix}.paramTypeCode`],
      dataIndex: 'paramTypeCode',
      key: 'paramTypeCode',
    }, {
      title: tenantTimeStore.languages[`${intlPrefix}.value`],
      dataIndex: 'value',
      key: 'value',
      render: (value, record) => this.renderTestTableCell(record, value, 'value'),

    }]
    const taskArray = [];
    taskList.forEach((item) => {
      taskArray.push(<Option value={item.taskSiteId}>{item.taskName}</Option>)
    })

    return(
      <Page>
        <Header title={edit ? tenantTimeStore.languages[`${intlPrefix}.header.modify`] : tenantTimeStore.languages[`${intlPrefix}.header.create`]}
                backPath={`/iam/tenantTime?type=organization&id=${organizationId}&name=${name}&organizationId=${organizationId}`}

        />
        <Content >
          <Form layout="vertical">
          <div style={{ width: 1000 }}>
            <div style={{ marginBottom: 30 }}>
            <span style={{ fontSize: '15px', fontFamily: 'PingFangSC-Medium', color: '#04173F', paddingLeft: '7px', borderLeft: '2px solid #2196F3 ' }}>
             {tenantTimeStore.languages[`${intlPrefix}.basicInfo`]}
            </span>
            </div>
              <Row>
                <Col span={2}>
                  <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                    {tenantTimeStore.languages[`${intlPrefix}.taskName`]}
                    <span style={{ color: 'red', verticalAlign: 'middle' }}>*</span></span>
                </Col>
                <Col>
                  <FormItem>
                    {getFieldDecorator('taskName', {
                  rules: [
                    {
                      required: true,
                      message: tenantTimeStore.languages[`${intlPrefix}.taskName.require.msg`],
                    }],
                  initialValue: '' || tenantInfo.taskName,
                })(
                  <MultiLanguageFormItem
                    placeholder={tenantTimeStore.languages[`${intlPrefix}.taskName.require.msg`]}
                    requestUrl="true"
                    requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.task_name : {}}
                    handleMultiLanguageValue={({ retObj, retList }) => {
                      // 将多语言的值设置到当前表单
                      this.props.form.setFieldsValue({
                        taskName: retObj[this.props.AppState.currentLanguage],
                      });
                      this.setState({
                        multiLanguageValue: {
                          ...this.state.multiLanguageValue,
                          task_name: retObj,
                        },
                        multiLanguageList: retList,
                      });
                    }}
                    maxLength={30}
                    type="FormItem"
                    FormLanguage={this.state.multiLanguageValue}
                    languageEnv={this.state.languageEnv}
                    descriptionObject={tenantTimeStore.languages.multiLanguage}
                    required="true"
                    inputWidth={350}
                  />
                )}
              </FormItem>
                </Col>
              </Row>
              <Row>
                <Col span={2}>
              <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>

                {tenantTimeStore.languages[`${intlPrefix}.description`]}

              </span>
                </Col>
                <Col>
                  <FormItem>
                {getFieldDecorator('description', {
                  initialValue: '' || tenantInfo.description ,
                })(
                  <MultiLanguageFormItem
                    placeholder={tenantTimeStore.languages[`${intlPrefix}.description.content`]}
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
                    maxLength={50}
                    type="FormItem"
                    FormLanguage={this.state.multiLanguageValue}
                    languageEnv={this.state.languageEnv}
                    descriptionObject={tenantTimeStore.languages.multiLanguage}
                    required="true"
                    inputWidth={490}
                  />
                )}
              </FormItem>
                </Col>
              </Row>
                <Row>
                  <Col span={7}>
                    <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                      {tenantTimeStore.languages[`${intlPrefix}.startTime`]}<span style={{ color: 'red', verticalAlign: 'middle' }}>*</span>
                    </span>
                    <FormItem style={{ display: 'inline-block', marginLeft: 30 }}>
                      {getFieldDecorator('startTime', {
                        rules: [{
                          required: true,
                          message: tenantTimeStore.languages[`${intlPrefix}.require.startTime`],

                        }],
                        initialValue: tenantInfo.startTime ? moment(tenantInfo.startTime, 'YYYY-MM-DD HH:mm:ss') : '' ,
                      })(
                        <DatePicker
                          style={{ width: 200 }}
                          disabledDate={this.disabledStartDate}
                          showTime
                          format="YYYY-MM-DD HH:mm:ss"
                          placeholder={tenantTimeStore.languages[ `${intlPrefix}.startTime`]}
                          onChange={this.onStartChange}
                          onOpenChange={this.handleStartOpenChange}
                        />,
                      )}
                    </FormItem>
                  </Col>
                  <Col span={8} style={{ marginLeft: 20 }}>
                    <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Medium' }}>
                      {tenantTimeStore.languages[`${intlPrefix}.endTime`]}
                      </span>
                    <FormItem style={{ display: 'inline-block', marginLeft: 10 }}>
                      {getFieldDecorator('endTime', {

                        initialValue: tenantInfo.endTime ? moment(tenantInfo.endTime, 'YYYY-MM-DD HH:mm:ss') : '' ,
                      })(
                        <DatePicker
                          style={{ width: 200 }}
                          disabledDate={this.disabledEndDate}
                          showTime
                          format="YYYY-MM-DD HH:mm:ss"
                          onChange={this.onEndChange}
                          placeholder={tenantTimeStore.languages[ `${intlPrefix}.endTime`]}
                          open={endOpen}
                          onOpenChange={this.handleEndOpenChange}
                        />,
                      )}
                    </FormItem>
                  </Col>
                </Row>

          </div>
          <div>
            <div style={{ marginBottom: 30 }}>
            <span style={{ fontSize: '15px', fontFamily: 'PingFangSC-Medium', color: '#04173F', paddingLeft: '7px', borderLeft: '2px solid #2196F3 ' }}>
              {tenantTimeStore.languages[`${intlPrefix}.triggerType`]}
            </span>
            </div>
            <FormItem>
              {getFieldDecorator('triggerType', {
                initialValue: tenantInfo.triggerType || 'SIMPLE'  ,
              })((
                <RadioGroup
                  onChange={(e) => {
                    this.setState({ showExpress: e.target.value });
                  }}
                >
                  <Radio value="SIMPLE" style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Regular' }}>
                    {tenantTimeStore.languages[`${intlPrefix}.simpleTask`]}
                  </Radio>
                  <Radio value="CRON" style={{ marginLeft: 40, color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Regular' }}>
                    {tenantTimeStore.languages[`${intlPrefix}.CronTask`]}
                  </Radio>
                </RadioGroup>
              ))}
            </FormItem>
            <div style={{ display: showExpress === 'SIMPLE' ? 'block' : 'none' }}>
              <FormItem>
              <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Regular',marginRight: 10 }}>
                      {tenantTimeStore.languages[`${intlPrefix}.isRepeat`]}
                      </span>
                {getFieldDecorator('repeat', {
                  initialValue: tenantInfo.repeat || false,
                })(
                  <Switch defaultChecked={false}
                          checked={repeatChecked}
                          onChange={this.isRepeat}
                  />
                )}
              </FormItem>
              {repeatChecked ? (      <Row style={{ width: 1000 }}>
                <Col span={4}>
                    <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Regular',marginRight: 10 }}>
                      {tenantTimeStore.languages[`${intlPrefix}.repeatInterval`]}
                      <span style={{ color: 'red', verticalAlign: 'middle' }}>*</span>
                      </span>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('repeatInterval', {
                      rules: [{
                          required: true,
                          message: tenantTimeStore.languages[`${intlPrefix}.fill.repeatInterval`],

                        }],
                      initialValue: ''|| tenantInfo.repeatInterval ,
                    })(
                      <Input
                        type="number"
                        min={0}
                        style={{ width: 80 }}
                        placeholder={tenantTimeStore.languages[`${intlPrefix}.inputNumber`]}
                        autoComplete="off"
                        onChange={this.changeInterval}
                      />,
                    )}
                  </FormItem>
                </Col>
                <Col span={6}>
                  <FormItem>
                    {getFieldDecorator('repeatUnit', {
                      rules: [{
                        required: true,
                        message: tenantTimeStore.languages[`${intlPrefix}.fill.repeatUnit`],

                      }],
                      initialValue:  '' || tenantInfo.repeatUnit,
                    })(
                      <Select
                        style={{ width: 80 }}
                        getPopupContainer={triggerNode => triggerNode.parentNode}
                        onChange={this.changeUnit}
                      >
                        {lanOption}
                      </Select>
                    )}
                  </FormItem>
                </Col>
              </Row>) : (<Row style={{ width: 1000 }}>
                <Col span={4}>
                    <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Regular',marginRight: 10 }}>
                      {tenantTimeStore.languages[`${intlPrefix}.repeatInterval`]}
                      </span>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('repeatInterval', {
                      initialValue: ''|| tenantInfo.repeatInterval ,
                    })(
                      <Input
                        type="number"
                        min={0}
                        style={{ width: 80 }}
                        placeholder={tenantTimeStore.languages[`${intlPrefix}.inputNumber`]}
                        autoComplete="off"
                        onChange={this.changeInterval}
                      />,
                    )}
                  </FormItem>
                </Col>
                <Col span={6}>
                  <FormItem>
                    {getFieldDecorator('repeatUnit', {
                      initialValue:  '' || tenantInfo.repeatUnit,
                    })(
                      <Select
                        style={{ width: 80 }}
                        getPopupContainer={triggerNode => triggerNode.parentNode}
                        onChange={this.changeUnit}
                      >
                        {lanOption}
                      </Select>
                    )}
                  </FormItem>
                </Col>
              </Row>)}
              {repeatChecked ? (  <Row style={{ width: 1000 }}>
                <Col span={8}>
                   <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Regular',marginRight: 10 }}>
                       {tenantTimeStore.languages[`${intlPrefix}.repeatCount`]}
                     <span style={{ color: 'red', verticalAlign: 'middle' }}>*</span>
                      </span>
                  <FormItem style={{ display: 'inline-block'}}>
                    {getFieldDecorator('repeatCount', {
                      rules: [{
                        required: true,
                        message: tenantTimeStore.languages[`${intlPrefix}.fill.repeatCount`],

                      }],
                      initialValue:  '' || tenantInfo.repeatCount,
                    })
                    (
                      <Input
                        type="number"
                        min={0}
                        style={{ width: 80 }}
                        placeholder={tenantTimeStore.languages[`${intlPrefix}.inputCount`]}
                        autoComplete="off"
                        onChange={this.changeCount}
                      />,
                    ) }
                  </FormItem>
                </Col>
              </Row>) : ( <Row style={{ width: 1000 }}>
                <Col span={8}>
                   <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Regular',marginRight: 10 }}>
                       {tenantTimeStore.languages[`${intlPrefix}.repeatCount`]}
                      </span>
                  <FormItem style={{ display: 'inline-block'}}>
                    {getFieldDecorator('repeatCount', {
                      initialValue:  '' || tenantInfo.repeatCount,
                    })
                    (
                      <Input
                        type="number"
                        min={0}
                        style={{ width: 80 }}
                        placeholder={tenantTimeStore.languages[`${intlPrefix}.inputCount`]}
                        autoComplete="off"
                        onChange={this.changeCount}
                      />,
                    ) }
                  </FormItem>
                </Col>
              </Row>)}

                  <div style={{ width: 443, paddingTop: 10,paddingBottom: 10, border: '1px solid #91CEFF', background: '#E6F4FF', display: 'flex', borderRadius: '4px'}}>
                    <Icon style={{flex: 0.01, color:'#2196f3',fontSize:18,marginTop:2, marginLeft: 10}} type='info'/><span style={{flex: 1,fontSize:12,color:"#818999",marginLeft:5}}>
                    {tenantTimeStore.languages[`${intlPrefix}.notes`]}
                    </span>
                  </div>
            </div>
            <div style={{ display: showExpress === 'SIMPLE' ? 'none' : 'block', width: 1000  }}>
              <Tabs defaultActiveKey="1" onChange={this.tabChange}>
                <TabPane
                  tab={tenantTimeStore.languages[`${intlPrefix}.inputExpression`]}
                  key="1"
                >
                   <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Regular',marginRight: 10 }}>
                      {tenantTimeStore.languages[`${intlPrefix}.cronExpression`]}
                     <span style={{ color: 'red', verticalAlign: 'middle' }}>*</span>
                      </span>
                  {showExpress === 'CRON' ? <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('cronExpression', {
                      rules: [
                        {
                          required: showExpress === 'CRON' ? true : false ,
                          message: tenantTimeStore.languages[`${intlPrefix}.input.cronExpression`], //  若未填报出的警告
                        },
                      ],
                      initialValue: '' || tenantInfo.cronExpression,
                    })(
                      <Input
                        style={{ width: 200}}
                        placeholder={tenantTimeStore.languages[`${intlPrefix}.inputExpression`]}
                        autoComplete="off"
                      />,
                    )}
                  </FormItem> : <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('cronExpression', {
                      initialValue: '' || tenantInfo.cronExpression,
                    })(
                      <Input
                        style={{ width: 200}}
                        placeholder={tenantTimeStore.languages[`${intlPrefix}.inputExpression`]}
                        autoComplete="off"
                      />,
                    )}
                  </FormItem> }
                  <div style={{ marginBottom: 10 }}>
                      <span  style={{ color: '#04173F', width: 500, fontSize: 14}}>
                        {tenantTimeStore.languages[`${intlPrefix}.cronExpression.example`]}
                      </span>
                  </div>
                    <div style={{ background: '#F5F7FA', width: 500, padding: 10 }}>
                    <p>*/5 * * * * ?   {tenantTimeStore.languages[`${intlPrefix}.execute.five.seconds`]}</p>
                    <p>0 */1 * * * ?   {tenantTimeStore.languages[`${intlPrefix}.execute.one.minute`]}</p>
                    <p>0 0 5-15 * * ?  {tenantTimeStore.languages[`${intlPrefix}.five.everyDay.trigger`]}</p>
                    <p>0 0/3 * * * ?   {tenantTimeStore.languages[`${intlPrefix}.every.three.minutes`]}</p>
                    <p>0 0-5 14 * * ?  {tenantTimeStore.languages[`${intlPrefix}.every.one.minute`]}</p>
                    <p>0 0/5 14 * * ?  {tenantTimeStore.languages[`${intlPrefix}.every.five.minutes`]}</p>
                    <p>0 0/5 14,18 * * ?  {tenantTimeStore.languages[`${intlPrefix}.every.six.minutes`]}</p>
                    <p>0 0/30 9-17 * * ?  {tenantTimeStore.languages[`${intlPrefix}.every.half.hour`]}</p>
                    <p>0 0 10,14,16 * * ?  {tenantTimeStore.languages[`${intlPrefix}.every.ten.minutes`]}</p>
                  </div>

                </TabPane>
                <TabPane
                  tab={tenantTimeStore.languages[`${intlPrefix}.segmentation.expression`]}
                  key="2"
                >
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('second', {
                      initialValue: tenantInfo.cronExpression ? tenantInfo.cronExpression.split(' ')[0] : '*',
                    })(
                      <Input
                        style={{ width: 80 }}
                        label={tenantTimeStore.languages[`${intlPrefix}.editor.popover.second`]}
                      />,
                    )}

                  </FormItem>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('minute', {
                      rules: [
                        {

                          message: tenantTimeStore.languages[`${intlPrefix}.editor.warning.cronExpression`], //  若未填报出的警告
                        },
                      ],
                      initialValue: tenantInfo.cronExpression ? tenantInfo.cronExpression.split(' ')[1] : '*',
                    })(
                      <Input
                        style={{ width: 80 }}
                        label={tenantTimeStore.languages[`${intlPrefix}.editor.popover.minute`]}
                      />,
                    )}
                  </FormItem>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('hour', {
                      rules: [
                        {

                          message: tenantTimeStore.languages[`${intlPrefix}.editor.warning.cronExpression`], //  若未填报出的警告
                        },
                      ],
                      initialValue: tenantInfo.cronExpression ? tenantInfo.cronExpression.split(' ')[2] : '*',
                    })(
                      <Input
                        style={{ width: 80 }}
                        label={tenantTimeStore.languages[`${intlPrefix}.editor.popover.hour`]}
                      />,
                    )}
                  </FormItem>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('day', {
                      rules: [
                        {
                          message: tenantTimeStore.languages[`${intlPrefix}.editor.warning.cronExpression`], //  若未填报出的警告
                        },
                      ],
                      initialValue: tenantInfo.cronExpression ? tenantInfo.cronExpression.split(' ')[3] : '*',
                    })(
                      <Input
                        style={{ width: 80 }}
                        label={tenantTimeStore.languages[`${intlPrefix}.editor.popover.day`]}
                      />,
                    )}
                  </FormItem>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('month', {
                      rules: [
                        {

                          message: tenantTimeStore.languages[`${intlPrefix}.editor.warning.cronExpression`], //  若未填报出的警告
                        },
                      ],
                      initialValue: tenantInfo.cronExpression ? tenantInfo.cronExpression.split(' ')[4] : '*',
                    })(
                      <Input
                        style={{ width: 80 }}
                        label={tenantTimeStore.languages[`${intlPrefix}.editor.popover.month`]}
                      />,
                    )}
                  </FormItem>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('week', {
                      rules: [
                        {
                          pattern: /[^*\x22]+/,
                          message: tenantTimeStore.languages[`${intlPrefix}.editor.warning.weekCheck`],
                        },
                      ],
                      initialValue: tenantInfo.cronExpression ? tenantInfo.cronExpression.split(' ')[5] : '?',
                    })(
                      <Input
                        style={{ width: 80 }}
                        label={tenantTimeStore.languages[`${intlPrefix}.editor.popover.week`]}
                      />,
                    )}
                  </FormItem>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('year', {
                      rules: [
                        {

                          message: tenantTimeStore.languages[`${intlPrefix}.editor.warning.cronExpression`], //  若未填报出的警告
                        },
                      ],
                      initialValue:  tenantInfo.cronExpression ? tenantInfo.cronExpression.split(' ')[6] : '*',
                    })(
                      <Input
                        style={{ width: 80 }}
                        label={tenantTimeStore.languages[`${intlPrefix}.editor.popover.year`]}
                      />,
                    )}
                  </FormItem>
                </TabPane>
              </Tabs>
            </div>
          </div>
            <div>
              <div style={{ marginBottom: 30, marginTop: 30 }}>
            <span style={{ fontSize: '15px', fontFamily: 'PingFangSC-Medium', color: '#04173F', paddingLeft: '7px', borderLeft: '2px solid #2196F3 ' }}>
              {tenantTimeStore.languages[`${intlPrefix}.executionTask`]}
            </span>
              </div>
                <Row>
                  <Col>
                      <span style={{ color: '#3C4D73', fontSize: 12, fontFamily: 'PingFangSC-Regular',marginRight: 10 }}>
                      {tenantTimeStore.languages[`${intlPrefix}.executionName`]}<span style={{ color: 'red', verticalAlign: 'middle' }}>*</span>
                      </span>
                  <FormItem style={{ display: 'inline-block' }}>
                    {getFieldDecorator('taskSiteId', {
                      rules: [
                        {
                          required: true,
                          message: tenantTimeStore.languages[`${intlPrefix}.executionName.require.msg`],
                        }],
                      initialValue: '' || tenantInfo.taskSiteId,
                    })(
                      <Select
                        style={{ width: 150 }}
                        getPopupContainer={triggerNode => triggerNode.parentNode}
                        onChange={this.onChangeList}
                      >
                        {taskArray}
                      </Select>
                    )}
                  </FormItem>
                  </Col>
                </Row>
               <Table
                 columns={columns}
                 dataSource={taskParams}
                 filterBar={false}
                 style={{ width: '750px' }}
                 pagination={false}
               />
            </div>
            <div style={{ marginTop: 30}}>
              <Button
                htmlType="submit"
                funcType="raised"
                type="primary"
                onClick={this.handleSubmit}
                loading={loading}
              >
                {tenantTimeStore.languages.save}
              </Button>
              <Button
                funcType="raised"
                style={{ marginLeft: 16 }}
                onClick={() => {
                  this.props.history.goBack();
                }}
              >
                {tenantTimeStore.languages.cancel}
              </Button>
            </div>
          </Form>
        </Content>
      </Page>
    )
  }

}
export default Form.create({})(withRouter(injectIntl(TenantTimeEdit)));

