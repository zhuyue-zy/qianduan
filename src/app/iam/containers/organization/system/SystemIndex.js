import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const SystemHome = asyncRouter(() => import('./systemHome'), () => import('../../../stores/organization/system/SystemStore'));

const SystemIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={SystemHome} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default SystemIndex;
