import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const Announcement = asyncRouter(() => import('./announcementHome'), () => import('../../../stores/globalStores/siteAnnouncement'));
const Detail = asyncRouter(() => import('./editAnnouncement'), () => import('../../../stores/globalStores/siteAnnouncement'));

const AnnouncementIndex = ({ match }) => (
  <Switch>
    <Route exact path={`${match.url}/site`} component={Announcement} />
    <Route path={`${match.url}/site/create`} component={Detail} />
    <Route path={`${match.url}/site/edit/:id`} component={Detail} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default AnnouncementIndex;
