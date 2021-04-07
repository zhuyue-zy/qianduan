import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { Page, Header, Content, Permission, Action } from 'yqcloud-front-boot';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Switch, Checkbox, Input, Popover, message, Popconfirm, Progress, Form } from 'yqcloud-ui';
import './index.scss';
import uuid from 'uuid/v1';
import { cloneDeep } from 'lodash';
import { toJS } from 'mobx';
import PortalManagementStore from '../../../../stores/organization/portalManagement/PortalManagementStore';
import MultiLanguageFormItem from './MultiLanguageFormItem';
import { AddBtn, UploadBtn, TitleBar, Info, WithCutImageUpload, TextField } from '../../../../components/CommonComponent/jui';
import DragTable from './DragTable';

const ICONS = ['xiangmutubiao-2', 'xiangmutubiao-', 'xiangmutubiao-1', 'xiangmutubiao-3', 'xiangmutubiao-4', 'xiangmutubiao-5', 'xiangmutubiao-6'];
const PREFIX = 'organization.portalManagement.';
@injectIntl
@inject('AppState')
@observer
class PortalManagementHome extends Component {
  constructor(props) {
    super(props);

    this.organizationId = this.props.AppState.menuType.organizationId;
    this.state = {
      openUpload: false,
      multiLanguageValue: {},
      error: {
        domainName: '',
      },

    };
  }

  componentDidMount() {
    const data = { organizationId: this.organizationId };
    PortalManagementStore.getPortalInfo(data);
    PortalManagementStore.getProjectList(data);
    PortalManagementStore.queryLanguage(this.organizationId, this.props.AppState.currentLanguage);
    PortalManagementStore.queryLanguageEnv();
    // 空白关闭
    document.addEventListener('click', this.closeAllJselection);
  }

  closeAllJselection() {
    const portalProjectList = toJS(PortalManagementStore.portalProjectList);
    portalProjectList.map((item) => {
      if (item.openSelectList) {
        delete item.openSelectList;
      }
    });
    PortalManagementStore.setPortalList(portalProjectList);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closeAllJselection);
  }

  stopPropagation(e) {
    e.nativeEvent.stopImmediatePropagation();
  }

  setVisible(openUpload) {
    this.setState({ openUpload });
  }

  onUploadFinish(result, type) {
    const _info = { ...PortalManagementStore.info };
    if (type === 'submit') {
      if (this.state.imageType === 'LOGO') {
        _info.logo = result.imageUrl;
      } else {
        _info.backgroundImage = result.imageUrl;
      }
      PortalManagementStore.setInfo(_info);
    }
    this.setState({
      openUpload: false,
    });
  }

  resetImage(type) {
    const _info = { ...PortalManagementStore.info };
    if (type === 'LOGO') {
      _info.logo = '';
    } else {
      _info.backgroundImage = '';
    }
    PortalManagementStore.setInfo(_info);
  }

  uploadLogo() {
    this.setState({
      openUpload: true,
      imageType: 'LOGO',
    });
  }

  uploadBackgroudImage() {
    this.setState({
      openUpload: true,
      imageType: 'BG',
    });
  }

  validateDomainName(error, val) {
    const reg = /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;
    error.domainName = '';
    if (val) {
      if (!reg.test(`${val}.portal.cloopm.com`)) {
        error.domainName = PortalManagementStore.languages[`${PREFIX}domainError`];
        return error;
      }
    } else {
      error.domainName = PortalManagementStore.languages[`${PREFIX}cannot.empty`];
    }
    return error;
  }

  validateServiceHotline(error, val) {
    const reg = /^[+]?[\d|-]{1,}$/;
    error.serviceHotline = '';
    if (!reg.test(val)) {
      error.serviceHotline = PortalManagementStore.languages[`${PREFIX}hotlineError`];
      return error;
    }
    return error;
  }

  onInputChange(key, val) {
    const _info = { ...PortalManagementStore.info };
    _info[key] = val;

    let { error } = this.state;
    if (key === 'domainName') {
      error = this.validateDomainName(error, val);
    }

    if (key === 'serviceHotline') {
      error = this.validateServiceHotline(error, val);
    }

    if (key === 'isOpenHotline') {
      // 热线关闭 清空错误信息
      if (val === 'N') {
        error.serviceHotline = '';
      }
    }

    this.setState({ error });

    PortalManagementStore.setInfo(_info);
    setTimeout(() => {
      this.forceUpdate();
    }, 100);
  }

  closeAllSelect(list) {
    list.map((item) => {
      delete item.openSelectList;
    });
    return list;
  }

  onSelectClick(record, index) {
    let portalProjectList = toJS(PortalManagementStore.portalProjectList);
    portalProjectList = this.closeAllSelect(portalProjectList);
    portalProjectList[index].openSelectList = !portalProjectList[index].openSelectList;
    PortalManagementStore.setPortalList(portalProjectList);
  }

  onSwitchChange(record, checked, index) {
    const portalProjectList = toJS(PortalManagementStore.portalProjectList);
    portalProjectList[index].isFoldInPortal = checked ? 'Y' : 'N';
    if (!portalProjectList[index].hasOwnProperty('isAdd')) {
      portalProjectList[index].isEdit = true;
    }
    PortalManagementStore.setPortalList(portalProjectList);
  }

  onOptionClick(option, record, index) {
    const portalProjectList = toJS(PortalManagementStore.portalProjectList);
    // 查看当前选中是否在已有项目里包含
    const _index = portalProjectList.findIndex(item => item.projectId === option.projectId);
    if (~_index && _index != index) {
      message.warning(PortalManagementStore.languages[`${PREFIX}projectExisted`]);
      return;
    }

    // 修改当前行信息
    portalProjectList[index].projectId = option.projectId;
    portalProjectList[index].projectCode = option.projectCode;
    portalProjectList[index].projectName = option.projectName;
    portalProjectList[index].projectAbbreviation = option.projectAbbreviation;
    portalProjectList[index].lastUpdateDate = option.lastUpdateDate;
    portalProjectList[index].openSelectList = false;
    PortalManagementStore.setPortalList(portalProjectList);
  }

  onIconChange(record, index, value) {
    const portalProjectList = toJS(PortalManagementStore.portalProjectList);
    portalProjectList[index].projectIcon = value;
    if (!portalProjectList[index].hasOwnProperty('isAdd')) {
      portalProjectList[index].isEdit = true;
    }
    PortalManagementStore.setPortalList(portalProjectList);
  }

  onAddClick() {
    if (!PortalManagementStore.projectList || PortalManagementStore.projectList.length == 0) {
      message.warning(PortalManagementStore.languages[`${PREFIX}noAvailProject`]);
      return;
    }

    if (PortalManagementStore.projectList
      && PortalManagementStore.projectList.length
      && PortalManagementStore.portalProjectList
      && PortalManagementStore.portalProjectList.length
      && PortalManagementStore.projectList.length === PortalManagementStore.portalProjectList.length) {
      message.warning(PortalManagementStore.languages[`${PREFIX}noMoreAvailProject`]);
      return;
    }

    const portalProjectList = toJS(PortalManagementStore.portalProjectList) || [];
    const blankRow = {
      isAdd: true,
      _id: uuid(),
      projectId: '',
      projectCode: '',
      projectName: '',
      projectIcon: ICONS[0],
      isFoldInPortal: 'N',
      lastUpdateDate: '',
      openSelectList: false,
    };
    portalProjectList.unshift(blankRow);
    PortalManagementStore.setPortalList(portalProjectList);
  }

  onSaveRow(record, index) {
    delete record._id;
    const data = {
      organizationId: this.organizationId,
      iamOrganizationId: this.organizationId,
      portalId: PortalManagementStore.info.id,
      ...record,
    };
    PortalManagementStore.saveRow(data);
  }

  onCancelRow(record, index) {
    const portalProjectList = toJS(PortalManagementStore.portalProjectList) || [];
    portalProjectList.splice(index, 1);
    PortalManagementStore.setPortalList(portalProjectList);
  }

  onMoveRow(dragIndex, hoverIndex) {
    const portalProjectList = toJS(PortalManagementStore.portalProjectList) || [];
    const { length } = portalProjectList;
    const data = {
      organizationId: this.organizationId,
      iamOrganizationId: this.organizationId,
    };
    if (hoverIndex === length - 1) {
      // 移到最后 直接操作行
      data.portalProjects = [portalProjectList[dragIndex]];
    } else if (hoverIndex > dragIndex && hoverIndex < length - 1) {
      // 移到后面的某一行A前 传操作行（行号改为A的行号）+ A以及后面所有行
      portalProjectList[dragIndex].rankNumber = portalProjectList[hoverIndex].rankNumber;
      data.portalProjects = [].concat(portalProjectList[dragIndex]).concat(portalProjectList.splice(hoverIndex, length - hoverIndex - 1));
    } else if (hoverIndex < dragIndex && hoverIndex > -1) {
      // 移到前面的某一行A前 传操作行（行号改为A的行号）+ A以及后面所有行（不包含原来的自己）
      portalProjectList[dragIndex].rankNumber = portalProjectList[hoverIndex].rankNumber;
      const dragEle = portalProjectList[dragIndex];
      portalProjectList.splice(dragIndex, 1);
      data.portalProjects = [dragEle].concat(portalProjectList.splice(hoverIndex, length - hoverIndex - 2));
    }

    PortalManagementStore.sortRow(data);
  }

  getSelectList(record, index) {
    const checkClass = record.openSelectList ? 'jselector-checked' : '';
    const disableClass = record.isAdd ? '' : 'jselector-disabled';

    return (
      <div key={`jselector_${record.projectId}_${index}`} className={`jselector ${checkClass} ${disableClass}`}>
        <div
          className="jselector-text-box"
          onClick={(e) => {
            if (disableClass) {
              return;
            }
            this.onSelectClick(record, index);
            this.stopPropagation(e);
          }}
        >
          <input type="text" value={record.projectCode} />
          <i className="jselector-arrow" />
        </div>
        {record.openSelectList
          ? (
            <div className="jselector-value-box" onClick={(e) => { this.stopPropagation(e); }}>
              <div className="jselector-scroll-hide-wrap">
                {PortalManagementStore.projectList.map((item) => {
                  let style = '';
                  if (item.projectId === record.projectId) {
                    style = 'jselector-option-item-checked';
                  }
                  const _project = PortalManagementStore.portalProjectList.find(o => o.projectId === item.projectId);
                  if (!_project || (_project && _project.projectId == record.projectId)) {
                    return (
                      <div
                        key={`${record.rankNumber}optionRow_${item.projectId}${Math.random(0, 1)}`}
                        className={`jselector-option-item ${style}`}
                        onClick={() => this.onOptionClick(item, record, index)}
                      >
                        <span style={{ width: '120px', paddingRight: 40 }}> {item.projectCode}</span>
                        <span style={{ width: '170px' }}> {item.projectName}</span>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )
          : null
      }
      </div>
    );
  }

  getSwitch(record, index) {
    return (
      <div>
        <Switch
          checked={record.isFoldInPortal === 'Y'}
          onChange={(checked) => {
            this.onSwitchChange(record, checked, index);
          }}
        />
      </div>
    );
  }

  getProjectIcon(record, index) {
    const content = (
      <div key={`pop_${record.projectId}_${index}`} className="jflex-wrap-space" style={{ width: 157, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {ICONS.map(item => <Icon className="project-icon" type={item} onClick={() => { this.onIconChange(record, index, item); }} />)}
      </div>
    );
    return (
      <Popover placement="right" title={PortalManagementStore.languages[`${PREFIX}customIcon`]} content={content} trigger="click">
        <Icon className="project-icon project-icon-checked" type={record.projectIcon} />
      </Popover>
    );
  }

  renderEditOption(record, index) {
    return (
      <div>
        {/* <Icon className='pointer' style={{ color: '#2196F3', padding: '5px 10px', display: 'inline-block' }} type='shu-bianjibaocun' onClick={() => { this.onSaveRow(record, index) }} /> */}
        <Icon className="pointer" style={{ color: '#B8BECC ', padding: '5px 10px', display: 'inline-block' }} type="shu-bianjiquxiao" onClick={() => { this.onCancelRow(record, index); }} />
      </div>
    );
  }

  renderDelOption(record, index) {
    return (
      <Popconfirm
        title={PortalManagementStore.languages[`${PREFIX}sureDelete`]}
        okText={PortalManagementStore.languages[`${PREFIX}confirm`]}
        cancelText={PortalManagementStore.languages[`${PREFIX}cancel`]}
        onConfirm={() => {
          const data = {
            organizationId: this.organizationId,
            iamOrganizationId: this.organizationId,
            ...record,
          };
          PortalManagementStore.deleteProject(data);
        }}
      >
        <Icon
          className="pointer"
          style={{ color: '#2196F3', padding: '5px 10px', display: 'inline-block' }}
          type="shu-shanchu"
        />
      </Popconfirm>

    );
  }

  getOptions(record, index) {
    if (record.isAdd) {
      return this.renderEditOption(record, index);
    }

    return this.renderDelOption(record, index);
  }

  renderColumns = (text, record, key) => (
    <div>
      {record[key] || '--'}
    </div>
  )

  renderSort(record, index) {
    if (record.isAdd) {
      return null;
    }
    return (
      <div className="pointer">
        <Icon style={{ display: 'inline-block' }} type="dehaze" />
      </div>
    );
  }

  getColums() {
    return [{
      title: PortalManagementStore.languages[`${PREFIX}sort`],
      dataIndex: 'sort',
      render: (text, record, index) => this.renderSort(record, index),
    }, {
      title: PortalManagementStore.languages[`${PREFIX}projectCode`],
      dataIndex: 'projectCode',
      render: (text, record, index) => this.getSelectList(record, index),
    }, {
      title: PortalManagementStore.languages[`${PREFIX}projectName`],
      dataIndex: 'projectName',
      render: (text, record) => this.renderColumns(text, record, 'projectName'),
    }, {
      title: PortalManagementStore.languages[`${PREFIX}projectAbbreviation`],
      dataIndex: 'projectAbbreviation',
      render: (text, record) => this.renderColumns(text, record, 'projectAbbreviation'),
    }, {
      title: PortalManagementStore.languages[`${PREFIX}lastUpdateDate`],
      dataIndex: 'lastUpdateDate',
      render: (text, record) => this.renderColumns(text, record, 'lastUpdateDate'),
    }, {
      title: PortalManagementStore.languages[`${PREFIX}projectIcon`],
      dataIndex: 'projectIcon',
      render: (text, record, index) => this.getProjectIcon(record, index),
    }, {
      title: PortalManagementStore.languages[`${PREFIX}isFoldInPortal`],
      dataIndex: 'isFoldInPortal',
      render: (text, record, index) => this.getSwitch(record, index),
    }, {
      title: PortalManagementStore.languages[`${PREFIX}operation`],
      dataIndex: 'operation',
      render: (text, record, index) => this.getOptions(record, index),
    }];
  }

  // 加载样式
  getLoadingDom = () => {
    if (PortalManagementStore.loading) {
      return (
        <div style={{ position: 'absolute', top: '20px', left: '50%', margin: '0 -25px' }}>
          <Progress type="loading" />
        </div>
      );
    }
  }

  render() {
    const { domainName, serviceHotline, iamOrgCode, welcomeMessage, isOpenChatRobot, isOpenHotline, logo, backgroundImage, id } = PortalManagementStore.info;
    const data = toJS(PortalManagementStore.portalProjectList);
    let title = <div className="jflex">{PortalManagementStore.languages[`${PREFIX}uploadLogo`]}<Info style={{ marginLeft: 30 }} info={PortalManagementStore.languages[`${PREFIX}uploadInfoForLogo`]} /></div>;
    let accepts = '.png';
    if (this.state.imageType == 'BG') {
      title = <div className="jflex">{PortalManagementStore.languages[`${PREFIX}uploadBackgroundImage`]}<Info style={{ marginLeft: 30 }} info={PortalManagementStore.languages[`${PREFIX}uploadInfoForBackgroundImage`]} /></div>;
      accepts = '.jpg,.jpeg,.png';
    }
    const requestUrl = id ? `itsm/v1/portal/${this.organizationId}/language/${id}?columnName=welcome_message` : null;

    return (
      <Page
        service={[
          'yqcloud-itsm-service.portal.queryById',
          'yqcloud-itsm-service.portal.queryMultiLanguageSite',
          'yqcloud-itsm-service.portal.save',
          'yqcloud-itsm-service.portal-project.sort',
          'yqcloud-project-service.project.queryProject',
          'yqcloud-itsm-service.portal-project.delete',
          'yqcloud-itsm-service.portal-project.create',
          'iam-service.organization.queryOrg',
        ]}
      >
        <Header title={PortalManagementStore.languages[`${PREFIX}portalManagement`]} />
        <Content className="page-portal">
          {this.getLoadingDom()}
          <section className="section-form jflex">
            <div className="info">
              <TitleBar title={PortalManagementStore.languages[`${PREFIX}baseInfo`]} />
              <div className="jflex">
                <div className="label-box shrink0">
                  <div className="info-item">
                    <span className="info-item-label"><span style={{ position: 'absolute', left: -10, color: 'red' }}>*</span>{PortalManagementStore.languages[`${PREFIX}domain`]}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-item-label">{PortalManagementStore.languages[`${PREFIX}welcomeMessage`]}:</span>
                  </div>
                  <div className="info-item jflex">
                    <span className="info-item-label" />
                  </div>
                </div>
                <div className="value-box shrink0">
                  <div className="info-item">
                    :
                    <TextField
                      style={{ width: 200, marginLeft: 10, display: 'inline-block' }}
                      placeholder={PortalManagementStore.languages[`${PREFIX}pleaseInput`] + PortalManagementStore.languages[`${PREFIX}domain`]}
                      // value={domainName || (iamOrgCode && iamOrgCode.toLowerCase()) || ''}
                      value={domainName || ''}
                      message={this.state.error.domainName}
                      onChange={(e, a, b) => {
                        this.onInputChange('domainName', e.target.value);
                      }}
                    />.portal.cloopm.com
                  </div>
                  <div className="info-item">
                    <MultiLanguageFormItem
                      requestUrl={requestUrl}
                      isRequestUrl
                      handleMultiLanguageValue={({ retObj, field }) => {
                        // const { form: { setFieldsValue } } = this.props;
                        this.setState({
                          multiLanguageValue: {
                            ...this.state.multiLanguageValue,
                            welcome_message: retObj,
                          },
                        });
                        this.onInputChange('welcomeMessage', retObj.zh_CN);
                      }}
                      inputWidth={324}
                      type="FormItem"
                      value={PortalManagementStore.info.welcomeMessage}
                      field="welcomeMessage"
                      descriptionObject={PortalManagementStore.languages.multiLanguage}
                      languageEnv={PortalManagementStore.languageEnv}
                      FormLanguage={this.state.multiLanguageValue}
                    />
                  </div>
                  <div className="info-item jflex" style={{ marginLeft: -63 }}>

                    <div style={{ marginRight: 50, marginLeft: 10 }}>
                      <Switch
                        className="jmr20 shrink0"
                        checked={isOpenChatRobot === 'Y'}
                        onChange={(checked) => {
                          this.onInputChange('isOpenChatRobot', checked ? 'Y' : 'N');
                        }}
                      />
                      {PortalManagementStore.languages[`${PREFIX}customer`]}
                    </div>
                    <div className="jflex">
                      <Switch
                        className="jmr20 shrink0"
                        style={{ marginTop: 4 }}
                        checked={isOpenHotline === 'Y'}
                        onChange={(checked) => {
                          this.onInputChange('isOpenHotline', checked ? 'Y' : 'N');
                        }}
                      />
                      {PortalManagementStore.languages[`${PREFIX}serviceHotline`]}

                      {isOpenHotline === 'Y'
                        ? (
                          <TextField
                            className="shrink0"
                            style={{ width: 107, marginLeft: 10, display: 'inline-block' }}
                            placeholder={PortalManagementStore.languages[`${PREFIX}pleaseInput`] + PortalManagementStore.languages[`${PREFIX}serviceHotline`]}
                            defaultValue={serviceHotline || ''}
                            message={this.state.error.serviceHotline}
                            onChange={(e, a, b) => {
                              this.onInputChange('serviceHotline', e.target.value);
                            }}
                          />
                        )
                        : null}

                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="upload">
              <TitleBar title={PortalManagementStore.languages[`${PREFIX}uploadImage`]} subNode={<Info info={PortalManagementStore.languages[`${PREFIX}uploadInfo`]} />} />
              <div className="jflex jmt20">
                <div style={{ marginRight: 60 }}>
                  <p>LOGO</p>
                  {logo
                    ? (
                      <div className="pointer">
                        <div className="img-wrap">
                          <img src={logo} alt="logo" />
                          <div className="tc img-reset-bar pointer" onClick={() => { this.resetImage('LOGO'); }}>
                            <Icon
                              style={{ display: 'inline-block', color: 'white' }}
                              type="shu-shanchu"
                            />
                          </div>
                        </div>
                        <p className="jmt5 hover-color" onClick={this.uploadLogo.bind(this)}>{PortalManagementStore.languages[`${PREFIX}reupload`]}</p>
                      </div>
                    )
                    : (
                      <div className="pointer" onClick={this.uploadLogo.bind(this)}>
                        <UploadBtn style={{ margin: '16px 0 12px' }} onClick={() => { }} />
                        <p className="hover-color">{PortalManagementStore.languages[`${PREFIX}upload`]}</p>
                      </div>
                    )}
                </div>
                <div>
                  <p>{PortalManagementStore.languages[`${PREFIX}backgroundImage`]}</p>
                  {backgroundImage
                    ? (
                      <div className="pointer">
                        <div className="img-wrap">
                          <img src={backgroundImage} alt="logo" />
                          <div className="tc img-reset-bar pointer" onClick={() => { this.resetImage('BG'); }}>
                            <Icon
                              style={{ display: 'inline-block', color: 'white' }}
                              type="shu-shanchu"
                            />
                          </div>
                        </div>
                        <p className="jmt5 hover-color" onClick={this.uploadBackgroudImage.bind(this)}>{PortalManagementStore.languages[`${PREFIX}reupload`]}</p>
                      </div>
                    )
                    : (
                      <div className="pointer" onClick={this.uploadBackgroudImage.bind(this)}>
                        <UploadBtn style={{ margin: '16px 0 12px' }} onClick={() => { }} />
                        <p className="hover-color">{PortalManagementStore.languages[`${PREFIX}upload`]}</p>
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
          </section>
          <section style={{ marginTop: 70, marginBottom: 50 }}>
            <TitleBar
              style={{ marginBottom: 20 }}
              title={PortalManagementStore.languages[`${PREFIX}portalProject`]}
              subNode={
                <AddBtn label={PortalManagementStore.languages[`${PREFIX}addProject`]} onClick={e => this.onAddClick()} />
              }
            />
            <DragTable
              pagination={false}
              loading={PortalManagementStore.saveLoading}
              rowKey={record => record.projectId || record._id || uuid()}
              dataSource={data}
              columns={this.getColums()}
              onMoveRow={this.onMoveRow.bind(this)}
            />
          </section>
          <section style={{ background: 'white', position: 'fixed', bottom: 0, width: '100%', zIndex: 9, paddingBottom: 20 }}>
            <Button
              className="jmr10"
              type="primary"
              funcType="raised"
              style={{ background: '#2196F3', border: '1px solid #2196F3', boxShadow: 'none', color: 'white' }}
              loading={PortalManagementStore.saveLoading}
              onClick={() => {
                // 校验
                const _info = PortalManagementStore.info;
                let { error } = this.state;
                if (_info) {
                  error = this.validateDomainName(error, _info.domainName);
                  if (_info.isOpenHotline == 'Y') {
                    error = this.validateServiceHotline(error, _info.serviceHotline);
                  }

                  for (const key in error) {
                    if (error[key]) {
                      this.setState({ error });
                      message.warning(PortalManagementStore.languages[`${PREFIX}pleaseCheckPageInput`]);
                      return;
                    }
                  }
                }

                // 行信息
                const addList = [];
                const editList = [];
                const err = [];
                PortalManagementStore.portalProjectList && PortalManagementStore.portalProjectList.map((item) => {
                  const data = cloneDeep(item);

                  if (data.isAdd) {
                    if (!item.projectId) {
                      err.push(data);
                      return;
                    }
                    delete data._id;
                    delete data.isAdd;
                    delete data.openSelectList;
                    data.portalId = PortalManagementStore.info.id;
                    addList.push(data);
                  }
                  if (data.isEdit) {
                    if (!item.projectId) {
                      err.push(data);
                      return;
                    }
                    delete data._id;
                    delete data.isEdit;
                    delete data.openSelectList;
                    data.portalId = PortalManagementStore.info.id;
                    editList.push(data);
                  }
                });

                if (err.length) {
                  message.warning(PortalManagementStore.languages[`${PREFIX}havaSomeNoSelect`].replace('${}', 1));
                  return;
                }

                const data = {
                  __tls: {
                    welcome_message: this.state.multiLanguageValue.welcome_message || {
                      zh_CN: PortalManagementStore.info.welcomeMessage,
                      en_US: PortalManagementStore.info.welcomeMessage,
                    },
                  },
                  organizationId: this.organizationId,
                  iamOrganizationId: this.organizationId,
                  ...PortalManagementStore.info,
                  portalProjectList: [].concat(addList).concat(editList),
                };
                PortalManagementStore.saveInfo(data);
              }}
            >{PortalManagementStore.languages[`${PREFIX}save`]}
            </Button>
            <Button
              style={{ background: 'white', border: '1px solid #2196F3', color: '#2196F3' }}
              onClick={() => {
                window.open(PortalManagementStore.info && PortalManagementStore.info.trueUrl || '', '__blank');
              }}
            >{PortalManagementStore.languages[`${PREFIX}check`]}
            </Button>
          </section>
          <WithCutImageUpload
            title={title}
            actionUrl={`fileService/v1/${this.organizationId}/file/picture`}
            fileMaxSize={this.state.imageType === 'BG' ? 10 : 1}
            width={1106}
            ratio={650 / 169.3}
            visible={this.state.openUpload}
            onVisibleChange={this.setVisible.bind(this)}
            response={this.onUploadFinish.bind(this)}
            aspectRatio={200 / 40}
            // aspectRatio={1 / 1}
            accept={accepts}
          />
        </Content>
      </Page>
    );
  }
}

export default Form.create({})(PortalManagementHome);
