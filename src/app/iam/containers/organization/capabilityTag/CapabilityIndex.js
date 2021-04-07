/** 2019/3/18
*作者:高梦龙
*项目： 能力标签路由
*/

import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const CapabilityHome = asyncRouter(() => import('./capabilityHome'),
  () => import('../../../stores/organization/capabilityTag/CapabilityStore'));
const CapabilityEdit = asyncRouter(() => import('./capabilityEdit'));


const CapabilityIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={CapabilityHome} />
    <Route path={`${match.url}/edit/:id`} component={CapabilityEdit} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default CapabilityIndex;
