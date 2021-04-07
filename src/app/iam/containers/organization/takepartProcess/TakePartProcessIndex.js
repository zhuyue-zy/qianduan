/** 2018/10/29
*作者:高梦龙
*项目：我参与的流程路由
*/
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const TakePartHome = asyncRouter(() => import('./takePartHome'));
const ProcessMonitorDetail = asyncRouter(
  () => import('./processMonitorDetail'),
);
const takePartIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={TakePartHome} />
    <Route path={`${match.url}/edit/:id`} component={ProcessMonitorDetail} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default takePartIndex;
