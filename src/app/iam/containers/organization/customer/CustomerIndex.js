import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const CustomerHome = asyncRouter(() => import('./customerHome'), () => import('../../../stores/organization/customer/CustomerStore'));

const CustomerIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={CustomerHome} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default CustomerIndex;
