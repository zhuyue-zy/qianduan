
import React from 'react';
import { Route, Switch, } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const AccountBinding = asyncRouter(() => import('./AccountBinding'));

const AccountBindingIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={AccountBinding} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default AccountBindingIndex;
