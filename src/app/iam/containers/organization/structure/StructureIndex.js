import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const StructureHome = asyncRouter(() => import('./structureHome'), () => import('../../../stores/organization/structure/StructureStore'));

const StructureIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={StructureHome} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default StructureIndex;
