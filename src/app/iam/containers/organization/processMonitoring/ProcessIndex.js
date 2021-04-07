import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const ProcessHome = asyncRouter(
  () => import('./processHome'),
  () => import('../../../stores/organization/processMonitoring'));
const EditProcess = asyncRouter(
  () => import('./processEdit'),
);
const JumpProcess = asyncRouter(
  () => import('./processJump'),
);

const ProcessIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={ProcessHome} />
    <Route path={`${match.url}/edit/:id`} component={EditProcess} />
    <Route path={`${match.url}/jump/:id`} component={JumpProcess} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default ProcessIndex;
