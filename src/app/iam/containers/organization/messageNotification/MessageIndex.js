import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

// const Project = asyncRouter(
// () => import('./Project'), () => import('../../../stores/organization/project/ProjectStore'));
const Message = asyncRouter(() => import('./messageHome'), () => import('../../../stores/organization/messageNotification'));

const MessageIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={Message} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default MessageIndex;
