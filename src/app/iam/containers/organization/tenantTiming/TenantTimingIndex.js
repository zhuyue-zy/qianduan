/** 2019/8/8
 *作者:高梦龙
*文件名： 租户定时任务
*/
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const TenantTimeHome = asyncRouter(() => import('./tenantTimeHome'));
const TenantTimeEdit = asyncRouter(() => import('./tenantTimeEdit'));
const TenantTimeDetail= asyncRouter(() => import('./tenantTimeDetail'));

const TenantTimingIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={TenantTimeHome} />
    <Route path={`${match.url}/edit/:id`} component={TenantTimeDetail} />
    <Route path={`${match.url}/create/:id`} component={TenantTimeEdit} />
    <Route path={`${match.url}/create`} component={TenantTimeEdit} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default TenantTimingIndex;


