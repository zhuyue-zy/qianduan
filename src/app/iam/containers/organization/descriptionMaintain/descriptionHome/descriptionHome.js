/** 2018/10/14
 *作者:高梦龙
 *项目:描述维护
 */
import React, { Component } from 'react';
import { Button, Modal, Table, Input, Select, message, Icon } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page } from 'yqcloud-front-boot';
import descriptionStore from '../../../../stores/organization/descriptionMaintain/descriptionStore/DescriptionStore';

const intlPrefix = 'organization.descriptionMiantain';

@inject('AppState')
@observer
class DescriptionHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      submitting: false,
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
      sort: 'promptId,desc',
      visible: false,
      deleteVisible: false,
      selectedData: '',
      selectedRowKeys: [],
      selectedCodeValues: [],
      count: 0,
      dataSource: [],
      // 将新增的字段添加到数组中传入后台
      promptCodeList: ['organization.descriptionMiantain.promptCode', 'organization.descriptionMiantain.descriptions',
        'organization.descriptionMiantain.lang', 'save', 'delete', 'export', 'create'],
      fields: {}, // 通过接口从后台拿到语言参数
      cellEditable: false, // 控制单元格是否可编辑
    };
  }

  componentWillMount() {
    this.fetch(this.props);
    this.loadLanguage();
    // 通过code拿到描述
    const { promptCodeList } = this.state;
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    descriptionStore.queryLanguages(organizationId, promptCodeList, this.props.AppState.currentMenuType.type).then((data) => {
      this.setState({
        fields: data,
      });
    });
    descriptionStore.organizationType(this.props.AppState.currentMenuType.type);
  }

  componentDidMount() {
    this.loadDescriptions();
    this.fetch(this.props);
    this.queryLanguages();
    descriptionStore.organizationType(this.props.AppState.currentMenuType.type);
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    if(this.props.AppState.currentMenuType.type==="site"){
      descriptionStore.queryLanguage(0, AppState.currentLanguage);
    }else {
      descriptionStore.queryLanguage(id, AppState.currentLanguage);
    }
  };

  componentDidUpdate() {
    descriptionStore.organizationType(this.props.AppState.currentMenuType.type);
  }

  fetch() {
    // 获取多语言类型数据
    descriptionStore.loadLanguageList();
  }

  // 更新页面数据
  handleRefresh = () => {
    this.setState(this.getInitState(), () => {
      this.loadDescriptions();
      this.queryLanguages();
    });
  };

  /**
   *  多语言查询
   */

  queryLanguages = () => {
    // 通过code拿到描述
    const { promptCodeList } = this.state;
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    descriptionStore.queryLanguages(organizationId, promptCodeList, this.props.AppState.currentMenuType.type).then((data) => {
      this.setState({
        fields: data,
      });
    });
  }
  /**
   *  检查表格中必填字段是否填完
   */

  checkTableData = () => {
    const { dataSource } = this.state;
    let ret = true;
    dataSource.forEach((val) => {
      if (!(val.promptCode && val.lang)) {
        ret = false;
      }
    });
    return ret;
  };


  // 确认批量删除按钮
  handleDeleteOk = () => {
    const { intl } = this.props;
    Modal.confirm({
      title: descriptionStore.languages[`${intlPrefix}.cancel.title`],
      content: descriptionStore.languages[`${intlPrefix}.cancel.content`],
      okText: descriptionStore.languages.confirm,
      cancelText: descriptionStore.languages.cancel,
      onOk: () => {
        const {selectedCodeValues, dataSource} = this.state;
        const {AppState} = this.props;
        const {id} = AppState.currentMenuType;
        /* eslint-disable */
        const deleteValue = {};
        selectedCodeValues.forEach((value) => {
          deleteValue.editType = value.editType
        })
        if (deleteValue.editType !== "create") {
          const deleteData = selectedCodeValues.filter(v => (v.editType !== 'create'));
          descriptionStore.deleteDes(
            id,
            deleteData,
          ).then((data) => {
            this.setState({
              deleteVisible: false,
              selectedRowKeys: [],
            });
            this.handleRefresh();
            Choerodon.prompt(intl.formatMessage({id: `${intlPrefix}.action.delete.msg`}));
          });
        } else {
          for (let i = dataSource.length-1 ; i >=0 ; --i) {
            for (let j = selectedCodeValues.length-1; j >=0 ; --j){
              if ((selectedCodeValues[j].key)===(dataSource[i].key)) {
                dataSource.splice(i,1);
              }
             this.setState({
               dataSource,
               selectedCodeValues:[],
             })
            }
          }
        }
      }
  });
  }
//对表格进行渲染
  renderTestTableCell = (record, value, field, type, onlyLetters, required, focus) => {
    const {cellEditable,dataSource} = this.state;
    const {editable, key} = record;

    return (
      <Input
        // focused={true}
        autoFocus={focus}
        underline={editable || false}
        readOnly={!editable || false}
        defaultValue={value}
        type={type}
        onChange={(e) => {
          record[field] = e.target.value;
          if (record.editType!=='create'){
            record.editType='update'
          }
        }}
        onDoubleClick={() => {
          if (!editable && this.state.tableState !== 'uncompleted') {
            dataSource.forEach((val) => {
              if (val.key === key) {
                val.editable = !editable;
              } else {
                val.editable = editable;
              }
            });
            this.setState({
              cellEditable: !cellEditable,
            });
          }
        }}
        onKeyUp={(e) => {
          if (onlyLetters) {
            e.target.value = e.target.value.replace(/[\W]/g, '');
          }
        }}
        onBlur={(e) => {
          if (required && !e.target.value) {
            this.state.tableState = 'uncompleted';
          } else {
            this.state.tableState = 'completed';
          }
        }}
      />
    );
  };

//新增一行
  handleAddTableRecord = () => {
    let {count} = this.state;
    const { dataSource} = this.state;
    const {DescriptionStore} = this.props;
    if (dataSource) {
      //  将其他行设置为不可编辑
      dataSource.forEach((val) => {
        val.editable = false;
      });
    }

    //定义一条新数据，暂时先填充两个字段
    const newData = {
      key: count,//  count为了防止报key重复错误
      editable: true,
      editType:'create',
    };
    count += 1;
    this.setState({
      count: count,
      dataSource: [newData, ...dataSource]
    });
  }
  /*
* @parma新建或者保存按钮
* */


  handleSubmit = () => {
    const {AppState} =this.props
    const {dataSource} = this.state;
      const {organizationId} = AppState.currentMenuType;
      const desDataSource=[];//新建的数据
    const updateDesDataSource=[];//更新的数据
    if (this.checkTableData()) {
      dataSource.forEach((value) => {
        if (value.editType === 'create') {
          value.isSite = this.props.AppState.currentMenuType.type === 'organization' ? 'N' : 'Y'
          desDataSource.push(value)
        } else if (value.editType === 'update') {
          updateDesDataSource.push(value)
        }
      })
      if (desDataSource.length >= 1) {
        descriptionStore.createDes(organizationId, desDataSource).then((data) => {
          if (typeof data !== 'number') {
          } else {
            this.handleRefresh();
            Choerodon.prompt(intl.formatMessage({id: 'create.success'}));
          }
        }).catch((error) => {
          Choerodon.handleResponseError(error);
        });

      }
      if (updateDesDataSource.length >= 1) {
        descriptionStore.updateDes(organizationId, updateDesDataSource).then((data) => {
          if (typeof data !== 'number') {
          } else {
            this.handleRefresh();
            Choerodon.prompt(intl.formatMessage({id: 'create.success'}));
          }
        }).catch((error) => {
          Choerodon.handleResponseError(error);
        });
      }
    }else {
      descriptionStore.getCode('enter.code')
    }
  };

  // 描述维护分页加载
  loadDescriptions = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const {AppState, DescriptionStore} = this.props;
    const {pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState} = this.state;
    const {id} = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    DescriptionStore.loadDescription(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      // 将后台获取的分页信息手动set表格里
      let {count} = this.state;
      data.content.forEach((v)=>{
        v.key = count;
        count += 1;
      })
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

  handlePageChange(pagination, filters, {field, order}, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadDescriptions(pagination, sorter.join(','), filters, params);
  }


  //  渲染表格
  renderTable = () => {
    //  处理列选择事件
    const rowSelection = {
      //  选择记录后，将选中的记录加入selectedCodeValue状态中
      onChange: (selectedRowKeys, selectedCodeValues) => {
        this.setState({selectedCodeValues, selectedRowKeys});
      },
      selectedRowKeys: this.state.selectedRowKeys,
    };
    const {pagination, dataSource} = this.state;
    const {DescriptionStore, AppState, intl} = this.props;
    const {organizationId} = AppState.currentMenuType;
    const languages = DescriptionStore.getLanguagelist;
    const lanOption = []
    languages.forEach((item) => {
      lanOption.push(<Option key={item.code} value={item.code}>{item.description}</Option>);
    });
    //  定义表格列
    const columns = [
      {
        title:this.state.fields['organization.descriptionMiantain.promptCode'],
        dataIndex: 'promptCode',
        key: 'promptCode',
        filters: [],
        width: 200,
        render: (value, record) => {
         return  this.renderTestTableCell(record, value, 'promptCode')
        },
      },
      {
        title: this.state.fields['organization.descriptionMiantain.lang'],
        dataIndex: 'lang',
        key: 'lang',
        width: 200,
        filters: [],
        render: (value, record) => (
          <Select
            onChange={(value) => {
              record.lang = value;
            }}
            getPopupContainer={triggerNode => triggerNode.parentNode}
            defaultValue={record.lang}
            style={{width: 200}}
            allowClear>
            {lanOption}
          </Select>
        ),
      },
      {
        title: this.state.fields['organization.descriptionMiantain.descriptions'],
        dataIndex: 'description',
        key: 'description',
        width: 200,
        filters: [],
        render: (value, record) => this.renderTestTableCell(record, value, 'description'),

      },

    ];

    return (
      <Table
        columns={columns}
        dataSource={dataSource}
        rowSelection={rowSelection}
        pagination={pagination}
        loading={DescriptionStore.isLoading}
        onChange={this.handlePageChange.bind(this)}
        bordered={false}
      />
    );
  };


  render() {
    const {AppState,intl} = this.props;
    const {selectedRowKeys} = this.state;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
    return (
      <Page>
        <Header title={descriptionStore.languages[`${intlPrefix}.descriptiontitle`]}>
          <Button
            onClick={this.handleAddTableRecord}
            style={{ color: '#000000' }}
          >
            <Icon type="xinjian" style={{ color: '#2196F3', width: 25 }} />
            {this.state.fields['create']}
          </Button>

          <Button
            onClick={this.handleSubmit.bind(this)}
            style={{ color: '#04173F' }}
          >
            <Icon type="baocun" style={{ color: '#2196F3', width: 25 }} />
            {this.state.fields['save']}
          </Button>

          <Button
            onClick={this.handleDeleteOk}
            style={{ color: '#04173F' }}
            disabled={selectedRowKeys.length>0?false:true}
          >
            <Icon type="shanchu" style={{ color: '#2196F3', width: 25 }} />
            {this.state.fields['delete']}
          </Button>
        </Header>
        <Content>
          {/* 渲染表格结构 */}
          {this.renderTable()}
          <Modal
            title={intl.formatMessage({id: `${intlPrefix}.action.delete.model`})}
            visible={this.state.deleteVisible}
            onOk={this.handleDeleteOk}
            onCancel={this.handleDeleteCancel}
            confirmLoading={this.state.confirmDeleteLoading}
            center
          />
        </Content>

      </Page>
    );
  }
}

export default withRouter(injectIntl(DescriptionHome));
