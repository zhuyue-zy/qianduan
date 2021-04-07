import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content } from 'yqcloud-front-boot';
import {
  Button, Table, Tabs, Modal, Tooltip, Icon,
} from 'yqcloud-ui';
import EditOrganization from '../editOrganization';
import OrganizationStore from '../../../../stores/organization/organizationManagement';
import './index.scss';
import { getNodeByKey } from '../../../../common/roleManagementUtils';

const intlPrefix = 'organization.management';
const { TabPane } = Tabs;
const { Sidebar } = Modal;

@inject('AppState')
@observer
class OrganizationHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      submitting: false,
      open: false,
      edit: false,
      id: '',
      page: 0,
      isLoading: true,
      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      sort: 'organizationCode',
      visible: false,
      selectData: '',
      treeData: [],
      defaultExpandedRowKeys: [], // 默认展开的列
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadOrganizations();
    // this.loadOrganizationTree();
    this.loadOrganizationTreeByParentId();
  }

  // 根据父级id加载组织树
  loadOrganizationTreeByParentId = () => {
    OrganizationStore.setIsLoading(true);
    this.loadClassifiesAndInit('', 0, (data) => {
      if (data === 'done') {
        OrganizationStore.setIsLoading(false);
      }
    });
  };

  /**
   * 加载分类
   * @param
   */
  loadClassifiesAndInit = (preKey, parentId, callback) => {
    this.loadClassifies(parentId, (result) => {
      this.initClassify(result, preKey);
      this.setState({ treeData: this.state.treeData }, () => {
        const { treeData } = this.state;
        const a = [];
        treeData.forEach((item) => {
          a.push(item.key);
        });
        this.setState({
          defaultExpandedRowKeys: a,
        })
        if (typeof callback === 'function') {
          callback('done');
        }
      });
    });
  };

  loadClassifies = (parentId, callback) => {
    const { AppState } = this.props;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    if (parentId) {
      OrganizationStore.loadClassifyByParent(iamOrganizationId, parentId).then((data) => {
        if (data.failed) {
          // Choerodon.promt(data.message);
          OrganizationStore.setIsLoading(false);
        } else if (typeof callback === 'function') {
          OrganizationStore.setIsLoading(false);
          callback(data);
        }
      }).catch((error) => {
        OrganizationStore.setIsLoading(false);
        Choerodon.handleResponseError(error);
      });
    } else {
      OrganizationStore.loadOrganizationListHeader(iamOrganizationId).then((data) => {
        if (data.failed) {
          // Choerodon.promt(data.message);
        } else if (typeof callback === 'function') {
          callback(data);
        }
      }).catch((error) => {
        Choerodon.handleResponseError(error);
      });
    }
  };

  initClassify = (treeData, preKey) => {
    if (treeData && treeData.length) {
      treeData.forEach((item) => {
        const map = this.addTreeNode(preKey, item.organizationId, item.organizationName);
        const hasObj = map.parentNode.children.filter(obj => obj.organizationId === item.organizationId);
        if (hasObj.length === 0) {
          map.node.name = item.organizationName;
          map.node.organizationCode = item.organizationCode;
          map.node.positionName = item.positionName;
          map.node.description = item.description;
          map.node.organizationId = item.organizationId;
          map.node.parentId = item.parentOrganizationId;
          map.node.children = item.children ? [] : null;
          map.node.isLeaf = item.parentCheck === 'N';
          map.parentNode.children.push(map.node);
          if (item.children && item.children.length) {
            const { children } = item;
            const prekey = map.node.key;
            this.initClassify(children, prekey);
          }
        }
      });
    }
  };

  /**
   * 添加节点
   * @param preKey 父节点
   * @param organizationId 分类节点
   * @param organizationName
   */
  addTreeNode = (preKey, organizationId, organizationName) => {
    let node = null;
    let parentNode = null;
    if (preKey) {
      parentNode = getNodeByKey(this.state.treeData, preKey);
      if (!Array.isArray(parentNode.children)) {
        parentNode.children = [];
      }
      node = { organizationName, key: `${preKey}-${organizationId}`, organizationId };
    } else {
      parentNode = { organizationId: 0, key: '', children: this.state.treeData };
      const key = `1-${organizationId}`;
      node = { organizationName, key, organizationId };
    }
    return {
      parentNode,
      node,
    };
  };

  //  加载数据
  onLoadData = (expanded, treeNode) => new Promise((resolve) => {
    OrganizationStore.setIsLoading(true);
    if (treeNode.children && treeNode.children.length > 0) {
      OrganizationStore.setIsLoading(false);
      resolve();
      return;
    }
    this.loadClassifiesAndInit(treeNode.key, treeNode.organizationId, (data) => {
      if (data === 'done') {
        resolve();
      }
    });
  });


  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    OrganizationStore.queryLanguage(id, AppState.currentLanguage);
  };

  /**
   * 加载组织列表
   * @param paginationIn 分页
   */
  loadOrganizations = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    OrganizationStore.loadOrganizations(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      OrganizationStore.setOrganizations(data.content);
      this.setState({
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        filters,
        params,
        sort,
      });
    })
      .catch(error => Choerodon.handleResponseError(error));
  };

  /**
   * 加载组织树
   * @param
   */
  loadOrganizationTree = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    OrganizationStore.loadOrganizationTree(id)
      .catch(error => Choerodon.handleResponseError(error));
  };

  fetch=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    OrganizationStore.getIsEnabled(organizationId);
    OrganizationStore.queryOrganizationType(organizationId);
  }

  // 启用快码
  enabledState = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const enabled = OrganizationStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  /**
   * 标签切换处理
   * @param activeKey 标签Key
   */
  handleTabsChange(activeKey) {
    if (activeKey === '1') {
      this.loadOrganizations();
    } else if (activeKey === '2') {
      // this.loadOrganizationTree();
      this.loadOrganizationTreeByParentId();
    }
  }


  /**
   * 分页处理
   * @param pagination 分页
   */
  handlePageChange = (pagination, filters, { field, order }, params) => {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadOrganizations(pagination, sorter.join(','), filters, params);
  }

  /**
   * 刷新
   */
  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadOrganizations();
      // this.loadOrganizationTree();
      this.loadOrganizationTreeByParentId();
    });
  };

  /**
   * 修改
   */
  onEdit = (record) => {
    this.setState({
      visible: true,
      selectData: record.organizationId,
      edit: true,
    });
  };

  /**
   * 删除
   */
  onDelete = (record) => {
    const { AppState, intl } = this.props;
    const tenantId = AppState.currentMenuType.id;
    const deleteArr = [];
    deleteArr.push(record.organizationId);
    OrganizationStore.deleteOrganization(tenantId, deleteArr).then(({ failed, message }) => {
      if (failed) {
      } else {
        Choerodon.prompt(OrganizationStore.languages['delete.success']);
        this.loadOrganizations();
        // this.loadOrganizationTree();
        this.loadOrganizationTreeByParentId();
      }
    }).catch((error) => {
      Choerodon.prompt(OrganizationStore.languages['delete.error']);
    });
  }

  /**
   * 启用禁用
   */
  handleAble = (record) => {
    const { AppState, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const tenantId = menuType.id;
    if (record.isEnabled === 'Y') {
      // 禁用
      // debugger;
      OrganizationStore.UnenableOrganization(tenantId, record.organizationId, record.objectVersionNumber).then(({ failed, message }) => {
        if (failed) {
        } else {
          Choerodon.prompt(OrganizationStore.languages['disable.success']);
          this.loadOrganizations();
          // this.loadOrganizationTree();
          this.loadOrganizationTreeByParentId();
        }
      }).catch((error) => {
        Choerodon.prompt(OrganizationStore.languages['disable.error']);
      });
    } else {
      OrganizationStore.EnableOrganization(tenantId, record.organizationId, record.objectVersionNumber).then(({ failed, message }) => {
        if (failed) {
        } else {
          Choerodon.prompt(OrganizationStore.languages['enable.success']);
          this.loadOrganizations();
          // this.loadOrganizationTree();
          this.loadOrganizationTreeByParentId();
        }
      }).catch((error) => {
        Choerodon.prompt(OrganizationStore.languages['enable.error']);
      });
    }
  }

  /**
   * 弹层
   */
  showModal = () => {
    this.setState({
      visible: true,
      edit: false,
    });
  }

  renderSideTitle = () => {
    const { edit } = this.state;
    if (edit) {
      return OrganizationStore.languages[`${intlPrefix}.modify`];
    } else {
      return OrganizationStore.languages[`${intlPrefix}.create`];
    }
  }

  renderSidebar = () => {
    const { visible, selectData, edit } = this.state;
    return (
      <EditOrganization
        visible={visible}
        id={selectData}
        edit={edit}
        onRef={(node) => {
          this.editOrganization = node;
        }}
        OnUnchangedSuccess={() => {
          this.setState({
            visible: false,
            submitting: false,
          });
        }}
        onSubmit={() => {
          this.setState({
            submitting: true,
          });
        }}
        onSuccess={() => {
          this.setState({
            visible: false,
            submitting: false,
          });
          this.loadOrganizations();
          this.loadOrganizationTreeByParentId();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
        OnCloseModel={() => {
          this.setState({
            visible: false,
          });
        }}
      />
    );
  }


  // 获取组织类型

  organizationTypes= (values) => {
    const typeLists = OrganizationStore.getOrganizationType;
    const temp = typeLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }


  render() {
    const { intl, AppState } = this.props;
    const { submitting, visible, edit, params, filters, sort, pagination, treeData } = this.state;
    const menuType = AppState.currentMenuType;
    const tenantId = menuType.id;
    const enabled = OrganizationStore.getEnabled;

    /* 组织信息表格列 */
    const ListColumns = [{
      code: 'organizationCode',
      title: OrganizationStore.languages[`${intlPrefix}.code`],
      width: 150,
      dataIndex: 'organizationCode',
      key: 'organizationCode',
      sorter: true,
      filters: [],
      filteredValue: filters.organizationCode || [],
    }, {
      code: 'organizationName',
      title: OrganizationStore.languages[`${intlPrefix}.name`],
      width: 150,
      dataIndex: 'organizationName',
      key: 'organizationName',
      filters: [],
      filteredValue: filters.organizationName || [],
      sorter: true,
      render: (text, record) => (
        <a onClick={this.onEdit.bind(this, record)}>{text}</a>
      ),
    }, {
      code: 'category',
      title: OrganizationStore.languages[`${intlPrefix}.category`],
      dataIndex: 'category',
      key: 'category',
      render: (text, record) => this.organizationTypes(record.category),
    }, {
      code: 'parentCode',
      title: OrganizationStore.languages[`${intlPrefix}.upperCode`],
      dataIndex: 'parentCode',
      key: 'parentCode',
    }, {
      code: 'parentName',
      title: OrganizationStore.languages[`${intlPrefix}.upperName`],
      dataIndex: 'parentName',
      key: 'parentName',
      width: 150,
    }, {
      code: 'supervisor',
      title: OrganizationStore.languages[`${intlPrefix}.supervisor`],
      dataIndex: 'positionName',
      key: 'supervisor',
    }, {
      code: 'description',
      title: OrganizationStore.languages[`${intlPrefix}.description`],
      dataIndex: 'description',
      key: 'description',
    }, {
      title: OrganizationStore.languages[`${intlPrefix}.enabled`],
      key: 'isEnabled',
      width: 80,
      dataIndex: 'isEnabled',
      filters: [
        {
          text: OrganizationStore.languages.enable,
          value: 'Y',
        }, {
          text: OrganizationStore.languages.disable,
          value: 'N',
        },
      ],
      sorter: true,
      filteredValue: filters.isEnabled || [],
      render: (values, record) => this.enabledState(record.isEnabled),
    },
    {
      title: OrganizationStore.languages.operation,
      key: 'action',
      align: 'left',
      fixed: 'right',
      width: '120px',
      render: (text, record) => (
        <div>
          <Tooltip
            title={OrganizationStore.languages.modify}
            placement="bottom"
          >
            <Button
              size="small"
              icon="bianji-"
              shape="circle"
              style={{ cursor: 'pointer', color: '#2196F3' }}
              onClick={this.onEdit.bind(this, record)}
            />
          </Tooltip>
          {record.isEnabled === 'Y' ? (
            <Tooltip
              title={OrganizationStore.languages.disable}
              placement="bottom"
            >
              <Button
                icon="jinyongzhuangtai"
                style={{ cursor: 'pointer' }}
                shape="circle"
                size="small"
                onClick={this.handleAble.bind(this, record)}
              />
            </Tooltip>
          ) : (
            <Tooltip
              title={OrganizationStore.languages.enable}
              placement="bottom"
            >
              <Button
                icon="yijieshu"
                shape="circle"
                style={{ cursor: 'pointer', color: '#2196F3' }}
                size="small"
                onClick={this.handleAble.bind(this, record)}
              />
            </Tooltip>
          )}
          <Tooltip
            title={OrganizationStore.languages.delete}
            placement="bottom"
          >
            <Button
              key="delete"
              shape="circle"
              size="small"
              icon="shanchu-icon"
              style={{ cursor: 'pointer' }}
              onClick={this.onDelete.bind(this, record)}
            />
          </Tooltip>
        </div>
      ),
    }];
    /* 组织结构表格列 */
    const structureColumns = [{
      code: 'name',
      title: OrganizationStore.languages[`${intlPrefix}.name`],
      dataIndex: 'name',
      key: 'name',
    }, {
      code: 'code',
      title: OrganizationStore.languages[`${intlPrefix}.code`],
      dataIndex: 'organizationCode',
      key: 'code',
    }, {
      code: 'positionName',
      title: OrganizationStore.languages[`${intlPrefix}.supervisor`],
      dataIndex: 'positionName',
      key: 'positionName',
    }, {
      code: 'description',
      title: OrganizationStore.languages[`${intlPrefix}.description`],
      dataIndex: 'description',
      key: 'description',
    }];

    return (
      <Page>
        <Header title={OrganizationStore.languages[`${intlPrefix}.header.title`]}>
          <Button
            onClick={() => this.showModal()}
            style={{ color: '#04173F' }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {OrganizationStore.languages[`${intlPrefix}.create`]}
          </Button>
        </Header>
        <Content>
          <Tabs defaultActiveKey="1" onChange={this.handleTabsChange.bind(this)}>
            <TabPane tab={OrganizationStore.languages[`${intlPrefix}.list`]} key="1">
              <Table
                size="middle"
                columns={ListColumns}
                rowKey="id"
                dataSource={OrganizationStore.getOrganizations}
                pagination={pagination}
                onChange={this.handlePageChange.bind(this)}
                loading={OrganizationStore.isLoading}
                scroll={{ x: 1500 }}
                filters={params}
              />
            </TabPane>
            <TabPane tab={OrganizationStore.languages[`${intlPrefix}.structure`]} key="2">
              <Table
                size="middle"
                columns={structureColumns}
                // dataSource={OrganizationStore.getOrganizationTree}
                dataSource={treeData}
                loading={OrganizationStore.isLoading}
                pagination={false}
                defaultExpandedRowKeys={this.state.defaultExpandedRowKeys}
                onExpand={(expanded, record) => this.onLoadData(expanded, record)}
              />
            </TabPane>
          </Tabs>
          <Sidebar
            title={this.renderSideTitle()}
            visible={visible}
            okText={edit ? OrganizationStore.languages.save : OrganizationStore.languages.create}
            cancelText={OrganizationStore.languages.cancel}
            onOk={e => this.editOrganization.handleSubmit(e)}
            onCancel={(e) => {
              this.editOrganization.handleCancel(e);
            }}
            confirmLoading={submitting}
          >
            {
              this.renderSidebar()
            }
          </Sidebar>
        </Content>
      </Page>
    );
  }
}

export default withRouter(injectIntl(OrganizationHome));
