import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const apiCallManagementHome = asyncRouter(() => import('./apiCallManagementHome'),() => import('../../../stores/globalStores/apiCallManagement'));
const apiCallManagement = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={apiCallManagementHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);
export default apiCallManagement;
