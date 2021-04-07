/** 2019/12/9
*作者:高梦龙
*项目: 通话中心
*/

import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const CallCenterHome = asyncRouter(() => import('./callCenterHome'));
const CallCenterHomeIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={CallCenterHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);
export default CallCenterHomeIndex;
