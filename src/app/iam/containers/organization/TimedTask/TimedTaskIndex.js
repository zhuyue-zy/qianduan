/*
* @description:定时任务路由配置
* @author：郭杨
* @update 2018-10-10 10:11
*/
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

// require('./TimedTaskHome');
const TimedTaskHome = asyncRouter(
  () => import('./TimedTaskHome'),
  () => import('../../../stores/organization/timedTask/TimedTaskHomeStore'),
);
const TimedTaskHistoryView = asyncRouter(() => import('./TimedTaskHistory'));


const TimedTaskIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={TimedTaskHome} />
    <Route path={`${match.url}/history`} component={TimedTaskHistoryView} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default TimedTaskIndex;
