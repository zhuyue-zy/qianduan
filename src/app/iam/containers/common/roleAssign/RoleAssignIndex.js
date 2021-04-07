import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const Role = asyncRouter(() => (import('./roleHome')), () => (import('../../../stores/globalStores/role')));
const EditRole = asyncRouter(() => (import('./roleEdit')), () => (import('../../../stores/globalStores/role')));
const CreateRole = asyncRouter(() => (import('./roleCreate')), () => (import('../../../stores/globalStores/role')));

const RoleAssignIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}/:type`} component={Role} />
    <Route path={`${match.url}/:type/create`} component={CreateRole} />
    <Route path={`${match.url}/:type/edit/:id`} component={EditRole} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default RoleAssignIndex;
