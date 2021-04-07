import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';
const Catalogue = asyncRouter(() => import('./catalogueHome'), () => import('../../../stores/organization/catalogue'));

const CatalogueIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={Catalogue} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default CatalogueIndex;