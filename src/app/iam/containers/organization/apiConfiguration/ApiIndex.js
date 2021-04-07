import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const APIConfigurationHome = asyncRouter(() => import('./APIConfigurationHome'));
const APIConfigurationEdit = asyncRouter(() => import('./APIConfigurationEdit'));


const APIConfigurationIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={APIConfigurationHome} />
    <Route path={`${match.url}/edit/:id`} component={APIConfigurationEdit} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default APIConfigurationIndex;
