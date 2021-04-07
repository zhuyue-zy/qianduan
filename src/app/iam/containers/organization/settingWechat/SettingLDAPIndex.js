import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const SettingLDAPHome = asyncRouter(
  () => import('./settingLDAPHome'),
);

const SettingLDAPIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={SettingLDAPHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default SettingLDAPIndex;
