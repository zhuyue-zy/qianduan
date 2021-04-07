import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const tenantApiCallManagementHome = asyncRouter(() => (import('./tenantApiCallManagementHome')),() => import('../../../stores/organization/tenantApiCallManagement'));

const tenantApiCallManagementIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={tenantApiCallManagementHome} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default tenantApiCallManagementIndex;
