import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content, Permission, Action, } from 'yqcloud-front-boot';
import {
  Button, Table, Tabs, Modal, Icon, Tooltip ,Checkbox} from 'yqcloud-ui';
import EditPosition from '../editPosition';
import PositionStore from '../../../../stores/organization/positionManagement';
import { getNodeByKey } from "../../../../common/roleManagementUtils";

const intlPrefix = 'position.management';
const { TabPane } = Tabs;
const { Sidebar } = Modal;

@inject('AppState')
@observer
class PositionHome extends Component {
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
      sort: 'positionCode',
      visible: false,
      selectData: '',
      treeDataMap: [],
      defaultExpandedRowKeys: [], // 默认展开的列
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadPositions();
    // this.loadPositionTree();
    this.loadPositionTreeByParentId();
  }

  // 根据父级id加载组织树
  loadPositionTreeByParentId = () => {
    PositionStore.setIsLoading(true);
    this.loadClassifiesAndInit('', 0, (data) => {
      if (data === 'done') {
        PositionStore.setIsLoading(false);
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
      this.setState({ treeDataMap: result }, () => {
        const { treeDataMap } = this.state;
        const a = [];
        treeDataMap.forEach((item) => {
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

  loadClassifiesAndWithParent = (key, parentId, callback) => {
    const { AppState } = this.props;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    PositionStore.loadClassifyByParent(iamOrganizationId, parentId).then((data) => {
      if (data.failed) {
        // Choerodon.promt(data.message);
        PositionStore.setIsLoading(false);
      } else if (typeof callback === 'function') {
        PositionStore.setIsLoading(false);
        let children = [];
        if (data.children && data.children.length > 0) {
          children = data.children.map((item) => {
            return {
              key: item.positionId,
              positionId: item.positionId,
              name: item.positionName,
              positionCode: item.positionCode,
              organizationName: item.organizationName,
              description: item.description,
              parentId: item.parentPositionId,
              children: item.children ? [] : null,
            };
          });
        }
        if (data.employeeList && data.employeeList.length > 0) {
          data.employeeList.forEach((value) => {
            children.unshift({
              key: `${data.parentPositionId}-${data.positionId}-${value.employeeId}`,
              employeeId: value.employeeId,
              name: value.employeeName,
              description: data.description,
              parentId: data.parentPositionId,
              children: null,
            });
          });
        }
        callback(children);
      }
    }).catch((error) => {
      PositionStore.setIsLoading(false);
      Choerodon.handleResponseError(error);
    });
  }

  loadClassifies = (parentId, callback) => {
    const { AppState } = this.props;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    if (parentId) {
      //
    } else {
      PositionStore.loadPositionListHeader(iamOrganizationId).then((data) => {
        if (data.failed) {
          // Choerodon.promt(data.message);
        } else if (typeof callback === 'function') {
          callback(this.loopPositionTree(data, 0));
          // callback(data);
        }
      }).catch((error) => {
        Choerodon.handleResponseError(error);
      });
    }
  };

  loopPositionTree = (data, num) => data.map((item) => {
    const children = [];
    const result = {
      key: item.positionId,
      positionId: item.positionId,
      name: item.positionName,
      positionCode: item.positionCode,
      organizationName: item.organizationName,
      description: item.description,
      parentId: item.parentPositionId,
      children: item.children ? [] : null,
    };
    if (item.employeeList && item.employeeList.length > 0) {
      item.employeeList.forEach((value) => {
        children.unshift({
          key: `${item.parentPositionId}-${item.positionId}-${value.employeeId}`,
          employeeId: value.employeeId,
          name: value.employeeName,
          description: item.description,
          parentId: item.parentPositionId,
          children: null,
        });
      });
    }
    if (item.children && item.children.length > 0) {
      if (children.length > 0) {
        result.children = [...children, ...this.loopPositionTree(item.children, num + 1), ];
      } else {
        result.children = this.loopPositionTree(item.children, num + 1);
      }
    } else if (children.length > 0) {
      result.children = children;
    }
    return result;
  });

  initClassify = (result, preKey) => {
    if (result && result.length) {
      result.forEach((item) => {
        const map = this.addTreeNode(preKey, item.positionId, item.positionName);
        const hasObj = map.parentNode.children.filter(obj => obj.organizationId === item.organizationId);
        if (hasObj.length === 0) {
          map.node.name = item.name;
          map.node.organizationName = item.organizationName;
          map.node.description = item.description;
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
   * @param positionId 分类节点
   * @param positionName
   */
  addTreeNode = (preKey, positionId, positionName) => {
    let node = null;
    let parentNode = null;
    if (preKey) {
      parentNode = getNodeByKey(this.state.treeDataMap, preKey);
      if (!Array.isArray(parentNode.children)) {
        parentNode.children = [];
      }
      node = { positionName, key: `${preKey}-${positionId}`, positionId };
    } else {
      parentNode = { positionId: 0, key: '', children: this.state.treeDataMap };
      const key = `1-${positionId}`;
      node = { positionName, key, positionId };
    }
    return {
      parentNode,
      node,
    };
  };

  //  加载数据
  onLoadData = (expanded, treeNode) => new Promise((resolve) => {
    PositionStore.setIsLoading(true);
    if (treeNode.children && treeNode.children.length > 0) {
      PositionStore.setIsLoading(false);
      resolve();
      return;
    }
    this.loadClassifiesAndWithParent(treeNode.key, treeNode.positionId, (data) => {
      treeNode.children = data;
      this.setState({
        treeDataMap: [...this.state.treeDataMap],
      })
      resolve();
    });
  });

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    PositionStore.queryLanguage(id, AppState.currentLanguage);
  };


  /**
   * 加载岗位列表
   * @param paginationIn 分页
   */
  loadPositions = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    PositionStore.loadPositions(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      PositionStore.setPositions(data.content);
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

  fetch=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    PositionStore.getIsEnabled(organizationId);
  }

  /**
   * 加载组织树
   * @param
   */
  loadPositionTree = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    PositionStore.loadPositionTree(id)
      .catch(error => Choerodon.handleResponseError(error));
  };

  /**
   * 标签切换处理
   * @param activeKey 标签Key
   */
  handleTabsChange(activeKey) {
    if (activeKey === '1') {
      this.loadPositions();
    } else if (activeKey === '2') {
      // this.loadPositionTree();
      this.loadPositionTreeByParentId();
    }
  }

  /**
   * 列表分页处理
   * @param pagination 分页
   */
  handlePageChange(pagination, filters, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadPositions(pagination, sorter.join(','), filters, params);
  }

  /* 刷新 */
  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadPositions();
      // this.loadPositionTree();
      this.loadPositionTreeByParentId();
    });
  };

  /* 修改 */
  onEdit = (record) => {
    this.setState({
      visible: true,
      selectData: record.positionId,
      edit: true,
    });
  };

  /* 删除 */
  onDelete = (record) => {
    const { AppState, intl } = this.props;
    const tenantId = AppState.currentMenuType.id;
    const deleteArr = [record.positionId];
    PositionStore.deletePosition(tenantId, deleteArr).then(({ failed, message }) => {
      if (failed) {
      } else {
        Choerodon.prompt(PositionStore.languages['delete.success']);
        this.loadPositions();
        // this.loadPositionTree();
        this.loadPositionTreeByParentId();
      }
    }).catch((error) => {
      Choerodon.prompt(PositionStore.languages['delete.error']);
      Choerodon.handleResponseError(error);
    });
  }

  /**
   * 启用禁用
   * @param
   */
  handleAble = (record) => {
    const { AppState, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const tenantId = menuType.id;
    if (record.isEnabled === 'Y') {
      // 禁用
      // debugger;
      PositionStore.UnenablePosition(tenantId, record.positionId).then(({ failed, message }) => {
        if (failed) {
        } else {
          Choerodon.prompt(PositionStore.languages['disable.success']);
          this.loadPositions();
          // this.loadPositionTree();
          this.loadPositionTreeByParentId();
        }
      }).catch((error) => {
        Choerodon.prompt(PositionStore.languages['disable.error']);
      });
    } else {
      PositionStore.EnablePosition(tenantId, record.positionId).then(({ failed, message }) => {
        if (failed) {
        } else {
          Choerodon.prompt(PositionStore.languages['enable.success']);
          this.loadPositions();
          // this.loadPositionTree();
          this.loadPositionTreeByParentId();
        }
      }).catch((error) => {
        Choerodon.prompt(PositionStore.languages['enable.error']);
      });
    }
  }

  /* 弹层 */
  showModal = () => {
    this.setState({
      visible: true,
      edit: false,
    });
  }

  renderSideTitle = () => {
    const { edit } = this.state;
    if (edit) {
      return PositionStore.languages[`${intlPrefix}.modify`];
    } else {
      return PositionStore.languages[`${intlPrefix}.create`];
    }
  }

  renderSidebar = () => {
    const { visible, selectData, edit } = this.state;
    return (
      <EditPosition
        visible={visible}
        id={selectData}
        edit={edit}
        onRef={(node) => {
          this.editPosition = node;
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
          this.loadPositions();
          // this.loadPositionTree();
          this.loadPositionTreeByParentId();
        }}
        OnUnchangedSuccess={() => {
          this.setState({
            visible: false,
            submitting: false,
          });
          // this.loadPositions();
          // this.loadPositionTree();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
        OnCloseModel={() => {
          this.setState({
            visible: false,
            selectData: '',
          });
        }}
      />
    );
  }

  // 启用快码
  enabledState = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const enabled = PositionStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }
  renderColumns(defaultChecked, record, column) {
    return (
      <div>
        <Checkbox
          disabled={true}
          style={{ margin: '-5px 0' }}
          checked={defaultChecked}
          onChange={e => this.handleChange(e.target.checked, record.key, column)}
        />
      </div>
    );
  }
  render() {
    const { intl, AppState } = this.props;
    const { submitting, visible, edit, params, filters, pagination, treeDataMap } = this.state;
    const menuType = AppState.currentMenuType;
    const tenantId = menuType.id;
    const enabled = PositionStore.getEnabled;

    /* 组织信息表格列 */
    const ListColumns = [{
      title: PositionStore.languages[`${intlPrefix}.code`],
      dataIndex: 'positionCode',
      key: 'positionCode',
      filters: [],
      sorter: true,
      filteredValue: filters.positionCode || [],
    }, {
      title: PositionStore.languages[`${intlPrefix}.name`],
      dataIndex: 'positionName',
      key: 'positionName',
      sorter: true,
      filters: [],
      filteredValue: filters.positionName || [],
      render: (text, record) => (
        <a onClick={this.onEdit.bind(this, record)}>{text}</a>

      ),
    }, {
      title: PositionStore.languages[`${intlPrefix}.upperName`],
      dataIndex: 'parentPositionName',
      key: 'parentPositionName',
    }, {
      title: PositionStore.languages[`${intlPrefix}.organizationName`],
      dataIndex: 'organizationName',
      key: 'organizationName',
    },  {
      title: PositionStore.languages[`${intlPrefix}.isMainPosition`],
      dataIndex: 'managerPosition',
      key: 'managerPosition',
      render: (text, record) => this.renderColumns(text === true, record, 'managerPosition'),
    }, {
      title: PositionStore.languages[`${intlPrefix}.enabled`],
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      rter: true,
      filters: [
        {
          text: PositionStore.languages.enable,
          value: 'Y',
        }, {
          text: PositionStore.languages.disable,
          value: 'N',
        },
      ],
      filteredValue: filters.isEnabled || [],
      render: (values, record) => this.enabledState(record.isEnabled),
    }, {
      title: PositionStore.languages[`${intlPrefix}.description`],
      dataIndex: 'description',
      key: 'description',
    }, {
      title: PositionStore.languages.operation,
      key: 'action',
      align: 'left',
      fixed: 'right',
      width: '120px',
      render: (text, record) => (
        <div>
          <Tooltip
            title={PositionStore.languages.modify}
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
              title={PositionStore.languages.disable}
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
              title={PositionStore.languages.enable}
              placement="bottom"
            >
              <Button
                icon="yijieshu"
                shape="circle"
                style={{ cursor: 'pointer', color: '#2196F3' }}
                size="small"
                onClick={this.handleAble.bind(this, record)}
              />
            </Tooltip>)}
          <Tooltip
            title={PositionStore.languages.delete}
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
        </div>),
    },
    ];

    /* 组织结构表格列 */
    const structureColumns = [{
      code: 'name',
      title: PositionStore.languages[`${intlPrefix}.name`],
      dataIndex: 'name',
      key: 'name',

    }, {
      code: 'positionCode',
      title: PositionStore.languages[`${intlPrefix}.code`],
      dataIndex: 'positionCode',
      key: 'positionCode',
    }, {
      code: 'organizationName',
      title: PositionStore.languages[`${intlPrefix}.organizationName`],
      dataIndex: 'organizationName',
      key: 'organizationName',
    }, {
      code: 'description',
      title: PositionStore.languages[`${intlPrefix}.description`],
      dataIndex: 'description',
      key: 'description',
    }];

    return (
      <Page>
        <Header title={PositionStore.languages[`${intlPrefix}.header.title`]}>
          <Button
            onClick={() => this.showModal()}
            style={{ color: '#04173F' }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {PositionStore.languages[`${intlPrefix}.create`]}
          </Button>
        </Header>
        <Content>
          <Tabs defaultActiveKey="1" onChange={this.handleTabsChange.bind(this)}>
            <TabPane tab={PositionStore.languages[`${intlPrefix}.list`]} key="1">
              <Table
                size="middle"
                columns={ListColumns}
                dataSource={PositionStore.getPositions}
                loading={PositionStore.isLoading}
                onChange={this.handlePageChange.bind(this)}
                pagination={pagination}
                // filters={filters}
              />
            </TabPane>
            <TabPane tab={PositionStore.languages[`${intlPrefix}.structure`]} key="2">
              <Table
                size="middle"
                columns={structureColumns}
                // dataSource={PositionStore.getPositionTree}
                dataSource={treeDataMap}
                loading={PositionStore.isLoading}
                pagination={false}
                // defaultExpandAllRows
                defaultExpandedRowKeys={this.state.defaultExpandedRowKeys}
                onExpand={(expanded, record) => this.onLoadData(expanded, record)}
              />
            </TabPane>
          </Tabs>
          <Sidebar
            title={this.renderSideTitle()}
            visible={visible}
            okText={edit ? PositionStore.languages.save : PositionStore.languages.create}
            cancelText={PositionStore.languages.cancel}
            onOk={e => this.editPosition.handleSubmit(e)}
            onCancel={(e) => {
              this.editPosition.handleCancel(e);
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

export default withRouter(injectIntl(PositionHome));
