import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { Page, Header, Content, Permission, Action, axios } from 'yqcloud-front-boot';
import { Button, Table, Tabs, Modal, Icon, Tooltip, Switch, Checkbox, Input, Popover, message, Popconfirm, Progress, Form, Select, Col, Row, } from 'yqcloud-ui';
import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { withRouter } from 'react-router-dom';
import './editIndex.scss';
import './LOGOUpload.scss'
import img from '../../../../assets/images/logo.svg'
import 'react-image-crop/lib/ReactCrop.scss';
import 'react-image-crop/dist/ReactCrop.css';
import TabOne from './tabOne';
import TabTwoNew from './tabTwo-new';
import TabTwo from './tabTwo';
import TabThree from './tabThree';
import TabFour from './tabFour';
import TabFive from './tabFive';
import ServicePortalStore from "../../../../stores/organization/servicePortal";

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
const intlPrefix = 'organization.servicePortal';

@injectIntl
@inject('AppState')
@observer
class EditServicePortalHomes extends Component {
  constructor(props) {
    super(props);
    this.organizationId = this.props.AppState.currentMenuType.id;
    this.organizationName = this.props.AppState.currentMenuType.name;
    this.state = {
      enabledSubmitting:false
    }
  }

  componentWillMount() {
    this.loadLanguage();
    this.servicePortalTypeQuery();
    this.getTabOne();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    const { id } = AppState.currentMenuType;
    ServicePortalStore.queryLanguage(id, AppState.currentLanguage);
  };

  getTabOne=()=> {
    const {ServicePortalStore}=this.props;
    const urlData = this.getUrlParams(this.props.location.search);
    ServicePortalStore.getPortalDetails(this.organizationId,urlData.idData).then(infoData=>{
      this.setState({
        infoData:infoData,
      })
    })
  };

  //  门户类型快码查询
  servicePortalTypeQuery= () => {
    const code = "PORTAL_TYPE";
    axios.get(`fnd/v1/${this.organizationId}/lookup/value/dto/site?lookupTypeCode=${code}`).then(
      data => {
        this.setState({
          servicePortalTypeCode: data
        })
      })
  };

  // 分离url获得ID
  getUrlParams = (url) => {
    var pattern = /(\w+)=(\w+)/ig;//定义正则表达式
    var parames = {};//定义数组
    url.replace(pattern, function (a, b, c) {
      parames[b] = c;
    });
    return parames;//返回这个数组.
  };

  // 传递
  handleTabOne=()=>{
    this.getTabOne();
  };

  // 失效
  enabledFalse=()=>{
    const {ServicePortalStore}=this.props;
    const {infoData}=this.state;
    infoData.enabled=false;
    this.setState({enabledSubmitting:true});
    ServicePortalStore.setEnabledFalse(this.organizationId,infoData).then(item=>{
      if(!item.failed){
        Choerodon.prompt('已失效');
        this.getTabOne();
        this.setState({enabledSubmitting:false});
      }else {
        Choerodon.prompt(item.message);
      }
    })
  };

  // 生效
  enabledTrue=()=>{
    const {ServicePortalStore}=this.props;
    const {infoData}=this.state;
    infoData.enabled=true;
    this.setState({enabledSubmitting:true});
    ServicePortalStore.setEnabledFalse(this.organizationId,infoData).then(item=>{
      if(!item.failed){
        Choerodon.prompt('已生效');
        this.getTabOne();
        this.setState({enabledSubmitting:false});
      }else {
        Choerodon.prompt(item.message);
      }
    })
  };

  tabOnChange = (e) =>{
    if(e==='1'){
      this.child.getTabOne();
    }
  }

  onChangeThis = (e) =>{
    this.child = e
  }

  render() {
    const {infoData} = this.state;
    let optionArrText = '';
    let colorData='';
    if(this.state.servicePortalTypeCode){
      this.state.servicePortalTypeCode.forEach(item=>{
        if(infoData){
          if(infoData.typeCode===item.lookupValue){
            optionArrText=item.lookupMeaning;
            if(infoData.typeCode==='KNOWLEDGE'){
              colorData = '#FFAD29';
            }else if(infoData.typeCode==='SERVICE'){
              colorData = '#9080FF';
            }else if(infoData.typeCode==='PROJECT'){
              colorData = '#4DB5FF';
            }else if(infoData.typeCode==='PRODUCT'){
              colorData = '#43DCD6';
            }
          }
        }
      })
    }


    return (
      <Page className="editServicePortal">
        <Header
          title={ServicePortalStore.languages[`${intlPrefix}.edit.title`]}
          backPath={`/iam/servicePortals?type=organization&id=${this.organizationId}&name=${this.organizationName}&organizationId=${this.organizationId}`}
        />
        <Content className="editServicePortal_content">
          <div>

            <div className="editServicePortal_harder">
              <div className="editServicePortal_harder_logo">
                <img style={{border:this.state.infoData&&this.state.infoData.portalIconUrl?'none': '1px solid rgba(232,232,232,1)'}} height='64px' src={this.state.infoData&&this.state.infoData.portalIconUrl?this.state.infoData.portalIconUrl:img} />
              </div>

              <div className="editServicePortal_harder_text">
                <div className="editServicePortal_harder_text_div">
                  <div className="editServicePortal_harder_text_gateway">{this.state.infoData?this.state.infoData.portalName:''}</div>
                  <div
                    className="editServicePortal_harder_text_type"
                    style={{
                      background:colorData
                    }}
                  >
                    {optionArrText}
                  </div>
                </div>
                <div style={{marginTop:'6px'}}>
                  <span>
                    <span>
                     <Icon
                       type="jihuashijian"
                       style={{
                         fontSize: '16px',
                         // marginLeft: '16px',
                         cursor: 'pointer',
                         color: '#595959',
                         verticalAlign: 'inherit',
                       }}
                     />
                     <span style={{color:'#595959',marginLeft:'4px'}}>{this.state.infoData?this.state.infoData.creationDate:''}</span>
                    </span>

                    <span style={{marginLeft:'24px'}}>
                     <Icon
                       type="kehu-beizhu"
                       style={{
                         fontSize: '16px',
                         // marginLeft: '16px',
                         cursor: 'pointer',
                         color: '#595959',
                         verticalAlign: 'inherit',
                       }}
                     />
                    <Tooltip title={this.state.infoData&&this.state.infoData.description?this.state.infoData.description.length>20?this.state.infoData.description:'':''}>
                     <span style={{color:'#595959',marginLeft:'4px'}}>{this.state.infoData&&this.state.infoData.description?this.state.infoData.description.length>20?this.state.infoData.description.substring(0, 19)+'...':this.state.infoData.description:''}</span>
                    </Tooltip>
                    </span>
                  </span>
                </div>
              </div>

              {/*{*/}
                {/*infoData&&infoData.enabled?(*/}
                  {/*<Button*/}
                    {/*style={{*/}
                      {/*zIndex:'99',*/}
                      {/*float: 'right',*/}
                      {/*background:'#fff',*/}
                      {/*border:'1px solid rgba(248,54,64,1)',*/}
                      {/*color: '#F83640'*/}
                    {/*}}*/}
                    {/*loading={this.state.enabledSubmitting}*/}
                    {/*onClick={()=>this.enabledFalse()}*/}
                  {/*>*/}
                    {/*失效*/}
                  {/*</Button>*/}
                {/*):(*/}
                  {/*<Button*/}
                    {/*style={{*/}
                      {/*zIndex:'99',*/}
                      {/*float: 'right',*/}
                      {/*background:'#fff',*/}
                      {/*border:'1px solid #2196F3',*/}
                      {/*color: '#2196F3'*/}
                    {/*}}*/}
                    {/*loading={this.state.enabledSubmitting}*/}
                    {/*onClick={()=>this.enabledTrue()}*/}
                  {/*>*/}
                    {/*生效*/}
                  {/*</Button>*/}
                {/*)*/}
              {/*}*/}

            </div>

            <div className="editServicePortal_tab">
              <Tabs onChange={this.tabOnChange} defaultActiveKey="1" >
                {/* 门户概览 */}
                <TabPane tab={ServicePortalStore.languages[`${intlPrefix}.edit.overview`]} key="1">
                  <TabOne onChangeThis={this.onChangeThis} handleTabOne={this.handleTabOne.bind(this)} urlId={this.getUrlParams(this.props.location.search).idData} />
                </TabPane>

                {/* 导航栏区域 */}
                <TabPane tab={ServicePortalStore.languages[`${intlPrefix}.edit.navTitle`]} key="2">
                  <TabTwoNew urlId={this.getUrlParams(this.props.location.search).idData} />
                </TabPane>

                {/* banner区域 */}
                <TabPane tab={ServicePortalStore.languages[`${intlPrefix}.edit.bannerTitle`]} key="3">
                  <TabTwo urlId={this.getUrlParams(this.props.location.search).idData} />
                </TabPane>

                {/* 目录区域 */}
                <TabPane tab={ServicePortalStore.languages[`${intlPrefix}.edit.catalogTitle`]} key="4">
                  <TabThree urlId={this.getUrlParams(this.props.location.search).idData} />
                </TabPane>

                {/* 资源区域 */}
                <TabPane tab={ServicePortalStore.languages[`${intlPrefix}.edit.resourcesTitle`]} key="5">
                  <TabFour urlId={this.getUrlParams(this.props.location.search).idData} />
                </TabPane>

                {/* 侧栏 */}
                <TabPane tab={ServicePortalStore.languages[`${intlPrefix}.edit.sideBar`]} key="6">
                  <TabFive urlId={this.getUrlParams(this.props.location.search).idData} />
                </TabPane>
              </Tabs>
            </div>
          </div>
        </Content>
      </Page>
    )
  }
}

const Demo = Form.create()(EditServicePortalHomes);
const EditServicePortalHome = DragDropContext(HTML5Backend)(Demo);

export default withRouter(injectIntl(EditServicePortalHome));
