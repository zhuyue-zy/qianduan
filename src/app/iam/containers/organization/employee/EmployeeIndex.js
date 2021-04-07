import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const EmployeeHome = asyncRouter(() => import('./employeeHome'), () => import('../../../stores/organization/employee/EmployeeStore'));
const extendedField = asyncRouter(() => import('./extendedField'), () => import('../../../stores/organization/employee/EmployeeStore'));

const EmployeeIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={EmployeeHome} />
    <Route path={`${match.url}/extendedField`} component={extendedField} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default EmployeeIndex;
