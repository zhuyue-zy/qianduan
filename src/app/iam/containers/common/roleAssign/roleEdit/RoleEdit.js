import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import { Button, Col, Form, Input, Modal, Row, Tree, Spin } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { axios, Content, Header, Page } from 'yqcloud-front-boot';
import RoleStore from '../../../../stores/globalStores/role/RoleStore';
import './RoleEdit.scss';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';

const { TreeNode } = Tree;
const FormItem = Form.Item;
const intlPrefix = 'global.role';

@inject('AppState')
@observer
class EditRole extends Component {
  constructor(props) {
    super(props);
    this.state = {
      slideIndex: 0,
      roleData: {},
      submitting: false,
      treeClassName1:'',
      treeClassName2:'tree_box2',
      id: this.props.match.params.id,
      checkedKeys: [],
      checkedKeys_Other:[],
      // 存放多语言信息
      multiLanguageValue: {
        name: {},
        description: {},
      },
      multiLanguageList: [],
    };
    this.id = this.props.AppState.currentMenuType.id || '';
    this.organizationId = this.props.AppState.currentMenuType.organizationId || 0;
    this.organizationName = this.props.AppState.currentMenuType.name || '';
    this.type = this.props.match.params.type || '';
    this.list = [];
    this.result = [];
  }

  componentWillMount() {
    this.loadLanguage();
    RoleStore.setIsLoading(true);
    this.getLanguage();
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
    RoleStore.getAllRoleLabels();
  }

  // 加载单条数据
  getOneData = () => {
    const { multiLanguageValue } = this.state;
    RoleStore.loadRoleById(this.organizationId, this.state.id).then((data) => {
      if (data.failed) {
        // console.log('---')
      } else {
        const name = Object.assign({}, multiLanguageValue.name, data.__tls.name);
        const description = Object.assign({}, multiLanguageValue.description, data.__tls.description);
        this.setState({
          roleData: data,
          checkedKeys: data.functionCodes,
          checkedKeys_Other: data.otherFunctionCodes,
          multiLanguageValue: { name, description },
        });
        RoleStore.setSelectedRolesPermission(data.functionCodes);
        // this.setCanPermissionCanSee(data.level);
        RoleStore.setChosenLevel(data.level);
      }
    }).catch((error) => {
      const message = RoleStore.languages[`${intlPrefix}.getinfo.error.msg`];
      Choerodon.prompt(`${message}: ${error}`);
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
        }, () => this.setDispalyName());
      });
  };

  // 设定名字
  setDispalyName = () => {
    const { multiLanguageValue, languageEnv } = this.state;
    const { name, description } = multiLanguageValue;
    languageEnv.forEach((val) => {
      name[val.code] = '';
      description[val.code] = '';
    });
    this.setState({
      multiLanguageValue,
    }, () => this.getOneData());
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

  componentWillUnmount() {
    RoleStore.setCanChosePermission('site', []);
    RoleStore.setCanChosePermission('organization', []);
    RoleStore.setCanChosePermission('project', []);
    RoleStore.setSelectedRolesPermission([]);
  }

  // 获取权限管理数据
  setCanPermissionCanSee(level) {
    RoleStore.getWholePermission(level,
      RoleStore.getPermissionPage[level]).subscribe((data) => {
      RoleStore.handleCanChosePermission(level, data);
    });
  }

  linkToChange = (url) => {
    const { history } = this.props;
    history.push(url);
  };

  // isModify = () => {
  //   const { checkedKeys, roleData } = this.state;
  //   const { functionCodes } = roleData;
  //   if (checkedKeys.length !== functionCodes.length) {
  //     return true;
  //   }
  //   functionCodes.forEach((item) => {
  //     console.log('--------------')
  //     if (!checkedKeys.includes(item)) {
  //       return true;
  //     }
  //   });
  //   return false;
  // };

  handleEdit = () => {
    const { intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!err) {
        // if (!modify && !this.isModify()) {
        //   Choerodon.prompt(intl.formatMessage({ id: 'modify.success' }));
        //   this.linkToChange(this.getUrl(this.type));
        //   return;
        // }
        const { checkedKeys,checkedKeys_Other } = this.state;
        const labelValues = this.props.form.getFieldValue('label');
        const labelIds = labelValues && labelValues.map(labelId => ({ id: labelId }));
        const role = {
          name: this.props.form.getFieldValue('name'),
          editable: this.props.form.getFieldValue('isEdit'),
          enabled: this.props.form.getFieldValue('isEnable'),
          code: `role/${RoleStore.getChosenLevel}/custom/${this.props.form.getFieldValue('code').trim()}`,
          description: this.props.form.getFieldValue('roleDescription'),
          level: this.state.roleData.level,
          functionCodes:  checkedKeys.concat(checkedKeys_Other),
          labels: labelIds,
          objectVersionNumber: this.state.roleData.objectVersionNumber,
          __tls: this.state.multiLanguageValue,
          language: this.state.multiLanguageList,
        };
        this.setState({ submitting: true });
        RoleStore.saveRole(this.organizationId, this.state.id, role)
          .then((data) => {
            this.setState({ submitting: false });
            if (data.failed) {
              Choerodon.prompt(RoleStore.languages['modify.error']);
            } else {
              Choerodon.prompt(RoleStore.languages['modify.success']);
              this.linkToChange(this.getUrl(this.type));
            }
          })
          .catch((errors) => {
            this.setState({ submitting: false });
            Choerodon.prompt(RoleStore.languages['modify.error']);
          });
      }
    });
  };

  handleReset = () => {
    const { intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        this.props.history.goBack();
      } else {
        Modal.confirm({
          title: RoleStore.languages[`${intlPrefix}.cancel.title`],
          content: RoleStore.languages[`${intlPrefix}.cancel.content`],
          onOk: () => (
            this.props.history.goBack()
          ),
        });
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
    const {
      roleData = {},
      checkedKeys,
      submitting,
      checkedKeys_Other
    } = this.state;
    const { intl } = this.props;
    const data = RoleStore.getRolesTree.slice();
    const data_other = RoleStore.getRolesTree_Other.slice();
    const { name, code, builtIn, description } = roleData;
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
    return (
      <div>
        <Page>
          <Header
            title={RoleStore.languages[`${intlPrefix}.modify`]}
            backPath={this.getUrl(this.type)}
          />
          <Content>
            <Form layout="vertical">
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('code', {
                  rules: [{
                    required: true,
                    whitespace: true,
                  }],
                  initialValue: `${code ? code.replace('role/organization/custom/', '').replace('role/site/custom/', '') : ''}`,
                })(
                  <Input
                    size="default"
                    label={RoleStore.languages[`${intlPrefix}.code`]}
                    autoComplete="off"
                    style={{
                      width: '512px',
                    }}
                    disabled
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
                    message: RoleStore.languages[`${intlPrefix}.name.require.msg`],
                    whitespace: true,
                  }],
                  initialValue: name,
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
                {getFieldDecorator('roleDescription', {
                  initialValue: description,
                })(
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
              <FormItem style={{ marginBottom: 0 }}>
                {checkedKeys.length > 0 ? (
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
                  <Row style={{ marginTop: '2rem' }}>
                    <Col style={{ float: 'left', marginRight: '20px' }}>
                      <Button
                        funcType="raised"
                        type="primary"
                        onClick={this.handleEdit}
                        loading={submitting}
                      >
                        {RoleStore.languages.save}
                      </Button>
                    </Col>
                    <Col span={5}>
                      <Button
                        funcType="raised"
                        type="flat"
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
          </Content>
        </Page>
      </div>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EditRole)));
