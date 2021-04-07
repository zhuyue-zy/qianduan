import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const DefaultRole = asyncRouter(() => (import('./defaultRoleHome/index')), () => (import('../../../stores/organization/defaultRole/index')));
// const EditRole = asyncRouter(() => (import('./roleEdit')), () => (import('../../../stores/globalStores/role')));
// const CreateRole = asyncRouter(() => (import('./roleCreate')), () => (import('../../../stores/globalStores/role')));

const DefaultRoleIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={DefaultRole} />
    {/*<Route path={`${match.url}/create`} component={CreateRole} />*/}
    {/*<Route path={`${match.url}/edit/:id`} component={EditRole} />*/}
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default DefaultRoleIndex;
