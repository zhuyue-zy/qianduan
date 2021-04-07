/** 2018/11/6
*作者:高梦龙
*项目：消息模板
*/
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { asyncRouter, nomatch } from 'yqcloud-front-boot';

const MessageTemplateHome = asyncRouter(() => import('./messageTemplateHome'));
const MessageTemplateEdit = asyncRouter(() => import('./messageTemplateEdit'));

const MessageTemplateIndex = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={MessageTemplateHome} />
    <Route path={`${match.url}/edit/:id`} component={MessageTemplateEdit} />
    <Route path={`${match.url}/create`} component={MessageTemplateEdit} />
    <Route path="*" component={nomatch} />
  </Switch>
);

export default MessageTemplateIndex;




