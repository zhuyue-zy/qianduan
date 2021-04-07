/** 2018/10/30
*作者:高梦龙
*项目：发起流程页面
*/
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const LaunchHome = asyncRouter(() => import('./launchHome'));
const ProcessMonitorDetail = asyncRouter(
  () => import('./processMonitorDetail'),
);
const LaunchIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={LaunchHome} />
    <Route path={`${match.url}/edit/:id`} component={ProcessMonitorDetail} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default LaunchIndex;
