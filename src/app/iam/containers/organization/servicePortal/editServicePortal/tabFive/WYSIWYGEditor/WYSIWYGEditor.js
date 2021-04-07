import React, { Component } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from 'yqcloud-ui';
import { ImageDrop } from 'yqquill-image-drop-module';
// import ImageDrop from './ImageDrop';
import './WYSIWYGEditor.scss';

Quill.register('modules/imageDrop', ImageDrop);

class WYSIWYGEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
      msgSaving: null,
      delta: null,
      chatError: null,
    };
    this.handleChange = this.handleChange.bind(this);
  }

  modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] },'bold', 'italic', 'underline', 'strike',{ color: [] }, { background: [] },{ align: [] },{ list: 'ordered' }, { list: 'bullet' } ,'image','link',],
    ],
    imageDrop: true,
  };

  formats = [
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'code-block',
    'list',
    'bullet',
    'script',
    'indent',
    'color',
    'background',
    'font',
    'align',
    'header',
    'image',
    'link',
  ];

  defaultStyle = {
    width: 498,
    height: 300,
    borderRight: 'none',
  };

  isHasImg = (delta) => {
    let pass = false;
    if (delta && delta.ops) {
      delta.ops.forEach((item) => {
        if (item.insert && item.insert.image) {
          pass = true;
        }
      });
    }
    return pass;
  };

  handleChange = (content, delta, source, editor, code) => {
    const value = editor.getContents();
    if (this.props.onChange && value && value.ops) {
      this.props.onChange(value.ops, code);
    }
  };

  empty = () => {
    this.props.onChange(undefined, '');
  };

  handleClickOutside = evt => {
    const { handleClickOutSide } = this.props;
    if (handleClickOutSide) {
      handleClickOutSide();
    }
  };

  render() {
    const { placeholder, value } = this.props;
    const style = { ...this.props.style };
    // const editHeight = style.height - (this.props.toolbarHeight || 42);
    return (
      <div style={{ width: '100%' }}>
        <div style={style} className="react-quill-editor">
          <ReactQuill
            theme="snow"
            modules={this.modules}
            formats={this.formats}
            style={style}
            placeholder={placeholder || '描述'}
            defaultValue={value}
            onChange={this.handleChange}
          />
        </div>
        {
          this.props.bottomBar && (
            <div style={{ padding: '0 8px', border: '1px solid #ccc', borderTop: 'none', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                onClick={() => {
                  this.empty();
                  this.props.handleDelete();
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                onClick={() => this.props.handleSave()}
              >
                保存
              </Button>
            </div>
          )
        }
      </div>
    );
  }
}

export default WYSIWYGEditor;
