import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const BusinessParamHome = asyncRouter(
  () => import('./businessParamHome'),
);

const BusinessParamIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={BusinessParamHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default BusinessParamIndex;
