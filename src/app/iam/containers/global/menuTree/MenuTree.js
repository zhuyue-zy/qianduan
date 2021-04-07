/*eslint-disable*/
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Button, Form, Icon, IconSelect, Input, Modal, Table, Tabs, Tooltip, Select } from 'yqcloud-ui';
import { axios, Content, Header, Page, Permission, stores } from 'yqcloud-front-boot';
import _ from 'lodash';
import {
  adjustSort,
  canDelete,
  defineLevel,
  deleteNode,
  findParent,
  hasDirChild,
  isChild,
  normalizeMenus,
} from './util';
import { FormattedMessage, injectIntl } from 'react-intl';
import './MenuTree.scss';
import PermissionStore from '../../../stores/globalStores/permission';
import MultiLanguageFormItem from '../../../components/NewMultiLanguageFormItem';

const { MenuStore } = stores;
const intlPrefix = 'global.menusetting';

let currentDropOverItem;
let currentDropSide;
let dropItem;

function addDragClass(currentTarget, dropSide) {
  if (dropSide) {
    currentDropOverItem = currentTarget;
    currentDropSide = dropSide;
    currentDropOverItem.classList.add(dropSideClassName(currentDropSide));
  }
}

function removeDragClass() {
  if (currentDropOverItem && currentDropSide) {
    currentDropOverItem.classList.remove(dropSideClassName(currentDropSide));
  }
}

function dropSideClassName(side) {
  return `drop-row-${side}`;
}

const { Sidebar } = Modal;
const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
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

@Form.create({})
@withRouter
@injectIntl
@inject('AppState')
@observer
class MenuTree extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      loading: false,
      submitting: false,
      menuGroup: {},
      type: 'site',
      selectType: 'create',
      sidebar: false,
      selectMenuDetail: {},
      dragData: null,
      tempDirs: [],
      menuOptions: [],
      // 存放多语言信息
      multiLanguageValue: {
        name: {},
      },
      multiLanguageList: [],
    };
  }

  componentWillMount() {
    this.initMenu();
    this.loadLanguage();
    this.getLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const id = 0;
    PermissionStore.queryLanguage(id, AppState.currentLanguage);
  };

  //初始化类型
  initMenu(type) {
    const { menuGroup, type: typeState, menuOptions } = this.state;
    type = type || typeState;
    this.setState({ loading: true });
    axios.get(`/iam/v1/menus/tree?level=${type}`)
      .then(value => {
        value.map((items) => {
          if (items.type === 'root') {
            menuOptions.push(items);
          }
          items.subMenus.map((items) => {
            if (items.type === 'dir') {
              menuOptions.push(items);
            }
          });
        });
        menuGroup[type] = normalizeMenus(value);
        this.setState({
          menuGroup,
          loading: false,
        });
      })
      .catch(error => {
        Choerodon.handleResponseError(error);
        this.setState({ loading: false });
      });
  }

  //选择菜单类型
  selectMenuType = (type) => {
    const { menuOptions } = this.state;
    if (menuOptions) {
      menuOptions.splice(0, menuOptions.length);
    }
    this.initMenu(type);
    this.setState({
      type,
    });
  };
  //关闭sidebar
  closeSidebar = () => {
    this.setState({
      sidebar: false,
    });
  };
  //创建目录，弹出sidebar
  addDir = () => {
    this.props.form.resetFields();
    this.setState({
      selectType: 'create',
      sidebar: true,
      selectMenuDetail: {},
    });
  };
  //查看细节，弹出sidebar,设置选中的菜单或目录
  detailMenu = (record) => {
    console.log(record);
    const { multiLanguageValue } = this.state;
    this.props.form.resetFields();
    const name = Object.assign({}, multiLanguageValue.name, record.__tls.name);
    this.setState({
      selectType: 'detail',
      sidebar: true,
      selectMenuDetail: record,
      multiLanguageValue: { name },
    });
  };
  //修改菜单,弹出sidebar,设置选中的菜单或目录
  changeMenu = (record) => {
    this.props.form.resetFields();
    this.setState({
      selectType: 'edit',
      sidebar: true,
      selectMenuDetail: record,
    });
  };
  checkCode = (rule, value, callback) => {
    const { intl } = this.props;
    const { type, tempDirs } = this.state;
    const errorMsg = PermissionStore.languages[`${intlPrefix}.directory.code.onlymsg`];
    if (tempDirs.find(({ code }) => code === value)) {
      callback(errorMsg);
    } else {
      axios.post(`/iam/v1/menus/check`, JSON.stringify({ code: value, level: type, type: 'dir' }))
        .then((mes) => {
          if (mes.failed) {
            callback(errorMsg);
          } else {
            callback();
          }
        })
        .catch(error => {
          Choerodon.handleResponseError(error);
          callback(false);
        });
    }
  };
  //删除菜单
  deleteMenu = (record) => {
    const { intl } = this.props;
    const { menuGroup, type, tempDirs } = this.state;
    const index = tempDirs.findIndex(({ code }) => code === record.code);
    if (index !== -1) {
      tempDirs.splice(index, 1);
    }
    deleteNode(menuGroup[type], record);
    this.setState({
      menuGroup,
      tempDirs,
    });
    Choerodon.prompt(PermissionStore.languages[`${intlPrefix}.delete.success`]);
  };

  handleDelete = (record) => {
    const { intl } = this.props;
    Modal.confirm({
      title: PermissionStore.languages[`${intlPrefix}.delete.owntitle`],
      content: record.subMenus && record.subMenus.length ? PermissionStore.languages[`${intlPrefix}.delete.owncontent.hassub`]
        : PermissionStore.languages[`${intlPrefix}.delete.owncontent`]`${record.name}?`,
      onOk: () => {
        this.deleteMenu(record);
      },
    });
  };
  handleRefresh = () => {
    const { type, menuGroup } = this.state;
    this.setState({
      menuGroup: {
        [type]: menuGroup[type],
      },
    }, () => {
      this.initMenu();
    });
  };

  //创建添加的状态请求
  handleOk = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, { code, name, icon, belong }) => {
      if (!err) {
        const { selectType, menuGroup, selectMenuDetail, type, tempDirs, multiLanguageValue } = this.state;
        switch (selectType) {
          case 'create':
            const menu = {
              code,
              icon,
              name,
              default: false,
              level: type,
              type: 'dir',
              parentId: 0,
              subMenus: null,
              __tls : {
                name : {
                  en_US: multiLanguageValue.name.en_US,
                  zh_CN: multiLanguageValue.name.zh_CN,
                }
              }
            };
            defineLevel(menu, 0);
            menuGroup[type].push(menu);
            tempDirs.push(menu);
            Choerodon.prompt(PermissionStore.languages[`${intlPrefix}.create.success`]);
            break;
          case 'edit':
            selectMenuDetail.name = name;
            selectMenuDetail.icon = icon;
            Choerodon.prompt(PermissionStore.languages[`${intlPrefix}.modify.success`]);
            break;
          case 'detail':
            // menuGroup[type].map((items) => {
            //   if (items.id === selectMenuDetail.parentId) {
            //     items.subMenus.splice(items.subMenus.findIndex(v => v.id === selectMenuDetail.id),1);
            //   } else {
            //     items.subMenus.map((items) => {
            //       if (items.id === selectMenuDetail.parentId) {
            //         items.subMenus.splice(items.subMenus.findIndex(v => v.id === selectMenuDetail.id),1);
            //       }
            //     });
            //   }
            // });
            // deleteNode(menuGroup[type], selectMenuDetail);
            selectMenuDetail.name = name;
            selectMenuDetail.icon = icon;
            if(multiLanguageValue.name) {
              selectMenuDetail.enName =  multiLanguageValue.name.en_US;
              selectMenuDetail.zhName =  multiLanguageValue.name.zh_CN;
            }
            if(multiLanguageValue.name) {
              selectMenuDetail.__tls.name = {
                en_US: multiLanguageValue.name.en_US,
                zh_CN: multiLanguageValue.name.zh_CN,
              };
            }
            selectMenuDetail.parentId = belong;
            // menuGroup[type].map((items) => {
            //   if (items.id === belong) {
            //     items.subMenus.unshift(selectMenuDetail);
            //   } else {
            //     items.subMenus.map((items) => {
            //       if (items.id === belong) {
            //         items.subMenus.unshift(selectMenuDetail);
            //       }
            //     });
            //   }
            // });
            axios.post(`/iam/v1/menus/${selectMenuDetail.id}`, selectMenuDetail)
              .then(menus => {
                if (menus.failed) {
                  Choerodon.prompt(menus.message);
                }
                this.selectMenuType(type);
                Choerodon.prompt(PermissionStore.languages['save.success']);
              })
              .catch(error => {
                Choerodon.handleResponseError(error);
              });
            break;
        }
        this.setState({
          sidebar: false,
          menuGroup,
          tempDirs,
        });
      }
    });
  };

  // 创建目录的3个状态
  getSidebarTitle = (selectType) => {
    switch (selectType) {
      case 'create':
        return PermissionStore.languages[`${intlPrefix}.create.org`];
      case 'edit':
        return PermissionStore.languages[`${intlPrefix}.modify.org`];
      case 'detail':
        return PermissionStore.languages[`${intlPrefix}.detail`];
    }
  };

  //创建3个状态的sidebar渲染
  getSidebarContent(selectType) {
    const { selectMenuDetail: { name } } = this.state;
    let formDom, code, values;
    switch (selectType) {
      case 'create':
        code = PermissionStore.languages[`${intlPrefix}.create`];
        values = { name: `${process.env.HEADER_TITLE_NAME || 'Choerodon'}` };
        formDom = this.getDirNameDom();
        break;
      case 'edit':
        code = PermissionStore.languages[`${intlPrefix}.modify`];
        values = { name };
        formDom = this.getDirNameDom();
        break;
      case 'detail':
        code = PermissionStore.languages[`${intlPrefix}.detail`];
        values = { name };
        formDom = this.getDetailDom();
        break;
    }
    return (
      <div>
        <Content
          className="sidebar-content"
        >
          {formDom}
        </Content>
      </div>);
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

  //查看详情
  getDetailDom() {
    const { level } = this.state.selectMenuDetail;
    const { getFieldDecorator } = this.props.form;
    const { selectMenuDetail = {}, menuOptions } = this.state;
    const selectMenuOptions = [];
    menuOptions.forEach((items) => {
      selectMenuOptions.push(<Option key={items.id} value={items.id}>{items.name}</Option>);
    });
    return (
      <div>
        <Form layout="vertical">
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('name', {
              rules: [{
                required: true,
                whitespace: true,
                message: PermissionStore.languages[`${intlPrefix}.directory.name.require`],
              }],
              validateTrigger: 'onBlur',
              initialValue: selectMenuDetail.name,
              // initialValue: selectLanguage[this.props.AppState.currentLanguage],
            })(
              <MultiLanguageFormItem
                label={PermissionStore.languages[`${intlPrefix}.directory.name`]}
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
                maxLength={60}
                type="FormItem"
                inputWidth={512}
                FormLanguage={this.state.multiLanguageValue}
                descriptionObject={PermissionStore.languages.multiLanguage}
                languageEnv={this.state.languageEnv}
                required="true"
              />
              ,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >{getFieldDecorator('code', {
            initialValue: selectMenuDetail.code,
          })(
            <Input
              autoComplete="off"
              label={PermissionStore.languages[`${intlPrefix}.directory.code`]}
              style={{ width: inputWidth }}
              disabled={true}
            />)}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            <Input
              value={level}
              label={PermissionStore.languages[`${intlPrefix}.menu.level`]}
              autoComplete="off"
              disabled={true}
              style={{ width: inputWidth }}
            />
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('belong', {
              initialValue: selectMenuDetail.parentId,
            })(
              <Select
                label={PermissionStore.languages[`${intlPrefix}.belong.root`]}
                style={{ width: inputWidth }}
              >
                {selectMenuOptions}
              </Select>,
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
          >
            {getFieldDecorator('icon', {
              rules: [{
                required: true,
                message: PermissionStore.languages[`${intlPrefix}.icon.require`],
              }],
              validateTrigger: 'onChange',
              initialValue: selectMenuDetail.icon,
            })(
              <IconSelect
                label={PermissionStore.languages[`${intlPrefix}.icon`]}
                style={{ width: inputWidth }}
              />,
            )}
          </FormItem>
        </Form>
        <div className="permission-list" style={{ width: inputWidth }}>
          <p>{PermissionStore.languages[`${intlPrefix}.menu.permission`]}</p>
          {
            selectMenuDetail.permissions && selectMenuDetail.permissions.length > 0 ? selectMenuDetail.permissions.map(
              ({ code }) => <div key={code}><span>{code}</span></div>,
            ) : PermissionStore.languages[`${intlPrefix}.menu.withoutpermission`]
          }
        </div>
      </div>
    );
  }

  //created FormDom渲染
  getDirNameDom() {
    const { intl } = this.props;
    const { getFieldDecorator } = this.props.form;
    const { selectType, selectMenuDetail = {} } = this.state;
    const codeRules = selectType === 'create' && [{
      required: true,
      whitespace: true,
      message: PermissionStore.languages[`${intlPrefix}.directory.code.require`],
    }, {
      pattern: /^[a-z]([-.a-z0-9]*[a-z0-9])?$/,
      message: PermissionStore.languages[`${intlPrefix}.directory.code.pattern`],
    }, {
      validator: this.checkCode,
    }];
    return (
      <Form layout="vertical">
        <FormItem
          {...formItemLayout}
        >
          {getFieldDecorator('code', {
            rules: codeRules || [],
            validateTrigger: 'onBlur',
            validateFirst: true,
            initialValue: selectMenuDetail.code,
          })(
            <Input
              autoComplete="off"
              label={PermissionStore.languages[`${intlPrefix}.directory.code`]}
              style={{ width: inputWidth }}
              disabled={selectType === 'edit'}
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
              message: PermissionStore.languages[`${intlPrefix}.directory.name.require`],
            }],
            validateTrigger: 'onBlur',
            initialValue: selectMenuDetail.name,
          })(
            <MultiLanguageFormItem
              label={PermissionStore.languages[`${intlPrefix}.directory.name`]}
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
              maxLength={60}
              type="FormItem"
              inputWidth={512}
              FormLanguage={this.state.multiLanguageValue}
              descriptionObject={PermissionStore.languages.multiLanguage}
              languageEnv={this.state.languageEnv}
              required="true"
            />
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
        >
          {getFieldDecorator('icon', {
            rules: [{
              required: true,
              message: PermissionStore.languages[`${intlPrefix}.icon.require`],
            }],
            validateTrigger: 'onChange',
            initialValue: selectMenuDetail.icon,
          })(
            <IconSelect
              label={PermissionStore.languages[`${intlPrefix}.icon`]}
              style={{ width: inputWidth }}
            />,
          )}
        </FormItem>
      </Form>
    );
  }

  getRowKey = (record) => {
    return `${record.parentId} - ${record.code}`;
  };

  //判断是否能拖拽
  checkDraggable(record) {
    const { dragData } = this.state;
    return !dragData || (dragData !== record && !isChild(dragData, record));
  }

  //判断是否能拖放
  checkDroppable(record) {
    const { dragData } = this.state;
    return dragData && dragData !== record &&
      (this.checkDropIn(record) || this.checkDropBesides(record)) && !isChild(dragData, record);
  }

  //判断是否能拖入
  checkDropIn(record) {
    const { dragData } = this.state;
    return dragData && record.type !== 'menu' && dragData.type !== 'root' && !hasDirChild(dragData) &&
      record.__level__ < (dragData.type === 'dir' ? 1 : 2);
  }

  //判断是否能插在前后
  checkDropBesides(record) {
    const { dragData } = this.state;
    return dragData && (
      record.__level__ === 0 ? dragData.type !== 'menu' :
        (dragData.type !== 'root' && !hasDirChild(dragData))
    );
  }

  //拖拽离开目标
  handleDragLeave() {
    removeDragClass();
    dropItem = null;
  }

  //拖拽开始
  handleDragtStart(dragData, e) {
    e.dataTransfer.setData('text', 'choerodon');
    document.body.ondrop = function (event) {
      event.preventDefault();
      event.stopPropagation();
    };
    this.setState({
      dragData,
    });
  }

  //拖拽结束
  handleDragEnd = () => {
    removeDragClass();
    if (dropItem) {
      this.handleDrop(dropItem);
    }
    this.setState({
      dragData: null,
    });
  };

  //拖拽目标位置
  handleDragOver(record, e) {
    e.preventDefault();
    const canAddIn = this.checkDropIn(record);
    const canAddBesides = this.checkDropBesides(record);
    if (canAddIn || canAddBesides) {
      dropItem = record;
      const { currentTarget, pageY, dataTransfer } = e;
      const { top, height } = currentTarget.getBoundingClientRect();
      let before = height / 2;
      let after = before;
      let dropSide;
      if (canAddIn) {
        before = height / 3;
        after = before * 2;
        dropSide = 'in';
        dataTransfer.dropEffect = 'copy';
      }
      if (canAddBesides) {
        const y = pageY - top;
        if (y < before) {
          dropSide = 'before';
          dataTransfer.dropEffect = 'move';
        } else if (y >= after) {
          dropSide = 'after';
          dataTransfer.dropEffect = 'move';
        }
      }
      removeDragClass();
      addDragClass(currentTarget, dropSide);
    }
  }

  //拖放
  handleDrop(record) {
    removeDragClass();
    const { dragData, menuGroup, type } = this.state;
    const menuData = menuGroup[type];
    if (dragData && record) {
      deleteNode(menuData, dragData);
      if (currentDropSide === 'in') {
        dragData.parentId = record.id;
        record.subMenus = record.subMenus || [];
        record.subMenus.unshift(dragData);
        normalizeMenus([dragData], record.__level__, record.name);
      } else {
        const { parent, index, parentData: { id = 0, __level__, name } = {} } = findParent(menuData, record);
        dragData.parentId = id;
        parent.splice(index + (currentDropSide === 'after' ? 1 : 0), 0, dragData);
        normalizeMenus([dragData], __level__, name);
      }
      this.setState({
        menuGroup,
        dragData: null,
      });
    }
  }

  handleRow = (record) => {
    const droppable = this.checkDroppable(record);
    const rowProps = droppable ? {
      draggable: true,
      onDragLeave: this.handleDragLeave,
      onDragOver: this.handleDragOver.bind(this, record),
      onDrop: this.handleDrop.bind(this, record),
    } : {};
    return rowProps;
  };

  handleCell = (record) => {
    const draggable = this.checkDraggable(record);
    const cellProps = {
      onDragEnd: this.handleDragEnd,
    };
    if (draggable) {
      Object.assign(cellProps, {
        draggable: true,
        onDragStart: this.handleDragtStart.bind(this, record),
        className: 'drag-cell',
      });
    }
    return cellProps;
  };

  //储存菜单
  saveMenu = () => {
    const { intl } = this.props;
    const { type, menuGroup } = this.state;
    this.setState({ submitting: true });
    axios.post(`/iam/v1/menus/tree?level=${type}`, JSON.stringify(adjustSort(menuGroup[type])))
      .then(menus => {
        this.setState({ submitting: false });
        if (menus.failed) {
          Choerodon.prompt(menus.message);
        } else {
          MenuStore.setMenuData(_.cloneDeep(menus), type);
          Choerodon.prompt(PermissionStore.languages['save.success']);
          menuGroup[type] = normalizeMenus(menus);
          this.setState({
            menuGroup,
            tempDirs: [],
          });
        }
      })
      .catch(error => {
        Choerodon.handleResponseError(error);
        this.setState({ submitting: false });
      });
  };

  getOkText = (selectType) => {
    switch (selectType) {
      case 'create':
        return PermissionStore.languages.add;
      case 'detail':
        return PermissionStore.languages.save;
      default:
        return PermissionStore.languages.save;
    }
  };

  render() {
    const menuType = this.props.AppState.currentMenuType.type;
    const { menuGroup, type: typeState, selectType, sidebar, submitting, loading } = this.state;
    const columns = [{
      title: PermissionStore.languages[`${intlPrefix}.directory`],
      dataIndex: 'name',
      key: 'name',
      render: (text, { type, default: dft }) => {
        let icon = '';
        if (type === 'menu') {
          icon = 'dehaze';
        } else if (!dft) {
          icon = 'custom_Directory';
        } else {
          icon = 'folder';
        }
        return (
          <span><Icon type={icon} style={{ verticalAlign: 'text-bottom' }} /> {text}</span>
        );
      },
      onCell: this.handleCell,
    }, {
      title: PermissionStore.languages[`${intlPrefix}.icon`],
      dataIndex: 'icon',
      key: 'icon',
      render: (text) => {
        return <Icon type={text} style={{ fontSize: 18 }} />;
      },
    }, {
      title: PermissionStore.languages[`${intlPrefix}.code`],
      dataIndex: 'code',
      key: 'code',
    }, {
      title: PermissionStore.languages[`${intlPrefix}.belong`],
      dataIndex: '__parent_name__',
      key: '__parent_name__',
    }, {
      title: PermissionStore.languages[`${intlPrefix}.type`],
      dataIndex: 'default',
      key: 'default',
      render: (text, { type, default: dft }) => {
        if (type === 'menu') {
          return <span style={{ cursor: 'default' }}>{PermissionStore.languages[`${intlPrefix}.menu`]}</span>;
        } else if (!dft) {
          return <span style={{ cursor: 'default' }}>{PermissionStore.languages[`${intlPrefix}.selfDesign`]}</span>;
        } else {
          return <span style={{ cursor: 'default' }}>{PermissionStore.languages[`${intlPrefix}.settingDesign`]}</span>;
        }
      },
    }, {
      title: PermissionStore.languages.operation,
      width: 100,
      key: 'action',
      align: 'left',
      render: (text, record) => {
        const { type, default: dft } = record;
        if (type === 'menu') {
          return (
            <Permission service={['iam-service.menu.query']} type={menuType}>
              <Tooltip
                title={PermissionStore.languages.detail}
                placement="bottom"
              >
                <Button
                  shape="circle"
                  icon="find_in_page"
                  size="small"
                  onClick={this.detailMenu.bind(this, record)}
                />
              </Tooltip>
            </Permission>
          );
        } else if (!dft) {
          const canDel = canDelete(record);
          return (<span>
            <Permission service={['iam-service.menu.update']} type={menuType}>
              <Tooltip
                title={PermissionStore.languages.modify}
                placement="bottom"
              >
                <Button
                  shape="circle"
                  size="small"
                  onClick={this.changeMenu.bind(this, record)}
                  icon="mode_edit"
                />
              </Tooltip>
            </Permission>
            <Permission service={['iam-service.menu.delete']} type={menuType}>
              {canDel ? (
                <Tooltip
                  title={PermissionStore.languages.delete}
                  placement="bottom"
                >
                  <Button
                    onClick={this.handleDelete.bind(this, record)}
                    shape="circle"
                    size="small"
                    icon="delete_forever"
                  />
                </Tooltip>
              ) : (
                <Tooltip
                  title={PermissionStore.languages[`${intlPrefix}.delete.disable.tooltip`]}
                  overlayStyle={{ 'width': '200px' }}
                  placement="bottomRight"
                >
                  <Button
                    disabled
                    shape="circle"
                    size="small"
                    icon="delete_forever"
                  />
                </Tooltip>
              )}
            </Permission>
          </span>);
        }
      },
    }];
    return (
      <Page
        service={[
          'iam-service.menu.create',
          'iam-service.menu.saveListTree',
          'iam-service.menu.query',
          'iam-service.menu.update',
          'iam-service.menu.delete',
          'iam-service.menu.queryMenusWithPermissions',
          'iam-service.menu.listTree',
          'iam-service.menu.listAfterTestPermission',
          'iam-service.menu.listTreeMenusWithPermissions',
        ]}
      >
        <Header title={PermissionStore.languages[`${intlPrefix}.header.title`]}>
          <Permission service={['iam-service.menu.create']}>
            <Button
              onClick={this.addDir}
              style={{ color: '#04173F' }}
            >
              <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
              {PermissionStore.languages[`${intlPrefix}.create.org`]}
            </Button>
          </Permission>
        </Header>
        <Content>
          <Tabs defaultActiveKey="site" onChange={this.selectMenuType}>
            <TabPane tab={PermissionStore.languages[`${intlPrefix}.global`]} key="site" />
            <TabPane tab={PermissionStore.languages[`${intlPrefix}.org`]} key="organization" />
            <TabPane tab={PermissionStore.languages[`${intlPrefix}.pro`]} key="project" />
            <TabPane tab={PermissionStore.languages[`${intlPrefix}.personcenter`]} key="user" />
          </Tabs>
          <Table
            loading={loading}
            className="menu-table"
            filterBar={false}
            pagination={false}
            columns={columns}
            defaultExpandAllRows={false}
            dataSource={menuGroup[typeState]}
            childrenColumnName="subMenus"
            rowKey={this.getRowKey}
            onRow={this.handleRow}
          />
          <Sidebar
            title={this.getSidebarTitle(selectType)}
            visible={sidebar}
            footer={[
              <div className="role-action">
                <Button key="submit"
                        onClick={this.handleOk}
                        style={{ background: '#2196F3' }}
                        type="primary"
                >
                  {this.getOkText(selectType)}
                </Button>
                <Button key="back" onClick={this.closeSidebar}>
                  {PermissionStore.languages.return}</Button>
              </div>,
            ]}
          >
            {this.getSidebarContent(selectType)}
          </Sidebar>
          <Permission service={['iam-service.menu.saveListTree']}>
            <div style={{ marginTop: 25 }}>
              <Button
                funcType="raised"
                type="primary"
                onClick={this.saveMenu}
                loading={submitting}
                style={{ background: '#2196F3' }}
              >{PermissionStore.languages.save}
              </Button>
              <Button
                funcType="raised"
                onClick={this.handleRefresh}
                style={{ marginLeft: 16 }}
                disabled={submitting}
              ><span style={{ color: '#818999' }}>{PermissionStore.languages.cancel}</span></Button>
            </div>
          </Permission>
        </Content>
      </Page>
    );
  }
}

export default MenuTree;
