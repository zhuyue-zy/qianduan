/*eslint-disable*/
import React, { Component } from 'react';
import { Form, Select, Modal, Input, Table, Button, Col, Row, DatePicker } from 'yqcloud-ui';
import { axios } from 'yqcloud-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';
import querystring from 'query-string';
import RoleManagementStore from '../../../../stores/globalStores/roleManagement/RoleManagementStore';


const FormItem = Form.Item;

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
        columnKey: 'id',
        order: 'descend',
      },
      ModalData: {
        title: this.props.title,
        textFiled: 'code',
        valueField: 'code',
      },
      tableData: [],
      selectBody: {},
    };
  }

  componentWillMount() {
    this.loadLOVTableData();
  }

  componentWillReceiveProps(nextProps) {
    this.loadLOVTableData();
    if(this.state.visible !== nextProps.visible && nextProps.code){
      this.setState({ visible: nextProps.visible, code: nextProps.code }, this.init)
    }
  }

  renderLOVForm = () => {
    const { formData, intl} = this.props
    const { getFieldDecorator } = this.props.form
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
            <Button type="primary" htmlType="submit" onClick={this.handleLovSubmit}>{intl.formatMessage({id: 'query'})}</Button>
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

  handleLovSubmit = () => {
    const {sort} = this.state
    this.props.form.validateFields((err, value, modify) => {
      if (!err) {
        const body = this.props.formData.reduce((options, {conditionFieldName, isConditionField}) => {
          if(isConditionField === 'Y'){
            options[conditionFieldName] = value[conditionFieldName]
          }
          return options
        }, {})
        this.loadLOVTableData(body, {current: 1, pageSize: 10, total: 0}, sort)
      }
    });
  }

  loadLOVTableData = (data, paginationIn, sortIn, params) => {
    const { level } = this.props;
    //获得当前Api
    const APIurl = RoleManagementStore.getRoleManagementApi;
    const body = data ? {...data, level} : {level};
    const {
      pagination: paginationState,
      sort: sortState,
    } = this.state;
    const { current, pageSize } = paginationIn ? paginationIn : paginationState;
    const { columnKey, order } = sortState;
    const queryObj = {
      page: current - 1,
      size: pageSize,
      ...body,
      params,
    };
    const sorter = [];
    if (columnKey) {
      sorter.push(columnKey);
      if (order === 'descend') {
        sorter.push('desc');
      }
      queryObj.sort = sorter.join(',');
    }

    // 选择APIform
    if (APIurl === '/iam/v1/permission/lov/query'){
      axios.get(`${APIurl}?${querystring.stringify(queryObj)}`).then((res) => {
        this.setState({
          tableData: res.content,
          sort: { columnKey, order },
          pagination: {
            current: res.number + 1,
            pageSize: res.size,
            total: res.totalElements,
          },
        });
      })
      this.setState({ selectBody: body })
    }
    // 选择MenuForm
    else {
      axios.get(`${APIurl}?${querystring.stringify(queryObj)}`).then((res) => {
        this.setState({
          tableData: res.content,
        })
        this.setState({
          pagination: {
            current: res.number + 1,
            pageSize: res.size,
            total: res.totalElements,
          },
        });
      })
      this.setState({ selectBody: body })
    }

  }

  handlePageChange = (pagination, filters, sort, params) => {
    // console.log(pagination, sort, params)
    const { selectBody } = this.state
    this.loadLOVTableData(selectBody, pagination, sort, params);
  }

  renderLOVTable = () => {
    const { formData } = this.props;
    const { sort: { columnKey, order }, pagination, tableData } = this.state
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
        style={{ margin: 'auto', width }}
        onRow={(record) => {
          return {
            onClick: () => {
              const { firstForm, formItem, onChange } = this.props;
              const { ModalData: { valueField, textFiled } } = this.state;
              const data = {};
              data[formItem] = record[valueField];
              firstForm.setFieldsValue(data);
              onChange(false, record[textFiled]);
              this.setState({ visible: false })
            },
          };
        }}
      />
    )
  }

  render(){
    // console.log(this.props)
    const {
      ModalData: {
        title,
      },
      visible,
     } = this.state
    //  console.log(this.state)
    return (
      <Modal
        title={this.props.title}
        visible={visible}
        onCancel={() => {
          const { onChange } = this.props
          onChange(false)
          this.setState({ visible: false })
        }}
        footer={null}
        width="fit-content"
        maskClosable={false}
      >
        <Form layout="inline">
          {this.renderLOVForm()}
        </Form>
        <div>
          {this.renderLOVTable()}
        </div>
      </Modal>
    );
  }
}

export default Form.create()(injectIntl(LOV));
