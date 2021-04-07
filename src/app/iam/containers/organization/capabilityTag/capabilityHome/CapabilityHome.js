/** 2019/3/18
*作者:高梦龙
*项目名称：能力标签
*/

import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, axios } from 'yqcloud-front-boot';
import { Button, Modal, Tabs, Table, Popconfirm, Input, Select, Icon, Form, message } from 'yqcloud-ui';
import { cloneDeep } from 'lodash';
import MultiLanguageFormItem from './MultiLanguageFormItem';
import CapabilityStore from '../../../../stores/organization/capabilityTag/CapabilityStore';
import './CapabilityHome.scss';

const FormItem = Form.Item;
const intlPrefix = 'organization.capabilityTag';
const { TabPane } = Tabs;
const { Option } = Select;

@inject('AppState')
@observer
class CapabilityHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      isLoading: true,
      params: [],
      filters: {},
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
      sort: '',
      capabilityCount: 0, // 能力标签分类新增行初始值
      capabilityTagCount: 0, // 能力标签新增行初始值
      capabilitySource: [], // 能力标签分类数据
      capabilityTagSource: [], // 能力标签数据
      cellEditable: false, // 控制单元格是否可编辑
      toggleMultiLanguageTableCell: false, //  控制带多语言的表格单元的刷新
      multiLanguageValue: {},
      capabilityData: [], // 获取标签分类数据
      capabilityNewDate: [],
      keyId: '1',
    };
  }

  componentWillMount() {
    const { AppState } = this.props;
    const { id: organizationId, type } = AppState.currentMenuType;
    CapabilityStore.queryLanguageEnv();
  }


  componentDidMount() {
    this.loadCapabilitys();
    this.loadCapabilityTags();
    this.queryCapabilityList();
    this.setState({
      keyId: this.getQueryString('defaultActiveId'),
    });
    this.loadLanguage();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    CapabilityStore.queryLanguage(id, AppState.currentLanguage);
  };

  getQueryString = (name) => {
    const url = window.location.hash;
    const theRequest = {};
    if (url.indexOf('?') !== -1) {
      const str = url.substr(1);
      const strs = str.split('&');
      for (let i = 0; i < strs.length; i += 1) {
        theRequest[strs[i].split('=')[0]] = decodeURI(strs[i].split('=')[1]);
        if (theRequest[name]) {
          return theRequest[name];
        }
      }
    }
  };


  queryCapabilityList = () => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    return axios.get(`fnd/v1/${organizationId}/organizations/label/category/list`).then((data) => {
      this.setState({
        capabilityData: data,
      });
    });
  }

  /**
   *  处理表单输入控件返回的多语言信息
   *  @param value 多语言表单控件中返回的数据
   */
  handleMultiLanguageValue = ({ retObj, retList, field }) => {
    const { form: { setFieldsValue } } = this.props;
    this.multiLanguageValue[field] = retObj;
    this.setState({
      multiLanguageValue: {
        ...this.state.multiLanguageValue,
        description: retObj,
      },
    });
    this.multiLanguageList = retList;
    setFieldsValue({
      [field]: retObj.zh_CN,
    });
  };


  /**
   *  渲染多语言表格单元
   *  @param text 用于表格单元的数据显示
   *  @param record 多语言弹窗中点击确定后改变记录中的数据，
   *  @param requestUrl 请求的url
   *  @param field 要更新的字段名称
   *  @param type 多语言控件的类型，目前只有表单元素和表格元素两种
   */
  renderMultiLanguageTableCell = (text, record, requestUrl, field, type = 'TableCell') => (
    <div>
      <MultiLanguageFormItem
        label={CapabilityStore.languages[`${intlPrefix}.description`]}
        requestUrl={requestUrl}
        handleMultiLanguageValue={({ retObj, retList }) => {
          const { capabilitySource, originCapabilitySource } = this.state;
          const { AppState } = this.props;
          // 添加校验
          const index = capabilitySource.findIndex(item => item[field] === retObj[AppState.currentLanguage]);
          if (~index) {
            record.error = CapabilityStore.languages[`${intlPrefix}.exist`];
          } else {
            record.error = '';
            // 如果值变动 后端校验重复 （这里踢出了自己不变的校验 否则不通过）
            const selfIndex = originCapabilitySource.findIndex(item => item.key === record.key);
            if (selfIndex === -1 || retObj[AppState.currentLanguage] !== originCapabilitySource[selfIndex][field]) {
              CapabilityStore.checkCapability(AppState.currentMenuType.organizationId, retObj[AppState.currentLanguage]).then((json) => {
                const _index = capabilitySource.findIndex(item => item.key === record.key);
                if (json === true) {
                  capabilitySource[_index].error = CapabilityStore.languages[`${intlPrefix}.exist`];
                  this.setState({ capabilitySource });
                } else {
                  record.error = '';
                }
              });
            }
          }


          /* eslint-disable */
          record.__tls = Object.assign(record.__tls || {}, {
            [field]: retObj,
          });
          /* eslint-enable */
          record = Object.assign(record, {
            language: retList,
            [field]: retObj[AppState.currentLanguage],
          });
          const { toggleMultiLanguageTableCell } = this.state;
          this.setState({
            toggleMultiLanguageTableCell: !toggleMultiLanguageTableCell,
          });
        }}
        type={type}
        value={text}
        inputWidth="80%"
        maxLength={20}
        editable={record.editable}
        languageEnv={CapabilityStore.languageEnv}
        handleDoubleClick={() => {
          const { capabilitySource, cellEditable } = this.state;
          const { editable } = record;
          if (!editable && this.state.tableState !== 'uncompleted') {
            capabilitySource.forEach((val) => {
              if (val.key === record.key) {
                val.editable = !editable;
              } else {
                val.editable = editable;
              }
              if (val.editType === 'create') {
                val.editType = 'create';
              } else {
                val.editType = 'update';
              }
            });
            this.setState({
              cellEditable: !cellEditable,
            });
          }
        }
        }
      />
      <p style={{ fontSize: 12, color: 'red' }}>{record.error}</p>
    </div>
  )


  // 能力标签多语言渲染
  renderMultiLanguageTableCellCapability = (text, record, requestUrl, field, type = 'TableCell') => {
    return (
      <div className="cap-tag">
        <MultiLanguageFormItem
          label={CapabilityStore.languages[`${intlPrefix}.description`]}
          requestUrl={requestUrl}
          handleMultiLanguageValue={({ retObj, retList }) => {
            const { capabilityTagSource, originCapabilityTagSource } = this.state;
            const { AppState } = this.props;

            // 添加校验
            const index = capabilityTagSource.findIndex(item => item[field] === retObj[AppState.currentLanguage]);
            // 顺着走，名字相同的数据全部提取出来
            const sameNameData = capabilityTagSource.map((item) => {
              if (item[field] === retObj[AppState.currentLanguage]) {
                return item;
              }
            }).filter(item => item !== undefined);
            if (sameNameData.length > 0) {
              // 存在拥有相同名字
              if (record.categoryName && record.categoryName !== '') {
                // 当编辑的数据拥有categoryName的时候校验
                sameNameData.forEach((item) => {
                  if (item.categoryId === record.categoryId) {
                    record.error = CapabilityStore.languages[`${intlPrefix}.exist`];
                    // throw new Error('123');
                  } else {
                    record.error = '';
                    // 如果值变动 后端校验重复 （这里踢出了自己不变的校验 否则不通过）
                    const selfIndex = originCapabilityTagSource.findIndex(item => item.key === record.key);
                    if (selfIndex === -1 || retObj[AppState.currentLanguage] !== originCapabilityTagSource[selfIndex][field]) {
                      CapabilityStore.checkCapabilityTag(AppState.currentMenuType.organizationId, retObj[AppState.currentLanguage]).then((json) => {
                        const _index = capabilityTagSource.findIndex(item => item.key === record.key);
                        if (json === true) {
                          capabilityTagSource[_index].error = CapabilityStore.languages[`${intlPrefix}.exist`];
                          this.setState({ capabilityTagSource });
                        } else {
                          record.error = '';
                        }
                      });
                    }
                  }
                });
              }
            } else {
              record.error = '';
            }
            /* if (~index) {
                // 同一分类 标签不允许重复
                if (capabilityTagSource[index].categoryId === record.categoryId) {
                  record.error = CapabilityStore.languages[`${intlPrefix}.exist`];
                } else {
                  record.error = '';
                }
              } else {
                record.error = '';
                // 如果值变动 后端校验重复 （这里踢出了自己不变的校验 否则不通过）
                const selfIndex = originCapabilityTagSource.findIndex(item => item.key === record.key)
                if (selfIndex === -1 || retObj[AppState.currentLanguage] !== originCapabilityTagSource[selfIndex][field]) {
                  CapabilityStore.checkCapabilityTag(AppState.currentMenuType.organizationId, retObj[AppState.currentLanguage]).then(json => {
                    const _index = capabilityTagSource.findIndex(item => item.key === record.key)
                    if (json === true) {
                      capabilityTagSource[_index].error = CapabilityStore.languages[`${intlPrefix}.exist`]
                      this.setState({ capabilityTagSource })
                    } else {
                      record.error = ''
                    }
                  })
                }
              } */


            /* eslint-disable */
            record.__tls = Object.assign(record.__tls || {}, {
              [field]: retObj,
            });
            /* eslint-enable */
            record = Object.assign(record, {
              language: retList,
              [field]: retObj.zh_CN,
            });
            const { toggleMultiLanguageTableCell } = this.state;
            this.setState({
              toggleMultiLanguageTableCell: !toggleMultiLanguageTableCell,
            });
          }}
          type={type}
          value={text}
          inputWidth="80%"
          maxLength={20}
          editable={record.editable}
          languageEnv={CapabilityStore.languageEnv}
          handleDoubleClick={() => {
            const { capabilityTagSource, cellEditable } = this.state;
            const { editable } = record;
            if (!editable && this.state.tableState !== 'uncompleted') {
              capabilityTagSource.forEach((val) => {
                if (val.key === record.key) {
                  val.editable = !editable;
                } else {
                  val.editable = editable;
                }
                if (val.editType === 'creates') {
                  val.editType = 'creates';
                } else {
                  val.editType = 'updates';
                }
              });
              this.setState({
                cellEditable: !cellEditable,
              });
            }
          }
          }
        />
        <p style={{ fontSize: 12, color: 'red' }}>{record.error}</p>
      </div>
    )
  }


  // 能力标签分类提交
  handleCapabilitySubmit = () => {
    const { AppState, intl } = this.props;
    const { capabilitySource, capabilityNewDate } = this.state;
    const { organizationId } = AppState.currentMenuType;
    const desDataSource = [];// 新建的数据
    const updateDesDataSource = [];// 更新的数据

    if (~capabilitySource.findIndex(item => item.error)) {
      message.warning(CapabilityStore.languages[`${intlPrefix}.checkCreate`]);
      return;
    }

    capabilitySource.forEach((value) => {
      if (value.editType === 'create') {
        desDataSource.push(value);
      } else if (value.editType === 'update') {
        updateDesDataSource.push(value);
      }
    });
    if (desDataSource.length >= 1) {
      const dats = desDataSource.some((v) => {
        if (v.category === '' && v.editType === 'create') {
          return true;
        }
      });
      if (!dats) {
        CapabilityStore.createCapability(organizationId, desDataSource).then((data) => {
          if (data === 'success') {
            this.loadCapabilitys();
            this.queryCapabilityList();
            Choerodon.prompt(CapabilityStore.languages['create.success']);
          }
        }).catch((error) => {
          Choerodon.handleResponseError(error);
        });
      } else {
        message.warning(CapabilityStore.languages[`${intlPrefix}.unfilled`]);
      }
    }
    if (updateDesDataSource.length >= 1) {
      const updates = updateDesDataSource.some((v) => {
        if (v.category === '' && v.editType === 'update') {
          return true;
        }
      });
      if (!updates) {
        CapabilityStore.createCapability(organizationId, updateDesDataSource).then((data) => {
          if (data === 'success') {
            this.loadCapabilitys();
            this.queryCapabilityList();
            Choerodon.prompt(CapabilityStore.languages['modify.success']);
          }
        }).catch((error) => {
          Choerodon.handleResponseError(error);
        });
      } else {
        message.warning(CapabilityStore.languages[`${intlPrefix}.unfilled`]);
      }
    }
  };


  // 新增能力标签分类一行
  addCapabilityRecord = () => {
    let { capabilityCount } = this.state;
    const { capabilitySource } = this.state;
    const { DescriptionStore } = this.props;
    if (capabilitySource) {
      //  将其他行设置为不可编辑
      capabilitySource.forEach((val) => {
        val.editable = false;
      });
    }

    // 定义一条新数据，暂时先填充两个字段
    const newData = {
      key: capabilityCount, //  count为了防止报key重复错误
      editable: true,
      editType: 'create',
      category: '',
    };
    capabilityCount += 1;
    this.setState({
      capabilityCount,
      capabilitySource: [newData, ...capabilitySource],
      capabilityNewDate: [newData],
    });
  }


  // 能力标签提交
  handleCapabilityTagSubmit = () => {
    const { AppState, intl } = this.props;
    const { capabilityTagSource } = this.state;
    const { organizationId } = AppState.currentMenuType;
    const desDataSources = [];// 新建的数据
    const updateDesDataSources = [];// 更新的数据

    if (~capabilityTagSource.findIndex(item => item.error)) {
      message.warning(CapabilityStore.languages[`${intlPrefix}.checkCreate`]);
      return;
    }

    capabilityTagSource.forEach((value) => {
      if (value.editType === 'creates') {
        desDataSources.push(value);
      } else if (value.editType === 'updates') {
        updateDesDataSources.push(value);
      }
    });
    if (desDataSources.length >= 1) {
      const creates = desDataSources.some((v) => {
        if (v.categoryName === '' || v.name === '') {
          return true;
        }
      });
      if (!creates) {
        CapabilityStore.createCapabilityTag(organizationId, desDataSources).then((data) => {
          if (data === 'success') {
            this.loadCapabilityTags();
            Choerodon.prompt(CapabilityStore.languages['create.success']);
          }
        }).catch((error) => {
          Choerodon.handleResponseError(error);
        });
      } else {
        message.warning(CapabilityStore.languages[`${intlPrefix}.unfilledLabels`]);
      }
    }

    if (updateDesDataSources.length >= 1) {
      const updates = updateDesDataSources.some((v) => {
        if (v.categoryName === '' || v.name === '') {
          return true;
        }
      });
      if (!updates) {
        CapabilityStore.createCapabilityTag(organizationId, updateDesDataSources).then((data) => {
          if (data === 'success') {
            this.loadCapabilityTags();
            Choerodon.prompt(CapabilityStore.languages['modify.success']);
          }
        }).catch((error) => {
          Choerodon.handleResponseError(error);
        });
      } else {
        message.warning(CapabilityStore.languages[`${intlPrefix}.unfilledLabels`]);
      }
    }
  };


  // 对表格进行渲染
  renderTestTableCell = (record, value, field, type, required, focus) => {
    const { cellEditable, capabilityTagSource, capabilityData } = this.state;
    const { editable, key } = record;
    const newCapability = [];
    if (capabilityData.length > 0) {
      capabilityData.forEach((item) => {
        newCapability.push(<Option value={item.category} catagoryIds={item.id}>{item.category}</Option>);
      });
    }
    // 找出标签名称相同的数据
    const sameNameData = capabilityTagSource.map((item) => {
      if (record.name === item.name) {
        return item;
      }
    }).filter(item => item !== undefined);
    return (
      record.editable ? (
        <div>
          <Select
            onChange={(values, option) => {
              // 从标签名称相同的数据中找出分类id相同的数据
              const a = sameNameData.map((item) => {
                if (option.props.catagoryIds === item.categoryId) {
                  return item;
                }
              }).filter(item => item !== undefined);
              // 如果存在数据，那就是已存在了
              if (a.length > 0) {
                record.categoryName = values;
                record.categoryId = option.props.catagoryIds;
                record.error = CapabilityStore.languages[`${intlPrefix}.exist`];
              } else {
                record.categoryName = values;
                record.categoryId = option.props.catagoryIds;
                record.error = '';
              }
              this.setState({ capabilityTagSource });
            }}
            getPopupContainer={triggerNode => triggerNode.parentNode}
            defaultValue={record.categoryName}
            autoFocus={focus}
            style={{ width: 150 }}
            onDoubleClick={() => {
              if (!editable && this.state.tableState !== 'uncompleted') {
                capabilityTagSource.forEach((val) => {
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
          >
            {newCapability}
          </Select>
          <p style={{ fontSize: 12, color: 'red' }}>{record.error}</p>
        </div>
      ) : (
        <Input
          autoFocus={focus}
          underline={false}
          readOnly={!editable || false}
          defaultValue={value}
          style={{ height: 20, marginTop: 5 }}
          onChange={(e) => {
            record[field] = e.target.value;
            if (record.id !== '') {
              record.editType = 'update';
            }
          }}
          onDoubleClick={() => {
            if (!editable && this.state.tableState !== 'uncompleted') {
              capabilityTagSource.forEach((val) => {
                if (val.key === key) {
                  val.editable = !editable;
                } else {
                  val.editable = editable;
                }
                if (val.editType === 'creates') {
                  val.editType = 'creates';
                } else {
                  val.editType = 'updates';
                }
              });
              this.setState({
                cellEditable: !cellEditable,
              });
            }
          }}
        />
      )
    );
  };


  // 新增能力标签一行
  addCapabilityTagRecord = () => {
    let { capabilityTagCount } = this.state;
    const { capabilityTagSource } = this.state;
    const { DescriptionStore } = this.props;
    if (capabilityTagSource) {
      //  将其他行设置为不可编辑
      capabilityTagSource.forEach((val) => {
        val.editable = false;
      });
    }

    // 定义一条新数据，暂时先填充两个字段
    const newData = {
      key: capabilityTagCount, //  count为了防止报key重复错误
      editable: true,
      editType: 'creates',
      categoryName: '',
      name: '',
    };
    capabilityTagCount += 1;
    this.setState({
      capabilityTagCount,
      capabilityTagSource: [newData, ...capabilityTagSource],
    });
  }


  handlePageChange(pagination, filters, { field, order }, params) {
    const sorter = [];
    if (field) {
      sorter.push(field);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    this.loadCapabilitys(pagination, sorter.join(','), filters, params);
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

  // 能力标签分类分页
  loadCapabilitys = (paginationIn, sortIn, filtersIn, paramsIn) => {
    const { AppState } = this.props;
    const { pagination: paginationState, sort: sortState, filters: filtersState, params: paramsState } = this.state;
    const { id } = AppState.currentMenuType;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;

    CapabilityStore.queryCapability(
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
        pagination: {
          current: (data.number || 0) + 1,
          pageSize: data.size || 25,
          total: data.totalElements || '',
          pageSizeOptions: ['25', '50', '100', '200'],
        },
        filters,
        params,
        sort,
        capabilitySource: data.content,
        originCapabilitySource: cloneDeep(data.content),
        capabilityCount,
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

    CapabilityStore.queryTagCapability(
      id,
      pagination,
      sort,
      filters,
      params,
    ).then((data) => {
      // 将后台获取的分页信息手动set表格里
      let { capabilityTagCount } = this.state;
      data.content.forEach((v) => {
        v.key = capabilityTagCount;
        capabilityTagCount += 1;
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
        originCapabilityTagSource: cloneDeep(data.content),
        capabilityTagCount,
      });
    })
      .catch(
        (error) => {
          Choerodon.handleResponseError(error);
        },
      );
  };


  // 删除能力标签分类
  deleteCapability = (id) => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { capabilitySource } = this.state;
    if (id === undefined) {
      const deleteData = capabilitySource.filter(v => (v.editType === 'create'));
      for (let i = capabilitySource.length - 1; i >= 0; i -= 1) {
        if (deleteData[0].key === capabilitySource[i].key) {
          capabilitySource.splice(i, 1);
        }
        this.setState({
          capabilitySource,
        });
      }
    } else {
      CapabilityStore.deleteCapability(organizationId, id).then((data) => {
        if (data === 'success') {
          this.loadCapabilitys();
          Choerodon.prompt(CapabilityStore.languages[`${intlPrefix}.deleteCapability`]);
        }
      });
    }
  }

  // 删除能力标签
  deleteCapabilityTag = (id) => {
    const { AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const { capabilityTagSource } = this.state;
    if (id === undefined) {
      const deleteTagData = capabilityTagSource.filter(v => (v.editType === 'creates'));
      for (let i = capabilityTagSource.length - 1; i >= 0; i -= 1) {
        if (deleteTagData[0].key === capabilityTagSource[i].key) {
          capabilityTagSource.splice(i, 1);
        }
        this.setState({
          capabilityTagSource,
        });
      }
    } else {
      CapabilityStore.deleteCapabilityTag(organizationId, id).then((data) => {
        if (data === 'success') {
          this.loadCapabilityTags();
          Choerodon.prompt(CapabilityStore.languages[`${intlPrefix}.deleteCapability`]);
        }
      });
    }
  }


  // 打开成员能力标签页面
  openCapabilityPage = (id) => {
    const { AppState } = this.props;
    const { organizationId } = AppState.currentMenuType;
    const menuType = AppState.currentMenuType;
    this.props.history.push(`/iam/capabilityTag/edit/${id}?type=organization&id=${organizationId}&name=${menuType.name}&organizationId=${organizationId}`);
  };

  //  能力标签分类表格
  capabilityTable = () => {
    const { pagination, capabilitySource } = this.state;
    const { DescriptionStore, AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    //  定义表格列
    const columns = [
      {
        title: (<span>{CapabilityStore.languages[`${intlPrefix}.category`]}<span style={{ color: 'red' }}>*</span></span>),
        dataIndex: 'category',
        key: 'category',
        filters: [],
        width: 200,
        render: (text, record) => this.renderMultiLanguageTableCell(
          text,
          record,
          record.id ? `fnd/v1/${organizationId}/organizations/label/category/language?columnName=category&categoryId=${record.id}` : null,
          'category',
        ),
      },
      {
        title: CapabilityStore.languages[`${intlPrefix}.creationDate`],
        dataIndex: 'creationDate',
        key: 'creationDate',
        width: 200,
      },
      {
        title: CapabilityStore.languages.operation,
        key: 'action',
        width: 80,
        render: (values, record) => (
          <Popconfirm
            title={CapabilityStore.languages[`${intlPrefix}.deleteConfirmClass`]}
            icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}
            onConfirm={this.deleteCapability.bind(this, record.id)}
          >
            <Button
              icon="shanchu-icon"
              shape="circle"
              size="small"
            />
          </Popconfirm>
        ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={capabilitySource}
        pagination={pagination}
        onChange={this.handlePageChange.bind(this)}
        bordered={false}
      />
    );
  };

  // 能力标签表格

  capabilityTagTable = () => {
    const { paginations, capabilityTagSource, capabilityData } = this.state;
    const { DescriptionStore, AppState, intl } = this.props;
    const { organizationId } = AppState.currentMenuType;
    //   定义表格列
    const columns = [
      {
        title: (<span>{CapabilityStore.languages[`${intlPrefix}.labelClassify`]}<span style={{ color: 'red' }}>*</span></span>),
        dataIndex: 'categoryName',
        key: 'categoryName',
        width: 200,
        filters: [],
        render: (value, record) => this.renderTestTableCell(record, value, 'categoryName'),
      },
      {
        title: (<span>{CapabilityStore.languages[`${intlPrefix}.labelName`]}<span style={{ color: 'red' }}>*</span></span>),
        dataIndex: 'name',
        key: 'name',
        filters: [],
        width: 150,
        render: (text, record) => this.renderMultiLanguageTableCellCapability(
          text,
          record,
          record.id ? `fnd/v1/${organizationId}/organizations/label/language?columnName=name&labelId=${record.id}` : null,
          'name',
        ),
      },
      {
        title: CapabilityStore.languages[`${intlPrefix}.peopleNumber`],
        dataIndex: 'tagNum',
        key: 'tagNum',
        width: 150,
        render: (text, record) => (
          <span>
            <a style={{ color: '#2196F3' }} onClick={this.openCapabilityPage.bind(this, record.id)}>{text}</a>
          </span>
        ),
      },
      {
        title: CapabilityStore.languages[`${intlPrefix}.creationDate`],
        dataIndex: 'creationDate',
        key: 'creationDate',
        width: 150,
      },
      {
        title: CapabilityStore.languages.operation,
        key: 'action',
        width: 100,
        render: (values, record) => (
          <div>
            <Button
              icon="bianji-"
              style={{ cursor: record.editType === 'creates' ? '' : 'pointer', color: record.editType === 'creates' ? '' : '#2196F3' }}
              shape="circle"
              size="small"
              onClick={this.openCapabilityPage.bind(this, record.id)}
              disabled={record.editType === 'creates' ? 'disabled' : ''}
            />
            <Popconfirm
              title={CapabilityStore.languages[`${intlPrefix}.deleteConfirm`]}
              icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}
              onConfirm={this.deleteCapabilityTag.bind(this, record.id)}
            >
              <Button
                icon="shanchu-icon"
                style={{ cursor: 'pointer' }}
                shape="circle"
                size="small"
              />
            </Popconfirm>
          </div>

        ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={capabilityTagSource}
        pagination={paginations}
        onChange={this.handlePageChanges.bind(this)}
        bordered={false}
      />
    );
  };


  /**
   *  渲染能力标签分类按钮组
   */
  capabilityButtonGroup = () => (
    <div>
      <Button
        style={{ color: '#04173F', marginBottom: 4 }}
        onClick={this.addCapabilityRecord}
      >
        <Icon type="xinjian" style={{ color: '#2196F3' }} />
        {CapabilityStore.languages[`${intlPrefix}.create`]}
      </Button>
      <Button
        style={{ color: '#04173F', marginBottom: 4 }}
        onClick={this.handleCapabilitySubmit.bind(this)}
      >
        <Icon type="baocun" style={{ color: '#2196F3' }} />
        {CapabilityStore.languages.save}
      </Button>

    </div>
  );

  /**
   *  渲染能力标签按钮组
   */
  capabilityButton = () => (
    <div>
      <Button
        style={{ color: '#04173F', marginBottom: 4 }}
        onClick={this.addCapabilityTagRecord}
      >
        <Icon type="xinjian" style={{ color: '#2196F3' }} />
        {CapabilityStore.languages[`${intlPrefix}.create`]}
      </Button>
      <Button
        style={{ color: '#04173F', marginBottom: 4 }}
        onClick={this.handleCapabilityTagSubmit}
      >
        <Icon type="baocun" style={{ color: '#2196F3' }} />
        {CapabilityStore.languages.save}
      </Button>

    </div>
  );

  onChangActivekey = (key) => {
    if (key === '1') {
      this.setState({
        keyId: '1',
      });
    } else {
      this.setState({
        keyId: '2',
      });
    }
  }


  render() {
    const { AppState, intl } = this.props;
    const menuType = AppState.currentMenuType;
    const orgname = menuType.name;
    const { keyId, capabilityCount } = this.state;
    return (
      <Page>
        <Header title={CapabilityStore.languages[`${intlPrefix}.capabilityTitle`]} />
        <Content>
          <Tabs activeKey={keyId === undefined ? '1' : keyId === '1' ? '1' : '2'} onChange={this.onChangActivekey}>
            <TabPane tab={<span style={{ fontSize: '17px' }}>{CapabilityStore.languages[`${intlPrefix}.capabilityClassify`]}</span>} key="1">
              {this.capabilityButtonGroup()}
              {this.capabilityTable()}
            </TabPane>
            <TabPane tab={<span style={{ fontSize: '17px' }}>{CapabilityStore.languages[`${intlPrefix}.capabilityTags`]}</span>} key="2">
              {this.capabilityButton()}
              {this.capabilityTagTable()}
            </TabPane>
          </Tabs>
        </Content>
      </Page>
    );
  }
}
export default Form.create()(withRouter(injectIntl(CapabilityHome)));
