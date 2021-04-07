import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Form, Input, Tag, DatePicker, Upload, Button, Icon, Modal, Radio, Tooltip, Col, Collapse, Table } from 'yqcloud-ui';
import { Content, Header, Page } from 'yqcloud-front-boot';
import { CLIENT_ID, CLIENT_TYPE } from 'yqcloud-front-boot/lib/containers/common/constants';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import _ from 'lodash';
import md5 from 'md5';
import moment from 'moment';
import WYSIWYGEditor from '../../../../components/WYSIWYGEditor';
import AnnouncementStore from '../../../../stores/globalStores/siteAnnouncement';
import 'react-quill/dist/quill.snow.css';
import './editAnnouncement.scss';

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
    this.organizationId = 0;
    this.organizationName = this.props.AppState.currentMenuType.name;
  }

  componentDidMount() {
    this.fetch(this.state);
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    AnnouncementStore.queryLanguage(0, AppState.currentLanguage);
  };

  componentWillUnmount() {
    this.setState(this.getInitState());
  }

  getInitState() {
    return {
      receiver: 2,
      preview: false,
      announcementInfo: {},
      tenantIds: [],
      tenantIdsObj: [],
      data: {},
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
      sort: {
        columnKey: 'id',
        order: 'descend',
      },
      dataSourceOrg: [],
      orgVisible: false,
      selectedRowKeysDpt: [],
      selectedRowKeysBefore: [],
      ValueAll: [],

      piPeiId: [],
    };
  }

  /**
   * 通过id获取布局模块信息
   * @param id 公告id
   */
  getAnnouncementById(id) {
    const { intl } = this.props;
    AnnouncementStore.getAnnouncementById(this.organizationId, id)
      .then((data) => {
        if (data.failed) {
          Choerodon.prompt(AnnouncementStore.languages[data.message]);
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
            if (data.receiver === 2 && Array.isArray(data.tenantIds) && data.tenantIds.length) {
              if (data.tenants) {
                this.setState({ tenantIdsObj: data.tenants, selectedRowKeysBefore: data.tenantIds, selectedRowKeysDpt: data.tenantIds });
              }
              this.props.form.setFieldsValue({
                tenantIds: data.tenantIds,
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
    this.loadOrgMsg();
    this.handleShowModal();
    if (edit) {
      this.getAnnouncementById(id);
    }
  }

  goBack = () => {
    this.props.history.push('/iam/announce/site');
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


  // 加载租户列表
  loadOrgMsg(paginationIn, sortIn, filtersIn, paramsIn) {
    const {
      pagination: paginationState,
      sort: sortState,
      filters: filtersState,
      params: paramsState,
    } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    AnnouncementStore.loadOrgMsg()
      .then((data) => {
        this.setState({
          dataSourceOrg: data || '',
          sort,
          params,
          pagination: {
            current: data.number + 1,
            pageSize: data.size,
            total: data.totalElements,
            pageSizeOptions: [25, 50, 100, 200],
          },

        });
      })
      .catch((error) => {
        Choerodon.handleResponseError(error);
      });
  }

  // 分页点击
  handlePageChange = (pagination, filters, { field, order }, params) => {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadOrgMsg(pagination, sorter.join(','), filters, params);
  }

  // 渲染添加租户弹出框
  showMainModal = () => {
    const { dataSourceOrg, tenantIdsObj, selectedRowKeysBefore } = this.state;
    const idS = [];
    tenantIdsObj.forEach((v) => {
      idS.push(v.id);
    });
    const dataIdObj = [];
    dataSourceOrg.forEach((v) => {
      dataIdObj.push(v.id);
    });
    const piPeiObj = _.intersection(idS, dataIdObj);
    this.setState({
      piPeiId: piPeiObj,
      selectedRowKeysDpt: selectedRowKeysBefore,
      orgVisible: true,
    });
  };

  // 弹出框的XXX
  handleShowMain = () => {
    this.setState({
      orgVisible: false,
      // selectedRowKeys:[],
    });
  }

  // 弹出框的取消按钮
  showMainCancel = () => {
    const { selectedRowKeysBefore } = this.state;
    this.handleShowMain();
    this.setState({
      showMainVisible: false,
      // selectedRowKeys:[],
      selectedRowKeysDpt: selectedRowKeysBefore,
    });
  };

  handleShowModal = () => {
    const { AppState, edit, intl, form } = this.props;
    const { getFieldDecorator } = form;
    const { orgVisible, dataSourceOrg, selectedRowKeys, pagination, tenantIds, piPeiId, isChecked, selectedRowKeysDpt } = this.state;
    const { organizationId } = AppState.currentMenuType;
    const columns = [{
      title: AnnouncementStore.languages.name,
      dataIndex: 'name',
      key: 'name',
      width: 93,
    }, {
      title: AnnouncementStore.languages.code,
      dataIndex: 'code',
      key: 'code',
      width: 93,

    }, {
      title: AnnouncementStore.languages['global.organization.remark'],
      dataIndex: 'remark',
      key: 'remark',
      width: 147,
    }];
    const rowSelectionDpt = {
      selectedRowKeys: selectedRowKeysDpt,
      onChange: (selectedRowKeys, valAll) => {
        this.setState({ selectedRowKeysDpt: selectedRowKeys });
      },
    };

    return (
      <Modal
        title={AnnouncementStore.languages[`${intlPrefix}.empOrgMoadl`]}
        visible={orgVisible}
        onOk={this.handleShowModalSubmit}
        onCancel={this.showMainCancel}
        className="empOrgMoadl"
        style={{ width: 575, height: 407 }}
        footer={
          [<Button
            onClick={this.handleShowModalSubmit}
            style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
            type="primary"
            funcType="raised"
          >
            {AnnouncementStore.languages.ok}
          </Button>,
            <Button
              onClick={this.showMainCancel}
              funcType="raised"
              style={{ marginRight: '20px' }}
            >
              {AnnouncementStore.languages.cancel}
            </Button>]}
        center
      >
        <div style={{ marginTop: 20 }}>
          <Table
            // filterBar={false}
            rowSelection={rowSelectionDpt}
            rowKey={record => record.id}
            size="middle"
            columns={columns}
            dataSource={dataSourceOrg}
            onChange={this.handlePageChange.bind(this)}
            // pagination={pagination}
            pagination={false}
            scroll={{ y: 250 }}
          />
        </div>
      </Modal>
    );
  };

  // 确认按钮
  handleShowModalSubmit = () => {
    const { selectedRowKeysDpt } = this.state;
    if (selectedRowKeysDpt.length < 1) {
      Choerodon.prompt(AnnouncementStore.languages[`${intlPrefix}.submitFiled`]);
    } else {
      this.addDptInTable();
      this.renderReceiverIds();
      this.setState({
        orgVisible: false,
        selectedRowKeysBefore: selectedRowKeysDpt,
      });
    }
  }

  /* 把已经选择了的组织数据，显示在表格中 */
  addDptInTable = () => {
    const { selectedRowKeysDpt, dataSourceOrg } = this.state;
    const changeData = [];
    selectedRowKeysDpt.forEach((item, index) => {
      dataSourceOrg.forEach((k, v) => {
        if (k.id === item) {
          changeData.push(k);
        }
      });
    });
    this.setState({ ValueAll: changeData });
  };


  handleDownload = (item) => {
    AnnouncementStore.downloadFile(this.organizationId, item.attachmentId).then((data) => {
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
   * 渲染选择框的接收对象
   * @param
   */
  renderReceiverIds = () => {
    const { ValueAll, tenantIdsObj } = this.state;
    const result = [];
    if (tenantIdsObj.length > 0) {
      const tenantIdsObjNew = [];
      ValueAll.forEach((v) => {
        tenantIdsObjNew.push(v);
      });
      this.setState({ tenantIdsObj: tenantIdsObjNew });
      return tenantIdsObj;
    } else {
      ValueAll.forEach((v) => {
        tenantIdsObj.push(v);
      });
      return tenantIdsObj;
    }
  };

  /**
   * 单选框改变
   * @param
   */
  onChangeRadio = (e) => {
    // 1 平台 2 租户
    if (e.target.value === 1) {
      this.setState({ tenantIds: [], ValueAll: [], tenantIdsObj: [], selectedRowKeysBefore: [], selectedRowKeysDpt: [] });
    }
    this.setState({ receiver: e.target.value });
  };

  /**
   * 提交表单,创建和保存
   * @param e 表
   */
  handleSubmit = (e) => {
    e.preventDefault();
    const { content, attachments } = this.state;
    Promise.all(this.promiseElementInfo(content)).then((content) => {
      this.props.form.validateFieldsAndScroll((err, data, modify) => {
        if (!err) {
          const { AppState } = this.props;
          const { receiver, content, edit, ValueAll, tenantIds, tenantIdsObj, selectedRowKeysBefore } = this.state;
          const createdBy = AppState.getUserId;
          const abc = [];
          tenantIdsObj.forEach((v) => {
            abc.push(v.id);
          });
          this.setState({ submitting: true, tenantIds: abc });
          data.startTime = data.startTime ? data.startTime.format(dateFormat) : data.startTime;
          data.endTime = data.endTime ? data.endTime.format(dateFormat) : data.endTime;
          data.content = JSON.stringify(content);
          data.tenantIds = selectedRowKeysBefore;

          if (edit) {
            const { announcementId, objectVersionNumber } = this.state.announcementInfo;
            AnnouncementStore.updateAnnouncement(this.organizationId, {
              announcementId,
              iamOrganizationId: this.organizationId,
              objectVersionNumber,
              receiver,
              attachments,
              ...data,
            }).then(({ failed, message }) => {
              if (failed) {
                Choerodon.prompt(message);
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
            AnnouncementStore.createAnnouncement(this.organizationId, {
              receiver,
              attachments,
              status: '未发布',
              iamOrganizationId: this.organizationId,
              createdBy,
              ...data,
            }).then(({ failed, message }) => {
              if (failed) {
                Choerodon.prompt(message);
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
          const { receiver, isSaved, selectedRowKeysBefore } = this.state;
          this.setState({ publishing: true });
          data.startTime = data.startTime ? data.startTime.format(dateFormat) : data.startTime;
          data.endTime = data.endTime ? data.endTime.format(dateFormat) : data.endTime;
          data.content = JSON.stringify(content);
          data.tenantIds = selectedRowKeysBefore;
          const { announcementId, createdBy, objectVersionNumber } = this.state.announcementInfo;
          AnnouncementStore.announcementPublish(this.organizationId, {
            announcementId,
            attachments,
            iamOrganizationId: this.organizationId,
            objectVersionNumber,
            receiver,
            createdBy,
            ...data,
            isSaved,
          }).then(({ failed, message }) => {
            if (failed) {
              Choerodon.prompt(message);
              this.setState({
                publishing: false,
                submitting: false,
              });
            } else {
              Choerodon.prompt(AnnouncementStore.languages['publish.success']);
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
      });
    });
  };

  /**
   * 动态加载租户数据
   * @param
   */
  loadTenants = (input) => {
    const { ValueAll } = this.state;
    if (input) {
      AnnouncementStore.setSearchLoading(true);
      AnnouncementStore.loadTenants(input).then((data) => {
        this.setState({ tenantIds: data });
        AnnouncementStore.setSearchLoading(false);
      });
    } else {
      this.setState({ tenantIds: [] });
    }
  }

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
            AnnouncementStore.submitFile(this.organizationId, formData, config).then((res) => {
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
    if (JSON.stringify(elementInfos) !== '{}') {
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
    if (haveDone) {
      return (
        <div className="upload" style={formItemLayout}>
          <Upload
            name="file"
            className="upload-content"
            defaultFileList={!announcementInfo.files ? [] : attachments}
            action={`${process.env.API_HOST}/fileService/v1/${this.organizationId}/file/attachment`}
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
                Choerodon.prompt('上传错误');
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
      );
    } else {
      return '';
    }
  };

  render() {
    const { AppState, intl } = this.props;
    const { announcementInfo, data, preview, ValueAll, receiver, attachments, content, publishing, submitting, edit, dataSourceOrg, pagination, tenantIdsObj } = this.state;
    const { getFieldDecorator } = this.props.form;
    const radioStyle = {
      /* display: 'block',
      height: '30px',
      lineHeight: '30px', */
    };
    const columns = [{
      title: AnnouncementStore.languages.name,
      dataIndex: 'name',
      key: 'name',
      width: 149,
      render: (text, record) => {
        if (record.name.length > 10) {
          return `${record.name.slice(0, 9)}...`;
        } else {
          return record.name;
        }
      },
    }, {
      title: AnnouncementStore.languages.code,
      dataIndex: 'code',
      key: 'code',
      width: 135,

    }, {
      title: AnnouncementStore.languages['global.organization.remark'],
      dataIndex: 'remark',
      key: 'remark',
      width: 165,
    }];
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
          {AnnouncementStore.languages[edit ? 'save' : 'create']}
        </Button>
      </div>
    );

    return (
      <Page>
        <Header
          title={edit ? AnnouncementStore.languages[`${intlPrefix}.modify`] : AnnouncementStore.languages[`${intlPrefix}.create`]}
          backPath="/iam/announce/site"
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
                <Tag style={{ margin: '15px 0 0 15px' }} color="rgba(128,146,192,1)">未发布</Tag>
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
                      style={inputStyle}
                      showTime
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
                      showTime
                      label={AnnouncementStore.languages[`${intlPrefix}.endTime`]}
                      disabledDate={this.disabledEndDate}
                      format="YYYY-MM-DD HH:mm:ss"
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
                  action={`${process.env.API_HOST}/fileService/v1/${this.organizationId}/file/attachment`}
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
                      Choerodon.prompt('上传错误');
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
              {/* <Tooltip */}
              {/* title={( */}
              {/* <p> */}
              {/* {AnnouncementStore.languages["receiver.site.tooltip"]} */}
              {/* </p> */}
              {/* )} */}
              {/* trigger="hover" */}
              {/* placement="rightTop" */}
              {/* getPopupContainer={() => document.getElementsByClassName('ann-slider')[0].parentNode} */}
              {/* > */}
              {/* <Icon className="yqcloud-icon-help" type="help_outline" /> */}
              {/* </Tooltip> */}
            </div>
            <RadioGroup className="receive-type-radio" onChange={this.onChangeRadio} value={receiver}>
              <Radio style={radioStyle} value={1}>
                {AnnouncementStore.languages[`${intlPrefix}.all`]}
              </Radio>
              <Radio style={radioStyle} value={2}>
                {AnnouncementStore.languages[`${intlPrefix}.tenant`]}
                {receiver === 2 ? (
                  <span>
                    <Button onClick={this.showMainModal}><Icon type="playlist_add" style={{ color: '#2196f3' }} />添加租户</Button>
                    <div>
                      <FormItem
                        style={{ display: 'inline-block', marginRight: 20 }}
                      >
                        {getFieldDecorator('tenantIds', {
                          // rules: [{
                          //   required: true,
                          //   message: AnnouncementStore.languages[ `${intlPrefix}.receive.require.msg`],
                          // }],
                        })(
                          <div style={{ width: 450 }}>
                            <Table
                              size="middle"
                              className="this-is-announcement"
                              columns={columns}
                              filterBar={false}
                              bordered
                              pagination={false}
                              dataSource={ValueAll.length > 0 ? ValueAll : tenantIdsObj}
                              // scroll={{ y: 280 }}
                              rowKey={
                                record => record.id
                              }
                            />
                          </div>,
                        )}
                      </FormItem>
                    </div>
                  </span>

                ) : null}
              </Radio>
            </RadioGroup>
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
          {this.handleShowModal()}
        </Content>
      </Page>
    );
  }
}
