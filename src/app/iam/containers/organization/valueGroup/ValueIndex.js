/** 2018/9/18
*作者:高梦龙
*
*/
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const ValueHome = asyncRouter(
  () => import('./valueHome'),
  () => import('../../../stores/organization/valueGroup/valueStore'),
);


const ValueIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={ValueHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default ValueIndex;
