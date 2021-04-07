
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const partnerHome = asyncRouter(() => import('./partnerHome'), () => import('../../../stores/organization/partnerProject'));

const PartnerIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={partnerHome} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default PartnerIndex;
