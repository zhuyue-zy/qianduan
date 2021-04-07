import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const WorkFlowHome = asyncRouter(
  () => import('./workFlowHome'),
);

const BackLogIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={WorkFlowHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default BackLogIndex;
