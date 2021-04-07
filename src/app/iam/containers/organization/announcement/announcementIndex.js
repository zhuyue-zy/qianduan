import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const Announcement = asyncRouter(() => import('./announcementHome'), () => import('../../../stores/organization/announcement'));
const Detail = asyncRouter(() => import('./editAnnouncement'), () => import('../../../stores/organization/announcement'));

const AnnouncementIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={Announcement} />
    <Route path={`${match.url}/create`} component={Detail} />
    <Route path={`${match.url}/edit/:id`} component={Detail} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default AnnouncementIndex;
