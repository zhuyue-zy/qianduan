/**
 * Created by yeshuang on 2018/10/9
 */
import { action, computed, observable } from 'mobx';
import axios from 'axios';
import { store, stores } from 'yqcloud-front-boot';

const { AppState } = stores;

@store('YQQuillStore')
class CreateEventStore {
  submitFile = (formData, config) =>
    axios.post(`fileService/v1/${AppState.currentMenuType.id}/file/picture`, formData, config);

  loadFile = (fileId) =>
    axios.get(`fileService/v1/${AppState.currentMenuType.id}/file/view/${fileId}`);
}

const createEventStore = new CreateEventStore();

export default createEventStore;
