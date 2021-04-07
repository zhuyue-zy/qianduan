import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Form, Input, Tag, DatePicker, Upload, Button, Icon, Modal, Radio, Table } from 'yqcloud-ui';
import { Content, Header, Page, Action, asyncRouter } from 'yqcloud-front-boot';
import { CLIENT_ID, CLIENT_TYPE } from 'yqcloud-front-boot/lib/containers/common/constants';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import _ from 'lodash';
import md5 from 'md5';
import moment from 'moment';
import WYSIWYGEditor from '../../../../components/WYSIWYGEditor';
import AnnouncementStore from '../../../../stores/organization/announcement';
import 'react-quill/dist/quill.snow.css';
import './editAnnouncement.scss';

const PersonSearch = asyncRouter(() => import('./PersonSearch'), () => import('../../../../stores/organization/announcement'));
const PositionSearch = asyncRouter(() => import('./PositionSearch'), () => import('../../../../stores/organization/announcement'));


function noop() {
}

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const intlPrefix = 'organization.setting.announcement';

const inputStyle = {
  width: 326,
  height: 40,
};

const dateFormat = 'YYYY-MM-DD HH:mm:ss';

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
export default class EditAnnouncement extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitState();
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.loadLanguage();
  }

  componentDidMount() {
    this.fetch(this.state);
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    AnnouncementStore.queryLanguage(id, AppState.currentLanguage);
  };

  componentWillUnmount() {
    this.setState(this.getInitState());
  }

  getInitState() {
    return {
      // receiver 1 全部 2 成员 3 部门
      receiver: 2,
      preview: false,
      announcementInfo: {},
      receiverIds: [],
      orgIds: [],
      data: {},
      // receiverData: [],
      receiverIdDate: [],
      orgIdData: [],
      options: [],
      attachments: [], // 附件列表
      imageList: [], // 图片列表
      content: '', // 富文本框内容
      startValue: null,
      endValue: null,
      endOpen: false,
      haveDone: false,
      publishing: false,
      submitting: false,
      edit: !!this.props.match.params.id,
      id: this.props.match.params.id,
      isSaved: this.props.match.params.id ? 'Y' : 'N',

      pagination: {
        current: 1,
        pageSize: 25,
        total: 0,
        pageSizeOptions: [25, 50, 100, 200],
      },
      sort: '',
      dataSourceOrg: [],
      dataSourceEmp: [],
      orgVisible: false,
      selectedRowKeys: [],
      ValueAll: [],
      piPeiId: [],
      orgIdsObj: [],


      dataSourceDpt: [],
      dptVisible: false,
      selectedRowKeysDpt: [],
      ValueAllDpt: [],
      piPeiIdDpt: [],
      receiverIdsObj: [],

      AllEmpList: [], // 所有成员信息的集合
      haveSelectedEmpIds: [], // 所有已经选择成员信息的ID集合
    };
  }

  /**
   * 通过id获取布局模块信息
   * @param id 公告id
   */
  getAnnouncementById(id) {
    const { AppState } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    AnnouncementStore.getAnnouncementById(organizationId, id)
      .then((data) => {
        if (data.failed) {
          //
        } else {
          const allAttachments = data.attachments;
          const changeAttachment = [];
          allAttachments.forEach((item) => {
            const uid = 'uid';
            const url = 'url';
            const name = 'name';
            const status = 'done';
            item[uid] = item.announcementAttachmentId;
            item[url] = item.attachmentUrl;
            item[name] = item.attachmentName;
            item[status] = status;
            changeAttachment.push(item);
          });
          this.setState({
            announcementInfo: data,
            receiver: data.receiver,
            content: JSON.parse(data.content),
            attachments: changeAttachment,
            haveDone: true,
          }, () => {
            if (data.receiver === 2 && Array.isArray(data.receiverIds) && data.receiverIds.length) {
              if (data.employees) {
                this.setState({ receiverIdsObj: data.employees, haveSelectedEmpIds: data.receiverIds });
              }
              let quKong = [];
              quKong = _.compact(data.receiverIds);
              this.props.form.setFieldsValue({
                // receiverIds: data.receiverIds,
                receiverIds: quKong,
              });
            } else if (data.receiver === 3 && Array.isArray(data.orgIds) && data.orgIds.length) {
              if (data.organizations) {
                this.setState({ orgIdsObj: data.organizations, selectedRowKeysDpt: data.orgIds });
                // this.setState({ orgIdsObj: data.employees });
              }
              let quKong2 = [];
              quKong2 = _.compact(data.orgIds);
              this.props.form.setFieldsValue({
                orgIds: quKong2,
              });
            }
          });
        }
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  fetch(state) {
    const { edit, id } = state;
    this.loadEmpMsg();
    this.loadDptMsg();
    this.handleShowModal();
    this.handleShowModalDpt();
    this.getAllEmpList();
    if (edit) {
      this.getAnnouncementById(id);
    }
  }

  goBack = () => {
    this.props.history.push(`/iam/announcement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
  };


  /**
   * 编辑状态下预览
   * @param
   */
  editPreview = () => {
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      const { edit, AppState } = this.props;
      const { announcementInfo } = this.state;
      const createByName = AppState.userInfo.realName;
      if (edit) {
        const previewData = {
          ...data,
          createByName: announcementInfo.createByName,
        };
        this.setState({ data: previewData, preview: true });
      } else {
        const previewData = {
          ...data,
          createByName,
        };
        this.setState({ data: previewData, preview: true });
      }
    });
  };

  getAllEmpList = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { AllEmpList } = this.state;
    AnnouncementStore.loadAllEmpList(organizationId).then((data) => {
      if (data.failed) {

      } else {
        this.setState({
          AllEmpList: data,
        });
      }
    });
  };

  // 加载成员列表-分页
  loadEmpMsg(paginationIn, sortIn, filtersIn, paramsIn) {
    const {
      pagination: paginationState,
      sort: sortState,
      filters: filtersState,
      params: paramsState,
    } = this.state;
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    AnnouncementStore.loadEmpMsg(
      organizationId,
      pagination,
    )
      .then((data) => {
        this.setState({
          dataSourceEmp: data,
          pagination: {
            current: (data.number || 0) + 1,
            pageSize: data.size || 10,
            total: data.totalElements || '',
            pageSizeOptions: ['25', '50', '100', '200'],
          },
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }


  // 渲染添加成员弹出框
  showMainModal = () => {
    const { tenantIds, dataSourceEmp, piPeiId, receiverIdsObj } = this.state;
    this.loadEmpMsg();
    this.setState({
      orgVisible: true,
    });
  };

  // 弹出框的XXX
  handleShowMain = () => {
    this.setState({
      orgVisible: false,
    });
  };


  handleShowModal = () => {
    const { orgVisible, dataSourceEmp, selectedRowKeys, pagination, haveSelectedEmpIds } = this.state;
    const columns = [{
      title: AnnouncementStore.languages[`${intlPrefix}.employeename`],
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 93,
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.employeecode`],
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 93,
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.email`],
      dataIndex: 'email',
      key: 'email',
      width: 147,
    }];
    const rowSelectionEmp = {
      selectedRowKeys: haveSelectedEmpIds,
      onChange: (selectedRowKeys, valAll) => {
        this.setState({ haveSelectedEmpIds: selectedRowKeys });
      },
    };
    return (
      <PersonSearch
        visible={this.state.orgVisible}
        onHide={() => {
          this.setState({
            orgVisible: false,
          });
        }}
        onSave={(value) => {
          if (value.length > 0) {
            this.addEmpInTable(value);
          }
        }}
        data={dataSourceEmp}
      />
    );
  };

  /* 把已经选择了的成员数据，显示在表格中 */
  addEmpInTable = (value) => {
    const { AllEmpList, ValueAll } = this.state;
    ValueAll.forEach((item,i)=>{

    });
    const changeData = ValueAll;
    value.forEach((item) => {
      if(!ValueAll.find(item_two => item_two.employeeId === item.employeeId)){
        changeData.push(item)
      }

      // AllEmpList.forEach((k, v) => {
      //   if (k.employeeId === item.employeeId) {
      //     changeData.push(k);
      //   }
      // });
    });
    this.setState({ ValueAll: changeData });
  };


  // 加载部门列表
  loadDptMsg(paginationIn, sortIn, filtersIn, paramsIn) {
    const {
      pagination: paginationState,
      sort: sortState,
      filters: filtersState,
      params: paramsState,
    } = this.state;
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    AnnouncementStore.loadDptMsg(organizationId)
      .then((data) => {
        this.setState({
          dataSourceDpt: data|| '',
        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  // 分页点击
  handlePageChangeDpt = (pagination, filters, { field, order }, params) => {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadDptMsg(pagination, sorter.join(','), filters, params);
  }

  // 渲染添加部门弹出框
  showMainModalDpt = () => {
    const { tenantIds, dataSourceDpt, piPeiId, orgIdsObj } = this.state;
    const idS = [];
    orgIdsObj.forEach((v) => {
      idS.push(v.organizationId);
    });

    const dataIdObj = [];
    dataSourceDpt.forEach((v) => {
      dataIdObj.push(v.organizationId);
    });
    let piPeiObj = [];
    piPeiObj = _.intersection(idS, dataIdObj);
    this.loadDptMsg();
    this.setState({
      piPeiIdDpt: piPeiObj,
      dptVisible: true,
    });
  }

  // 弹出框的XXX
  handleShowMainDpt = () => {
    this.setState({
      dptVisible: false,
    });
  }

  handleShowModalDpt = () => {
    const { dptVisible, dataSourceDpt, selectedRowKeysDpt } = this.state;
    const columns = [{
      title: AnnouncementStore.languages[`${intlPrefix}.organizationCode`],
      dataIndex: 'organizationCode',
      key: 'organizationCode',
      width: 93,
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.organizationName`],
      dataIndex: 'organizationName',
      key: 'organizationName',
      width: 93,
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.organizationUpperName`],
      dataIndex: 'parentName',
      key: 'parentName',
      width: 147,
    }];
    const rowSelectionDpt = {
      selectedRowKeys: selectedRowKeysDpt,
      onChange: (selectedRowKeys, valAll) => {
        this.setState({ selectedRowKeysDpt: selectedRowKeys });
      },
    };
    return (
      <PositionSearch
        visible={this.state.dptVisible}
        onHide={() => {
          this.setState({
            dptVisible: false,
          });
        }}
        onSave={(value) => {
          if (value.length > 0) {
            this.handleShowModalSubmitDpt(value);
          }
        }}
        data={dataSourceDpt}
      />

    );
  };

  // 确认按钮
  handleShowModalSubmitDpt = (value) => {
    const { dataSourceDpt } = this.state;
    if (value.length > 0) {
      const changeData = [];
      value.forEach((item, index) => {
        dataSourceDpt.forEach((k, v) => {
          if (k.organizationId === item.organizationId) {
            changeData.push(k);
          }
        });
      });
      this.setState({
        ValueAllDpt: changeData,
        dptVisible: false,
      });
      this.renderReceiverIds();
    }
  };

  handleDownload = (item) => {
    const { AppState } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    AnnouncementStore.downloadFile(organizationId, item.attachmentId).then((data) => {
      const fileUrl1 = data.fileUrl;
      window.open(fileUrl1);
    });
  };

  /**
   *  渲染公告内容
   * @param data
   */
  renderPreviewContent = (data) => {
    const { content: annContent, attachments } = this.state;
    const fileOptions = [];
    const content = new QuillDeltaToHtmlConverter(annContent, {}).convert();
    if (attachments) {
      attachments.forEach((item) => {
        fileOptions.push(
          <p>
            <span style={{ marginRight: 10, cursor: 'pointer' }} className="file-title" onClick={this.handleDownload.bind(this, item)}>
              {item.attachmentName}{item.fileType}
            </span>
            <span>
              <span style={{ color: '#818999' }}>({item.attachmentSize / (1024 * 1024) > 1 ? `${Math.round((item.attachmentSize / (1024 * 1024)) * 100) / 100} M` : `${Math.round(item.attachmentSize / 1024 * 100) / 100} kb`})</span>
              <Icon style={{ marginRight: 10, cursor: 'pointer', color: '#2196F3' }} onClick={this.handleDownload.bind(this, item)} type="vertical_align_bottom" />
            </span>
          </p>,
        );
      });
    }
    const contentStyle = {
      paddingTop: 10,
      color: '#3C4D73',
      wordWrap: 'break-word',
      wordBreak: 'break-all',
      overflow: 'scroll',
      maxHeight: '45vh',
      minHeight: '40vh',
    };
    return (
      <div style={{ padding: '20px 28px', borderRadius: 2 }}>
        <p
          style={{
            fontSize: 14,
            color: '#04173F',
            lineHeight: '20px',
            fontWeight: 400,
            marginBottom: 5,
          }}
        >
          {data.title || ''}
        </p>
        <div style={{ color: '#818899' }}>
          <span style={{ marginRight: 23 }}>{AnnouncementStore.languages[`${intlPrefix}.effective.time`]}：{data.startTime ? data.startTime.format('YYYY-MM-DD') : '--'}</span>
          <span style={{ marginRight: 23 }}>{AnnouncementStore.languages[`${intlPrefix}.invalid.time`]}：{data.endTime ? data.endTime.format('YYYY-MM-DD') : '--'}</span>
          <span>{AnnouncementStore.languages[`${intlPrefix}.founder`]}：{data.createByName || ''}</span>
        </div>
        <div className="ann-content" style={contentStyle} dangerouslySetInnerHTML={{ __html: `${content || ''}` }} />
        {attachments && attachments.length > 0 ? (
          <div style={{ paddingTop: 10, borderTop: '1px solid #EBF1F5' }}>{fileOptions}</div>
        ) : ''}
      </div>
    );
  };

  /**
   *
   * @param
   */
  renderOrgIds = () => {
    const { ValueAll, receiverIdsObj } = this.state;
    const result = [];
    const receiverIdsObjNew = [];
    if (receiverIdsObj.length > 0) {
      ValueAll.forEach((v) => {
        receiverIdsObjNew.push(v);
      });
      this.setState({
        receiverIdsObj: receiverIdsObjNew,
      });
      return receiverIdsObj;
    } else {
      ValueAll.forEach((v) => {
        receiverIdsObj.push(v);
      });
      return receiverIdsObj;
    }
  }

  /**
   * 渲染选择框的接收对象
   * @param
   */
  renderReceiverIds = () => {
    const { ValueAllDpt, orgIdsObj } = this.state;
    const orgIdsObjNew = [];
    if (orgIdsObj.length > 0) {
      ValueAllDpt.forEach((v) => {
        orgIdsObjNew.push(v);
      });
      this.setState({
        orgIdsObj: orgIdsObjNew,
      });
      return orgIdsObj;
    } else {
      ValueAllDpt.forEach((v) => {
        orgIdsObj.push(v);
      });
      return orgIdsObj;
    }
  };

  /**
   * 单选框改变
   * @param
   */
  onChangeRadio = (e) => {
    // 3 部门 2 员工
    if (e.target.value === 3) {
      this.setState({ receiverIds: [], receiverIdsObj: [], ValueAll: [], haveSelectedEmpIds: [] });
    } else if (e.target.value === 2) {
      this.setState({ orgIds: [], ValueAllDpt: [], orgIdsObj: [], selectedRowKeysDpt: [] });
    } else {
      this.setState({ receiverIds: [], orgIds: [], ValueAllDpt: [], orgIdsObj: [], receiverIdsObj: [], ValueAll: [], selectedRowKeysDpt: [], haveSelectedEmpIds: [] });
    }
    this.setState({ receiver: e.target.value });
  };

  /**
   * 提交表单,创建和保存
   * @param e 表
   */
  handleSubmit = (e) => {
    e.preventDefault();
    const { content, attachments, orgIdsObj, receiverIdsObj, haveSelectedEmpIds, ValueAllDpt } = this.state;
    Promise.all(this.promiseElementInfo(content)).then((content) => {
      this.props.form.validateFieldsAndScroll((err, data, modify) => {
        if (!err) {
          const { AppState } = this.props;
          const { receiver, content, edit, ValueAll } = this.state;
          const menuType = AppState.currentMenuType;
          const iamOrganizationId = menuType.id;
          const createdBy = AppState.getUserId;
          const abc = [];
          orgIdsObj.forEach((v) => {
            abc.push(v.organizationId);
          });
          const abcd = [];
          receiverIdsObj.forEach((v) => {
            abcd.push(v.employeeId);
          });
          this.setState({ submitting: true, orgIds: abc, receiverIds: abcd });
          data.startTime = data.startTime ? data.startTime.format(dateFormat) : data.startTime;
          data.endTime = data.endTime ? data.endTime.format(dateFormat) : data.endTime;
          data.content = JSON.stringify(content);
          let quKong = [];
          quKong = _.compact(this.state.haveSelectedEmpIds);
          let quKong2 = [];
          quKong2 = _.compact(this.state.selectedRowKeysDpt);
          data.receiverIds = _.compact(ValueAll.length > 0 ? ValueAll.map(v => v.employeeId) : receiverIdsObj.map(v => v.employeeId));
          data.orgIds = _.compact(ValueAllDpt.length > 0 ? ValueAllDpt.map(v => v.organizationId) : orgIdsObj.map(v => v.organizationId));
          if (edit) {
            const { announcementId, objectVersionNumber } = this.state.announcementInfo;
            AnnouncementStore.updateAnnouncement(iamOrganizationId, {
              announcementId,
              iamOrganizationId,
              objectVersionNumber,
              receiver,
              attachments,
              ...data,
            }).then(({ failed, message }) => {
              if (failed) {
                this.setState({
                  submitting: false,
                  publishing: false,
                });
              } else {
                Choerodon.prompt(AnnouncementStore.languages['modify.success']);
                this.state.attachments = [];
                this.state.imageList = [];
                this.state.content = {};
                this.setState({
                  attachments: [], // 附件列表
                  imageList: [], // 图片列表
                  content: {}, // 富文本框内容
                  submitting: false,
                  publishing: false,
                });
                this.goBack();
              }
            }).catch((error) => {
              this.setState({
                submitting: false,
                publishing: false,
              });
              Choerodon.handleResponseError(error);
            });
          } else {
            AnnouncementStore.createAnnouncement(iamOrganizationId, {
              receiver,
              attachments,
              status: AnnouncementStore.languages.unpublished,
              iamOrganizationId,
              createdBy,
              ...data,
            }).then(({ failed, message }) => {
              if (failed) {
                this.setState({
                  submitting: false,
                  publishing: false,
                });
              } else {
                this.state.attachments = [];
                this.state.imageList = [];
                this.state.content = {};
                this.setState({
                  attachments: [], // 附件列表
                  imageList: [], // 图片列表
                  content: {}, // 富文本框内容
                  submitting: false,
                  publishing: false,
                });
                Choerodon.prompt(AnnouncementStore.languages['create.success']);
                this.goBack();
              }
            }).catch((error) => {
              this.setState({
                submitting: false,
                publishing: false,
              });
              Choerodon.handleResponseError(error);
            });
          }
        }
      });
    });
  };

  /**
   * 发布
   * @param e 表
   */
  handlePublish = (e) => {
    e.preventDefault();
    const { content, attachments } = this.state;
    Promise.all(this.promiseElementInfo(content)).then((content) => {
      this.props.form.validateFieldsAndScroll((err, data, modify) => {
        if (!err) {
          const { AppState, intl } = this.props;
          const { receiver, isSaved, ValueAll, receiverIdsObj, ValueAllDpt, orgIdsObj } = this.state;
          const menuType = AppState.currentMenuType;
          const iamOrganizationId = menuType.id;
          this.setState({ publishing: true });
          data.startTime = data.startTime ? data.startTime.format(dateFormat) : data.startTime;
          data.endTime = data.endTime ? data.endTime.format(dateFormat) : data.endTime;
          data.content = JSON.stringify(content);
          let quKong = [];
          quKong = _.compact(this.state.haveSelectedEmpIds);
          let quKong2 = [];
          quKong2 = _.compact(this.state.selectedRowKeysDpt);
          data.receiverIds = _.compact(ValueAll.length > 0 ? ValueAll.map(v => v.employeeId) : receiverIdsObj.map(v => v.employeeId));
          data.orgIds = _.compact(ValueAllDpt.length > 0 ? ValueAllDpt.map(v => v.organizationId) : orgIdsObj.map(v => v.organizationId));
          const { announcementId, createdBy, objectVersionNumber } = this.state.announcementInfo;
          if(receiver=== 2){
            // if (data.orgIds.length >0 ){
              AnnouncementStore.announcementPublish(iamOrganizationId, {
                announcementId,
                attachments,
                iamOrganizationId,
                objectVersionNumber,
                receiver,
                createdBy,
                ...data,
                isSaved,
              }).then(({ failed, message }) => {
                if (failed) {
                  this.setState({
                    publishing: false,
                    submitting: false,
                  });
                } else {
                  AnnouncementStore.getCode('publish.success')
                  this.state.attachments = [];
                  this.state.imageList = [];
                  this.state.content = {};
                  this.setState({
                    attachments: [], // 附件列表
                    imageList: [], // 图片列表
                    content: {}, // 富文本框内容
                    publishing: false,
                    submitting: false,
                  });
                  this.goBack();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
                this.setState({
                  publishing: false,
                  submitting: false,
                });
              });
            // } else {
            //   AnnouncementStore.getCode('choose.organization.information');
            // }

          } else if (receiver === 3){
            if (data.orgIds.length> 0){
              AnnouncementStore.announcementPublish(iamOrganizationId, {
                announcementId,
                attachments,
                iamOrganizationId,
                objectVersionNumber,
                receiver,
                createdBy,
                ...data,
                isSaved,
              }).then(({ failed, message }) => {
                if (failed) {
                  this.setState({
                    publishing: false,
                    submitting: false,
                  });
                } else {
                  AnnouncementStore.getCode('publish.success')
                  this.state.attachments = [];
                  this.state.imageList = [];
                  this.state.content = {};
                  this.setState({
                    attachments: [], // 附件列表
                    imageList: [], // 图片列表
                    content: {}, // 富文本框内容
                    publishing: false,
                    submitting: false,
                  });
                  this.goBack();
                }
              }).catch((error) => {
                Choerodon.handleResponseError(error);
                this.setState({
                  publishing: false,
                  submitting: false,
                });
              });
            } else {
              AnnouncementStore.getCode('publish.success');
              this.setState({
                publishing: false,
                submitting: false,
              });
            }
          } else {
            AnnouncementStore.announcementPublish(iamOrganizationId, {
              announcementId,
              attachments,
              iamOrganizationId,
              objectVersionNumber,
              receiver,
              createdBy,
              ...data,
              isSaved,
            }).then(({ failed, message }) => {
              if (failed) {
                this.setState({
                  publishing: false,
                  submitting: false,
                });
              } else {
                AnnouncementStore.getCode('publish.success')
                this.state.attachments = [];
                this.state.imageList = [];
                this.state.content = {};
                this.setState({
                  attachments: [], // 附件列表
                  imageList: [], // 图片列表
                  content: {}, // 富文本框内容
                  publishing: false,
                  submitting: false,
                });
                this.goBack();
              }
            }).catch((error) => {
              Choerodon.handleResponseError(error);
              this.setState({
                publishing: false,
                submitting: false,
              });
            });
          }

        }
      });
    });
  };

  /**
   * 动态加载员工数据
   * @param
   */
  loadEmployees = (input) => {
    const { AppState } = this.props;
    const { id: tenantId } = AppState.currentMenuType;
    if (input) {
      AnnouncementStore.setSearchLoading(true);
      AnnouncementStore.loadEmployees(tenantId, input).then((data) => {
        this.setState({ receiverIds: data });
        AnnouncementStore.setSearchLoading(false);
      });
    } else {
      this.setState({ receiverIds: [] });
    }
  }

  /**
   * 动态加载部门数据
   * @param
   */
  loadOrganizations = (input) => {
    const { AppState } = this.props;
    const { id: tenantId } = AppState.currentMenuType;
    if (input) {
      AnnouncementStore.setSearchLoading(true);
      AnnouncementStore.loadOrganizations(tenantId, input).then((data) => {
        this.setState({ orgIds: data });
        AnnouncementStore.setSearchLoading(false);
      });
    } else {
      this.setState({ orgIds: [] });
    }
  };

  /**
   * 处理文本框变化
   * @param
   */
  handleTextContent = (value) => {
    const { content } = this.state;
    // this.state.content = value;
    this.setState({ content: value });
  };

  /**
   * 处理异步，base64/URL转ID，
   * @param
   */
  promiseList = (elementContent) => {
    const { AppState } = this.props;
    const { imageList } = this.state;
    const { id: iamOrganizationId } = AppState.currentMenuType;
    const promiseList = [];
    elementContent.forEach((element) => {
      promiseList.push(
        new Promise((resolve) => {
          if (element.insert && element.insert.image && element.insert.image.split && element.insert.image.split(':')[0] === 'data') {
            const config = {
              headers: { 'Content-Type': 'multipart/form-data' },
            };
            const formData = new FormData();
            formData.append('file', this.dataURLtoFile(element.insert.image));
            AnnouncementStore.submitFile(iamOrganizationId, formData, config).then((res) => {
              element.insert.image = res.imageUrl;
              resolve(element);
            });
          } else if (element.insert && element.insert.image && element.insert.image.split && element.insert.image.split(':')[0] === 'http') {
            resolve(element);
          } else {
            resolve(element);
          }
        }),
      );
    });
    return promiseList;
  };

  /**
   * 处理元素 与elementContentInfo的赋值
   * @param
   */
  promiseElementInfo = (elementInfos) => {
    const { content } = this.state;
    const result = [];
    if (JSON.stringify(elementInfos) !== '{}' && JSON.stringify(elementInfos) !== '""') {
      elementInfos.forEach((item) => {
        result.push(
          new Promise((resolve) => {
            if (content) {
              Promise.all(this.promiseList(content))
                .then((content) => {
                  const elementContent = JSON.stringify(content);
                  resolve({ ...item });
                });
            } else {
              const elementContent = '';
              resolve({ ...item });
            }
          }),
        );
      });
    }
    return result;
  };

  dataURLtoFile = (dataurl) => { // 将base64转换为文件
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = window.atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], `${md5((new Date()).getTime())}.${mime.split('/')[1]}`, { type: mime });
  };

  disabledStartDate = (startValue) => {
    const { endValue } = this.state;
    if (!startValue || !endValue) {
      return false;
    }
    return startValue.valueOf() > endValue.valueOf();
  };

  disabledEndDate = (endValue) => {
    const { startValue } = this.state;
    if (!endValue || !startValue) {
      return false;
    }
    return endValue.valueOf() <= startValue.valueOf();
  };

  onChange = (field, value) => {
    this.setState({
      [field]: value,
    });
  }

  onStartChange = (value) => {
    this.onChange('startValue', value);
  };

  onEndChange = (value) => {
    this.onChange('endValue', value);
  };

  handleStartOpenChange = (open) => {
    if (!open) {
      this.setState({ endOpen: true });
    }
  };

  handleEndOpenChange = (open) => {
    this.setState({ endOpen: open });
  };

  renderWYSIWYGEditor = () => {
    const { haveDone, content } = this.state;
    if (haveDone) {
      return (
        <div className="element">
          <div className="element-content">
            <WYSIWYGEditor
              value={content}
              style={{ width: '100%' }}
              onChange={value => this.handleTextContent(value)}
            />
          </div>
        </div>
      );
    } else {
      return '';
    }
  };

  renderUpload = () => {
    const { AppState, intl } = this.props;
    const { haveDone, announcementInfo, attachments } = this.state;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    if (haveDone) {
      return (
        <div className="upload" style={formItemLayout}>
          <Upload
            name="file"
            className="upload-content"
            // defaultFileList={this.state.attachments}
            defaultFileList={!announcementInfo.files ? [] : attachments}
            action={`${process.env.API_HOST}/fileService/v1/${organizationId}/file/attachment`}
            headers={{
              Authorization: `bearer ${Choerodon.getCookie('access_token')}`,
              'X-Client-ID': CLIENT_ID,
              'X-Client-Type': CLIENT_TYPE,
            }}
            beforeUpload={(file) => {
              const { name } = file;
              if (name.length >= 50) {
                Choerodon.prompt(AnnouncementStore.languages['upload.tip']);
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
              } else if (status === 'error') {
                AnnouncementStore.getCode('upload.error');
              }
            }}
            onRemove={(file) => {
              const { response } = file;
              if (response) {
                this.state.attachments.splice(this.state.attachments.findIndex(item => item.announcementAttachmentId === response.announcementAttachmentId), 1);
                this.setState({
                  attachments: this.state.attachments,
                });
              } else {
                this.state.attachments.splice(this.state.attachments.findIndex(item => item.announcementAttachmentId === file.announcementAttachmentId), 1);
                this.setState({
                  attachments: this.state.attachments,
                });
              }
            }}
          >
            <span>
              {
                this.state.attachments && this.state.attachments.length > 0 ? (
                  <Button className="upload-button" style={{ color: '#fff', background: '#2196F3' }}>
                    <i className="icon icon-shangchuanwenjian" />
                    {AnnouncementStore.languages.upload}
                  </Button>
                ) : (
                  <Button className="upload-button">
                    <i className="icon icon-shangchuanwenjian" />
                    {AnnouncementStore.languages.upload}
                  </Button>
                )
              }
              <div className="file-type">
                {AnnouncementStore.languages[`${intlPrefix}.support.extension`]}：.rar .zip .doc .docx .pdf .jpg...
              </div>
            </span>
          </Upload>
        </div>
      );
    } else {
      return '';
    }
  };

  render() {
    const { AppState, intl } = this.props;
    const { announcementInfo, data, preview, ValueAllDpt, receiver, attachments, content, publishing, receiverIdsObj, submitting, edit, receiverIds, orgIdsObj, ValueAll } = this.state;
    const menuType = AppState.currentMenuType;
    const organizationId = menuType.id;
    const { getFieldDecorator } = this.props.form;
    const columns = [{
      title: AnnouncementStore.languages[`${intlPrefix}.employeename`],
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 136,
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.employeecode`],
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 136,

    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.email`],
      dataIndex: 'email',
      key: 'email',
      width: 173,
    }];

    const columnsDpt = [{
      title: AnnouncementStore.languages[`${intlPrefix}.organizationCode`],
      dataIndex: 'organizationCode',
      key: 'organizationCode',
      width: 133,
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.organizationName`],
      dataIndex: 'organizationName',
      key: 'organizationName',
      width: 133,

    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.organizationUpperName`],
      dataIndex: 'parentName',
      key: 'parentName',
      width: 179,
    }];
    const radioStyle = {
      display: 'inline',
    };

    const footerOptions = (
      <div className="edit-announcement-footer">
        <Button
          onClick={() => this.editPreview()}
        >
          {AnnouncementStore.languages.preview}
        </Button>
        <Button
          loading={publishing}
          onClick={e => this.handlePublish(e)}
        >
          {AnnouncementStore.languages.publish}
        </Button>
        <Button
          loading={submitting}
          onClick={e => this.handleSubmit(e)}
        >
          {AnnouncementStore.languages.save}
        </Button>
      </div>
    );

    return (
      <Page>
        <Header
          title={edit ? AnnouncementStore.languages[`${intlPrefix}.modify`] : AnnouncementStore.languages[`${intlPrefix}.create`]}
          backPath={`/iam/announcement?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`}
        />
        <Content
          className="ann-slider"
        >
          <Form onSubmit={this.handleSubmit.bind(this)} layout="vertical">
            <FormItem
              {...formItemLayout}
              style={{ display: 'inline-block' }}
            >
              {getFieldDecorator('title', {
                rules: [
                  {
                    required: true,
                    whitespace: true,
                    message: AnnouncementStore.languages[`${intlPrefix}.theme.require.msg`],
                  },
                ],
                validateTrigger: 'onBlur',
                initialValue: announcementInfo.title,
                validateFirst: true,
              })(
                <Input
                  autoComplete="off"
                  maxLength={60}
                  label={AnnouncementStore.languages[`${intlPrefix}.theme`]}
                  style={{ width: 700 }}
                />,
              )}
            </FormItem>
            {edit ? (
              <span>
                <Tag color={announcementInfo.statusColor} style={{ margin: '15px 0 0 15px' }}>{announcementInfo.status || 'undefined'}</Tag>
              </span>
            ) : (
              <span>
                <Tag style={{ margin: '15px 0 0 15px' }} color="rgba(128,146,192,1)">{AnnouncementStore.languages.unpublished}</Tag>
              </span>
            )}
            <br />
            <span className="edit-row">
              <span className="edit-startdate-col">
                <FormItem
                  {...formItemLayout}
                >
                  {getFieldDecorator('startTime', {
                    rules: [
                      {
                        required: true,
                        message: AnnouncementStore.languages[`${intlPrefix}.startTime.require.msg`],
                      },
                    ],
                    initialValue: announcementInfo.startTime ? moment(announcementInfo.startTime) : null,
                  })(
                    <DatePicker
                      disabledDate={this.disabledStartDate}
                      label={AnnouncementStore.languages[`${intlPrefix}.startTime`]}
                      format="YYYY-MM-DD HH:mm:ss"
                      showTime
                      style={inputStyle}
                      placeholder={AnnouncementStore.languages[`${intlPrefix}.startTime`]}
                      onChange={this.onStartChange}
                      onOpenChange={this.handleStartOpenChange}
                      onOk={(value) => {
                        this.props.form.setFieldsValue({ startTime: value });
                      }}
                    />,
                  )}
                </FormItem>
              </span>
              <span className="edit-enddate-col">
                <FormItem
                  {...formItemLayout}
                >
                  {getFieldDecorator('endTime', {
                    rules: [],
                    validateTrigger: 'onBlur',
                    initialValue: announcementInfo.endTime ? moment(announcementInfo.endTime) : null,
                    validateFirst: true,
                  })(
                    <DatePicker
                      label={AnnouncementStore.languages[`${intlPrefix}.endTime`]}
                      disabledDate={this.disabledEndDate}
                      format="YYYY-MM-DD HH:mm:ss"
                      showTime
                      style={inputStyle}
                      placeholder={AnnouncementStore.languages[`${intlPrefix}.endTime`]}
                      onChange={this.onEndChange}
                      onOpenChange={this.handleEndOpenChange}
                      onOk={(value) => {
                        this.props.form.setFieldsValue({ endTime: value });
                      }}
                    />,
                  )}
                </FormItem>
              </span>
            </span>
            {edit ? this.renderWYSIWYGEditor() : (
              <div className="element">
                <div className="element-content">
                  <WYSIWYGEditor
                    value={content}
                    style={{ width: '100%' }}
                    onChange={value => this.handleTextContent(value)}
                  />
                </div>
              </div>
            )}
            {edit ? this.renderUpload() : (
              <div className="upload" style={formItemLayout}>
                <Upload
                  className="upload-content"
                  name="file"
                  defaultFileList={attachments}
                  action={`${process.env.API_HOST}/fileService/v1/${organizationId}/file/attachment`}
                  headers={{
                    Authorization: `bearer ${Choerodon.getCookie('access_token')}`,
                    'X-Client-ID': CLIENT_ID,
                    'X-Client-Type': CLIENT_TYPE,
                  }}
                  beforeUpload={(file) => {
                    const { name } = file;
                    if (name.length >= 50) {
                      Choerodon.prompt(AnnouncementStore.languages['upload.tip']);
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
                    } else if (status === 'error') {
                      AnnouncementStore.getCode('upload.error');
                    }
                  }}
                  onRemove={(file) => {
                    const { response } = file;
                    if (response) {
                      this.state.attachments.splice(this.state.attachments.findIndex(item => item.announcementAttachmentId === response.announcementAttachmentId), 1);
                      this.setState({
                        attachments: this.state.attachments,
                      });
                    } else {
                      this.state.attachments.splice(this.state.attachments.findIndex(item => item.announcementAttachmentId === file.announcementAttachmentId), 1);
                      this.setState({
                        attachments: this.state.attachments,
                      });
                    }
                  }}
                >
                  <span>
                    {
                      this.state.attachments && this.state.attachments.length > 0 ? (
                        <Button className="upload-button" style={{ color: '#fff', background: '#2196F3' }}>
                          <i className="icon icon-shangchuanwenjian" />
                          {AnnouncementStore.languages.upload}
                        </Button>
                      ) : (
                        <Button className="upload-button">
                          <i className="icon icon-shangchuanwenjian" />
                          {AnnouncementStore.languages.upload}
                        </Button>
                      )
                    }
                    <div className="file-type">
                      {AnnouncementStore.languages[`${intlPrefix}.fileAccept.tooltip`]}
                    </div>
                  </span>
                </Upload>
              </div>
            )}
            <div className="receive-type">
              {AnnouncementStore.languages.receiver}
            </div>
            <RadioGroup className="receive-type-radio" onChange={this.onChangeRadio} value={receiver}>
              <Radio style={radioStyle} value={1}>
                {AnnouncementStore.languages.all}
              </Radio>
              <Radio style={radioStyle} value={3}>
                {AnnouncementStore.languages.organization}
              </Radio>
              <Radio style={radioStyle} value={2}>
                {AnnouncementStore.languages.employee}
              </Radio>
            </RadioGroup>
            {receiver === 2 ? (
              <span>
                <Button onClick={this.showMainModal}><Icon type="playlist_add" style={{ color: '#2196f3' }} />{AnnouncementStore.languages[`${intlPrefix}.add.employee`]}</Button>
                <div style={{ width: 450 }}>
                  <Table
                    size="middle"
                    className="this-is-announcement"
                    columns={columns}
                    filterBar={false}
                    bordered
                    pagination={false}
                    dataSource={ValueAll.length > 0 ? ValueAll : receiverIdsObj}
                    scroll={{ y: 280 }}
                    rowKey={
                      record => record.employeeId
                    }
                  />
                </div>
              </span>
            ) : receiver === 3 ? (
              <span>
                <Button onClick={this.showMainModalDpt}><Icon type="playlist_add" style={{ color: '#2196f3' }} />{AnnouncementStore.languages[`${intlPrefix}.add.organization`]}</Button>
                <div style={{ width: 450 }}>
                  <Table
                    size="middle"
                    className="this-is-announcement"
                    columns={columnsDpt}
                    filterBar={false}
                    bordered
                    pagination={false}
                    dataSource={ValueAllDpt.length > 0 ? ValueAllDpt : orgIdsObj}
                    scroll={{ y: 280 }}
                    rowKey={
                      record => record.organizationId
                    }
                  />
                </div>
              </span>
            ) : null}
          </Form>
          {footerOptions}
          {
            preview ? (
              <Modal
                title={AnnouncementStore.languages.announcement}
                visible={this.state.preview}
                okText={AnnouncementStore.languages.ok}
                cancelText={AnnouncementStore.languages.cancel}
                footer={null}
                width="50%"
                className="ann-modal"
                onOk={() => {
                  this.setState({ preview: false });
                }}
                onCancel={() => {
                  this.setState({ preview: false });
                }}
                style={{ top: 100 }}
              >
                {this.renderPreviewContent(data)}
              </Modal>
            ) : ''
          }
          {this.handleShowModal()}
          {this.handleShowModalDpt()}
        </Content>
      </Page>
    );
  }
}
