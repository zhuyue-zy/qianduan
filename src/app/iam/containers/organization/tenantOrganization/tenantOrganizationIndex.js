import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const tenantOrganizationHome = asyncRouter(() => (import('./tenantOrganizationHome')));

const OrganizationIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={tenantOrganizationHome} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default OrganizationIndex;
