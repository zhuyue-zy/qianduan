/*eslint-disable*/
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Form, Icon, Modal, Progress, Select, Table, Tooltip, message, Input, Switch } from 'yqcloud-ui';
import { withRouter } from 'react-router-dom';
import { axios, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';
import querystring from 'query-string';
import MemberLabel, { validateMember } from '../../../components/memberLabel/MemberLabel';
import InternalCallbackStore from '../../../stores/globalStores/internalCallback';
import MultiLanguageFormItem from '../../../components/NewMultiLanguageFormItem';
import './InternalCallback.scss';
import { set } from 'mobx';

const { Sidebar } = Modal;
const FormItem = Form.Item;
const Option = Select.Option;
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
let timeout;

@inject('AppState')
@observer
class InternalCallback extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitState();
    this.organizationId = this.props.AppState.currentMenuType.id;
  }

  getInitState() {
    return {
      edit: false,
      saveSubmitting: false,
      InternalCallbackData: [], // 所有的内部回调接口
      internalApiOrgDOList: [], // 接口下的租户列表

      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      sort: 'permissionCode,desc',
      // 存放多语言信息
      multiLanguageValue: {
        displayName: {},
        description: {},
      },
      multiLanguageList: [],

      // addOrg的表格
      paginationOrg: {
        current: 1,
        pageSize: 10,
        total: '',
        pageSizeOptions: ['10', '50', '100', '200'],
      },

      // 选择租户的表格
      newOrgfilters: {},
      paginationNewOrg: {
        current: 1,
        pageSize: 10,
        total: '',
        pageSizeOptions: ['10', '50', '100', '200'],
      },

      editAddOrgData: [], // 创建/修改时租户数据
      newAddOrgData: [], // 

      selectedOrgRowKeys: [], // 选中的租户的索引值集合
      selectedOrgRows: [], // 选中的租户的values的集合数组

      selectedNewOrgRowKeys: [], // 选中的新租户的索引值集合
      selectedNewOrgRows: [], // 选中的新租户的values的集合数组


      addOrgVisible: true, // 默认不公开
      apiDataChildren: [], // 权限编码
      enableOrgData: [], // 有效租户数据
      _internalApiOrgDOList: [],
    };
  }

  /* 初始化数据 */
  init() {
    this.loadLanguage();
    this.getLanguage();
    this.loadInternalCallbackList();
    
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

  // 第一次渲染前获得数据
  componentWillMount() {
    this.init();
  }

  /* 刷新页面 */
  reload = () => {
    this.setState(this.getInitState(), () => {
      this.init();
    });
  };

  /* 获取语言 */
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    // InternalCallbackStore.queryLanguage(id, AppState.currentLanguage);
    if (this.props.AppState.currentMenuType.type === 'site') {
      InternalCallbackStore.queryLanguage(0, AppState.currentLanguage);
    } else {
      InternalCallbackStore.queryLanguage(id, AppState.currentLanguage);
    }
  }

  /* 加载内部回调接口数据 */
  loadInternalCallbackList = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState, InternalCallbackData } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    InternalCallbackStore.loadInternalCallbackList(
      id,
      pagination,
      sort,
      filters,
      params,
      
    ).then((data) => {
      if (data.success) {
        this.setState({
          InternalCallbackData: data.result.content, // 接口数据
          pagination: {
            current: (data.result.number || 0) + 1,
            pageSize: data.result.size || 10,
            total: data.result.totalElements || '',
            pageSizeOptions: ['25', '50', '100', '200'],
          },
          filters,
          params,
          sort,
        });
        InternalCallbackStore.setIsLoading(false);
      }
    }).catch(
      (error) => {
        Choerodon.handleResponseError(error);
      },
    );
  }

  /* 通过apiCode列表查询对应的permission */
  getApiSelect = (value, callback) => {
    let currentValue;
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    currentValue = value;

    function fake() {
      if (value.length > 2) {
        InternalCallbackStore.getPermissionCode(value)
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

  /* 分页 */
  handlePageChange = (pagination, filters, { field, order }, params) => {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadInternalCallbackList(pagination, sorter.join(','), filters, params);
  }

  // 启用停用
  handleDisable = (record) => {
    const enable = record.isEnabled ? 'disable' : 'enable';
    InternalCallbackStore.disableApi(enable, record).then((data) => {
      if (data.success) {
        Choerodon.prompt(InternalCallbackStore.languages[ enable !== 'enable' ? 'disable.success' : 'enable.success']);
        /* 刷新表格 */
        this.loadInternalCallbackList();
      }
    }).catch((error) => {
      Choerodon.handleResponseError(InternalCallbackStore.languages[ enable !== 'enable' ? 'disable.error' : 'enable.error']);
    });
  }

   /**
   * 通过获取状态来更该标题信息
   * @returns {*}
   */
  renderSideTitle() {
    const { edit } = this.state;
    if (edit) {
      // return InternalCallbackStore.languages[`${intlPrefix}.modify`];
      return InternalCallbackStore.languages['global.interCallback.edit.interface'];
    } else {
      return InternalCallbackStore.languages['global.interCallback.create.interface'];
      // return '新建接口';
    }
  }

  // 获取权限编码
  handleApiSearch = value => {
    this.getApiSelect(value, data => {
      this.setState({
        apiDataChildren: data,
      });
    });
  };

  /* 新建接口，弹出sidebar */
  addInterface = () => {
    this.setState({
      sidebar: true,
      edit: false,
      selectedData: '',
      internalApiOrgDOList: [],
    });
  };

  /* 创建/编辑的确认 */
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, value) => {
      if (!err) {
        this.setState({saveSubmitting: true})
        const { edit, internalApiOrgDOList, selectedData, _internalApiOrgDOList } = this.state;
        if (edit) {
          InternalCallbackStore.editSave({
            ...value,
            id: selectedData.id,
            permissionCode: value.permissionCode,
            internalApiOrgDOList: _internalApiOrgDOList.length ? _internalApiOrgDOList : internalApiOrgDOList,
            objectVersionNumber: selectedData.objectVersionNumber,
          }).then((data) => {
            if (data.success) { 
              this.setState({
                edit: false,
                selectedData: '',
                sidebar: false,
                addOrgVisible: true,
                saveSubmitting: false,
                selectedOrgRowKeys: [],
                selectedOrgRows: [],
                _internalApiOrgDOList: [],
              })
              Choerodon.prompt(InternalCallbackStore.languages['modify.success']);
              this.loadInternalCallbackList();
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          })
        } else {
          const list = [];
          internalApiOrgDOList.forEach((item) => {
            item.apiCode = value.apiCode;
            delete item.addDate;
            list.push(item);
          })
          InternalCallbackStore.createSave({
            ...value,
            permissionCode: value.permissionCode[0],
            internalApiOrgDOList: list,
          }).then((data) => {
            if (data.success) {
              this.setState({
                edit: false,
                selectedData: '',
                sidebar: false,
                addOrgVisible: true,
                saveSubmitting: false,
                selectedOrgRowKeys: [],
                selectedOrgRows: [],
                _internalApiOrgDOList: [],
              })
              this.loadInternalCallbackList();
              Choerodon.prompt(InternalCallbackStore.languages['create.success'])
            }
          }).catch((error) => {
            Choerodon.handleResponseError(error);
          })
        }
      }
    });
    
  };

  /* 关闭编辑/创建 */
  closeSidebar = () => {
    this.setState({
      // edit: false,
      sidebar: false,
      selectedData: '',
      addOrgVisible: true,
      selectedOrgRowKeys: [],
      selectedOrgRows: [],
      internalApiOrgDOList: [],
      _internalApiOrgDOList: [],
    });
    this.loadInternalCallbackList();
  };

  // 编辑
  onEdit = (record) => {
    this.setState({
      edit: true,
      sidebar: true,
      selectedData: record,
      internalApiOrgDOList: record.internalApiOrgDOList || [], // 回调接口的租户
      addOrgVisible: record.isPublic, // 使租户表格根据公开字段展现
      // _internalApiOrgDOList: record.internalApiOrgDOList || [], //提交时的租户列表数据
    });
  }
  
  // 侧边栏sidebar内容
  renderSidebarContent = () => {
    const { edit, addOrgVisible, selectedData } = this.state;
    return (
      <div>
        <Form>
        {/* {this.renderInterfaceInfo('名称label', '字段名', 文本长度, 是否必填, 多语言)} */}
          {this.renderInterfaceInfo(InternalCallbackStore.languages['global.interCallback.create.apiCode'], 'apiCode', 20, true, false)}
          {this.renderInterfaceInfo(InternalCallbackStore.languages['global.interCallback.create.displayName'], 'displayName', 50, true, true)}
          {this.renderInterfaceInfo(InternalCallbackStore.languages['global.interCallback.create.description'], 'description', 120, false, true)}
          {this.renderPermissionCode(InternalCallbackStore.languages['global.interCallback.permissionCode'], 'permissionCode', '', true, '')}
          {this.renderIsPubblic(InternalCallbackStore.languages['global.interCallback.isPublic'], 'isPublic')}
          {addOrgVisible ? '' : this.renderAddOrg()}
        </Form>
      </div>
    );
  }

  // 渲染接口信息的input
  renderInterfaceInfo = (label, name, maxLength, isRequired, isLang) => {
    const { getFieldDecorator } = this.props.form;
    const { edit, multiLanguageValue, selectedData } = this.state;
    return (
      <div className='interfaceInput'>
        <span className={`interfaceInputLabel ${isRequired ? 'required' : ''}`}>{label}</span>
        <FormItem {...formItemLayout}>
          {getFieldDecorator(name, {
            rules: [{
                required: isRequired,
                message: [`${InternalCallbackStore.languages['organization.portalManagement.pleaseInput']}${label}`],
              },
            ],
            initialValue: edit ? selectedData[`${name}`] : '',
            validateFirst: true,
          })(!isLang 
            ? (
              <Input
                // placeholder=' '
                autoComplete="off"
                value={this.state.inputValue}
                onChange={(e)=> {
                  this.setState({
                    inputValue: e.target.value,
                  })
                }}
                style={{ width: 512 }}
                maxLength={maxLength}
              />
            )
            : (
              <MultiLanguageFormItem
                placeholder=' '
                requestUrl="true"
                requestData={multiLanguageValue ? multiLanguageValue[`${name}`] : {}}
                handleMultiLanguageValue={({ retObj, retList }) => {
                  // 将多语言的值设置到当前表单
                  this.props.form.setFieldsValue({
                    [`${name}`]: retObj[this.props.AppState.currentLanguage],
                  });
                  this.setState({
                    multiLanguageValue: {
                      ...this.state.multiLanguageValue,
                      [`${name}`]: retObj,
                    },
                    multiLanguageList: retList,
                  });
                }}
                maxLength={maxLength}
                type="FormItem"
                FormLanguage={this.state.multiLanguageValue}
                languageEnv={this.state.languageEnv}
                inputWidth={512}
                required={isRequired}
              />
            )
          )}
        </FormItem>
      </div>
    )
  }

  // 渲染权限编码form.item
  renderPermissionCode = (label, name, maxLength, isRequired, isLang) => {
    const { getFieldDecorator } = this.props.form;
    const { edit, selectedData, apiDataChildren } = this.state;
    const apiOption = apiDataChildren.map(d => <Option value={d.code} key={d.id}>{d.code}</Option>);
    return (
      <div className="interfaceInput">
        <span className={`interfaceInputLabel ${isRequired ? 'required' : ''}`}>{label}</span>
        <FormItem {...formItemLayout}>
          {getFieldDecorator(name, {
              rules: [{
                  required: isRequired,
                  message: [`${InternalCallbackStore.languages['organization.portalManagement.pleaseInput']}${label}`],
                },
              ],
              initialValue: edit ? selectedData[`${name}`] : '',
              validateFirst: true,
            })(
              <Select 
                style={{ width: 512 }}
                mode={'multiple'}
                defaultActiveFirstOption={false}
                showArrow={false}
                filterOption={false}
                onFilterChange={this.handleApiSearch}
                filter
              >
                {apiOption}
              </Select>
            )}
        </FormItem>
      </div>
    )
  }

  // 渲染 是否公开 字段的form.item
  renderIsPubblic = (label, name) => {
    const { getFieldDecorator } = this.props.form;
    const { edit, selectedData, addOrgVisible } = this.state;
    return (
      <div className="interfaceInput">
        <span className="interfaceInputLabel">{label}</span>
        <FormItem {...formItemLayout}>
          {getFieldDecorator(name, {
              rules: [],
              // valuePropName: 'checked',
              initialValue: edit ? selectedData[`${name}`] : true,
              validateFirst: true,
            })(
              <Switch
                checked={addOrgVisible}
                onChange={(checked) => {
                  this.setState({
                    addOrgVisible: checked,
                    selectedOrgRows: [],
                    selectedOrgRowKeys: [],
                    internalApiOrgDOList: [],
                  })
                }}
              />
            )}
        </FormItem>
      </div>
    )
  }

  // 渲染有权限的租户表格
  renderAddOrg = () => {
    const { paginationOrg, edit, selectedOrgRowKeys, addOrgSidebar , newAddOrgData, internalApiOrgDOList } = this.state;
    const rowSelection = {
      selectedRowKeys: selectedOrgRowKeys,
      onChange: (selectedOrgRowKeys, valAll) => {
        this.setState({ selectedOrgRowKeys, selectedOrgRows: valAll });
      },
    };
    const columns = [{
      title: InternalCallbackStore.languages['global.apiCallManagement.tenantName'],
      dataIndex: 'name',
      key: 'name',
    }, {
      title: InternalCallbackStore.languages['global.interCallback.create.addDate'],
      dataIndex: 'addDate',
      key: 'addDate',
    }, {
      title: InternalCallbackStore.languages.operation,
      dataIndex: 'action',
      key: 'action',
      render: (text, record) => (
        <div>
          <Tooltip title={InternalCallbackStore.languages.delete} placement="bottom">
            <Button
              size="small"
              icon="zhishixiangqingshanchux"
              shape="circle"
              style={{ cursor: 'pointer', color: '#2196F3' }}
              onClick={() => this.handleDeleteOrg(record)}
            />
          </Tooltip>
        </div>
      )
    }];
    return (
      <div>
        <Button
          onClick={() => this.openNewPage()}
          icon="playlist_add"
        >
          添加租户
          {/* {InternalCallbackStore.languages.['global.interCallback.create.addOrg']} */}
        </Button>

        <Button
          onClick={() => this.deleteOrg()}
          disabled={internalApiOrgDOList ? internalApiOrgDOList.length < 1 : true}
          icon="delete_sweep"
          type="danger"
        >{InternalCallbackStore.languages['delete']}
        </Button>
        {/* 已添加的租户表格 */}
        <Table
          columns={columns}
          pagination={paginationOrg}
          dataSource={internalApiOrgDOList}
          rowSelection={rowSelection}
          rowKey={record => record.iamOrganizationId}
          loading={InternalCallbackStore.isLoading}
          onChange={this.handleIsAddOrgChange}
          bordered
          filterBar={false}
        />
        {/* 选择租户 */}
        <Sidebar
          title={InternalCallbackStore.languages['global.interCallback.choose.addOrg']}
          visible={addOrgSidebar}
          okText={InternalCallbackStore.languages.save}
          cancelText={InternalCallbackStore.languages.cancel}
          onOk={e => this.handleAddOrgSubmit(e)}
          onCancel={(e) => this.handleAddOrgCancel(e)}
          destroyOnClose={true}
          // confirmLoading={postSubmitting}
        >
          {
            this.renderNewOrgSideBar()
          }
        </Sidebar>
      </div>
    )
  }

  /* 已添加的租户页数变化 */
  handleIsAddOrgChange = (pagination, filters, sorter) => {
    this.setState({
      paginationOrg: {
        current: pagination.current,
        pageSize: 10,
        total: '',
        pageSizeOptions: ['10', '50', '100', '200'],
      },
    })
  }

  /* 获取有效租户 */
  getEnableOrg = () => {
    InternalCallbackStore.getEnableOrg().then((data) => {
      this.setState({
        enableOrgData: data, //
      })
    })
  }

  // 点击添加租户，展示添加租户的模态框
  openNewPage = () => {
    const { internalApiOrgDOList  } = this.state;
    /* 获取有效租户数据 */
    this.getEnableOrg();
    this.setState({
      addOrgSidebar: true,
      // selectedOrgRowKeys: [], // 清空已选中租户
      // selectedOrgRows: [],
      selectedNewOrgRowKeys: internalApiOrgDOList.map((k) => k.iamOrganizationId),
    });
  };

  array_diff = (a, b) => {
    for (var i = 0; i < b.length; i++) {
      for (var j = 0; j < a.length; j++) {
        if (a[j].iamOrganizationId== b[i].iamOrganizationId) {
          a.splice(j, 1);
          j = j - 1;
        }
      }
    }
    return a;
  }

  // 删除租户
  deleteOrg = () => {
    const { internalApiOrgDOList, selectedOrgRows, selectedOrgRowKeys  } = this.state;
    let arr = [];
    if (selectedOrgRows.length > 0) {
      selectedOrgRows.forEach((apiItem) => {
        arr.push(...internalApiOrgDOList.filter((orgItem) => apiItem.iamOrganizationId === orgItem.iamOrganizationId)); //获得选中删除的租户数据，包括默认的和新添加的
      })
      arr.forEach((k) => k.isDeleted = true); // 选中删除的数据isDeleted为true
      const tableList = this.array_diff(internalApiOrgDOList, arr); // 表格源数据
      const submitList = [...tableList, ...arr];
      this.setState({
        internalApiOrgDOList: tableList,
        _internalApiOrgDOList: submitList,
        selectedOrgRowKeys: [], // 清空已选中租户的iamId
        selectedOrgRows: [], // 清空已选中的租户信息
      })
    }
  };

  /* 删除单个已添加的租户 */
  handleDeleteOrg = (record) => {
    const { internalApiOrgDOList } = this.state;
    let tableList = this.deepClone(internalApiOrgDOList);
    let submitList = this.deepClone(internalApiOrgDOList);
    tableList.splice(internalApiOrgDOList.findIndex((v) => v.iamOrganizationId === record.iamOrganizationId), 1);
    submitList[internalApiOrgDOList.findIndex((v) => v.iamOrganizationId === record.iamOrganizationId)].isDeleted = true;

    this.setState({
      internalApiOrgDOList: tableList,
      _internalApiOrgDOList: submitList,
      // selectedOrgRows: [],
      // selectedOrgRowKeys: [],
    })
  }

  // 新模态框中保存选择的租户
  handleAddOrgSubmit = (e) => {
    e.preventDefault();
    const { selectedNewOrgRows, internalApiOrgDOList, selectedData } = this.state;
    /* 添加时间 */
    const nowDate = new Date(+new Date()+8*3600*1000).toISOString().replace(/T/g,' ').replace(/\.[\d]{3}Z/,'');
    const addOrgList = [];
    // const oldOrgList = deepClone(internalApiOrgDOList);
    selectedNewOrgRows.forEach((item) => {
      addOrgList.push({
        addDate: nowDate,
        iamOrganizationId: item.id,
        isDeleted: false,
        apiCode: selectedData.apiCode,
        name: item.name,
      })
      // item.addDate = nowDate;
      // item.iamOrganizationId = item.id;
      // item.deleted = false;
      // item.isDeleted = false;
      // item.apiCode = selectedData.apiCode;
      // internalApiOrgDOList = [...internalApiOrgDOList, addList];
      // const allOrgList = [...internalApiOrgDOList, ...addList];
    })
    const addList = this.array_diff(addOrgList, internalApiOrgDOList);
    const allOrgList = [...internalApiOrgDOList, ...addList];
    internalApiOrgDOList.push(...addOrgList);
    this.setState({
      addOrgSidebar: false,
      internalApiOrgDOList: allOrgList, // 更新租户的表格
      selectedNewOrgRowKeys: [],
      selectedNewOrgRows: [], // 添加完成后应清空选择项
    })
  }

   /* 数据深拷贝 */
   deepClone = (obj) => {
    const objC = JSON.stringify(obj);
    const objClone = JSON.parse(objC);
    return objClone;
  };

  // 取消选择租户
  handleAddOrgCancel = (e) => {
    e.preventDefault();
    this.setState({
      addOrgSidebar: false,
      selectedNewOrgRowKeys: [],
      selectedNewOrgRows: [], // 添加完成后应清空选择项

    })
  }

  // 渲染选择租户的侧边栏内容
  renderNewOrgSideBar = () => {
    const { paginationOrg, newOrgfilters, selectedNewOrgRowKeys, selectedNewOrgRows, enableOrgData, paginationNewOrg } = this.state;
    const columns = [{
      title: InternalCallbackStore.languages['global.interCallback.choose.orgCode'],
      dataIndex: 'code',
      key: 'code',
      filters: [],
      filteredValue: newOrgfilters.code || [],
    }, {
      title: InternalCallbackStore.languages['global.apiCallManagement.tenantName'],
      dataIndex: 'name',
      key: 'name',
    }];
    const rowSelection = {
      selectedRowKeys: selectedNewOrgRowKeys, // selectedRowKeys不能变！！！
      onChange: (selectedNewOrgRowKeys, valAll) => {
        this.setState({ selectedNewOrgRowKeys, selectedNewOrgRows: valAll });
      },
      
    };
    return (
      <div>
        {/* 选择租户页的表格 */}
        <Table
          columns={columns}
          pagination={paginationNewOrg}
          dataSource={enableOrgData}
          rowKey={record =>record.id}
          rowSelection={rowSelection}
          loading={InternalCallbackStore.isLoading}
          onChange={this.handleOrgPagechange}
          bordered
          filterBar={false}
        />
      </div>
    );
  }

  // 选择租户table的onchange
  handleOrgPagechange = (pagination, filters, sorter) => {
    const { paginationNewOrg } = this.state;
    this.setState({
      paginationNewOrg: {
        current: pagination.current,
        pageSize: 10,
        total: '',
        pageSizeOptions: ['10', '50', '100', '200'],
      },
    })
  }


  render() {
    const { sidebar, edit, filters, InternalCallbackData, saveSubmitting } = this.state;
    const { getFieldDecorator } = this.props.form;
    const columns = [
      {
        // title: '权限编码',
        title: InternalCallbackStore.languages['global.interCallback.permissionCode'],
        dataIndex: 'permissionCode',
        key: 'permissionCode',
        filters: [],
        filteredValue: filters.permissionCode || [],
        render: (text, record) => (
          <span>{text}</span>
        ),
      }, {
        // title: '方法编码',
        title: InternalCallbackStore.languages['global.interCallback.apiCode'],
        dataIndex: 'apiCode',
        key: 'apiCode',
        filters: [],
        filteredValue: filters.apiCode || [],
        // sorter: true,
      }, {
        title: InternalCallbackStore.languages.name,
        dataIndex: 'displayName',
        key: 'displayName',
        filters: [],
        filteredValue: filters.displayName || [],
        render: (text, record) => (
          <div>{text}</div>
        )
      }, {
        title: InternalCallbackStore.languages['organization.platformTime.description'],
        dataIndex: 'description',
        key: 'description',
        filters: [],
        filteredValue: filters.description || [],
        render: (text, record) => (
          <div>{text}</div>
        )
      }, {
        // title: '是否公开',
        title: InternalCallbackStore.languages['global.interCallback.isPublic'],
        dataIndex: 'isPublic',
        key: 'isPublic',
        render: (text, record) => (
          <div>{record.isPublic ? InternalCallbackStore.languages.yes : InternalCallbackStore.languages.no}</div>
        )
      }, {
        title: InternalCallbackStore.languages.status,
        dataIndex: 'isEnabled',
        key: 'isEnabled',
        // filters: [],
        // filteredValue: filters.enabled || [],
        render: (text, record) => (
          <div>{record.isEnabled ? InternalCallbackStore.languages.enableY : InternalCallbackStore.languages.disableN}</div>
        )
      },{
        title: InternalCallbackStore.languages.operation,
        dataIndex: 'action',
        key: 'action',
        width: 120,
        render: (text, record) => (
          <div>
            <Tooltip title={InternalCallbackStore.languages.edit} placement="bottom">
              <Button
                size="small"
                icon="bianji-"
                shape="circle"
                style={{ cursor: 'pointer', color: '#2196F3' }}
                onClick={() => this.onEdit(record)}
              />
            </Tooltip>
            <Tooltip
              title={record.isEnabled ? InternalCallbackStore.languages.disableN : InternalCallbackStore.languages.enableY }
              placement="bottom"
            >
              {
                record.isEnabled ? (<Button
                  size="small"
                  icon='jinyongzhuangtai'
                  shape="circle"
                  onClick={() => this.handleDisable(record)}
                />):(<Button
                  size="small"
                  icon= 'yijieshu'
                  shape="circle"
                  style={{ cursor: 'pointer', color: '#2196F3' }}
                  onClick={() => this.handleDisable(record)}
                />)
              }

            </Tooltip>
          </div>),
      }
    ];

    return (
      <Page>
        <Header title={InternalCallbackStore.languages['global.interCallback.title']}>
          <Button onClick={() => this.addInterface()} style={{ color: '#04173F' }}>
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {InternalCallbackStore.languages['global.interCallback.create.interface']}
            {/* 新建接口 */}
          </Button>
        </Header>
        <Content className="internalCallback">
          <Table
            size="middle"
            pagination={this.state.pagination}
            columns={columns}
            dataSource={InternalCallbackData}
            onChange={this.handlePageChange}
            loading={InternalCallbackStore.isLoading}
          />
          <Sidebar
            className="editSidebar"
            title={this.renderSideTitle()}
            visible={sidebar}
            okText={InternalCallbackStore.languages[edit ? 'save' : 'create']}
            cancelText={InternalCallbackStore.languages.cancel}
            onOk={(e) => this.handleSubmit(e)}
            onCancel={(e) => this.closeSidebar(e)}
            destroyOnClose={true}
            confirmLoading={saveSubmitting}

          >
            {this.renderSidebarContent()}
          </Sidebar>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(InternalCallback)));
