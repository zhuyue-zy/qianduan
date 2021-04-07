/** 2019/5/23
*作者:高梦龙
*项目： API配置管理
*/

import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content } from 'yqcloud-front-boot';
import { message, Button, Table, Modal, Tooltip, Icon, Card, Input, Tag } from 'yqcloud-ui';
import FileSaver from 'file-saver';
import ApiConfigurationStore from '../../../../stores/organization/apiConfiguration/ApiConfigurationStore';
import './APIStyle.scss';
import APIEdit from '../APIConfigurationEdit';


const { Sidebar } = Modal;
const intlPrefix = 'organization.apiConfiguration';

@inject('AppState')
@observer
class APIHome extends React.Component {
  state = this.getInitState();

  getInitState() {
    return {
      dataSource: [],
      dataKey: [], // 暂时存储accssKey数据
      dataAccess: [],
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      params: [],
      filters: {},
      createVisible: false,
      deleteVisible: false,
      disabledVisible: false,
      checkVisible: false,
      selectedRowKeys: [],
      selectedCodeValues: [],
      visible: false,
      submitting: false,
      code: '',
      bgColor: '',
      checkCode: '',
      sort: '',
      id: '',
      clientIds: '',
      records: {},
      loading: false,
      status: true,
    };
  }

  componentWillMount() {
    this.loadLanguage();
    this.fetch(this.props);
  }

  componentDidMount() {
    this.loadApiHome();
    this.createCode();
    this.initOrganization();
  }


  fetch() {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    ApiConfigurationStore.getIsEnabled(id);
  }

  // 初始化组织状态
  initOrganization=() => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    ApiConfigurationStore.initOragan(id).then((datas) => {
      this.setState({
        status: datas,
      });
    });
  }


  // 验证码
  createCode=() => {
    const codeLength = 4;
    let count = '';
    let color = '';
    const random = new Array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z');
    // 循环codeLength 我设置的4就是循环4次
    for (let i = 0; i < codeLength; i++) {
      // 设置随机数范围,这设置为0 ~ 36
      const index = Math.floor(Math.random() * 36);
      count += random[index];
    }
    const colorRandom = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple', 'pink', 'copper', 'lightskyblue', 'thistle'];
    const indexs = Math.floor(Math.random() * 11);
    color = colorRandom[indexs];
    this.setState({
      code: count,
      bgColor: color,
    });
  }

  loadLanguage=() => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    ApiConfigurationStore.queryLanguage(id, AppState.currentLanguage);
  }

  loadApiHome=(paginationIn, sortIn, filtersIn, paramsIn) => {
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    ApiConfigurationStore.loadApiConfiguration(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      this.setState({
        pagination: {
          current: (data.number || 0) + 1,
          pageSize: data.size || 25,
          total: data.totalElements || '',
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        filters,
        params,
        sort,
        dataSource: data.content,
      });
    });
  }


  // 失效accesskey
  disabledAccess=(record) => {
    this.setState({
      disabledVisible: true,
      id: record.id,
      clientIds: record.clientId,
    });
  }

  // 确定失效
  disabledOk=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { id } = this.state;
    ApiConfigurationStore.disableAccess(organizationId, id).then((data) => {
      if (data) {
        this.setState({
          disabledVisible: false,
        });
        Choerodon.prompt(ApiConfigurationStore.languages['disable.success']);
        this.loadApiHome();
      }
    });
  }

  disabledCancel=() => {
    this.setState({
      disabledVisible: false,
    });
  }

  // 生效accesskey
  enabledKey=(id) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    ApiConfigurationStore.enabledAccess(organizationId, id).then((data) => {
      if (data) {
        Choerodon.prompt(ApiConfigurationStore.languages['enable.success']);
        this.loadApiHome();
      }
    });
  }

  renderSideBar() {
    const { visible, records } = this.state;
    return (
      <APIEdit
        visible={visible}
        records={records}

        onRef={(node) => {
          this.apiEdit = node;
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
          // this.loadValue();
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


  // 状态快码
  enabledState = (values) => {
    const enabled = ApiConfigurationStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }


  handlePageChange(pagination, filters, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadApiHome(pagination, sorter.join(','), filters, params);
  }


  cancleApiModal =() => {
    this.setState({
      createVisible: false,
      selectedRowKeys: [],
      dataAccess: [],
    });
  }


  deleteAccess=(record) => {
    this.setState({
      id: record.id,
      clientIds: record.clientId,
      deleteVisible: true,
    });
  }

  deleteOk=() => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { id } = this.state;
    ApiConfigurationStore.deleteKey(organizationId, id).then(({ failed }) => {
      if (failed) {} else {
        this.setState({
          deleteVisible: false,
        });
        Choerodon.prompt(ApiConfigurationStore.languages['delete.success']);
        this.loadApiHome();
      }
    });
  }

  cancelDeleteModal=() => {
    this.setState({
      deleteVisible: false,
    });
  }

  // 验证码提示框
  checkModal=() => {
    this.createCode();
    this.setState({
      checkVisible: true,
    });
  }

  cancelCheck=() => {
    this.setState({
      checkVisible: false,
      checkCode: '',
      loading: false,
    });
  }

  // 修改按钮
  onEdit = (record) => {
    this.setState({
      visible: true,
      records: record,
      ApiId: record.clientId,
      secret: record.secret,
      description: record.description,

    });
  };


  // 点击批量导出数据生成csv文件
  exportList=() => {
    const { AppState } = this.props;
    const { name } = AppState.menuType;
    const { dataAccess } = this.state;
    const date = new Date();
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let strDate = date.getDate();
    if (month >= 1 && month <= 9) {
      month = `0${month}`;
    }
    if (strDate >= 0 && strDate <= 9) {
      strDate = `0${strDate}`;
    }
    const currentdate = year + month + strDate;

    // 定义数据拼接
    // str:table的每一列的标题，即为导出后的csv文件的每一列的标题
    let str = '';
    str
      += 'AccessKey ID' + ','
      + 'AccessKey Secret';
    // 通过循环拿出data数据源里的数据，并塞到str中
    for (const i in dataAccess) {
      // 如果是第一行,不换行
      str += `\n${ 
        dataAccess[i].clientId},${ 
        dataAccess[i].secret}`;
    }
    // Excel打开后中文乱码添加如下字符串解决
    const exportContent = '\uFEFF';
    const blob = new Blob([exportContent + str], {
      type: 'text/plain;charset=utf-8',
    });
    // 根据数据生成生成文件
    FileSaver.saveAs(blob, `AK_${name}_${currentdate}.csv`);

      this.setState({
        createVisible: false,
        dataAccess: [],
      });

  }


  checkOk=() => {
    const { code, checkCode, dataKey } = this.state;
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    if (checkCode) {
      const oValue = checkCode.toLocaleUpperCase();
      if (oValue === code) {
        this.setState({
          loading: true,
          dataKey: [],
        });
        ApiConfigurationStore.createKey(id).then((data) => {
          if (data) {
            dataKey.push(data);
            this.setState({
              dataAccess: dataKey,
              createVisible: true,
              checkVisible: false,
              loading: false,
              checkCode: '',
            });
            this.loadApiHome();
          }
        });
      } else {
        Choerodon.prompt(ApiConfigurationStore.languages[`${intlPrefix}.verification.wrong`]);
      }
    } else {
      Choerodon.prompt(ApiConfigurationStore.languages[`${intlPrefix}.verification`]);
    }
  }

  onChanges=(e) => {
    this.setState({
      checkCode: e.target.value,
    });
  }

  render() {
    const { pagination, createVisible, visible, submitting, loading, status,
      dataSource, dataAccess, disabledVisible, checkVisible, deleteVisible, clientIds, bgColor } = this.state;
    const enabled = ApiConfigurationStore.getEnabled;
    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '120px',
      wordBreak: 'normal',
    };
    const apiColumns = [
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.AccessKeyID`],
        dataIndex: 'clientId',
        key: 'clientId',
        filters: [],
        render: (text, record) => (
          !status
            ? (<span>{text}</span>)
            : (<span style={{ color: '#2196F3', cursor: 'pointer' }} onClick={this.onEdit.bind(this, record)}>{text}</span>)),
      },

      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.AccessKeySecret`],
        dataIndex: 'secret',
        key: 'secret',
      },
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.description`],
        dataIndex: 'description',
        key: 'description',
        filters: [],
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={20}>
              {`${record.description}` === 'null' ? '' : `${record.description}` }
            </Tooltip>
          </span>
        ),
      },

      {
        title: ApiConfigurationStore.languages.status,
        dataIndex: 'enabled',
        key: 'enabled',
        filters: [{
          text: ApiConfigurationStore.languages.enable,
          value: 'true',
        }, {
          text: ApiConfigurationStore.languages.disable,
          value: 'false',
        }],
        sorter: true,
        render: (values, record) => this.enabledState(record.enabled),
      },
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.createTime`],
        dataIndex: 'startDate',
        key: 'startDate',
      },
      {
        title: ApiConfigurationStore.languages.operation,
        key: 'action',
        render: (operation, record) => {
          const style = {
            cursor: 'pointer',
          };
          return (
            <div>
              {
                record.enabled ? (
                  <Tooltip placement="bottom" title={ApiConfigurationStore.languages.disable}>
                    <Button
                      icon="jinyongzhuangtai"
                      style={style}
                      size="small"
                      shape="circle"
                      disabled={!status}
                      onClick={this.disabledAccess.bind(this, record)}
                    />
                  </Tooltip>
                )
                  : (
                    <Tooltip placement="bottom" title={ApiConfigurationStore.languages.enable}>
                      <Button
                        key="disable"
                        size="small"
                        icon="yijieshu"
                        shape="circle"
                        disabled={!status}
                        style={{ cursor: 'pointer', color: '#2196F3' }}
                        onClick={this.enabledKey.bind(this, record.id)}
                      />
                    </Tooltip>
                  )
              }

              <Tooltip placement="bottom" title={ApiConfigurationStore.languages.delete}>
                <Button
                  key="delete"
                  icon="shanchu-icon"
                  style={style}
                  size="small"
                  disabled={!status ? 'disabled' : record.status ? 'disabled' : ''}
                  onClick={this.deleteAccess.bind(this, record)}
                />
              </Tooltip>
            </div>);
        },
      },

    ];


    const newColumns = [
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.AccessKeyID`],
        dataIndex: 'clientId',
        key: 'clientId',
        filters: [],
        render: text => (
          <span style={{ color: '#2196F3' }}>{text}</span>
        ),
      },
      {
        title: ApiConfigurationStore.languages[`${intlPrefix}.AccessKeySecret`],
        dataIndex: 'secret',
        key: 'secret',
        filters: [],
      },
    ];


    const rowSelection = {
      //  选择记录后，将选中的记录加入selectedCodeValue状态中
      onChange: (selectedRowKeys, selectedCodeValues) => {
        this.setState({ selectedCodeValues, selectedRowKeys });
      },
      selectedRowKeys: this.state.selectedRowKeys,
    };

    return (
      <Page>
        <Header title={ApiConfigurationStore.languages[`${intlPrefix}.apiConfiguration.management`]}>
          <Button
            onClick={() => this.checkModal()}
            style={{ color: !status ? '' : '#000000' }}
            disabled={!status}
          >
            <Icon type="xinjian" style={{ color: !status ? '' : '#2196F3', width: 25 }} />
            {ApiConfigurationStore.languages[`${intlPrefix}.new.accessKey`]}
          </Button>
        </Header>
        <Content>
          <div style={{ color: '#FF9933', fontSize: 14, background: 'beige', marginBottom: 10 }}>{ApiConfigurationStore.languages[`${intlPrefix}.notes`]}</div>
          <Table
            columns={apiColumns}
            pagination={pagination}
            dataSource={dataSource}
            onChange={this.handlePageChange.bind(this)}
            loading={ApiConfigurationStore.isLoading}
          />
        </Content>
        <Modal
          title={ApiConfigurationStore.languages[`${intlPrefix}.newUser.accessKey`]}
          visible={createVisible}
          onCancel={this.cancleApiModal}
          className="api-content"
          footer={[
            <Button
              onClick={this.exportList}
              style={{ backgroundColor: '#2196f3', borderRadius: 5, marginRight: 20 }}
              type="primary"
              funcType="raised"
            >
              {ApiConfigurationStore.languages[`${intlPrefix}.saveKey`]}
            </Button>,
          ]}
          center
        >
          <div style={{ color: '#009966', fontSize: 14, background: 'azure', marginBottom: 20, marginTop: 20 }}>{ApiConfigurationStore.languages[`${intlPrefix}.newUser.notes`]}</div>
          <Card style={{ fontSize: 16, width: 350 }} bordered={false}><Icon type="yijieshu" style={{ color: '#1afa29', width: 30 }} width="100em" height="100em" />{ApiConfigurationStore.languages[`${intlPrefix}.new.accessKey.success`]}</Card>
          <Table
            columns={newColumns}
            dataSource={dataAccess}
            filterBar={false}
            pagination={false}
          />
        </Modal>
        <Modal
          title={ApiConfigurationStore.languages[`${intlPrefix}.caveat`]}
          className="api-content"
          visible={disabledVisible}
          onCancel={this.disabledCancel}
          footer={[
            <Button
              onClick={this.disabledOk}
              style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
              type="primary"
              funcType="raised"
              onC
            >
              {ApiConfigurationStore.languages.ok}
            </Button>,
            <Button
              onClick={this.disabledCancel}
              style={{ marginRight: '15px' }}
              funcType="raised"
            >
              {ApiConfigurationStore.languages.cancel}
            </Button>,
          ]}
        >
          <p style={{ fontSize: 14, margin: 14 }}><Icon type="shurutixing" style={{ color: '#f37f0b', marginRight: 5 }} />{`${ApiConfigurationStore.languages[`${intlPrefix}.disabledKey`]}${clientIds}?`}</p>
        </Modal>
        <Modal
          title={ApiConfigurationStore.languages[`${intlPrefix}.caveat`]}
          className="api-content"
          visible={deleteVisible}
          onCancel={this.cancelDeleteModal}
          footer={[
            <Button
              onClick={this.deleteOk}
              style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
              type="primary"
              funcType="raised"
              onC
            >
              {ApiConfigurationStore.languages.ok}
            </Button>,
            <Button
              onClick={this.cancelDeleteModal}
              style={{ marginRight: '15px' }}
              funcType="raised"
            >
              {ApiConfigurationStore.languages.cancel}
            </Button>,
          ]}
        >
          <p style={{ fontSize: 14, margin: 14, width: 500 }}><Icon type="shurutixing" style={{ color: '#f37f0b', marginRight: 5 }} />{`${ApiConfigurationStore.languages[`${intlPrefix}.deletekey`]}${clientIds}?`}</p>
        </Modal>

        <Modal
          title={ApiConfigurationStore.languages[`${intlPrefix}.verification.code`]}
          visible={checkVisible}
          onCancel={this.cancelCheck}
          className="api-content"
          destroyOnClose
          footer={[
            <Button
              onClick={this.checkOk}
              style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
              type="primary"
              funcType="raised"
              loading={loading}
            >
              {ApiConfigurationStore.languages.ok}
            </Button>,
            <Button
              onClick={this.cancelCheck}
              style={{ marginRight: '15px' }}
              funcType="raised"
            >
              {ApiConfigurationStore.languages.cancel}
            </Button>,
          ]}
        >
          <div style={{ margin: 25, marginLeft: 75 }}>
            <Input style={{ width: 200, marginRight: 30 }} value={this.state.checkCode} onChange={this.onChanges} placeholder={ApiConfigurationStore.languages[`${intlPrefix}.verification`]} />
            <Tag className="tag-color" color={`${bgColor}`} onClick={this.createCode} style={{ width: 90, height: 30, fontSize: 20, paddingLeft: 20, paddingTop: 4 }}>{this.state.code}</Tag>
          </div>
        </Modal>

        <Sidebar
          title={ApiConfigurationStore.languages[`${intlPrefix}.assign.apiPermissions`]}
          visible={visible}
          okText={ApiConfigurationStore.languages.save}
          cancelText={ApiConfigurationStore.languages.cancel}
          onOk={e => this.apiEdit.handleSubmit(e)}
          onCancel={(e) => {
            this.apiEdit.handleCancel(e);
          }}
          confirmLoading={submitting}
        >
          {
            this.renderSideBar()
          }
        </Sidebar>

      </Page>
    );
  }
}

export default withRouter(injectIntl(APIHome));
