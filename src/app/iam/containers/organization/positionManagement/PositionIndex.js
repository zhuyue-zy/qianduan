import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const positionHome = asyncRouter(() => import('./positionHome'), () => import('../../../stores/organization/positionManagement'));

const PositionIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={positionHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default PositionIndex;
