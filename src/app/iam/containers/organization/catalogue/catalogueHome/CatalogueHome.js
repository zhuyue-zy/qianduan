import React, { Component } from 'react';
import { Form, Input} from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import CreateCustomerStore from '../../../../stores/organization/customer/createCustomer/CreateCustomerStore';
import CatalogueStore from '../../../../stores/organization/catalogue/CatalogueStore';
import { Select } from 'yqcloud-ui';
import { Cascader } from 'yqcloud-ui';
import { Col, Row } from 'choerodon-ui';
import { Checkbox, Divider } from 'yqcloud-ui';
import catalogueStore from '../../../../stores/organization/catalogue/CatalogueStore';
const FormItem = Form.Item;
const { Option } = Select;
const intlPrefix = 'organization.customer'; //语言前缀
const inputWidth = 512; // input框的长度
const CheckboxGroup = Checkbox.Group;

const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 100 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 10 },
    },
  };
  
  
  function noop() {
  }
  
  @inject('AppState')
  @observer
  class CatalogueHome extends Component {
    state = this.getInitState();
  
    componentWillMount() {
      const catalogueLists = CatalogueStore.getDefaultCatalogueList;
      const defaultCatalogueLists = CatalogueStore.getDefaultCatalogueList;
      const lanOption_Cat = [];
      const lanOption_Def = [];
      catalogueLists.forEach((item) => {
        lanOption_Cat.push(item.catalogueName);
      });
      defaultCatalogueLists.forEach((item) => {
        lanOption_Def.push(item.catalogueDisplayName);
      });
    //  this.props.onRef(this);
      this.fetch(this.props);
      this.loadLanguage();
  
    }
  
  
  
    handleRefush=() => {
      this.setState(this.getInitState(), () => {
        this.loadLanguage();
        this.fetch(this.props);
      });
    }
  
    componentWillReceiveProps(nextProps) {
      if (!nextProps.visible) {
        nextProps.form.resetFields();
        this.setState(this.getInitState());
      } else if (!this.props.visible) {
        this.fetch(nextProps);
      }
    }
  
    getInitState() {
      return {
        rePasswordDirty: false,
        catalogueInfo: {
            projectName:'',
          objectVersionNumber: '',
        },
        //checkedList: lanOption_Def,
        indeterminate: true,
        checkAll: false,
        oldCustomerId: 0,
        oldCatalogueIsEnabled: 'Y',
        oldCatalogueIsDeleted: 'N',
        lanOption_Cat:[],
        lanOption_Def:[],
      };
      
    }
  
    loadLanguage=() => {
      const { AppState } = this.props;
      const { id } = AppState.currentMenuType;
      CatalogueStore.queryLanguage(id, AppState.currentLanguage);
    }
  
  
  
    fetch(props) {
      const { AppState, edit, customerId ,projectId} = props;
      const { id: organizationId } = AppState.currentMenuType;
      
      CatalogueStore.queryProjectList(organizationId);
      CatalogueStore.queryCatalogueList(organizationId,projectId);
      CatalogueStore.queryDefaultCatalogueList(organizationId,customerId)
      
    }
 
      
  

    //handleChangeCity=(value)=>{
      //const countryLists =CreateCustomerStore.getCountryList;
     // const provinceLists = countryLists.filter(i=>i.lookupValue===value)[0].children
      //this.setState({provinceLists})
   // }
  

    handleEdit=(record)=>{
    }
    onChange = checkedList => {
        this.setState({
            lanOption_Def,
          indeterminate: !!lanOption_Def.length && lanOption_Def.length < lanOption_Cat.length,
          checkAll: lanOption_Def.length === lanOption_Cat.length,
        });
      };
      onCheckAllChange = e => {
        this.setState({
          lanOption_Def: e.target.checked ?lanOption_Cat : [],
          indeterminate: false,
          checkAll: e.target.checked,
        });
      };
    
    render() {
      const { AppState} = this.props;
      //const menuType = AppState.currentMenuType;
      const { getFieldDecorator } = this.props.form;
      const projectLists = CatalogueStore.getProjectList;
      const catalogueLists = CatalogueStore.getCatalogueList;//全部服务目录
      const defaultCatalogueLists = CatalogueStore.getDefaultCatalogueList;//对应客户已经勾选的服务目录
      const { catalogueInfo } = this.state;
      const lanOption_Pro = [];
      const lanOption_Cat = [];
      const lanOption_Def = [];
      console.log(lanOption_Cat);
  
      projectLists.forEach((item) => {
        lanOption_Pro.push(<Option key={item.projectId} value={item.projectId}>{item.projectName}</Option>);
      });
      catalogueLists.forEach((item) => {
        lanOption_Cat.push(item.catalogueName);
      });
      defaultCatalogueLists.forEach((item) => {
        lanOption_Def.push(item.catalogueDisplayName);
      });
      return (
        <Content className="sidebar-content">
          <FormItem
                      {...formItemLayout}
                    >
                      {getFieldDecorator('projectName', {
                        initialValue:catalogueInfo.projectName ? catalogueInfo.projectName : '',
                        rules: [{
                          required: true,
                          message: CatalogueStore.languages[`${intlPrefix}.projectname.require.msg`],
                        }],
                      })(
                        <Select
                          getPopupContainer={triggerNode => triggerNode.parentNode}
                          style={{ width: 250,margin:30 }}
                          label={CatalogueStore.languages[`${intlPrefix}.projectname`]}
                          
                          optionFilterProp="children"
                          filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                           filter
                          onChange={this.handleInsideChange}
                        >
                          {lanOption_Pro}
                        </Select>,
                      )}
                    </FormItem>
                    <Row>
                    <Col span={6} >
        <div style={{ margin:30 }}>
        <div style={{ borderBottom: '1px solid #E9E9E9' }}>
          <Checkbox
            indeterminate={this.state.indeterminate}
            onChange={this.onCheckAllChange}
            checked={this.state.checkAll}
          >
            全选
          </Checkbox>
        </div>
        <br />
        <CheckboxGroup
          options={lanOption_Cat}
          value={lanOption_Def}
          onChange={this.onChange}
        />
      </div>
      </Col>
      </Row>
        </Content>
      );
    };
  
  }
  export default Form.create({})(withRouter(injectIntl(CatalogueHome)));