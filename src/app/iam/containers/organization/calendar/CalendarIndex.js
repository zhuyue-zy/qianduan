/**
 * Create By liuchuan on 2018/9/17.
 */
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const CalendarHome = asyncRouter(() => import('./calendarHome'));
const EditCalendar = asyncRouter(() => import('./editCalendar'));

const CalendarIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={CalendarHome} />
    <Route path={`${match.url}/edit/:id`} component={EditCalendar} />
    <Route path={`${match.url}/create`} component={EditCalendar} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default CalendarIndex;
