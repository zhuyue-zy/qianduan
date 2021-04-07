/*
* @description:编辑快码的侧边栏
* @author：郭杨
* @update 2018-09-18 16:44
*/
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

// require('../lookup/LookUpEditor');
const LookupHome = asyncRouter(
  () => import('./LookupHome'),
  () => import('../../../stores/organization/lookup/LookupHomeStore'),
);

const LookupIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={LookupHome} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default LookupIndex;
