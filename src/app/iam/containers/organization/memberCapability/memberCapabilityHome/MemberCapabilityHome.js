/** 2019/3/20
*作者:高梦龙
*项目：成员能力标签
*/


import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page } from 'yqcloud-front-boot';
import { Button, Modal, Tag, Table, Tooltip, Checkbox, Icon, Form, message, Card, Row, Col, Popover } from 'yqcloud-ui';
import MemberCapabilityStore from '../../../../stores/organization/memberCapability/MemberCapabilityStore';
import './MemberStyle.scss';
import Ellipsis from '../../../../components/ellipsis';

const intlPrefix = 'organization.MemberCapability';
const CheckboxGroup = Checkbox.Group;

@inject('AppState')
@observer
class MemberCapabilityHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      paginations: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      dataSource: [],
      capabilityTagSource: [],
      count: 0,
      capabilityCount: 0,
      sort: '',
      selectedRowKeys: [], // 成员能力标签key值
      selectedCodeValues: [], // 成员能力标签所选的对象值
      selectedCapabilityKeys: [], // 能力标签的key值
      selectedCodeCapabilityValues: [], // 能力标签所选的对象值
      capabilityVisible: false,
      editCapabilityVisible: false,
      getCapability: {}, // 获取当前行数据
      indeterminate: true,
      checkAll: false,
      optionvalue: [],
      checkboxOptions: [],
      veiwId: '',
      keyArray: [],
    };
  }

  componentWillMount() {
    this.loadMemberCapability();
    this.loadCapabilityTags();
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    MemberCapabilityStore.queryLanguage(id, AppState.currentLanguage);
  };

  // 成员能力标签分页
  loadMemberCapability = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState, AutomaticTransferStore } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { organizationId } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    MemberCapabilityStore.queryMemberCapability(
      organizationId,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      // 将后台获取的分页信息手动set表格里
      let { count } = this.state;
      data.content.forEach((v) => {
        v.key = count;
        count += 1;
      });
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
        count,
      });
    })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
      );
  };


  // 能力标签分页
  loadCapabilityTags = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    MemberCapabilityStore.queryTagCapability(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      // 将后台获取的分页信息手动set表格里
      let { capabilityCount } = this.state;
      data.content.forEach((v) => {
        v.key = capabilityCount;
        capabilityCount += 1;
      });
      this.setState({
        paginations: {
          current: (data.number || 0) + 1,
          pageSize: data.size || 25,
          total: data.totalElements || '',
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        filters,
        params,
        sort,
        capabilityTagSource: data.content,
        capabilityCount,
      });
    })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
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
    this.loadMemberCapability(pagination, sorter.join(','), filters, params);
  }

  handlePageChanges(pagination, filters, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadCapabilityTags(pagination, sorter.join(','), filters, params);
  }

  // 成员行标签显示样式
  capabilityLabels=(text) => {
    const labelsArray = [];
    const labelSlices = text.slice(0, 3);
    labelSlices.forEach((value) => {
      labelsArray.push(<Tag color="cyan" className="ant-type">{value.name}</Tag>);
    });
    if (text.length > 3) {
      labelsArray.push('. . .');
    }
    return labelsArray;
  }

  capabilityLabelTags=(text) => {
    const labelsArray = [];
    text.forEach((value) => {
      labelsArray.push(<Tag color="cyan" className="member-tooltip-content">{value.name}</Tag>);
    });
    return labelsArray;
  }

  // 打开能力标签弹框
  openModelCapa=() => {
    this.setState({
      capabilityVisible: true,
    });
  }

  // 打开能力标签编辑页面
  openEditCapa=(value) => {
    this.setState({
      editCapabilityVisible: true,
      getCapability: value,
    });
  }

  closeModalCapa=() => {
    this.setState({
      capabilityVisible: false,
      editCapabilityVisible: false,
      checkAll: false,
      optionvalue: [],
      checkboxOptions: [],
    });
  };

  deleteMemberLable=() => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { getCapability, optionvalue } = this.state;
    if (optionvalue.length > 0) {
      MemberCapabilityStore.deleteCapabilityLabels(organizationId, getCapability.employeeId, optionvalue).then((data) => {
        if (data === 'success') {
          this.loadMemberCapability();
          Choerodon.prompt(MemberCapabilityStore.languages[`${intlPrefix}.deleteLabels.success`]);
          this.setState({
            checkAll: false,
            editCapabilityVisible: false,
            optionvalue: [],
            checkboxOptions: [],
          });
        } else {
          this.setState({
            checkAll: false,
            editCapabilityVisible: false,
            optionvalue: [],
            checkboxOptions: [],
          });
          // Choerodon.prompt(MemberCapabilityStore.languages[`${intlPrefix}.deleteLabels.failed`]);
        }
      });
    } else {
      Choerodon.prompt(MemberCapabilityStore.languages[`${intlPrefix}.deleteLabels.tooltip`]);
    }
  }


  handleLabels=() => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { selectedCodeValues, selectedCodeCapabilityValues } = this.state;
    const employeeIds = [];
    const labelIds = [];
    selectedCodeValues.forEach((values) => {
      employeeIds.push(values.employeeId);
    });
    selectedCodeCapabilityValues.forEach((item) => {
      labelIds.push(item.id);
    });
    const labels = { employeeIds, labelIds };
    MemberCapabilityStore.addCapabilityLabels(organizationId, labels).then((data) => {
      if (data === 'success') {
        this.setState({
          capabilityVisible: false,
          selectedRowKeys: [],
          selectedCodeValues: [],
        });
        this.loadMemberCapability();
        Choerodon.prompt(MemberCapabilityStore.languages[`${intlPrefix}.createLabels.success`]);
      }
    });
  }

  // 能力标签表格
  capabilityTagTable = () => {
    const { paginations, capabilityTagSource } = this.state;
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    //  定义表格列
    const rowSelections = {
      //  选择记录后，将选中的记录加入selectedCodeValue状态中
      onChange: (selectedCapabilityKeys, selectedCodeCapabilityValues) => {
        this.setState({ selectedCodeCapabilityValues, selectedCapabilityKeys });
      },
      selectedCapabilityKeys: this.state.selectedCapabilityKeys,
    };
    const columns = [
      {
        title: MemberCapabilityStore.languages[`${intlPrefix}.labelClassify`],
        dataIndex: 'categoryName',
        key: 'categoryName',
        width: 200,
        filters: [],
      },
      {
        title: MemberCapabilityStore.languages[`${intlPrefix}.labelName`],
        dataIndex: 'name',
        key: 'name',
        filters: [],
        width: 150,
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={capabilityTagSource}
        pagination={paginations}
        rowSelection={rowSelections}
        onChange={this.handlePageChanges.bind(this)}
        bordered={false}
      />
    );
  };


  onChanges = (checkedValues) => {
    const { getCapability } = this.state;
    this.setState({
      optionvalue: checkedValues,
      checkAll: checkedValues.length === getCapability.abilityLabels.length,
    });
  }


  onCheckAllChange = (e) => {
    const { checkboxOptions } = this.state;
    this.setState({
      checkAll: e.target.checked,
      optionvalue: e.target.checked ? checkboxOptions : [],
    });
  };

  // 渲染组织架构
  renderOrganizationName = (text, record) => {
    if (text) {
      const re = new RegExp('/', 'g');
      const arr = text.match(re);
      if (arr && arr.length > 4) {
        return (
          <Tooltip
            title={text}
            // overlayClassName="member-tooltip"
            placement="top"
          >{this.changeOrganizationName(text)}
          </Tooltip>
        );
      } else {
        return (<span>{text}</span>);
      }
    } else {
      return (<span>{text}</span>);
    }
  };

  changeView=(record) => {
    const { keyArray } =this.state;
    keyArray.push(record.key);
     this.setState({
       veiwId: record.key,
     })
  }

  cancelView=(record) => {
    const { keyArray } =this.state;
    keyArray.splice(keyArray.findIndex(item => item === record.key), 1)
    this.setState({
      veiwId: '',
    })
  }

  // 修改组织架构显示的描述
  changeOrganizationName = (text) => {
    const firstIndex = this.findFirst(text, '/', 2);
    const lastIndex = this.findLast(text, '/', text.length + 1);
    const beforeText = text.substring(0, firstIndex + 1);
    const afterText = text.substring(lastIndex);
    return `${beforeText}......${afterText}`;
  };

  // 查找函数前面
  findFirst = (str, cha, num) => {
    let x = str.indexOf(cha);
    for (let i = 0; i < num; i += 1) {
      x = str.indexOf(cha, x + 1);
    }
    return x;
  };

  // 查找函数后面
  findLast = (str, cha, num) => {
    let x = str.lastIndexOf(cha);
    for (let i = 0; i < num; i += 1) {
      x = str.lastIndexOf(cha, x + 1);
    }
    return x;
  };

  render() {
    const rowSelection = {
      //  选择记录后，将选中的记录加入selectedCodeValue状态中
      onChange: (selectedRowKeys, selectedCodeValues) => {
        this.setState({ selectedCodeValues, selectedRowKeys });
      },
      selectedRowKeys: this.state.selectedRowKeys,
    };
    const { intl, id } = this.props;
    const { AppState: { menuType: { organizationId, name } }, form } = this.props;
    const { filters, pagination, dataSource, capabilityVisible, selectedCodeValues, editCapabilityVisible, getCapability, checkboxOptions, optionvalue, viewStatus, veiwId, keyArray } = this.state;
    const checkboxOption = [];
    const checkboxId = [];
    if (JSON.stringify(getCapability) !== '{}') {
      getCapability.abilityLabels.forEach((v) => {
        checkboxOption.push(
          <Col span={12}>
            <Checkbox value={v.id}>
              <Ellipsis
                className="wk-link"
                length={7}
                tooltip
              >
                {v.name}
              </Ellipsis>
            </Checkbox>
          </Col>,
        );
      });
      getCapability.abilityLabels.forEach((item) => {
        checkboxId.push(item.id);
      });
    }
    this.state.checkboxOptions = checkboxId;
    const columns = [
      { title: MemberCapabilityStore.languages[`${intlPrefix}.menberName`],
        dataIndex: 'employeeName',
        key: 'employeeName',
        filters: [],
        fixed: 'left',
        width: 170,
        render: (text, record) => (
          <span>
            <a style={{ color: '#2196F3' }} onClick={this.openEditCapa.bind(this, record)}>{text}</a>
          </span>
        ),
      },
      { title: MemberCapabilityStore.languages[`${intlPrefix}.menberCode`],
        dataIndex: 'employeeCode',
        key: 'employeeCode',
        filters: [],
        width: 130,
      },
      { title: MemberCapabilityStore.languages[`${intlPrefix}.MobilePhone`],
        dataIndex: 'mobil',
        key: 'mobil',
        filters: [],
        width: 120,
      },
      { title: MemberCapabilityStore.languages[`${intlPrefix}.email`],
        dataIndex: 'email',
        key: 'email',
        filters: [],
        width: 210,
      },
      { title: MemberCapabilityStore.languages[`${intlPrefix}.entryTime`],
        dataIndex: 'joinDate',
        key: 'joinDate',
        filters: [],
        width: 120,
        render: (text, record) => <span>{record.joinDate ? record.joinDate.split(' ')[0] : ' '}</span>,
      },
      { title: MemberCapabilityStore.languages[`${intlPrefix}.organization`],
        dataIndex: 'organizationName',
        key: 'organizationName',
        filters: [],
        width: 300,
        render: (text, record) => this.renderOrganizationName(text, record),
      },
      { title: MemberCapabilityStore.languages[`${intlPrefix}.mainPost`],
        dataIndex: 'positionName',
        key: 'positionName',
        filters: [],
        width: 160,
      },
      { title: MemberCapabilityStore.languages[`${intlPrefix}.Isproject`],
        dataIndex: 'projectNames',
        key: 'projectNames',
        filters: [],
        width: 160,
        render: (text, record, index) => (
           text ? (
             text.length > 0  ? (  <div>
              <span style={{ color: '#2196F3', cursor: 'pointer', display: keyArray.length > 0  ? keyArray.includes(record.key) ? 'none' : '' : ''  }}
                    onClick={this.changeView.bind(this, record)
              }>{MemberCapabilityStore.languages['expand.all']}
              </span>
               <span>{text.map((recode) => {
                 const wrapclass = ['organization-table'];
                 return (
                   <div key={recode} style={{ display: keyArray.length > 0  ? keyArray.includes(record.key) ? '' : 'none' : 'none', cursor: 'pointer', }}
                        className={wrapclass.join(' ')}>
                     {<span className="organization-table-list">{recode}</span>}
                   </div>
                 );
               })
               }
               <div style={{ color: '#2196F3', cursor: 'pointer', display: keyArray.length > 0  ? keyArray.includes(record.key) ? '' : 'none' : 'none' }} onClick={this.cancelView.bind(this, record)}>
               {MemberCapabilityStore.languages['Collapse']}
               </div>
               </span>


             </div>) : (
               <span style={{ disabled: 'true', color: '#CCD3D9', cursor: 'not-allowed' }}>{MemberCapabilityStore.languages['expand.all']}</span>
             )
           ) :
            (<span style={{ disabled: 'true', color: '#CCD3D9', cursor: 'not-allowed' }}>{MemberCapabilityStore.languages['expand.all']}</span>)
        ),
      },
      {
        title: MemberCapabilityStore.languages[`${intlPrefix}.labels`],
        dataIndex: 'abilityLabels',
        key: 'abilityLabels',
        filters: [],
        fixed: 'right',
        width: 250,
        render: (text, record) => (
          <Popover
            content={this.capabilityLabelTags(text)}
            overlayClassName="member-tooltip"
            overlayStyle={{ width: 250 }}
            placement="left"
            title={record.employeeName}
          >{this.capabilityLabels(text)}
          </Popover>
        ),
      },
    ];


    return (
      <Page>
        <Header
          title={MemberCapabilityStore.languages[`${intlPrefix}.memberAblity`]}
        >
          <Button
            style={{ color: selectedCodeValues.length > 0 ? '#04173F' : '' }}
            disabled={selectedCodeValues.length > 0 ? '' : 'disabled'}
            onClick={this.openModelCapa}
          >
            <Icon type="xinjian" style={{ color: selectedCodeValues.length > 0 ? '#2196F3' : '' }} />
            {MemberCapabilityStore.languages[`${intlPrefix}.addLabels`]}
          </Button>
        </Header>
        <Content>
          <Table
            size="middle"
            pagination={pagination}
            columns={columns}
            loading={MemberCapabilityStore.isLoading}
            rowSelection={rowSelection}
            rowKey="id"
            dataSource={dataSource}
            onChange={this.handlePageChange.bind(this)}
            scroll={{ x: 1650 }}
          />
          <Modal
            title={MemberCapabilityStore.languages[`${intlPrefix}.capabilityTags`]}
            visible={capabilityVisible}
            onCancel={this.closeModalCapa}
            className="member-content"
            destroyOnClose
            footer={[
              <Button
                style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
                onClick={this.handleLabels}
                type="primary"
                funcType="raised"
              >
                {MemberCapabilityStore.languages.save}
              </Button>,
              <Button
                onClick={this.closeModalCapa}
                funcType="raised"
                style={{ marginRight: '15px' }}
              >
                {MemberCapabilityStore.languages.cancel}
              </Button>,
            ]}
          >
            {this.capabilityTagTable()}
          </Modal>
          <Modal
            title={MemberCapabilityStore.languages[`${intlPrefix}.editCapabilityTags`]}
            visible={editCapabilityVisible}
            onCancel={this.closeModalCapa}
            className="member-content"
            destroyOnClose
            footer={[
              <Button
                style={{ backgroundColor: '#2196f3', borderRadius: 5 }}
                onClick={this.deleteMemberLable}
                type="primary"
                funcType="raised"
              >
                {MemberCapabilityStore.languages.delete}
              </Button>,
              <Button
                onClick={this.closeModalCapa}
                funcType="raised"
                style={{ marginRight: '15px' }}
              >
                {MemberCapabilityStore.languages.cancel}
              </Button>,
            ]}
          >
            <Card
              title={getCapability.employeeName}
              extra={(
                <span>
                  <div
                    className="edit-member-extra-checkbox"
                  >
                    <Checkbox
                      onChange={this.onCheckAllChange}
                      checked={this.state.checkAll}
                    >
                      {MemberCapabilityStore.languages['select all']}
                    </Checkbox>
                  </div>
                  {optionvalue.length}/{JSON.stringify(getCapability) !== '{}' ? getCapability.abilityLabels.length : '' } 项
                </span>
)}
            >
              <div className="checkbox-content">
                <Checkbox.Group
                  style={{ width: '100%' }}
                  onChange={this.onChanges}
                  value={optionvalue}
                >
                  <Row>
                    {checkboxOption}
                  </Row>
                </Checkbox.Group>
              </div>
            </Card>
          </Modal>

        </Content>
      </Page>
    );
  }
}
export default Form.create({})(withRouter(injectIntl(MemberCapabilityHome)));
