/** 2019/5/22
*作者:高梦龙
*项目： API配置管理
*/

import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const ApiConfiguration = asyncRouter(() => import('./ApiConfiguration'));
const ApiConfigurationsIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={ApiConfiguration} />
    <Route path="*" component={nomatch} />
  </Switch>
);
export default ApiConfigurationsIndex;
