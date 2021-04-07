/**
 * Created by kaicheng.liu on 2019/02/21.
 * 用于存储一些通用的数据
 */

import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import querystring from 'query-string';
import LanguageStore from '../language/languageStore';

@store('UtilStore')
class UtilStore extends LanguageStore {
  constructor() {
    super('util');
  }

  @observable backgroundUrl = '';

  @action setBackgroundUrl(flag) {
    this.backgroundUrl = flag;
  }

  @computed get getBackgroundUrl() {
    return this.backgroundUrl;
  }
}

const utilStore = new UtilStore();

export default utilStore;
