import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Content, Header } from 'yqcloud-front-boot';
import { Checkbox, Switch } from 'yqcloud-ui';
import {Form, Button, Table, Icon } from 'yqcloud-ui';
import settingStore from '../../../../stores/organization/msgReceiveSetting';
import './index.scss';

const intlPrefix = 'organization.messageNotification';


@inject('AppState')
@observer
class MsgSettingHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      dataSource_1: [],
      dataSource_2: [],
      dataSource_3: [],
      dataSource_4: [],
      indeterminate1: true,
      indeterminate12: true,
      indeterminate13: true,
      indeterminate2: true,
      indeterminate22: true,
      indeterminate23: true,
      indeterminate3: true,
      indeterminate32: true,
      indeterminate33: true,
      indeterminate4: true,
      indeterminate42: true,
      indeterminate43: true,
      visible: false,
      edit: false,
      submitting: false,
      selectedData: '',
      showMember: true,
      params: [],
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      selectedRowKeys: [],
      confirmDeleteLoading: false,
      selectedCodeValues: [],
      deleteValueAll: [],
      indeterminate: true,
      checkAll: false,
      checked: true,
      transactionList: [],
      messageInfo: [],
      tableVisible: true,
    };
  }

  componentWillMount() {
    // this.props.onRef(this);
    this.fetch(this.props);
  }

  fetch(props) {
    const { AppState } = props;
    const { organizationId } = AppState.currentMenuType;
    this.loadSetting();
    settingStore.queryShiWu(AppState.userInfo.organizationId);
  }

  // 获取事物状态
  selectShiWu = (values) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const empLists = settingStore.getEmpList;
    const temp_Emp = empLists.filter(v => (v.lookupValue === values));
    if (temp_Emp.length > 0) {
      return temp_Emp[0].lookupMeaning;
    } else {
      return values;
    }
  }

  // 更新页面数据
  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadSetting();
    });
  };

  componentDidMount() {
    this.loadLanguage();
    this.loadSetting();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    settingStore.queryLanguage(AppState.userInfo.organizationId, AppState.currentLanguage);
  }

  // 保存按钮

  // settingStore.settingSubmits

  // 提交页面
  handleSubmit=(e) => {
    e.preventDefault();
    const { dataSource_1, dataSource_2, dataSource_3, dataSource_4, tableVisible } = this.state;
    const { AppState, intl } = this.props;
    if (tableVisible == true) {
      const reqArry = [];
      dataSource_1[0].children.forEach((v) => {
        reqArry.push(v);
      });
      dataSource_2[0].children.forEach((v) => {
        reqArry.push(v);
      });
      dataSource_4[0].children.forEach((v) => {
        reqArry.push(v);
      });
      dataSource_3[0].children.forEach((v) => {
        reqArry.push(v);
      });
      settingStore.settingSubmits(AppState.userInfo.organizationId, reqArry).then((v) => {
        Choerodon.prompt(settingStore.languages[`${intlPrefix}.action.settingSubmit.msg`]);
      });
    } else if (tableVisible == false) {
      const reqArry = [];
      dataSource_2[0].children.forEach((v) => {
        reqArry.push(v);
      });
      settingStore.settingSubmits(AppState.userInfo.organizationId, reqArry).then((v) => {
        Choerodon.prompt(settingStore.languages[`${intlPrefix}.action.settingSubmit.msg`]);
      });
    }
  }


  allIsReceived=() => {
    const { dataSource_1, dataSource_2, dataSource_3, dataSource_4, tableVisible } = this.state;
    if (tableVisible == true) {
      dataSource_1[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 1;
          });
        }
      });
      dataSource_2[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 1;
          });
        }
      });
      dataSource_4[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 1;
          });
        }
      });
      dataSource_3[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 1;
          });
        }
      });

      this.setState({
        dataSource_1, dataSource_2, dataSource_4,
      });
    } else if (tableVisible == false) {
      dataSource_2[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 1;
          });
        }
      });
      this.setState({
        dataSource_2,
      });
    }
  }

  /**
   * 加载全部消息
   * @param paginationIn 分页
   */
  loadSetting = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    settingStore.loadSettings(
      AppState.userInfo.organizationId,
    ).then((data) => {
      if (data && data.ITSM && data.SYSTEM) {
        const temp_1 = [];
        const temp_1_1 = [];
        data.ITSM.forEach((v) => {
          const temp_1_2 = [];
          temp_1_1.push({
            ...v,
            key: v.transactionId,
            children: temp_1_2.length > 0 ? temp_1_2 : null,
          });
        });
        temp_1.push({
          key: 0,
          transactionName: settingStore.languages[`${intlPrefix}.msgSettingITSM`],
          children: temp_1_1,
        });

        const temp_2 = [];
        const temp_2_1 = [];
        data.SYSTEM.forEach((v) => {
          const temp_2_2 = [];
          temp_2_1.push({
            ...v,
            key: v.transactionId,
            children: temp_2_2.length > 0 ? temp_2_2 : null,
          });
        });
        temp_2.push({
          key: 0,
          transactionName: settingStore.languages[`${intlPrefix}.system`],
          children: temp_2_1,
        });

        const temp_3 = [];
        const temp_3_1 = [];
        data.WF.forEach((v) => {
          const temp_3_2 = [];
          temp_3_1.push({
            ...v,
            key: v.transactionId,
            children: temp_3_2.length > 0 ? temp_3_2 : null,
          });
        });
        temp_3.push({
          key: 0,
          transactionName: settingStore.languages[`${intlPrefix}.workflow`],
          children: temp_3_1,
        });

        const temp_4 = [];
        const temp_4_1 = [];
        data.KB.forEach((v) => {
          const temp_4_2 = [];
          temp_4_1.push({
            ...v,
            key: v.transactionId,
            children: temp_4_2.length > 0 ? temp_4_2 : null,
          });
        });
        temp_4.push({
          key: 0,
          transactionName: settingStore.languages[`${intlPrefix}.knowledgeBase`],
          children: temp_4_1,
        });
        this.setState({
          dataSource_1: temp_1,
          dataSource_2: temp_2,
          dataSource_3: temp_3,
          dataSource_4: temp_4,
          tableVisible: true,
          filters,
          params,
          sort,
        });
      } else if (data && data.SYSTEM) {
        const temp_2 = [];
        const temp_2_1 = [];
        data.SYSTEM.forEach((v) => {
          const temp_2_2 = [];
          temp_2_1.push({
            ...v,
            key: v.transactionId,
            children: temp_2_2.length > 0 ? temp_2_2 : null,
          });
        });
        temp_2.push({
          key: 0,
          transactionName: settingStore.languages[`${intlPrefix}.systemNotification`],
          children: temp_2_1,
        });
        this.setState({ dataSource_2: temp_2,
          tableVisible: false,
        });
      }
    })
      .catch(error => Choerodon.handleResponseError(error));
  };

  onSelectSwitch = (record, checked) => {
    const { dataSource_1 } = this.state;
    if (checked) {
      dataSource_1[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 1;
          });
        }
      });
    } else if (checked == false) {
      dataSource_1[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 0;
          });
        }
      });
    }
    this.setState({ dataSource_1 });
  }

  onSelectSwitch_1 = (record, checked) => {
    const { dataSource_2 } = this.state;
    if (checked) {
      dataSource_2[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 1;
          });
        }
      });
    } else if (checked == false) {
      dataSource_2[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 0;
          });
        }
      });
    }
    this.setState({ dataSource_2 });
  }

  onSelectSwitch_2 = (record, checked) => {
    const { dataSource_3 } = this.state;
    if (checked) {
      dataSource_3[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 1;
          });
        }
      });
    } else if (checked == false) {
      dataSource_3[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 0;
          });
        }
      });
    }
    this.setState({ dataSource_3 });
  }

  onSelectSwitch_3 = (record, checked) => {
    const { dataSource_4 } = this.state;
    if (checked) {
      dataSource_4[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 1;
          });
        }
      });
    } else if (checked == false) {
      dataSource_4[0].children.forEach((v) => {
        if (v.setupReceiveList) {
          v.setupReceiveList.forEach((v2) => {
            v2.isReceived = 0;
          });
        }
      });
    }
    this.setState({ dataSource_4 });
  }


  renderTable_1 = () => {
    const { filters, dataSource_1, indeterminate1, indeterminate12, indeterminate13 } = this.state;
    const columns_1 = [{
      title: '',
      dataIndex: 'transactionName',
      key: 'transactionName',
      width: '25%',
      filters: [],
      filteredValue: filters.transactionName || [],
      // render: text => <span>{text}</span>,
      render: (v, record) => (
        record.children ? (<span style={{ fontSize: 14 }}> {record.transactionName}</span>) : (
          <span style={{ fontSize: 14 }}> {this.selectShiWu(record.transactionName)}</span>)
      ),
    },
    {
      dataIndex: 'isReceived',
      key: 'isReceived1',
      width: '10%',
      render: (value, record) => {
        const setTag = 1;
        if (record.children) {
          let tempCheck = true;
          let indeter = false;
          record.children.forEach((v) => {
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 1) {
              indeter = true;
            }
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 0) {
              tempCheck = false;
            }
          });
          return (
            <Checkbox
              className="zheShiYiGe"
              indeterminate={indeter}
              checked={tempCheck}
              onChange={(e) => {
                if (e.target.checked) {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 1;
                    }
                  });
                } else {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 0;
                    }
                  });
                }
                this.setState({ dataSource_1, indeterminate1: false });
              }}
            />
          );
        } else {
          return (
            <Checkbox
              checked={record.setupReceiveList ? record.setupReceiveList[setTag].isReceived === 1 : false}
              onChange={(e) => {
                record.setupReceiveList[setTag].isReceived = e.target.checked ? 1 : 0;
                this.setState({ dataSource_1 });
              }}
            />
          );
        }
      },
    },
    {
      dataIndex: 'isReceived',
      key: 'isReceived2',
      width: '10%',
      render: (value, record) => {
        const setTag = 0;
        if (record.children) {
          let tempCheck = true;
          let indeter = false;
          record.children.forEach((v) => {
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 1) {
              indeter = true;
            }
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 0) {
              tempCheck = false;
            }
          });
          return (
            <Checkbox
              className="zheShiYiGe"
              indeterminate={indeter}
              checked={tempCheck}
              onChange={(e) => {
                if (e.target.checked) {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 1;
                    }
                  });
                } else {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 0;
                    }
                  });
                }
                this.setState({ dataSource_1, indeterminate12: false });
              }}
            />
          );
        } else {
          return (
            <Checkbox
              checked={record.setupReceiveList ? record.setupReceiveList[setTag].isReceived === 1 : false}
              onChange={(e) => {
                record.setupReceiveList[setTag].isReceived = e.target.checked ? 1 : 0;
                this.setState({ dataSource_1 });
              }}
            />
          );
        }
      },
    },
    {
      dataIndex: 'isReceived',
      key: 'isReceived3',
      width: '10%',
      render: (value, record) => {
        const setTag = 2;
        if (record.children) {
          let tempCheck = true;
          let indeter = false;
          record.children.forEach((v) => {
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 1) {
              indeter = true;
            }
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 0) {
              tempCheck = false;
            }
          });
          return (
            <Checkbox
              className="zheShiYiGe"
              indeterminate={indeter}
              checked={tempCheck}
              onChange={(e) => {
                if (e.target.checked) {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 1;
                    }
                  });
                } else {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 0;
                    }
                  });
                }
                this.setState({ dataSource_1, indeterminate13: false });
              }}
            />
          );
        } else {
          return (
            <Checkbox
              checked={record.setupReceiveList ? record.setupReceiveList[setTag].isReceived === 1 : false}
              onChange={(e) => {
                record.setupReceiveList[setTag].isReceived = e.target.checked ? 1 : 0;
                this.setState({ dataSource_1 });
              }}
            />
          );
        }
      },
    },
    {
      title: '',
      dataIndex: '',
      key: '',
      width: '5%',
      render: (v, record) => {
        let tempCheck = true;
        dataSource_1[0].children.forEach((v) => {
          if (v.setupReceiveList) {
            v.setupReceiveList.forEach((v2) => {
              if (v2.isReceived === 0) {
                tempCheck = false;
              }
            });
          }
        });
        return record.children ? <Switch checked={tempCheck} onClick={this.onSelectSwitch.bind(this, record)} /> : '';
      },
    },
    ];
    return (
      <Table
        className="ant-table-tbody-new-set-1"
        columns={columns_1}
        dataSource={dataSource_1}
        filterBar={false}
        showHeader={false}
        pagination={false}
        defaultExpandAllRows
      />
    );
  }

  renderTable_2 = () => {
    const { dataSource_2, filters, indeterminate2, indeterminate22, indeterminate23 } = this.state;
    const columns_2 = [{
      title: '',
      dataIndex: 'transactionName',
      key: 'transactionName',
      width: '25%',
      filters: [],
      filteredValue: filters.transactionName || [],
      render: (v, record) => (
        record.children ? (<span style={{ fontSize: 14 }}> {record.transactionName}</span>) : (
          <span style={{ fontSize: 14 }}> {this.selectShiWu(record.transactionName)}</span>)
      ),

    },
    {
      dataIndex: 'isReceived',
      key: 'isReceived1',
      width: '10%',
      render: (value, record) => {
        const setTag = 1;
        if (record.children) {
          let tempCheck = true;
          let indeter = false;
          record.children.forEach((v) => {
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 1) {
              indeter = true;
            }
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 0) {
              tempCheck = false;
            }
          });
          return (
            <Checkbox
              className="zheShiYiGe"
              checked={tempCheck}
              indeterminate={indeter}
              onChange={(e) => {
                if (e.target.checked) {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 1;
                    }
                  });
                } else {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 0;
                    }
                  });
                }
                this.setState({ dataSource_2, indeterminate2: false });
              }}
            />
          );
        } else {
          return (
            <Checkbox
              checked={record.setupReceiveList ? record.setupReceiveList[setTag].isReceived === 1 : false}
              onChange={(e) => {
                record.setupReceiveList[setTag].isReceived = e.target.checked ? 1 : 0;
                this.setState({ dataSource_2 });
              }}
            />
          );
        }
      },
    },
    {
      dataIndex: 'isReceived',
      key: 'isReceived2',
      width: '10%',
      render: (value, record) => {
        const setTag = 0;
        if (record.children) {
          let tempCheck = true;
          let indeter = false;
          record.children.forEach((v) => {
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 1) {
              indeter = true;
            }
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 0) {
              tempCheck = false;
            }
          });
          return (
            <Checkbox
              className="zheShiYiGe"
              indeterminate={indeter}
              checked={tempCheck}
              onChange={(e) => {
                if (e.target.checked) {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 1;
                    }
                  });
                } else {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 0;
                    }
                  });
                }
                this.setState({ dataSource_2, indeterminate22: false });
              }}
            />
          );
        } else {
          return (
            <Checkbox
              checked={record.setupReceiveList ? record.setupReceiveList[setTag].isReceived === 1 : false}
              onChange={(e) => {
                record.setupReceiveList[setTag].isReceived = e.target.checked ? 1 : 0;
                this.setState({ dataSource_2 });
              }}
            />
          );
        }
      },
    },
    {
      dataIndex: 'isReceived',
      key: 'isReceived3',
      width: '10%',
      render: (value, record) => {
        const setTag = 2;
        if (record.children) {
          let tempCheck = true;
          let indeter = false;
          record.children.forEach((v) => {
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 1) {
              indeter = true;
            }
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 0) {
              tempCheck = false;
              this.state.indeterminate23 = true;
            }
          });
          return (
            <Checkbox
              className="zheShiYiGe"
              checked={tempCheck}
              indeterminate={indeter}
              onChange={(e) => {
                if (e.target.checked) {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 1;
                    }
                  });
                } else {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 0;
                    }
                  });
                }
                this.setState({ dataSource_2, indeterminate23: false });
              }}
            />
          );
        } else {
          return (
            <Checkbox
              checked={record.setupReceiveList ? record.setupReceiveList[setTag].isReceived === 1 : false}
              onChange={(e) => {
                record.setupReceiveList[setTag].isReceived = e.target.checked ? 1 : 0;
                this.setState({ dataSource_2 });
              }}
            />
          );
        }
      },
    },
    {
      title: '',
      dataIndex: '',
      key: '',
      width: '5%',
      render: (v, record) => {
        let tempCheck = true;
        dataSource_2[0].children.forEach((v) => {
          if (v.setupReceiveList) {
            v.setupReceiveList.forEach((v2) => {
              if (v2.isReceived === 0) {
                tempCheck = false;
              }
            });
          }
        });
        return record.children ? <Switch checked={tempCheck} onClick={this.onSelectSwitch_1.bind(this, record)} /> : '';
      },

    },
    ];
    return (
      <Table
        className="ant-table-tbody-new-set-2"
        columns={columns_2}
        dataSource={dataSource_2}
        filterBar={false}
        pagination={false}
        showHeader={false}
        defaultExpandAllRows
      />
    );
  }

  renderTable_3 = () => {
    const { dataSource_3, filters, indeterminate3, indeterminate32, indeterminate33 } = this.state;
    const columns_3 = [{
      title: '',
      dataIndex: 'transactionName',
      key: 'transactionName',
      width: '25%',
      filters: [],
      filteredValue: filters.transactionName || [],
      render: (v, record) => (
        record.children ? (<span style={{ fontSize: 14 }}> {record.transactionName}</span>) : (
          <span style={{ fontSize: 14 }}> {this.selectShiWu(record.transactionName)}</span>)
      ),

    },
    {
      dataIndex: 'isReceived',
      key: 'isReceived1',
      width: '10%',
      render: (value, record) => {
        const setTag = 1;
        if (record.children) {
          let tempCheck = true;
          let indeter = false;
          record.children.forEach((v) => {
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 1) {
              indeter = true;
            }
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 0) {
              tempCheck = false;
            }
          });
          return (
            <Checkbox
              className="zheShiYiGe"
              checked={tempCheck}
              indeterminate={indeter}
              onChange={(e) => {
                if (e.target.checked) {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 1;
                    }
                  });
                } else {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 0;
                    }
                  });
                }
                this.setState({ dataSource_3, indeterminate3: false });
              }}
            />
          );
        } else {
          return (
            <Checkbox
              checked={record.setupReceiveList ? record.setupReceiveList[setTag].isReceived === 1 : false}
              onChange={(e) => {
                record.setupReceiveList[setTag].isReceived = e.target.checked ? 1 : 0;
                this.setState({ dataSource_3 });
              }}
            />
          );
        }
      },
    },
    {
      dataIndex: 'isReceived',
      key: 'isReceived2',
      width: '10%',
      render: (value, record) => {
        const setTag = 0;
        if (record.children) {
          let tempCheck = true;
          let indeter = false;
          record.children.forEach((v) => {
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 1) {
              indeter = true;
            }
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 0) {
              tempCheck = false;
            }
          });
          return (
            <Checkbox
              className="zheShiYiGe"
              indeterminate={indeter}
              checked={tempCheck}
              onChange={(e) => {
                if (e.target.checked) {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 1;
                    }
                  });
                } else {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 0;
                    }
                  });
                }
                this.setState({ dataSource_3, indeterminate32: false });
              }}
            />
          );
        } else {
          return (
            <Checkbox
              checked={record.setupReceiveList ? record.setupReceiveList[setTag].isReceived === 1 : false}
              onChange={(e) => {
                record.setupReceiveList[setTag].isReceived = e.target.checked ? 1 : 0;
                this.setState({ dataSource_3 });
              }}
            />
          );
        }
      },
    },
    {
      dataIndex: 'isReceived',
      key: 'isReceived3',
      width: '10%',
      render: (value, record) => {
        const setTag = 2;
        if (record.children) {
          let tempCheck = true;
          let indeter = false;
          record.children.forEach((v) => {
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 1) {
              indeter = true;
            }
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 0) {
              tempCheck = false;
            }
          });
          return (
            <Checkbox
              className="zheShiYiGe"
              checked={tempCheck}
              indeterminate={indeter}
              onChange={(e) => {
                if (e.target.checked) {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 1;
                    }
                  });
                } else {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 0;
                    }
                  });
                }
                this.setState({ dataSource_3, indeterminate33: false });
              }}
            />
          );
        } else {
          return (
            <Checkbox
              checked={record.setupReceiveList ? record.setupReceiveList[setTag].isReceived === 1 : false}
              onChange={(e) => {
                record.setupReceiveList[setTag].isReceived = e.target.checked ? 1 : 0;
                this.setState({ dataSource_3 });
              }}
            />
          );
        }
      },
    },
    {
      title: '',
      dataIndex: '',
      key: '',
      width: '5%',
      render: (v, record) => {
        let tempCheck = true;
        dataSource_3[0].children.forEach((v) => {
          if (v.setupReceiveList) {
            v.setupReceiveList.forEach((v2) => {
              if (v2.isReceived === 0) {
                tempCheck = false;
              }
            });
          }
        });
        return record.children ? <Switch checked={tempCheck} onClick={this.onSelectSwitch_2.bind(this, record)} /> : '';
      },

    },
    ];
    return (
      <Table
        className="ant-table-tbody-new-set-3"
        columns={columns_3}
        dataSource={dataSource_3}
        filterBar={false}
        pagination={false}
        showHeader={false}
        defaultExpandAllRows
      />
    );
  }

  renderTable_4 = () => {
    const { dataSource_4, filters, indeterminate4, indeterminate42, indeterminate43 } = this.state;
    const columns_4 = [{
      title: '',
      dataIndex: 'transactionName',
      key: 'transactionName',
      width: '25%',
      filters: [],
      filteredValue: filters.transactionName || [],
      render: (v, record) => (
        record.children ? (<span style={{ fontSize: 14 }}> {record.transactionName}</span>) : (
          <span style={{ fontSize: 14 }}> {this.selectShiWu(record.transactionName)}</span>)
      ),

    },
    {
      dataIndex: 'isReceived',
      key: 'isReceived1',
      width: '10%',
      render: (value, record) => {
        const setTag = 1;
        if (record.children) {
          let tempCheck = true;
          let indeter = false;
          record.children.forEach((v) => {
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 1) {
              indeter = true;
            }
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 0) {
              tempCheck = false;
            }
          });
          return (
            <Checkbox
              className="zheShiYiGe"
              indeterminate={indeter}
              checked={tempCheck}
              onChange={(e) => {
                if (e.target.checked) {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 1;
                    }
                  });
                } else {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 0;
                    }
                  });
                }
                this.setState({ dataSource_4, indeterminate4: false });
              }}
            />
          );
        } else {
          return (
            <Checkbox
              checked={record.setupReceiveList ? record.setupReceiveList[setTag].isReceived === 1 : false}
              onChange={(e) => {
                record.setupReceiveList[setTag].isReceived = e.target.checked ? 1 : 0;
                this.setState({ dataSource_4 });
              }}
            />
          );
        }
      },
    },
    {
      dataIndex: 'isReceived',
      key: 'isReceived2',
      width: '10%',
      render: (value, record) => {
        const setTag = 0;
        if (record.children) {
          let tempCheck = true;
          let indeter = false;
          record.children.forEach((v) => {
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 1) {
              indeter = true;
            }
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 0) {
              tempCheck = false;
            }
          });
          return (
            <Checkbox
              className="zheShiYiGe"
              indeterminate={indeter}
              checked={tempCheck}
              onChange={(e) => {
                if (e.target.checked) {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 1;
                    }
                  });
                } else {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 0;
                    }
                  });
                }
                this.setState({ dataSource_4, indeterminate42: false });
              }}
            />
          );
        } else {
          return (
            <Checkbox
              checked={record.setupReceiveList ? record.setupReceiveList[setTag].isReceived === 1 : false}
              onChange={(e) => {
                record.setupReceiveList[setTag].isReceived = e.target.checked ? 1 : 0;
                this.setState({ dataSource_4 });
              }}
            />
          );
        }
      },
    },
    {
      dataIndex: 'isReceived',
      key: 'isReceived3',
      width: '10%',
      render: (value, record) => {
        const setTag = 2;
        if (record.children) {
          let tempCheck = true;
          let indeter = false;
          record.children.forEach((v) => {
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 1) {
              indeter = true;
            }
            if (v.setupReceiveList && v.setupReceiveList[setTag].isReceived === 0) {
              tempCheck = false;
            }
          });
          return (
            <Checkbox
              className="zheShiYiGe"
              indeterminate={indeter}
              checked={tempCheck}
              onChange={(e) => {
                if (e.target.checked) {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 1;
                    }
                  });
                } else {
                  record.children.forEach((v) => {
                    if (v.setupReceiveList && v.setupReceiveList[1]) {
                      v.setupReceiveList[setTag].isReceived = 0;
                    }
                  });
                }
                this.setState({ dataSource_4, indeterminate43: false });
              }}
            />
          );
        } else {
          return (
            <Checkbox
              checked={record.setupReceiveList ? record.setupReceiveList[setTag].isReceived === 1 : false}
              onChange={(e) => {
                record.setupReceiveList[setTag].isReceived = e.target.checked ? 1 : 0;
                this.setState({ dataSource_4 });
              }}
            />
          );
        }
      },
    },
    {
      title: '',
      dataIndex: '',
      key: '',
      width: '5%',
      render: (v, record) => {
        let tempCheck = true;
        dataSource_4[0].children.forEach((v) => {
          if (v.setupReceiveList) {
            v.setupReceiveList.forEach((v2) => {
              if (v2.isReceived === 0) {
                tempCheck = false;
              }
            });
          }
        });
        return record.children ? <Switch checked={tempCheck} onClick={this.onSelectSwitch_3.bind(this, record)} /> : '';
      },

    },
    ];
    return (
      <Table
        className="ant-table-tbody-new-set-2"
        columns={columns_4}
        dataSource={dataSource_4}
        filterBar={false}
        pagination={false}
        showHeader={false}
        defaultExpandAllRows
      />
    );
  }


  render() {
    const { tableVisible } = this.state;
    return (
      <Page>
        <Header title={settingStore.languages[`${intlPrefix}.headerSet.title`]}>
          <Button
            onClick={this.handleSubmit.bind(this)}
            style={{ color: '#1d1d1d' }}
          >
            <Icon type="baocun" style={{ color: '#2196F3', fontSize: 16 }} />
            {settingStore.languages.save}
          </Button>
          <Button
            style={{ color: '#1d1d1d' }}
            onClick={this.allIsReceived}
          >
            <Icon type="zhongzhi" style={{ color: '#2196F3', fontSize: 16 }} />
            {settingStore.languages.msgReset}
          </Button>
        </Header>
        <Content>
          <div style={{ align: 'center', width: 700 }}>
            <span style={{ display: 'inline-block', width: '20%' }} />
            <span style={{ display: 'inline-block', width: '15%', marginLeft: '19%' }}>{settingStore.languages[`${intlPrefix}.EmailNotification`]}</span>
            {/* <span style={{ display: 'inline-block', width: '15%', marginLeft: '27%' }}>{settingStore.languages[`${intlPrefix}.EmailNotification`]}</span> */}
            <span style={{ display: 'inline-block', width: '17%' }}>{settingStore.languages[`${intlPrefix}.stationNotification`]}</span>
            {/* <span style={{ display: 'inline-block', width: '16%', textAlign: 'center' }}>{settingStore.languages[`${intlPrefix}.stationNotification`]}</span> */}
            <span style={{ display: 'inline-block', width: '20%' }}>{settingStore.languages[`${intlPrefix}.weChat`]}</span>
            <span style={{ display: 'inline-block', width: '20%' }} />

          </div>

          {tableVisible == true ? this.renderTable_1()
            : this.renderTable_2()}
          {tableVisible == true ? this.renderTable_3()
            : ''}
          {tableVisible == true ? this.renderTable_4()
            : ''}
          {tableVisible == true ? this.renderTable_2()
            : ''}

        </Content>
      </Page>
    );
  }
}


export default Form.create({})(withRouter(injectIntl(MsgSettingHome)));
