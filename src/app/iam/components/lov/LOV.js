/*eslint-disable*/
import React, { Component } from 'react';
import { Form, Select, Modal, Input, Table, Button, Col, Row, DatePicker } from 'yqcloud-ui';
import { axios } from 'yqcloud-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';

const FormItem = Form.Item;
const formItemLayout = {
  labelCol: {
    md: { span: 12 },
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    md: { span: 24 },
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

class LOV extends Component {
  constructor(props) {
    super(props);
    this.state = {
      code: '',
      visible: this.props.visible,
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      sort: {
        columnKey: null,
        order: null,
      },
      ModalData: {
        title: 'LOV',
        width: 500,
        height: 600,
        customUrl: '',
        textFiled: '',
        valueField: '',
      },
      formData: [],
      tableData: [],
      selectBody: {},
    };
  }

  componentWillMount() {
    this.init()
  }

  componentWillReceiveProps(nextProps) {
    if(this.state.visible !== nextProps.visible && nextProps.code){
      this.setState({ visible: nextProps.visible, code: nextProps.code }, this.init)
    }
  }

  init = () => {
    const { code } = this.state
    const { organizationId } = this.props
    if (organizationId === undefined) {
      if(code){
        axios.get(`/fnd/v1/flex_value_set/flex_value_set_name?flexValueSetName=${code}`)
          .then((res) => {
            this.setState({
              ModalData: res,
              formData: res.flexValuesList,
            }, () => {
              this.loadLOVTableData()
            })
          })
      }
    } else {
      if(code){
        axios.get(`/fnd/v1/${organizationId}/flex_value_set/flex_value_set_name?flexValueSetName=${code}`)
          .then((res) => {
            this.setState({
              ModalData: res,
              formData: res.flexValuesList,
            }, () => {
              this.loadLOVTableData()
            })
          })
      }
    }

  }

  renderLOVForm = () => {
    const { formData = [] } = this.state
    const { getFieldDecorator } = this.props.form
    const { intl } = this.props;
    formData.sort((a, b) => { return a.conditionFieldSequence - b.conditionFieldSequence }) // 根据order排序
    const form = formData.reduce((options, {conditionFieldType, conditionFieldName, description, conditionFieldWidth, isConditionField}) => {
      if(conditionFieldType === 'input' && isConditionField === 'Y'){
        options.push(
          <FormItem style={{ paddingRight: 10 }}>
            {getFieldDecorator(conditionFieldName, {
              rules: [],
            })(
              <Input label={description} style={{ width: conditionFieldWidth }} />,
            )}
          </FormItem>
        )
      } else if(conditionFieldType === 'date' && isConditionField === 'Y') {
        options.push(
          <FormItem style={{ paddingRight: 10 }}>
            {getFieldDecorator(conditionFieldName, {
              rules: [],
            })(
              <DatePicker style={{ width: conditionFieldWidth }} label={description} />,
            )}
          </FormItem>
        )
      }
      return options
    }, [])
    if(form.length !== 0){
      form.push(
        <Row style={{ marginTop: 10 }}>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" onClick={this.handleSubmit}>{intl.formatMessage({id: 'query'})}</Button>
            <Button style={{ marginLeft: 8 }} onClick={this.handleReset}>{intl.formatMessage({id: 'clear'})}</Button>
          </Col>
        </Row>
      )
    }
    return form
  }

  handleReset = () => {
    this.props.form.resetFields();
  }

  handleSubmit = () => {
    this.props.form.validateFields((err, value, modify) => {
      if (!err) {
        const { formData = [] } = this.state
        const body = formData.reduce((options, {conditionFieldName, isConditionField}) => {
          if(isConditionField === 'Y'){
            options[conditionFieldName] = value[conditionFieldName]
          }
          return options
        }, {})
        this.loadLOVTableData(body)
      }
    });
  }

  loadLOVTableData = (data, paginationIn, sortIn) => {
    const { organizationId } = this.props
    const { ModalData: { customUrl } } = this.state
    const body = data || {}
    const {
      pagination: paginationState,
      sort: sortState,
    } = this.state;
    const { current, pageSize } = paginationIn || paginationState;
    const { columnKey, order } = sortIn || sortState;
    const sorter = [];
    if (columnKey) {
      sorter.push(columnKey);
      if (order === 'descend') {
        sorter.push('desc');
      }
    }
    axios.post(`${(customUrl || '').replace('{organizations}',organizationId)}?page=${current - 1}&size=${pageSize}&sort=${sorter.join(',')}`, JSON.stringify({ ...body }))
    .then((res) => {
      this.setState({
        tableData: res.content,
        sort: sorter,
        pagination: {
          current: res.number + 1,
          pageSize: res.size,
          total: res.totalElements,
        },
      });
    })
    this.setState({ selectBody: body })
  }

  handlePageChange = (pagination, filters, sorter, params) => {
    const { selectBody } = this.state
    this.loadLOVTableData(selectBody, pagination, sorter);
  }

  renderLOVTable = () => {
    const { sort: { columnKey, order }, formData = [], pagination, tableData } = this.state
    formData.sort((a, b) => { return a.gridFieldSequence - b.gridFieldSequence }) // 根据order排序
    let width = 0;
    const columns = formData.reduce((options, {gridFieldName, description, gridFieldWidth, gridFieldAlign, isGridField}) => {
      if(isGridField === 'Y'){
        options.push(
          {
            title: description,
            dataIndex: gridFieldName,
            key: gridFieldName,
            sorter: true,
            sortOrder: columnKey === gridFieldName && order,
            align: gridFieldAlign,
            width: gridFieldWidth,
          }
        )
        width = width + gridFieldWidth
      }
      return options
    }, [])
    return (
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={pagination}
        onChange={this.handlePageChange}
        filterBar={false}
        style={{ marginTop: 10, width }}
        onRow={(record) => {
          return {
            onClick: () => {
              const { firstForm, formItem, onChange } = this.props
              const { ModalData: { valueField, textFiled } } = this.state
              const data = {}
              data[formItem] = record[valueField]
              firstForm.setFieldsValue(data)
              onChange(false, record[textFiled])
              this.setState({ visible: false })
            },
          };
        }}
      />
    )
  }

  render() {
    const {
      formData,
      ModalData: {
        title,
        height,
        width,
      },
      visible,
     } = this.state
    return (
      <Modal
        title={title}
        visible={visible}
        onCancel={() => {
          const { onChange } = this.props
          onChange(false)
          this.setState({ visible: false })
        }}
        style={{ top: 100, height: '100%' }}
        footer={null}
        width={width}
        maskClosable={false}
      >
        <Form layout="inline">
          {this.renderLOVForm()}
        </Form>
        <div style={{ overflow: 'auto', height: 420 }}>
          {this.renderLOVTable()}
        </div>
      </Modal>
    );
  }
}

export default Form.create()(injectIntl(LOV));
