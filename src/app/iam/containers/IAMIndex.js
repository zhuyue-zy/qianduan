import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { inject } from 'mobx-react';
import { asyncLocaleProvider, asyncRouter, nomatch } from 'yqcloud-front-boot';


// const ClientIndex = asyncRouter(() => import('./organization/client'));
const UserIndex = asyncRouter(() => import('./organization/user'));
const ProjectIndex = asyncRouter(() => import('./organization/project'));
const ProjectMIndex = asyncRouter(() => import('./organization/messageNotification'));
const MsgSettingIndex = asyncRouter(() => import('./organization/msgReceiveSetting'));
const ProcessIndex = asyncRouter(() => import('./organization/processMonitoring'));
const PartnerIndex = asyncRouter(() => import('./organization/partnerProject'));
// const PasswordPolicyIndex = asyncRouter(() => import('./organization/passwordPolicy'));
const LDAPIndex = asyncRouter(() => import('./organization/ldap'));
const OrganizationIndex = asyncRouter(() => import('./organization/organizationManagement'));
const CompanyIndex = asyncRouter(() => import('./organization/companyManagement'));
const PositionIndex = asyncRouter(() => import('./organization/positionManagement'));
const EmployeeIndex = asyncRouter(() => import('./organization/employee'));
const ValueIndex = asyncRouter(() => import('./organization/valueGroup'));
const ValueGroupLook = asyncRouter(() => import('./organization/valueGroup/valueGroupLook'));
const CalendarIndex = asyncRouter(() => import('./organization/calendar'));
const LookupIndex = asyncRouter(() => import('./organization/lookup'));
const TimedTaskIndex = asyncRouter(() => import('./organization/TimedTask'));
const MessageIndex = asyncRouter(() => import('./organization/message'));
const DescriptionIndex = asyncRouter(() => import('./organization/descriptionMaintain'));
const AnnouncementIndex = asyncRouter(() => import('./organization/announcement'));
const AutomaticIndex = asyncRouter(() => import('./organization/automaticTransfer'));
const BackLogIndex = asyncRouter(() => import('./organization/backLog'));
const WorkFlowIndex = asyncRouter(() => import('./organization/workflowTest'));
// const SettingLDAPIndex = asyncRouter(() => import('./organization/settingLDAP'));
const SettingWechatIndex = asyncRouter(() => import('./organization/settingWechat'));
const TakePartIndex = asyncRouter(() => import('./organization/takepartProcess'));
const LaunchIndex = asyncRouter(() => import('./organization/launchProcess'));
const WorkflowIndex = asyncRouter(() => import('./organization/approvalWorkflow'));
const BusinessParamIndex = asyncRouter(() => import('./organization/businessParam'));
const EncodingRulesIndex = asyncRouter(() => import('./organization/encodingRules'));
const MonitoringIndex = asyncRouter(() => import('./organization/messageMonitoring'));
const MailConfigurationIndex = asyncRouter(() => import('./organization/accountConfiguration'));
const defaultRoleIndex = asyncRouter(() => import('./common/defaultRole'));
const functionIndex = asyncRouter(() => import('./common/functionPermission'));
const MessageTemplatesIndex = asyncRouter(() => import('./organization/messageTemplate'));
const CapabilityTagIndex = asyncRouter(() => import('./organization/capabilityTag'));
const MemberCapabilityIndex = asyncRouter(() => import('./organization/memberCapability'));
const APIConfiguration = asyncRouter(() => import('./organization/apiConfiguration'));
const PortalManagement = asyncRouter(() => import('./organization/portalManagement'));
const TenantTiming = asyncRouter(() => import('./organization/tenantTiming'));
const tenantOrganization = asyncRouter(() => import('./organization/tenantOrganization'));
// const SSOConfiguration = asyncRouter(() => import('./organization/ssoConfiguration'));
const TenantApiCallManagement = asyncRouter(() => import('./organization/tenantApiCallManagement'));
const AccountSecurityManagement = asyncRouter(() => import('./organization/accountSecurityManagement'));

const ServicePortalIndex = asyncRouter(() => import('./organization/servicePortal'));

// global
const tenantIndex = asyncRouter(() => import('./global/organization'));
const RoleIndex = asyncRouter(() => import('./common/role'));
const RoleAssignIndex = asyncRouter(() => import('./common/roleAssign'));
const RoleManagIndex = asyncRouter(() => import('./common/roleManagement'));
const MemberRole = asyncRouter(() => import('./global/memberRole'));
const Application = asyncRouter(() => import('./global/application'));
const Permission = asyncRouter(() => import('./global/permission'));
const menuTree = asyncRouter(() => import('./global/menuTree'));
const MicroserviceIndex = asyncRouter(() => import('./global/microservice'));
const InstanceIndex = asyncRouter(() => import('./global/instance'));
const MessageParamList = asyncRouter(() => import('./common/messageParamList'));
// const ConfigurationIndex = asyncRouter(() => import('./global/configuration'));
const RouteIndex = asyncRouter(() => import('./global/route'));
const RootUser = asyncRouter(() => import('./global/rootUser'));
const ApitestIndex = asyncRouter(() => import('./global/apitest'));
const AnnounceIndex = asyncRouter(() => import('./common/siteAnnouncement'));
const MailConfigurationsIndex = asyncRouter(() => import('./global/mailConfiguration'));

const ProjectSettingIndex = asyncRouter(() => import('./project/projectSetting'));

const UserInfoIndex = asyncRouter(() => import('./user/userInfo'));
const PasswordIndex = asyncRouter(() => import('./user/changePassword'));
const OrganizationInfoIndex = asyncRouter(() => import('./user/organizationInfo'));
const AccountBindingIndex = asyncRouter(() => import('./user/accountBinding'));
const projectInfoIndex = asyncRouter(() => import('./user/projectInfo'));
const ApiConfigurationIndex = asyncRouter(() => import('./global/apiConfiguration'));
const PlatformTimeIndex = asyncRouter(() => import('./global/platformTime'));
const ApiCallManagement = asyncRouter(() => import('./global/apiCallManagement'));

const InternalCallback = asyncRouter(() => import('./global/internalCallback'));
const CallCenterManagement = asyncRouter(() => import('./global/callCenter'));

const SystemIndex = asyncRouter(() => import('./organization/system'));
const StructureIndex = asyncRouter(() => import('./organization/structure'));
const CustomerIndex = asyncRouter(() => import('./organization/customer'));
const CatalogueIndex = asyncRouter(() => import('./organization/catalogue'));



@inject('AppState')
class IAMIndex extends React.Component {
  render() {
    const { match, AppState } = this.props;
    const langauge = AppState.currentLanguage;
    const IntlProviderAsync = asyncLocaleProvider(langauge, () => import(`../locale/${langauge}`));
    return (
      <IntlProviderAsync>
        <Switch>
          {/* <Route path={`${match.url}/client`} component={ClientIndex} /> */}
          <Route path={`${match.url}/user`} component={UserIndex} />
          <Route path={`${match.url}/employee`} component={EmployeeIndex} />
          <Route path={`${match.url}/valueGroup`} component={ValueIndex} />
          <Route path={`${match.url}/valueGroupLook`} component={ValueGroupLook} />
          <Route path={`${match.url}/project`} component={ProjectIndex} />
          <Route path={`${match.url}/messageNotification`} component={ProjectMIndex} />
          <Route path={`${match.url}/msgReceiveSetting`} component={MsgSettingIndex} />
          <Route path={`${match.url}/processMonitoring`} component={ProcessIndex} />
          <Route path={`${match.url}/partnerProject`} component={PartnerIndex} />
          <Route path={`${match.url}/organization`} component={tenantIndex} />
          {/* <Route path={`${match.url}/password-policy`} component={PasswordPolicyIndex} /> */}
          <Route path={`${match.url}/ldap`} component={LDAPIndex} />
          <Route path={`${match.url}/organization-management`} component={OrganizationIndex} />
          <Route path={`${match.url}/companyManagement`} component={CompanyIndex} />
          <Route path={`${match.url}/position-management`} component={PositionIndex} />
          <Route path={`${match.url}/role`} component={RoleIndex} />


          <Route path={`${match.url}/defaultRole`} component={defaultRoleIndex} />
          <Route path={`${match.url}/funpermission`} component={functionIndex} />
          <Route path={`${match.url}/roleManag`} component={RoleManagIndex} />
          <Route path={`${match.url}/roleAssign`} component={RoleAssignIndex} />
          <Route path={`${match.url}/microservice`} component={MicroserviceIndex} />
          <Route path={`${match.url}/instance`} component={InstanceIndex} />
          <Route path={`${match.url}/route`} component={RouteIndex} />
          <Route path={`${match.url}/apitest`} component={ApitestIndex} />
          {/* <Route path={`${match.url}/configuration`} component={ConfigurationIndex} /> */}
          <Route path={`${match.url}/proManage`} component={ProjectSettingIndex} />
          <Route path={`${match.url}/userinfo`} component={UserInfoIndex} />
          <Route path={`${match.url}/organizationinfo`} component={OrganizationInfoIndex} />
          <Route path={`${match.url}/accountBinding`} component={AccountBindingIndex} />
          <Route path={`${match.url}/projectinfo`} component={projectInfoIndex} />
          <Route path={`${match.url}/announcement`} component={AnnouncementIndex} />

          <Route path={`${match.url}/memberRole`} component={MemberRole} />
          <Route path={`${match.url}/application`} component={Application} />
          <Route path={`${match.url}/permission`} component={Permission} />
          <Route path={`${match.url}/menuTree`} component={menuTree} />
          <Route path={`${match.url}/usermodifyPwd`} component={PasswordIndex} />
          <Route path={`${match.url}/rootuser`} component={RootUser} />
          <Route path={`${match.url}/calendar`} component={CalendarIndex} />
          <Route path={`${match.url}/lookup`} component={LookupIndex} />
          <Route path={`${match.url}/timedTask`} component={TimedTaskIndex} />
          <Route path={`${match.url}/message`} component={MessageIndex} />
          <Route path={`${match.url}/DesMaintain`} component={DescriptionIndex} />
          <Route path={`${match.url}/autoHome`} component={AutomaticIndex} />
          <Route path={`${match.url}/backLog`} component={BackLogIndex} />
          <Route path={`${match.url}/workFlowTest`} component={WorkFlowIndex} />
          {/*<Route path={`${match.url}/settingLDAP`} component={SettingLDAPIndex} />*/}
          <Route path={`${match.url}/settingWechat`} component={SettingWechatIndex} />
          <Route path={`${match.url}/takePartProcess`} component={TakePartIndex} />
          <Route path={`${match.url}/launchProcess`} component={LaunchIndex} />
          <Route path={`${match.url}/approvalWorkflow`} component={WorkflowIndex} />
          <Route path={`${match.url}/messageTemplate`} component={MessageTemplatesIndex} />
          <Route path={`${match.url}/businessParam`} component={BusinessParamIndex} />
          <Route path={`${match.url}/encodingRules`} component={EncodingRulesIndex} />
          <Route path={`${match.url}/messageMonitoring`} component={MonitoringIndex} />
          <Route path={`${match.url}/accountConfiguration`} component={MailConfigurationIndex} />
          <Route path={`${match.url}/announce`} component={AnnounceIndex} />
          <Route path={`${match.url}/mailConfiguration`} component={MailConfigurationsIndex} />
          <Route path={`${match.url}/capabilityTag`} component={CapabilityTagIndex} />
          <Route path={`${match.url}/memberCapability`} component={MemberCapabilityIndex} />
          <Route path={`${match.url}/apiConfiguration`} component={ApiConfigurationIndex} />
          <Route path={`${match.url}/apiManagement`} component={APIConfiguration} />
          <Route path={`${match.url}/portal`} component={PortalManagement} />
          <Route path={`${match.url}/messageParamList`} component={MessageParamList} />
          <Route path={`${match.url}/tenantTime`} component={TenantTiming} />
          <Route path={`${match.url}/platFormTimer`} component={PlatformTimeIndex} />
          <Route path={`${match.url}/tenantOrganization`} component={tenantOrganization} />
          <Route path={`${match.url}/apiCallManagement`} component={ApiCallManagement} />
          <Route path={`${match.url}/tenantApiCallManagement`} component={TenantApiCallManagement} />
          {/*<Route path={`${match.url}/ssoConfiguration`} component={SSOConfiguration} />*/}
          <Route path={`${match.url}/internalCallback`} component={InternalCallback} />
          <Route path={`${match.url}/accountSecurityManagement`} component={AccountSecurityManagement} />
          <Route path={`${match.url}/callCenter`} component={CallCenterManagement} />

          <Route path={`${match.url}/servicePortals`} component={ServicePortalIndex} />

          <Route path={`${match.url}/system`} component={SystemIndex} />

          <Route path={`${match.url}/structure`} component={StructureIndex} />

          <Route path={`${match.url}/customer`} component={CustomerIndex} />
          <Route path={`${match.url}/catalogue`} component={CatalogueIndex} />
          <Route path="*" component={nomatch} />
        </Switch>
      </IntlProviderAsync>
    );
  }
}

export default IAMIndex;
