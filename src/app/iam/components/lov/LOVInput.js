/*eslint-disable*/
import React, { Component } from 'react';
import { Form, Select, Modal, Input, Table, Button, Col, Row, DatePicker, Icon } from 'yqcloud-ui';
import { axios } from 'yqcloud-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';
import './LovInput.scss';

const Option = Select.Option
let timeout
let selectText

export default class LOVInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      code: this.props.code,
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      sort: {
        columnKey: null,
        order: null,
      },
      optionData: [],
      value: '',
      text: this.props.text,
      valueField: '',
      textFiled: '',
      formData: [],
      tableData: [],
      selectBody: {},
    };
  }

  componentWillMount() {}

  componentWillReceiveProps(nextProps) {
    this.setState({ text: nextProps.text })
  }

  fetch = (value) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    timeout = setTimeout(this.loadSelectData(value), 300);
  }

  handleLOV = () => {
    const { code, organizationId } = this.props
    return axios.get(`/fnd/v1/${organizationId}/flex_value_set/flex_value_set_name?flexValueSetName=${code}`)
  }

  loadSelectData = (value) => {
    this.handleLOV().then((res) => {
      this.setState({ textFiled: res.textFiled, valueField: res.valueField })
      const body = {}
      body[res.textFiled] = value
      axios.post(res.customUrl, JSON.stringify(body))
      .then((result) => {
        this.setState({ optionData: result.content })
      })
    })
  }

  handleChange = (value) => {
    if(selectText){
      this.setState({ text: selectText })
      this.fetch(selectText)
      selectText = ''
    } else {
      this.setState({ text: value })
      this.fetch(value)
    }
  }

  handleSelect = (value, option) => {
    selectText = option.props.children
    const { formCode, onSelect } = this.props
    const data = {}
    data[formCode] = option.key
    this.props.form.setFieldsValue(data)
    onSelect(selectText)
  }

  render() {
    const {
      valueField,
      textFiled,
      optionData,
      text,
    } = this.state
    const { style, onLOV, label } = this.props
    const options = optionData.map(value => <Option key={value[valueField]}>{value[textFiled]}</Option>) || {}
    return [
     <span className="lovStyle"  onClick={() => {onLOV()}}>
      <Select
        mode="combobox"
        label={label}
        value={text}
        style={{ ...style, paddingRight: 20, cursor: 'pointer'  }}
        defaultActiveFirstOption={false}
        showArrow={false}
        filterOption={false}
        onChange={this.handleChange}
        onSelect={this.handleSelect}
        disabled='true'
      >
        {options}
      </Select>
       </span>,
      <Icon type="search" style={{ marginLeft: '-19px', position: 'absolute', top: 'calc(50% - 9px)', zIndex: 999, cursor: 'pointer' }} onClick={() => {onLOV()}} />
    ];
  }
}
