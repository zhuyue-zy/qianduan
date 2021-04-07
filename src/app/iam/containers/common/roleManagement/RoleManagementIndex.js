import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const roleManagementHome = asyncRouter(() => import('./roleManagementHome'), () => import('../../../stores/globalStores/roleManagement'));

const RoleManagementIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={roleManagementHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default RoleManagementIndex;
