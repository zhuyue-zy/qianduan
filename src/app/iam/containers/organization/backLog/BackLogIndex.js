import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const BackHome = asyncRouter(() => import('./backLogHome'));
const EditBackLog = asyncRouter(() => import('./backLogEdit'))

const BackLogIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={BackHome} />
    <Route path={`${match.url}/edit/:id`} component={EditBackLog} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default BackLogIndex;
