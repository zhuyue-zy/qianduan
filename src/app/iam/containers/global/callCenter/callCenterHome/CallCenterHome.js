import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content } from 'yqcloud-front-boot';
import { message, Button, Table, Modal, Tooltip, Icon } from 'yqcloud-ui';
import CallCenterStore from '../../../../stores/globalStores/callCenter/CallCenterStore';
import './CallCenterStyle.scss';
import CallCenterEdit from "../../../global/callCenter/callCenterEdit/CallCenterEdit";

const intlPrefix = 'organization.callCenter';
const { Sidebar } = Modal;

@inject('AppState')
@observer
class CallCenterHome extends Component{
  state = this.getInitState();

  getInitState() {
    return{
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      visible: false,
      submitting: false,
      edit: false,
      isLoading: true,
      Id: '',
      nickname: '',
      sort: 'isEnabled,desc'
    }
  }

  componentWillMount() {
    this.fetch(this.props);
  }

  componentDidMount() {
    this.loadLanguage();
    this.queryInfo();
  }

  fetch() {
    CallCenterStore.getIsEnabled();
  }


  loadLanguage=() => {
    const { AppState } = this.props;
    CallCenterStore.queryLanguage(0, AppState.currentLanguage);
  }

  handleKeyUp = (e) => {
    const { pagination } = this.state;
    if (e.keyCode === 13) {
     this.queryInfo(pagination);
    }
  };

  // 查询分页信息
  queryInfo=(paginationIn) => {
    const { pagination: paginationState, nickname, sort } = this.state;
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const filters = nickname;
    CallCenterStore.queryCallCenterPage(
      id,
      pagination,
      sort,
      filters,
    ).then((data) => {
      if (data.success) {
        this.setState({
          pagination: {
            current: (data.result.number || 0) + 1,
            pageSize: data.result.size || 25,
            total: data.result.totalElements || '',
            pageSizeOptions: ['25', '50', '100', '200'],
          },
          filters,
          dataSource: data.result.content,
        });
      }
    });
  }

  renderSideBar() {
    const {Id, edit, visible} = this.state;
    return (
      <CallCenterEdit
        id={Id}
        visible={visible}
        edit={edit}

        onRef={(node) => {
          this.editValue = node;
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
          this.queryInfo();
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

  handlePageChange(pagination, filters, {field, order}, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.queryInfo(pagination, sorter.join(','), filters, params);
  }

  /**
   * 呼叫中心标题
   * @returns {*}
   */
  renderSideTitle() {
    if (this.state.edit) {
      return CallCenterStore.languages[`${intlPrefix}.editCallCenter`];
    } else {
      return CallCenterStore.languages[`${intlPrefix}.createCallCenter`];
    }
  }

  openNewPage = () => {
    this.setState({
      visible: true,
      edit: false,
    });
  };

  // 修改按钮
  onEdit = (id) => {
    this.setState({
      visible: true,
      edit: true,
      Id: id,

    });
  };

  // 生效快码
  enabledState = (values) => {
    const enabled = CallCenterStore.getEnabled;
    const temp = enabled.filter(v => (v.lookupValue === `${values}`));
    if (temp.length > 0) {
      return temp[0].lookupMeaning;
    } else {
      return `${values}`;
    }
  }

  handleAble = (record) => {
    const body = {
      id: record.id,
      enabled: !record.enabled
    }
    CallCenterStore.handleEdit(body).then((data) => {
      if (data.success) {
          this.queryInfo();
        }
    })
  }

  render() {
    const { pagination, visible, dataSource, edit, submitting  } =this.state;
    const enabled = CallCenterStore.getEnabled;
    const tableStyleName = {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 1,
      WebkitBoxOrient: 'vertical',
      width: '100px',
    };
    const column = [
      {
        title: CallCenterStore.languages[`${intlPrefix}.tenantCode`],
        dataIndex: 'code',
        key: 'code',
        width: 120
      },
      {
        title: CallCenterStore.languages[`${intlPrefix}.tenantName`],
        dataIndex: 'name',
        key: 'name',
        width: 150
      },
      {
        title: CallCenterStore.languages[`${intlPrefix}.socket`],
        dataIndex: 'websocketAddress',
        key: 'websocketAddress',
        width: 100,
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={20}>
              <div style={{ textAlign: 'left' }}>{`${record.websocketAddress}` === 'null' ? '' : `${record.websocketAddress}` }</div>
            </Tooltip>
          </span>
        ),
      },
      {
        title: CallCenterStore.languages[`${intlPrefix}.domainName`],
        dataIndex: 'apiAddress',
        key: 'apiAddress',
        width: 100,
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={20}>
              <div style={{ textAlign: 'left' }}>{`${record.apiAddress}` === 'null' ? '' : `${record.apiAddress}` }</div>
            </Tooltip>
          </span>
        ),
      },
      {
        title: CallCenterStore.languages[`${intlPrefix}.key`],
        dataIndex: 'accessKey',
        key: 'accessKey',
        width: 100,
        render: (values, record) => (
          <span style={tableStyleName}>
            <Tooltip title={values} lines={20}>
              <div style={{ textAlign: 'left' }}>{`${record.accessKey}` === 'null' ? '' : `${record.accessKey}` }</div>
            </Tooltip>
          </span>
        ),
      },
      {
        title: CallCenterStore.languages.status,
        dataIndex: 'enabled',
        key: 'enabled',
        width: 90,
        render: (values, record) => this.enabledState(record.enabled),
      },
      {
        title: CallCenterStore.languages['publictime'],
        dataIndex: 'creationDate',
        key: 'creationDate',
        width: 150
      },
      {
        title: CallCenterStore.languages['updateTime'],
        dataIndex: 'lastUpdateDate',
        key: 'lastUpdateDate',
        width: 150
      },
      {
        title: CallCenterStore.languages.operation,
        dataIndex: 'option',
        key: 'option',
        width: 130,
        render:(text, record) =>{
          const style = {
            cursor: 'pointer',
          };
          return (
            <div>
              <Tooltip
                title={CallCenterStore.languages["modify"]}
                placement="bottom"
              >
                <Button
                  size="small"
                  icon="bianji-"
                  shape="circle"
                  style={{ cursor: 'pointer', color: record.enabled ? '#2196F3' : '' }}
                  onClick={this.onEdit.bind(this, record.id)}
                  disabled={!record.enabled}
                />
              </Tooltip>
              {record.enabled ? (
                    <Tooltip placement="bottom" title={CallCenterStore.languages.disable}>
                      <Button
                        key="enable"
                        icon="jinyongzhuangtai"
                        style={style}
                        size="small"
                        shape="circle"
                        onClick={this.handleAble.bind(this, record)}
                      />
                    </Tooltip>
                  )
                  : (
                    <Tooltip placement="bottom" title={CallCenterStore.languages.enable}>
                      <Button
                        key="disable"
                        size="small"
                        shape="circle"
                        icon="yijieshu"
                        style={{ cursor: 'pointer', color: '#2196F3' }}
                        onClick={this.handleAble.bind(this, record)}
                      />
                    </Tooltip>
                  )
              }
            </div>);
        }
      },
    ]

    return(
      <Page>
        <Header title={CallCenterStore.languages[`${intlPrefix}.callCenterManagement`]} />
        <Content>
          <div className="callCenter-header">
            <span className="callCenter-header-searchbox">
              <i className="icon icon-sousuo" />
              <input
                className="callCenter-header-searchbox-input"
                placeholder={CallCenterStore.languages[`${intlPrefix}.search.more`]}
                onChange={(e) => {
                  this.setState({
                    nickname: e.target.value,
                  });
                }}
                onKeyUp={e => this.handleKeyUp(e)}
              />
            </span>
            <span style={{ float: 'right' }}>
              <Button
                type="primary"
                style={{ color: '#ffffff', background: '#2196F3', borderRadius: 4, marginRight: 15, fontSize: 14 }}
                onClick={this.openNewPage}
              >
                {CallCenterStore.languages.create}
              </Button>
            </span>
          </div>
          <Table
            dataSource={dataSource}
            columns={column}
            pagination={pagination}
            filterBar={false}
            onChange={this.handlePageChange.bind(this)}
          />
          <Sidebar
            title={this.renderSideTitle()}
            className='sidebar-modal'
            visible={visible}
            okText={CallCenterStore.languages[edit ? 'save' : 'create']}
            cancelText={CallCenterStore.languages["cancel"]}
            onOk={e => this.editValue.handleSubmit(e)}
            onCancel={(e) => {
              this.editValue.handleCancel(e);
            }}
            confirmLoading={submitting}

          >
            {
              this.renderSideBar()
            }
          </Sidebar>
        </Content>
      </Page>
    )
  }

}
export default withRouter(injectIntl(CallCenterHome));

