/**
 * Created by Administrator on 2018-10-18 0018.
 */
import React, { Component } from 'react';
import { Form, Select, Collapse } from 'yqcloud-ui';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content } from 'yqcloud-front-boot';
import './index.scss';
import WorkflowStore from '../../../../stores/organization/approvalWorkflow';


const FormItem = Form.Item;
const { Option } = Select;
const { Panel } = Collapse;
const intlPrefix = 'organization.management';
const intlPrefixs = 'approval.workflow';

const inputWidth = 512;
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
class ModifyWorkflow extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      organizationInfo: {},
      dataSource: [],
      params: [],
      popup: false,
      submitting: false,
      chart: '',
      pagination: {
        current: 1,
        pageSize: 25,
        total: '',
        pageSizeOptions: ['25', '50', '100', '200'],
      },
      nodes: [], // 流程图node节点
      prop: '',
    };
  }

  componentWillMount() {
    this.props.onRef(this);
    this.fetch(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.popup) {
      nextProps.form.resetFields();
      this.setState(this.getInitState());
    } else if (!this.props.popup) {
      this.fetch(nextProps);
    }
  }

  fetch(props) {
    const { AppState, deployId } = props;
    const { organizationId } = AppState.currentMenuType;
    this.getPreview(organizationId, deployId);
  }

  getPreview = (organizationId, deployId) => {
    WorkflowStore.getPreview(organizationId, deployId)
      .then((value) => {
        const byteStr = `data:image/png;base64,${btoa(
          new Uint8Array(value)
            .reduce((data, byte) => data + String.fromCharCode(byte), ''),
        )}`;
        this.setState({
          chart: byteStr,
        });
      }).catch((error) => {
        Choerodon.handleResponseError(error);
      });
  };


  // 确认关闭弹框
  handleSubmit = (e) => {
    const { OnCloseModel = noop, intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, data, modify) => {
      OnCloseModel();
    });
  };

  render() {
    const { chart, nodes, prop } = this.state;
    return (
      <Content
        className="sidebar-content"
      >
        <div className="ant-modal-body">
          <img style={{ paddingTop: 240 }} src={this.state.chart} alt="" />
        </div>
      </Content>
    );
  }
}

export default Form.create({})(withRouter(injectIntl(ModifyWorkflow)));
