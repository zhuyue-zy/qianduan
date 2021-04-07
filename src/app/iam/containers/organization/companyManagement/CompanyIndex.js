/**
 * Created by Nanjiangqi on 2018-9-27 0027.
 */
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const companyHome = asyncRouter(() => import('./companyHome'), () => import('../../../stores/organization/companyManagement'));

const CompanyIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={companyHome} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default CompanyIndex;
