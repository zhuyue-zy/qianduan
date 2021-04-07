import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const Message = asyncRouter(
  () => import('./messageHome'),
  () => import('../../../stores/organization/message/MessageStore'),
);

const MessageIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={Message} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default MessageIndex;
