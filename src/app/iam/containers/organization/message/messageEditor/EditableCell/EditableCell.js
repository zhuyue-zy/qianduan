/*
* @description:可编辑的单元格组件
* @author：张凯强
* @update 2018-09-18 19:15
*/
import React, { Component } from 'react';
import { Input } from 'yqcloud-ui';

class EditableCell extends Component {
  render() {
    //  获取父组件传来的参数
    const { editable, value, onChange, onClick } = this.props;

    return (
      <div onClick={() => { onClick(); }}>
        {editable
          ? <Input value={value} onChange={(e) => { onChange(e.target.value); }} />
          : <span>{value}</span>}
      </div>
    );
  }
}

EditableCell.propTypes = {};

export default EditableCell;
