import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import { FormattedMessage, injectIntl } from 'react-intl';
import {
  Button,
  Col,
  Form,
  Icon,
  Input,
  message,
  Modal,
  Radio,
  Row,
  Spin,
  Tooltip,
  Tree,
  Upload,
  Select,
  Pagination,
  Tabs,
} from 'yqcloud-ui';
import { axios, Header, Page } from 'yqcloud-front-boot';
import { CLIENT_ID, CLIENT_TYPE } from 'yqcloud-front-boot/lib/containers/common/constants';
import _ from 'lodash';
import FileSaver from 'file-saver';
import moment from 'moment';
import { getChildPropertys, getNodeByKey } from '../../../../common/roleManagementUtils';
import Ellipsis from '../../../../components/ellipsis';
import Remove from '../../../../components/remove';
import LOVInput from '../superLov/LOVInput';
import LOV from '../superLov';
import './RoleManagement.scss';
import RoleManagementStore from '../../../../stores/globalStores/roleManagement/RoleManagementStore';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';


const intlPrefix = 'global.roleManag';
const { TabPane } = Tabs;
const { Search } = Input;
const { TreeNode } = Tree;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const { confirm } = Modal;
const Option = Select.Option;
let timeout;

@Form.create({})
@withRouter
@injectIntl
@inject('AppState')
@observer
class RoleManagement extends Component {
  getInitState() {
    return {
      preview: false,
      functionCode: '',
      menuCode: '',
      functionType: '',
      level: '',
      formLoading: false,
      selectedKeys: [],
      submitting: false,
      selectedKeysEditable: {},
      treeData: [],
      key: '',
      value: '',
      loading: false,
      expandedKeys: [],
      visible: false,
      searchValue: '',
      newest: null,
      createModule: false,
      otherSelect: true,
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      params: [],
      filters: {},
      sort: 'id,desc',
      formItemCode: '',
      LOVVisible: false,
      LOVMenuVisible: false,
      text: [],
      LOVCode: '',
      firstLoad: true,
      subButtonAble: true,
      apiData: [],
      apiDataChildren: [],
      type: 'button',
      isMenuType: true,
      // 存放多语言信息
      multiLanguageValue: {
        function_name: {},
      },
      multiLanguageList: [],
    };
  }

  constructor(props) {
    super(props);
    this.state = this.getInitState();
    this.organizationId = this.props.AppState.currentMenuType.id || 0;
    this.organizationName = this.props.AppState.currentMenuType.name || '';
    this.value = '';
  }

  componentWillMount() {
    this.setState({ loading: true });
    this.loadLanguage();
    this.getLanguage();
  }

  componentDidMount() {
    const { type } = this.state;
    this.loadRoleAndInit(type, '', 0, (data) => {
      if (data === 'done') {
        this.setState({ loading: false });
      }
    });
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const id = 0;
    RoleManagementStore.queryLanguage(id, AppState.currentLanguage);
  };

  /**
   * 搜索节点
   * @param value 搜索文本
   */
  handleSearch = (value) => {
    const { type } = this.state;
    this.setState({ loading: true });
    const searchValue = value.trim();
    this.setState({
      expandedKeys: [],
      selectedKeys: [],
    }, () => {
      if (searchValue) {
        RoleManagementStore.loadRoleBySearch(searchValue, type)
          .then((data) => {
            if (data) {
              this.state.treeData = [];
              this.initRole(data);
            }
            const keys = getChildPropertys(this.state.treeData, 'key');
            this.setState({
              loading: false,
              expandedKeys: keys,
              searchValue,
              treeData: this.state.treeData,
            });
          })
          .catch(error => Choerodon.handleResponseError(error));
      } else {
        this.setState({ searchValue: '' });
        this.loadRole(this.state.type, 0, (data) => {
          this.state.treeData = [];
          this.initRole(data);
          this.setState({
            loading: false,
            treeData: this.state.treeData,
          });
        });
      }
    });
  };

  /**
   * 处理按钮操作
   * @param
   */
  handleAction = (flag) => {
    const { functionCode, key, treeData } = this.state;
    if (functionCode && key) {
      if (flag === 'sub') {
        this.handleCreate('sub', functionCode);
      } else if (flag === 'level') {
        this.handleCreate('level', functionCode);
      } else {
        this.handleEdit(functionCode);
      }
    } else if (treeData && treeData.length === 0) {
      this.handleCreate('sub', 0);
    } else {
      message.info(RoleManagementStore.languages[`${intlPrefix}.choose.node`]);
    }
  };

  /**
   * 创建功能
   * @param flag 标示
   * @param functionCode 功能code
   */
  handleCreate = (flag, functionCode) => {
    if (functionCode === 0) {
      this.setState({
        visible: true,
        edit: false,
        sub: true,
        preview: false,
        functionType: 'function',
        level: '',
        text: [],
        roleInfo: {
          functionName: '',
          parentFunctionName: '',
          children: null,
          createdBy: null,
          creationDate: null,
          lastUpdateDate:null,
          lastUpdatedBy: null,
          objectVersionNumber: null,
          id: null,
          organizationId: null,
          level: 'organization',
          menuCode: null,
          type: null,
          menuMapping: null,
          hasChildren: null,
          path: null,
          permissionCode:null,
          isBarely: null,
          treeFloor: 0,
          parentFunctionCode: 'M',
        },
      });
    } else {
      this.getRoleByCode(functionCode, true, () => {
        if (flag === 'sub') {
          this.setState({
            visible: true,
            edit: false,
            sub: true,
            preview: false,
          });
        } else {
          this.setState({
            visible: true,
            edit: false,
            sub: false,
            preview: false,
          });
        }
      });
    }
  };

  handleEdit = (functionCode) => {
    this.getRoleByCode(functionCode, false, () => {
      this.setState({
        visible: true,
        edit: true,
        preview: false,
      });
    });
  };

  onSelect = (selectedKeys, e) => {
    const { functionCode, hasChildren } = e.node.props.dataRef;
    if (hasChildren === 'N') {
      this.setState({
        subButtonAble: false,
      });
    } else {
      this.setState({
        subButtonAble: true,
      });
    }
    this.setState({
      selectedKeys,
      functionCode,
      key: functionCode,
    });
  };

  onExpand = (key) => {
    let expandedKeys = key;
    if (key.length < this.state.expandedKeys.length) {
      const closeKey = this.state.expandedKeys.filter(obj => !key.includes(obj))[0];
      expandedKeys = this.state.expandedKeys.filter(obj => !obj.includes(closeKey));
    }
    this.setState({ expandedKeys });
  };

  // onLoadData = treeNode => new Promise((resolve) => {
  //   if (treeNode.props.children) {
  //     resolve();
  //     return;
  //   }
  //   this.loadRoleAndInit(treeNode.props.dataRef.key, treeNode.props.dataRef.functionCode, (data) => {
  //     if (data === 'done') {
  //       resolve();
  //     }
  //   });
  // });

  loadRole = (type, parentCode, callback) => {
    if (type === 'button') {
      axios.get('iam/v1/function/root')
        .then((data) => {
          if (typeof callback === 'function') {
            callback(data);
          }
        })
        .catch((error) => {
          Choerodon.handleResponseError(error);
        });
    } else if (type === 'other') {
      axios.get('iam/v1/function/other/root')
        .then((data) => {
          if (typeof callback === 'function') {
            callback(data);
          }
        })
        .catch((error) => {
          Choerodon.handleResponseError(error);
        });
    }
  };

  /**
   * 加载功能
   * @param
   */
  loadRoleAndInit = (type, preKey, parentCode, callback) => {
    this.loadRole(type, parentCode, (result) => {
      this.setState({ treeData: result }, () => {
        if (typeof callback === 'function') {
          callback('done');
        }
      });
    });
  };


  initRole = (treeData) => {
    if (treeData && treeData.length) {
      this.setState({
        treeData,
      });
    }
  };

  /**
   * 渲染标题
   * @param title
   * @param functionCode
   * @param functionType
   * @param treeFloor 子节点层级
   */
  onTitle = (title, functionCode, functionType, treeFloor) => {
    let style = null;
    if (treeFloor === 0) {
      style = {
        color: '#04173F',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '32px',
      };
    } else if (treeFloor === 1) {
      style = {
        color: '#04173F',
        fontSize: 12,
        fontWeight: 400,
        lineHeight: '28px',
      };
    } else {
      style = {
        color: '#818999',
        fontSize: 12,
        fontWeight: 400,
        lineHeight: '24px',
      };
    }
    return (
      <div onClick={() => this.handleClick(functionCode)}>
        <div
          role="none"
          id={functionCode}
          style={{
            float: 'left',
            paddingRight: 10,
            width: '80%',
            ...style,
          }}
        >
          <Ellipsis length={30} tooltip>{title}</Ellipsis>
        </div>
        {((functionType === 'button') || (functionType === 'function')) ? (
          <div className="yqcloud-role-item">
            <Tooltip
              title={RoleManagementStore.languages.delete}
              placement="bottom"
            >
              <Icon
                type="delete"
                onClick={this.handleOpen}
              />
            </Tooltip>
          </div>
        ) : ''}
      </div>
    );
  };

  /* 导出Excel */
  exportTree = () => axios.get('iam/v1/xls', { responseType: 'blob' })
    .then((data) => {
      const blob = new Blob([data]);
      const fileName = `功能权限表-${moment().format('YYYY-MM-DD')}.xlsx`;
      FileSaver.saveAs(blob, fileName);
    })
    .catch((error) => {
      if (error.code === 'ECONNABORTED') {
        message.error(RoleManagementStore.languages[`${intlPrefix}.download.timeout`]);
      } else {
        Choerodon.handleResponseError(error);
      }
    });

  // handleUpload = (e) => {
  //   if (e.target.files[0]) {
  //     const formData = new FormData();
  //     formData.append('file', e.target.files[0]);
  //     axios({
  //       url: '/iam/v1/xls',
  //       method: 'post',
  //       data: formData,
  //       responseType: 'arraybuffer',
  //       timeout: 60000,
  //     }).then((data) => {
  //       if (data.failed) {
  //         Choerodon.prompt(data.message);
  //       } else {
  //         Choerodon.prompt('导入成功');
  //         this.onReload();
  //       }
  //     }).catch((error) => {
  //       message.error(error);
  //     });
  //   }
  // };

  /**
   * 点击查询功能详情
   * @param functionCode 功能code
   */
  handleClick = (functionCode) => {
    const { multiLanguageValue } = this.state;
    RoleManagementStore.loadRoleByCode(functionCode)
      .then((data) => {
        const function_name = Object.assign({}, multiLanguageValue.function_name, data.__tls.function_name);
        this.setState({
          previewInfo: data,
          preview: true,
          visible: false,
          multiLanguageValue: { function_name },
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  /**
   * 校验编码是否存在
   * @param rule 规则
   * @param name 校验的值
   * @param callback 返回
   */
  checkRoleCode = (rule, name, callback) => {
    const { intl } = this.props;
    if (name !== this.state.roleInfo.functionCode) {
      RoleManagementStore.checkRoleCode(name)
        .then((failed) => {
          if (failed) {
            callback(RoleManagementStore.languages[`${intlPrefix}.code.exist.msg`]);
          } else {
            callback();
          }
        });
    } else {
      callback();
    }
  };

  /**
   * 校验MenuCode是否存在
   * @param rule 规则
   * @param name 校验的值
   * @param callback 返回
   */
  checkMenuCode = (rule, name, callback) => {
    RoleManagementStore.checkMenuCode(name)
      .then((failed) => {
        if (failed) {
          callback(RoleManagementStore.languages[`${intlPrefix}.code.exist.msg`]);
        } else {
          callback();
        }
      });
  };

  /**
   * 通过id获取功能详细信息
   * @param functionCode 功能code
   * @param create 创建 对于functionType的处理
   * @param callback 回调
   */
  getRoleByCode = (functionCode, create, callback) => {
    RoleManagementStore.reset();
    RoleManagementStore.loadRoleByCode(functionCode)
      .then((data) => {
        if (create) {
          this.setState({
            roleInfo: data,
            level: data.level,
            functionType: 'button',
            menuCode: data.menuCode,
            text: [],
          });
        } else {
          this.setState({
            roleInfo: data,
            functionType: 'button',
            menuCode: data.menuCode,
            text: [],
          });
        }
        if (typeof callback === 'function') {
          callback();
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  /**
   * 删除功能
   * @param
   */
  handleDelete = () => {
    const { intl } = this.props;
    const { functionCode, type } = this.state;
    RoleManagementStore.deleteRole(functionCode)
      .then(({ failed, message }) => {
        if (failed) {
          Choerodon.prompt(message);
          this.setState({
            submitting: false,
          });
        } else {
          Choerodon.prompt(RoleManagementStore.languages['delete.success']);
          this.setState({
            visible: false,
            submitting: false,
          });
          this.handleClose();
          // this.onReload();
          this.setState({ loading: true });
          this.loadRoleAndInit(type, '', 0, (data) => {
            if (data === 'done') {
              this.setState({ loading: false });
            }
          });
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  handleClose = () => {
    this.setState({
      open: false,
      functionCode: '',
    });
  };

  handleOpen = () => {
    const { functionCode } = this.state;
    this.state.modalContent = RoleManagementStore.languages[`${intlPrefix}.function.delete`];
    this.setState({
      open: true,
      functionCode,
    });
  };

  onReset = () => {
    this.setState({
      functionCode: '',
      key: '',
      selectedKeys: [],
      text: [],
    });
    this.props.form.resetFields();
  };

  /**
   * 提交表单,创建和保存
   * @param e 表
   */
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      const { intl } = this.props;
      if (!err) {
        const { sub, edit, menuCode, roleInfo, type, multiLanguageValue } = this.state;
        const permissionCodes = [];
        (data.permissions || []).map((items) => {
          permissionCodes.push({
            functionCode: data.functionCode,
            permissionCode: items,
          });
        });

        let tls = {};
        if (multiLanguageValue.function_name) {
          tls = {
            function_name: {
              en_US: multiLanguageValue.function_name.en_US,
              zh_CN: multiLanguageValue.function_name.zh_CN,
            },
          };
        }
        let _permissionCodes;
        let r_permissionCodes;
        let a, b;
        let permissionCodesChanged;
        if(roleInfo.permissionCodes){
          _permissionCodes = JSON.parse(JSON.stringify(permissionCodes));
          r_permissionCodes = JSON.parse(JSON.stringify(roleInfo.permissionCodes));
          for (let i = _permissionCodes.length - 1; i >= 0; i--) {
            a = _permissionCodes[i].permissionCode;
            for (let j = r_permissionCodes.length - 1; j >= 0; j--) {
              b = r_permissionCodes[j].permissionCode;
              if (a === b) {
                _permissionCodes.splice(i, 1);
                r_permissionCodes.splice(j, 1);
                break;
              }
            }
          }
          permissionCodesChanged = _permissionCodes.concat(r_permissionCodes);
        }
        this.setState({
          submitting: true,
        });
        if (edit) {
          RoleManagementStore.updateRole({
              ...roleInfo,
              functionCode: data.functionCode,
              functionDescription: data.functionDescription,
              functionName: data.functionName,
              permissionCodes: permissionCodesChanged,
              __tls: tls,
            })
            .then(({ failed, message }) => {
              if (failed) {
                Choerodon.prompt(message);
                this.setState({
                  submitting: false,
                });
              } else {
                Choerodon.prompt(RoleManagementStore.languages['modify.success']);
                this.setState({
                  visible: false,
                  submitting: false,
                });
                this.onReset();
                // this.onReload();
                this.setState({ loading: true });
                this.loadRoleAndInit(type, '', 0, (data) => {
                  if (data === 'done') {
                    this.setState({ loading: false });
                  }
                });
              }
            })
            .catch((error) => {
              Choerodon.handleResponseError(error);
            });
        } else if (sub) {
          RoleManagementStore.createRole({
              ...roleInfo,
              functionCode: data.functionCode,
              functionDescription: data.functionDescription,
              functionName: data.functionName,
              parentFunctionCode: roleInfo.functionCode || roleInfo.parentFunctionCode,
              functionType: type === 'other' ? 'function' : 'button',
              permissionCodes,
              id: null,
              __tls: tls,
            }, type)
            .then(({ failed, message }) => {
              if (failed) {
                Choerodon.prompt(message);
                this.setState({
                  submitting: false,
                });
              } else {
                Choerodon.prompt(RoleManagementStore.languages['create.success']);
                this.setState({
                  visible: false,
                  submitting: false,
                  text: [],
                });
                this.onReset();
                // this.onReload();
                this.setState({ loading: true });
                this.loadRoleAndInit(type, '', 0, (data) => {
                  if (data === 'done') {
                    this.setState({ loading: false });
                  }
                });
              }
            })
            .catch((error) => {
              this.setState({
                submitting: false,
              });
              Choerodon.handleResponseError(error);
            });
        } else {
          RoleManagementStore.createRole({
              ...roleInfo,
              functionCode: data.functionCode,
              functionDescription: data.functionDescription,
              functionName: data.functionName,
              functionType: type === 'other' ? 'function' : 'button',
              permissionCodes,
              id: null,
              __tls: tls,
            }, type)
            .then(({ failed, message }) => {
              if (failed) {
                Choerodon.prompt(message);
                this.setState({
                  submitting: false,
                });
              } else {
                Choerodon.prompt(RoleManagementStore.languages['create.success']);
                this.setState({
                  visible: false,
                  submitting: false,
                  text: '',
                });
                this.onReset();
                this.setState({ loading: true });
                this.loadRoleAndInit(type, '', 0, (data) => {
                  if (data === 'done') {
                    this.setState({ loading: false });
                  }
                });
              }
            })
            .catch((error) => {
              this.setState({
                submitting: false,
              });
              Choerodon.handleResponseError(error);
            });
        }
      }
    });
  };

  /**
   * 返回提示
   * @param e 表单
   */
  handleCancel = (e) => {
    this.setState({
      visible: false,
      submitting: false,
    });
    // const { intl } = this.props;
    // this.props.form.validateFieldsAndScroll((err, data, modify) => {
    //   if (!modify) {
    //     this.setState({
    //       visible: false,
    //       submitting: false,
    //     });
    //   } else {
    //     Modal.confirm({
    //       title: RoleManagementStore.languages.form['cancel.title'],
    //       content: RoleManagementStore.languages.form['cancel.content'],
    //       onOk: () => (
    //         this.setState({
    //           visible: false,
    //           submitting: false,
    //         })
    //       ),
    //     });
    //   }
    // });
  };

  /**
   * 处理功能类型变化
   * @param
   */
  handleFunctionType = (e) => {
    if (e.target.value === 'button' || e.target.value === 'default') {
      RoleManagementStore.setRoleManagementApi('/iam/v1/permission/lov/query');
      this.setState({ menuCode: '' });
    } else {
      RoleManagementStore.setRoleManagementApi('/iam/v1/custom/menu');
      this.setState({ text: [] });
    }
    this.setState({ functionType: e.target.value });
  };

  /**
   * 处理层级变化
   * @param
   */
  handleLevel = (e) => {
    this.setState({ level: e.target.value });
  };

  sychronizeMenu() {
    RoleManagementStore.sychronizeAllMenu().then((success) => {
      if (success === true) {
        Choerodon.prompt(RoleManagementStore.languages[`${intlPrefix}.sychronizeMenuSuccessfully`]);
      } else {
        Choerodon.prompt(RoleManagementStore.languages[`${intlPrefix}.sychronizeMenuUnSuccessfully`]);
      }
      // this.onReload();
      this.setState({ loading: true });
      this.loadRoleAndInit(this.state.type, '', 0, (data) => {
        if (data === 'done') {
          this.setState({ loading: false });
        }
      });
    }).catch((error) => {
      Choerodon.handleResponseError(error);
    });
  }


  getApiSelect = (value, callback) => {
    let currentValue;
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    currentValue = value;

    function fake() {
      if (value.length > 2) {
        RoleManagementStore.loadApi(value)
          .then((d) => {
            if (currentValue === value) {
              const data = [];
              d.forEach((r) => {
                data.push({
                  code: r.code,
                  id: r.id,
                });
              });
              callback(data);
            }
          }).catch(error => Choerodon.handleResponseError(error));
      }
    }

    timeout = setTimeout(fake, 1000);
  };

  handleApiSearch = value => {
    this.getApiSelect(value, data => {
      this.setState({
        apiDataChildren: data,
      });
    });
  };

  renderTreeNode = (item) => {
    if (Array.isArray(item.children) && item.children.length) {
      return (
        <TreeNode
          title={this.onTitle(item.functionName, item.functionCode, item.functionType, item.treeFloor)}
          key={item.functionCode}
          dataRef={item}
        >
          {item.children.map(this.renderTreeNode)}
        </TreeNode>);
    }
    return (
      <TreeNode
        title={this.onTitle(item.functionName, item.functionCode, item.functionType, item.treeFloor)}
        key={item.functionCode}
        dataRef={item}
      />);
  };

  /* 获取系统支持的语言环境 */
  getLanguage = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setState({
          languageEnv: allLanguage,
        });
      });
  };

  renderForm = () => {
    const { getFieldDecorator } = this.props.form;
    const { intl } = this.props;
    const { edit, sub, roleInfo, apiDataChildren, type } = this.state;
    const isMenu = roleInfo.functionType === 'menu';
    let permissionCodes = [];
    if (roleInfo.permissionCodes && roleInfo.permissionCodes.length > 0) {
      roleInfo.permissionCodes.map((items) => {
        permissionCodes.push({
          permissionCodes: items.permissionCode,
          isBarely: items.isBarely,
        });
      });
    }

    const apiOption = apiDataChildren.map(d => <Option value={d.code} key={d.id}>{d.code}</Option>);

    const menuFormData = [
      {
        conditionFieldName: 'menuCode',
        conditionFieldSelectCode: 'Y',
        conditionFieldSequence: 2,
        conditionFieldType: 'input',
        conditionFieldWidth: 200,
        description: RoleManagementStore.languages[`${intlPrefix}.menuCode`],
        gridFieldAlign: 'left',
        gridFieldName: 'code',
        gridFieldSequence: 2,
        gridFieldWidth: 350,
        isConditionField: 'Y',
        isGridField: 'Y',
      },
      {
        conditionFieldName: 'menuName',
        conditionFieldSelectCode: 'Y',
        conditionFieldSequence: 2,
        conditionFieldType: 'input',
        conditionFieldWidth: 200,
        description: RoleManagementStore.languages[`${intlPrefix}.menuName`],
        gridFieldAlign: 'left',
        gridFieldName: 'name',
        gridFieldSequence: 2,
        gridFieldWidth: 350,
        isConditionField: 'Y',
        isGridField: 'Y',
      }];

    const formData = [{
      conditionFieldName: 'serviceName',
      conditionFieldSelectCode: 'Y',
      conditionFieldSequence: 2,
      conditionFieldType: 'input',
      conditionFieldWidth: 200,
      description: RoleManagementStore.languages[`${intlPrefix}.serviceName`],
      gridFieldAlign: 'left',
      gridFieldName: 'serviceName',
      gridFieldSequence: 2,
      gridFieldWidth: 200,
      isConditionField: 'Y',
      isGridField: 'Y',
    }, {
      conditionFieldName: 'code',
      conditionFieldSelectCode: 'Y',
      conditionFieldSequence: 2,
      conditionFieldType: 'input',
      conditionFieldWidth: 200,
      description: RoleManagementStore.languages[`${intlPrefix}.code`],
      gridFieldAlign: 'left',
      gridFieldName: 'code',
      gridFieldSequence: 2,
      gridFieldWidth: 350,
      isConditionField: 'Y',
      isGridField: 'Y',
    }, {
      conditionFieldName: 'path',
      conditionFieldSelectCode: 'Y',
      conditionFieldSequence: 2,
      conditionFieldType: 'input',
      conditionFieldWidth: 200,
      description: RoleManagementStore.languages[`${intlPrefix}.path`],
      gridFieldAlign: 'left',
      gridFieldName: 'path',
      gridFieldSequence: 2,
      gridFieldWidth: 350,
      isConditionField: 'Y',
      isGridField: 'Y',
    }];

    const isOtherRoot = type === 'other' && !sub && !roleInfo.parentFunctionName;

    return (
      <Form className="yqcloud-role-form" layout="vertical">
        <div className="role-item">
          {RoleManagementStore.languages[`${intlPrefix}.parentRole`]}
          <span>{sub ? roleInfo.functionName || '-' : roleInfo.parentFunctionName || '-'}</span>
        </div>
        <FormItem>
          {getFieldDecorator('functionName', {
            rules: [{
              required: true,
              message: RoleManagementStore.languages[`${intlPrefix}.functionName`],
            }],
            initialValue: edit ? roleInfo.functionName : '',
          })(
            (isMenu && edit) ? <Input
              disabled={isMenu}
              autoComplete="off"
              label={RoleManagementStore.languages[`${intlPrefix}.functionName`]}
              maxLength={50}
            /> : <MultiLanguageFormItem
              label={RoleManagementStore.languages[`${intlPrefix}.functionName`]}
              requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.function_name : {}}
              requestUrl="true"
              handleMultiLanguageValue={({ retObj, retList }) => {
                // 将多语言的值设置到当前表单
                this.props.form.setFieldsValue({
                  functionName: retObj[this.props.AppState.currentLanguage],
                });
                this.setState({
                  multiLanguageValue: {
                    ...this.state.multiLanguageValue,
                    function_name: retObj,
                  },
                  multiLanguageList: retList,
                });
              }}
              maxLength={60}
              type="FormItem"
              FormLanguage={this.state.multiLanguageValue}
              descriptionObject={RoleManagementStore.languages.multiLanguage}
              languageEnv={this.state.languageEnv}
              required="true"
            />,
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('functionCode', {
            rules: [
              {
                required: true,
                whitespace: true,
                message: RoleManagementStore.languages[`${intlPrefix}.functionCode`],
              },
              // {
              //   pattern: /^[A-Z0-9]{0,50}$/,
              //   message: RoleManagementStore.languages[`${intlPrefix}.code.test.msg`],
              // },
              {
                validator: this.checkRoleCode,
              },
            ],
            // normalize: (value) => {
            //   if (value) {
            //     return value.toUpperCase();
            //   }
            // },
            initialValue: edit ? roleInfo.functionCode : '',
            validateTrigger: 'onBlur',
            validateFirst: true,
          })(
            <Input
              disabled={edit}
              autoComplete="off"
              label={RoleManagementStore.languages[`${intlPrefix}.functionCode`]}
              maxLength={50}
            />,
          )}
        </FormItem>
        <FormItem>
          {getFieldDecorator('functionDescription', {
            rules: [
              {
                // required: true,
                whitespace: true,
                message: RoleManagementStore.languages[`${intlPrefix}.roleDescription`],
              },
            ],
            initialValue: edit ? roleInfo.roleDescription : '',
            validateTrigger: 'onBlur',
            validateFirst: true,
          })(
            <Input
              disabled={edit}
              autoComplete="off"
              label={RoleManagementStore.languages[`${intlPrefix}.roleDescription`]}
              maxLength={200}
            />,
          )}
        </FormItem>
        <div>
          <FormItem>
            {getFieldDecorator('permissions', {
              initialValue: edit ? permissionCodes.map((items) => items.permissionCodes) : undefined,
            })(
              <Select
                mode={'multiple'}
                defaultActiveFirstOption={false}
                showArrow={false}
                filterOption={false}
                placeholder={'Api'}
                onFilterChange={this.handleApiSearch}
                filter
              >
                {apiOption}
              </Select>,
            )}
          </FormItem>
        </div>
        <br />
        <div style={{ marginTop: 30 }}>
          <Row>
            <Col span={6}>
              {
                edit ? (
                  <Button
                    type="primary"
                    loading={this.state.submitting}
                    onClick={e => this.handleSubmit(e)}
                  >
                    {RoleManagementStore.languages.save}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    loading={this.state.submitting}
                    onClick={e => this.handleSubmit(e)}
                  >
                    {RoleManagementStore.languages.create}
                  </Button>
                )
              }
            </Col>
            <Col span={6}>
              <Button
                onClick={() => this.handleCancel()}
              >
                {RoleManagementStore.languages.cancel}
              </Button>
            </Col>
          </Row>
        </div>
      </Form>
    );
  };

  renderPreview = () => {
    const { previewInfo, menuCode } = this.state;
    const { permissionCodes } = previewInfo;
    const permissions = [];
    if (permissionCodes.length > 0) {
      permissions.splice(0, permissions.length);
      permissionCodes.forEach((item) => {
        permissions.push(<div>{item.permissionCode || ''}</div>);
      });
    }
    return (
      <div className="yqcloud-role-view">
        <div className="role-item">
          {RoleManagementStore.languages[`${intlPrefix}.parentRole`]}
          <span>{previewInfo.parentFunctionName || '-'}</span>
        </div>
        <div className="role-item">
          {RoleManagementStore.languages[`${intlPrefix}.functionName`]}
          <span>{previewInfo.functionName || ''}</span>
        </div>
        <div className="role-item">
          {RoleManagementStore.languages[`${intlPrefix}.functionCode`]}
          <span>{previewInfo.functionCode || ''}</span>
        </div>
        <div className="role-item">
          {RoleManagementStore.languages[`${intlPrefix}.roleDescription`]}
          <span>{previewInfo.roleDescription || ''}</span>
        </div>
        {/*<div className="role-item">*/}
        {/*{RoleManagementStore.languages[`${intlPrefix}.level`]}*/}
        {/*{previewInfo.level ? <FormattedMessage id={previewInfo.level} defaultMessage="-"/> : <span>-</span>}*/}
        {/*</div>*/}
        <div className="role-item">
          {RoleManagementStore.languages[`${intlPrefix}.functionType`]}
          {previewInfo.functionType ? <FormattedMessage id={previewInfo.functionType} defaultMessage="-" /> :
            <span>-</span>}
        </div>
        <div className="role-item">
          {RoleManagementStore.languages[`${intlPrefix}.permissions`]}
          <div className={"role-item-permissions"}>{permissions.length > 0 ? permissions : '-'}</div>
        </div>
      </div>
    );
  };

  selectFunctionType = (type) => {
    const { isMenuType } = this.state;
    this.setState({
      type,
      isMenuType: !isMenuType,
      loading: true,
      functionCode: '',
      functionType: '',
      key: '',
      preview: false,
      visible: false,
    });
    this.setState({ loading: true });
    this.loadRoleAndInit(type, '', 0, (data) => {
      if (data === 'done') {
        this.setState({ loading: false });
      }
    });
  };

  render() {
    const { intl } = this.props;
    const { subButtonAble, treeData } = this.state;

    return (
      <Page
        service={[
          'iam-service.site-function.createIamFunction',
          'iam-service.site-function.updateIamFunction',
          'iam-service.site-function.deleteIamFunctionByCode',
          'iam-service.site-function.selectFunctionByNeed',
          'iam-service.site-function.selectLeafFunction',
          'iam-service.site-function.searchByName',
          'iam-service.site-function.checkCode',
          'iam-service.permission-self.getPermission',
          'iam-service.xls.uploadXls',
          'iam-service.xls.importDataByExcel',
        ]}
      >
        <Remove
          open={this.state.open}
          handleCancel={this.handleClose}
          handleConfirm={this.handleDelete}
          modalContent={this.state.modalContent}
        />
        <Header
          title={RoleManagementStore.languages[`${intlPrefix}.header.title`]}
        >
          <Upload
            showUploadList={false}
            action={`${process.env.API_HOST}/iam/v1/xls`}
            accept=".xls, .xlsx"
            headers={{
              Authorization: `bearer ${Choerodon.getCookie('access_token')}`,
              'X-Client-ID': CLIENT_ID,
              'X-Client-Type': CLIENT_TYPE,
            }}
            onChange={(info) => {
              if (info.file.status === 'done') {
                message.success(`${info.file.name} file uploaded successfully`);
              } else if (info.file.status === 'error') {
                message.error(`${info.file.name}${RoleManagementStore.languages['import.failed']}`);
              }
            }}
          >

            <Button style={{ color: '#04173F' }}>
              <Icon type="file_upload" style={{ color: '#2196F3', width: 25 }} />
              {RoleManagementStore.languages.import}
            </Button>
          </Upload>

          <Button
            onClick={this.exportTree}
            style={{ color: '#04173F' }}
          >
            <Icon type="get_app" style={{ color: '#2196F3', width: 25 }} />
            {RoleManagementStore.languages.export}
          </Button>

          {/* <Button
            onClick={this.sychronizeMenu}
            style={{ color: '#04173F', display: 'none' }}
          >
            <Icon type="autorenew" style={{ color: '#2196F3', width: 25 }} />
            {RoleManagementStore.languages[`${intlPrefix}.sychronizeMenu`]}
          </Button> */}


        </Header>
        <Spin spinning={this.state.loading}>
          <div className="yqcloud-role">
            <div className="yqcloud-title">
              <Tabs defaultActiveKey="menuFunction" onChange={this.selectFunctionType}>
                <TabPane tab={RoleManagementStore.languages[`${intlPrefix}.menuFunction`]} key="button" />
                <TabPane tab={RoleManagementStore.languages[`${intlPrefix}.otherFunction`]} key="other" />
              </Tabs>
            </div>
            {
              this.state.isMenuType ?
                <Row gutter={10}>
                  <Col xl={10} lg={11} md={11} sm={11} xs={11}>
                    <div className="role-card">
                      <div>
                        <Search
                          defaultValue={this.state.searchValue}
                          placeholder={RoleManagementStore.languages.search}
                          style={{ width: '100%' }}
                          enterButton
                          onSearch={this.handleSearch}
                        />
                        <div className="role-action">
                          <Button disabled={subButtonAble} key="submit" type="primary"
                                  onClick={this.handleAction.bind(this, 'sub')}>
                            {RoleManagementStore.languages[`${intlPrefix}.create.subRole`]}
                          </Button>
                          {/*<Button key="submit" type="primary" onClick={this.handleAction.bind(this, 'level')}>*/}
                          {/*{RoleManagementStore.languages[`${intlPrefix}.create.levelRole`]}*/}
                          {/*</Button>*/}
                          <Button key="back" onClick={this.handleAction.bind(this, 'edit')}>
                            {RoleManagementStore.languages.modify}
                          </Button>
                        </div>
                      </div>
                      <Tree
                        className="draggable-tree"
                        defaultExpandedKeys={this.state.expandedKeys}
                        expandedKeys={this.state.expandedKeys}
                        selectedKeys={this.state.selectedKeys}
                        onExpand={this.onExpand}
                        // loadData={this.onLoadData}
                        onSelect={this.onSelect}
                      >
                        {this.state.treeData.map(this.renderTreeNode)}
                      </Tree>
                    </div>
                  </Col>
                  <Col xl={1} lg={2} md={2} sm={2} xs={2}>
                    {this.state.visible || this.state.preview ? (
                      <div className="icon-role">
                        <i className="icon-zhishifenlei-xiugaicedan icon" />
                      </div>
                    ) : ''}
                  </Col>
                  <Col xl={10} lg={11} md={11} sm={11} xs={11}>
                    {
                      this.state.visible ? (
                        this.renderForm()
                      ) : ''}
                    {
                      this.state.preview ? (
                        this.renderPreview()
                      ) : ''}
                  </Col>
                </Row>
                :
                <Row gutter={10}>
                  <Col xl={10} lg={11} md={11} sm={11} xs={11}>
                    <div className="role-card">
                      <div>
                        <Search
                          defaultValue={this.state.searchValue}
                          placeholder={RoleManagementStore.languages.search}
                          style={{ width: '100%' }}
                          enterButton
                          onSearch={this.handleSearch}
                        />
                        <div className="role-action">
                          <Button key="submit" type="primary" onClick={this.handleAction.bind(this, 'sub')}>
                            {RoleManagementStore.languages[`${intlPrefix}.create.subRole`]}
                          </Button>
                          <Button
                            disabled={treeData && treeData.length === 0}
                            key="submit" type="primary" onClick={this.handleAction.bind(this, 'level')}>
                            {RoleManagementStore.languages[`${intlPrefix}.create.levelRole`]}
                          </Button>
                          <Button
                            disabled={treeData && treeData.length === 0}
                            key="back" onClick={this.handleAction.bind(this, 'edit')}>
                            {RoleManagementStore.languages.modify}
                          </Button>
                        </div>
                      </div>
                      <Tree
                        className="draggable-tree"
                        defaultExpandedKeys={this.state.expandedKeys}
                        expandedKeys={this.state.expandedKeys}
                        selectedKeys={this.state.selectedKeys}
                        onExpand={this.onExpand}
                        // loadData={this.onLoadData}
                        onSelect={this.onSelect}
                      >
                        {this.state.treeData.map(this.renderTreeNode)}
                      </Tree>
                    </div>
                  </Col>
                  <Col xl={1} lg={2} md={2} sm={2} xs={2}>
                    {this.state.visible || this.state.preview ? (
                      <div className="icon-role">
                        <i className="icon-zhishifenlei-xiugaicedan icon" />
                      </div>
                    ) : ''}
                  </Col>
                  <Col xl={10} lg={11} md={11} sm={11} xs={11}>
                    {
                      this.state.visible ? (
                        this.renderForm()
                      ) : ''}
                    {
                      this.state.preview ? (
                        this.renderPreview()
                      ) : ''}
                  </Col>
                </Row>
            }
          </div>
        </Spin>
      </Page>
    );
  }
}

export default withRouter(RoleManagement);
