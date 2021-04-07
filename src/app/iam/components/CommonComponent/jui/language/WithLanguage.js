/**
 * 组件库多语言统一加载
 * create by jyjin 
 *          at 2019.06.12
 * 
 * 注意；
 *    1.如果其他项目使用此文件，请注意修改namespace【_jui_module_】的值，防止被污染
 *    2.个人信息修改的地方语言切换，需要清空__LAN__
 */
import React from 'react'
import zh_CN from './zh_CN';
import en_US from './en_US';
import queryString from 'query-string';
import { axios, stores } from 'yqcloud-front-boot'

const JUI_MODULE = 'IAM'         // ！！！！需要配置，防止与其他项目冲突！！！！
const LOOP_TICK = 400
const { AppState } = stores;

export default (ele) => {

  class WithLanguage extends React.Component {

    state = {
      language: null,
      local: AppState.currentLanguage || navigator.languages ? navigator.languages[0] : (navigator.language || navigator.userLanguage),
    }

    componentWillMount() {
      if (undefined === window.__LAN__) {
        window.__LAN__ = {}
      }

      if (undefined == window.__LAN__[JUI_MODULE]) {
        window.__LAN__[JUI_MODULE] = {}
      }

      // 只发送一次多语言请求
      if (!window.__LAN__[JUI_MODULE].juiLanState) {
        window.__LAN__[JUI_MODULE].juiLanState = 'pending'
        this.fetchData().then(language => {
          window.__LAN__[JUI_MODULE].juiLanState = 'finish'
          window.__LAN__[JUI_MODULE].juiLanguage = language
          this.setState({ language })
        })
      } else {
        const t = setInterval(() => {
          // console.log('waiting language ...')
          if (window.__LAN__[JUI_MODULE].juiLanState === 'finish') {
            this.setState({
              language: window.__LAN__[JUI_MODULE].juiLanguage
            })
            clearInterval(t)
          }
        }, LOOP_TICK)
      }
    }

    fetchData() {
      const data = queryString.parse(location.hash.split('?')[1])
      const { organizationId } = data
      let requestCode = []
      let fromLanguage = zh_CN
      if (this.state.local == 'en_US') {
        fromLanguage = en_US
      }
      Object.keys(fromLanguage).map(item => {
        requestCode = requestCode.concat(Object.keys(zh_CN[item]))
      })
      const url = `fnd/v1/${organizationId}/prompts/multi/language/site`
      const param = JSON.stringify(requestCode)
      return new Promise(resolve => {
        axios.post(url, param).then(json => {
          resolve(json)
        })
      })
    }

    /**
     * 
     * @param {*} key               多语言key值
     * @param {*}    ...arguments   多语言变量替换值，不传代码不替换
     *                              如：iam.jui.tipMessage: '你有${}条消息，来自${}个人，他们来自${}国家'
     *                                  i18n('iam.jui.tipMessage', 10, 3, '西方')
     *                                  你有10条消息，来自3个人，他们来自西方国家
     */
    i18n(key) {
      if (!this.state.language) {
        return key.toUpperCase()
      } else {
        if (arguments.length > 1) {
          let str = this.state.language
          Array.prototype.slice.call(arguments, 1, arguments.length).map(item => {
            str = str.replace(/\$\{\}/, item)
          })
          return str
        } else {
          return this.state.language[key]
        }
      }
    }

    render() {
      // 方案一 如果多语言请求还未返回结果 默认不显示整个组件
      // if (!this.state.language) {
      //   return React.createElement(ele, { language, ...this.props, i18n: this.i18n.bind(this) }, null)
      // }
      // const { language } = this.state

      // 方案一 运用i18n方法 请求未返回 默认显示多语言的key值
      return React.createElement(ele, { ...this.props, i18n: this.i18n.bind(this) }, null)
    }
  }

  return WithLanguage
}
