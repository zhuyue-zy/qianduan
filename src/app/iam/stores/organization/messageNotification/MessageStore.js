
import { action, computed, observable } from 'mobx';
import { axios, store, stores } from 'yqcloud-front-boot';
import queryString from 'query-string';
import LanguageStore from '../../language/languageStore';

const { AppState } = stores;

const PAGELOADSIZE = 25;
const PAGESIZEOPTIONS = [25, 50, 100, 200];
@store('MessageStore')
class MessageStore extends LanguageStore {
  constructor() {
    super('messageNotification');
  }

  @observable userMsg = [];

  @observable announceMsg = [];

  @observable typeList = [];

  @observable userInfo = {};

  @observable expandCardId = 0;

  @observable userCount = 0;

  @observable userAllCount = 0;

  @observable selectMsg = new Set();

  @observable expandMsg = new Set();

  @observable currentType = 'msg';

  @observable showAll = false;

  @observable loading = true;

  @observable pagination= {
    current: 1,
    pageSize: PAGELOADSIZE,
    pageSizeOptions: PAGESIZEOPTIONS,
    total: 0,
    onChange: this.paginationChange,
    onShowSizeChange: this.paginationChange,
  };

  @observable sort = {
    columnKey: 'receiveDate',
    order: 'desc',
  };

  @observable filters = {};

  @observable params = [];

  @observable loadingMore = false;

  @observable needReload = false;

  @action
  setNeedReload(flag) {
    this.needReload = flag;
  }

  @computed get getNeedReload() { return this.needReload; }

  @action
  initPagination() {
    this.pagination = {
      current: 1,
      pageSize: PAGELOADSIZE,
      pageSizeOptions: PAGESIZEOPTIONS,
      total: 0,
      totalPages: 0,
      onChange: this.paginationChange,
      onShowSizeChange: this.paginationChange,
    };
  }

  @action
  setTypeList(typeList) {
    this.typeList = typeList;
  }

  @computed
  get getTypeList() {
    return this.typeList;
  }

  @action paginationChange = (current, pageSize) => {
    this.pagination.current = current;
    this.pagination.pageSize = pageSize;
    document.getElementsByClassName('page-content')[0].scrollTop = 0;
    this.loadData(AppState.userInfo.organizationId, this.pagination, {}, {}, {}, this.showAll, false);
  };

  @action expandAllMsg() {
    const msg = this.currentType === 'announcement' ? this.getAnnounceMsg.map(action(v => v.noticeId)) : this.getUserMsg.map(action(v => v.noticeId));
    this.expandMsg = new Set([...this.expandMsg, ...msg]);
  }

  @action selectAllMsg() {
    this.selectMsg = new Set([...this.selectMsg, ...this.getUserMsg.map(action(v => v.noticeId))]);
  }

  @action unSelectAllMsg() {
    this.selectMsg = new Set([...this.selectMsg].filter(x => !this.userMsg.find(v => v.noticeId === x)));
  }

  @computed
  get isAllSelected() {
    return !this.getUserMsg.some(v => !this.selectMsg.has(v.noticeId));
  }

  @computed
  get getCurrentType() {
    return this.currentType;
  }

  @action
  setCurrentType(newType) {
    this.currentType = newType;
  }

  @computed
  get getPagination() {
    return this.pagination;
  }

  @computed
  get getSelectMsg() {
    return this.selectMsg;
  }

  @action
  addSelectMsgById(id) {
    this.selectMsg = new Set([...this.selectMsg, id]);
  }

  @action
  clearSelectMsg() {
    this.selectMsg = new Set([]);
  }

  @computed
  get getExpandMsg() {
    return this.expandMsg;
  }

  @action
  expandMsgById(noticeId) {
    this.expandMsg = new Set([...this.expandMsg, noticeId]);
  }

  @action
  unExpandMsgById(noticeId) {
    this.expandMsg = new Set([...this.expandMsg].filter(v => v !== noticeId));
  }

  @computed
  get getLoading() {
    return this.loading;
  }

  @computed
  get getLoadingMore() {
    return this.loadingMore;
  }

  @action
  setLoadingMore(flag) {
    this.loadingMore = flag;
  }

  @action
  setLoading(flag) {
    this.loading = flag;
  }

  @action
  deleteSelectMsgById(noticeId) {
    this.selectMsg = new Set([...this.selectMsg].filter(v => v !== noticeId));
  }

  @computed
  get getExpandCardId() {
    return this.expandCardId;
  }

  @action
  setExpandCardId(id) {
    this.expandCardId = id;
    this.setReadLocal(id);
  }

  @computed
  get getUserMsg() {
    return this.userMsg;
  }

  @action
  setUserMsg(data) {
    this.userMsg = data;
  }

  @computed
  get getAnnounceMsg() {
    return this.announceMsg;
  }

  @action
  setAnnounceMsg(data) {
    this.announceMsg = data;
  }

  @computed
  get getUserInfo() {
    return this.userInfo;
  }

  @action
  setUserInfo(data) {
    this.userInfo = data;
  }

  @action
  setReadLocal(id) {
    this.userMsg.forEach((v) => {
      if (v.id === id) v.isRead = 1;
    });
  }

  @action
  setUserCount(data) {
    this.userCount = data;
  }

  @computed
  get getUserCount() {
    return this.userCount;
  }

  @action
  setUserAllCount(data) {
    this.userAllCount = data;
  }

  @computed
  get getUserAllCount() {
    return this.userAllCount;
  }


  @computed
  get isNoMore() {
    return this.pagination.current === this.pagination.totalPages;
  }


  /**
   * ??????data????????????store??????????????????????????????
   * @param data
   * @returns {*|IDBRequest|Promise<void>}
   */
  @action
  readMsg(iamOrganizationId, data) {
    data = data === undefined ? [...this.selectMsg] : data;
    return axios.put(`/message/v1/${iamOrganizationId}/msg/notice/read/marks/ids`, JSON.stringify(data));
  }

  /**
   * ??????data????????????store??????????????????????????????
   * @param data
   * @returns {*|IDBRequest|Promise<void>}
   */
  @action
  deleteMsg(iamOrganizationId, data) {
    data = data === undefined ? [...this.selectMsg] : data;
    return axios.delete(`/message/v1/${iamOrganizationId}/msg/notice/delete`, { data: JSON.stringify(data) });
  }

  // ?????????????????????
  queryTypeLists=(iam_organization_id, code) => axios.get(`fnd/v1/${iam_organization_id}/lookup/value/dto/site?lookupTypeCode=${code}`).then(data => data)

  /**
   * ?????????load????????????????????????Promise
   * @param pagination
   * @param filters
   * @param columnKey
   * @param order
   * @param params
   * @param showAll ???true???????????????????????????false?????????????????????
   * @param type ??????????????????????????????????????????????????????
   * @returns {*} ??????????????????Promise
   */
  @action load(iamOrganizationId, pagination = this.pagination, filters = this.filters, { columnKey = 'receiveDate', order = 'desc' }, params = this.params, showAll, type) {
    const sorter = [];
    if (columnKey) {
      sorter.push(columnKey);
      if (order === 'desc') {
        sorter.push('desc');
      }
    }
    this.filters = filters;
    this.params = params;
    return axios.get(`/message/v1/${iamOrganizationId}/msg/notice/page/list?${queryString.stringify({
      user_id: this.userInfo.id,
      isRead: showAll ? null : 0,
      page: pagination.current - 1,
      size: pagination.pageSize,
      sort: sorter.join(','),
      type,
    })}`);
  }

  loadDateMsgNum = iamOrganizationId => axios.get(`/message/v1/${iamOrganizationId}/msg/notice/page/list?size=10000&user_id=${this.userInfo.id}`);

  @action loadAnnouncement(pagination = this.pagination, filters, sort, params = this.params) {
    return axios.get(`/notify/v1/system_notice/completed?${queryString.stringify({
      page: pagination.current - 1,
      size: pagination.pageSize,
    })}`);
  }

  /* code????????? */
  getMessage = (iamOrganizationId, messageCode) => axios.get(`/fnd/v1/${iamOrganizationId}/sys/select_by_code?messageCode=${messageCode}`);

  /* ???????????? */
  inviteOk = (iamOrganizationId, email) => axios.post(`iam/v1/organizations/${iamOrganizationId}/users/invitation/accept?emailName=${email}`);

  /* ???????????? */
  inviteReject = (iamOrganizationId, email) => axios.post(`iam/v1/organizations/${iamOrganizationId}/users/invitation/refuse?emailName=${email}`);

  /**
   *
   * @param pagination ??????
   * @param filters ??????
   * @param columnKey
   * @param order
   * @param params
   * @param showAll ???true???load???????????????????????????false??????load????????????
   * @param isWebSocket ???????????????webSocket??????????????????????????????????????????????????????????????????webSocket????????????????????????????????????false?????????
   * @param msgId ?????????????????????msgId
   * @param type
   */
  @action
  loadData(organizationId, pagination = this.pagination, filters = this.filters, { columnKey = 'receiveDate', order = 'desc' }, params = this.params, showAll, isWebSocket, msgId, type = this.currentType) {
    if (isWebSocket) this.setLoadingMore(true); else this.setLoading(true);
    if (type !== 'announcement') {
      this.load(organizationId, pagination, filters, { columnKey, order }, params, showAll, type).then(action((data) => {
        this.setUserMsg(data.content ? data.content : data);
        const a = data.content ? data.content : data;
        this.expandMsg = new Set(a.map(k => k.noticeId))
        if (showAll === 0) {
          this.setUserCount(data.content.length);
        }
        if (showAll === 1) {
          this.setUserAllCount(data.content.length);
        }

        // ??????????????????????????????????????????????????????????????????????????????
        this.showAll = showAll;
        if (!showAll) this.expandAllMsg();
        this.pagination.totalPages = data.content ? data.totalPages : data.length / PAGELOADSIZE + 1;
        if (isWebSocket) this.setLoadingMore(false); else this.setLoading(false);
        if (msgId) {
          this.setExpandCardId(msgId);
          this.readMsg([msgId]);
        }
        this.pagination = {
          ...pagination,
          total: data.totalElements,
          pageSize: this.pagination.pageSize,
          onChange: this.pagination.onChange,
          pageSizeOptions: PAGESIZEOPTIONS,
          onShowSizeChange: this.pagination.onShowSizeChange,
        };
        this.setLoading(false);
      }))
        .catch(action((error) => {
          if (isWebSocket) this.setLoadingMore(false); else this.setLoading(false);
          Choerodon.prompt(error.response.statusText);
        }));
    } else {
      this.loadAnnouncement(pagination = this.pagination, filters, { columnKey, order }, params).then(action((data) => {
        this.setAnnounceMsg(data.content);
        this.showAll = true;
        this.expandAllMsg();
        this.pagination.totalPages = data.content ? data.totalPages : data.length / PAGELOADSIZE + 1;
        this.pagination = {
          ...pagination,
          total: data.totalElements,
          pageSize: this.pagination.pageSize,
          onChange: this.pagination.onChange,
          pageSizeOptions: PAGESIZEOPTIONS,
          onShowSizeChange: this.pagination.onShowSizeChange,
        };
        this.setLoading(false);
      }));
    }
  }
}

const messageStore = new MessageStore();

export default messageStore;
