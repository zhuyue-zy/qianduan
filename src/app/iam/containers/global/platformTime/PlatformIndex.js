import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const platFormHome = asyncRouter(() => (import('./platFormHome')));
const createPlateform = asyncRouter(() => (import('./createPlateform')));

const PlatformIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={platFormHome} />
    <Route path={`${match.url}/edit/:id`} component={createPlateform} />
    <Route path={`${match.url}/create`} component={createPlateform} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default PlatformIndex;
