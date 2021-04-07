/**
 * Created by Nanjiangqi on 2018-10-16 0027.
 */
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const workflowHome = asyncRouter(() => import('./WorkflowHome'), () => import('../../../stores/organization/approvalWorkflow'));
const Modification = asyncRouter(() => import('./modification'));

const WorkflowIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}`} component={workflowHome} />
    <Route path={`${match.url}/edit/:id`} component={Modification} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default WorkflowIndex;
