  /** 2019/4/10
*作者:高梦龙
*
*/

import { action, computed, observable } from 'mobx';
import { axios, store } from 'yqcloud-front-boot';
import zh_CN from './locale/zh_CN';
import en_US from './locale/en_US';
import ja_JP from './locale/ja_JP';

@store('LanguageStore')
class LanguageStore {
  constructor(flag) {
    this.flag = flag;
  }

  @observable languages = {};

  @observable languageEnv = [];

  @action
  setLanguages(flag) {
    this.languages = flag;
  }

  @computed
  get getLanguages() {
    return this.languages;
  }

  @action
  setLanguageEnv(flag) {
    this.languageEnv = flag;
  }

  @computed
  get getLanguageEnv() {
    return this.languageEnv;
  }


  /**
   * 温馨提示：
   *    请前往/language/locale/XXX.js 定义请求语言的参数
   *    尽量不要单独用otherCode定义参数
   *    —— add by Steven King
   */
  queryLanguage = (iamOrganizationId, langauge = 'zh_CN', otherCode = []) => {
    let allLanglist = {};
    const zhCnList = { ...zh_CN[this.flag], ...zh_CN.common };
    if (langauge === 'en_US') {
      allLanglist = { ...en_US[this.flag], ...en_US.common };
    } else if(langauge === 'ja_JP') {
      allLanglist = { ...ja_JP[this.flag], ...ja_JP.common };
    } else {
      allLanglist = zhCnList;
    }
    const requestCode = [...Object.keys(zhCnList), ...otherCode];
    this.setLanguages(allLanglist);

    // console.log("languageStore line62");
    // console.log(requestCode);
    // console.log("languageStore line64");
    // 先查租户  后查平台
    // return axios.post(`fnd/v1/${iamOrganizationId}/prompts/multi/lan`, JSON.stringify(requestCode))
    // 只查平台
    return axios.post(`fnd/v1/${iamOrganizationId}/prompts/multi/language/site`, JSON.stringify(requestCode))
      .then((lang) => {
        const langlist = {};
        requestCode.forEach((v) => {
          langlist[v] = lang[v] || v;
        });
        this.setLanguages(langlist);
        return lang;
      });
  };

  queryLanguageEnv = () => {
    axios.get('iam/v1/languages/list')
      .then((allLanguage) => {
        this.setLanguageEnv(allLanguage);
      });
  };
}

export default LanguageStore;
