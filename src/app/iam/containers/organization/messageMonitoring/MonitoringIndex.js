/**
 * Created by Administrator on 2018-11-9 0009.
 */
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const monitoringHome = asyncRouter(() => import('./MonitoringHome'));

const MonitoringIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={monitoringHome} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default MonitoringIndex;
