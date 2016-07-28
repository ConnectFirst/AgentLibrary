/*! cf-agent-library - v0.0.0 - 2016-07-28 - Connect First */
/**
 * @fileOverview Exposed functionality for Connect First AgentUI.
 * @author <a href="mailto:dlbooks@connectfirst.com">Danielle Lamb-Books </a>
 * @version 0.0.1
 * @namespace AgentLibrary
 */

;(function (global) {

var AgentStateRequest = function(agentState, agentAuxState) {
    if(agentState.toUpperCase() == "ON-BREAK" && UIModel.getInstance().onCall == true){
        this.agentState = "BREAK-AFTER-CALL";
        this.agentAuxState = "";
    }else{
        this.agentState = agentState.toUpperCase() || "";
        this.agentAuxState = agentAuxState || "";
    }
};

AgentStateRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.AGENT_STATE,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "state":{
                "#text":this.agentState
            },
            "agent_aux_state":{
                "#text":this.agentAuxState
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes AGENT-STATE packets rec'd from IQ. It will check the state of the
 * packet and then set the state on the model. It will also check for deferred surveys,
 * if one is found it will load it at this point.
 *
 * <ui_response message_id="IQ982008082817165103294" type="AGENT-STATE">
 *	  <status>OK</status>
 * 	  <message/>
 *	  <detail/>
 *	  <agent_id>1856</agent_id>
 *	  <prev_state>ENGAGED</prev_state>
 *	  <current_state>WORKING</current_state>
 * 	  <agent_aux_state>Offhook Work</agent_aux_state>
 * 	  <prev_aux_state></prev_aux_state>
 * </ui_response>
 */
AgentStateRequest.prototype.processResponse = function(response) {
    var status = response.ui_response.status['#text'];
    var prevState = response.ui_response.prev_state['#text'];
    var currState = response.ui_response.current_state['#text'];
    var prevAuxState = response.ui_response.prev_aux_state['#text'] || "";
    var currAuxState = response.ui_response.agent_aux_state['#text'] || "";

    if(status=="OK"){
        var prevStateStr = prevState;
        var currStateStr = currState;

        if(prevAuxState.length > 0){
            prevStateStr = prevAuxState;
        }

        if(currAuxState.length > 0){
            currStateStr = currAuxState;
        }

        console.log("AgentLibrary: Agent state changed from [" + prevStateStr + "] to [" + currStateStr + "]" );

        // Update the state in the UIModel
        UIModel.getInstance().agentSettings.currentState = currState;
        UIModel.getInstance().agentSettings.currentStateLabel = currAuxState;
        UIModel.getInstance().agentStatePacket = response;
    }else{
        console.warn("AgentLibrary: Unable to change agent state " + response.detail["#text"]);
    }
};




var ConfigRequest = function(queueIds, chatIds, skillPofileId, outdialGroupId, dialDest) {
    this.queueIds = queueIds || [];
    this.chatIds = chatIds || [];
    this.skillPofileId = skillPofileId || "";
    this.outdialGroupId = outdialGroupId || "";
    this.dialDest = dialDest || "";

    this.updateFromAdminUI = false;
    this.loginType = "NO-SELECTION";
    this.updateLogin = false;

    // Remove any ids agent doesn't have access to
    this.queueIds = utils.checkExistingIds(UIModel.getInstance().inboundSettings.availableQueues, this.queueIds, "gateId");
    this.chatIds = utils.checkExistingIds(UIModel.getInstance().chatSettings.availableChatQueues, this.chatIds, "chatQueueId");
    this.skillPofileId = utils.checkExistingIds(UIModel.getInstance().inboundSettings.availableSkillProfiles, [this.skillPofileId], "profileId")[0] || "";
    this.outdialGroupId = utils.checkExistingIds(UIModel.getInstance().outboundSettings.availableOutdialGroups, [this.outdialGroupId], "dialGroupId")[0] || "";
};

ConfigRequest.prototype.formatJSON = function() {
    // Set loginType value
    if(this.queueIds.length > 0 && this.outdialGroupId !== ""){
        this.loginType = "BLENDED";
    }else if(this.queueIds.length > 0){
        this.loginType = "INBOUND";
    }else if(this.outdialGroupId !== ""){
        this.loginType = "OUTBOUND";
    }else {
        this.loginType = "NO-SELECTION";
    }

    // set updateLogin value
    if(UIModel.getInstance().isLoggedIn){
        this.updateLogin = true;
    }

    var msg = {
        "ui_request":{
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.LOGIN,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "agent_pwd":{
                "#text": UIModel.getInstance().loginRequest.password
            },
            "dial_dest":{
                "#text":this.dialDest
            },
            "login_type":{
                "#text":this.loginType
            },
            "update_login":{
                "#text":this.updateLogin.toString()
            },
            "outdial_group_id":{
                "#text":this.outdialGroupId
            },
            "skill_profile_id":{
                "#text":this.skillPofileId
            },
            "update_from_adminui":{
                "#text":this.updateFromAdminUI.toString()
            }
        }
    };

    // add arrays
    var queueIds = [];
    for(var i = 0; i < this.queueIds.length; i++){
        if(this.queueIds[i] !== ""){
            queueIds.push(
                {  "#text": this.queueIds[i] }
            );
        }
    }
    if(queueIds.length > 0){
        msg.ui_request.gates = { "gate_id" : queueIds };
    }else{
        msg.ui_request.gates = {};
    }

    var chatIds = [];
    for(var i = 0; i < this.chatIds.length; i++){
        if(this.chatIds[i] !== "") {
            chatIds.push( {"#text": this.chatIds[i]} );
        }
    }
    if(chatIds.length > 0) {
        msg.ui_request.chat_queues = {"chat_queue_id": chatIds};
    }else{
        msg.ui_request.chat_queues = {};
    }

    return JSON.stringify(msg);
};


/*
 * This function is responsible for handling the response to Login from IntelliQueue.
 *
 * <ui_response message_id="IQ982008100319095501435"  response_to="IQ200810319947384" type="LOGIN">
 * 		<agent_id>1810</agent_id>
 * 		<status>SUCCESS</status>
 * 		<message>Hello Geoff Mina!</message>
 * 		<detail>Logon request processed successfully!</detail>
 * 		<hash_code>117800988</hash_code>
 * 		<login_type>OUTBOUND</login_type>
 * 		<outdial_group_id>200018</outdial_group_id>
 * 		<gates/>
 * </ui_response>
 */
ConfigRequest.prototype.processResponse = function(response) {
    var status = response.ui_response.status['#text'];

    if(status === "SUCCESS"){
        if(!UIModel.getInstance().isLoggedIn){
            // fresh login, set UI Model properties
            UIModel.getInstance().configPacket = response;
            UIModel.getInstance().connectionSettings.hashCode = response.ui_response.hash_code['#text'];
            UIModel.getInstance().applicationSettings.message = response.ui_response.message['#text'];
            UIModel.getInstance().agentSettings.isLoggedIn = true;
            UIModel.getInstance().agentSettings.loginDTS = new Date();
            UIModel.getInstance().connectionSettings.reconnect = true;
            UIModel.getInstance().agentPermissions.allowLeadSearch = false;
            UIModel.getInstance().agentSettings.dialDest = UIModel.getInstance().configRequest.dialDest; // not sent in response
            UIModel.getInstance().agentSettings.loginType = response.ui_response.login_type['#text'];

            // Set collection values
            setDialGroupSettings(response);

            // For some strange reason IQ is not returning any collections other than outboundDialGroups
            // so for now, get the list of ids for the following collections from the request
            setGateSettings();
            setChatQueueSettings();
            setSkillProfileSettings();

        }else{
            if(UIModel.getInstance().agentSettings.updateLoginMode){
                // This was an update login request
                UIModel.getInstance().agentSettings.updateLoginMode = false;

                // update dial group settings
                UIModel.getInstance().agentPermissions.allowLeadSearch = false;
                UIModel.getInstance().agentPermissions.requireFetchedLeadsCalled = false;
                UIModel.getInstance().agentPermissions.allowPreviewLeadFilters = false;

                // Set collection values
                setDialGroupSettings(response);

                // For some strange reason IQ is not returning any collections other than outboundDialGroups
                // so for now, get the list of ids for the following collections from the request
                setGateSettings();
                setChatQueueSettings();
                setSkillProfileSettings();

            }else{
                // this was a reconnect
                console.log("AgentLibrary: Processed a Layer 2 Reconnect Successfully");
            }
        }
    }else{
        // Login failed
        console.warn("AgentLibrary: Layer 2 login failed!");
    }
};

function setDialGroupSettings(response){
    var outdialGroups = UIModel.getInstance().outboundSettings.availableOutdialGroups;
    for(var g = 0; g < outdialGroups.length; g++){
        var group = outdialGroups[g];
        if(group.dialGroupId === response.ui_response.outdial_group_id['#text']){
            UIModel.getInstance().agentPermissions.allowLeadSearch = group.allowLeadSearch;
            UIModel.getInstance().agentPermissions.allowPreviewLeadFilters = group.allowPreviewLeadFilters;
            UIModel.getInstance().outboundSettings.outdialGroup = JSON.parse(JSON.stringify(group)); // copy object

            // Only used for Preview or TCPA Safe accounts.
            // If set to true, only allow fetching new leads when current leads are called or expired
            UIModel.getInstance().agentPermissions.requireFetchedLeadsCalled = group.requireFetchedLeadsCalled;
        }
    }
}

function setGateSettings(){
    var gates = UIModel.getInstance().inboundSettings.availableQueues;
    var selectedGateIds = UIModel.getInstance().configRequest.queueIds;
    var selectedGates = [];

    for(var gIdx = 0; gIdx < gates.length; gIdx++){
        var gate = gates[gIdx];
        if(selectedGateIds.indexOf(gate.gateId) > -1){
            selectedGates.push(gate);
        }
    }

    UIModel.getInstance().inboundSettings.queues = JSON.parse(JSON.stringify(selectedGates)); // copy array
}

function setChatQueueSettings(){
    var chatQueues = UIModel.getInstance().chatSettings.availableChatQueues;
    var selectedChatQueueIds = UIModel.getInstance().configRequest.chatIds;
    var selectedChatQueues = [];

    for(var cIdx = 0; cIdx < chatQueues.length; cIdx++){
        var chatQueue = chatQueues[cIdx];
        if(selectedChatQueueIds.indexOf(chatQueue.chatQueueId) > -1){
            selectedChatQueues.push(chatQueue);
        }
    }

    UIModel.getInstance().chatSettings.chatQueues = JSON.parse(JSON.stringify(selectedChatQueues)); // copy array
}

function setSkillProfileSettings(){
    var skillProfiles = UIModel.getInstance().inboundSettings.availableSkillProfiles;
    for(var s = 0; s < skillProfiles.length; s++){
        var profile = skillProfiles[s];
        if(profile.skillProfileId === UIModel.getInstance().configRequest.skillProfileId){
            UIModel.getInstance().inboundSettings.skillProfile = JSON.parse(JSON.stringify(profile)); // copy object
        }
    }
}

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


var LogoutRequest = function(agentId, message, isSupervisor) {
    this.agentId = agentId;
    this.message = message;
    this.isSupervisor = isSupervisor;
};

LogoutRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.LOGOUT,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":this.agentId
            },
            "message":{
                "#text":this.message
            }
        }
    };

    return JSON.stringify(msg);
};
var UIModel = (function() {

    var instance;

    function init() {
        // Singleton

        // Private methods and variables here //
        //function privateMethod(){
        //    console.log( "I am private" );
        //}
        //
        //var privateVariable = "I'm also private";

        // Public methods and variables
        return {

            // request instances
            loginRequest : null,                // Original LoginRequest sent to IS - used for reconnects
            configRequest : null,
            logoutRequest : null,
            agentStateRequest : null,

            // response packets
            loginPacket : null,
            configPacket : null,
            agentStatePacket : null,
            currentCallPacket : null,

            // application state
            applicationSettings : {
                availableCountries : [],
                isLoggedInIS : false,               // a check for whether or not user is logged in with IntelliServices
                socketConnected : false,
                message : "",
                isTcpaSafeMode : false            // Comes in at the account-level - will get set to true if this interface should be in tcpa-safe-mode only.
            },

            // current agent settings
            agentSettings : {
                agentId : 0,
                agentType : "AGENT",                // AGENT | SUPERVISOR
                altDefaultLoginDest : "",
                availableAgentStates : [],
                callerIds : [],
                currentState : "OFFLINE",           // Agent system/base state
                currentStateLabel : "",             // Agent aux state label
                defaultLoginDest : "",
                dialDest : "",                      // Destination agent is logged in with for offhook session, set on configure response
                email : "",
                externalAgentId : "",
                firstName : "",
                isLoggedIn : false,                 // agent is logged in to the platform
                initLoginState : "AVAILABLE",       // state agent is placed in on successful login
                initLoginStateLabel : "Available",  // state label for agent on successful login
                isOutboundPrepay : false,           // determines if agent is a prepay agent
                lastName : "",
                loginDTS : null,                    // date and time of the final login phase (IQ)
                loginType : "NO-SELECTION",         // Could be INBOUND | OUTBOUND | BLENDED | NO-SELECTION, set on login response
                maxBreakTime : -1,
                maxLunchTime : -1,
                onCall : false,                     // true if agent is on an active call
                outboundManualDefaultRingtime : "30",
                realAgentType : "AGENT",
                updateLoginMode : false             // gets set to true when doing an update login (for events control)
            },

            // current agent permissions
            agentPermissions : {
                allowBlended : true,                // Controls whether or not the agent can log into both inbound queues and an outbound dialgroup
                allowCallControl : true,            // Set from the the login response packet
                allowChat : false,                  // Controls whether or not the agent has the option to open the Chat Queue Manager
                allowCrossQueueRequeue : false,     // Controls whether or not the agent can requeue to a different queue group
                allowInbound : true,                // Controls whether or not the agent can log into an inbound queue
                allowLeadInserts : false,           // Controls whether or not the agents can insert leads
                allowLeadSearch : false,            // Controlled by the dial-group allow_lead_search setting. Enables or disables the lead search
                allowLoginControl : true,           // Controls whether or not the agent can log in
                allowLoginUpdates : true,           // Controls whether or not the agent can update their login
                allowManualCalls : true,            // Controls whether or not the agents have the option to make a manual outbound call
                allowManualPass : true,             // Controls whether or not the agent has the option to make a manual pass on a lead
                allowManualIntlCalls : false,       // Controls whether or not the agent has the option to make international manual outbound calls
                allowManualOutboundGates : false,   // Controls whether or not the agent has the option to select queues to convert manual outbound calls to
                allowOffHook : true,                // Controls whether or not the agents can go offhook
                allowOutbound : true,               // Controls whether or not the agent can log into an outdial group
                allowPreviewLeadFilters : false,    // Controlled by the dial-group allow_preview_lead_filters setting. Enables or disables the filters on the preview style forms
                allowLeadUpdatesByCampaign : {},    // For each campaign ID, store whether leads can be updated
                disableSupervisorMonitoring : true, // Controls whether or not a supervisor can view agent stats
                requireFetchedLeadsCalled : false,  // Controlled by the dial-group require_fetched_leads_called setting. Enables or disables the requirement to only fetch new leads when current leads are called or expired. ONly for Preview or TCPA-SAFE.
                showLeadHistory : true              // Controls whether or not the agents can view lead history
            },

            // chat
            chatSettings :{
                availableChatQueues : [],           // List of all chat queues agent has access to, set on login
                availableChatRooms : [],            // List of all chat rooms agent has access to, set on login
                chatQueues : [],                    // Array of chat queues agent is signed into
                alias : ""                          // Chat alias, on-login this is the UID, but is changed if the user changes it
            },

            // connection objects
            connectionSettings : {
                hashCode : null,                    // used specifically for reconnects
                reconnect : false                   // variable tracks the type of login, on init it's false...once connected it's set to true
            },

            // inbound settings
            inboundSettings : {
                availableQueues : [],               // array of queues agent has access to, set on login
                availableSkillProfiles : [],        // array of skill profiles agent has access to, set on login
                queues : [],                        // array of queues agent is signed into, set on config response
                skillProfile : {}                   // The skill profile the agent is signed into, set on config response
            },

            // outbound settings
            outboundSettings : {
                availableCampaigns : [],            // array of campaigns agent has access to, set on login
                availableOutdialGroups : [],        // array of dial groups agent has access to, set on login
                insertCampaigns : [],
                outdialGroup : {}                   // dial group agent is signed into
            },

            surveySettings : {
                availableSurveys : []
            }


            // Public methods
            //getOutboundSettings: function() {
            //    return this.outboundSettings;
            //}

        };
    }

    return {
        // Get the Singleton instance if one exists
        // or create one if it doesn't
        getInstance: function () {
            if (!instance) {
                instance = init();
            }
            return instance;
        }
    };

})();


var utils = {
    sendMessage: function(instance, msg) {
        if (instance.socket.readyState === 1) {
            instance.socket.send(msg);
        } else {
            console.warn("WebSocket is not connected");
        }
    },

    processMessage: function(instance, response)
    {
        var type = response.ui_response['@type'];
        var messageId = response.ui_response['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        console.log("AgentLibrary: received message: (" + dest + ") " + type.toUpperCase());

        // Send generic on message response
        utils.fireCallback(instance, CALLBACK_TYPES.ON_MESSAGE, response);

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.LOGIN:
                if (dest === "IS") {
                    UIModel.getInstance().loginRequest.processResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.LOGIN, response);
                } else if (dest === 'IQ') {
                    UIModel.getInstance().configRequest.processResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.CONFIG, response);
                }
                break;
            case MESSAGE_TYPES.LOGOUT:
                // TODO add processResponse
                utils.fireCallback(instance, CALLBACK_TYPES.LOGOUT, response);
                break;
            case MESSAGE_TYPES.AGENT_STATE:
                if(UIModel.getInstance().agentStateRequest === null){
                    UIModel.getInstance().agentStateRequest = new AgentStateRequest(response.ui_response.current_state["#text"], response.ui_response.agent_aux_state['#text']);
                }
                UIModel.getInstance().agentStateRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.AGENT_STATE, response);
        }
    },

    /*
     * Take the xml marked JSON, group and item property names and reformat to
     * simple javascript object without the xml markers.
     * Will work recursively down the tree on nested objects and arrays.
     *
     * example of acceptable response tree (groupProp = requeue_gates, itemProp = gate_group):
     *   "requeue_gates": {
     *       "gate_group": [
     *           {
     *               "@gate_group_id": "4",
     *               "@group_name": "Test Gate Group",
     *               "gates": {
     *                   "gate": [
     *                       {
     *                           "@gate_desc": "",
     *                           "@gate_id": "10951",
     *                           "@gate_name": "CD ACD Queue"
     *                       },
     *                       {
     *                           "@gate_desc": "",
     *                           "@gate_id": "11036",
     *                           "@gate_name": "Xerox Test Gate"
     *                       }
     *                   ]
     *               },
     *               "skills": {
     *                   "skill": [
     *                       {
     *                           "@skill_desc": "",
     *                           "@skill_id": "322",
     *                           "@skill_name": "English"
     *                       },
     *                       {
     *                           "@skill_desc": "",
     *                           "@skill_id": "323",
     *                           "@skill_name": "Spanish"
     *                       }
     *                   ]
     *               }
     *           },
     *           {
     *               "@gate_group_id": "14292",
     *               "@group_name": "New Test Group",
     *               "gates": {
     *                   "gate": {
     *                       "@gate_desc": "",
     *                       "@gate_id": "15535",
     *                       "@gate_name": "New Test Gate"
     *                   }
     *               },
     *               "skills": {
     *                   "skill": {
     *                       "@skill_desc": "",
     *                       "@skill_id": "1658",
     *                       "@skill_name": "new skill"
     *                   }
     *               }
     *           }
     *       ]
     *   }
     */

    processResponseCollection: function(response, groupProp, itemProp){
        var items = [];
        var item = {};
        var itemsRaw = [];

        if(typeof response[groupProp][itemProp] !== 'undefined'){
            itemsRaw = response[groupProp][itemProp];
        }

        if(Array.isArray(itemsRaw)) {
            // multiple items
            for (var i = 0; i < itemsRaw.length; i++) {
                var formattedKey = "";
                for(var key in itemsRaw[i]){
                    formattedKey = key.replace(/@/, ''); // remove leading '@'
                    formattedKey = formattedKey.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); }); // convert to camelCase

                    if(typeof itemsRaw[i][key] === "object"){
                        // make recursive call
                        var newItemProp = Object.keys(itemsRaw[i][key])[0];
                        var newItems = [];
                        newItems = utils.processResponseCollection(itemsRaw[i], key, newItemProp);
                        item[formattedKey] = newItems;
                    }else{
                        item[formattedKey] = itemsRaw[i][key];
                    }
                }

                items.push(item);
                item = {};
            }
        }else{
            // single item
            var formattedProp = "";
            for(var prop in itemsRaw){
                formattedProp = prop.replace(/@/, ''); // remove leading '@'
                formattedProp = formattedProp.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); }); // convert to camelCase

                if(typeof itemsRaw[prop] === "object"){
                    // make recursive call
                    var newProp = Object.keys(itemsRaw[prop])[0];
                    var newItms = [];
                    newItms = utils.processResponseCollection(itemsRaw, prop, newProp);
                    item[formattedProp] = itemsRaw[prop];
                }else{
                    item[formattedProp] = itemsRaw[prop];
                }
            }

            items.push(item);
        }

        return items;
    },

    fireCallback: function(instance, type, response) {
        response = response || "";
        if (typeof instance.callbacks[type] === 'function') {
            instance.callbacks[type].call(instance, response);
        }
    },

    setCallback: function(instance, type, callback) {
        if (typeof callback !== 'undefined') {
            instance.callbacks[type] = callback;
        }
    },

    getMessageId: function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    },

    // check whether the given array of ids exist in the given array of objects
    // if not available, remove the id
    // returns the clean list of acceptable ids
    checkExistingIds: function(objArray, idArray, idProperty) {
        var availIds = [];
        var removeIds = [];

        // get list of available ids
        for(var o = 0; o < objArray.length; o++){
            availIds.push(objArray[o][idProperty]);
        }

        // go through selected ids and mark unfound ones for removal
        for(var i = 0; i < idArray.length; i++){
            if(availIds.indexOf(idArray[i]) === -1){
                // selected id not found in available list, mark for removal
                removeIds.push(idArray[i]);
            }
        }

        // remove marked ids
        for(var r = idArray.length -1; r >= 0; r--){
            if(removeIds.indexOf(idArray[r]) > -1){
                // remove
                idArray.splice(r,1);
            }
        }

        return idArray;
    }
};


// CONSTANTS
/**
 * @memberof AgentLibrary
 * Possible callback types:
 * <li>"openResponse"</li>
 * <li>"closeResponse"</li>
 * <li>"loginResponse"</li>
 * <li>"logoutResponse"</li>
 * <li>"configureResponse"</li>
 * <li>"agentStateResponse"</li>
 * @type {object}
 */
const CALLBACK_TYPES = {
    "HELLO":"helloResponse",
    "OPEN_SOCKET":"openResponse",
    "CLOSE_SOCKET":"closeResponse",
    "LOGIN":"loginResponse",
    "CONFIG":"configureResponse",
    "AGENT_STATE":"agentStateResponse"
};

const MESSAGE_TYPES = {
    "LOGIN":"LOGIN",
    "LOGOUT":"LOGOUT",
    "AGENT_STATE":"AGENT-STATE",
    "ON_MESSAGE":"ON-MESSAGE"
};

// GLOBAL INTERNAL METHODS


/*
 * Init wrapper for the core module.
 * @param {Object} The Object that the library gets attached to in
 * library.init.js.  If the library was not loaded with an AMD loader such as
 * require.js, this is the global Object.
 */
function initAgentLibraryCore (context) {
    'use strict';

    /**
     * This is the constructor for the Library Object. Note that the constructor is also being
     * attached to the context that the library was loaded in.
     * @param {Object} [config={}] Set socket url and callback functions.
     * @constructor
     * @memberof AgentLibrary
     * @property {object} callbacks Internal map of registered callback functions
     * @example
     * var Lib = new AgentLibrary({
     *      socketDest:'ws://d01-test.cf.dev:8080',
     *      callbacks: {
     *          closeResponse: onCloseFunction,
     *          openResponse: onOpenFunction
     *      }
     * });
     */
    var AgentLibrary = context.AgentLibrary = function (config) {

        config = config || {};

        // define properties
        this.callbacks = {};

        // set default values
        if(typeof config.callbacks !== 'undefined'){
            this.callbacks = config.callbacks;
        }

        if(typeof config.socketDest !== 'undefined'){
            UIModel.getInstance().socketDest = config.socketDest;
            this.openSocket();
        }else{
            // todo default socket address?
        }

        return this;
    };

    /**
     * Set multiple callback functions based on type
     * @memberof AgentLibrary
     * @param {Object} callbackMap Contains map of callback types to their respective functions:<br />
     * <tt>callbackMap = {<br />
     *      closeResponse: onCloseFunction,<br />
     *      openResponse: onOpenFunction<br />
     * }</tt>
     */
    AgentLibrary.prototype.setCallbacks = function(callbackMap) {
        for(var property in callbackMap) {
            this.callbacks[property] = callbackMap[property];
        }
    };


    /**
     * Set an individual callback function for the given type
     * @memberof AgentLibrary
     * @param {string} type The name of the event that fires the callback function
     * @param {function} callback The function to call for the given type
     */
    AgentLibrary.prototype.setCallback = function(type, callback) {
        this.callbacks[type] = callback;
    };

    /**
     * Get the map of all registered callbacks
     * @memberof AgentLibrary
     * @returns {array}
     */
    AgentLibrary.prototype.getCallbacks = function(){
        return this.callbacks;
    };

    /**
     * Get a given registered callback by type
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCallback = function(type){
        return this.callbacks[type];
    };


    // requests and responses
    /**
     * Get outgoing Login Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getLoginRequest = function() {
        return UIModel.getInstance().loginRequest;
    };
    /**
     * Get outgoing Config Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getConfigRequest = function() {
        return UIModel.getInstance().configRequest;
    };
    /**
     * Get outgoing Logout Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getLogoutRequest = function() {
        return UIModel.getInstance().logoutRequest;
    };
    /**
     * Get latest outgoing Agent State Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentStateRequest = function() {
        return UIModel.getInstance().agentStateRequest;
    };
    /**
     * Get packet received on successful Login
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getLoginPacket = function() {
        return UIModel.getInstance().loginPacket;
    };
    /**
     * Get packet received on successful Configuration (2nd layer login)
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getConfigPacket = function() {
        return UIModel.getInstance().configPacket;
    };
    /**
     * Get latest received packet for Agent State
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentStatePacket = function() {
        return UIModel.getInstance().agentStatePacket;
    };
    /**
     * Get latest received packet for the Current Call
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCurrentCallPacket = function() {
        return UIModel.getInstance().currentCallPacket;
    };

    // settings objects
    /**
     * Get Application Settings object containing the current state of application related data
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getApplicationSettings = function() {
        return UIModel.getInstance().applicationSettings;
    };

    /**
     * Get Chat Settings object containing the current state of chat related data
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getChatSettings = function() {
        return UIModel.getInstance().chatSettings;
    };

    /**
     * Get Inbound Settings object containing the current state of inbound related data
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getInboundSettings = function() {
        return UIModel.getInstance().inboundSettings;
    };

    /**
     * Get Outbound Settings object containing the current state of outbound related data
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getOutboundSettings = function() {
        return UIModel.getInstance().outboundSettings;
    };

    /**
     * Get Agent Settings object containing the current state of agent related data
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentSettings = function() {
        return UIModel.getInstance().agentSettings;
    };

    /**
     * Get the Agent Permissions object containing the current state of agent permissions
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentPermissions = function() {
        return UIModel.getInstance().agentPermissions;
    };


}

function initAgentLibrarySocket (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    AgentLibrary.prototype.openSocket = function(callback){
        var instance = this;
        utils.setCallback(instance, CALLBACK_TYPES.OPEN_SOCKET, callback);
        if("WebSocket" in context){
            console.log("AgentLibrary: attempting to open socket connection...");
            instance.socket = new WebSocket(UIModel.getInstance().socketDest);
            UIModel.getInstance().socketConnected = true;

            instance.socket.onopen = function() {
                utils.fireCallback(instance, CALLBACK_TYPES.OPEN_SOCKET, '');
            };

            instance.socket.onmessage = function(evt){
                utils.processMessage(instance, JSON.parse(evt.data));
            };

            instance.socket.onclose = function(){
                utils.fireCallback(instance, CALLBACK_TYPES.CLOSE_SOCKET, '');
                UIModel.getInstance().socketConnected = false;
            };
        }else{
            console.warn("AgentLibrary: WebSocket NOT supported by your Browser.");
        }
    };

    AgentLibrary.prototype.closeSocket = function(){
        this.socket.close();
    };

}
function initAgentLibraryAgent (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Sends agent login message to IntelliServices
     * @memberof AgentLibrary
     * @param {string} username Agent's username
     * @param {string} password Agent's password
     * @param {function} callback Callback function when loginAgent response received
     */
    AgentLibrary.prototype.loginAgent = function(username, password, callback){
        UIModel.getInstance().loginRequest = new LoginRequest(username, password);
        var msg = UIModel.getInstance().loginRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.LOGIN, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends agent configure message (2nd layer login) to IntelliQueue
     * @memberof AgentLibrary
     * @param {string[]} [queueIds=null] The queue ids the agent will be logged into.
     * @param {string[]} [chatIds=null] The chat ids the agent will be logged into.
     * @param {string} [skillProfileId=null] The skill profile the agent will be logged into.
     * @param {string} [outdialGroupId=null] The outbound dial group id the agent will be logged into.
     * @param {string} dialDest The agent's number, sip | DID.
     * @param {function} callback Callback function when configureAgent response received.
     */
    AgentLibrary.prototype.configureAgent = function(queueIds, chatIds, skillProfileId, outdialGroupId, dialDest, callback){
        UIModel.getInstance().configRequest = new ConfigRequest(queueIds, chatIds, skillProfileId, outdialGroupId, dialDest);
        var msg = UIModel.getInstance().configRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CONFIG, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends agent logout message to IntelliQueue
     * @memberof AgentLibrary
     * @param {number} agentId Id of the agent that will be logged out.
     * @param {function} callback Callback function when logoutAgent response received.
     */
    AgentLibrary.prototype.logoutAgent = function(agentId, callback){
        UIModel.getInstance().logoutRequest = new LogoutRequest(agentId);
        utils.setCallback(this, CALLBACK_TYPES.LOGOUT, callback);

        if(UIModel.getInstance().logoutRequest.isSupervisor){
            //This is a supervisor request to log an agent out. Create the
            //logout packet and then send the packet to IntelliQueue.
            var msg = UIModel.getInstance().logoutRequest.formatJSON();
            utils.sendMessage(this, msg);
        }else{
            // Agent requested logout, just close socket??
            utils.fireCallback(this, CALLBACK_TYPES.LOGOUT, "");
            this.closeSocket();
        }

    };

    /**
     * Sends agent state change message to IntelliQueue
     * @memberof AgentLibrary
     * @param {string} agentState The system/base state to transition to <br />
     * AVAILABLE | TRANSITION | ENGAGED | ON-BREAK | WORKING | AWAY | LUNCH | AUX-UNAVAIL-NO-OFFHOOK | AUX-UNAVAIL-OFFHOOK
     * @param {string} [agentAuxState=""] The aux state display label
     * @param {function} callback Callback function when agentState response received
     */
    AgentLibrary.prototype.setAgentState = function(agentState, agentAuxState, callback){
        UIModel.getInstance().agentStateRequest = new AgentStateRequest(agentState, agentAuxState);
        var msg = UIModel.getInstance().agentStateRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.AGENT_STATE, callback);
        utils.sendMessage(this, msg);
    };
}

var initAgentLibrary = function (context) {

    initAgentLibraryCore(context);
    initAgentLibrarySocket(context);
    initAgentLibraryAgent(context);

    return context.AgentLibrary;
};

if (typeof define === 'function' && define.amd) {
    // Expose Library as an AMD module if it's loaded with RequireJS or
    // similar.
    console.log("AgentLibrary: using AMD");
    define(function () {
        return initAgentLibrary({});
    });
} else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    console.log("AgentLibrary: Using Node");
    module.exports = initAgentLibrary(this);
} else {
    // Load Library normally (creating a Library global) if not using an AMD
    // loader.
    console.log("AgentLibrary: Not using AMD");
    initAgentLibrary(this);
}
} (this));
