/**
 * Created by hulingfangzi on 2018/6/20.
 */
import React from 'react';
import { Route, Switch, } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const Instance = asyncRouter(() => (import('./Instance')), () => import('../../../stores/globalStores/instance'));
const InstancDeatil = asyncRouter(() => import('./instanceDetail'));

const InstanceIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={Instance} />
    <Route path={`${match.url}/detail/:id`} component={InstancDeatil} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default InstanceIndex;
