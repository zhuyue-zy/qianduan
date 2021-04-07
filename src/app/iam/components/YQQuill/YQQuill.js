/**
 * Create By ye on 2018/10/30.
 */
import React from 'react';
import { inject, observer } from 'mobx-react';
import { CLIENT_ID, CLIENT_TYPE } from 'yqcloud-front-boot/lib/containers/common/constants';
import { Button, Upload } from 'yqcloud-ui';
import ReactQuill, { Quill } from 'react-quill';
import { ImageDrop } from 'yqquill-image-drop-module';
// import ReactQuill from 'react-quill';
// import { ImageDrop } from 'quill-image-drop-module';
import md5 from 'md5';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import dJSON from 'dirty-json-ie11';
import Promise from 'bluebird';
import YQQuillStore from '../../stores/components/YQQuillStore';
import 'react-quill/dist/quill.snow.css';
import Viewer from 'react-viewer';
import 'react-viewer/dist/index.css';

Quill.register('modules/imageDrop', ImageDrop);

const agent = navigator.userAgent; // 取得浏览器的userAgent字符串
const isOpera = agent.indexOf('Opera') > -1;
const isIE = agent.indexOf('compatible') > -1 && agent.indexOf('MSIE') > -1 && !isOpera;
const isIE11 = agent.indexOf('Trident') > -1 && agent.indexOf('rv:11.0') > -1;
const isEdge = agent.indexOf('Edge') > -1;

@inject('AppState')
@observer
class YQQuill extends React.Component {
  constructor(props) {
    super(props);
    this.modules = {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'], // toggled buttons
        [{ color: [] }, { background: [] }],
        ['blockquote', 'code-block'],

        [{ header: 1 }, { header: 2 }], // custom button values
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
        ['link', 'image'],

        [{ header: [1, 2, 3, 4, 5, 6, false] }],

        [{ align: [] }],

        ['clean'], // remove formatting button
      ],
      imageDrop: true,
    };
    this.formats = [
      'header',
      'bold', 'italic', 'underline', 'strike', 'blockquote',
      'color', 'background',
      'list', 'bullet', 'indent', 'image',
    ];
    this.state = {
      value: [],
      content: {},
      file: [],
      defaultFileList: [],
      vFileList: [],
      isOpenLightbox: '',
    };
  }

  componentWillReceiveProps(nextProps) {
    // console.log((this.props.content || '').length, (nextProps.content || '').length)
    // if (nextProps.content) {
    //  const replaceContent = nextProps.content.replace(/[\r\n]/g, '\\n').replace(/	/g, ' ');
    //  this.catchJSONError(replaceContent);
    if (nextProps.content && dJSON.parse(nextProps.content) !== JSON.stringify(this.state.content)) {
      // nextProps.content.replace(/[\r\n]/g, '\\n').replace(/\\/g, '\\').replace(/	/g, ' ');
      this.setState({
        content: this.state.content.ops && this.state.content === dJSON.parse(nextProps.content) ? this.state.content : dJSON.parse(nextProps.content),
        value: dJSON.parse(nextProps.content).ops || [],
      });
    }
    // }

    if ((nextProps.defaultFileList && JSON.stringify(nextProps.defaultFileList)) !== JSON.stringify(this.state.defaultFileList)) {
      const fileList = [];
      (nextProps.defaultFileList || []).forEach((data) => {
        fileList.push({
          id: data.id,
          fileName: data.fileName,
          name: data.fileName,
          fileId: data.fileId,
          uid: data.uId,
          uId: data.uId,
          size: data.size,
        });
      });
      this.setState({ file: fileList, defaultFileList: nextProps.defaultFileList, vFileList: fileList });
    }
  }

  componentWillUnmount() {
    this.setState({
      value: [],
      content: {},
      file: [],
      defaultFileList: [],
      vFileList: [],
      isOpenLightbox: '',
    });
  }

  // catchJSONError = (content) => {
  //   try {
  //     parseJson(content);
  //   } catch (err) {
  //     // console.log(err.message)
  //     err.message.split('while')[0].split(' ').forEach((data) => {
  //       if (!isNaN(parseInt(data))) {
  //         const v = content.replace(content.substring(parseInt(data), parseInt(data) + 1), '');
  //         this.catchJSONError(v);
  //       }
  //     });
  //   }
  // }

  dataURLtoFile = (dataurl) => { // 将base64转换为文件
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = window.atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    if (isIE11 || isIE || isEdge) {
      return [new Blob([u8arr], { type: mime }), `${md5((new Date()).getTime())}.${mime.split('/')[1]}`];
    } else {
      return new File([u8arr], `${md5((new Date()).getTime())}.${mime.split('/')[1]}`, { type: mime });
    }
  };

  promiseList = (content) => {
    const list = [];
    (content.ops || []).forEach((element) => {
      list.push(
        new Promise((resolve) => {
          if (element.insert && element.insert.image && element.insert.image.split(':')[0] === 'data') {
            const config = {
              headers: { 'Content-Type': 'multipart/form-data' },
            };
            const formData = new FormData();
            if (isIE11 || isIE || isEdge) {
              formData.append('file', this.dataURLtoFile(element.insert.image)[0], this.dataURLtoFile(element.insert.image)[1]);
            } else {
              formData.append('file', this.dataURLtoFile(element.insert.image));
            }
            YQQuillStore.submitFile(formData, config)
              .then((res) => {
                element.insert.image = res.imageUrl;
                resolve(element);
              });
          } else {
            resolve(element);
          }
        }),
      );
    });
    return list;
  };

  submitQuillContent = () => {
    const { file, content } = this.state;
    Promise.all(this.promiseList(content))
      .then((data) => {
        this.props.onSubmit(JSON.stringify({ ops: data }), file);
        // this.setState({ value: data });
      });
  }

  render() {
    const organizationId = this.props.AppState.currentMenuType.id;
    const imageContent = [];
    if (this.state.content.ops && this.state.content.ops.length > 0) {
      this.state.content.ops.forEach((item, index) => {
        if (item.insert && item.insert.image) {
          imageContent.push(
            <img
              src={item.insert.image}
              style={{ maxWidth: '100%' }}
              alt=""
              onClick={() => {
                console.log(item.insert.image);
                this.setState({
                  isOpenLightbox: item.insert.image,
                });
              }}
            />
          );
        } else {
          imageContent.push(
            <div
              dangerouslySetInnerHTML={
                { __html: (new QuillDeltaToHtmlConverter([item], {})).convert() }
              }
            />,
          );
        }
      });
    }

    return (
      <div>
        {
          this.props.edit
            ? [
              <ReactQuill
                theme="snow"
                modules={this.modules}
                formats={this.formats}
                value={this.state.value}
                style={this.props.style || ''}
                onChange={(content, delta, source, editor) => {
                  this.setState({
                    value: content,
                    content: editor.getContents(),
                  }, () => {
                    if (this.props.isNow) {
                      this.submitQuillContent();
                    }
                  });
                  // if (this.props.isNow) {
                  //   this.submitQuillContent();
                  // }
                }}
                // onBlur={() => {
                //   if (this.props.isNow) {
                //     this.submitQuillContent();
                //   }
                // }}
              />,
              <Upload
                name="file"
                action={`${process.env.API_HOST}/fileService/v1/${this.props.AppState.currentMenuType.id}/file/attachment`}
                headers={{
                  Authorization: `bearer ${Choerodon.getCookie('access_token')}`,
                  'X-Client-ID': CLIENT_ID,
                  'X-Client-Type': CLIENT_TYPE,
                }}
                // defaultFileList={this.state.file}
                fileList={this.state.vFileList}
                onChange={({ file, fileList }) => {
                  this.setState({
                    vFileList: [...fileList],
                  });
                  const { status, response } = file;
                  if (status === 'done') {
                    this.state.file.push({
                      fileName: file.name,
                      name: file.name,
                      fileId: response.fileId,
                      uId: file.uid,
                      uid: file.uid,
                      size: file.size,
                    });
                    this.setState({
                      file: this.state.file,
                    }, () => {
                      if (this.props.isNow) {
                        this.props.onSubmit(JSON.stringify(this.state.content), this.state.file);
                      }
                    });
                  } else if (status === 'error') {
                    Choerodon.prompt('上传错误');
                  }
                }}
                onDownload={(element) => {
                  YQQuillStore.loadFile(element.fileId).then((url) => {
                    window.open(url);
                  });
                }}
                onPreview={(element) => {
                  if (element.fileId) {
                    YQQuillStore.loadFile(element.fileId).then((url) => {
                      window.open(`${window.location.origin}/#/preview?fileName=${element.name}&fileSize=${element.size}&fileUrl=${url}&fileType=.${element.name.split('.').pop()}&fileId=${element.fileId}&iamOrganizationId=${organizationId}`);
                    });
                  } else if (!error) {
                    window.open(`${window.location.origin}/#/preview?fileName=${element.response.fileName}&fileSize=${element.response.fileSize}&fileUrl=${element.response.fileUrl}&fileType=.${element.name.split('.').pop()}&fileId=${element.response.fileId}&iamOrganizationId=${organizationId}`);
                  }
                }}
                onRemove={(file) => {
                  this.state.file.splice(this.state.file.findIndex(item => item.fileId === file.fileId), 1);
                  this.setState({
                    file: this.state.file,
                  }, () => {
                    if (this.props.isNow) {
                      this.props.onSubmit(JSON.stringify(this.state.content), this.state.file);
                    }
                  });
                }}
              >
                <Button type="primary" funcType="flat" icon="file_upload" style={{ marginTop: 65 }}>上传附件</Button>
              </Upload>,
              this.props.isNow
                ? ''
                : [
                  <Button
                    type="primary"
                    funcType="flat"
                    icon="yifabu"
                    loading={this.props.submitLoading || false}
                    onClick={this.submitQuillContent}
                  >
                    发布
                  </Button>,
                  <Button
                    type="primary"
                    funcType="flat"
                    icon="close"
                    onClick={this.props.onCancel}
                  >
                    取消
                  </Button>,
                ],
            ]
            : (
              <div className="yq-quill-content">
                {imageContent}
                {this.state.isOpenLightbox
                  ? (
                    <Viewer
                      visible={this.state.isOpenLightbox}
                      onClose={() => {
                        this.setState({
                          isOpenLightbox: '',
                        })
                      }}
                      images={[{ src: this.state.isOpenLightbox, alt: '' }]}
                      noNavbar={true}
                      scalable={false}
                      noImgDetails={true}
                      changeable={false}
                    />
                  )
                  : ''
                }
                <Upload
                  name="file"
                  action={`${process.env.API_HOST}/fileService/v1/${this.props.AppState.currentMenuType.id}/file/attachment`}
                  headers={{
                    Authorization: `bearer ${Choerodon.getCookie('access_token')}`,
                    'X-Client-ID': CLIENT_ID,
                    'X-Client-Type': CLIENT_TYPE,
                  }}
                  fileList={this.state.file}
                  onChange={({ file }) => {
                    const { status, response } = file;
                    if (status === 'done') {
                      Choerodon.prompt('请在编辑状态下上传文件');
                    } else if (status === 'error') {
                      Choerodon.prompt('请在编辑状态下上传文件');
                    }
                  }}
                  onPreview={(element) => {
                    YQQuillStore.loadFile(element.fileId).then((url) => {
                      window.open(url);
                    });
                  }}
                  onRemove={(file) => {
                    Choerodon.prompt('请在编辑状态下删除文件');
                    return false;
                  }}
                />
              </div>
            )
        }
      </div>
    );
  }
}

export default YQQuill;
