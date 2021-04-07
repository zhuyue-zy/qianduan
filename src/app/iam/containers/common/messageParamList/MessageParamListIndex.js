import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const MessageParamListHome = asyncRouter(
  () => import('./messageParamListHome'),
);

const MessageParamListIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={MessageParamListHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default MessageParamListIndex;
