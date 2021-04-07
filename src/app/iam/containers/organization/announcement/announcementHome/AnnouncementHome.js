import React, { Component } from 'react';
import { Button, Table, Icon, Form, Modal, Popover, Radio, Select, Tooltip, Popconfirm, DatePicker } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { Action, Content, Header, Page, Permission } from 'yqcloud-front-boot';
import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import './announcementHome.scss';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import moment from 'moment';
import LoadingBar from '../../../../components/loadingBar';

const dateFormat = 'YYYY-MM-DD';
const intlPrefix = 'organization.setting.announcement';

@inject('AppState')
@observer
class AnnouncementHome extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitState();
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.loadLanguage();
  }

  componentDidMount() {
    this.loadAnnouncement();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState, AnnouncementStore } = this.props;
    const { id } = AppState.currentMenuType;
    AnnouncementStore.queryLanguage(id, AppState.currentLanguage);
  };


  getInitState() {
    return {
      isSaved: 'N', // 发布时得判断是否保存过
      preview: false,
      visible: false,
      edit: false,
      selectData: '',
      open: false,
      id: null,
      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: 0,
        pageSizeOptions: [25, 50, 100, 200],
      },
      sort: {
        columnKey: 'announcementId',
        order: 'descend',
      },
      status: '',
      dataSource: [],
      endOpen: false,
      startValue: null,
      endValue: null,
    };
  }

  /**
   * 加载公告数据
   * @param paginationIn 分页参数
   * @param sortIn 当前排序
   * @param filtersIn 当前筛选
   * @param paramsIn
   */
  loadAnnouncement = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState, AnnouncementStore } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id: organizationId } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    AnnouncementStore.loadAnnouncements(organizationId, pagination, sort, filters, params)
      .then((data) => {
        AnnouncementStore.setIsLoading(false);
        AnnouncementStore.setAnnouncements(data.content.slice());
        this.setState({
          dataSource: data.content || data,
          pagination: {
            current: data.number + 1,
            pageSize: data.size,
            total: data.totalElements,
            pageSizeOptions: [25, 50, 100, 200],
          },
          filters,
          sort,
          params,
        });
      });
  };

  /**
   * 分页加载数据
   * @param page
   * @returns {*}
   */
  handlePageChange = (pagination, filters, sort, params) => {
    this.loadAnnouncement(pagination, sort, filters, params);
  };

  /**
   * 预览
   * @param id 公告id
   */
  preview = (id) => {
    const { AnnouncementStore, AppState } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    this.state.preview = true;
    AnnouncementStore.getAnnouncementById(organizationId, id).then((data) => {
      if (data) {
        this.setState({ data });
      }
    });
  };

  handleDownload = (item) => {
    const { AppState, AnnouncementStore } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    AnnouncementStore.downloadFile(organizationId, item.attachmentId).then((data) => {
      const fileUrl1 = data.fileUrl;
      window.open(fileUrl1);
    });
  };

  renderPreviewContent = (data) => {
    const fileOptions = [];
    const announcementContent = JSON.parse(data.content);
    const content = (new QuillDeltaToHtmlConverter(announcementContent, {})).convert();
    const { AnnouncementStore } = this.props;

    if (data.attachments) {
      data.attachments.forEach((item) => {
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
          <span style={{ marginRight: 23 }}>{AnnouncementStore.languages[`${intlPrefix}.startTime`]}：{data.startTime ? data.startTime : ''}</span>
          <span style={{ marginRight: 23 }}>{AnnouncementStore.languages[`${intlPrefix}.endTime`]}：{ data.endTime ? data.endTime : ''}</span>
          <span>{AnnouncementStore.languages[`${intlPrefix}.table.founder`]}：{data.createByName || ''}</span>
        </div>
        <div className="ann-content" style={contentStyle} dangerouslySetInnerHTML={{ __html: `${content || ''}` }} />
        {data.attachments && data.attachments.length > 0 ? (
          <div style={{ paddingTop: 10, borderTop: '1px solid #EBF1F5' }}>{fileOptions}</div>
        ) : ''}
      </div>
    );
  };

  /* 创建 */
  createLayout = () => {
    this.props.history.push(`/iam/announcement/create?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
  };

  /**
   * 编辑公告
   * @param record 列数据
   */
  handleEdit = (record) => {
    this.props.history.push(`/iam/announcement/edit/${record.announcementId}?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`);
  };

  /**
   * 删除公告
   * @param record 列数据
   */
  handleDelete = (record) => {
    const { AnnouncementStore, AppState, intl } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    const { announcementId, objectVersionNumber } = record;
    const isDeleted = 'Y';
    const status = '已删除';
    AnnouncementStore.deleteAnnouncement(organizationId, announcementId, status, isDeleted, objectVersionNumber).then(({ failed, message }) => {
      if (failed) {
        Choerodon.prompt(message);
      } else {
        Choerodon.prompt(AnnouncementStore.languages['delete.success']);
        this.loadAnnouncement();
      }
    }).catch((error) => {
      Choerodon.prompt(AnnouncementStore.languages['delete.error']);
    });
  }

  /**
   * 启用禁用
   * @param record 列数据
   */
  handleAble = (record) => {
    const { AnnouncementStore, AppState, intl } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    const { objectVersionNumber, announcementId } = record;
    if (record.isEnabled === 'Y') {
      // 禁用
      const isEnabled = 'N';
      const status = '已失效';
      AnnouncementStore.ableConfiguration(organizationId, announcementId, status, isEnabled, objectVersionNumber).then(({ failed, message }) => {
        if (failed) {
          Choerodon.prompt(message);
        } else {
          Choerodon.prompt(AnnouncementStore.languages['disable.success']);
          this.loadAnnouncement();
        }
      }).catch((error) => {
        Choerodon.prompt(AnnouncementStore.languages['disable.error']);
      });
    }
  }

  handleUpdate=(record) => {
    const { dataSource } = this.state;
    record.isEdit = true;
    this.setState({
      dataSource,
    });
  }

  /* 刷新 */
  reload = () => {
    this.setState(this.getInitState(), () => {
      this.loadAnnouncement();
    });
  };

  onChange = (field, value) => {
    this.setState({
      [field]: value,
    });
  }

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

  render() {
    const { AppState, AnnouncementStore } = this.props;
    const { data, startValue, endValue, dataSource, preview, sort: { columnKey, order }, pagination, filters, params } = this.state;
    const { id: organizationId } = AppState.currentMenuType;

    const columns = [{
      dataIndex: 'announcementId',
      key: 'announcementId',
      hidden: true,
      sortOrder: columnKey === 'announcementId' && order,
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.table.title`],
      dataIndex: 'title',
      key: 'title',
      filters: [],
      width: 150,
      sorter: true,
      sortOrder: columnKey === 'title' && order,
      filteredValue: filters.title || [],
      onCellClick: record => this.preview(record.announcementId),
      render: text => <a className="zheshiyigeclassname">{text}</a>,
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.table.receive`],
      dataIndex: 'receiver',
      key: 'receiver',
      sorter: true,
      sortOrder: columnKey === 'receiver' && order,
      filters: [{
        text: AnnouncementStore.languages.all,
        value: 1,
      }, {
        text: AnnouncementStore.languages.employee,
        value: 2,
      }, {
        text: AnnouncementStore.languages.organization,
        value: 3,
      }],
      filteredValue: filters.receiver || [],
      render: (text, record) => {
        if (record.receiver === 1) {
          return (AnnouncementStore.languages.all);
        } else if (record.receiver === 2) {
          return (AnnouncementStore.languages.employee);
        } else {
          return (AnnouncementStore.languages.organization);
        }
      },
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.table.founder`],
      dataIndex: 'createByName',
      key: 'createByName',
      // filters: [],
      // sorter: true,
      // sortOrder: columnKey === 'createByName' && order,
      // filteredValue: filters.createByName || [],
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.table.status`],
      key: 'status',
      dataIndex: 'status',
      sorter: true,
      sortOrder: columnKey === 'status' && order,
      filters: [],
      filteredValue: filters.status || [],
      render: (text, record) => {
        if (record.status === '已发布') {
          return (<span className="publishSpan">{AnnouncementStore.languages.published}</span>);
        } else if (record.status === '未发布') {
          return (<span className="unPublishSpan">{AnnouncementStore.languages.unpublished}</span>);
        } else if (record.status === '已失效') {
          return (<span className="invalidSpan">{AnnouncementStore.languages.expired}</span>);
        }
      },
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.table.creationDate`],
      dataIndex: 'creationDate',
      key: 'creationDate',
      filters: [],
      sorter: true,
      sortOrder: columnKey === 'creationDate' && order,
      filteredValue: filters.creationDate || [],
      render: (text, record) => {
        if (record.creationDate) {
          return record.creationDate;
        } else {
          return '';
        }
      },
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.table.effectiveDate`],
      dataIndex: 'startTime',
      key: 'startTime',
      filters: [],
      sorter: true,
      sortOrder: columnKey === 'startTime' && order,
      filteredValue: filters.startTime || [],
      render: (text, record) => {
        if (record.isEdit) {
          return (
            <DatePicker
              style={{ width: 150 }}
              value={startValue}
              disabledDate={this.disabledStartDate}
            // label={AnnouncementStore.languages[ `${intlPrefix}.startTime`]}
              format="YYYY-MM-DD HH:mm:ss"
              showTime
              defaultValue={moment(record.startTime)}
            // placeholder={AnnouncementStore.languages[ `${intlPrefix}.startTime`]}
              onChange={this.onStartChange}
              onOpenChange={this.handleStartOpenChange}
              allowClear={false}
            />
          );
        } else if (record.startTime) {
          return record.startTime;
        } else {
          return '';
        }
      },
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.table.endTime`],
      dataIndex: 'endTime',
      key: 'endTime',
      filters: [],
      sorter: true,
      sortOrder: columnKey === 'endTime' && order,
      filteredValue: filters.endTime || [],
      render: (text, record) => {
        if (record.isEdit) {
          return (
            <DatePicker
              style={{ width: 150 }}
              value={endValue}
              disabledDate={this.disabledEndDate}
            // label={AnnouncementStore.languages[ `${intlPrefix}.startTime`]}
              format="YYYY-MM-DD HH:mm:ss"
              showTime
              defaultValue={record.endTime ? moment(record.endTime) : null}
            // placeholder={AnnouncementStore.languages[ `${intlPrefix}.startTime`]}
              onChange={this.onEndChange}
              onOpenChange={this.handleEndOpenChange}
              allowClear
            />
          );
        } else if (record.endTime) {
          return record.endTime;
        } else {
          return '';
        }
      },
    }, {
      title: AnnouncementStore.languages[`${intlPrefix}.table.action`],
      dataIndex: '',
      key: 'action',
      render: (text, record) => {
        if (record.isEdit) {
          return (
            <span>
              <Tooltip placement="top" title={AnnouncementStore.languages.save}>
                <Icon
                  type="yijieshu"
                  style={{ marginRight: 10, color: '#52C41A' }}
                  onClick={() => {
                    let startValue = this.state.startValue || '';
                    let endValue = this.state.endValue || '';
                    if (startValue) {
                      startValue = startValue.format('YYYY-MM-DD HH:mm:ss');
                    }
                    if (endValue) {
                      endValue = endValue.format('YYYY-MM-DD HH:mm:ss');
                    }
                    AnnouncementStore.updateAnnTime(organizationId, {
                      announcementId: record.announcementId,
                      startTime: startValue || record.startTime,
                      endTime: endValue || null,
                      objectVersionNumber: record.objectVersionNumber,
                    }).then(((data1) => {
                      this.setState(this.getInitState(), () => {
                        this.loadAnnouncement();
                      });
                    }));
                  }}
                />
              </Tooltip>
              <Tooltip placement="top" title={AnnouncementStore.languages.cancle}>
                <Icon
                  type="yizhongzhi"
                  style={{ color: '#B8BABF' }}
                  onClick={() => {
                    if (record.creationDate) {
                      record.isEdit = false;
                    } else {
                      dataSource.splice(dataSource.indexOf(record), 1);
                    }
                    this.setState({
                      dataSource,
                    });
                  }}
                />
              </Tooltip>
            </span>
          );
        } else {
          let actionDatas = [];
          if (record.status === '未发布') {
            actionDatas = [{
              service: ['yqcloud-portal-service.announcement.editAnnouncement'],
              type: 'site',
              icon: '',
              text: AnnouncementStore.languages.modify,
              action: this.handleEdit.bind(this, record),
            }, {
              service: ['yqcloud-portal-service.announcement.deleteAnUnenableAnnouncement'],
              type: 'site',
              icon: '',
              text: AnnouncementStore.languages.remove,
              action: this.handleDelete.bind(this, record),
            }];
          } else if (record.status === '已发布') {
            actionDatas = [{
              service: ['yqcloud-portal-service.announcement.editAnnouncement'],
              type: 'site',
              icon: '',
              text: AnnouncementStore.languages.updateTime,
              action: this.handleUpdate.bind(this, record),
            },
            {
              service: ['yqcloud-portal-service.announcement.editAnnouncement'],
              type: 'site',
              icon: '',
              text: AnnouncementStore.languages.invalid,
              action: this.handleAble.bind(this, record),
            }];
          }
          return <Action data={actionDatas} />;
        }
      },
    }];
    const mainContent = AnnouncementStore.getIsLoading ? <LoadingBar /> : (
      <div>
        <Table
          className="announcement-content-table"
          columns={columns}
          dataSource={dataSource}
          onChange={this.handlePageChange}
          pagination={pagination}
          filter={params}
          rowKey="announcementId"
          loading={AnnouncementStore.getIsLoading}
          filterBarPlaceholder={AnnouncementStore.languages.filtertable}
        />
      </div>
    );

    return (
      <Page
        service={[
          'yqcloud-portal-service.announcement.selectList',
          'yqcloud-portal-service.announcement.publishAnnouncement',
          'yqcloud-portal-service.announcement.selectDetail',
          'yqcloud-portal-service.announcement.deleteAnUnenableAnnouncement',
          'yqcloud-portal-service.announcement.editAnnouncement',
          'yqcloud-portal-service.announcement.addAnnouncement',
          'yqcloud-fnd-service.employee.query',
        ]}
      >
        <Header
          title={AnnouncementStore.languages[`${intlPrefix}.header.title`]}
        >
          <Button
            style={{ color: '#04173F' }}
            onClick={this.createLayout}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {AnnouncementStore.languages[`${intlPrefix}.add`]}
          </Button>
        </Header>
        <Content
          className="announcement-content"
        >
          <div>
            {mainContent}
          </div>
          {
            preview ? (
              <Modal
                title={AnnouncementStore.languages.announcement}
                visible={this.state.preview}
                okText={AnnouncementStore.languages.ok}
                cancelText={AnnouncementStore.languages.cancel}
                className="ann-modal"
                width="50%"
                footer={null}
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
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(AnnouncementHome)));
