/**
 * Create By liuchuan on 2018/9/6.
 */
import React, { Component } from 'react';
import { Button, Modal, Table, Form, Input, Icon, Upload, Row, Badge, Divider,message } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { axios, Action, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import { CLIENT_ID, CLIENT_TYPE } from 'yqcloud-front-boot/lib/containers/common/constants';
import moment from 'moment';
import EditEmployee from '../editEmployee';
import LdapEmployee from '../ldapEmployee';
import './EmployeeHome.scss';
import CreateEmployeeStore from '../../../../stores/organization/employee/createEmployee/CreateEmployeeStore';
import EmployeeStore from '../../../../stores/organization/employee/EmployeeStore/EmployeeStore';
import FileSaver from 'file-saver';
import { JSEncrypt } from 'jsencrypt'


const { Sidebar } = Modal;
const intlPrefix = 'organization.employee';
const FormItem = Form.Item;
const limitSize = 1024;

@inject('AppState')
@observer
class EmployeeHome extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
  }

  state = EmployeeHome.getInitState();

  static getInitState() {
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
      sort: 'employeeId,desc',
      visible: false,
      deleteVisible: false,
      selectedData: '',
      selectedRowKeys: [],
      ValueAll: [],
      confirmLoading: false,
      confirmDeleteLoading: false,
      visibleAssign: false,
      invitationVisible: false,
      email: '',
      inputEmail: '',
      empInObj: [],
      newEmail: [],
      invitatingStatus: '',
      newNewEmail: '',
      objectVersionNumber: '',
      //  批量导入弹窗
      uploadExcelVisible: false,
      uploadInput: '',
      file: null,
      attachments: [],
      uploadDone: false,
      uploadFail: false, // 显示上传失败状态
      uploadStatus: false,
      uploadDoneNumber: '',
      //  批量邀请
      batchInvVisible: false,
      selectedRowKeysInv: [],
      ValueAllInv: [],
      dataSourceInv: [],
      loadingInv: false,
      empInvObj: [],
      invFail: false,
      dataInvFail: [],

      isLDAP: false,
      ldapVisible: false,
      TemplateError: false,
      loading: false,
      checking: false, //校验的状态
      uploadOnce: false, //标注下载一次
      tenantType:'',//租户类型,
      InvitationStaffData:'',
      resetPasswordVisible:false,
      resetPasswordLoading:false,
    };
  }

  componentWillMount() {
    this.getTenantType();
    this.fetch(this.props);
    this.queryLDAPOrg();
    this.getPasswordLContain();
    const { id: organizationId } = this.props.AppState.currentMenuType;
    CreateEmployeeStore.loadparentCompany(organizationId);
  }

  componentDidMount() {
    this.loadEmployee();
    this.loadEmpBactchInv();
    this.invitationRender();
    this.uploadExcelRender();
    this.securitySettingQuery();
    this.batchInvRender();
    this.invFailRender();
  }

  getTenantType=()=>{
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const _this =this;
    EmployeeStore.getTenantType(organizationId)
      .then(data=>{
        _this.setState({
          tenantType:data
        })
      });
  };

  fetch(props) {
    const { AppState, edit, id } = props;
    const { organizationId } = AppState.currentMenuType;
    CreateEmployeeStore.queryEmpList(organizationId);
    CreateEmployeeStore.queryStatusList(organizationId);
    CreateEmployeeStore.queryInviteStatus(organizationId);
    CreateEmployeeStore.queryGenderList(organizationId);
    CreateEmployeeStore.queryZJList(organizationId);
    CreateEmployeeStore.queryEmpZhuangTai(organizationId);
    CreateEmployeeStore.loadparentCompanyList(organizationId).then(item=>{
      if(!item.failed&&item){
        this.setState({
          companyList:item
        })
      }else {
        Choerodon.prompt(res.message);
      }
    })
      .catch((error) => {
        Choerodon.handleResponseError(error);;
      });
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CreateEmployeeStore.queryLanguage(id, AppState.currentLanguage);
  };

  // 查询是否为LDAP组织
  queryLDAPOrg = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    // return axios.get(`/iam/v1/organizations/${organizationId}`).then((data) => {
    return axios.get(`/iam/v1/${organizationId}/organizations`).then((data) => {
      this.setState({
        isLDAP: data.ldap,
      });
    });
  };

  handleRefresh = () => {
    this.setState(EmployeeHome.getInitState(), () => {
      this.queryLDAPOrg();
      this.loadEmployee();
      this.loadEmpBactchInv();
    });
    this.getTenantType();
  };

  onEdit = (id) => {
    this.setState({
      visible: true,
      edit: true,
      selectedData: id,

    });
  };

  onEditLdap = (id) => {
    this.setState({
      ldapVisible: true,
      edit: true,
      selectedData: id,
    });
  };

  loadEmployee = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState, EmployeeStore } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    EmployeeStore.loadEmployees(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
        EmployeeStore.setEmployees(data.content.map((v) => {
          if (v.gender === 'Y') {
            v.genderSeach = CreateEmployeeStore.languages[`${intlPrefix}.gender.m`];
          } else {
            v.genderSeach = CreateEmployeeStore.languages[`${intlPrefix}.gender.f`];
          }
          return v;
        }));
        this.setState({
          pagination: {
            current: (data.number || 0) + 1,
            pageSize: data.size || 10,
            total: data.totalElements || '',
            pageSizeOptions: ['25', '50', '100', '200'],
          },
          filters,
          params,
          sort,
        });
      })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
      );
  };

  openNewPage = () => {
    this.setState({
      visible: true,
      edit: false,
    });
  };

  openNewPageLdap = () => {
    this.setState({
      ldapVisible: true,
      edit: false,
    });
  };

  /*
 * 启用停用
 * */
  handleAble = (record) => {
    const { EmployeeStore, AppState, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    let { isEnabled } = record;
    isEnabled = isEnabled === 'Y' ? 'N' : 'Y';
    EmployeeStore.isEnableEmployee(organizationId, { ...record, isEnabled }).then(
      (data) => {
        if (data===1) {
          Choerodon.prompt(CreateEmployeeStore.languages[isEnabled === 'N' ? 'disableN.success' : 'enableY.success']);
          this.handleRefresh();
        }
      },
    ).catch((error) => {
      Choerodon.prompt(CreateEmployeeStore.languages[isEnabled === 'N' ? 'disableN.error' : 'enableY.error']);
    });
  };

  handleGetInputValue = (e) => {
    this.setState({
      inputEmail: e.target.value,
    });
  };


  // 解绑弹出框
  handleUnbindOk = (record) => {
    const { intl } = this.props;
    Modal.confirm({
      title: CreateEmployeeStore.languages[`${intlPrefix}.unBind.title`],
      content: CreateEmployeeStore.languages[`${intlPrefix}.unBind.content`],
      okText: CreateEmployeeStore.languages.confirm,
      cancelText: CreateEmployeeStore.languages.cancel,
      onOk: () => {
        const { AppState, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        CreateEmployeeStore.isInvUnbinding(organizationId, record.employeeId).then(({ failed, message }) => {
          if (failed) {
            Choerodon.prompt(message);
          } else {
            Choerodon.prompt(CreateEmployeeStore.languages['unBind.success']);
            this.handleRefresh();
          }
        });
      },
    });
  };

  // 解绑弹出框
  handleUnbindOkEnterprise = (record) => {
    const { intl } = this.props;
    Modal.confirm({
      title: CreateEmployeeStore.languages[`${intlPrefix}.frozen`],
      content:  CreateEmployeeStore.languages[`${intlPrefix}.determineFrozen`],
      okText: CreateEmployeeStore.languages.confirm,
      cancelText: CreateEmployeeStore.languages.cancel,
      onOk: () => {
        const { AppState, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        EmployeeStore.isInvUnbindingEnterprise(organizationId, record.employeeId).then(({ failed, message }) => {
          if (failed) {
            Choerodon.prompt(message);
          } else {
            Choerodon.prompt(CreateEmployeeStore.languages[`${intlPrefix}.frozenSuccess`]);
            this.handleRefresh();
          }
        });
      },
    });
  };

  // 邀请账户弹窗
  handleInvitation = () => {
    this.setState({
      text: '',
    });
    this.props.form.resetFields();
  };

  invitationShowModal = (record) => {
    this.setState({
      invitationVisible: true,
      id: record.employeeId,
      email: record.email,
      inputEmail: '',
      empInObj: record,
      invitatingStatus: record.inviteStatus,
      objectVersionNumber: record.objectVersionNumber,
    });
  };

  invitationSubmit = () => {
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      const { AppState, intl } = this.props;
      const { inputEmail, email, empInObj, newNewEmail, id, objectVersionNumber } = this.state;
      const { organizationId } = AppState.currentMenuType;
      empInObj.email = (inputEmail || email);
      if (err&&!err.resetPassword&&!err.resetPasswordNew) {
        // Choerodon.handleResponseError(CreateEmployeeStore.languages['user.userinfo.email.pattern.msg']);
        message.error(CreateEmployeeStore.languages['user.userinfo.email.pattern.msg'],undefined, undefined,'bottomLeft' );
      } else {
        // CreateEmployeeStore.updateEmployee(organizationId, {
        //   ...data,
        //   employeeId: id || '',
        //   email: inputEmail || email,
        //   objectVersionNumber: objectVersionNumber || '',
        // }).then((data) => {
          this.handleRefresh();
          CreateEmployeeStore.isInvEmployees(organizationId, inputEmail || email, empInObj)
            .then((data) => {
              if (data.failed) {
                //
              } else {
                CreateEmployeeStore.setRoles(data);
                this.setState({
                  dataSourceRole: data,
                  inputEmail: '',
                });
                this.handleRefresh();
                Choerodon.prompt(CreateEmployeeStore.languages[`${intlPrefix}.invitation.success.msg`]);
              }
            })
            .catch((error) => {
              // Choerodon.handleResponseError(error);
              message.error(error,undefined, undefined,'bottomLeft' );
            });
        // });
      }
    });
  };

  // 取消邀请
  isInvEmployeesCancle = (record) => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    CreateEmployeeStore.isInvEmployeesCancles(organizationId, record.employeeId)
      .then((data) => {
        ;
        this.handleRefresh();
        Choerodon.prompt(CreateEmployeeStore.languages[`${intlPrefix}.invitation.cancle.msg`]);
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  invitationCancel = (e) => {
    this.handleInvitation();
    this.setState({
      invitationVisible: false,
    });
  };

  onCancelInvitationHome = () => {
    this.setState({
      invitationVisible: false,
    });
  };

  // 校验员工邮箱是否重复
  checkEmail = (rule, value, callback) => {
    const { AppState, intl } = this.props;
    const { inputEmail, email, empInObj, newNewEmail, id, objectVersionNumber } = this.state;
    const { id: organizationId } = AppState.currentMenuType;
    if (value !== (inputEmail || email)) {
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

  // 校验邮箱方法
  checkInvaitEmail = (rule, value, callback) => {
    const { intl, AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { emailValue, id } = this.state;
    if (value != '') {
      CreateEmployeeStore.checkInvaitEmails(organizationId, value, id).then((data) => {
        if (data == 'fnd.employee.email.already.binding.another.user') {
          callback(CreateEmployeeStore.languages[`${intlPrefix}.checkEmailFiled`]);
        } else if (data == 'success') {
          this.setState({
            emailValue: value,
          });
          callback();
        }
      });
    } else {
      callback(CreateEmployeeStore.languages[`${intlPrefix}.taskComment`]);
    }
  };

  // 渲染邀请账户弹出块
  invitationRender = () => {
    const { AppState, edit, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { invitationVisible, email, invitatingStatus } = this.state;
    const { organizationId } = AppState.currentMenuType;
    return (
      <Modal
        title={CreateEmployeeStore.languages[`${intlPrefix}.invitationApprove`]}
        className="invitaOutsidePadding"
        visible={invitationVisible}
        onOk={this.invitationSubmit}
        onCancel={this.invitationCancel}
        destroyOnClose={true}
        footer={[<Button
          onClick={this.invitationSubmit}
          style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
          type="primary"
          funcType="raised"
        >
          {CreateEmployeeStore.languages.ok}
        </Button>,
          <Button
            onClick={this.invitationCancel}
            funcType="raised"
            style={{ marginRight: '20px' }}
          >
            {CreateEmployeeStore.languages.cancle}
          </Button>]}
      >
        <Form>
          <FormItem style={{ display: 'inline-block', marginTop: 30 }}>
            <span style={{ marginLeft: 40 }}>{CreateEmployeeStore.languages[`${intlPrefix}.accountInvitation`]}：</span>
            {getFieldDecorator('opinion', {
              validateTrigger: 'onBlur',
              rules: [
                {
                  required: true,
                  message: CreateEmployeeStore.languages[`${intlPrefix}.taskComment`],
                },
                {
                  pattern: /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/,
                  message: CreateEmployeeStore.languages[`${intlPrefix}.correct.messageCode`],
                },
                {
                  validator: this.checkEmail,
                },
                {
                  validator: this.checkInvaitEmail,
                },
              ],
              initialValue: email,
              validateFirst: true,

            })(
              <Input
                value={this.state.inputEmail}
                onChange={this.handleGetInputValue}
                autoComplete="off"
                autoFocus
                placeHolder={CreateEmployeeStore.languages[`${intlPrefix}.enterEmail`]}
                style={{ width: 300 }}
              />,
            )}
          </FormItem>
        </Form>
      </Modal>
    );
  };

  // 批量导入弹出框
  uploadExcelShowModal = () => {
    this.setState({
      uploadExcelVisible: true,
    });
  };

  handleUploadExcel = () => {
    this.setState({
      text: '',
    });
    this.props.form.resetFields();
  };

  uploadExcelCancel = (e) => {
    this.handleUploadExcel();
    this.setState({
      uploadExcelVisible: false,
      attachments: [],
      uploading: false,
      uploadOnce: false,
    }, () => {
      this.handleRefresh();
    });
  };

  onCancelUploadExcel = () => {
    this.setState({
      uploadExcelVisible: false,
    });
  };

  uploadConfirm = (e) => {
    e.stopPropagation();
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    this.setState({
      loading: true,
    })
    CreateEmployeeStore.uploadConfirm(organizationId).then((data) => {
      this.setState({
        uploadExcelVisible: false,
      }, () => {
        this.setState({
          loading: false,
          uploadOnce: false,
        });
      })
      this.handleRefresh();
      this.getTenantType();
    });
  };

  // 校验结果
  checkResult = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    clearTimeout(this.mySetTimeout);
    CreateEmployeeStore.queryCheck(organizationId).then((data) => {
      if (data === 'templateError') {
        this.setState({
          uploadDoneNumber: data,
          uploadStatus: true,
          uploadFail: true,
          TemplateError: true,
          uploading: false,
          checking: false,
        });
      } else if (data === 'dataRepeat') {
        this.setState({
          uploadDoneNumber: data,
          uploadStatus: true,
          uploadFail: true,
          uploading: false,
          checking: false,
        });
      } else if (data === 'formatError') {
        this.setState({
          uploadDoneNumber: data,
          uploadStatus: true,
          uploadFail: true,
          uploading: false,
          checking: false,
        });
      } else if (data === 'dataNull') {
        this.setState({
          uploadDoneNumber: data,
          uploadStatus: true,
          uploadFail: true,
          uploading: false,
          checking: false,
        });
      } else if (data === 'success') {
        this.setState({
          uploadDoneNumber: data,
          uploadStatus: true,
          uploadDone: true,
          uploading: false,
          checking: false,
        });
      } else if (data === 'processing'){
        const _this=this;
        this.mySetTimeout=setTimeout(function () {
          _this.checkResult()
        },5000);
        this.setState({
          checking: true,
        });
     }
    });
  }

  // 批量导入弹出框
  uploadExcelRender = () => {
    const { AppState, edit, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { uploadExcelVisible, email, invitatingStatus, uploadDone, uploadStatus, uploadFail, TemplateError, uploadDoneNumber, uploading, loading, checking } = this.state;
    const { organizationId } = AppState.currentMenuType;
    return (
      <Modal
        title={CreateEmployeeStore.languages[`${intlPrefix}.uploadExcelApprove`]}
        className="uploadExcelOutsidePadding"
        visible={uploadExcelVisible}
        destroyOnClose
        maskClosable={false}
        onCancel={this.uploadExcelCancel}
        footer={[
          <Button
            className={!uploadDone && uploadDoneNumber !== 'success' ? 'emp-disable-button emp-sub-button' : 'emp-sub-button'}
            onClick={this.uploadConfirm}
            loading={loading}
            type="primary"
            disabled={!uploadDone && uploadDoneNumber !== 'success'}
          >
            {CreateEmployeeStore.languages[`${intlPrefix}.downloadExport.sure`]}
          </Button>,
          <Button
            className='emp-cel-button'
            onClick={this.uploadExcelCancel}
            style={{ marginRight: '15px' }}
          >
            {CreateEmployeeStore.languages[`${intlPrefix}.downloadExport.cancel`]}
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 35, marginLeft: 70 }}>
          <Button style={{ color: '#fff', background: '#2196f3', border: '1px solid #2196f3', marginTop: '30px' }}
                  type="primary"
                  onClick={this.exportTreeModal}>{CreateEmployeeStore.languages[`${intlPrefix}.downLoad.tem`]}</Button>
          <div style={{
            backgroundColor: '#FFF4E6',
            marginTop: 10,
            width: 300,
            height: 63,
            border: '1px solid #FFCA80',
            padding: '7px 12px',
            borderRadius: 4,
            marginBottm: 32,
          }}>
            <Icon type="warning" style={{ color: '#faad14', marginTop: -2 }} />
            <div style={{
              display: 'inline-block',
              marginLeft: 10,
              color: '#04173F',
              fontSize: 14,
            }}>{CreateEmployeeStore.languages[`${intlPrefix}.downloadExport`]}</div>
            <div style={{
              color: '#3C4D73',
              marginLeft: 28,
              fontSize: 12,
            }}>{CreateEmployeeStore.languages[`${intlPrefix}.downloadExportDown`]}</div>
          </div>
          <div style={{ marginTop: 15 }}>
            {
              this.state.attachments && this.state.attachments.length > 0 ?
                !uploadDone ?  (<Button className="upload-button emp-button" onClick={this.checkResult}>
                  {CreateEmployeeStore.languages[`${intlPrefix}.checkResult`]}
                </Button>): ''
                  : ''
            }
            <Upload
              name="file"
              accept=".xlsx"
              style={{ marginTop: 32 }}
              showUploadList={{
                showDownloadIcon: false,
                showPreviewIcon: false,
                showRemoveIcon: true,
              }}
              action={`${process.env.API_HOST}/fnd/v1/${organizationId}/organizations/employee/upload`}
              headers={{
                Authorization: `bearer ${Choerodon.getCookie('access_token')}`,
                'X-Client-ID': CLIENT_ID,
                'X-Client-Type': CLIENT_TYPE,
              }}
              beforeUpload={(file) => {
                const { name } = file;
                this.setState({ uploading: true });
                if (name.length >= 50) {
                  this.setState({ uploading: false });
                  CreateEmployeeStore.getCode('organization.employee.upload.tip');
                  return false;
                }
              }}
              onChange={({ file }) => {
                const { status, response, uid } = file;
                if (status === 'done') {
                  const name = response.fileName;
                  const url = response.fileUrl;
                  const attachmentId = response.fileId;
                  const attachmentName = response.fileName;
                  const attachmentUrl = response.fileUrl;
                  const attachmentSize = response.fileSize;
                  this.state.attachments = [];
                  this.state.attachments.push({
                    ...response,
                    uid,
                    status,
                    name,
                    url,
                    attachmentId,
                    attachmentName,
                    attachmentUrl,
                    attachmentSize,
                  });
                if (response === 0) {
                    this.setState({
                      uploadStatus: true,
                      // uploadFail: true,
                      uploading: false,
                    });
                  } else if (response === 1) {
                    this.setState({
                      uploadStatus: true,
                      // uploadDoneNumber: response,
                      uploadDone: false, // 控制校验按钮出现
                      uploading: false,
                    });
                  }
                } else if (status === 'error') {
                  this.setState({
                    uploading: false,
                  });
                  CreateEmployeeStore.getCode('organization.employee.uploadError');
                }
              }}
              onRemove={(file) => {
                this.setState({ uploading: false });
                const { response } = file;
                // response为number
                if (response === 1 || response === 0 || response === -1 || response === 2 || typeof response !== 'number') {
                  this.state.attachments.splice(this.state.attachments.findIndex(item => item.response === response), 1);
                  this.setState({
                    attachments: this.state.attachments,
                    uploadDoneNumber: '',
                    checking: false,
                    uploadOnce: false,

                    uploadFail: false,
                    uploadDone: false,
                    uploadStatus: false,
                  });
                }
                // if (typeof response === 'number' && response != -1) {
                //   this.state.attachments.splice(this.state.attachments.findIndex(item => item.response === response), 1);
                //   this.setState({
                //     attachments: this.state.attachments,
                //     uploadFail: false,
                //     uploadDone: false,
                //     uploadStatus: false,
                //     checking: false,
                //     uploadOnce: false,
                //     responseNumber: '',
                //   });
                // } else if (response === 0) {
                //   this.state.attachments.splice(this.state.attachments.findIndex(item => item.response === response), 1);
                //   this.setState({
                //     uploadFail: false,
                //     uploadDone: false,
                //     attachments: this.state.attachments,
                //     uploadStatus: false,
                //     checking: false,
                //     uploadOnce: false,
                //     responseNumber: '',
                //   });
                // } else if (response === -1) {
                //   this.state.attachments.splice(this.state.attachments.findIndex(item => item.response === response), 1);
                //   this.setState({
                //     uploadFail: false,
                //     uploadDone: false,
                //     attachments: this.state.attachments,
                //     uploadStatus: false,
                //     TemplateError: false,
                //     checking: false,
                //     uploadOnce: false,
                //     responseNumber: '',
                //   });
                // } else if (response === undefined) {
                //   // 手动删除 未上传完的文件
                //   this.state.attachments.splice(this.state.attachments.findIndex(item => item.fileId === file.fileId), 1);
                //   this.setState({
                //     attachments: this.state.attachments,
                //     uploadFail: false,
                //     uploadDone: false,
                //     uploadStatus: false,
                //     uploading: false,
                //     checking: false,
                //     uploadOnce: false,
                //     responseNumber: '',
                //   });

                // } else if (response.code === 'fnd.import.sheet.name.not.matching') {
                //   this.state.attachments.splice(this.state.attachments.findIndex(item => item.response === response), 1);
                //   this.setState({
                //     uploadFail: false,
                //     uploadDone: false,
                //     attachments: this.state.attachments,
                //     uploadStatus: false,
                //     TemplateError: false,
                //     checking: false,
                //     uploadOnce: false,
                //     responseNumber: '',
                //   });
                // }
              }}
            >
              {
                this.state.attachments && this.state.attachments.length > 0 ?
                  '' : (
                  <Button className="upload-button emp-button" disabled={uploading}>
                    <i className="icon icon-shangchuanwenjian" />
                    {CreateEmployeeStore.languages.upload}
                  </Button>
                )
              }
            </Upload>

          </div>
          {uploadStatus ? <div style={{
              color: '#818999',
              fontSize: 12,
              marginTop: 6,
            }}>{CreateEmployeeStore.languages[`${intlPrefix}.uploadStatus`]}</div>
            : <div style={{
              color: '#818999',
              fontSize: 12,
              marginTop: 6,
            }}>{CreateEmployeeStore.languages[`${intlPrefix}.downloadExportMust`]}</div>
          }
          {this.upFailFuc(uploadFail, TemplateError, checking)}

        </div>
      </Modal>
    );
  };

  // 校验后出现的提示框
  upFailFuc = (uploadFail, TemplateError, checking) => {
    const { AppState } = this.props;
    const { uploadOnce, uploadDoneNumber } = this.state;
    if (uploadDoneNumber === 'success') {
      //
    } else if (uploadDoneNumber === 'templateError') {
      return (
        <div style={{
          marginTop: 5,
          border: '1px solid #FFA39E',
          width: 230,
          height: 30,
          textAlign: 'center',
          lineHeight: '30px',
          borderRadius: '5px',
        }}>
          <Icon type="jujue" style={{
            fontSize: 14,
            marginTop: -2,
            background: '#F5222D',
            borderRadius: 50,
            color: '#fff',
            marginRight: '6px',
          }} />{CreateEmployeeStore.languages[`${intlPrefix}.templateError`]}
        </div>
      )
    } else if (uploadDoneNumber === 'dataRepeat') {
      return (
        <div style={{
          marginTop: 5,
          border: '1px solid #FFA39E',
          width: 150,
          height: 30,
          textAlign: 'center',
          lineHeight: '30px',
          borderRadius: '5px',
        }}>
          <Icon type="jujue" style={{
            fontSize: 14,
            marginTop: -2,
            background: '#F5222D',
            borderRadius: 50,
            color: '#fff',
            marginRight: 1,
          }} />
          {CreateEmployeeStore.languages[`${intlPrefix}.dataRepeat`]}
        </div>
      )
    } else if (uploadDoneNumber === 'formatError') {
      return (
        <div style={{
          marginTop: 5,
          border: '1px solid #FFA39E',
          width: 230,
          height: 30,
          textAlign: 'center',
          lineHeight: '30px',
          borderRadius: '5px',
        }}>
          <Icon type="jujue" style={{
            fontSize: 14,
            marginTop: -2,
            background: '#F5222D',
            borderRadius: 50,
            color: '#fff',
          }} />
          {CreateEmployeeStore.languages[`${intlPrefix}.exportField`]}
          {uploadOnce ? (
            <span style={{ color: '#818999' }}>
              {CreateEmployeeStore.languages[`${intlPrefix}.download`]}
            </span>
          ) : (
            <a onClick={this.exportTree}>
              {CreateEmployeeStore.languages[`${intlPrefix}.download`]}
            </a>
          )}
          {CreateEmployeeStore.languages[`${intlPrefix}.nextExport`]}
        </div>
      );
    } else if (uploadDoneNumber === 'dataNull') {
      return (
        <div style={{
          marginTop: 5,
          border: '1px solid #FFA39E',
          width: 150,
          height: 30,
          textAlign: 'center',
          lineHeight: '30px',
          borderRadius: '5px',
        }}>
          <Icon type="jujue" style={{
            fontSize: 14,
            marginTop: -2,
            background: '#F5222D',
            borderRadius: 50,
            color: '#fff',
            marginRight: 1,
          }} />
          {CreateEmployeeStore.languages[`${intlPrefix}.dataNull`]}
        </div>
      )
    } else if (checking || uploadDoneNumber === 'processing') {
      return (
        <div style={{
          marginTop: 5,
          border: '1px solid #FFA39E',
          width: 150,
          height: 30,
          textAlign: 'center',
          lineHeight: '30px',
          borderRadius: '5px',
        }}>
          <Icon type="jujue" style={{
            fontSize: 14,
            marginTop: -2,
            background: '#F5222D',
            borderRadius: 50,
            color: '#fff',
            marginRight: 1,
          }} />
          {CreateEmployeeStore.languages[`${intlPrefix}.checking`]}
        </div>
      );
    } else return '';
  };

  upDoneFuc = (uploadDone) => {
    const { uploadDoneNumber } = this.state;
    if (uploadDone) {
      return (
        <div style={{
          width: 230,
          height: 30,
          textAlign: 'center',
          lineHeight: '30px',
          background: '#a3abbc',
          margin: '0 auto',
          borderRadius: '5px',
        }}>
          <Icon type="shuruzhengque" style={{
            fontSize: 14,
            marginTop: -2,
          }} />{CreateEmployeeStore.languages[`${intlPrefix}.nextExport`]}{uploadDoneNumber}{CreateEmployeeStore.languages[`${intlPrefix}.empUser`]}
        </div>
      );
    } else return '';
  };

  // 加载可以邀请的员工
  loadEmpBactchInv = () => {
    const { AppState, EmployeeStore } = this.props;
    const { id } = AppState.currentMenuType;
    CreateEmployeeStore.loadEmpBactchInv(
      id,
    ).then((data) => {
        this.setState({
          dataSourceInv: data,
        });
      })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
      );
  };

  // 批量邀请方法
  batchInvEmployees = () => {
    this.setState({
      loadingInv: true,
    });
    const { AppState, intl } = this.props;
    const { ValueAllInv, selectedRowKeysInv } = this.state;
    const { organizationId } = AppState.currentMenuType;
    CreateEmployeeStore.batchInvEmployees(organizationId, ValueAllInv)
      .then((data) => {
        if (data.length === 0) {
          this.handleRefresh();
          Choerodon.prompt(CreateEmployeeStore.languages[`${intlPrefix}.invitation.success.msg`]);
        } else if (data.length > 0) {
          this.setState({
            loadingInv: false,
            dataInvFail: data,
            invFail: true,
          });
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };

  // 加载可以激活的员工
  loadInvitationStaff = () => {
    const { AppState, EmployeeStore } = this.props;
    const { id } = AppState.currentMenuType;
    EmployeeStore.getInvitationStaff(
      id,
    ).then((data) => {
      this.setState({
        InvitationStaffData: data,
      });
    })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
      );
  };

  // 批量激活方法
  batchInvitationStaff = () => {
    this.setState({
      loadingInv: true,
    });
    const { AppState } = this.props;
    const { ValueAllInv } = this.state;
    // const { organizationId,organizationName } = AppState.currentMenuType;
    const organizationId = this.props.AppState.currentMenuType.id;
    const organizationName = this.props.AppState.currentMenuType.name;
    EmployeeStore.batchInvitationStaff(organizationId, ValueAllInv)
      .then((data) => {
        // if(data.result.data===0){
        //
        // }
        // this.setState({
        //   loadingInv: false,
        //   batchInvVisible: false,
        //   dataInvFail: data,
        //   // invFail: true,
        // });
        this.props.history.push(`employee/?type=organization&id=${organizationId}&name=${organizationName}&organizationId=${organizationId}`);
      })
      .catch((error) => {
        this.setState({
          loadingInv: false,
        });
        Choerodon.handleResponseError(error);
      });
  };

  // 批量邀请弹出
  batchInvShowModal = () => {
    this.loadInvitationStaff();
    this.setState({
      batchInvVisible: true,
      selectedRowKeys: [],
    });
  };

  handleBatchInv = () => {
    this.setState({
      text: '',
    });
    this.props.form.resetFields();
  };

  batchInvCancel = (e) => {
    this.handleBatchInv();
    this.setState({
      batchInvVisible: false,
    });
  };

  // 批量邀请弹出框
  batchInvRender = () => {
    const { AppState, edit, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { batchInvVisible, email, dataSourceInv, selectedRowKeys, ValueAllInv, loadingInv,InvitationStaffData } = this.state;
    const { organizationId } = AppState.currentMenuType;
    const columns = [
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.employeecode`],
        dataIndex: 'employeeCode',
        key: 'employeeCode',
        width: 93,
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.employeename`],
        dataIndex: 'employeeName',
        key: 'employeeName',
        width: 103,
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.email`],
        dataIndex: 'email',
        key: 'email',
        width: 150,
      },
    ];
    const rowSelection = {
      onChange: (selectedRowKeys, valAll) => {
        this.setState({ selectedRowKeys, ValueAllInv: valAll });
      },
      selectedRowKeys,
    };
    return (

      <Modal
        className="batchInvOutsidePadding"
        visible={batchInvVisible}
        onOk={this.state.tenantType==='PUBLIC'?this.batchInvEmployees:this.batchInvitationStaff}
        onCancel={this.batchInvCancel}
        footer={[
          <Button
            style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
            onClick={this.state.tenantType==='PUBLIC'?this.batchInvEmployees:this.batchInvitationStaff}
            type="primary"
            funcType="raised"
            loading={loadingInv}
            disabled={ValueAllInv.length < 1}
          >
            {this.state.tenantType==='PUBLIC'?CreateEmployeeStore.languages[`${intlPrefix}.allInv`]:CreateEmployeeStore.languages[`${intlPrefix}.activation`]}
          </Button>,
          <Button
            onClick={this.batchInvCancel}
            funcType="raised"
            style={{ marginRight: '15px' }}
          >
            {CreateEmployeeStore.languages.cancel}
          </Button>,
        ]}

      >
        <div>
          <Header title={this.state.tenantType==='PUBLIC'?CreateEmployeeStore.languages[`${intlPrefix}.batchInvApprove`]:'批量激活'} />
          <hr style={{ border: '0.3px solid #ccd3d9', marginTop: 0, width: 500, marginLeft: -24 }} />
          <Content>
            <Table
              size="middle"
              pagination={false}
              className="this-is-employeeInv"
              columns={columns}
              filterBar={false}
              rowSelection={rowSelection}
              bordered
              dataSource={this.state.tenantType==='PUBLIC'?dataSourceInv:InvitationStaffData}
              scroll={{ y: 280 }}
              onChange={this.handlePageChange.bind(this)}
            />
          </Content>
          <Divider style={{ margin: 0, width: 500, marginLeft: -24 }} />
        </div>

      </Modal>
    );
  };

  // 批量邀请失败弹出框
  invFailShowModal = () => {
    this.setState({
      invFail: true,
    });
  };

  handleinvFail = () => {
    this.setState({
      text: '',
    });
    this.props.form.resetFields();
  };

  invFailCancel = (e) => {
    this.handleinvFail();
    this.loadEmpBactchInv();
    this.setState({
      invFail: false,
    });
  };

  renderColumn = (text, record, key) => {
    return <div style={{ wordWrap: 'break-word', wordBreak: 'break-all' }}>
      {record[key]}
    </div>;
  };

  // 邀请失败弹出框
  invFailRender = () => {
    const { AppState, edit, intl, EmployeeStore } = this.props;
    const { invFail, dataInvFail } = this.state;
    const { organizationId } = AppState.currentMenuType;
    const columns = [
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.employeecode`],
        dataIndex: 'employeeCode',
        key: 'employeeCode',
        textWrap: 'word-break',
        width: '15%',
        render: (text, record) => this.renderColumn(text, record, 'employeeCode'),
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.employeename`],
        dataIndex: 'employeeName',
        key: 'employeeName',
        textWrap: 'word-break',
        width: '15%',
        render: (text, record) => this.renderColumn(text, record, 'employeeName'),
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.email`],
        dataIndex: 'email',
        key: 'email',
        textWrap: 'word-break',
        width: '40%',
        render: (text, record) => this.renderColumn(text, record, 'email'),
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.invResult`],
        dataIndex: 'email',
        key: 'email',
        textWrap: 'word-break',
        width: '15%',
        render: (text, record) => {
          if (record.errorReason == null) {
            return <span style={{ color: 'green' }}>{CreateEmployeeStore.languages.success}</span>;
          } else {
            return <span style={{ color: 'red' }}>{CreateEmployeeStore.languages.error}</span>;
          }
        },
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.errorReason`],
        dataIndex: 'errorReason',
        key: 'errorReason',
        textWrap: 'word-break',
        width: '15%',
        render: (text, record) => this.renderColumn(text, record, 'errorReason')
      },
    ];
    return (

      <Modal
        width={800}
        title={CreateEmployeeStore.languages[`${intlPrefix}.invFailApprove`]}
        className="invFailOutsidePadding"
        visible={invFail}
        onOk={this.invFailCancel}
        onCancel={this.invFailCancel}
      >
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <Table
            size="middle"
            pagination={false}
            columns={columns}
            filterBar={false}
            bordered
            dataSource={dataInvFail}
            scroll={{ y: 280 }}
          />
        </div>


      </Modal>
    );
  };


  handlePageChange(pagination, filters, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadEmployee(pagination, sorter.join(','), filters, params);
  }

  renderSideTitle() {
    if (this.state.edit) {
      return CreateEmployeeStore.languages[`${intlPrefix}.modify`];
    } else {
      return CreateEmployeeStore.languages[`${intlPrefix}.create`];
    }
  }

  renderSideLdapTitle() {
    if (this.state.edit) {
      return CreateEmployeeStore.languages[`${intlPrefix}.modifyldap`];
    } else {
      return CreateEmployeeStore.languages[`${intlPrefix}.createldap`];
    }
  }

  // 获取员工状态
  selectEmpList = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const empLists = CreateEmployeeStore.getEmpList;
    const temp_Emp = empLists.filter(v => (v.lookupValue === values));
    if (temp_Emp.length > 0) {
      return temp_Emp[0].lookupMeaning;
    } else {
      return values;
    }
  };

  // 获取有效失效
  selectEmpZhuangTai = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const EmpZhuangTai = CreateEmployeeStore.getEmpZhuangTai;
    const temp_Emp = EmpZhuangTai.filter(v => (v.lookupValue === values));
    if (temp_Emp.length > 0) {
      return temp_Emp[0].lookupMeaning;
    } else {
      return values;
    }
  };

  // 获取员工类型
  selectStatusList = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const statusLists = CreateEmployeeStore.getStatusList;
    const temp_Emp = statusLists.filter(v => (v.lookupValue === values));
    if (temp_Emp.length > 0) {
      return temp_Emp[0].lookupMeaning;
    } else {
      return values;
    }
  };

  // 获取邀请状态
  selectInvitStatus = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const inviteStatusList = CreateEmployeeStore.getInviteStatus;
    const temp_Emp = inviteStatusList.filter(v => (v.lookupValue === values));
    if (temp_Emp.length > 0) {
      return temp_Emp[0].lookupMeaning;
    } else {
      return values;
    }
  };

  // 获取邀请状态
  selectgenderList = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const inviteStatusList = CreateEmployeeStore.getGenderList;
    const temp_Emp = inviteStatusList.filter(v => (v.lookupValue === values));
    if (temp_Emp.length > 0) {
      return temp_Emp[0].lookupMeaning;
    } else {
      return values;
    }
  };

  /**
   * 编辑模态框
   * @returns {*}
   */
  renderSideBar() {
    const { selectedData, edit, visible } = this.state;
    return (
      <EditEmployee
        id={selectedData}
        visible={visible}
        edit={edit}
        onRef={(node) => {
          this.editEmployee = node;
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
          this.handleRefresh();
        }}
        onSuccess={() => {
          this.setState({
            visible: false,
            submitting: false,
          });
          this.handleRefresh();
          this.loadEmployee();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
        OnCloseModel={() => {
          this.setState({
            visible: false,
            submitting: false,
          });
        }}
      />
    );
  }

  renderLdapSideBar() {
    const { selectedData, edit, ldapVisible } = this.state;
    return (
      <LdapEmployee
        id={selectedData}
        visible={ldapVisible}
        isLDAP={this.state.isLDAP}
        edit={this.state.edit}
        onRef={(node) => {
          this.ldapEmployee = node;
        }}
        OnUnchangedSuccess={() => {
          this.setState({
            ldapVisible: false,
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
            ldapVisible: false,
            submitting: false,
          });
          this.loadEmployee();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
        OnCloseModel={() => {
          this.setState({
            ldapVisible: false,
            submitting: false,
          });
        }}
      />
    );
  }

  /* 导出Excel */
  exportTree = () => axios.get(`/fnd/v1/${this.props.AppState.currentMenuType.organizationId}/organizations/employee/import/error/download/${this.props.AppState.userInfo.id}`, { responseType: 'blob' })
    .then((data) => {
      const blob = new Blob([data]);
      const fileName = `错误成员模板-${moment().format('YYYY-MM-DD')}.xlsx`;
      FileSaver.saveAs(blob, fileName);
      this.setState({
        uploadOnce: true,
      })
    });

  /* 导出Excel */
  // exportTreeModal = () => axios.get(`/fnd/v1/${this.props.AppState.currentMenuType.organizationId}/organizations/employee/import/template/download`, { responseType: 'blob' })
  exportTreeModal = () => axios.get(`fnd/v1/${this.organizationId}/organizations/employee/upload/down/temp?type=${this.state.tenantType}`, { responseType: 'blob' })
    .then((data) => {
      const blob = new Blob([data]);
      const fileName = `成员模板-${moment().format('YYYY-MM-DD')}.xlsx`;
      FileSaver.saveAs(blob, fileName);
    });

  resetPassword = (record) =>{
    this.getPulicKeys();
    this.setState({
      resetPasswordVisible:true,
      resetPasswordRecord:record
    })
  };

  // 查询租户密码策略
  getPasswordLContain = () => {
    axios.get(`iam/v1/organizations/${this.organizationId}/password_policies`).then(
      data => {
        if(data){
          this.setState({
            passwordLContainData: data,
          })

        }
      })
  };

  //  密码类型快码查询
  securitySettingQuery= () => {
    const code = "FND_PWD_POLICY";
    axios.get(`fnd/v1/${this.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          passwordFastCode: data
        })
      })
  };

  // 后去公钥
  getPulicKeys=() => {
    CreateEmployeeStore.getPulicKey().then((data) => {
      for (let i in data) {
        this.setState({
          valueKeys: i,
          publicKey: data[i],

        })

      }
    })
  };

  // 重置密码提交
  resetPasswordHandleOk=()=>{
    const { getFieldValue } = this.props.form;
    const { publicKey, valueKeys } =this.state;
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    const oldPassword= encrypt.encrypt(getFieldValue('resetPassword'));
    this.props.form.validateFieldsAndScroll((err, data, modify)=>{
      if(!err.resetPasswordNew&&!err.resetPassword){
        CreateEmployeeStore.resetPassword(this.organizationId,this.state.resetPasswordRecord.userId,
          oldPassword,valueKeys).then(data=>{
            if(data===true){
              Choerodon.prompt(`${CreateEmployeeStore.languages[`modify.success`]}`);
              this.setState({
                resetPasswordVisible:false,
              })
            }
        })
      }
    });

  };

  resetPasswordNewFun=(rule, value, callback)=>{
    if(value!==this.props.form.getFieldsValue().resetPassword){
      callback(CreateEmployeeStore.languages[`${intlPrefix}.TheTwoPassword`]);
    }else {
      callback()
    }
  };

  setCheckResetPassword=(e)=>{
    if(e.target.value){
      if((e.target.value!==this.props.form.getFieldsValue().resetPasswordNew)&&this.props.form.getFieldsValue().resetPasswordNew){
        this.props.form.setFields({
          resetPasswordNew: {
            value: this.props.form.getFieldsValue().resetPasswordNew,
            errors:[new Error(CreateEmployeeStore.languages[`${intlPrefix}.TheTwoPassword`])]
          },
        });
      }else {
        this.props.form.setFields({
          resetPasswordNew: {
            value: this.props.form.getFieldsValue().resetPasswordNew,
          },
        });
      }
    }
  };

  displayInput=()=>{
    document.getElementById("resetPassword").type = 'text';
    document.getElementById("passwordInput_one_Icon_XS").style.display = 'none';
    document.getElementById("passwordInput_one_Icon_YC").style.display = 'inline-block';
  };

  hideInput=()=>{
    document.getElementById("resetPassword").type = 'password';
    document.getElementById("passwordInput_one_Icon_XS").style.display = 'inline-block';
    document.getElementById("passwordInput_one_Icon_YC").style.display = 'none';
  };

  displayInput_two=()=>{
    document.getElementById("resetPasswordNew").type = 'text';
    document.getElementById("passwordInput_two_Icon_XS").style.display = 'none';
    document.getElementById("passwordInput_two_Icon_YC").style.display = 'inline-block';
  };

  hideInput_two=()=>{
    document.getElementById("resetPasswordNew").type = 'password';
    document.getElementById("passwordInput_two_Icon_XS").style.display = 'inline-block';
    document.getElementById("passwordInput_two_Icon_YC").style.display = 'none';
  };

  // 重置密码Modal
  resetPasswordModal =()=>{
    const { resetPasswordVisible, resetPasswordLoading } = this.state;
    const {getFieldDecorator} = this.props.form;
    const formatCodeArr=this.state.passwordLContainData&&this.state.passwordLContainData.formatCode?this.state.passwordLContainData.formatCode.split(','):[];
    const plain=[];
    this.state.passwordFastCode?this.state.passwordFastCode.forEach(item=>{
      if(item.lookupValue!=='DIGIT'){
        formatCodeArr.forEach(datas=>{
          if(datas===item.lookupValue){
            plain.push(item.lookupMeaning)
          }
        })
      }else {
        plain.push(item.lookupMeaning)
      }
    }):null;
    return (
      <Modal
        visible={resetPasswordVisible}
        // visible={true}
        title={CreateEmployeeStore.languages[`${intlPrefix}.resetPassword`]}
        destroyOnClose={true}
        onCancel={()=>{
          this.setState({
            resetPasswordVisible:false
          })
        }}
        footer={[
          <Button key="back" onClick={()=>{this.setState({resetPasswordVisible:false})}}>{CreateEmployeeStore.languages[`cancel`]}</Button>,
          <Button key="submit" type="primary" loading={resetPasswordLoading} onClick={this.resetPasswordHandleOk}>
            {CreateEmployeeStore.languages[`save`]}
          </Button>,
        ]}
      >
        <div style={{marginTop:'30px'}}>
          <span style={{paddingLeft:'15px',color:'rgba(0,0,0,0.54)'}}>{CreateEmployeeStore.languages[`${intlPrefix}.Tips`]}{plain.join('、')}，{CreateEmployeeStore.languages[`${intlPrefix}.MinimumLength`]}{this.state.passwordLContainData?this.state.passwordLContainData.minLength:''}{CreateEmployeeStore.languages[`${intlPrefix}.position`]}，{CreateEmployeeStore.languages[`${intlPrefix}.MostLength`]}{this.state.passwordLContainData?this.state.passwordLContainData.maxLength:''}{CreateEmployeeStore.languages[`${intlPrefix}.position`]}</span>
        </div>
        <Form style={{marginTop:'20px'}}>
          <Row>
            <div style={{display: 'inline-block',verticalAlign: 'super'}}>
              <span style={{float:'right',paddingLeft:'15px',paddingRight:'8px'}}>{CreateEmployeeStore.languages[`${intlPrefix}.resetPassword`]}：</span>
            </div>
            <FormItem style={{ display: 'inline-block' }}>
              {getFieldDecorator('resetPassword', {
                rules: [{
                  required: true, message: CreateEmployeeStore.languages[`${intlPrefix}.NewPassword`],
                },{
                  min: this.state.passwordLContainData?this.state.passwordLContainData.minLength:8, message: `${CreateEmployeeStore.languages[`${intlPrefix}.MinimumLength`]}${this.state.passwordLContainData?this.state.passwordLContainData.minLength:8}`,
                },
                // ,{
                //   pattern: /^(?=.*[A-Za-z])(?=.*[\W])(?=.*\d)[A-Za-z\W\d]/, message: '不对',
                // }
                ],
              })(
                <Input
                  type="password"
                  onChange={this.setCheckResetPassword}
                  style={{ width: 300,verticalAlign: 'super' }}
                  maxLength={this.state.passwordLContainData?this.state.passwordLContainData.maxLength:32}
                />
              )}
              <a style={{zIndex: 999,width: '20px',display: 'inline-block',position: 'absolute',right: '0'}}>
                <Icon id="passwordInput_one_Icon_XS" onClick={this.displayInput} type="yincang" style={{ color: '#CCD3D9'}} />
                <Icon id="passwordInput_one_Icon_YC" onClick={this.hideInput} type="quxiaoyincang" style={{ color: '#2196F3',display:'none'}} />
              </a>
            </FormItem>
          </Row>

          <Row>
            <div style={{display: 'inline-block',verticalAlign: 'super'}}>
              <span style={{float:'right',paddingLeft:'15px',paddingRight:'8px'}}>{CreateEmployeeStore.languages[`${intlPrefix}.ReInput`]}：</span>
            </div>
            <FormItem style={{ display: 'inline-block' }}>
              {getFieldDecorator('resetPasswordNew', {
                rules: [{
                  required: true, message: CreateEmployeeStore.languages[`${intlPrefix}.ReInputNewPassword`],
                },{
                  min: this.state.passwordLContainData?this.state.passwordLContainData.minLength:8, message: `${CreateEmployeeStore.languages[`${intlPrefix}.MinimumLength`]}${this.state.passwordLContainData?this.state.passwordLContainData.minLength:8}`,
                },
                {
                  validator:this.resetPasswordNewFun,
                },
                ],
              })(
                <Input
                  type="password"
                  style={{ width: 300,verticalAlign: 'super' }}
                  maxLength={this.state.passwordLContainData?this.state.passwordLContainData.maxLength:32}
                />
              )}
              <a style={{zIndex: 999,width: '20px',display: 'inline-block',position: 'absolute',right: '0'}}>
                <Icon id="passwordInput_two_Icon_XS" onClick={this.displayInput_two} type="yincang" style={{ color: '#CCD3D9'}} />
                <Icon id="passwordInput_two_Icon_YC" onClick={this.hideInput_two} type="quxiaoyincang" style={{ color: '#2196F3',display:'none'}} />
              </a>
            </FormItem>
          </Row>
        </Form>
      </Modal>

    )
  };

  render() {
    const { EmployeeStore, AppState, intl } = this.props;
    const { filters, pagination, visible, ldapVisible, edit, submitting, isLDAP } = this.state;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    const orgname = menuType.name;
    let data = [];
    if (EmployeeStore.getEmployees) {
      data = EmployeeStore.employees.slice();
      data.map((v) => {
        v.key = v.employeeId;
        return v;
      });
    }


    const columns = [
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.employeecode`],
        dataIndex: 'employeeCode',
        key: 'employeeCode',
        filters: [],
        filteredValue: filters.employeeCode || [],
        width: 120,
        sorter: true,
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.employeename`],
        dataIndex: 'employeeName',
        key: 'employeeName',
        filters: [],
        filteredValue: filters.employeeName || [],
        width: 140,
        sorter: true,
        // sortOrder: 'descend',
        render: (text, record) => {
          if (record.isLdap == 1) {
            return <span><a onClick={this.onEditLdap.bind(this, record.employeeId)}>{text}</a> <span
              style={{ display: 'inline-block', fontSize: 10, color: 'red' }}>(LDAP)</span></span>;
          } else {
            if (record.wechatUserId !== null) {
              return <span><a onClick={this.onEdit.bind(this, record.employeeId)}>{text}</a> <span
                style={{ display: 'inline-block', fontSize: 10, color: 'red' }}>(企业微信)</span></span>;
            }
            return <a onClick={this.onEdit.bind(this, record.employeeId)}>{text}</a>;
          }
        },
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.gender`],
        dataIndex: 'gender',
        key: 'gender',
        width: 120,
        render: (text, record) => this.selectgenderList(record.gender),
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.borndate`],
        dataIndex: 'bornDate',
        key: 'bornDate',
        width: 120,
        render: (text, record) => (
          record.bornDate ? moment(record.bornDate).format('YYYY-MM-DD') : ''
        ),
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.email`],
        dataIndex: 'email',
        key: 'email',
        width: 190
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.mobil`],
        dataIndex: 'mobil',
        key: 'mobil',
        width: 120,
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.isenabled`],
        dataIndex: 'isEnabled',
        key: 'isEnabled',
        width: 120,
        filters: [{
          text: CreateEmployeeStore.languages.enableY,
          value: 'Y',
        }, {
          text: CreateEmployeeStore.languages.disableN,
          value: 'N',
        }],
        sorter: true,
        onFilter: (value, record) => record.isEnabled.indexOf(value) === 0,
        render: (values, record) => this.selectEmpZhuangTai(record.isEnabled),
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.status`],
        dataIndex: 'status',
        key: 'status',
        width: 120,
        filters: [{
          text: CreateEmployeeStore.languages[`${intlPrefix}.status.normal`],
          value: 'REGULAR',
        }, {
          text: CreateEmployeeStore.languages[`${intlPrefix}.status.offwork`],
          value: 'QUIT',
        }, {
          text: CreateEmployeeStore.languages[`${intlPrefix}.status.prac`],
          value: 'INTERNSHIP',
        }, {
          text: CreateEmployeeStore.languages[`${intlPrefix}.status.retire`],
          value: 'RETIRE',
        }, {
          text: CreateEmployeeStore.languages[`${intlPrefix}.status.trail`],
          value: 'PROBATION',
        }],
        sorter: true,
        filterMultiple: true,
        onFilter: (value, record) => record.status.indexOf(value) === 0,
        render: (values, record) => this.selectEmpList(record.status),

      },
      {
        title: this.state.tenantType==='PUBLIC'?CreateEmployeeStore.languages[`${intlPrefix}.invitationStatus`]:CreateEmployeeStore.languages[`${intlPrefix}.activationState`],
        dataIndex: 'inviteStatus',
        key: 'inviteStatus',
        width: 120,
        filters: [{
          text: CreateEmployeeStore.languages[`${intlPrefix}.status.UNINVITED`],
          value: 'UNINVITED',
        }, {
          text: CreateEmployeeStore.languages[`${intlPrefix}.status.INVITATING`],
          value: 'INVITATING',
        }, {
          text: CreateEmployeeStore.languages[`${intlPrefix}.status.JOINED`],
          value: 'JOINED',
        }, {
          text: CreateEmployeeStore.languages[`${intlPrefix}.status.UNBIND`],
          value: 'UNBIND',
        }],
        sorter: true,
        filterMultiple: true,
        onFilter: (value, record) => record.inviteStatus.indexOf(value) === 0,
        render: (values, record) =>{
          if(this.state.tenantType==='PUBLIC'){
            return this.selectInvitStatus(record.inviteStatus)
          }else {
            if(record.userId){
              return  `${CreateEmployeeStore.languages[`${intlPrefix}.alreadyActivated`]}`
            }else {
              return  `${CreateEmployeeStore.languages[`${intlPrefix}.notActive`]}`
            }
          }

        },

      },

      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.employee_type`],
        dataIndex: 'companyType',
        key: 'companyType',
        width: 120,
        filterMultiple: true,
        render: (text, record) => this.selectStatusList(record.employeeType),

      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.employee_company`],
        dataIndex: 'companyId',
        key: 'companyId',
        width: 120,
        render: (text, record) => {
          const organizations = CreateEmployeeStore.getCompanyNameList;
          let companyText = '';
          organizations && organizations.forEach((item) => {
            if(text==item.companyId){
              companyText=item.companyFullName
            }
          });
          return companyText
          // let companyText;
          // if(this.state.companyList){
          //   this.state.companyList.forEach(item=>{
          //     if(item.companyId===record.companyId){
          //       companyText=item.companyFullName
          //     }
          //   })
          // }
          //
          // if (record.employeeType === 'INTERNAL') {
          //   return '';
          // } else if (record.employeeType === 'EXTERNAL') {
          //   return <span>{companyText}</span>;
          // }
          // if (record.employeeType === 'INTERNAL') {
          //   return '';
          // } else if (record.employeeType === 'EXTERNAL') {
          //   return <span>{record.fromCompany}</span>;
          // }
        },
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.joindate`],
        dataIndex: 'joinDate',
        key: 'joinDate',
        width: 120,
        render: (text, record) => (
          record.joinDate ? moment(record.joinDate).format('YYYY-MM-DD') : ''
        ),
      },
      {
        title: CreateEmployeeStore.languages[`${intlPrefix}.departuredate`],
        dataIndex: 'departureDate',
        key: 'departureDate',
        width: 120,
        render: (text, record) => {
          if (record.status !== 'OFFWORK') {
            return '';
          }
          return record.departureDate ? moment(record.departureDate).format('YYYY-MM-DD') : '';
        },
      },
      {
        title: CreateEmployeeStore.languages.operation,
        key: 'action',
        // align: 'right',
        fixed: 'right',
        width: 60,
        render: (text, record) => {
          const actionDatas = [

            {
              // service: [],
              service: ['yqcloud-fnd-service.employee.submit'],
              type: 'site',
              icon: '',
              text: CreateEmployeeStore.languages.modify,
              action: record.isLdap === 1 ? this.onEditLdap.bind(this, record.employeeId) : this.onEdit.bind(this, record.employeeId),
            },
          ];
          if(this.state.tenantType==='PUBLIC'){
            if (record.isEnabled === 'Y') {
              actionDatas.push({
                // service: [],
                service: ['yqcloud-fnd-service.employee.ableEmployee'],
                icon: '',
                type: 'site',
                text: CreateEmployeeStore.languages.disableN,
                action: this.handleAble.bind(this, record),
              });
            } else {
              actionDatas.push({
                // service: [],
                service: ['yqcloud-fnd-service.employee.ableEmployee'],
                icon: '',
                type: 'site',
                text: CreateEmployeeStore.languages.enableY,
                action: this.handleAble.bind(this, record),
              });
            }
            if (record.isEnabled === 'Y') {
              if (record.inviteStatus === 'JOINED') {
                actionDatas.push({
                  // service: [],
                  service: ['yqcloud-fnd-service.employee.submit'],
                  icon: '',
                  type: 'site',
                  text: CreateEmployeeStore.languages[`${intlPrefix}.Cancellation`],
                  action: this.handleUnbindOk.bind(this, record),
                });
              } else if (record.inviteStatus === 'INVITATING') {
                actionDatas.push({
                  // service: [],
                  service: ['yqcloud-fnd-service.employee.submit'],
                  icon: '',
                  type: 'site',
                  text: CreateEmployeeStore.languages[`${intlPrefix}.UnInvitation`],
                  action: this.isInvEmployeesCancle.bind(this, record),
                });
              }
              else if (record.invitation === true) {
                actionDatas.push({
                  // service: [],
                  service: ['yqcloud-fnd-service.employee.submit'],
                  icon: '',
                  type: 'site',
                  text: CreateEmployeeStore.languages[`${intlPrefix}.Invitation`],
                  action: this.invitationShowModal.bind(this, record),
                });
              }
            }
          }else {
            if (record.isEnabled === 'Y') {
              actionDatas.push({
                // service: [],
                service: ['yqcloud-fnd-service.employee.ableEmployee'],
                icon: '',
                type: 'site',
                text: CreateEmployeeStore.languages.disableN,
                action: this.handleAble.bind(this, record),
              });
            } else {
              actionDatas.push({
                // service: [],
                service: ['yqcloud-fnd-service.employee.ableEmployee'],
                icon: '',
                type: 'site',
                text: CreateEmployeeStore.languages.enableY,
                action: this.handleAble.bind(this, record),
              });
            }
            if (record.isEnabled === 'Y') {
              if (record.inviteStatus === 'JOINED') {
                actionDatas.push({
                  // service: [],
                  service: ['yqcloud-fnd-service.employee.submit'],
                  icon: '',
                  type: 'site',
                  text: CreateEmployeeStore.languages[`${intlPrefix}.frozen`],
                  action: this.handleUnbindOkEnterprise.bind(this, record),
                });
              }
            }
          }
          if(record.isPassword===0){
            actionDatas.push({
              // service: ['yqcloud-fnd-service.employee.submit'],
              service: ['iam-service.user.updateEmployeePassword'],
              icon: '',
              type: 'site',
              text: CreateEmployeeStore.languages[`${intlPrefix}.resetPassword`],
              action: this.resetPassword.bind(this, record),
            });
          }

          return <Action data={actionDatas} />;
        },
      },
    ];
    return (
      <Page>
        <Header title={CreateEmployeeStore.languages[`${intlPrefix}.header.title`]}>
          <Button
            onClick={this.openNewPage}
            style={{ color: '#1d1d1d', marginLeft: 8 }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3' }} />
            {CreateEmployeeStore.languages[`${intlPrefix}.create`]}
          </Button>
          <Button style={{ color: '#1d1d1d', marginLeft: 8 }} onClick={this.uploadExcelShowModal}>
            <Icon type="file_upload" style={{ color: '#2196F3' }} />
            {CreateEmployeeStore.languages[`${intlPrefix}.uploadProps`]}
          </Button>
          <Button style={{ color: '#1d1d1d', marginLeft: 8 }} onClick={this.batchInvShowModal}>
            <Icon type="piliangyaoqing" style={{ color: '#2196F3' }} />
            {this.state.tenantType==='PUBLIC'?CreateEmployeeStore.languages[`${intlPrefix}.batchInv`]:CreateEmployeeStore.languages[`${intlPrefix}.batchActivation`]}
          </Button>
          <span style={{ marginLeft: 8, display: isLDAP ? 'block' : 'none' }}>
            <Button
              onClick={this.openNewPageLdap}
              style={{ color: '#1d1d1d' }}
            >
              <Icon type="xinjian" style={{ color: '#2196F3' }} />
              {CreateEmployeeStore.languages[`${intlPrefix}.createldap`]}
            </Button>
          </span>
          <Button
            style={{ color: '#1d1d1d', marginLeft: 8 }}
            onClick={this.handleRefresh}
          >
            <Icon type="shuaxin" style={{ color: '#2196F3' }} />
            {CreateEmployeeStore.languages.refresh}
          </Button>
          <Permission
            service={[
              'yqcloud-fnd-service.employee-ext-config.insertAndUpdateConfig'
            ]}
          >
            <Button
              style={{ color: '#1d1d1d', marginLeft: 8 }}
              onClick={() => {
                this.props.history.push(`employee/extendedField?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
              }}
            >
              <Icon type="shezhi2" style={{ color: '#2196F3' }} />
              {CreateEmployeeStore.languages[`${intlPrefix}.extendedField`]}
            </Button>
          </Permission>


        </Header>
        <Content
          values={{ name: orgname }}
        >
          <Table
            size="middle"
            pagination={pagination}
            columns={columns}
            dataSource={data}
            onChange={this.handlePageChange.bind(this)}
            loading={EmployeeStore.isLoading}
            scroll={{ x: 2000 }}
          />

          <Sidebar
            title={this.renderSideTitle()}
            visible={visible}
            okText={CreateEmployeeStore.languages[edit ? 'save' : 'create']}
            cancelText={CreateEmployeeStore.languages.cancel}
            onOk={e => this.editEmployee.handleSubmit(e)}
            destroyOnClose
            onCancel={(e) => {
              this.editEmployee.handleCancel(e);
            }}
            confirmLoading={submitting}
          >
            {
              this.renderSideBar()
            }
          </Sidebar>
          <Sidebar
            title={this.renderSideLdapTitle()}
            visible={ldapVisible}
            okText={CreateEmployeeStore.languages[edit ? 'save' : 'create']}
            cancelText={CreateEmployeeStore.languages.cancel}
            onOk={e => this.ldapEmployee.handleSubmit(e)}
            onCancel={(e) => {
              this.ldapEmployee.handleCancel(e);
            }}
            destroyOnClose
            confirmLoading={submitting}
          >
            {
              this.renderLdapSideBar()
            }
          </Sidebar>
          {this.resetPasswordModal()}
          {this.onCancelInvitationHome}
          {this.invitationRender()}
          {this.uploadExcelRender()}
          {this.batchInvRender()}
          {this.invFailRender()}
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(EmployeeHome)));
