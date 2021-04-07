import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const AutomaticHome = asyncRouter(
  () => import('./automaticHome'),
  () => import('../../../stores/organization/automaticTransfer'),
);

const AutomaticIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={AutomaticHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default AutomaticIndex;
