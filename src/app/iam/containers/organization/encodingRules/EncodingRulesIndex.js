import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const EncodingHome = asyncRouter(() => import('./encodingHome'),
  () => import('../../../stores/organization/encodingRules/EncodingStore'));
const EncodingEdit = asyncRouter(() => import('./encodingEdit'));
const ReplaceEncoding = asyncRouter(() => import('./replaceEncoding'));


const EncodingIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={EncodingHome} />
    <Route path={`${match.url}/edit/:id`} component={EncodingEdit} />
    <Route path={`${match.url}/replace/:id`} component={ReplaceEncoding} />
    <Route path={`${match.url}/create`} component={EncodingEdit} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default EncodingIndex;
