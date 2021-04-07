import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const MemberCapabilityHome = asyncRouter(() => import('./memberCapabilityHome'),
  () => import('../../../stores/organization/memberCapability/MemberCapabilityStore'));


const MemberCapabilityIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={MemberCapabilityHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default MemberCapabilityIndex;
