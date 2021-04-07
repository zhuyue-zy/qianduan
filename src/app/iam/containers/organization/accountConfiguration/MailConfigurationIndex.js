import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const configurationHome = asyncRouter(() => import('./configurationHome'), () => import('../../../stores/organization/accountConfiguration'));

const MailConfigurationIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={configurationHome} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default MailConfigurationIndex;
