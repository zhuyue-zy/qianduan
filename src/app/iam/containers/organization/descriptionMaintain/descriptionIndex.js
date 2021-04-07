/** 2018/10/13
*作者:高梦龙
*功能模块：描述维护
*/

import React from 'react';
import {Route,Switch} from 'react-router-dom';
import {asyncRouter,nomatch} from 'yqcloud-front-boot';

const DescriptionHome =asyncRouter(
  () =>import('./descriptionHome'),
  () =>import('../../../stores/organization/descriptionMaintain/descriptionStore/DescriptionStore')
);

const DescriptionIndex=({match}) => {return(
  <Switch>
    <Route exact path={match.url} component={DescriptionHome}/>
    <Route path={'*'} component={nomatch}/>
  </Switch>

)};
export default DescriptionIndex;





