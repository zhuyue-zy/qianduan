import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const organizationHome = asyncRouter(() => import('./organizationHome'), () => import('../../../stores/organization/organizationManagement'));

const OrganizationIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={organizationHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default OrganizationIndex;
