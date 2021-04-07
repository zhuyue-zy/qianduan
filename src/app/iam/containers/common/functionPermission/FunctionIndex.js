/**
 * Created by kanghua.pang on 2018-12-14
 */
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const functionHome = asyncRouter(() => import('./functionPermission'), () => import('../../../stores/globalStores/function'));

const FunctionIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={functionHome} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default FunctionIndex;
