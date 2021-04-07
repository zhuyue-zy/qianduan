/**
 * Created by Nanjiangqi on 2018-10-16 0026.
 */
import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Action, Content, Header, Page, Permission, axios } from 'yqcloud-front-boot';
import { Button, Icon, Modal, Table, Tooltip, Form, Input, Select } from 'yqcloud-ui';
import WorkflowStore from '../../../../stores/organization/approvalWorkflow';
import './index.scss';
import ModifyWorkflow from '../modifyWorkflow';
import MultiLanguageFormItem from '../../../../components/NewMultiLanguageFormItem';

const intlPrefix = 'organization.management';
const intlPrefixs = 'approval.workflow';
const FormItem = Form.Item;
const { Sidebar } = Modal;

@inject('AppState')
@observer
class WorkflowHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      dataSource: [],
      visible: false, // 新增模型弹框
      popup: false, // 查看审批工作流版本
      edit: false,
      submitting: false,
      selectedData: '',
      lookdata: '',
      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      sort: 'modelKey',
      WF_LC_STATUS: [], // 快码 工作流流程状态
      lookupMeaning: '',
      loading: false,
      // 存放多语言信息
      multiLanguageValue: {
        process_description: {},
        model_name: {},
      },
      multiLanguageList: [],
    };
  }

  componentWillMount() {
    this.loadCompanys();
    this.loadparentCompany();
    this.loadLanguage();
    this.handleOrganizationIdChange();
    this.applicationSystems();
    this.getLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    WorkflowStore.queryLanguage(id, AppState.currentLanguage);
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

  handleOrganizationIdChange = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const code = 'WF_CLASSIFY';
    WorkflowStore.loadClassify(organizationId, code);
  };

  // 应用系统
  applicationSystems=() => {
    const { AppState } =this.props;
    const { organizationId } = AppState.currentMenuType;
    const code = 'FND_APP_SYSTEM';
    WorkflowStore.loadSystem(organizationId, code);

  }

  /**
   * 加载流程设计列表
   * @param paginationIn 分页
   */
  loadCompanys = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState, WorkflowStore } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { organizationId } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    WorkflowStore.loadCompanys(
      organizationId,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      WorkflowStore.setCompanys(data.content);
      this.setState({
        dataSource: data.content,
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

  loadparentCompany = () => {
    const code = 'WF_LC_STATUS';
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    WorkflowStore.loadparentCompany(organizationId, code).then((data) => {
      this.setState({
        WF_LC_STATUS: data,
      });
    });
  };

  /**
   * 弹层
   */
  showModal = () => {
    this.setState({
      visible: true,
      edit: false,
    });
  };

  // 编辑工作流节点
  onEdit = (record) => {
    this.openNewPage(record);
  };

  // 修改
  onModify = (record) => {
    this.setState({
      visible: true,
      selectedData: record.companyId,
      edit: true,
    });
  };

  // 查看
  onLookover = (record) => {
    this.setState({
      lookdata: record.modelExtId,
      popup: true,
    });
  };

  // 编辑跳转页面
  openNewPage = (record) => {
    const { AppState } = this.props;
    const { organizationId, name, type, id: currentMenuTypeid } = AppState.currentMenuType;
    this.props.history.push(`/iam/approvalWorkflow${`/edit/${record.modelExtId}`}?type=${type}&id=${currentMenuTypeid}&name=${name}&organizationId=${organizationId}&applicationSystem=${record.applicationSystem}`);
  };

  // 删除
  handelete = (record) => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    WorkflowStore.deleteWorkflow(
      organizationId,
      record,
    ).then((data) => {
      if (data === 'workflow.process.col.delete') {
        Choerodon.prompt(WorkflowStore.languages[`${intlPrefixs}.delete.success`]);
        this.loadCompanys();
      } else {
        Choerodon.prompt(WorkflowStore.languages[`${intlPrefixs}.delete.error`]);
      }
    });
  };

  // 发布
  onRelease = (record) => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    WorkflowStore.releaseWorkflow(organizationId, record).then(({ failed }) => {
      if (failed) {
        // Choerodon.prompt(message);
      } else {
        Choerodon.prompt(WorkflowStore.languages[`${intlPrefixs}.publisher.success`]);
        this.loadCompanys();
      }
    }).catch((error) => {
      Choerodon.prompt(WorkflowStore.languages[`${intlPrefixs}.publisher.error`]);
    });
  };


  // 应用系统快码
  applicationSystemState=(values) => {
    const systemLists = WorkflowStore.getApplicationSystems;
    const temp = systemLists.filter(v => (v.lookupValue === values));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  // 启用失效
  handleAble = (record) => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { modelExtId } = record;
    if (record.isEnabled) {
      WorkflowStore.enableWorkflow(organizationId, modelExtId).then(({ failed, message }) => {
        if (failed) {
          // Choerodon.prompt(message);
        } else {
          Choerodon.prompt(WorkflowStore.languages['invalid.success']);
          this.loadCompanys();
        }
      }).catch((error) => {
        Choerodon.prompt(WorkflowStore.languages['invalid.error']);
      });
    } else {
      WorkflowStore.ableWorkflow(organizationId, modelExtId).then(({ failed, message }) => {
        if (failed) {
          // Choerodon.prompt(message);
        } else {
          Choerodon.prompt(WorkflowStore.languages['enable.success']);
          this.loadCompanys();
        }
      }).catch((error) => {
        Choerodon.prompt(WorkflowStore.languages['enabled.error']);
      });
    }
  };

  /**
   * 提交表单
   */
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err, data) => {
      if (!err) {
        this.setState({
          loading: true,
        });
        const { AppState, intl } = this.props;
        const { organizationId } = AppState.currentMenuType;
        const role = {
          __tls: this.state.multiLanguageValue,
          language: this.state.multiLanguageList,
          ...data,
        };
        WorkflowStore.createCompany(organizationId, role).then((datas) => {
          if (datas.failed) {
          } else {
            this.props.form.resetFields();
            this.setState({
              visible: false,
              loading: false,
              multiLanguageValue: {
                process_description: {},
                model_name: {},
              },
              multiLanguageList: [],
            });
            this.loadCompanys();
            Choerodon.prompt(WorkflowStore.languages['create.success']);
          }
        }).catch((error) => {
          Choerodon.handleResponseError(error);
        });
      }
    });
  };


  renderSeeSidebar = () => {
    const { popup, lookdata } = this.state;
    return (
      <ModifyWorkflow
        popup={popup}
        id={lookdata}
        onRef={(node) => {
          this.modifyWorkflow = node;
        }}
        OnUnchangedSuccess={() => {
          this.setState({
            popup: false,
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
            popup: false,
            submitting: false,
          });
          this.loadCompanys();
        }}
        onError={() => {
          this.setState({
            submitting: false,
          });
        }}
        OnCloseModel={() => {
          this.setState({
            popup: false,
            lookdata: '',
          });
          this.loadCompanys();
        }}
      />
    );
  };

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
    this.loadCompanys(pagination, sorter.join(','), filters, params);
  };

  workflowCancel=() => {
    this.props.form.resetFields();
    this.setState({
      visible: false,
    });
  }

  // 分类样式显示
  // 20190729 修改   由于传过来的不是快码，时间紧急，故只改了判断
  statusValues=(values) => {
    if (values === '草稿' || values === 'Draft') {
      return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#eee', fontSize: 12, padding: '3px 8px', textDecoration: 'none', backgroundColor: '#6354F4' }}>{values}</span>);
    } else if (values === '已发布' || values === 'Released') {
      return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#eee', fontSize: 12, padding: '3px 8px', textDecoration: 'none', backgroundColor: '#6CC846' }}>{values}</span>);
    } else if (values === '失效' || values === 'Invalid') {
      return (<span style={{ borderRadius: 2, fontFamily: 'Arial', color: '#eee', fontSize: 12, padding: '3px 8px', textDecoration: 'none', backgroundColor: '#8092C0' }}>{values}</span>);
    } else {
      return values;
    }
  }

  render() {
    const { intl, AppState, form } = this.props;
    const { submitting, visible, popup, edit, dataSource, params, filters, sort, pagination, loading } = this.state;
    const { getFieldDecorator } = form;

    const tableStyleDescription = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: 120,
      whiteSpace: 'nowrap',
    };
    const tableStylemodelName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: 120,
      whiteSpace: 'nowrap',
    };

    const organizations = WorkflowStore.getCompanyNameList;
    const systemList = WorkflowStore.getApplicationSystems;
    const sysList = [];
    const orgOption = [];
    const list  = systemList.slice(0, 2);
    list.forEach((items) => {
      sysList.push(<Option value={items.lookupValue}>{items.lookupMeaning}</Option>)
    })

    organizations && organizations.forEach((item) => {
      orgOption.push(<Option value={item.lookupValue}>{item.lookupMeaning}</Option>);
    });
    const ListColumns = [
      {
        title: WorkflowStore.languages[`${intlPrefixs}.process.coding`],
        dataIndex: 'modelKey',
        key: 'modelKey',
        width: 100,
        filters: [],
        filteredValue: filters.modelKey || [],
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.process.name`],
        dataIndex: 'modelName',
        key: 'modelName',
        width: 120,
        filters: [],
        filteredValue: filters.modelName || [],
        render: (values, record) => (
          <span style={tableStylemodelName}>
            <Tooltip title={values} lines={20}>
              <div style={{ textAlign: 'left' }}>{values}</div>
            </Tooltip>
          </span>
        ),
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.process.description`],
        dataIndex: 'processDescription',
        key: 'processDescription',
        width: 120,
        filters: [],
        render: (values, record) => (
          <span style={tableStyleDescription}>
            <Tooltip title={values} lines={20}>
              <div style={{ textAlign: 'left' }}>{values }</div>
            </Tooltip>
          </span>
        ),
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.applicationSystem`],
        dataIndex: 'applicationSystem',
        key: 'applicationSystem',
        width: 120,
        filters: [],
        render: (values, record) => this.applicationSystemState(record.applicationSystem),
      },
      {

        title: WorkflowStore.languages[`${intlPrefixs}.state`],
        dataIndex: 'statusValue',
        key: 'statusValue',
        width: 100,
        filters: [
          {
            text: WorkflowStore.languages[`${intlPrefixs}.draft`],
            value: '草稿',
          },
          {
            text: WorkflowStore.languages[`${intlPrefixs}.released`],
            value: '已发布',
          },
          {
            text: WorkflowStore.languages[`${intlPrefixs}.invalid`],
            value: '失效',
          },
        ],
        render: (values, record) => this.statusValues(record.statusValue),
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.classification`],
        dataIndex: 'categoryName',
        key: 'categoryName',
        width: 150,
        filters: [{
          text: WorkflowStore.languages[`${intlPrefixs}.uploadDocumnet`],
          value: '上传文件',
        },
        {
          text: WorkflowStore.languages[`${intlPrefixs}.dataModify`],
          value: '数据修改',
        },
        {
          text: WorkflowStore.languages[`${intlPrefixs}.processApproval`],
          value: '流程审批',
        },
        ],
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.creator`],
        dataIndex: 'createPerson',
        key: 'createPerson',
        width: 160,
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.creation.time`],
        dataIndex: 'creationDate',
        key: 'creationDate',
        width: 160,
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.renewing`],
        code: 'updatePerson',
        dataIndex: 'updatePerson',
        key: 'updatePerson',
        hidden: true,
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.update.time`],
        code: 'lastUpdateDate',
        dataIndex: 'lastUpdateDate',
        key: 'lastUpdateDate',
        hidden: true,
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.release.time`],
        dataIndex: 'deployDate',
        key: 'deployDate',
      },
      {
        title: WorkflowStore.languages[`${intlPrefixs}.version.information`],
        width: 70,
        fixed: 'right',
        render: record => (
          <a onClick={this.onLookover.bind(this, record)}>
            {WorkflowStore.languages[`${intlPrefixs}.see`]}
          </a>
        ),
      },
      {
        title: WorkflowStore.languages.operation,
        key: 'action',
        fixed: 'right',
        width: 110,
        render: (text, record) => (
          <div>
            {record.isEnabled === false ? (
              <Permission
                service={['yqcloud-workflow-service.model-ext.getCode']}
              >
                <Tooltip
                  title={WorkflowStore.languages.modify}
                  placement="bottom"
                >
                  <Button
                    size="small"
                    icon="bianji-"
                    shape="circle"
                    disabled
                  />
                </Tooltip>
              </Permission>
            ) : (
              <Permission
                service={['yqcloud-workflow-service.model-ext.getCode']}
              >
                <Tooltip
                  title={WorkflowStore.languages.edit}
                  placement="bottom"
                >
                  <Button
                    size="small"
                    icon="bianji-"
                    shape="circle"
                    style={{ color: '#2196F3' }}
                    onClick={this.onEdit.bind(this, record)}
                  />
                </Tooltip>
              </Permission>
            )}
            {record.isDeployed === true ? (
              <Permission
                service={['yqcloud-workflow-service.model-ext.enableModel']}
              >
                <Tooltip
                  placement="bottom"
                >
                  <Button icon="hebingxingzhuangx1" shape="circle" disabled />
                </Tooltip>
              </Permission>
            ) : (
              <Permission
                service={['yqcloud-workflow-service.model-ext.enableModel']}
              >
                <Tooltip
                  title={WorkflowStore.languages[`${intlPrefixs}.release`]}
                  placement="bottom"
                >
                  <Button
                    icon="hebingxingzhuangx1"
                    shape="circle"
                    style={{ color: '#2196F3' }}
                    onClick={this.onRelease.bind(this, record)}
                  />
                </Tooltip>
              </Permission>
            )}
            {record.status === 'Released' && (
              <Permission
                service={['yqcloud-workflow-service.model-ext.invalidModel']}
              >
                <Tooltip
                  title={WorkflowStore.languages.disable}
                  placement="bottom"
                >
                  <Button
                    icon="jinyongzhuangtai"
                    shape="circle"
                    size="small"
                    onClick={this.handleAble.bind(this, record)}
                  />
                </Tooltip>
              </Permission>
            )}
            {record.status === 'Invalid' && (
              <Permission
                service={['yqcloud-workflow-service.model-ext.enableModel']}
              >
                <Tooltip
                  title={WorkflowStore.languages.enable}
                  placement="bottom"
                >
                  <Button
                    icon="yijieshu"
                    shape="circle"
                    size="small"
                    style={{ color: '#2196F3' }}
                    onClick={this.handleAble.bind(this, record)}
                  />
                </Tooltip>
              </Permission>
            )}
          </div>
        ),
      },
      {
        title: '',
        width: 50,
        fixed: 'right',
        render: (text, record) => {
          const actionDatas = [];
          if (!record.deployDate) {
            actionDatas.push({
              service: ['yqcloud-workflow-service.model-ext.update'],
              icon: '',
              type: 'site',
              text: WorkflowStore.languages.delete,
              action: this.handelete.bind(this, record),
            });
          } else {

          }
          return <Action data={actionDatas} />;
        },
      },
    ];
    const footerOptions = (
      <div>
        <Button
          type="primary"
          funcType="raised"
          onClick={e => this.modifyWorkflow.handleSubmit(e)}
        >
          {WorkflowStore.languages.return}
        </Button>
      </div>
    );
    return (
      <Page>
        <Header title={WorkflowStore.languages[`${intlPrefixs}.approval.workflow`]}>
          <Button
            onClick={() => this.showModal()}
            style={{ color: '#000000' }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {WorkflowStore.languages[`${intlPrefixs}.newly.build`]}
          </Button>
        </Header>
        <Content>
          <Table
            className="table-nowrap"
            size="middle"
            columns={ListColumns}
            pagination={pagination}
            rowKey="companyCode"
            dataSource={dataSource}
            onChange={this.handlePageChange.bind(this)}
            scroll={{ x: 1500 }}
            loading={WorkflowStore.isLoading}
          />
          <Sidebar
            title={WorkflowStore.languages[`${intlPrefixs}.approval.workflow.version.view`]}
            visible={popup}
            footer={footerOptions}
            confirmLoading={submitting}
          >
            {
                this.renderSeeSidebar()
              }
          </Sidebar>
          <Modal
            visible={visible}
            title={WorkflowStore.languages[`${intlPrefixs}.new.model`]}
            className="workflow-content"
            onCancel={this.workflowCancel}
            footer={[<Button
              onClick={this.handleSubmit}
              style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
              type="primary"
              funcType="raised"
              loading={loading}
            >
              {WorkflowStore.languages.ok}
            </Button>,
              <Button
                onClick={this.workflowCancel}
                funcType="raised"
                style={{ marginRight: '20px' }}
              >
                {WorkflowStore.languages.cancle}
              </Button>]}
            center
          >
            <Form>
              <FormItem style={{ display: 'inline-block', marginTop: 20, marginLeft: 15 }}>
                {getFieldDecorator('modelName', {
                  rules: [
                    {
                      required: true,
                      whitespace: true,
                      message: WorkflowStore.languages[`${intlPrefixs}.enter.process.name`],
                    },
                    {
                      pattern: /^[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5]*$/,
                      message: WorkflowStore.languages[`${intlPrefixs}.chinese.characters`],
                    },
                  ],
                  validateTrigger: 'onBlur',
                  initialValue: '',
                  validateFirst: true,
                })(
                  <MultiLanguageFormItem
                    label={WorkflowStore.languages[`${intlPrefixs}.process.name`]}
                    requestUrl="true"
                    requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.model_name : {}}
                    handleMultiLanguageValue={({ retObj, retList }) => {
                      // 将多语言的值设置到当前表单
                      this.props.form.setFieldsValue({
                        modelName: retObj[this.props.AppState.currentLanguage],
                      });
                      this.setState({
                        multiLanguageValue: {
                          ...this.state.multiLanguageValue,
                          model_name: retObj,
                        },
                        multiLanguageList: retList,
                      });
                    }}
                    maxLength={30}
                    type="FormItem"
                    FormLanguage={this.state.multiLanguageValue}
                    languageEnv={this.state.languageEnv}
                    descriptionObject={WorkflowStore.languages.multiLanguage}
                    required="true"
                    inputWidth={400}
                  />,
                )}
              </FormItem>
              <FormItem style={{ display: 'inline-block', marginLeft: 15 }}>
                {getFieldDecorator('processDescription', {
                  validateTrigger: 'onBlur',
                  initialValue: '',
                  validateFirst: true,
                })(
                  <MultiLanguageFormItem
                    label={WorkflowStore.languages[`${intlPrefixs}.process.description`]}
                    requestUrl="true"
                    requestData={this.state.multiLanguageValue ? this.state.multiLanguageValue.process_description : {}}
                    handleMultiLanguageValue={({ retObj, retList }) => {
                      // 将多语言的值设置到当前表单
                      this.props.form.setFieldsValue({
                        processDescription: retObj[this.props.AppState.currentLanguage],
                      });
                      this.setState({
                        multiLanguageValue: {
                          ...this.state.multiLanguageValue,
                          process_description: retObj,
                        },
                        multiLanguageList: retList,
                      });
                    }}
                    maxLength={50}
                    type="FormItem"
                    FormLanguage={this.state.multiLanguageValue}
                    languageEnv={this.state.languageEnv}
                    descriptionObject={WorkflowStore.languages.multiLanguage}
                    required="true"
                    inputWidth={400}
                  />,
                )}
              </FormItem>

              <FormItem style={{ display: 'inline-block', marginLeft: 15 }}>
                {getFieldDecorator('modelCategory', {
                  rules: [
                    {
                      required: true,
                      message: WorkflowStore.languages[`${intlPrefixs}.choose.classification`],
                    },
                  ],
                  initialValue: '',
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    label={WorkflowStore.languages[`${intlPrefixs}.classification`]}
                    style={{ width: 400 }}
                    onChange={this.handleOrganizationIdChange}
                    allowClear
                  >
                    {orgOption}
                  </Select>,
                )}
              </FormItem>
              <FormItem style={{ display: 'inline-block', marginLeft: 15 }}>
                {getFieldDecorator('applicationSystem', {
                  rules: [
                    {
                      required: true,
                      message: WorkflowStore.languages[`${intlPrefixs}.choose.applicationSystem`],
                    },
                  ],
                  initialValue: '',
                })(
                  <Select
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    label={WorkflowStore.languages[`${intlPrefixs}.applicationSystem`]}
                    style={{ width: 400 }}
                    onChange={this.applicationSystems}
                    allowClear
                  >
                    {sysList}
                  </Select>,
                )}
              </FormItem>

            </Form>
          </Modal>
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(WorkflowHome)));
