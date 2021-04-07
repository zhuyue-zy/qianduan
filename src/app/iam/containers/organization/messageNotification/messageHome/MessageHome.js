import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Page, Header, Content } from 'yqcloud-front-boot';
import {
  Button, List, Tabs, Modal, Tooltip, Collapse, Checkbox, Avatar, Icon, Input,
} from 'yqcloud-ui';
import classnames from 'classnames';
import messageStore from '../../../../stores/organization/messageNotification/MessageStore';
import './MessageHome.scss';

const intlPrefix = 'organization.messageNotification';
const { Panel } = Collapse;
const { TabPane } = Tabs;
function timestampFormat(timestamp) {
  function zeroize(num) {
    return (String(num).length === 1 ? '0' : '') + num;
  }

  const curTimestamp = parseInt(new Date().getTime() / 1000, 10); // 当前时间戳
  const timestampDiff = curTimestamp - timestamp; // 参数时间戳与当前时间戳相差秒数

  const curDate = new Date(curTimestamp * 1000); // 当前时间日期对象
  const tmDate = new Date(timestamp * 1000); // 参数时间戳转换成的日期对象

  const Y = tmDate.getFullYear(); const m = tmDate.getMonth() + 1; const
    d = tmDate.getDate();
  const H = tmDate.getHours(); const i = tmDate.getMinutes(); const
    s = tmDate.getSeconds();

  if (timestampDiff < 60) { // 一分钟以内
    return '刚刚';
  } else if (timestampDiff < 3600) { // 一小时前之内
    return `${Math.floor(timestampDiff / 60)}分钟前`;
  } else if (curDate.getFullYear() === Y && curDate.getMonth() + 1 === m && curDate.getDate() === d) {
    return `今天${zeroize(H)}:${zeroize(i)}`;
  } else {
    const newDate = new Date((curTimestamp - 86400) * 1000); // 参数中的时间戳加一天转换成的日期对象
    if (newDate.getFullYear() === Y && newDate.getMonth() + 1 === m && newDate.getDate() === d) {
      return `昨天${zeroize(H)}:${zeroize(i)}`;
    } else if (curDate.getFullYear() === Y) {
      return `${zeroize(m)}月${zeroize(d)}日 ${zeroize(H)}:${zeroize(i)}`;
    } else {
      return `${Y}年${zeroize(m)}月${zeroize(d)}日 ${zeroize(H)}:${zeroize(i)}`;
    }
  }
}
@inject('AppState')
@observer
class MessageHome extends Component {
  state = this.getInitState();

  getInitState() {
    return {
      isLoading: true,
      dataSource: [],
      visible: false,
      edit: false,
      submitting: false,
      selectedData: '',
      showMember: true,
      params: [],
      // sort: 'isRead%2Casc&sort=receiveDate%2Cdesc',
      sort: 'isRead',
      conTent: '',
      filters: {},
      pagination: {
        current: 1,
        pageSize: 25,
        total: 100,
        pageSizeOptions: [25, 50, 100, 200],
      },
      selectedRowKeys: [],
      confirmDeleteLoading: false,
      selectedCodeValues: [],
      deleteValueAll: [],
      messageInfo: [],
      oneToReadObj: [],
      typeListNew: '',
      unEmail: 'shuaxin',
      showAll: 0,
      needExpand: true,
      typeList: [],
      preview: false,
      msgAllCount: 0,
      msgUnCount: 0,
    };
  }

  componentWillMount() {
    this.loadDateMsgNum();
  }

  componentDidMount() {
    const { AppState } = this.props;
    this.loadUserInfo();
    this.loadLanguage();
    // this.loadDateMsgNum();
    this.setState({
      isChecked: !this.state.isChecked,
    });
    const matchId = this.props.location.search.match(/msgId=(\d+)/g);
    const matchType = this.props.location.search.match(/(msgType=)(.+)/g); // 火狐浏览器不兼容js正则表达式的环视，只能改成这样了
    if (matchType) {
      messageStore.setCurrentType(matchType[0].substring(8));
    }
    if (matchId) {
      const id = Number(matchId[0].match(/\d+/g)[0]);
      messageStore.loadData(AppState.userInfo.organizationId, { current: 1, pageSize: 10 }, {}, {}, [], this.state.showAll, false);
    } else {
      messageStore.loadData(AppState.userInfo.organizationId, { current: 1, pageSize: 10 }, {}, {}, [], this.state.showAll, false);
    }
    this.addListrenEvent();
  }

  // 监听点击事件
  addListrenEvent = () => {
    const { AppState } = this.props;
    window.addEventListener('click', this.hello = (e) => {
      // 阻止冒泡
      e.stopPropagation();
      if (e.target.nodeName === 'A') {
        // 点击a标签，获取消息id
        if (e.target.parentNode.id) {
          const a = [];
          a.push(e.target.parentNode.id)
          messageStore.readMsg(AppState.userInfo.organizationId, a).then(() => this.reloadData());
        }
      }
    });
  };

  componentWillUnmount() {
    window.removeEventListener('click', this.hello);
    // 页面卸载的时候应该清空数据
    this.clearNoticeData();
  }

  // 页面卸载的时候应该清空数据
  clearNoticeData = () => {
    messageStore.clearSelectMsg();
  }

  // 获取语言
  loadLanguage = () => {
    const { AppState } = this.props;
    messageStore.queryLanguage(AppState.userInfo.organizationId, AppState.currentLanguage);
  };

  refresh = () => {
    const { AppState } = this.props;
    messageStore.loadData(AppState.userInfo.organizationId, { current: 1, pageSize: 10 }, {}, {}, [], this.state.showAll);
    this.loadDateMsgNum();
    messageStore.selectMsg.clear();
    messageStore.expandMsg.clear();
    messageStore.initPagination();
  };

  // 重新加载数据
  reloadData = () => {
    const { AppState } = this.props;
    messageStore.loadData(AppState.userInfo.organizationId, { current: 1, pageSize: 10 }, {}, {}, [], this.state.showAll);
    this.loadDateMsgNum();
  };

  loadDateMsgNum = () => {
    const { AppState } = this.props;
    messageStore.loadDateMsgNum(AppState.userInfo.organizationId).then((data) => {
      const unRead = [];
      data.content.forEach((v) => {
        if (v.isRead === 0) {
          unRead.push(v);
        }
      });
      this.setState({
        msgAllCount: data.totalElements,
        msgUnCount: unRead.length,
      });
    });
  }

  getUserMsgClass(name) {
    const { showAll } = this.state;
    if (name === 'unRead') {
      return classnames({
        active: !showAll,
      });
    } else if (name === 'all') {
      return classnames({
        active: showAll,
      });
    }
  }

  showUserMsg(show) {
    this.setState({ showAll: show }, () => this.refresh());
  }

  renderMsgTitle = (item, noticeType, subject, isRead, receiveDate, avatar, noticeId, isChecked, sourceSystem) => (
    <div className="c7n-iam-user-msg-collapse-title">
      <Checkbox
        style={{ verticalAlign: 'text-bottom', zIndex: '999' }}
        onChange={e => this.handleCheckboxChange(e, noticeId)}
        checked={isChecked}
      />
      {/* 头像 */}
      {/* {avatar} */}
      {sourceSystem === 'WF'
        ? (
          <span style={{ display: 'inline-block', width: 55, background: '#ff9500', borderRadius: 4, textAlign: 'center', fontSize: 10, marginTop: 5, marginRight: 10, color: 'white', marginLeft: 20 }}>
            {messageStore.languages[`${intlPrefix}.workflow`]}
          </span>
        )
        : sourceSystem === 'SYSTEM' ? (
          <span style={{ display: 'inline-block', width: 55, background: '#2196f3', borderRadius: 4, textAlign: 'center', fontSize: 10, marginTop: 5, marginRight: 10, color: 'white', marginLeft: 20 }}>
            {messageStore.languages[`${intlPrefix}.system`]}
          </span>
        ) : sourceSystem === 'ITSM' ? (
          <span style={{ display: 'inline-block', width: 55, background: '#6354f4', borderRadius: 4, textAlign: 'center', fontSize: 10, marginTop: 5, marginRight: 10, color: 'white', marginLeft: 20 }}>
            {messageStore.languages[`${intlPrefix}.ITSM`]}
          </span>
        ) : sourceSystem === 'KB' ? (
          <span style={{ display: 'inline-block', width: 55, background: '#48bbd4', borderRadius: 4, textAlign: 'center', fontSize: 10, marginTop: 5, marginRight: 10, color: 'white', marginLeft: 20 }}>
            {messageStore.languages[`${intlPrefix}.knowledgeBase`]}
          </span>
        ) : ''}
      {isRead === 1 ? <span style={{ display: 'inline-block', height: 5, width: 5, background: 'white', borderRadius: '99px', position: 'absolute', top: 27, visibility: 'hidden' }} />
        : <span style={{ display: 'inline-block', height: 5, width: 5, background: 'red', borderRadius: '99px', position: 'absolute', top: 27 }} />}


      <span style={{ color: '#04173F', marginLeft: '15px' }}>{subject}</span>

      <span className="c7n-iam-user-msg-unread" style={{ lineHeight: '34px', color: '#818999' }}>{receiveDate}</span>

    </div>
  )


  renderAnnoucenmentTitle = (title, id, sendDate, avatar) => (
    <div className="c7n-iam-user-msg-collapse-title">
      {avatar}
      <span style={{ color: '#000' }}>{title}</span>
      <Tooltip
        title={sendDate}
        placement="top"
      >
        <span className="c7n-iam-user-msg-unread">{timestampFormat(new Date(sendDate).getTime() / 1000)}</span>
      </Tooltip>
    </div>
  )

  handleBatchRead = () => {
    const { AppState } = this.props;

    if (messageStore.getSelectMsg.size > 0) {
      messageStore.readMsg(AppState.userInfo.organizationId, messageStore.getSelectMsg).then(() => this.refresh());
      this.setState({

      });
    }
  };

  handleDelete = () => {
    const { intl, AppState } = this.props;
    if (messageStore.getSelectMsg.size > 0) {
      Modal.confirm({
        className: 'c7n-iam-confirm-modal',
        title: messageStore.languages[`${intlPrefix}.delete.owntitle`],
        content: messageStore.languages[`${intlPrefix}.delete.owncontent`],
        onOk: () => {
          messageStore.deleteMsg(AppState.userInfo.organizationId).then(() => {
            Choerodon.prompt(messageStore.languages['delete.success']);
            this.refresh();
          });
        },
      });
    }
  };

  handleCheckboxChange = (e, noticeId) => {
    if (messageStore.getSelectMsg.has(noticeId)) {
      messageStore.deleteSelectMsgById(noticeId);
    } else {
      messageStore.addSelectMsgById(noticeId);
    }
    this.setState({ needExpand: false });
  };

  handleReadIconClick = (noticeId) => {
    const { AppState } = this.props;
    messageStore.setReadLocal(noticeId);
    messageStore.readMsg(AppState.userInfo.organizationId, [noticeId]).then((data) => {
      if (data === 'info.sign.read.already') {
        this.refresh();
      }
    });
    this.setState({ needExpand: false });
  };

  handleCollapseChange = (item) => {
    setTimeout(() => {
      if (this.state.needExpand && messageStore.getExpandMsg.has(item.noticeId)) {
        messageStore.unExpandMsgById(item.noticeId);
      } else if (this.state.needExpand) {
        messageStore.expandMsgById(item.noticeId);
      }
      this.setState({ needExpand: true });
    }, 10);
  };

  loadUserInfo = () => messageStore.setUserInfo(this.props.AppState.getUserInfo);


  // 待办弹出框
  handleClick = (item) => {
    const { intl, AppState } = this.props;
    if (item.invitation === true && item.valid === true) {
      this.setState({
        noticeId: item.noticeId,
        employ: item.invitationEmployee,
        organization: item.invitationOrganizationName,
        mail: item.email,
        creationDate: item.receiveDate,
        preview: true,
        valid: item.valid,
        iamOrganizationId: item.invitationOrganization,
      });
    } else {
      Choerodon.prompt(messageStore.languages['valid.info']);
      this.handleReadIconClick(item.noticeId);
    }
  }

  // 待办弹出框标题
  renderTitle = () => (
    <div>
      <Icon className="shuruzhengque" />
      {messageStore.languages['invite.title']}
    </div>
  );

  // 待办弹出框内容
  renderPreviewContent = () => {
    const { employ, organization, mail, creationDate, valid, noticeId, iamOrganizationId } = this.state;
    return (
      <div style={{ padding: '14px 40px 20px 40px' }}>
        <p>
          {organization}{messageStore.languages[`${intlPrefix}.tenant.administrator`]}
        </p>
        <p>
          {messageStore.languages[`${intlPrefix}.invite`]}
          {mail}{messageStore.languages[`${intlPrefix}.accountJoin`]}
        </p>
        <div style={{ marginTop: 14 }}>
          <Icon type="shijian1" style={{ color: '#70C040' }} />
          <span>{creationDate}</span>
          {messageStore.languages['invite.time.msg']}
        </div>
      </div>
    );
  };

  /**
   * 接受邀请
   * @param
   */
  handleOk = () => {
    const { mail, valid, noticeId, iamOrganizationId } = this.state;
    const { AppState } = this.props;
    const { id: organizationId } = AppState.currentMenuType;
    messageStore.inviteOk(iamOrganizationId, mail).then(({ failed, code }) => {
      if (!failed) {
        Choerodon.prompt(messageStore.languages['tongyi.success']);
        this.setState({ preview: false });
        this.handleReadIconClick(noticeId);
      }
    });
  }

  /**
   * 拒绝邀请
   * @param
   */
  handleCancel = () => {
    const { AppState, intl } = this.props;
    const { mail, noticeId, iamOrganizationId } = this.state;
    const { id: organizationId } = AppState.currentMenuType;
    messageStore.inviteReject(iamOrganizationId, mail).then(({ failed, code }) => {
      if (!failed) {
        Choerodon.prompt(messageStore.languages['reject.success']);
        this.setState({ preview: false });
        this.handleReadIconClick(noticeId);
      }
    });
  }

  selectAllMsg = () => {
    if (messageStore.getSelectMsg.size > 0) {
      messageStore.unSelectAllMsg();
    } else if (!messageStore.isAllSelected) {
      messageStore.selectAllMsg();
    } else {
      messageStore.unSelectAllMsg();
    }
  };

  getNewAvatar = (realName, loginName) => {
    if (((realName || loginName).charAt(0).charCodeAt(0)) > 96 && ((realName || loginName).charAt(0).charCodeAt(0)) < 123) {
      return (
        <span style={{
          borderRadius: 90,
          display: 'inline-block',
          width: 40,
          height: 40,
          color: '#FFFFFF',
          fontSize: '19px',
          fontWeight: 'bold',
          lineHeight: '40px',
          background: '#EF7F25',
        }}
        >{(realName || loginName).charAt(0) }
        </span>
      );
    } else if (((realName || loginName).charAt(0).charCodeAt(0)) > 64 && ((realName || loginName).charAt(0).charCodeAt(0)) < 91) {
      return (
        <span style={{
          borderRadius: 90,
          display: 'inline-block',
          width: 40,
          height: 40,
          color: '#FFFFFF',
          fontSize: '19px',
          fontWeight: 'bold',
          lineHeight: '40px',
          background: '#EF7F25',
        }}
        >{(realName || loginName).charAt(0)}
        </span>
      );
    } else if (((realName || loginName).charAt(0).charCodeAt(0)) > 47 && ((realName || loginName).charAt(0).charCodeAt(0)) < 58) {
      return (
        <span style={{
          borderRadius: 90,
          display: 'inline-block',
          width: 40,
          height: 40,
          color: '#FFFFFF',
          fontSize: '20px',
          fontWeight: 'bold',
          lineHeight: '40px',
          background: '#3C4D73',
        }}
        >{(realName || loginName).charAt(0) }
        </span>
      );
    } else {
      return (
        <span style={{
          borderRadius: 90,
          display: 'inline-block',
          width: 40,
          height: 40,
          color: '#FFFFFF',
          fontSize: '20px',
          fontWeight: 'bold',
          lineHeight: '40px',
          background: '#2196F3',
        }}
        >{(realName || loginName).charAt(0)}
        </span>
      );
    }
  }

  renderUserMsgCard(item) {
    const { intl, AppState } = this.props;
    const currentType = messageStore.getCurrentType;
    const isAnnouncement = currentType === 'announcement';
    const innerStyle = {
      background: '#f5f5f5', width: 40, height: 40, userSelect: 'none', verticalAlign: 'top', marginRight: '8px', marginLeft: isAnnouncement ? '0' : '12px', fontSize: '16px', color: 'rgba(0,0,0,0.65)',
    };

    let innerHTML;
    if (!isAnnouncement) {
      const { noticeId, title, read, sendTime, content, sendByUser, invitation } = item;
      let avatar;
      if (sendByUser !== null) {
        avatar = (
          <Tooltip title={`${AppState.userInfo.loginName} ${AppState.userInfo.realName}`}>
            <Avatar src={AppState.userInfo.imageUrl} className="weiLeRangTaDaXie" style={innerStyle}>
              {this.getNewAvatar(AppState.userInfo.realName, AppState.userInfo.loginName)}
            </Avatar>
          </Tooltip>
        );
      }
      innerHTML = (
        <div>
          <List.Item>
            <Collapse
              onChange={() => this.handleCollapseChange(item)}
              className="c7n-iam-user-msg-collapse"
              // defaultActiveKey={['1']}
              activeKey={messageStore.getExpandMsg.has(noticeId) ? [noticeId.toString()] : []}
              style={messageStore.getExpandMsg.has(noticeId) ? null : { backgroundColor: '#fff' }}
            >
              <Panel header={this.renderMsgTitle(item, item.noticeType, item.subject, item.isRead, item.receiveDate, avatar, item.noticeId, messageStore.getSelectMsg.has(noticeId), item.sourceSystem)} key={noticeId.toString()} className="c7n-iam-user-msg-collapse-panel">
                {<div>
                  {item.noticeType == 'agency'
                    ? (item.invitation == true
                      ? (<div style={{ margin: '0 36px' }}><span>{messageStore.languages[`${intlPrefix}.onClick`]}</span><a onClick={this.handleClick.bind(this, item)} style={{ color: '#2196F3' }}>{messageStore.languages.here}</a>{messageStore.languages.handle}</div>)
                      : (<div style={{ margin: '0 36px' }}><span>{messageStore.languages[`${intlPrefix}.onClick`]}</span><a onClick={() => window.open(`${item.content}`)} style={{ color: '#2196F3' }}>{messageStore.languages.here}</a>{messageStore.languages.handle}</div>))
                    : (<div id={item.noticeId} style={{ width: 'calc(100% - 72px)', margin: '0 36px', display: 'inline-block' }} dangerouslySetInnerHTML={{ __html: `${item.content}` }} />)}
                </div> }
              </Panel>
            </Collapse>

          </List.Item>
        </div>

      );
    } else {
      const { id, title, sendDate, content } = item;
      innerHTML = (
        <div>
          <List.Item>
            <Collapse
              onChange={() => this.handleCollapseChange(item)}
              className="c7n-iam-user-msg-collapse"
              activeKey={messageStore.getExpandMsg.has(id) ? [id.toString()] : []}
              style={messageStore.getExpandMsg.has(id) ? null : { backgroundColor: '#fff' }}
            >
              <Panel header={this.renderAnnoucenmentTitle(title, id, sendDate, systemAvatar)} key={id.toString()} className="c7n-iam-user-msg-collapse-panel">
                {<div>
                  <div
                    style={{ width: 'calc(100% - 72px)', margin: '0 36px', display: 'inline-block' }}
                    dangerouslySetInnerHTML={{ __html: `${content}` }}
                  />
                </div> }
              </Panel>
            </Collapse>

          </List.Item>
        </div>
      );
    }
    return innerHTML;
  }

  render() {
    const { intl, AppState } = this.props;
    const { msgAllCount, msgUnCount } = this.state;
    const pagination = messageStore.getPagination;
    const userMsg = messageStore.getUserMsg;
    const announceMsg = messageStore.getAnnounceMsg;
    const currentType = messageStore.getCurrentType;
    const isAnnounceMent = currentType === 'announcement';
    const currentMsg = isAnnounceMent ? announceMsg : userMsg;
    return (
      <Page>
        <Header
          title={messageStore.languages[`${intlPrefix}.header.title`]}
        >
          <Button
            onClick={this.selectAllMsg}
            style={{ width: '93px', color: '#04173f' }}
            disabled={isAnnounceMent}
          >
            <Icon type="playlist_add_check" style={{ color: '#2196f3', fontSize: 20, marginTop: 1 }} />
            {messageStore.getSelectMsg.size === 0 ? messageStore.languages.selectall : messageStore.languages.selectnone }
          </Button>
          <Button
            icon="quanbubiaojiweiyidu"
            disabled={messageStore.getSelectMsg.size === 0 || isAnnounceMent}
            onClick={this.handleBatchRead}
          >
            {messageStore.languages[`${intlPrefix}.markreadall`]}
          </Button>
          <Button
            icon="shanchu"
            disabled={messageStore.getSelectMsg.size === 0 || isAnnounceMent}
            onClick={this.handleDelete}
          >
            {messageStore.languages.remove}
          </Button>
          <Button
            // icon="shuaxin"
            style={{ color: '#04173f' }}
            onClick={this.refresh}
          >
            <Icon type="shuaxin" style={{ color: '#2196f3' }} />
            {messageStore.languages.refresh}
          </Button>
        </Header>
        <Content>
          <div className={classnames('c7n-iam-user-msg-btns', { 'c7n-iam-user-msg-btns-hidden': currentType === 'announcement' })}>
            <Button
              className={this.getUserMsgClass('unRead')}
              onClick={() => { this.showUserMsg(0); }}
              style={{ display: 'inline-block', borderRadius: '4px 0px 0px 4px' }}
              type="primary"
            >
              {messageStore.languages[`${intlPrefix}.unRead.message`]}({msgUnCount})
            </Button>
            <Button
              className={this.getUserMsgClass('all')}
              onClick={() => { this.showUserMsg(1); }}
              style={{ display: 'inline-block', borderRadius: '0px 4px 4px 0px' }}
              type="primary"
            >{messageStore.languages[`${intlPrefix}.allMessage`]}
                ({msgAllCount})
            </Button>
          </div>
          <List
            style={{ width: isAnnounceMent ? '100%' : 'calc(100%)' }}
            className="c7n-iam-user-msg-list"
            loading={messageStore.getLoading}
            itemLayout="horizontal"
            pagination={pagination}
            dataSource={isAnnounceMent ? announceMsg : userMsg}
            renderItem={item => (this.renderUserMsgCard(item))}
            split={false}
          />
          {
              this.state.preview ? (
                <Modal
                  title={this.renderTitle()}
                  visible={this.state.preview}
                  footer={[
                    <Button key="submit" type="primary" loading={this.state.submitting} onClick={this.handleOk}>
                      {messageStore.languages.agree}
                    </Button>,
                    <Button key="back" onClick={this.handleCancel}>
                      {messageStore.languages.reject}
                    </Button>,
                  ]}
                  width="30%"
                  style={{ top: 100 }}
                  className="invite-modal"
                  onCancel={() => {
                    this.setState({ preview: false });
                    this.getUserBacklogData();
                  }}
                >
                  {this.renderPreviewContent()}
                </Modal>
              ) : ''
            }
        </Content>
      </Page>
    );
  }
}


export default withRouter(injectIntl(MessageHome));
