import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const ServicePortal = asyncRouter(() => import('./servicePortalHome'), () => import('../../../stores/organization/servicePortal'));
const EditServicePortal = asyncRouter(() => import('./editServicePortal'), () => import('../../../stores/organization/servicePortal'));

const ServicePortalIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={ServicePortal} />
    <Route path={`${match.url}/edit`} component={EditServicePortal} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default ServicePortalIndex;
