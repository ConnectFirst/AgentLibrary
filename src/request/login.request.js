
var LoginRequest = function(username, password) {
    this.username = username;
    this.password = password;
};

LoginRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IS",
            "@type":MESSAGE_TYPES.LOGIN,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "username":{
                "#text":this.username
            },
            "password":{
                "#text":this.password
            }
        }
    };

    return JSON.stringify(msg);
};


/*
 * This function is responsible for handling the login packet received from IntelliServices. It will save
 * a copy of it in the UIModel as loginPacket, as well as set the isLoggedInIS variable to
 * true (for reconnect purposes) and the loginDTS with the current date/time.
 *
 * <ui_response type="login">
 * 		<status>OK</status>
 * 		<agent_id>1810</agent_id>
 * 		<agent_pwd>bound25</agent_pwd>
 * 		<first_name>mandy</first_name>
 * 		<last_name>pants</last_name>
 * 		<email>mandypants@aol.coim</email>
 * 		<agent_type>AGENT</agent_type>
 *      <external_agent_id>blahblah</external_agent_id>
 * 		<default_login_dest>9548298548|123</default_login_dest>
 * 		<alt_default_login_dest>9548298548|123</alt_default_login_dest>
 * 		<iq_url>dev.connectfirst.com</iq_url>
 * 		<iq_port>1313</iq_port>
 * 		<iq_ssl_port>1213</iq_ssl_port>
 * 		<iq_secret_key>F-OFF</iq_secret_key>
 * 		<allow_inbound>1</allow_inbound>
 * 		<allow_outbound>1</allow_outbound>
 * 		<allow_chat>1</allow_chat>
 * 		<allow_blended>0</allow_blended>
 * 		<allow_off_hook>1</allow_off_hook>
 * 		<allow_call_control>1</allow_call_control>
 * 		<allow_login_control>1</allow_login_control>
 * 		<allow_login_updates>1</allow_login_updates>
 * 		<allow_lead_inserts>1</allow_lead_inserts>
 * 		<show_lead_history>1</show_lead_history>
 * 		<allow_cross_gate_requeue>1</allow_cross_gate_requeue>
 * 		<phone_login_dial_group>44</phone_login_dial_group>
 * 		<phone_login_pin>1234</phone_login_pin>
 *      <allow_manual_calls>1</allow_manual_calls>
 * 		<allow_manual_intl_calls>0</allow_manual_intl_calls>
 * 		<init_login_state>ON-BREAK</init_login_state>
 * 		<init_login_state_label>Morning Break</init_login_state_label>
 * 		<outbound_prepay>0</outbound_prepay>
 * 		<max_break_time>-1</max_break_time>
 * 		<max_lunch_time>-1</max_lunch_time>
 *      <allow_lead_search>YES_ALL</allow_lead_search>
 * 		<tcpa_safe_mode>1|0</tcpa_safe_mode>
 * 		<login_gates>
 * 			<gate default_dest_override="" gate_desc="" gate_id="37" gate_name="test"/>
 * 			<gate default_dest_override="" gate_desc="" gate_id="42" gate_name="test gate two"/>
 * 			<gate default_dest_override="" gate_desc="Amandas Other Gate" gate_id="46" gate_name="You know it!"/>
 * 		</login_gates>
 *		<login_chat_queues>
 *			<chat_queue chat_queue_id="" chat_queue_name="" chat_queue_description=""/>
 *			<chat_queue chat_queue_id="" chat_queue_name="" chat_queue_description=""/>
 *		</login_chat_queues>
 * 		<outdial_groups>
 * 			<group billing_key="" dial_group_desc="" dial_group_id="44"  dial_group_name="Geoff Dial Test" dial_mode="PREDICTIVE"/>
 * 			<group billing_key="2" dial_group_desc="AutoDial Configured Dial Group"  dial_group_id="46" dial_group_name="Phone Only test5" dial_mode="PREDICTIVE"/>
 * 		</outdial_groups>
 * 		<skill_profiles>
 * 			<profile profile_desc="" profile_id="571" profile_name="skill1"/>
 * 			<profile profile_desc="" profile_id="572" profile_name="skill2"/>
 * 		</skill_profiles>
 * 		<requeue_gates>
 * 			<gate_group gate_group_id="18" group_name="new gate group">
 * 				<gates>
 * 					<gate gate_desc="" gate_id="37" gate_name="test"/>
 * 					<gate gate_desc="" gate_id="42" gate_name="test gate two"/>
 * 				</gates>
 * 				<skills>
 * 					<skill skill_desc="" skill_id="58" skill_name="one"/>
 * 					<skill skill_desc="" skill_id="59" skill_name="two"/>
 * 				</skills>
 * 			</gate_group>
 * 			<gate_group gate_group_id="19" group_name="gate group 2">
 * 				<gates>
 * 					<gate gate_desc="Amandas Other Gate" gate_id="46" gate_name="You know it!"/>
 * 				</gates>
 * 				<skills/>
 * 			</gate_group>
 *		</requeue_gates>
 * 		<chat_rooms/>
 * 		<surveys>
 * 			<survey survey_id="15" survey_name="Don't Read This Survey"/>
 * 		</surveys>
 *      <campaigns>
 * 			<campaign campaign_id="" campaign_name="" survey_id="" survey_name="" allow_lead_updates="">
 * 				<custom_labels aux_1_label="" aux_2_label="" aux_3_label="" aux_4_label="" aux_5_label=""/>
 * 				<generic_key_value_pairs/>
 * 			</campaign>
 * 		</campaigns>
 * 		<account_countries>
 *   		<country country_id="BRA"/>
 *   		<country country_id="FRA"/>
 * 		</account_countries>
 * </ui_response>
 *
 */
LoginRequest.prototype.processResponse = function(response) {
    var status = response.ui_response.status['#text'];
    if(status === 'OK'){
        if(!UIModel.getInstance().isLoggedInIS){
            // save login packet properties to UIModel
            UIModel.getInstance().loginPacket = response;
            UIModel.getInstance().applicationSettings.isLoggedInIS = true;
            UIModel.getInstance().agentSettings.loginDTS = new Date();
            UIModel.getInstance().chatSettings.alias = response.ui_response.first_name['#text'] + " " + response.ui_response.last_name['#text']
            UIModel.getInstance().agentSettings.maxBreakTime = response.ui_response.max_break_time['#text'];
            UIModel.getInstance().agentSettings.maxLunchTime = response.ui_response.max_lunch_time['#text'];
            UIModel.getInstance().agentSettings.firstName = response.ui_response.first_name['#text'];
            UIModel.getInstance().agentSettings.lastName = response.ui_response.last_name['#text'];
            UIModel.getInstance().agentSettings.email = response.ui_response.email['#text'];
            UIModel.getInstance().agentSettings.agentId = response.ui_response.agent_id['#text'];
            UIModel.getInstance().agentSettings.externalAgentId = response.ui_response.external_agent_id['#text'];
            UIModel.getInstance().agentSettings.agentType = response.ui_response.agent_type['#text'];
            UIModel.getInstance().agentSettings.realAgentType = response.ui_response.real_agent_type['#text'];
            UIModel.getInstance().agentSettings.defaultLoginDest = response.ui_response.default_login_dest['#text'];
            UIModel.getInstance().agentSettings.altDefaultLoginDest = response.ui_response.alt_default_login_dest['#text'];
            UIModel.getInstance().agentSettings.disableSupervisorMonitoring = response.ui_response.disable_supervisor_monitoring['#text'];
            UIModel.getInstance().agentSettings.initLoginState = response.ui_response.init_login_state['#text'];
            UIModel.getInstance().agentSettings.initLoginStateLabel = response.ui_response.init_login_state_label['#text'];
            UIModel.getInstance().agentSettings.outboundManualDefaultRingtime = response.ui_response.outbound_manual_default_ringtime['#text'];

            var allowCallControl = typeof response.ui_response.allow_call_control == 'undefined' ? false : response.ui_response.allow_call_control['#text'];
            var allowChat = typeof response.ui_response.allow_chat == 'undefined' ? false : response.ui_response.allow_chat['#text'];
            var showLeadHistory = typeof response.ui_response.show_lead_history == 'undefined' ? false : response.ui_response.show_lead_history['#text'];
            var allowManualOutboundGates = typeof response.ui_response.allow_manual_outbound_gates == 'undefined' ? false : response.ui_response.allow_manual_outbound_gates['#text'];
            var isTcpaSafeMode = typeof response.ui_response.tcpa_safe_mode == 'undefined' ? false : response.ui_response.tcpa_safe_mode['#text'];
            var allowLeadInserts = typeof response.ui_response.insert_campaigns == 'undefined' ? false : response.ui_response.insert_campaigns.campaign;
            var isOutboundPrepay = typeof response.ui_response.outbound_prepay == 'undefined' ? false : response.ui_response.outbound_prepay['#text'];

            if(allowCallControl == "0"){
                UIModel.getInstance().agentPermissions.allowCallControl = false;
            }
            if(allowChat == "1"){
                UIModel.getInstance().agentPermissions.allowChat = true;
            }
            if(showLeadHistory == "0"){
                UIModel.getInstance().agentPermissions.showLeadHistory = false;
            }
            if(allowManualOutboundGates == "1"){
                UIModel.getInstance().agentPermissions.allowManualOutboundGates = true;
            }
            if(isTcpaSafeMode == "1"){
                UIModel.getInstance().applicationSettings.isTcpaSafeMode = true;
            }
            if(allowLeadInserts && allowLeadInserts.length > 0){
                UIModel.getInstance().agentPermissions.allowLeadInserts = true;
            }
            if(isOutboundPrepay == "1"){
                UIModel.getInstance().agentSettings.isOutboundPrepay = true;
            }
            if(response.ui_response.allow_off_hook['#text'] == "0"){
                UIModel.getInstance().agentPermissions.allowOffHook = false;
            }
            if(response.ui_response.allow_manual_calls['#text'] == "0"){
                UIModel.getInstance().agentPermissions.allowManualCalls = false;
            }
            if(response.ui_response.allow_manual_pass['#text'] == "0"){
                UIModel.getInstance().agentPermissions.allowManualPass = false;
            }
            if(response.ui_response.allow_manual_intl_calls['#text'] == "1"){
                UIModel.getInstance().agentPermissions.allowManualIntlCalls = true;
            }
            if(response.ui_response.allow_login_updates['#text'] == "0"){
                UIModel.getInstance().agentPermissions.allowLoginUpdates = false;
            }
            if(response.ui_response.allow_inbound['#text'] == "0"){
                UIModel.getInstance().agentPermissions.allowInbound = false;
            }
            if(response.ui_response.allow_outbound['#text'] == "0"){
                UIModel.getInstance().agentPermissions.allowOutbound = false;
            }
            if(response.ui_response.allow_blended['#text'] == "0"){
                UIModel.getInstance().agentPermissions.allowBlended = false;
            }
            if(response.ui_response.allow_login_control['#text'] == "0"){
                UIModel.getInstance().agentPermissions.allowLoginControl = false;
            }
            if(response.ui_response.allow_cross_gate_requeue['#text'] == "1"){
                UIModel.getInstance().agentPermissions.allowCrossQueueRequeue = true;
            }

            // Set collection values
            processCampaigns(response);
            UIModel.getInstance().chatSettings.availableChatQueues = utils.processResponseCollection(response.ui_response, "login_chat_queues", "chat_queue");
            UIModel.getInstance().inboundSettings.availableQueues = utils.processResponseCollection(response.ui_response, "login_gates", "gate");
            UIModel.getInstance().inboundSettings.availableSkillProfiles = utils.processResponseCollection(response.ui_response, "skill_profiles", "profile");
            UIModel.getInstance().inboundSettings.availableRequeueQueues = utils.processResponseCollection(response.ui_response, "requeue_gates", "gate_group");
            UIModel.getInstance().chatSettings.availableChatRooms = utils.processResponseCollection(response.ui_response, "chat_rooms", "room");
            UIModel.getInstance().surveySettings.availableSurveys = utils.processResponseCollection(response.ui_response, "surveys", "survey");
            UIModel.getInstance().agentSettings.callerIds = utils.processResponseCollection(response.ui_response, "caller_ids", "caller_id");
            UIModel.getInstance().agentSettings.availableAgentStates = utils.processResponseCollection(response.ui_response, "agent_states", "agent_state");
            UIModel.getInstance().applicationSettings.availableCountries = utils.processResponseCollection(response.ui_response, "account_countries", "country");
            UIModel.getInstance().outboundSettings.insertCampaigns = utils.processResponseCollection(response.ui_response, "insert_campaigns", "campaign");

            var dialGroups = utils.processResponseCollection(response.ui_response, "outdial_groups", "group");
            // set boolean values
            dialGroups.allowLeadSearch = dialGroups.allowLeadSearch == "YES";
            dialGroups.allowPreviewLeadFilters = dialGroups.allowPreviewLeadFilters == "1";
            dialGroups.allowProgressiveEnabled = dialGroups.allowProgressiveEnabled == "1";
            UIModel.getInstance().outboundSettings.availableOutdialGroups = dialGroups;
        }
    }else if(status === 'RESTRICTED'){
        console.log("AgentLibrary: Invalid IP Address");
    }else{
        console.log("AgentLibrary: Invalid Username or password");
    }
};

processCampaigns = function(response){
    var campaigns = [];
    var campaign = {};
    var campaignsRaw = [];
    var customLabels = [];
    var labelArray = [];
    var label = "";
    var campaignId = 0;
    var allowLeadUpdates = false;

    if(typeof response.ui_response.campaigns.campaign !== 'undefined'){
        campaignsRaw = response.ui_response.campaigns.campaign;
    }

    if(Array.isArray(campaignsRaw)){
        // dealing with an array
        for(var c = 0; c < campaignsRaw.length; c++){
            campaignId = campaignsRaw[c]['@campaign_id'];
            allowLeadUpdates = campaignsRaw[c]['@allow_lead_updates'] == '1';
            customLabels = campaignsRaw[c]['custom_labels'];
            labelArray = [];
            label = "";

            UIModel.getInstance().agentPermissions.allowLeadUpdatesByCampaign[campaignId] = allowLeadUpdates;

            for (var prop in customLabels) {
                label = prop.replace(/@/, ''); // remove leading '@'
                var obj = {};
                obj[label] = customLabels[prop];
                labelArray.push(obj);
            }

            campaign = {
                allowLeadUpdates: allowLeadUpdates,
                campaignId: campaignId,
                surveyId: campaignsRaw[c]['@survey_id'],
                surveyName: campaignsRaw[c]['@survey_name'],
                customLabels: labelArray
            };
            campaigns.push(campaign);
        }
    }else{
        // single campaign object
        campaignId = campaignsRaw[c]['@campaign_id'];
        allowLeadUpdates = campaignsRaw[c]['@allow_lead_updates'] == '1';
        customLabels = campaignsRaw['custom_labels'];
        labelArray = [];
        label = "";

        UIModel.getInstance().agentPermissions.allowLeadUpdatesByCampaign[campaignId] = allowLeadUpdates;

        for (var p in customLabels) {
            label = p.replace(/@/, ''); // remove leading '@'
            var obj = {};
            obj[label] = customLabels[p];
            labelArray.push(obj);
        }

        campaign = {
            allowLeadUpdates: campaignsRaw['@allow_lead_updates'],
            campaignId: campaignsRaw['@campaign_id'],
            surveyId: campaignsRaw['@survey_id'],
            surveyName: campaignsRaw['@survey_name'],
            customLabels: labelArray
        };
        campaigns.push(campaign);
    }

    UIModel.getInstance().outboundSettings.availableCampaigns = campaigns;
};
