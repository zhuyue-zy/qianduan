import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

// const Project = asyncRouter(
// () => import('./Project'), () => import('../../../stores/organization/project/ProjectStore'));
const MsgSetting = asyncRouter(() => import('./msgSettingHome'), () => import('../../../stores/organization/msgReceiveSetting'));

const MsgSettingIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={MsgSetting} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default MsgSettingIndex;
