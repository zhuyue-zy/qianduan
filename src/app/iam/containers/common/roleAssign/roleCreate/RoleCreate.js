import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import { Observable } from 'rxjs';
import { Button, Col, Form, Input, Modal, Row, Spin, Tree } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { Content, Header, Page, axios } from 'yqcloud-front-boot';
import RoleStore from '../../../../stores/globalStores/role/RoleStore';
import './RoleCreate.scss';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';

const { TreeNode } = Tree;
const FormItem = Form.Item;
const intlPrefix = 'global.role';

@inject('AppState')
@observer
class CreateRole extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.organizationId || 0;
    this.id = this.props.AppState.currentMenuType.id || '';
    this.organizationName = this.props.AppState.currentMenuType.name || '';
    this.type = this.props.match.params.type || '';
    this.list = [];
    this.result = [];
    this.state = {
      submitting: false,
      checkedKeys: [],
      slideIndex:0,
      checkedKeys_Other: [],
      treeClassName1:'',
      treeClassName2:'tree_box2',
      // 存放多语言信息
      multiLanguageValue: {
        name: {},
        description: {},
      },
      multiLanguageList: [],
    };
  }

  componentWillMount() {
    this.loadLanguage();
    this.getLanguage();
    RoleStore.setChosenLevel(this.type);
    // this.setCanPermissionCanSee();
    const functionCodes = RoleStore.getSelectedRolesPermission || [];
    const checkedType = [];
    functionCodes.forEach((v) => {
      checkedType.push(v);
    });
    this.setState({
      checkedKeys: checkedType,
    });
    RoleStore.getAllRoleLabels();
    RoleStore.setIsLoading(true);
    RoleStore.loadAllRole(this.organizationId, this.type).then((data) => {
      if (data) {
        const b = this.loopRoleData(data, 0);
        const a = [];
        b.forEach((item) => {
          a.push(this.addShow(item, ''));
        });
        RoleStore.setRolesTree(a);
        RoleStore.setIsLoading(false);
      }
    });
    RoleStore.loadAllRole_Other(this.organizationId, this.type).then((data) =>{
      if (data) {
        const b = this.loopRoleData(data, 0);
        const a = [];
        b.forEach((item) => {
          a.push(this.addShow(item, ''));
        });
        RoleStore.setRolesTree_Other(a);
        RoleStore.setIsLoading(false);
      }
    });
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    if (this.props.AppState.currentMenuType.type === 'site') {
      RoleStore.queryLanguage(0, AppState.currentLanguage);
    } else {
      RoleStore.queryLanguage(id, AppState.currentLanguage);
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

  componentWillUnmount() {
    RoleStore.setCanChosePermission('site', []);
    RoleStore.setCanChosePermission('organization', []);
    RoleStore.setCanChosePermission('project', []);
  }

  /*
   * @method
   * @param {type} 当前层级
   * @returns {url} 返回url
   * @desc 根据当前层级获取返回url
  */
  getUrl(type) {
    if (type === 'site') {
      return '/iam/roleAssign/site';
    } else if (type === 'organization') {
      return `/iam/roleAssign/organization?type=organization&id=${this.id}&name=${this.organizationName}&organizationId=${this.organizationId}`;
    }
  }

  // 获取权限管理数据
  setCanPermissionCanSee() {
    const levels = ['organization', 'project', 'site'];
    for (let c = 0; c < levels.length; c += 1) {
      Observable.fromPromise(axios.get(`iam/v1/permissions/${this.organizationId}/org?level=${levels[c]}`))
        .subscribe((data) => {
          RoleStore.handleCanChosePermission(levels[c], data);
        });
    }
  }

  checkCode = (rule, value, callback) => {
    const validValue = `role/${RoleStore.getChosenLevel}/custom/${value}`;
    const params = { code: validValue };
    axios.post(`/iam/v1/roles/check${this.type === 'organization' ? `/code/${this.organizationId}` : ''}`, JSON.stringify(params)).then((mes) => {
      if (mes.failed) {
        const { intl } = this.props;
        callback(RoleStore.languages[`${intlPrefix}.code.exist.msg`]);
      } else {
        callback();
      }
    });
  };

  loopRoleData = (data, num) => data.map((item) => {
    const children = [];
    const result = {
      key: item.functionCode,
      id: item.id,
      title: item.functionName,
      description: item.functionDescription,
      type: item.functionType,
    };
    if (item.children && item.children.length > 0) {
      if (children.length > 0) {
        result.children = [...this.loopRoleData(item.children, num + 1), ...children];
      } else {
        result.children = this.loopRoleData(item.children, num + 1);
      }
    } else if (children.length > 0) {
      result.children = children;
    }
    return result;
  });

  addShow = (data, parentLabel) => {
    if (data.children && data.children.length > 0) {
      data.show = parentLabel ? `${parentLabel}/${data.key}` : data.key;
      for (let i = 0; i < data.children.length; i += 1) {
        this.addShow(data.children[i], data.show);
      }
    } else {
      data.show = parentLabel ? `${parentLabel}/${data.key}` : data.key;
    }
    return data;
  };

  linkToChange = (url) => {
    const { history } = this.props;
    history.push(url);
  };

  handleCreate = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err) => {
      if (!err) {
        const { checkedKeys,checkedKeys_Other } = this.state;
        const labelValues = this.props.form.getFieldValue('label');
        const labelIds = labelValues && labelValues.map(labelId => ({ id: labelId }));
        const role = {
          name: this.props.form.getFieldValue('name'),
          modified: this.props.form.getFieldValue('modified'),
          enabled: this.props.form.getFieldValue('enabled'),
          code: `role/${RoleStore.getChosenLevel}/custom/${this.props.form.getFieldValue('code').trim()}`,
          level: RoleStore.getChosenLevel,
          description: this.props.form.getFieldValue('roleDescription'),
          functionCodes: checkedKeys.concat(checkedKeys_Other),
          labels: labelIds,
          organization_id: this.organizationId,
          __tls: this.state.multiLanguageValue,
          language: this.state.multiLanguageList,
        };
        this.setState({ submitting: true });
        RoleStore.createRoleMember(role, this.organizationId)
          .then((data) => {
            this.setState({ submitting: false });
            if (data.failed) {
              Choerodon.prompt(RoleStore.languages['create.error']);
            } else {
              Choerodon.prompt(RoleStore.languages['create.success']);
              this.linkToChange(this.getUrl(this.type));
            }
          })
          .catch((errors) => {
            this.setState({ submitting: false });
            if (errors.response.data.message === 'error.role.roleNameExist') {
              Choerodon.prompt(RoleStore.languages[`${intlPrefix}.name.exist.msg`]);
            } else {
              Choerodon.prompt(RoleStore.languages['create.error']);
            }
          });
      }
    });
  };

  handleReset = () => {
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        this.linkToChange(this.getUrl(this.type));
      } else {
        Modal.confirm({
          title: RoleStore.languages[`${intlPrefix}.cancel.title`],
          content: RoleStore.languages[`${intlPrefix}.cancel.content`],
          onOk: () => (
            this.linkToChange(this.getUrl(this.type))
          ),
        });
      }
    });
  };

  /* 深度平铺数组，没获取到父节点 */
  // deepFlatten = arr => arr.map((v) => {
  //   if (Array.isArray(v.props.children) && v.props.children.length > 0) {
  //     this.list.push(v.key);
  //     this.deepFlatten(v.props.children);
  //   } else {
  //     this.result.push(v.key);
  //   }
  // });

  /* 去重 */
  // distinctValuesOfArray = arr => [...new Set(arr)];

  onCheck = (value, e) => {
    // this.list = [];
    // this.result = [];
    this.setState({
      checkedKeys: value
    })
    
    // if (e.checked) {
    //   const a = e.node.props.show.split('/');
    //   if (e.node.props.children) {
    //     this.deepFlatten(e.node.props.children);
    //   }
    //   const checkNodes = this.distinctValuesOfArray([...a, ...value.checked, ...this.list, ...this.result]);
    //   this.setState({ checkedKeys: checkNodes });
    // } else if (e.node.props.children) {
    //   this.deepFlatten(e.node.props.children);
    //   const filterCheckedNodes = value.checked.filter(v => (![...this.result, ...this.list].includes(v)));
    //   this.setState({ checkedKeys: filterCheckedNodes });
    // } else {
    //   const filterCheckedNodes = value.checked.filter(v => (e.node.props.key !== v));
    //   this.setState({ checkedKeys: filterCheckedNodes });
    // }
  };

  checkedKeysOther = (value, e) => {
    // this.list = [];
    // this.result = [];
    this.setState({
      checkedKeys_Other: value
    })
  }

  onTitle = item => (<div title={item.description}>{item.title}</div>);

  renderTreeNodes = data => data.map((item) => {
    if (item.children) {
      return (
        <TreeNode title={this.onTitle(item)} key={item.key} {...item}>
          {this.renderTreeNodes(item.children)}
        </TreeNode>
      );
    }
    return <TreeNode {...item} title={this.onTitle(item)} />;
  });

  render() {
    const { checkedKeys,checkedKeys_Other, submitting } = this.state;
    const { intl } = this.props;
    const { getFieldDecorator } = this.props.form;
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
    const data = RoleStore.getRolesTree.slice();
    const data_other = RoleStore.getRolesTree_Other.slice();
    return (
      <Page className="choerodon-roleCreate">
        <Header
          title={RoleStore.languages[`${intlPrefix}.create`]}
          backPath={this.getUrl(this.type)}
        />
        <Content>
          <div>
            <Form layout="vertical">
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('code', {
                  rules: [{
                    required: true,
                    whitespace: true,
                    message: RoleStore.languages[`${intlPrefix}.code.require.msg`],
                  }, {
                    pattern: /^[A-Z]([-A-Z0-9]*[A-Z0-9])?$/,
                    message: RoleStore.languages[`${intlPrefix}.code.pattern.msg`],
                  }, {
                    validator: this.checkCode,
                  }],
                  validateFirst: true,
                  initialValue: this.state.roleName,
                })(
                  <Input
                    autoComplete="off"
                    label={RoleStore.languages[`${intlPrefix}.code`]}
                    size="default"
                    style={{
                      width: '512px',
                    }}
                    maxLength={64}
                  />,
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('name', {
                  rules: [{
                    required: true,
                    whitespace: true,
                    message: RoleStore.languages[`${intlPrefix}.name.require.msg`],
                  }],
                  initialValue: this.state.name,
                })(
                  <MultiLanguageFormItem
                    label={RoleStore.languages[`${intlPrefix}.name`]}
                    requestUrl="true"
                    requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.name : {}}
                    handleMultiLanguageValue={({ retObj, retList }) => {
                      // 将多语言的值设置到当前表单
                      this.props.form.setFieldsValue({
                        name: retObj[this.props.AppState.currentLanguage],
                      });
                      this.setState({
                        multiLanguageValue: {
                          ...this.state.multiLanguageValue,
                          name: retObj,
                        },
                        multiLanguageList: retList,
                      });
                    }}
                    maxLength={32}
                    type="FormItem"
                    FormLanguage={this.state.multiLanguageValue}
                    languageEnv={this.state.languageEnv}
                    descriptionObject={RoleStore.languages.multiLanguage}
                    required="true"
                    inputWidth={512}
                  />,
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('roleDescription', {})(
                  <MultiLanguageFormItem
                    label={RoleStore.languages[`${intlPrefix}.role.description`]}
                    requestUrl="true"
                    requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.description : {}}
                    handleMultiLanguageValue={({ retObj, retList }) => {
                      // 将多语言的值设置到当前表单
                      this.props.form.setFieldsValue({
                        roleDescription: retObj[this.props.AppState.currentLanguage],
                      });
                      this.setState({
                        multiLanguageValue: {
                          ...this.state.multiLanguageValue,
                          description: retObj,
                        },
                        multiLanguageList: retList,
                      });
                    }}
                    maxLength={120}
                    type="FormItem"
                    FormLanguage={this.state.multiLanguageValue}
                    languageEnv={this.state.languageEnv}
                    descriptionObject={RoleStore.languages.multiLanguage}
                    required={false}
                    inputWidth={512}
                  />,
                )}
              </FormItem>
              <FormItem style={{ marginBottom: 0, fontSize: 18 }}>
                {(checkedKeys.length > 0 || checkedKeys_Other.length>0) ? (
                  <p className="alreadyDes">
                    {checkedKeys.length+checkedKeys_Other.length}{RoleStore.languages[`${intlPrefix}.permission.count.msg`]}
                  </p>
                ) : (
                  <p className="alreadyDes">
                    {RoleStore.languages[`${intlPrefix}.permission.nothing.msg`]}
                  </p>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
              >
                <Spin spinning={RoleStore.getIsLoading} style={{ width: '512px' }}>
                  <div className="ButtonRole">
                    <div
                      className="eachButton"
                      onClick={() => {this.setState({ slideIndex: 0, treeClassName2: 'tree_box2' , treeClassName1: '' });}}
                      style={this.state.slideIndex === 0 ? { background: '#1890ff' } : {}}
                    >
                      <p style={this.state.slideIndex === 0 ? { color: 'white' } : {}}>菜单权限</p>
                    </div>
                    <div
                      className="eachButton"
                      onClick={() => {this.setState({ slideIndex: 1, treeClassName1: 'tree_box1', treeClassName2: ''});}}
                      style={this.state.slideIndex === 1 ? { background: '#1890ff' } : {}}
                    >
                      <p style={this.state.slideIndex === 1 ? { color: 'white' } : {}}>其他权限</p>
                    </div>
                  </div>
                  <div className="Role-Tree">
                    <Tree
                      className={this.state.treeClassName1}
                      checkable
                      // checkStrictly
                      onCheck={this.onCheck}
                      checkedKeys={this.state.checkedKeys}
                    >
                      {this.renderTreeNodes(data)}
                    </Tree>
                    <Tree
                      className={this.state.treeClassName2}
                      checkable
                      // checkStrictly
                      onCheck={this.checkedKeysOther}
                      checkedKeys={this.state.checkedKeys_Other}
                    >
                      {this.renderTreeNodes(data_other)}
                    </Tree>
                  </div>
                  {
                    data.length === 0 ? (
                      <span>No data</span>
                    ) : ''
                  }
                </Spin>
              </FormItem>
              <div className="role-action">
                <FormItem>
                  <Row className="mt-md">
                    <Col className="choerodon-btn-create">
                      <Button
                        funcType="raised"
                        type="primary"
                        onClick={this.handleCreate}
                        loading={submitting}
                      >
                        {RoleStore.languages.create}
                      </Button>
                    </Col>
                    <Col span={5}>
                      <Button
                        funcType="raised"
                        onClick={this.handleReset}
                        disabled={submitting}
                      >
                        {RoleStore.languages.cancel}
                      </Button>
                    </Col>
                  </Row>
                </FormItem>
              </div>
            </Form>
          </div>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(CreateRole)));
