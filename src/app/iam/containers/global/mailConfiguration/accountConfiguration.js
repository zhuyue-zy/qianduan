/** 2019/3/13
*作者:高梦龙
*项目：平台层邮件账户配置
*/
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const mailConfigurationHome = asyncRouter(() => import('./mailAccountHome'),
  () => import('../../../stores/globalStores/mailConfiguration'));

const MailConfigurationsIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={mailConfigurationHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default MailConfigurationsIndex;
