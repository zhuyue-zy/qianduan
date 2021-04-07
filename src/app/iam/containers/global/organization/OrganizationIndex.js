/**
 * Created by chesmilesoulon on 3/26/18.
 */

import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const Organization = asyncRouter(
  () => (import('./Organization')),
  () => import('../../../stores/globalStores/organization')
);
const EditOrganization = asyncRouter(
  () => import('./organizationEdit'),
);
const CreateOrganization = asyncRouter(
  () => import('./createOrganization'),
);

const OrganizationIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={Organization} />
    <Route path={`${match.url}/organizationEdit/:id`} component={EditOrganization} />
    <Route path={`${match.url}/organizationCreate`} component={CreateOrganization} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default OrganizationIndex;
