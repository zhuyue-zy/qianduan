import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const AccountSecurityManagementHome = asyncRouter(() => import('./AccountSecurityManagementHome'), () => import('../../../stores/organization/accountSecurityManagement'));

const AccountSecurityManagementIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={AccountSecurityManagementHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default AccountSecurityManagementIndex;
