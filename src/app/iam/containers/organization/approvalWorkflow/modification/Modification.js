/**
 * Created by Nanjiangqi on 2018-10-16 0016.
 */
import React, { Component } from 'react';
import {
  Form, Input, Button, Select, Col, Mention, Progress, Switch, Tabs, Modal, Icon, message, Timeline,
} from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page } from 'yqcloud-front-boot';
import './index.scss';
import WorkflowStore from '../../../../stores/organization/approvalWorkflow';
import LOV from '../../../../components/lov';
import LOVInput from '../../../../components/lov/LOVInput';


const FormItem = Form.Item;
const { Option } = Select;
const { Sidebar } = Modal;
const { Search } = Input;
const intlPrefixs = 'approval.workflow';
const intlPrefix = 'organization.management';

const inputWidth = 190;

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
const { hash } = window.location;
const code = getSearchString('code', hash);

function getSearchString(key, Url) {
  let str = Url;
  str = str.substring(1, str.length); // 获取URL中?之后的字符（去掉第一位的问号）
  // 以&分隔字符串，获得类似name=xiaoli这样的元素数组
  const arr = str.split('&');
  const obj = new Object();

  // 将每一个数组元素以=分隔并赋给obj对象
  for (let i = 0; i < arr.length; i++) {
    const tmp_arr = arr[i].split('=');
    obj[decodeURIComponent(tmp_arr[0])] = decodeURIComponent(tmp_arr[1]);
  }
  return obj[key];
}

function noop() {
}

@inject('AppState')
@observer
class Modification extends Component {
  state = this.getInitState();

  /**
   * 组件加载中
   */
  componentWillMount() {
    this.loadAllData();
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    WorkflowStore.queryLanguage(id, AppState.currentLanguage);
  };

  getInitState() {
    return {
      edit: false, // 页面是否是编辑状态
      Nodefocus: '', // 点击节点(y) 获取节点(y)的焦点
      loading: true,
      submitting: false,
      dataSource: [], // 存放 根据ID查询模型流程的数据 LOV组件显示使用
      content: [
        {
          approvalRuleCode: '',
          description: '',
          processPositions: [
            {
              approvalTypeCode: '',
              hrPositionId: '',
            },
          ],
          seqNum: '',
        },
      ], // 存放 根据ID查询模型流程的数据 页面显示使用
      // 选择员工
      value: '',
      text: '', // 员工lov默认值
      LOVVisible: false, // 选择员工lov是否显示
      LOVPostVisible: false, // 选择岗位lov是否显示
      formItemCode: '',
      LOVCode: '',
      lov: '',
      // 选择岗位
      values: '',
      postcode: '', // 岗位lov默认值
      lookupValue: [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []], // 存放每个节点中的审批类别
      nodePosition: 0, // 节点位置
      postPosition: 0, // 岗位位置
    };
  }


  loadAllData() {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { id } = this.props.match.params;
    const code = 'WF_TG_RULE'; const codes = 'WF_JD_RULE';
    WorkflowStore.loadApproval(organizationId, code); // 快码 审批规则
    WorkflowStore.loadNode(organizationId, codes); // 快码 审批节点规则
    this.getWorkflowId(organizationId, id);
  }

  // 根据ID查询模型流程
  getWorkflowId = (organizationId, id) => {
    const { lookupValue } = this.state;
    let datalength; let
      processlength;
    WorkflowStore.getWorkflowId(organizationId, id).then((data) => {
      data.forEach((d, a) => {
        d.processPositions.forEach((p, s) => {
          datalength = data.length;
          processlength = data.length;
          lookupValue.forEach((l, e) => {
            if (a === e) {
              lookupValue[e].push(p.approvalTypeCode);
              return lookupValue;
            }
          });
        });
      });
      if (data.length !== 0) {
        this.setState({
          edit: true,
          dataSource: data,
          content: data,
        });
      }
    });
  };

  // 获取应用系统类型的方法
  getQueryString = (name) => {
    const url = window.location.hash;
    const theRequest = {};
    if (url.indexOf('?') !== -1) {
      const str = url.substr(1);
      const strs = str.split('&');
      for (let i = 0; i < strs.length; i += 1) {
        theRequest[strs[i].split('=')[0]] = decodeURI(strs[i].split('=')[1]);
        if (theRequest[name]) {
          return theRequest[name];
        }
      }
    }
  };



  /**
   * 点击保存按钮
   */
  handleSubmit = (e) => {
    e.preventDefault();
    const { edit, content } = this.state;
    const { id } = this.props.match.params;
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const modelExtId = id;

    this.props.form.validateFields((err, values) => {
      const value = [];
      for (const i in values) {
        value.push(values[i]); // 属性
      }
      for (const l in value) {
        value[l].seqNum = l * 1 + 1;
      }
      if (!err) {
        if (edit) {
          value.forEach((v, s) => {
            v.processPositions.forEach((p, r) => {
              if (v.processPositions[r].hrPositionId === '') {
                v.objectVersionNumber = content[s].objectVersionNumber;
                v.processId = content[s].processId;
                v.deployVersion = content[s].deployVersion;
                v.processPositions[r].hrPositionId = content[s].processPositions[r].hrPositionId;
                v.processPositions[r].objectVersionNumber = content[s].processPositions[r].objectVersionNumber;
                v.processPositions[r].positionId = content[s].processPositions[r].positionId;
                return value;
              } else {
                v.objectVersionNumber = content[s].objectVersionNumber;
                v.processId = content[s].processId;
                v.deployVersion = content[s].deployVersion;
                v.processPositions[r].objectVersionNumber = content[s].processPositions[r].objectVersionNumber;
                v.processPositions[r].positionId = content[s].processPositions[r].positionId;
                return value;
              }
            });
          });
          WorkflowStore.updateProcess(modelExtId, organizationId,
            value).then((data) => {
            if (data === 'workflow.process.col.update') {
              Choerodon.prompt(WorkflowStore.languages['modify.success']);
              this.linkToChange(this.getUrl());
            } else if (data === 'workflow.process.col.add') {
              Choerodon.prompt(WorkflowStore.languages['modify.success']);
              this.linkToChange(this.getUrl());
            } else if (data.message === 'DATA.IS.NULL' || data.message === 'data.is.null') {
              message.error(WorkflowStore.languages[`${intlPrefixs}.please.select.employees.positions`]);
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        } else {
          WorkflowStore.createProcess(modelExtId, organizationId,
            value).then((data) => {
            if (data === 'workflow.process.col.add') {
              Choerodon.prompt(WorkflowStore.languages['create.success']);
              this.linkToChange(this.getUrl());
            } else if (data.message === 'DATA.IS.NULL' || data.message === 'data.is.null') {
              message.error(WorkflowStore.languages[`${intlPrefixs}.please.select.employees.positions`]);
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          });
        }
      }
    });
  };

  // 保存之后跳转至主页面
  getUrl() {
    const { AppState } = this.props;
    const { organizationId, name, type, id } = AppState.currentMenuType;
    return `/iam/approvalWorkflow?type=${type}&id=${id}&name=${name}&organizationId=${organizationId}`;
  }

  linkToChange = (url) => {
    const { history } = this.props;
    history.push(url);
  };

  onreturnpage = () => {
    const { history, intl, AppState } = this.props;
    const { organizationId, name, type, id } = AppState.currentMenuType;
    const url = `/iam/approvalWorkflow?type=${type}&id=${id}&name=${name}&organizationId=${organizationId}`;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        history.push(url);
      } else {
        Modal.confirm({
          title: WorkflowStore.languages['form.cancel.content'],
          content: WorkflowStore.languages[`${intlPrefixs}.modified.unsaved`],
          onOk: () => (
            history.push(url)
          ),
        });
      }
    });
  };

  checkCodes = (y, n) => {
    this.setState({
      nodePosition: y,
      postPosition: n,
    });
  };

  // 保存value值
  checkCode = (value) => {
    const { lookupValue, nodePosition, postPosition } = this.state;
    if (lookupValue[nodePosition] && lookupValue[nodePosition][postPosition]) {
      lookupValue[nodePosition].splice(postPosition, 1, value);
    } else {
      lookupValue[nodePosition].push(value);
    }
    this.setState({
      lookupValue,
    });
  };

  // 删除审批节点
  deletebt = (y) => {
    const { content, lookupValue } = this.state;
    content.splice(y, 1);
    lookupValue.splice(y, 1);
    this.setState({
      content,
    });
  };

  // 添加审批节点
  addNode = (y) => {
    const { content, lookupValue } = this.state;
    const akali = {
      approvalRuleCode: '',
      description: '',
      processPositions: [
        {
          approvalTypeCode: '',
          hrPositionId: '',
        },
      ],
      seqNum: '',
    };
    content.splice(y + 1, 0, akali);
    lookupValue.splice(y + 1, 0, []);
    this.setState({
      lookupValue,
      content,
    });
  };

  // 确认删除
  CloseModel = (y, k, n) => {
    const { lookupValue } = this.state;
    const { content } = this.state;
    content[y].processPositions.splice(n, 1);
    lookupValue[y].splice(n, 1);
    this.setState({
      content,
      lookupValue,
      text: '',
      postcode: '',
    });
  };

  // 删除审批类别
  deleteNode = (y, k, n) => {
    const { intl } = this.props;
    Modal.confirm({
      title: WorkflowStore.languages[`${intlPrefixs}.confirm.deletion`],
      content: WorkflowStore.languages.delete,
      onOk: () => (
        this.CloseModel(y, k, n)
      ),
    });
  };

  // 增加.
  addkeys = (y, n) => {
    const content = this.state.content[y];
    const akali = {
      approvalTypeCode: '',
      hrPositionId: '',
    };
    content.processPositions.push(akali);
    this.setState(
      content,
    );
    this.setState({
      text: '',
      postcode: '',
    });
  };


  // 审批规则下拉框
  handleChange = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const code = 'WF_TG_RULE';
    WorkflowStore.loadApproval(organizationId, code);
  };

  // 审批节点规则下拉框
  loadNodeChange = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const code = 'WF_JD_RULE';
    WorkflowStore.loadNode(organizationId, code);
  };

  // 员工显示
  selectTexts = (y, n) => {
    const { content, dataSource, text, lookupValue } = this.state;
    if (dataSource.length !== 0 && dataSource[y].processPositions[n] && dataSource[y].processPositions[n].text) {
      return dataSource[y].processPositions[n].text;
    } else if (dataSource.length !== 0 && dataSource[y].processPositions[n].hrName && dataSource[y].processPositions[n].hrName) {
      if (lookupValue[y][n] !== dataSource[y].processPositions[n].approvalTypeCode) {
        return text;
      } else {
        return dataSource[y].processPositions[n].hrName;
      }
    } else if (content[y].processPositions[n].text && content[y].processPositions[n].text) {
      return content[y].processPositions[n].text;
    } else {
      return text;
    }
  };

  // 岗位显示
  selectPostcode = (y, n) => {
    const { content, dataSource, postcode, lookupValue } = this.state;
    if (dataSource.length !== 0 && dataSource[y].processPositions[n].postcode && dataSource[y].processPositions[n].postcode) {
      return dataSource[y].processPositions[n].postcode;
    } else if (dataSource.length !== 0 && dataSource[y].processPositions[n].hrName && dataSource[y].processPositions[n].hrName) {
      if (lookupValue[y][n] !== dataSource[y].processPositions[n].approvalTypeCode) {
        return postcode;
      } else {
        return dataSource[y].processPositions[n].hrName;
      }
    } else if (content[y].processPositions[n].postcode && content[y].processPositions[n].postcode) {
      return content[y].processPositions[n].postcode;
    } else {
      return postcode;
    }
  };

  button = (y) => {
    const { intl, AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const {
      value, values, LOVVisible, LOVPostVisible, formItemCode, selectEmployee, employee, employeeId, post, positionCode,
      text, postcode,
      lookupValue, content, edit, dataSource, Nodefocus,
    } = this.state;
    const { processPositions } = this.state.content[y];
    const { getFieldDecorator } = this.props.form;
    const nodeRule = WorkflowStore.getApprovalList; // 快码 审批节点规则
    const orgRule = [];
    if (this.getQueryString('applicationSystem') === 'KB' ) {
      const list  = nodeRule.slice(0, 3);
      list.forEach((item) => {
        orgRule.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
      });
    } else {
      nodeRule && nodeRule.forEach((item) => {
        orgRule.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
      });
    }
    return content[y].processPositions.map((k, n) => {
      const { approvalTypeCode } = processPositions[n];
      return (
        <div className="category" key={`${y}${k}${n}`}>
          <Col span={20} offset={2}>
            <FormItem
              {...formItemLayout}
              key={k}
            >
              {getFieldDecorator(`[${y}]processPositions[${n}]approvalTypeCode`, {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: WorkflowStore.languages[`${intlPrefixs}.choose.classification`],
                  },
                ],
                initialValue: approvalTypeCode || '',
                key: approvalTypeCode,
              })(
                <Select
                  label={WorkflowStore.languages[`${intlPrefixs}.approval.category`]}
                  style={{ width: 140 }}
                  onChange={this.loadNodeChange}
                  onSelect={this.checkCode} // 被选中时调用，参数为选中项的 value (或 key) 值
                  onMouseEnter={() => this.checkCodes(y, n)} // 鼠标移入时回调
                >
                  {orgRule}
                </Select>,
              )}
            </FormItem>
          </Col>
          {lookupValue[y] && lookupValue[y][n] === 'UpperLevel' && (
          <Col span={10} offset={1}>
            {n === 0 && <Icon type="control_point" className="control-points" onClick={() => this.addkeys(y, n)} />}
            {n > 0
          && <Icon className="circle-outlines" onClick={() => this.deleteNode(y, k, n)} />}
          </Col>
          )}
          {lookupValue[y] && lookupValue[y][n] !== 'UpperLevel' && lookupValue[y][n] !== 'User'
        && lookupValue[y][n] !== 'Position' && (
        <Col span={10} offset={1}>
          {n === 0
          && <Icon type="control_point" className="control-points" onClick={() => this.addkeys(y, k)} />}
          {n > 0
          && <Icon className="circle-outlines" onClick={() => this.deleteNode(y, k, n)} />}
        </Col>
          )}
          {lookupValue[y] && lookupValue[y][n] === 'User' && (
          <Col span={20} offset={2}>
            <FormItem
              {...formItemLayout}
              key={`${y}${n}${k}`}
            >
              {getFieldDecorator(`[${y}]processPositions[${n}]hrPositionId`, {
                initialValue: value,
              })(
                <LOVInput
                  code={`selectEmployee${n}`}
                  label={WorkflowStore.languages[`${intlPrefixs}.select.staff`]}
                  form={this.props.form}
                  formCode={`[${y}]processPositions[${n}]hrPositionId`}
                  organizationId={organizationId}
                  style={{ width: 150 }}
                  text={this.selectTexts(y, n)}
                  onLOV={() => {
                    this.setState({
                      LOVVisible: true,
                      formItemCode: `[${y}]processPositions[${n}]hrPositionId` || content[y].processPositions[n].hrPositionId,
                      LOVCode: selectEmployee,
                      nodePosition: y,
                      postPosition: n,
                    });
                  }}
                />,
              )}
              {n === 0
              && <Icon type="control_point" className="control-point" onClick={() => this.addkeys(y, n)} />}
              {n > 0
              && <Icon className="circle-outline" onClick={() => this.deleteNode(y, k, n)} />}
            </FormItem>
            <LOV
              code="selectEmployee"
              firstForm={this.props.form}
              formItem={formItemCode}
              organizationId={organizationId}
              visible={LOVVisible}
              onChange={(visible, text = text) => {
                const { content, dataSource, nodePosition, postPosition } = this.state;
                content[nodePosition].processPositions[postPosition].text = text;
                if (dataSource.length !== 0 && dataSource[nodePosition].processPositions[postPosition] && dataSource[nodePosition].processPositions[postPosition]) {
                  dataSource[nodePosition].processPositions[postPosition].text = text;
                }
                this.setState({
                  LOVVisible: visible,
                  // text,
                  content,
                  dataSource,
                });
              }}
            />
          </Col>
          )}
          {lookupValue[y] && lookupValue[y][n] === 'Position' && (
          <Col span={20} offset={2}>
            <FormItem
              {...formItemLayout}
              key={`${y}${n}${k}`}
            >
              {getFieldDecorator(`[${y}]processPositions[${n}]hrPositionId`, {
                initialValue: values,
              })(
                <LOVInput
                  key={`${y}${n}${k}`}
                  code={`post${n}`}
                  label={WorkflowStore.languages[`${intlPrefixs}.select.post`]}
                  form={this.props.form}
                  formCode={`[${y}]processPositions[${n}]hrPositionId`}
                  organizationId={organizationId}
                  style={{ width: 150 }}
                  text={this.selectPostcode(y, n)}
                  onLOV={() => {
                    this.setState({
                      LOVPostVisible: true,
                      formItemCode: `[${y}]processPositions[${n}]hrPositionId` || content[y].processPositions[n].hrPositionId,
                      LOVCode: post,
                      nodePosition: y,
                      postPosition: n,
                    });
                  }}
                />,
              )}
              {n === 0
              && <Icon type="control_point" className="control-point" onClick={() => this.addkeys(y, n)} />}
              {n > 0
              && <Icon className="circle-outline" onClick={() => this.deleteNode(y, k, n)} />}
            </FormItem>
            <LOV
              code="post"
              firstForm={this.props.form}
              formItem={formItemCode}
              organizationId={organizationId}
              visible={LOVPostVisible}
              onChange={(visible, postcode = postcode) => {
                const { content, dataSource, nodePosition, postPosition } = this.state;
                content[nodePosition].processPositions[postPosition].postcode = postcode;
                if (dataSource.length !== 0 && dataSource[nodePosition].processPositions[postPosition] && dataSource[nodePosition].processPositions[postPosition]) {
                  dataSource[nodePosition].processPositions[postPosition].postcode = postcode;
                }
                this.setState({
                  LOVPostVisible: visible,
                  text,
                  content,
                  dataSource,
                });
              }}
            />
          </Col>
          )}
        </div>
      );
    });
  };

  render() {
    const { intl, AppState } = this.props;
    const { visible, submitting, content } = this.state;
    const { getFieldDecorator } = this.props.form;
    let circle; let button;
    const organization = WorkflowStore.getCompanys; // 快码 审批规则
    const nodeRule = WorkflowStore.getApprovalList; // 快码 审批节点规则
    const orgOption = [];
    const orgRule = [];
    organization && organization.forEach((item) => {
      orgOption.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    if (this.getQueryString('applicationSystem') === 'KB' ) {
      const list  = nodeRule.slice(0, 3);
      list.forEach((item) => {
        orgRule.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
      });
    } else {
      nodeRule && nodeRule.forEach((item) => {
        orgRule.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
      });
    }

    circle = content.map((l, y) => (
      <Timeline.Item className="approval-rule">
        <Form className="form-position" key={y}>
          <FormItem
            {...formItemLayout}
            className="process"
          >
            {getFieldDecorator(`[${y}]description`, {
              rules: [
                {
                  required: true,
                  message: WorkflowStore.languages[`${intlPrefixs}.enter.node.name`],
                },
              ],
              initialValue: content[y].description,
              key: content[y].description,
            })(
              <Input
                autoComplete="off"
                style={{ width: 300 }}
                label={WorkflowStore.languages[`${intlPrefixs}.node.name`]}
                maxLength={10}
              />,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            className="approval-rule-code"
          >
            {getFieldDecorator(`[${y}]approvalRuleCode`, {
              validateTrigger: 'onBlur',
              initialValue: content[y].approvalRuleCode || 'ALL',
              key: y,
              validateFirst: true,
            })(
              <Select
                label={WorkflowStore.languages[`${intlPrefixs}.examination.approval.rules`]}
                style={{ width: 300 }}
                onChange={this.handleChange}
              >
                {orgOption}
              </Select>,
            )}
          </FormItem>
          {this.button(y)}
          <div className="add-delete">
            {y === 0
                && (
                <div className="queue-div-one" onClick={() => this.addNode(y)}><Icon className="queue" />
                </div>
                )}
            {y > 0
                && <div className="queue-div" onClick={() => this.addNode(y)}><Icon className="queue" /></div>}
            {y > 0
                && (
                <div className="delete-forever-div" onClick={() => this.deletebt(y)}>
                  <Icon className="delete-forever" />
                </div>
                )}
          </div>
        </Form>
      </Timeline.Item>
    ));
    return (
      <Page>
        <Header
          className="header"
          title={WorkflowStore.languages[`${intlPrefixs}.approve.workflow.node.settings`]}
        />
        <Content className="modification-content">
          {circle}
          <Button
            onClick={this.handleSubmit}
            type="primary"
            funcType="raised"
            className="keep"
            style={{ marginLeft: 5, marginTop: 25 }}
            loading={submitting}
          >
            {WorkflowStore.languages.save}
          </Button>
          <Button
            onClick={this.onreturnpage}
            type="primary"
            funcType="raised"
            className="retrun-keep"
            style={{ marginLeft: 20, marginTop: 20 }}
            loading={submitting}
          >
            {WorkflowStore.languages.return}
          </Button>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(Modification)));
