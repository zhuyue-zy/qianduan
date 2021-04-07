/*eslint-disable*/
import React, { Component } from 'react';
import { Form, Select, Modal, Input, Table, Button, Col, Row, DatePicker, Icon } from 'yqcloud-ui';
import { axios } from 'yqcloud-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';

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
      <Select
        mode="combobox"
        label={label}
        value={text}
        style={{ ...style, paddingRight: 20 }}
        defaultActiveFirstOption={false}
        showArrow={false}
        filterOption={false}
      >
        {options}
      </Select>,
      <Icon type="search" style={{ marginLeft: '-19px', position: 'absolute', top: 'calc(50% - 9px)', zIndex: 999 }} onClick={() => {onLOV()}} />
    ];
  }
}
