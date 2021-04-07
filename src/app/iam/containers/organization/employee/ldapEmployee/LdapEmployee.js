/**
 * Create By liuchuan on 2018/9/6.
 */
import React, { Component } from 'react';
import { Form, Input, Modal, Select, Button, DatePicker, Tabs, Table, Checkbox } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { axios, Content } from 'yqcloud-front-boot';
import moment from 'moment';
import _ from 'lodash';
import CreateEmployeeStore from '../../../../stores/organization/employee/createEmployee/CreateEmployeeStore';
import ChoosePosition from '../editEmployee/ChoosePosition';
import ChooseRole from '../editEmployee/ChooseRole';

const { Sidebar } = Modal;
const FormItem = Form.Item;
const { Option } = Select;
const intlPrefix = 'organization.employee';
const { TabPane } = Tabs;
const inputWidth = 300;
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

function noop() {
}

@inject('AppState')
@observer
class LdapEmployee extends Component {
  state = this.getInitState();

  componentWillMount() {
    this.props.onRef(this);
    this.fetch(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.visible) {
      nextProps.form.resetFields();
      this.setState(this.getInitState());
    } else if (!this.props.visible) {
      this.fetch(nextProps);
    }
  }

  getInitState() {
    return {
      loading: false,
      employeeInfo: {
        creationDate: '',
        createdBy: '',
        lastUpdateDate: '',
        lastUpdatedBy: '',
        objectVersionNumber: '',
        attributeCategory: null,
        attribute1: null,
        attribute2: null,
        attribute3: null,
        attribute4: null,
        attribute5: null,
        attribute6: null,
        attribute7: null,
        attribute8: null,
        attribute9: null,
        attribute10: null,
        attribute11: null,
        attribute12: null,
        attribute13: null,
        attribute14: null,
        attribute15: null,
        iamOrganizationId: '',
        employeeId: '',
        employeeCode: '',
        employeeName: '',
        lastName:'',
        firstName:'',
        fixPhone:'',
        contactPhone:'',
        gender: '',
        email: '',
        mobil: '',
        bornDate: '',
        joinDate: '',
        departureDate: '',
        employeeType: '',
        companyType: '',
        status: '',
        certificateId: '',
        certificateType: '',
        isEnabled: '',
        isDeleted: '',
      },
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      departureDateVisable: true,
      insideVisable: true,
      departureTypeVisable: false,
      dataSource: [],
      // 岗位
      postVisible: false,
      deletePostVisible: false,
      dataSourcePost: [],
      dataSourcePostNew: [],
      selectedPostRowKeys: [],
      selectedPostRows: [],
      postSubmitting: false,
      mainPositionId: '',
      // 角色
      roleVisible: false,
      deleteRoleVisible: false,
      dataSourceRole: [],
      dataSourceRoleNew: [],
      selectedRoleRowKeysMain: [],
      selectedRoleRowsMain: [],
      roleSubmitting: false,


      jiaoJiId: [],
      jiaoJiId2: [],

      // 绑定历史
      dataSourceHis: [],

      // 登录历史
      dataSourceLoginHis: [],
      loginMethodTypes: [],

      certificateTypePattern: '',
      selectedData: '',
      visibleAssign: false,


      startValue: null,
      endValue: null,
      nEndValue: null,


      positionNew: [],
      roleNew: [],

      ldapArray: [],
      empLdapInfo: [],
      extendedFieldList:[],
      extendedFieldListFromData:{}
    };
  }

  getEmployeeInfoById(organizationId, id) {
    CreateEmployeeStore.getEmployeeInfoById(organizationId, id)
      .then((data) => {
        if (data) {
          this.setState({
            employeeInfo: data.content[0],
            extendedFieldListFromData: data.content[0].employeeExtValues,
            departureDateVisable: data.content[0].status !== 'QUIT',
            insideVisable: data.content[0].employeeType !== 'EXTERNAL',
            departureTypeVisable: data.content[0].employeeType === 'EXTERNAL',
            certificateTypePattern: data.content[0].certificateType,
          });
          if(data.content[0].userId){
            this.loadLoginHistory(organizationId, data.content[0].userId);
          }
        }
        CreateEmployeeStore.loadparentCompany(organizationId);
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  fetch(props) {
    const { AppState, edit, id } = props;
    const { id: organizationId } = AppState.currentMenuType;
    this.setState({
      employeeId: id,
      positionNew: [],
    });
    const _this = this;
    if (edit) {
      this.getEmployeePostionById(organizationId, id);
      this.loadRole(organizationId, id);

      this.getEmployeeInfoById(organizationId, id);
      this.loadHistory(organizationId, id);
    }
    CreateEmployeeStore.queryExtendedField(organizationId).then((data)=>{
      _this.setState({
        extendedFieldList:data.result
      });
    });
    CreateEmployeeStore.queryEmpList(organizationId);
    CreateEmployeeStore.queryStatusList(organizationId);
    CreateEmployeeStore.queryGenderList(organizationId);
    CreateEmployeeStore.queryZJList(organizationId);
  }

  /**
   * 离职日期验证
   * @param rule
   * @param departureDate
   * @param callback
   */
  checkDepartureDate = (rule, departureDate, callback) => {
    const { intl } = this.props;
    const { departureDateVisable } = this.state;
    if (!departureDateVisable && !departureDate) {
      callback(CreateEmployeeStore.languages[`${intlPrefix}.departuredate.require.msg`]);
    } else {
      callback();
    }
  };

  /**
   * 员工姓名验证
   * @param rule
   * @param value
   * @param callback
   */
  checkEmployeeName = (rule, value, callback) => {
    const { intl } = this.props;
    if (!value) {
      callback(CreateEmployeeStore.languages[`${intlPrefix}.employeename.require.msg`]);
      return;
    }
    callback();
  };

  checkEmployeeCode = (rule, value, callback) => {
    const { AppState, intl } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    if (value !== this.state.employeeInfo.employeeCode) {
      CreateEmployeeStore.checkEmployeeCode(organizationId, value).then((data) => {
        if (data) {
          callback();
        } else {
          callback(CreateEmployeeStore.languages[`${intlPrefix}.code.exist.msg`]);
        }
      });
    } else {
      callback();
    }
  };

  checkEmail = (rule, value, callback) => {
    const { AppState, intl } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    if (value !== this.state.employeeInfo.email) {
      CreateEmployeeStore.checkEmailCode(organizationId, value).then((data) => {
        if (data) {
          callback();
        } else {
          callback(CreateEmployeeStore.languages[`${intlPrefix}.email.exist.msg`]);
        }
      });
    } else {
      callback();
    }
  };

  checkMobilPhone = (rule, value, callback) => {
    const { AppState, intl } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    if (value !== this.state.employeeInfo.mobil) {
      CreateEmployeeStore.checkMobilCode(organizationId, value).then((data) => {
        if (data) {
          callback();
        } else {
          callback(CreateEmployeeStore.languages[`${intlPrefix}.mobil.exist.msg`]);
        }
      });
    } else {
      callback();
    }
  };

  /**
   * 员工状态改变时
   * @param value
   */
  handleStatusChange = (value) => {
    if (value === 'QUIT') {
      this.setState({
        departureDateVisable: false,
      });
    } else {
      this.setState({
        departureDateVisable: true,
      });
    }
    this.props.form.resetFields('departureDate');
  };

  handleInsideChange = (value) => {
    if (value === 'EXTERNAL') {
      this.setState({
        insideVisable: false,
      });
    } else {
      this.setState({
        insideVisable: true,
      });
    }
    this.props.form.resetFields('departureDate');
  };

  /**
   * 证件类型改变时
   * @param value
   */
  handleCertificateTypeChange = (value) => {
    this.setState({
      certificateTypePattern: value,
    });
    this.props.form.resetFields('certificateId');
  };

  /**
   * 限制日期范围
   * @param current
   * @returns {*|boolean}
   */
    // disabledBornDateDate = current =>{
    //
    //   current && current >= moment().endOf('day')&&current<= moment().endOf(this.state.employeeInfo.joinDate)
    // }

  onChange = (field, value) => {
    this.setState({
      [field]: value,
    });
  };

  disabledStartDate = (startValue) => {
    const endValue = moment(this.state.endValue ? this.state.endValue : this.state.employeeInfo.joinDate);
    if (!startValue || !endValue) {
      return false;
    }
    return startValue.valueOf() > endValue.valueOf();
  };

  onStartChange = (value) => {
    this.onChange('startValue', value);
  };


  disabledEndDate = (endValue) => {
    const startValue = moment(this.state.startValue ? this.state.startValue : this.state.employeeInfo.bornDate);
    const nEndValue = moment(this.state.nEndValue ? this.state.nEndValue : this.state.employeeInfo.departureDate);
    if (!endValue || !startValue) {
      return false;
    }
    return ((endValue.valueOf() > nEndValue.valueOf()));
  };

  onEndChange = (value) => {
    this.onChange('endValue', value);
  };

  disabledNEndDate = (nEndValue) => {
    const endValue = moment(this.state.endValue ? this.state.endValue : this.state.employeeInfo.joinDate);
    if (!nEndValue || !endValue) {
      return false;
    }
    return nEndValue.valueOf() <= endValue.valueOf();
  };

  onNEndChange = (value) => {
    this.onChange('nEndValue', value);
  };


  handleCancel = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      if (!modify) {
        OnCloseModel();
      } else {
        Modal.confirm({
          title: CreateEmployeeStore.languages[`${intlPrefix}.cancel.title`],
          content: CreateEmployeeStore.languages[`${intlPrefix}.cancel.content`],
          okText: CreateEmployeeStore.languages.confirm,
          cancelText: CreateEmployeeStore.languages.cancel,
          onOk: () => (
            OnCloseModel()
          ),
        });
      }
    });
  };


  // 根据ID加载员工岗位信息
  getEmployeePostionById(organizationId, id) {
    CreateEmployeeStore.getEmployeePostionById(organizationId, id)
      .then((data) => {
        if (data) {
          data.map((v) => {
            v.key = v.positionId;
            return v;
          });
          this.setState({
            dataSourcePost: data,
            dataSourcePostNew: data,
            selectedPostRowKeys: [],
            selectedRoleRowKeysMain: [],
          });
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  // 岗位刷新
  handlePostRefresh() {
    const { AppState, id } = this.props;
    const { dataSourcePost } = this.state;
    const { id: organizationId } = AppState.currentMenuType;
    this.getEmployeePostionById(organizationId, id);
    this.renderPost();
    this.setState({
      selectedPostRowKeys: [],
      selectedPostRows: [],
    });
  }

  // 渲染选择主岗位
  renderColumns(defaultChecked, record, column) {
    return (
      <div>
        <Checkbox
          style={{ margin: '-5px 0' }}
          checked={defaultChecked}
          onChange={e => this.handleChange(e.target.checked, record, column)}
        />
      </div>
    );
  }

  handleChange(value, key, column) {
    const newData = [...this.state.dataSourcePost];
    const target = newData.filter(item => key === item.key)[0];
    if (column === 'isMainPosition') {
      newData.forEach((v) => {
        v.isMainPosition = 'N';
      });
    }
    if (target) {
      target[column] = value ? 'Y' : 'N';
      this.setState({
        mainPositionId: target.positionId,
        dataSourcePost: newData,
      });
    }
  }

  // 岗位的取消
  handlePostCancel = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    const { dataSourcePost, data } = this.state;
    let judge = false;
    data.some((v, i) => {
      if (dataSourcePost[i].isEnabled !== v.isEnabled || dataSourcePost[i].isPrimaryPosition !== v.isPrimaryPosition) {
        judge = true;
        return true;
      }
      return false;
    });
    if (judge) {
      Modal.confirm({
        title: CreateEmployeeStore.languages[`${intlPrefix}.cancel.title`],
        content: CreateEmployeeStore.languages[`${intlPrefix}.cancel.content`],
        onOk: () => (
          OnCloseModel()
        ),
      });
    } else {
      OnCloseModel();
    }
  };

  // 删除岗位
  deleteEmoPost = () => {
    const { selectedPostRows, dataSourcePostNew, positionNew } = this.state;
    const { AppState, intl } = this.props;
    const { id } = AppState.currentMenuType;
    //  删除前弹窗确认
    Modal.confirm({
      title: CreateEmployeeStore.languages[`${intlPrefix}.action.delete.model`],
      okType: 'danger',
      onOk: () => {
        const empPostIds = [];
        selectedPostRows.forEach((v) => {
          empPostIds.push(v.positionId);
        });
        const positionNewIds = [];
        positionNew.forEach((v) => {
          positionNewIds.push(v.positionId);
        });
        // let idPostObjNew=_.difference(empPostIds,positionNewIds);
        this.state.jiaoJiId2 = [];
        this.state.jiaoJiId2 = _.intersection(empPostIds, positionNewIds);
        const empPositionIds = [];
        selectedPostRows.forEach((v) => {
          empPositionIds.push(v.empPositionId);
        });
        const empPositionIdsNew = _.compact(empPositionIds);
        let a = false;
        empPositionIds.forEach((v) => {
          if (v == undefined) {
            return a = true;
          }
        });

        const deletePostIds = [];
        selectedPostRows.forEach((v) => {
          deletePostIds.push(v.positionId);
        });
        const deletePost = _.compact(deletePostIds);

        if (a == true) {
          for (let i = dataSourcePostNew.length - 1; i >= 0; i -= 1) {
            if (dataSourcePostNew[i].empPositionId == undefined) {
              this.state.jiaoJiId2.forEach((value) => {
                if (value === dataSourcePostNew[i].positionId) {
                  for (let j = positionNew.length - 1; j >= 0; j -= 1) {
                    if (positionNew[j].positionId === dataSourcePostNew[i].positionId) {
                      positionNew.splice(j, 1);
                    }
                  }
                  dataSourcePostNew.splice(i, 1);
                }
              });
            }
          }
          this.setState({ dataSourcePostNew }, () => {
            this.handlePostRefresh();
          });
        }
        if (empPositionIdsNew.length > 0) {
          const mainPost = [];
          dataSourcePostNew.forEach((value) => {
            if (value.isMainPosition === 'Y') {
              mainPost.push(value.positionId);
            }
          });

          if (_.intersection(mainPost, deletePost).length > 0) {
            Choerodon.prompt(CreateEmployeeStore.languages[`${intlPrefix}.action.delete.filed`]);
          } else {
            CreateEmployeeStore.deletePositionById(
              id,
              empPositionIdsNew,
            ).then((data) => {
              if (!data.failed) {
                this.handlePostRefresh();
                Choerodon.prompt(CreateEmployeeStore.languages[`${intlPrefix}.action.delete.msg`]);
              }
            });
          }
        }
      },
    });
  };

  // 展示分配岗位
  openNewPage = () => {
    this.setState({
      postVisible: true,
    });
  };

  handleChildCheck(selectedRowKeys, selectedRows) {
    this.setState({
      positionNew: selectedRows,
    });
  }

  // 分批岗位侧边栏
  renderNewAssignSideBar() {
    const { postVisible, employeeId, positionNew } = this.state;
    return (
      <ChoosePosition
        employeeId={employeeId}
        positionNew={this.state.positionNew}
        visible={postVisible}
        onRef={(node) => {
          this.choosePosition = node;
        }}
        handleChildCheck={this.handleChildCheck.bind(this)}
        OnUnchangedSuccess={() => {
          this.setState({
            postVisible: false,
            postSubmitting: false,
          });
        }}
        onSubmit={() => {
          this.setState({
            postSubmitting: true,
          });
        }}
        onSuccess={() => {
          this.setState({
            postVisible: false,
            postSubmitting: false,
          });
          this.handlePostRefresh();
        }}
        onError={() => {
          this.setState({
            postSubmitting: false,
          });
        }}
        OnCloseModel={() => {
          this.setState({
            postVisible: false,
          });
        }}
        havePrimaryPosition={this.state.dataSourcePost.length > 0}
      />
    );
  }

  // 渲染 行岗位样式
  renderPost = () => {
    //  处理列选择事件
    const { selectedPostRowKeys } = this.state;
    const rowSelection = {
      onChange: (v, valAll) => {
        this.setState({ selectedPostRowKeys: v, selectedPostRows: valAll });
      },
      selectedRowKeys: this.state.selectedPostRowKeys,
    };
    //  获取dataSource
    const { employeeInfo, dataSourcePost, dataSourcePostNew, pagination, postVisible, postSubmitting, positionNew } = this.state;

    const { AppState, intl } = this.props;

    if (positionNew.length > 0) {
      positionNew.forEach((v) => {
        dataSourcePost.push(v);
      });

      this.state.dataSourcePostNew = _.uniq(dataSourcePost);
      // this.setState({dataSourcePostNew:_.uniq(dataSourcePost)})
      // this.setState({dataSourcePostNew:dataSourcePost})
    } else {
      this.state.dataSourcePostNew = dataSourcePost;
      // this.setState({dataSourcePostNew:dataSourcePost})
    }
    const { organizationId } = AppState.currentMenuType;
    //  定义表格列
    const columns = [

      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.position.name`],
        dataIndex: 'positionName',
        key: 'positionName',
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.position.isprimaryposition`],
        dataIndex: 'isMainPosition',
        key: 'isMainPosition',
        render: (text, record) => this.renderColumns(text === 'Y', record.positionId, 'isMainPosition'),

      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.position.addTime`],
        dataIndex: 'creationDate',
        key: 'creationDate',
      },
    ];

    return (
      <div>
        <Button
          onClick={this.openNewPage}
          icon="playlist_add"
        >
          {CreateEmployeeStore.languages[`${intlPrefix}.action.new`]}
        </Button>

        <Button
          onClick={this.deleteEmoPost}
          disabled={selectedPostRowKeys.length < 1}
          icon="delete_sweep"
          type="danger"
        >
          {CreateEmployeeStore.languages.delete}
        </Button>
        <Table
          columns={columns}
          pagination={pagination}
          // dataSource={dataSourcePost}
          dataSource={dataSourcePostNew}
          rowSelection={rowSelection}
          loading={CreateEmployeeStore.isLoading}
          filterBar={false}
          bordered
        />
        {/* 员工分配岗位 */}
        <Sidebar
          title={CreateEmployeeStore.languages[`${intlPrefix}.action.selectposition`]}
          visible={postVisible}
          okText={CreateEmployeeStore.languages.save}
          cancelText={CreateEmployeeStore.languages.cancel}
          onOk={e => this.choosePosition.handlePostSubmit(e)}
          onCancel={(e) => {
            this.choosePosition.handlePostCancel(e);
          }}
          confirmLoading={postSubmitting}
        >
          {
            this.renderNewAssignSideBar()
          }
        </Sidebar>


      </div>

    );
  };


  // 角色刷新
  handleRoleRefresh = () => {
    this.setState({
      selectedRoleRowKeysMain: [],
      selectedRoleRowsMain: [],
    });
    const { AppState, id } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    this.loadRole(organizationId, id);
  };

  // 加载角色
  loadRole(organizationId, id) {
    CreateEmployeeStore.loadEmpRole(organizationId, id || 0)
      .then((data) => {
        this.setState({
          dataSourceRole: data,
          dataSourceRoleNew: data,
        });
        CreateEmployeeStore.setRoles(data);
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  // 删除橘色
  deleteEmoRole = () => {
    const { AppState, intl, selectedData, id } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { selectedRoleRowsMain, selectedRoleRowKeysMain, dataSourceRoleNew, jiaoJiId } = this.state;
    const idObj = [];
    selectedRoleRowsMain.forEach((v) => {
      idObj.push(v.id);
    });
    //  删除前弹窗确认
    Modal.confirm({
      title: CreateEmployeeStore.languages[`${intlPrefix}.editor.confirmDelete`],
      okType: 'danger',
      onOk: () => {
        const { roleNew } = this.state;
        const roleNewId = [];
        roleNew.forEach((v) => {
          roleNewId.push(v.id);
        });
        const idObjNew = _.difference(idObj, roleNewId);
        this.state.jiaoJiId = [];
        this.state.jiaoJiId = _.intersection(idObj, roleNewId);
        if (this.state.jiaoJiId.length > 0) {
          for (let i = dataSourceRoleNew.length - 1; i >= 0; i -= 1) {
            this.state.jiaoJiId.forEach((v) => {
              if (v === dataSourceRoleNew[i].id) {
                for (let j = roleNew.length - 1; j >= 0; j -= 1) {
                  if (roleNew[j].id === dataSourceRoleNew[i].id) {
                    roleNew.splice(j, 1);
                  }
                }
                dataSourceRoleNew.splice(i, 1);
              }
            });
          }
          this.setState({ dataSourceRoleNew, roleNew }, () => {
            this.handleRoleRefresh();
          });
        }
        const { AppState: { menuType: { organizationId } } } = this.props;
        CreateEmployeeStore.deleteEmoRoles(organizationId, id || 0, idObjNew)
          .then((data) => {
            if (data) {
              this.handleRoleRefresh();
              Choerodon.prompt(CreateEmployeeStore.languages['delete.success']);
            }
          });
      },
    });
  };

  // 展示分配岗位
  openNewPageRole = () => {
    this.setState({
      roleVisible: true,
    });
  };

  handleChildCheckRole(selectedRowKeys, selectedRows) {
    this.setState({
      roleNew: selectedRows,
    });
  }

  // 角色侧边栏
  renderNewRoleSideBar() {
    const { roleVisible, employeeId, positionNew } = this.state;
    return (
      <ChooseRole
        employeeId={employeeId}
        visible={roleVisible}
        handleChildCheckRole={this.handleChildCheckRole.bind(this)}
        onRef={(node) => {
          this.chooseRole = node;
        }}
        OnUnchangedSuccess={() => {
          this.setState({
            roleVisible: false,
            roleSubmitting: false,
          });
        }}
        onSubmit={() => {
          this.setState({
            roleSubmitting: true,
          });
        }}
        onSuccess={() => {
          this.setState({
            roleVisible: false,
            roleSubmitting: false,
          });
          this.handleRoleRefresh();
        }}
        onError={() => {
          this.setState({
            roleSubmitting: false,
          });
        }}
        OnCloseModel={() => {
          this.setState({
            roleVisible: false,
          });
        }}
        // havePrimaryPosition={this.state.dataSourceRole.length > 0}
      />
    );
  }

  // 渲染角色
  renderRole = () => {
    //  处理列选择事件
    const { selectedRoleRowKeysMain } = this.state;
    //  处理列选择事件
    const rowSelection = {
      //  选择记录后，将选中的记录加入selectedCodeValue状态中
      onChange: (v, valAll) => {
        this.setState({ selectedRoleRowKeysMain: v, selectedRoleRowsMain: valAll });
      },
      selectedRowKeys: this.state.selectedRoleRowKeysMain,
    };
    //  获取dataSource
    const { employeeInfo, dataSourceRole, dataSourceRoleNew, roleVisible, roleSubmitting, roleNew, employeeId } = this.state;

    if (roleNew.length > 0) {
      roleNew.forEach((v) => {
        dataSourceRole.push(v);
      });
      this.state.dataSourceRoleNew = _.uniq(dataSourceRole);
    } else {
      this.state.dataSourceRoleNew = dataSourceRole;
    }
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    //  定义表格列
    dataSourceRole.forEach((v) => {
      v.key = v.roleId;
    });
    const columns = [

      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.role.name`],
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.role.description`],
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.role.addtime`],
        dataIndex: 'creationDate',
        key: 'creationDate',
      },
    ];

    return (
      <div>
        <Button
          onClick={this.openNewPageRole}
          icon="playlist_add"
        >
          {CreateEmployeeStore.languages[`${intlPrefix}.action.new`]}
        </Button>

        <Button
          onClick={this.deleteEmoRole}
          disabled={selectedRoleRowKeysMain.length < 1}
          icon="delete_sweep"
          type="danger"
        >
          {CreateEmployeeStore.languages.delete}
        </Button>
        <Table

          columns={columns}
          dataSource={dataSourceRoleNew}
          rowSelection={rowSelection}
          // dataSource={roleNew}
          loading={CreateEmployeeStore.isLoading}
          filterBar={false}
          bordered
        />
        {/* 员工分配角色 */}
        <Sidebar
          title={CreateEmployeeStore.languages[`${intlPrefix}.action.selectrole`]}
          visible={roleVisible}
          okText={CreateEmployeeStore.languages.save}
          cancelText={CreateEmployeeStore.languages.cancel}
          onOk={e => this.chooseRole.handleRoleSubmit(e)}
          onCancel={(e) => {
            this.chooseRole.handlePostCancel(e);
          }}
          confirmLoading={roleSubmitting}
        >
          {
            this.renderNewRoleSideBar()
          }
        </Sidebar>

      </div>

    );
  };


  // 加载历史

  loadHistory(organizationId, id) {
    CreateEmployeeStore.loadHistorys(organizationId, id)
      .then((data) => {
        this.setState({
          dataSourceHis: data,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  // 绑定历史
  renderHistory = () => {
    const { dataSourcePost, dataSourceHis, roleVisible, roleSubmitting } = this.state;
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;

    //  定义表格列
    const columns = [
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.history.num`],
        dataIndex: 'positionName',
        key: '',
        render: (text, record, index) => <span>{index + 1}</span>,
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.history.email`],
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.history.empName`],
        dataIndex: 'employeeName',
        key: 'employeeName',
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.history.time`],
        dataIndex: 'bindingDate',
        key: 'bindingDate',
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.history.unTime`],
        dataIndex: 'untyingDate',
        key: 'untyingDate',
      },
    ];

    return (
      <div>
        <Table
          columns={columns}
          dataSource={dataSourceHis}
          loading={CreateEmployeeStore.isLoading}
          filterBar={false}
          bordered
        />
      </div>

    );
  };

  //加载登录历史
  loadLoginHistory(organizationId, userId) {
    CreateEmployeeStore.loadLoginHistorys(organizationId, userId)
      .then((data) => {
        this.setState({
          dataSourceLoginHis: data.content,
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
    CreateEmployeeStore.getLoginMethodTypes(organizationId)
      .then((d) => {
        this.setState({
          loginMethodTypes: d,
        })
      })
  }

  loginMethodCodeState = (values) => {
    const { loginMethodTypes } = this.state;
    const temp = loginMethodTypes.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  };

  //登录历史
  renderLoginHistory = () => {
    const { dataSourceLoginHis } = this.state;

    const columns = [
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.loginHistory.method`],
        dataIndex: 'loginMethod',
        key: 'loginMethod',
        render: (values, record) => this.loginMethodCodeState(record.loginMethod),
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.loginHistory.inTime`],
        dataIndex: 'loginInTime',
        key: 'loginInTime',
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.loginHistory.address`],
        dataIndex: 'address',
        key: 'address',
      },
    ];

    return (
      <div>
        <Table
          columns={columns}
          dataSource={dataSourceLoginHis}
          loading={CreateEmployeeStore.isLoading}
          filterBar={false}
          bordered
        />
      </div>

    );
  };


  // 提交按钮
  handleSubmit = (e) => {
    e.preventDefault();
    const {employeeInfo}=this.state;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      data.employeeExtValues=this.state.extendedFieldListFromData;
      if (!err) {
        const { AppState, edit, onSubmit = noop, onSuccess = noop, onError = noop, OnUnchangedSuccess = noop, intl } = this.props;
        data.companyId=data.companyId?data.companyId:'';
        data.isEnabled=employeeInfo.isEnabled;
        data.isDeleted=employeeInfo.isDeleted;
        data.abilityLabels=employeeInfo.abilityLabels;
        data.companyFullName=employeeInfo.companyFullName;
        data.companyShortName=employeeInfo.companyShortName;
        data.createdBy=employeeInfo.createdBy;
        data.creationDate=employeeInfo.creationDate;
        data.employeeExtValueList=employeeInfo.employeeExtValueList;
        data.errorReason=employeeInfo.errorReason;
        data.extFieldMap=employeeInfo.extFieldMap;
        data.fromCompany=employeeInfo.fromCompany;
        data.iamOrganizationId=employeeInfo.iamOrganizationId;
        data.imageUrl=employeeInfo.imageUrl;
        data.invitation=employeeInfo.invitation;
        data.inviteStatus=employeeInfo.inviteStatus;
        data.isBindUser=employeeInfo.isBindUser;
        data.isLdap=employeeInfo.isLdap;
        data.isPassword=employeeInfo.isPassword;
        data.labelNames=employeeInfo.labelNames;
        data.lastUpdatedBy=employeeInfo.lastUpdatedBy;
        data.organizationDTO=employeeInfo.organizationDTO;
        data.organizationId=employeeInfo.organizationId;
        data.organizationName=employeeInfo.organizationName;
        data.positionName=employeeInfo.positionName;
        data.projectNames=employeeInfo.projectNames;
        data.user=employeeInfo.user;
        data.userId=employeeInfo.userId;
        data.wechatUser=employeeInfo.wechatUser;
        data.wechatUserId=employeeInfo.wechatUserId;
        const menuType = AppState.currentMenuType;
        const organizationId = menuType.id;
        const { positionNew, dataSourcePostNew, roleNew, jiaoJiId, jiaoJiId2, empLdapInfo, mainPositionId } = this.state;
        // onSubmit();
        // 格式化日期
        let bornDate = data.bornDate || '';
        let joinDate = data.joinDate || '';
        if (bornDate) {
          bornDate = bornDate.format('YYYY-MM-DD HH:mm:ss');
        }
        if (joinDate) {
          joinDate = joinDate.format('YYYY-MM-DD HH:mm:ss');
        }
        const positionIdList = [];
        positionNew.forEach((v) => {
          positionIdList.push(v.positionId);
        });

        const roleIdList = [];
        const result = [];
        roleNew.forEach((v) => {
          roleIdList.push(v.id);
        });
        let objPost = false;
        dataSourcePostNew.forEach((value) => {
          if (value.isMainPosition === 'Y') {
            objPost = true;
          }
        });
        if (objPost === false) {
          if (!mainPositionId && positionIdList.length > 0) {
            Choerodon.prompt(CreateEmployeeStore.languages[`${intlPrefix}.please`]);
            onError();
            return false;
          }
        }
        if (!mainPositionId && positionIdList.length > 0) {
          Choerodon.prompt(CreateEmployeeStore.languages[`${intlPrefix}.please`]);
          onError();
          return false;
        }
        if (this.props.isLDAP) {
          if (empLdapInfo.length > 0) {
            empLdapInfo.map((v, index) => {
              result.push({
                email: v.mail,
                employeeCode: v.employeeNumber,
                employeeName: v.displayName,
                employeeType: 'INTERNAL',
                fromCompany: ' ',
                gender: 'UNCERTAIN',
                invitation: true,
                inviteStatus: 'JOINED',
                isEnabled: 'Y',
                mobil: v.mobile,
                firstName: v.firstName,
                lastName: v.lastName,
                fixPhone: v.fixPhone,
                contactPhone: v.contactPhone,
                roleIdList: roleIdList || null,
                positionIdList: positionIdList || null,
                status: 'REGULAR',
                mainPositionId,
              });
              if (empLdapInfo.length - 1 === index) {
                CreateEmployeeStore.createLdapEmp(organizationId, result).then((data) => {
                  if (data.length > 7) {

                    CreateEmployeeStore.getEmployeeExistCode(data.split(' ')[0], data.split(' ')[1]);

                    onError();
                  } else {
                    Choerodon.prompt(CreateEmployeeStore.languages['create.success']);
                    // document.location.reload();
                    onSuccess();
                  }
                }).catch((error) => {
                  onError();
                  Choerodon.handleResponseError(error);
                });
              }
            });
          } else {
            const { employeeInfo } = this.state;
            if ((jiaoJiId.length > 0) && (jiaoJiId2.length === 0)) {
              const jiaoJiIdQuYu = _.difference(roleIdList, jiaoJiId);
              CreateEmployeeStore.updateEmployee(organizationId, {
                ...data,
                employeeId: employeeInfo.employeeId || '',
                objectVersionNumber: employeeInfo.objectVersionNumber || '',
                bornDate,
                joinDate,
                departureDate,
                // inviteStatus: null,
                roleIdList: jiaoJiIdQuYu || null,
                positionIdList: positionIdList || null,
                mainPositionId,
              }).then(({ failed }) => {
                if (failed) {
                  // Choerodon.prompt(message);
                  onError();
                } else {
                  Choerodon.prompt(CreateEmployeeStore.languages['modify.success']);
                  // document.location.reload();
                  onSuccess();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else if ((jiaoJiId.length === 0) && (jiaoJiId2.length > 0)) {
              const jiaoJiIdQuYu2 = _.difference(positionIdList, jiaoJiId2);
              CreateEmployeeStore.updateEmployee(organizationId, {
                ...data,
                employeeId: employeeInfo.employeeId || '',
                objectVersionNumber: employeeInfo.objectVersionNumber || '',
                bornDate,
                joinDate,
                // inviteStatus: null,
                roleIdList: roleIdList || null,
                positionIdList: jiaoJiIdQuYu2 || null,
                mainPositionId,
              }).then(({ failed }) => {
                if (failed) {
                  // Choerodon.prompt(message);
                  onError();
                } else {
                  Choerodon.prompt(CreateEmployeeStore.languages['modify.success']);
                  // document.location.reload();
                  onSuccess();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else if ((jiaoJiId.length > 0) && (jiaoJiId2.length > 0)) {
              const jiaoJiIdQuYu = _.difference(roleIdList, jiaoJiId);
              const jiaoJiIdQuYu2 = _.difference(positionIdList, jiaoJiId2);
              CreateEmployeeStore.updateEmployee(organizationId, {
                ...data,
                employeeId: employeeInfo.employeeId || '',
                objectVersionNumber: employeeInfo.objectVersionNumber || '',
                bornDate,
                joinDate,
                // inviteStatus: null,
                roleIdList: jiaoJiIdQuYu || null,
                positionIdList: jiaoJiIdQuYu2 || null,
                mainPositionId,
              }).then(({ failed }) => {
                if (failed) {
                  // Choerodon.prompt(message);
                  onError();
                } else {
                  Choerodon.prompt(CreateEmployeeStore.languages['modify.success']);
                  // document.location.reload();
                  onSuccess();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              CreateEmployeeStore.updateEmployee(organizationId, {
                ...data,
                employeeId: employeeInfo.employeeId || '',
                objectVersionNumber: employeeInfo.objectVersionNumber || '',
                bornDate,
                joinDate,
                // inviteStatus: null,
                roleIdList: roleIdList || null,
                positionIdList: positionIdList || null,
                mainPositionId,
              }).then(({ failed }) => {
                if (failed) {
                  // Choerodon.prompt(message);
                  onError();
                } else {
                  Choerodon.prompt(CreateEmployeeStore.languages['modify.success']);
                  // document.location.reload();
                  onSuccess();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            }
          }
        } else if (edit) {
          const { employeeInfo } = this.state;
          const { certificateTypePattern } = this.state;
          // 如果状态不为离职时，离职日期设为空
          let departureDate = data.departureDate || '';
          if (data.status !== 'QUIT') {
            departureDate = '';
          }
          if (departureDate) {
            departureDate = departureDate.format('YYYY-MM-DD HH:mm:ss');
          }
          if (certificateTypePattern == undefined) {
            if ((jiaoJiId.length > 0) && (jiaoJiId2.length === 0)) {
              const jiaoJiIdQuYu = _.difference(roleIdList, jiaoJiId);
              CreateEmployeeStore.updateEmployee(organizationId, {
                ...data,
                employeeId: employeeInfo.employeeId || '',
                objectVersionNumber: employeeInfo.objectVersionNumber || '',
                bornDate,
                joinDate,
                departureDate,
                // inviteStatus: null,
                roleIdList: jiaoJiIdQuYu || null,
                positionIdList: positionIdList || null,
                mainPositionId,
                certificateId: '',
                certificateType: '',
              }).then(({ failed }) => {
                if (failed) {
                  // Choerodon.prompt(message);
                  onError();
                } else {
                  Choerodon.prompt(CreateEmployeeStore.languages['modify.success']);
                  // document.location.reload();
                  onSuccess();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else if ((jiaoJiId.length === 0) && (jiaoJiId2.length > 0)) {
              const jiaoJiIdQuYu2 = _.difference(positionIdList, jiaoJiId2);
              CreateEmployeeStore.updateEmployee(organizationId, {
                ...data,
                employeeId: employeeInfo.employeeId || '',
                objectVersionNumber: employeeInfo.objectVersionNumber || '',
                bornDate,
                joinDate,
                departureDate,
                // inviteStatus: null,
                roleIdList: roleIdList || null,
                positionIdList: jiaoJiIdQuYu2 || null,
                mainPositionId,
                certificateId: '',
                certificateType: '',
              }).then(({ failed }) => {
                if (failed) {
                  // Choerodon.prompt(message);
                  onError();
                } else {
                  Choerodon.prompt(CreateEmployeeStore.languages['modify.success']);
                  // document.location.reload();
                  onSuccess();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else if ((jiaoJiId.length > 0) && (jiaoJiId2.length > 0)) {
              const jiaoJiIdQuYu = _.difference(roleIdList, jiaoJiId);
              const jiaoJiIdQuYu2 = _.difference(positionIdList, jiaoJiId2);
              CreateEmployeeStore.updateEmployee(organizationId, {
                ...data,
                employeeId: employeeInfo.employeeId || '',
                objectVersionNumber: employeeInfo.objectVersionNumber || '',
                bornDate,
                joinDate,
                departureDate,
                // inviteStatus: null,
                roleIdList: jiaoJiIdQuYu || null,
                positionIdList: jiaoJiIdQuYu2 || null,
                mainPositionId,
                certificateId: '',
                certificateType: '',
              }).then(({ failed }) => {
                if (failed) {
                  // Choerodon.prompt(message);
                  onError();
                } else {
                  Choerodon.prompt(CreateEmployeeStore.languages['modify.success']);
                  // document.location.reload();
                  onSuccess();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            } else {
              CreateEmployeeStore.updateEmployee(organizationId, {
                ...data,
                employeeId: employeeInfo.employeeId || '',
                objectVersionNumber: employeeInfo.objectVersionNumber || '',
                bornDate,
                joinDate,
                departureDate,
                // inviteStatus: null,
                roleIdList: roleIdList || null,
                positionIdList: positionIdList || null,
                mainPositionId,
                certificateType: '',
                certificateId: '',
              }).then(({ failed }) => {
                if (failed) {
                  // Choerodon.prompt(message);
                  onError();
                } else {
                  Choerodon.prompt(CreateEmployeeStore.languages['modify.success']);
                  // document.location.reload();
                  onSuccess();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
              });
            }
          } else if ((jiaoJiId.length > 0) && (jiaoJiId2.length === 0)) {
            const jiaoJiIdQuYu = _.difference(roleIdList, jiaoJiId);
            CreateEmployeeStore.updateEmployee(organizationId, {
              ...data,
              employeeId: employeeInfo.employeeId || '',
              objectVersionNumber: employeeInfo.objectVersionNumber || '',
              bornDate,
              joinDate,
              departureDate,
              // inviteStatus: null,
              roleIdList: jiaoJiIdQuYu || null,
              positionIdList: positionIdList || null,
              mainPositionId,
            }).then(({ failed }) => {
              if (failed) {
                // Choerodon.prompt(message);
                onError();
              } else {
                Choerodon.prompt(CreateEmployeeStore.languages['modify.success']);
                // document.location.reload();
                onSuccess();
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
            });
          } else if ((jiaoJiId.length === 0) && (jiaoJiId2.length > 0)) {
            const jiaoJiIdQuYu2 = _.difference(positionIdList, jiaoJiId2);
            CreateEmployeeStore.updateEmployee(organizationId, {
              ...data,
              employeeId: employeeInfo.employeeId || '',
              objectVersionNumber: employeeInfo.objectVersionNumber || '',
              bornDate,
              joinDate,
              departureDate,
              // inviteStatus: null,
              roleIdList: roleIdList || null,
              positionIdList: jiaoJiIdQuYu2 || null,
              mainPositionId,
            }).then(({ failed }) => {
              if (failed) {
                // Choerodon.prompt(message);
                onError();
              } else {
                Choerodon.prompt(CreateEmployeeStore.languages['modify.success']);
                // document.location.reload();
                onSuccess();
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
            });
          } else if ((jiaoJiId.length > 0) && (jiaoJiId2.length > 0)) {
            const jiaoJiIdQuYu = _.difference(roleIdList, jiaoJiId);
            const jiaoJiIdQuYu2 = _.difference(positionIdList, jiaoJiId2);
            CreateEmployeeStore.updateEmployee(organizationId, {
              ...data,
              employeeId: employeeInfo.employeeId || '',
              objectVersionNumber: employeeInfo.objectVersionNumber || '',
              bornDate,
              joinDate,
              departureDate,
              // inviteStatus: null,
              roleIdList: jiaoJiIdQuYu || null,
              positionIdList: jiaoJiIdQuYu2 || null,
              mainPositionId,
            }).then(({ failed }) => {
              if (failed) {
                // Choerodon.prompt(message);
                onError();
              } else {
                Choerodon.prompt(CreateEmployeeStore.languages['modify.success']);
                // document.location.reload();
                onSuccess();
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
            });
          } else {
            CreateEmployeeStore.updateEmployee(organizationId, {
              ...data,
              employeeId: employeeInfo.employeeId || '',
              objectVersionNumber: employeeInfo.objectVersionNumber || '',
              bornDate,
              joinDate,
              departureDate,
              // inviteStatus: null,
              roleIdList: roleIdList || null,
              positionIdList: positionIdList || null,
              mainPositionId,
            }).then(({ failed }) => {
              if (failed) {
                // Choerodon.prompt(message);
                onError();
              } else {
                Choerodon.prompt(CreateEmployeeStore.languages['modify.success']);
                // document.location.reload();
                onSuccess();
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
            });
          }
        } else {
          CreateEmployeeStore.createEmployee(organizationId, {
            ...data,
            bornDate,
            joinDate,
            // employeeType: 0,
            iamOrganizationId: organizationId,
            departureDate: '',
            roleIdList: roleIdList || null,
            positionIdList: positionIdList || null,
            mainPositionId,
          }).then(({ failed }) => {
            if (failed) {
              // Choerodon.prompt(message);
              onError();
            } else {
              Choerodon.prompt(CreateEmployeeStore.languages['create.success']);
              // document.location.reload();
              onSuccess();
            }
          }).catch((error) => {
            onError();
            Choerodon.handleResponseError(error);
          });
        }
        // onSubmit();
      }else {
        if(err.employeeCode){
          Choerodon.prompt(`${err.employeeCode.errors[0].message}`,undefined, undefined,'bottomLeft' );
        }else if(err.email){
          Choerodon.prompt(`${err.email.errors[0].message}`,undefined, undefined,'bottomLeft' );
        }else if(err.employeeName){
          Choerodon.prompt(`${err.employeeName.errors[0].message}`,undefined, undefined,'bottomLeft' );
        }else if(err.gender){
          Choerodon.prompt(`${err.gender.errors[0].message}`,undefined, undefined,'bottomLeft' );
        }else if(err.mobil){
          Choerodon.prompt(`${err.mobil.errors[0].message}`,undefined, undefined,'bottomLeft' );
        }else if(err.status){
          Choerodon.prompt(`${err.status.errors[0].message}`,undefined, undefined,'bottomLeft' );
        }else {
          for(var i in this.state.extendedFieldList){
            if(err[this.state.extendedFieldList[i].fieldCode]){
              Choerodon.prompt(`${err[this.state.extendedFieldList[i].fieldCode].errors[0].message}`,undefined, undefined,'bottomLeft' );
              break
            }
          }
          // this.state.extendedFieldList.forEach(item=>{
          //   if(err[item.fieldCode]){
          //     Choerodon.prompt(`${err[item.fieldCode].errors[0].message}`,undefined, undefined,'bottomLeft' );
          //   }
          // })
        }
      }
    });
  };

  /* 自动匹配LDAP成员 */
  loadLdapEmp = (value) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const valueObj = [];
    const hanYu = /^[\u4e00-\u9fa5]+$/;
    valueObj.push(value);
    if (hanYu.test(value)) {
      if (value.length > 1) {
        this.setState({ loading: true });
        CreateEmployeeStore.getLdapEmp(organizationId, valueObj).then((data) => {
          this.setState({ ldapArray: data, loading: false });
        });
      }
    } else if (value.length > 3) {
      this.setState({ loading: true });
      CreateEmployeeStore.getLdapEmp(organizationId, valueObj).then((data) => {
        this.setState({ ldapArray: data, loading: false });
      });
    }
  };

  ldapSelect = (value, e) => {
    const { empLdapInfo } = this.state;
    empLdapInfo.push(e.props);
    this.setState({
      empLdapInfo,
    });
  };

  ldapDeselect = (value, e) => {
    const { empLdapInfo } = this.state;
    empLdapInfo.splice(empLdapInfo.findIndex(item => item.value === value), 1);

    this.setState({
      empLdapInfo,
    });
  };

  renderOption = (data) => {
    const result = [];
    if (Array.isArray(data)) {
      if (data.length) {
        data.forEach((item) => {
          const { sn, displayName } = item;
          result.push(<Option key={sn} value={item.sn} {...item}>{sn}{displayName}</Option>);
        });
      }
    }
    return result;
  };

  extendedFieldOnChange=(e,data)=>{
    const {extendedFieldListFromData} = this.state;
    extendedFieldListFromData[`${data.fieldCode}`]= e.target.value
    this.setState({
      extendedFieldListFromData
    })
  };

  setCheckemail=(e)=>{
    if(e.target.value){
      if(!this.props.form.getFieldsValue().mobil){
        this.props.form.setFields({
          mobil: {
            value: this.props.form.getFieldsValue().mobil,
          },
        });
      }
    }
  };

  setCheckmobil=(e)=>{
    if(e.target.value){
      if(!this.props.form.getFieldsValue().email){
        this.props.form.setFields({
          email: {
            value: this.props.form.getFieldsValue().email,
          },
        });
      }
    }
  };

  render() {
    const { AppState, edit, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationName = menuType.name;
    const { getFieldDecorator } = this.props.form;
    const { employeeInfo, certificateTypePattern, nEndValue, startValue, endValue, ldapArray } = this.state;
    const empLists = CreateEmployeeStore.getEmpList;
    const lanOptionEmp = [];
    const statusLists = CreateEmployeeStore.getStatusList;
    const lanOptionSta = [];
    const genderLists = CreateEmployeeStore.getGenderList;
    const lanOptionGend = [];
    const zJLists = CreateEmployeeStore.getZJList;
    const lanOptionZJ = [];
    const inviteStatusList = CreateEmployeeStore.getInviteStatus;
    const organizations = CreateEmployeeStore.getCompanyNameList;
    const orgOption = [];
    organizations && organizations.forEach((item) => {
      orgOption.push(<Option value={item.companyId}>{`${item.companyFullName}（${item.companyCode}）`}</Option>);
    });

    empLists.forEach((item) => {
      lanOptionEmp.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    statusLists.forEach((item) => {
      lanOptionSta.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    genderLists.forEach((item) => {
      lanOptionGend.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    zJLists.forEach((item) => {
      lanOptionZJ.push(<Option key={item.lookupValue} value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });

    const extendedFieldList = [];
    if(this.state.extendedFieldList){
      this.state.extendedFieldList.forEach(item=>{
        extendedFieldList.push(
          <div style={{ display: 'inline-block',marginRight:'20px',verticalAlign: 'bottom'}}>
            <FormItem
              {...formItemLayout}
            >
              {getFieldDecorator(`${item.fieldCode}`, {
                rules: [
                  {
                    required: item.required,
                    message: CreateEmployeeStore.languages[`${intlPrefix}.mustFillNull`],
                  },
                ],
                initialValue: employeeInfo.employeeExtValues?employeeInfo.employeeExtValues[`${item.fieldCode}`]|| '':'',
                validateFirst: true,
              })(
                <Input
                  autoComplete="off"
                  label={item.fieldName}
                  style={{ width: inputWidth }}
                  onChange={(e)=>this.extendedFieldOnChange(e,item)}
                  maxLength={20}
                />,
              )}
            </FormItem>
          </div>
        )
      });
    }

    return (
      <Content
        className="sidebar-content"
        values={{ name: edit ? employeeInfo.employeeName : organizationName }}
      >
        {this.props.edit ? (
          <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical">
            <Tabs defaultActiveKey="1">
              <TabPane tab="基本信息" key="1">
                <div style={{ position: 'relative', height: 550 }}>
                  <div style={{ position: 'relative' }}>
                    {/* 员工编码 */}
                    <div style={{ display: 'inline-block', position: 'absolute' }}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('employeeCode', {
                          rules: [
                            {
                              required: true,
                              message: CreateEmployeeStore.languages[`${intlPrefix}.employeecode.require.msg`],
                            },
                            {
                              pattern: /^([A-Za-z0-9.])+$/,
                              message: CreateEmployeeStore.languages[`${intlPrefix}.directory.code.patternLDAP`],
                            },

                            {
                              validator: this.checkEmployeeCode,
                            },
                          ],
                          normalize: (value) => {
                            if (value) {
                              return value.toUpperCase();
                            }
                          },
                          validateTrigger: 'onBlur',
                          initialValue: employeeInfo.employeeCode || '',
                          validateFirst: true,
                        })(
                          <Input
                            disabled
                            autoComplete="off"
                            label={CreateEmployeeStore.languages[`${intlPrefix}.employeecode`]}
                            style={{ width: inputWidth }}
                            maxLength={20}
                          />,
                        )}
                      </FormItem>
                    </div>
                    {/* 员工姓名 */}
                    <div style={{ display: 'inline-block', position: 'absolute', left: 320 }}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('employeeName', {
                          rules: [
                            {
                              required: true,
                              whitespace: true,
                              message: CreateEmployeeStore.languages[`${intlPrefix}.employeename.require.msg`],
                            },
                            {
                              validator: this.checkEmployeeName,
                            },
                          ],
                          validateTrigger: 'onBlur',
                          initialValue: employeeInfo.employeeName || '',
                        })(
                          <Input
                            disabled
                            autoComplete="off"
                            label={CreateEmployeeStore.languages[`${intlPrefix}.employeename`]}
                            style={{ width: inputWidth }}
                            maxLength={60}
                          />,
                        )}
                      </FormItem>
                    </div>
                  </div>

                  <div style={{ position: 'relative', top: 80 }}>
                    {/* 邮箱 */}
                    <div style={{ display: 'inline-block', position: 'absolute' }}>
                      {employeeInfo.inviteStatus == 'INVITATING' || employeeInfo.inviteStatus == 'JOINED' ? (
                        <FormItem
                          {...formItemLayout}
                        >
                          {getFieldDecorator('email', {
                            rules: [
                              {
                                required: this.props.form.getFieldsValue().mobil?((this.props.form.getFieldsValue().mobil&&this.props.form.getFieldsValue().email)?true:false):true,
                                whitespace: true,
                                message: CreateEmployeeStore.languages[`${intlPrefix}.email.require.msg`],
                              },
                              {
                                type: 'email',
                                message: CreateEmployeeStore.languages[`${intlPrefix}.email.pattern.msg`],
                              },
                              {
                                validator: this.checkEmail,
                              },
                            ],
                            validateTrigger: 'onBlur',
                            initialValue: employeeInfo.email || '',
                            validateFirst: true,
                          })(
                            <Input
                              disabled
                              autoComplete="off"
                              onChange={this.setCheckemail}
                              label={CreateEmployeeStore.languages[`${intlPrefix}.email`]}
                              style={{ width: inputWidth }}
                              maxLength={50}
                            />,
                          )}
                        </FormItem>
                      ) : (
                        <FormItem
                          {...formItemLayout}
                        >
                          {getFieldDecorator('email', {
                            rules: [
                              {
                                required: this.props.form.getFieldsValue().mobil?((this.props.form.getFieldsValue().mobil&&this.props.form.getFieldsValue().email)?true:false):true,
                                whitespace: true,
                                message: CreateEmployeeStore.languages[`${intlPrefix}.email.require.msg`],
                              },
                              {
                                type: 'email',
                                message: CreateEmployeeStore.languages[`${intlPrefix}.email.pattern.msg`],
                              },
                              {
                                validator: this.checkEmail,
                              },
                            ],
                            validateTrigger: 'onBlur',
                            initialValue: employeeInfo.email || '',
                            validateFirst: true,
                          })(
                            <Input
                              disabled
                              autoComplete="off"
                              onChange={this.setCheckemail}
                              label={CreateEmployeeStore.languages[`${intlPrefix}.email`]}
                              style={{ width: inputWidth }}
                              maxLength={50}
                            />,
                          )}
                        </FormItem>
                      )}

                    </div>
                    {/* 手机号码 */}
                    <div style={{ display: 'inline-block', position: 'absolute', left: 320 }}>
                      {employeeInfo.inviteStatus == 'INVITATING' ? (
                        <FormItem
                          {...formItemLayout}
                        >
                          {getFieldDecorator('mobil', {
                            rules: [
                              {
                                required: this.props.form.getFieldsValue().email?'':true,
                                message: this.props.form.getFieldsValue().email?'':CreateEmployeeStore.languages[`${intlPrefix}.mobil.require.msg`],
                              },
                              // {
                              //   pattern: /^[1][3,4,5,7,8,9][\d]{9}$/,
                              //   message: CreateEmployeeStore.languages[`${intlPrefix}.number.pattern.msg`],
                              // },
                              {
                                validator: this.checkMobilPhone,
                              },
                            ],
                            validateTrigger: 'onBlur',
                            initialValue: employeeInfo.mobil || '',
                            validateFirst: true,
                          })(
                            <Input
                              autoComplete="off"
                              disabled
                              onChange={this.setCheckmobil}
                              label={CreateEmployeeStore.languages[`${intlPrefix}.phone`]}
                              style={{ width: inputWidth }}
                              maxLength={11}
                            />,
                          )}
                        </FormItem>
                      ) : (
                        <FormItem
                          {...formItemLayout}
                        >
                          {getFieldDecorator('mobil', {
                            rules: [
                              {
                                required: this.props.form.getFieldsValue().email?'':true,
                                message: this.props.form.getFieldsValue().email?'':CreateEmployeeStore.languages[`${intlPrefix}.mobil.require.msg`],
                              },
                              // {
                              //   pattern: /^[1][3,4,5,7,8,9][\d]{9}$/,
                              //   message: CreateEmployeeStore.languages[`${intlPrefix}.number.pattern.msg`],
                              // },
                              {
                                validator: this.checkMobilPhone,
                              },
                            ],
                            validateTrigger: 'onBlur',
                            initialValue: employeeInfo.mobil || '',
                            validateFirst: true,
                          })(
                            <Input
                              onChange={this.setCheckmobil}
                              disabled
                              autoComplete="off"
                              label={CreateEmployeeStore.languages[`${intlPrefix}.phone`]}
                              style={{ width: inputWidth }}
                              maxLength={11}
                            />,
                          )}
                        </FormItem>
                      )}

                    </div>
                  </div>

                  <div style={{ position: 'relative', top: 160 }}>
                    {/* 员工状态 */}
                    <div style={{ display: 'inline-block', position: 'absolute' }}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('status', {
                          initialValue: employeeInfo.status || '',
                          rules: [{
                            required: true,
                            message: CreateEmployeeStore.languages[`${intlPrefix}.status.require.msg`],
                          }],
                        })(
                          <Select
                            disabled
                            label={CreateEmployeeStore.languages[`${intlPrefix}.status`]}
                            style={{ width: inputWidth }}
                            onChange={this.handleStatusChange}
                            getPopupContainer={triggerNode => triggerNode.parentNode}
                          >
                            {lanOptionEmp}
                          </Select>,
                        )}
                      </FormItem>
                    </div>

                    <div style={{ display: 'inline-block', position: 'absolute', left: 320, marginTop: 2 }}>
                      {/* 邀请状态 */}
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('inviteStatus', {
                          validateTrigger: 'onBlur',
                          // initialValue: employeeInfo.inviteStatus?(inviteStatusList):('') || '',
                          initialValue: employeeInfo.inviteStatus ? (inviteStatusList.find(v => v.lookupValue === employeeInfo.inviteStatus) || {}).lookupMeaning : '',
                        })(
                          <Input
                            autoComplete="off"
                            label={CreateEmployeeStore.languages[`${intlPrefix}.invitationStatus`]}
                            style={{ width: inputWidth }}
                            disabled
                          />,
                        )}
                      </FormItem>
                    </div>
                  </div>

                  <div style={{ position: 'relative', top: 240 }}>
                    {/* 员工类型 */}
                    <div style={{ display: 'inline-block', position: 'absolute' }}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('employeeType', {
                          initialValue: employeeInfo.employeeType || 'INTERNAL',
                          rules: [{
                            required: true,
                            message: CreateEmployeeStore.languages[`${intlPrefix}.employee_type.require.msg`],
                          }],

                        })(
                          <Select
                            disabled
                            label={CreateEmployeeStore.languages[`${intlPrefix}.employee_type`]}
                            style={{ width: inputWidth }}
                            onChange={this.handleInsideChange}
                          >
                            {lanOptionSta}
                          </Select>,
                        )}
                      </FormItem>
                    </div>
                    {/* 员工所属公司 */}
                    <div style={{ display: 'inline-block', position: 'absolute', left: 320 }}>
                      <div>
                        <FormItem
                          {...formItemLayout}
                        >
                          {getFieldDecorator('fromCompany', {
                            validateTrigger: 'onBlur',
                            initialValue: employeeInfo.employeeType == 'EXTERNAL' ? employeeInfo.fromCompany : '',
                          })(
                            <Select
                              optionFilterProp="children"
                              disabled
                              label={CreateEmployeeStore.languages[`${intlPrefix}.employee_company`]}
                              style={{ width: inputWidth }}
                              allowClear
                              filter
                              checkbox={false}
                              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                              showCheckAll={false}
                            >
                              {orgOption}
                            </Select>,
                          )}
                        </FormItem>
                      </div>
                    </div>
                  </div>
                  <div style={{ position: 'relative', top: 320 }}>
                    {/* 性别 */}
                    <div style={{ display: 'inline-block', position: 'absolute' }}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('gender', {
                          initialValue: employeeInfo.gender || '',
                          rules: [
                            {
                              required: true,
                              message: CreateEmployeeStore.languages[`${intlPrefix}.gender.require.msg`],
                            },
                          ],
                        })(
                          <Select
                            disabled
                            label={CreateEmployeeStore.languages[`${intlPrefix}.gender`]}
                            style={{ width: inputWidth }}
                            getPopupContainer={triggerNode => triggerNode.parentNode}
                          >
                            {lanOptionGend}
                          </Select>,
                        )}
                      </FormItem>
                    </div>
                    {/* 出生日期 */}
                    <div style={{ display: 'inline-block', position: 'absolute', left: 320, marginTop: 2 }}>
                      <FormItem
                        {...formItemLayout}
                        label="DatePicker"
                      >
                        {getFieldDecorator('bornDate', {
                          rules: [],
                          initialValue: employeeInfo.bornDate ? moment(employeeInfo.bornDate, 'YYYY-MM-DD') : '',
                        })(
                          <DatePicker
                            disabled
                            allowClear={false}
                            style={{ width: inputWidth }}
                            value={startValue}
                            disabledDate={this.disabledStartDate}
                            onChange={this.onStartChange}
                            label={CreateEmployeeStore.languages[`${intlPrefix}.borndate`]}
                            getCalendarContainer={triggerNode => triggerNode.parentNode}
                          />,
                        )}
                      </FormItem>
                    </div>
                  </div>
                  <div style={{ position: 'relative', top: 400 }}>
                    {/* 入职日期 */}
                    <div style={{ display: 'inline-block', position: 'absolute' }}>
                      <FormItem
                        {...formItemLayout}
                        label="DatePicker"
                      >
                        {getFieldDecorator('joinDate', {
                          // rules: [{ required: true, message: CreateEmployeeStore.languages[ `${intlPrefix}.joindate.require.msg`] }],
                          initialValue: employeeInfo.joinDate ? moment(employeeInfo.joinDate, 'YYYY-MM-DD') : '',
                        })(
                          <DatePicker
                            disabled
                            style={{ width: inputWidth }}
                            value={endValue}
                            allowClear={false}
                            onChange={this.onEndChange}
                            disabledDate={this.disabledEndDate}
                            getCalendarContainer={triggerNode => triggerNode.parentNode}
                            format="YYYY-MM-DD"
                            label={CreateEmployeeStore.languages[`${intlPrefix}.joindate`]}
                          />,
                        )}
                      </FormItem>
                    </div>
                    {/* 离职日期 */}
                    <div style={{ display: 'inline-block', position: 'absolute', left: 320 }}>
                      <FormItem
                        {...formItemLayout}
                        label="DatePicker"
                      >
                        {getFieldDecorator('departureDate', {
                          rules: [
                            {
                              required: this.props.form.getFieldsValue().status==='QUIT'?true:false,
                              message: CreateEmployeeStore.languages[`${intlPrefix}.departuredate.require.msg`],
                            }],
                          initialValue: employeeInfo.departureDate ? moment(employeeInfo.departureDate, 'YYYY-MM-DD') : '',
                        })(
                          <DatePicker
                            allowClear={false}
                            style={{ width: inputWidth }}
                            // disabled={departureDateVisable}
                            disabled
                            value={nEndValue}
                            onChange={this.onNEndChange}
                            disabledDate={this.disabledNEndDate}
                            getCalendarContainer={triggerNode => triggerNode.parentNode}
                            format="YYYY-MM-DD"
                            label={CreateEmployeeStore.languages[`${intlPrefix}.departuredate`]}
                          />,
                        )}
                      </FormItem>
                    </div>
                  </div>

                  <div style={{ position: 'relative', top: 480 }}>

                    {/* 证件类型 */}
                    <div style={{ display: 'inline-block', position: 'absolute' }}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('certificateType', {
                          initialValue: employeeInfo.certificateType || '',
                        })(
                          <Select
                            label={CreateEmployeeStore.languages[`${intlPrefix}.certificatetype`]}
                            style={{ width: inputWidth }}
                            onChange={this.handleCertificateTypeChange}
                            allowClear
                            disabled
                            getPopupContainer={triggerNode => triggerNode.parentNode}
                          >
                            {lanOptionZJ}
                          </Select>,
                        )}
                      </FormItem>
                    </div>

                    {/* 证件号 */}
                    <div style={{ display: 'inline-block', position: 'absolute', left: 320, marginTop: 2 }}>
                      <div style={{ display: certificateTypePattern ? 'block' : 'none' }}>
                        <FormItem
                          {...formItemLayout}
                        >
                          {getFieldDecorator('certificateId', {
                            validateTrigger: 'onBlur',
                            initialValue: certificateTypePattern === undefined ? '' : employeeInfo.certificateId,
                            validateFirst: true,
                          })(
                            <Input
                              disabled
                              autoComplete="off"
                              label={CreateEmployeeStore.languages[`${intlPrefix}.certificateid`]}
                              style={{ width: inputWidth }}
                              maxLength={100}
                            />,
                          )}
                        </FormItem>
                      </div>
                    </div>
                  </div>
                </div>
              </TabPane>

              <TabPane tab="更多信息" key="2">
                <div style={{ position: 'relative', minHeight: 550 }}>
                  <div style={{ position: 'relative' }}>
                    {/* 员工姓 */}
                    <div style={{ display: 'inline-block', marginRight:'20px' }}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('lastName', {
                          rules: [],
                          initialValue: employeeInfo.lastName || '',
                          validateFirst: true,
                        })(
                          <Input
                            // disabled
                            autoComplete="off"
                            label={CreateEmployeeStore.languages[`${intlPrefix}.lastName`]}
                            style={{ width: inputWidth }}
                            maxLength={20}
                          />,
                        )}
                      </FormItem>
                    </div>
                    {/* 员工名 */}
                    <div style={{ display: 'inline-block'}}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('firstName', {
                          rules: [
                          ],
                          initialValue: employeeInfo.firstName || '',
                          validateFirst: true,
                        })(
                          <Input
                            // disabled
                            autoComplete="off"
                            label={CreateEmployeeStore.languages[`${intlPrefix}.firstName`]}
                            style={{ width: inputWidth }}
                            maxLength={50}
                          />,
                        )}
                      </FormItem>
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    {/* 固定电话 */}
                    <div style={{ display: 'inline-block', marginRight:'20px'  }}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('fixPhone', {
                          rules: [],
                          initialValue: employeeInfo.fixPhone || '',
                          validateFirst: true,
                        })(
                          <Input
                            // disabled
                            autoComplete="off"
                            label={CreateEmployeeStore.languages[`${intlPrefix}.fixPhone`]}
                            style={{ width: inputWidth }}
                            maxLength={20}
                          />,
                        )}
                      </FormItem>
                    </div>
                    {/* 联系电话 */}
                    <div style={{ display: 'inline-block'}}>
                      <FormItem
                        {...formItemLayout}
                      >
                        {getFieldDecorator('contactPhone', {
                          rules: [
                          ],
                          initialValue: employeeInfo.contactPhone || '',
                          validateFirst: true,
                        })(
                          <Input
                            // disabled
                            autoComplete="off"
                            label={CreateEmployeeStore.languages[`${intlPrefix}.mobil`]}
                            style={{ width: inputWidth }}
                            maxLength={50}
                          />,
                        )}
                      </FormItem>
                    </div>
                  </div>

                  <div style={{width:'800px' ,position: 'relative' }}>
                    {extendedFieldList}
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </Form>
        ) : this.props.isLDAP
          ? (
            <Form style={{ marginBottom: 20 }} onSubmit={this.handleSubmit.bind(this)} layout="vertical">
              <FormItem
                {...formItemLayout}
              >
                {getFieldDecorator('ldapMsg', {
                  rules: [
                    {
                      required: true,
                      message: CreateEmployeeStore.languages[`${intlPrefix}.employeecode.require.msg`],
                    },
                  ],
                  validateTrigger: 'onBlur',
                })(
                  <Select
                    mode="multiple"
                    style={{ width: '50%' }}
                    className="ldapSelectLabel"
                    label={CreateEmployeeStore.languages[`${intlPrefix}.ldapEmp`]}
                    // onChange={this.handleChangeLdap}
                    onSearch={_.debounce(value => this.loadLdapEmp(value), 800)}
                    onSelect={this.ldapSelect}
                    onDeselect={this.ldapDeselect}
                    getPopupContainer={trigger => trigger.parentNode}
                    optionFilterProp="children"
                    loading={this.state.loading}
                    filter
                    filterOption={false}
                    showCheckAll={false}
                    allowClear
                  >
                    {this.renderOption(ldapArray)}
                  </Select>,
                )}
              </FormItem>
            </Form>
          ) : ''}
        <Tabs>
          <TabPane tab={CreateEmployeeStore.languages.Position} key="1">{this.renderPost()}</TabPane>
          <TabPane tab={CreateEmployeeStore.languages.role} key="2">{this.renderRole()}</TabPane>
          <TabPane tab={CreateEmployeeStore.languages[`${intlPrefix}.bind.history`]}
                   key="3">{this.renderHistory()}</TabPane>
          <TabPane
            tab={CreateEmployeeStore.languages[`${intlPrefix}.loginHistory`]}
            key="4">{this.renderLoginHistory()}</TabPane>
        </Tabs>
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(LdapEmployee)));
