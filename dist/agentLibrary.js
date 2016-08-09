/*! cf-agent-library - v0.0.0 - 2016-08-09 - Connect First */
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
    var model = UIModel.getInstance();

    // add message and detail if present
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.agentId = response.ui_response.agent_id['#text'] || "";
    formattedResponse.previousState = prevState;
    formattedResponse.currentState = currState;
    formattedResponse.previousAuxState = prevAuxState;
    formattedResponse.currentAuxState = currAuxState;

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
        model.agentSettings.currentState = currState;
        model.agentSettings.currentStateLabel = currAuxState;
        model.agentStatePacket = response;
    }else{
        if(formattedResponse.message === ""){
            formattedResponse.message = "Unable to change agent state";
        }
        console.warn("AgentLibrary: Unable to change agent state " + detail);
    }

    return formattedResponse;
};




var CallbackCancelRequest = function(leadId, agentId) {
    this.agentId = agentId || UIModel.getInstance().agentSettings.agentId;
    this.leadId = leadId;
};

CallbackCancelRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CALLBACK_CANCEL,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":this.agentId    
            },
            "lead_id":{
                "#text":this.leadId
            }
        }
    };

    return JSON.stringify(msg);
};




var CallbacksPendingRequest = function(agentId) {
    this.agentId = agentId || UIModel.getInstance().agentSettings.agentId;
};

CallbacksPendingRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CALLBACK_PENDING,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":this.agentId
            }
        }
    };

    return JSON.stringify(msg);
};


/*
 * This class is responsible for handling an PENDING-CALLBACKS response packet from IntelliQueue.
 *
 * <ui_response message_id="IQ982008091512353000875"  response_to="UIV220089151235539" type="PENDING-CALLBACKS">
 *    <lead lead_id="" destination="5555555555" aux_data1="" aux_data2="" aux_data3="" aux_data4="" aux_data5=""
 *       extern_id="" dial_time="2016-08-03 10:00" dial_group_name="" dial_group_id="" lead_id="">
 *       <lead_id/>
 *       <extern_id/>
 *       <first_name/>
 *       <mid_name/>
 *       <last_name/>
 *       <suffix/>
 *       <title/>
 *       <address1/>
 *       <address2/>
 *       <city/>
 *       <state/>
 *       <zip/>
 *       <gate_keeper/>
 *    </lead>
 * </ui_response>
 */
CallbacksPendingRequest.prototype.processResponse = function(response) {
    var leadsRaw = response.ui_response.lead;
    var leads = [];
    if(Array.isArray(leadsRaw)){
        for(var l = 0; l < leadsRaw.length; l++){
            var leadRaw = leadsRaw[l];
            var lead = parseLead(leadRaw);
            leads.push(lead);
        }
    }else if(leadsRaw){
        leads.push(parseLead(leadsRaw));
    }

    UIModel.getInstance().agentSettings.pendingCallbacks = JSON.parse(JSON.stringify(leads));

    return UIModel.getInstance().agentSettings.pendingCallbacks;
};

function parseLead(leadRaw){
    var lead = {
        auxData1 : leadRaw['@aux_data1'],
        auxData2 : leadRaw['@aux_data2'],
        auxData3 : leadRaw['@aux_data3'],
        auxData4 : leadRaw['@aux_data4'],
        auxData5 : leadRaw['@aux_data5'],
        destination : leadRaw['@destination'],
        dialGroupId : leadRaw['@dial_group_id'],
        dialGroupName : leadRaw['@dial_group_name'],
        dialTime : leadRaw['@dial_time'],
        externId : leadRaw['@extern_id'],
        leadId : leadRaw['@lead_id'],
        firstName : leadRaw.first_name['#text'] || "",
        midName : leadRaw.mid_name['#text'] || "",
        lastName : leadRaw.last_name['#text'] || "",
        sufix : leadRaw.suffix['#text'] || "",
        title : leadRaw.title['#text'] || "",
        address1 : leadRaw.address1['#text'] || "",
        address2 : leadRaw.address2['#text'] || "",
        city : leadRaw.city['#text'] || "",
        state : leadRaw.state['#text'] || "",
        zip : leadRaw.zip['#text'] || "",
        gateKeeper : leadRaw.gate_keeper['#text'] || ""
    };

    return lead;
}


var ConfigRequest = function(queueIds, chatIds, skillPofileId, dialGroupId, dialDest, updateFromAdminUI) {
    this.queueIds = queueIds || [];
    this.chatIds = chatIds || [];
    this.skillPofileId = skillPofileId || "";
    this.dialGroupId = dialGroupId || "";
    this.dialDest = dialDest || "";
    this.updateFromAdminUI = updateFromAdminUI || false;
    this.loginType = "NO-SELECTION";
    this.updateLogin = false;

    // Remove any ids agent doesn't have access to
    var model = UIModel.getInstance();
    this.queueIds = utils.checkExistingIds(model.inboundSettings.availableQueues, this.queueIds, "gateId");
    this.chatIds = utils.checkExistingIds(model.chatSettings.availableChatQueues, this.chatIds, "chatQueueId");
    this.skillPofileId = utils.checkExistingIds(model.inboundSettings.availableSkillProfiles, [this.skillPofileId], "profileId")[0] || "";
    this.dialGroupId = utils.checkExistingIds(model.outboundSettings.availableOutdialGroups, [this.dialGroupId], "dialGroupId")[0] || "";

    // Set loginType value
    if(this.queueIds.length > 0 && this.dialGroupId !== ""){
        this.loginType = "BLENDED";
    }else if(this.queueIds.length > 0){
        this.loginType = "INBOUND";
    }else if(this.dialGroupId !== ""){
        this.loginType = "OUTBOUND";
    }else {
        this.loginType = "NO-SELECTION";
    }

    // set updateLogin value
    if(model.agentSettings.isLoggedIn){
        this.updateLogin = true;
    }

    // validate dialDest is sip or 10-digit num
    if(!utils.validateDest(this.dialDest)){
        // TODO propagate this to the client
        console.error("AgentLibrary: dialDest must be a valid sip or 10-digit DID");
    }

};

ConfigRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request":{
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.LOGIN,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "agent_pwd":{
                "#text": UIModel.getInstance().loginRequest.password
            },
            "dial_dest":{
                "#text":utils.toString(this.dialDest)
            },
            "login_type":{
                "#text":this.loginType
            },
            "update_login":{
                "#text":utils.toString(this.updateLogin)
            },
            "outdial_group_id":{
                "#text":utils.toString(this.dialGroupId)
            },
            "skill_profile_id":{
                "#text":utils.toString(this.skillPofileId)
            },
            "update_from_adminui":{
                "#text":utils.toString(this.updateFromAdminUI)
            }
        }
    };

    // add arrays
    var queueIds = [];
    for(var i = 0; i < this.queueIds.length; i++){
        if(this.queueIds[i] !== ""){
            queueIds.push( { "#text": utils.toString(this.queueIds[i]) } );
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
            chatIds.push( {"#text": utils.toString(this.chatIds[i]) } );
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
    var detail = response.ui_response.detail['#text'];
    var model = UIModel.getInstance();
    var formattedResponse = utils.buildDefaultResponse(response);

    if(detail === "Logon Session Configuration Updated!"){
        // this is an update login packet
        model.agentSettings.updateLoginMode = true;
    }

    if(status === "SUCCESS"){
        if(!model.agentSettings.isLoggedIn){
            // fresh login, set UI Model properties
            model.configPacket = response;
            model.connectionSettings.hashCode = response.ui_response.hash_code['#text'];
            model.agentSettings.isLoggedIn = true;
            model.agentSettings.loginDTS = new Date();
            model.connectionSettings.reconnect = true;
            model.agentPermissions.allowLeadSearch = false;
            model.agentSettings.dialDest = model.configRequest.dialDest; // not sent in response
            model.agentSettings.loginType = response.ui_response.login_type['#text'];

            // Set collection values
            setDialGroupSettings(response);

            // For some strange reason IQ is not returning any collections other than outboundDialGroups
            // so for now, get the list of ids for the following collections from the request
            setGateSettings();
            setChatQueueSettings();
            setSkillProfileSettings();

        }else{
            if(model.agentSettings.updateLoginMode){
                // TODO set login type and dial dest for update logins??

                // This was an update login request
                model.agentSettings.updateLoginMode = false;

                // reset to false before updating dial group settings
                model.agentPermissions.allowLeadSearch = false;
                model.agentPermissions.requireFetchedLeadsCalled = false;
                model.agentPermissions.allowPreviewLeadFilters = false;

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

        formattedResponse.agentSettings = model.agentSettings;
        formattedResponse.agentPermissions = model.agentPermissions;
        formattedResponse.applicationSettings = model.applicationSettings;
        formattedResponse.chatSettings = model.chatSettings;
        formattedResponse.connectionSettings = model.connectionSettings;
        formattedResponse.inboundSettings = model.inboundSettings;
        formattedResponse.outboundSettings = model.outboundSettings;
        formattedResponse.surveySettings = model.surveySettings;
    }else{
        // Login failed
        if(formattedResponse.message === ""){
            formattedResponse.message = "Agent configuration attempt failed (2nd layer login)"
        }
        console.warn("AgentLibrary: Layer 2 login failed!");
    }

    return formattedResponse;
};

function setDialGroupSettings(response){
    var model = UIModel.getInstance();
    var outdialGroups = model.outboundSettings.availableOutdialGroups;
    for(var g = 0; g < outdialGroups.length; g++){
        var group = outdialGroups[g];
        if(group.dialGroupId === response.ui_response.outdial_group_id['#text']){
            model.agentPermissions.allowLeadSearch = group.allowLeadSearch;
            model.agentPermissions.allowPreviewLeadFilters = group.allowPreviewLeadFilters;
            model.outboundSettings.outdialGroup = JSON.parse(JSON.stringify(group)); // copy object

            // Only used for Preview or TCPA Safe accounts.
            // If set to true, only allow fetching new leads when current leads are called or expired
            model.agentPermissions.requireFetchedLeadsCalled = group.requireFetchedLeadsCalled;
        }
    }
}

function setGateSettings(){
    var model = UIModel.getInstance();
    var gates = model.inboundSettings.availableQueues;
    var selectedGateIds = model.configRequest.queueIds;
    var selectedGates = [];

    for(var gIdx = 0; gIdx < gates.length; gIdx++){
        var gate = gates[gIdx];
        if(selectedGateIds.indexOf(gate.gateId) > -1){
            selectedGates.push(gate);
        }
    }

    model.inboundSettings.queues = JSON.parse(JSON.stringify(selectedGates)); // copy array
}

function setChatQueueSettings(){
    var model = UIModel.getInstance();
    var chatQueues = model.chatSettings.availableChatQueues;
    var selectedChatQueueIds = model.configRequest.chatIds;
    var selectedChatQueues = [];

    for(var cIdx = 0; cIdx < chatQueues.length; cIdx++){
        var chatQueue = chatQueues[cIdx];
        if(selectedChatQueueIds.indexOf(chatQueue.chatQueueId) > -1){
            selectedChatQueues.push(chatQueue);
        }
    }

    model.chatSettings.chatQueues = JSON.parse(JSON.stringify(selectedChatQueues)); // copy array
}

function setSkillProfileSettings(){
    var model = UIModel.getInstance();
    var skillProfiles = model.inboundSettings.availableSkillProfiles;
    for(var s = 0; s < skillProfiles.length; s++){
        var profile = skillProfiles[s];
        if(profile.skillProfileId === model.configRequest.skillProfileId){
            model.inboundSettings.skillProfile = JSON.parse(JSON.stringify(profile)); // copy object
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
    var model = UIModel.getInstance();
    var formattedResponse = utils.buildDefaultResponse(response);

    if(status === 'OK'){
        if(!model.isLoggedInIS){
            // save login packet properties to UIModel
            model.loginPacket = response;
            model.applicationSettings.isLoggedInIS = true;
            model.agentSettings.loginDTS = new Date();
            model.chatSettings.alias = response.ui_response.first_name['#text'] + " " + response.ui_response.last_name['#text']
            model.agentSettings.maxBreakTime = response.ui_response.max_break_time['#text'];
            model.agentSettings.maxLunchTime = response.ui_response.max_lunch_time['#text'];
            model.agentSettings.firstName = response.ui_response.first_name['#text'];
            model.agentSettings.lastName = response.ui_response.last_name['#text'];
            model.agentSettings.email = response.ui_response.email['#text'];
            model.agentSettings.agentId = response.ui_response.agent_id['#text'];
            model.agentSettings.externalAgentId = response.ui_response.external_agent_id['#text'] || "";
            model.agentSettings.agentType = response.ui_response.agent_type['#text'];
            model.agentSettings.realAgentType = response.ui_response.real_agent_type['#text'];
            model.agentSettings.defaultLoginDest = response.ui_response.default_login_dest['#text'];
            model.agentSettings.altDefaultLoginDest = response.ui_response.alt_default_login_dest['#text'] || "";
            model.agentSettings.disableSupervisorMonitoring = response.ui_response.disable_supervisor_monitoring['#text'];
            model.agentSettings.initLoginState = response.ui_response.init_login_state['#text'];
            model.agentSettings.initLoginStateLabel = response.ui_response.init_login_state_label['#text'];
            model.agentSettings.outboundManualDefaultRingtime = response.ui_response.outbound_manual_default_ringtime['#text'];

            var allowCallControl = typeof response.ui_response.allow_call_control == 'undefined' ? false : response.ui_response.allow_call_control['#text'];
            var allowChat = typeof response.ui_response.allow_chat == 'undefined' ? false : response.ui_response.allow_chat['#text'];
            var showLeadHistory = typeof response.ui_response.show_lead_history == 'undefined' ? false : response.ui_response.show_lead_history['#text'];
            var allowManualOutboundGates = typeof response.ui_response.allow_manual_outbound_gates == 'undefined' ? false : response.ui_response.allow_manual_outbound_gates['#text'];
            var isTcpaSafeMode = typeof response.ui_response.tcpa_safe_mode == 'undefined' ? false : response.ui_response.tcpa_safe_mode['#text'];
            var allowLeadInserts = typeof response.ui_response.insert_campaigns == 'undefined' ? false : response.ui_response.insert_campaigns.campaign;
            var isOutboundPrepay = typeof response.ui_response.outbound_prepay == 'undefined' ? false : response.ui_response.outbound_prepay['#text'];

            if(allowCallControl == "0"){
                model.agentPermissions.allowCallControl = false;
            }
            if(allowChat == "1"){
                model.agentPermissions.allowChat = true;
            }
            if(showLeadHistory == "0"){
                model.agentPermissions.showLeadHistory = false;
            }
            if(allowManualOutboundGates == "1"){
                model.agentPermissions.allowManualOutboundGates = true;
            }
            if(isTcpaSafeMode == "1"){
                model.applicationSettings.isTcpaSafeMode = true;
            }
            if(allowLeadInserts && allowLeadInserts.length > 0){
                model.agentPermissions.allowLeadInserts = true;
            }
            if(isOutboundPrepay == "1"){
                model.agentSettings.isOutboundPrepay = true;
            }
            if(response.ui_response.allow_off_hook['#text'] == "0"){
                model.agentPermissions.allowOffHook = false;
            }
            if(response.ui_response.allow_manual_calls['#text'] == "0"){
                model.agentPermissions.allowManualCalls = false;
            }
            if(response.ui_response.allow_manual_pass['#text'] == "0"){
                model.agentPermissions.allowManualPass = false;
            }
            if(response.ui_response.allow_manual_intl_calls['#text'] == "1"){
                model.agentPermissions.allowManualIntlCalls = true;
            }
            if(response.ui_response.allow_login_updates['#text'] == "0"){
                model.agentPermissions.allowLoginUpdates = false;
            }
            if(response.ui_response.allow_inbound['#text'] == "0"){
                model.agentPermissions.allowInbound = false;
            }
            if(response.ui_response.allow_outbound['#text'] == "0"){
                model.agentPermissions.allowOutbound = false;
            }
            if(response.ui_response.allow_blended['#text'] == "0"){
                model.agentPermissions.allowBlended = false;
            }
            if(response.ui_response.allow_login_control['#text'] == "0"){
                model.agentPermissions.allowLoginControl = false;
            }
            if(response.ui_response.allow_cross_gate_requeue['#text'] == "1"){
                model.agentPermissions.allowCrossQueueRequeue = true;
            }

            // Set collection values
            processCampaigns(response);
            model.chatSettings.availableChatQueues = utils.processResponseCollection(response.ui_response, "login_chat_queues", "chat_queue");
            model.inboundSettings.availableQueues = utils.processResponseCollection(response.ui_response, "login_gates", "gate");
            model.inboundSettings.availableSkillProfiles = utils.processResponseCollection(response.ui_response, "skill_profiles", "profile");
            model.inboundSettings.availableRequeueQueues = utils.processResponseCollection(response.ui_response, "requeue_gates", "gate_group");
            model.chatSettings.availableChatRooms = utils.processResponseCollection(response.ui_response, "chat_rooms", "room");
            model.surveySettings.availableSurveys = utils.processResponseCollection(response.ui_response, "surveys", "survey");
            model.agentSettings.callerIds = utils.processResponseCollection(response.ui_response, "caller_ids", "caller_id");
            model.agentSettings.availableAgentStates = utils.processResponseCollection(response.ui_response, "agent_states", "agent_state");
            model.applicationSettings.availableCountries = utils.processResponseCollection(response.ui_response, "account_countries", "country");
            model.outboundSettings.insertCampaigns = utils.processResponseCollection(response.ui_response, "insert_campaigns", "campaign");

            var dialGroups = utils.processResponseCollection(response.ui_response, "outdial_groups", "group");
            // set boolean values
            for(var dg = 0; dg < dialGroups.length; dg++){
                var group = dialGroups[dg];
                group.allowLeadSearch = group.allowLeadSearch === "YES";
                group.allowPreviewLeadFilters = group.allowPreviewLeadFilters === "1";
                group.progressiveEnabled = group.progressiveEnabled === "1";
                group.requireFetchedLeadsCalled = group.requireFetchedLeadsCalled === "1";
            }
            model.outboundSettings.availableOutdialGroups = dialGroups;
        }

        formattedResponse.agentSettings = model.agentSettings;
        formattedResponse.agentPermissions = model.agentPermissions;
        formattedResponse.applicationSettings = model.applicationSettings;
        formattedResponse.chatSettings = model.chatSettings;
        formattedResponse.connectionSettings = model.connectionSettings;
        formattedResponse.inboundSettings = model.inboundSettings;
        formattedResponse.outboundSettings = model.outboundSettings;
        formattedResponse.surveySettings = model.surveySettings;
    }else if(status === 'RESTRICTED'){
        formattedResponse.message = "Invalid IP Address";
        console.log("AgentLibrary: Invalid IP Address");
    }else{
        formattedResponse.message = "Invalid Username or password";
        console.log("AgentLibrary: Invalid Username or password");
    }

    return formattedResponse;
};

processCampaigns = function(response){
    var campaigns = [];
    var campaign = {};
    var campaignsRaw = [];
    var customLabels = [];
    var labelArray = [];
    var label = "";
    var campaignId = 0;
    var campaignName = "";
    var allowLeadUpdates = false;

    if(typeof response.ui_response.campaigns.campaign !== 'undefined'){
        campaignsRaw = response.ui_response.campaigns.campaign;
    }

    if(Array.isArray(campaignsRaw)){
        // dealing with an array
        for(var c = 0; c < campaignsRaw.length; c++){
            campaignId = campaignsRaw[c]['@campaign_id'];
            campaignName = campaignsRaw[c]['@campaign_name'];
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
                campaignName: campaignName,
                surveyId: campaignsRaw[c]['@survey_id'],
                surveyName: campaignsRaw[c]['@survey_name'],
                customLabels: labelArray
            };
            campaigns.push(campaign);
        }
    }else{
        if(campaignsRaw){
            // single campaign object
            campaignId = campaignsRaw['@campaign_id'];
            campaignName = campaignsRaw['@campaign_name'];
            allowLeadUpdates = campaignsRaw['@allow_lead_updates'] == '1';
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
                allowLeadUpdates: allowLeadUpdates,
                campaignId: campaignId,
                campaignName: campaignName,
                surveyId: campaignsRaw['@survey_id'],
                surveyName: campaignsRaw['@survey_name'],
                customLabels: labelArray
            };
            campaigns.push(campaign);
        }
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

var OffhookInitRequest = function() {

};

OffhookInitRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.OFFHOOK_INIT,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "dial_dest":{
                "#text":UIModel.getInstance().agentSettings.dialDest
            }
        }
    };

    return JSON.stringify(msg);
};


/*
 * This class is responsible for handling an off-hook-init response packet from IntelliQueue.
 * If the offhookinit is successful, it will go into the UIModel and set the isOffhook variable
 * to true.
 *
 * <ui_response type="OFF-HOOK-INIT" message_id="UI2005" response_to="">
 * 		<status>OK|FAILURE</status>
 * 		<message></message>
 * 		<detail></detail>
 * </ui_response>
 */
OffhookInitRequest.prototype.processResponse = function(response) {
    var status = response.ui_response.status['#text'];
    var formattedResponse = utils.buildDefaultResponse(response);

    if(status === 'OK'){
        UIModel.getInstance().offhookInitPacket = response;
        UIModel.getInstance().agentSettings.isOffhook = true;
    }else{
        if(formattedResponse.message === ""){
            formattedResponse.message = "Unable to process offhook request";
        }
        console.log("AgentLibrary: Unable to process offhook request ", detail);
    }

    return formattedResponse;
};



var OffhookTermRequest = function(showWarning) {

};

OffhookTermRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.OFFHOOK_TERM,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            }
        }
    };

    return JSON.stringify(msg);
};


/*
 * Process an OFF-HOOK-TERM packet and update various variables in the UI
 *
 * <ui_notification message_id="IQ10012016080217135001344" response_to="" type="OFF-HOOK-TERM">
 *    <agent_id>1</agent_id>
 *    <start_dts>2016-08-02 17:11:38</start_dts>
 *    <end_dts>2016-08-02 17:14:07</end_dts>
 *    <monitoring>0</monitoring>
 * </ui_notification>
 */
OffhookTermRequest.prototype.processResponse = function(data) {
    var monitoring = data.ui_notification.monitoring['#text'] === '1';
    var model = UIModel.getInstance();

    model.agentSettings.wasMonitoring = monitoring;
    model.offhookTermPacket = data;
    model.agentSettings.isOffhook = false;

    var formattedResponse = {
        agentId: data.ui_notification.agent_id['#text'],
        startDts: data.ui_notification.start_dts['#text'],
        endDts: data.ui_notification.end_dts['#text'],
        monitoring: monitoring
    };

    return formattedResponse;
};


var DialGroupChangeNotification = function() {

};

/*
 * This class is responsible for handling a DIAL_GROUP_CHANGE notification.
 * This event is sent from IQ when an agent's dial group is changed in through the AdminUI.
 *
 *  <ui_notification message_id="IQ10012016080413085500263" type="DIAL_GROUP_CHANGE">
 *      <agent_id>1180958</agent_id>
 *      <dial_group_id>50354</dial_group_id>
 *      <dialGroupName>Preview Dial Mode</dialGroupName>
 *      <dial_group_desc/>
 *  </ui_notification>
 */
DialGroupChangeNotification.prototype.processResponse = function(notification) {
    //Modify configRequest with new DialGroupId
    var model = UIModel.getInstance();
    var origLoginType = model.configRequest.loginType;
    var newDgId = notification.ui_notification.dial_group_id['#text'] || "";

    model.dialGroupChangeNotification = notification;

    // Calculate type of login - called from AdminUI when assigning agent to new dial group.
    // Only options should be BLENDED or OUTBOUND here.
    if(newDgId && newDgId !== "" && (origLoginType === "INBOUND" || origLoginType === "BLENDED") ){
        model.configRequest.loginType = "BLENDED";
    }else if (newDgId && newDgId !== ""){
        model.configRequest.loginType = "OUTBOUND";
    }else if (origLoginType  === "INBOUND"){
        model.configRequest.loginType = "INBOUND";
    }else{
        model.configRequest.loginType = "NO-SELECTION";
    }

    UIModel.getInstance().configRequest.dialGroupId = newDgId;

    var formattedResponse = {
        message: "Dial Group Updated Successfully.",
        detail: "Dial Group changed to [" + newDgId + "].",
        dialGroupId: notification.ui_notification.dial_group_id['#text'],
        dialGroupName: notification.ui_notification.dialGroupName['#text'], // camel case from server for some reason :/
        dialGroupDesc: notification.ui_notification.dial_group_desc['#text'],
        agentId: notification.ui_notification.agent_id['#text']
    };

    return formattedResponse;
};


var DialGroupChangePendingNotification = function() {

};

/*
 * This class is responsible for handling a DIAL_GROUP_CHANGE_PENDING notification.
 * This event is sent from IQ when an agent's dial group is changed and the agent is on a call.
 *
 * <ui_notification message_id="IQ10012016080515294800318" type="DIAL_GROUP_CHANGE_PENDING">
 *   <agent_id>1180958</agent_id>
 *   <dial_group_id>50354</dial_group_id>
 *   <update_from_adminui>TRUE</update_from_adminui>
 * </ui_notification>
 */
DialGroupChangePendingNotification.prototype.processResponse = function(notification) {
    var model = UIModel.getInstance();
    model.agentSettings.pendingDialGroupChange = parseInt(notification.ui_notification.dial_group_id["#text"], 10);

    // check if request originated with AdminUI
    if(notification.ui_notification.update_from_adminui){
        model.agentSettings.updateDGFromAdminUI = notification.ui_notification.update_from_adminui["#text"].toUpperCase() === "TRUE";
    }else{
        model.agentSettings.updateDGFromAdminUI = false;
    }

    var formattedResponse = {
        message: "Dial Group Change Pending notification received.",
        detail: "DialGroup switch for existing session pending until active call ends.",
        agentId: notification.ui_notification.agent_id['#text'],
        dialGroupId: notification.ui_notification.dial_group_id['#text'],
        updateFromAdminUI: notification.ui_notification.update_from_adminui['#text']
    };

    return formattedResponse;
};


var EndCallNotification = function(libInstance) {
    this.libInstance = libInstance;
};

/*
 * This class is responsible for handling an END-CALL notification.
 * Save the packet in the UIModel by appending it to the currentCall packet.
 * Update the CallState field in the UIModel to "CALL-ENDED"
 *
 *  <ui_notification message_id="IQ982008082910362203349" response_to="" type="END-CALL">
 *       <agent_id>1856</agent_id>
 *       <uii>200808291035510000000900029412</uii>
 *       <session_id>2</session_id>
 *       <call_dts>2008-08-29 10:36:04</call_dts>
 *       <call_duration>16</call_duration>
 *       <term_party>CALLER</term_party>
 *       <term_reason/>
 *       <recording_url/>
 *       <disposition_timeout>60</disposition_timeout>
 *  </ui_notification>
 */
EndCallNotification.prototype.processResponse = function(notification) {
    var duration = 0;
    var termParty = "";
    var termReason = "";
    var model = UIModel.getInstance();

    model.endCallNotification = notification;

    // add callDuration, termParty, and termReason to the current call packet
    if(notification.ui_notification.call_duration){
        duration = notification.ui_notification.call_duration["#text"];
    }
    if(notification.ui_notification.term_party){
        termParty = notification.ui_notification.term_party["#text"];
    }
    if(notification.ui_notification.term_reason){
        termReason = notification.ui_notification.term_reason["#text"];
    }

    model.currentCall.duration = duration;
    model.currentCall.termParty = termParty;
    model.currentCall.termReason = termReason;

    // set call state to "CALL-ENDED"
    model.agentSettings.callState = "CALL-ENDED";

    // Clear out any transfer sessions from the previous call
    model.transferSessions = {};

    // Check if there is a pending dial group change
    if(model.agentSettings.pendingDialGroupChange > 0 || model.agentSettings.pendingDialGroupChange == -1) {
        // update dial group id
        model.configRequest.dialGroupId = model.agentSettings.pendingDialGroupChange;

        // send login update request
        this.libInstance.configureAgent(model.configRequest.queueIds, model.configRequest.chatIds, model.configRequest.skillProfileId, model.configRequest.dialGroupId, model.configRequest.dialDest, model.agentSettings.updateDGFromAdminUI);

        // reset pending dial group variables
        model.agentSettings.pendingDialGroupChange = 0;
        model.agentSettings.updateDGFromAdminUI = false;
    }

    var formattedResponse = {
        message: "End Call Notification Received.",
        detail: "",
        uii: notification.ui_notification.uii["#text"],
        sessionId: notification.ui_notification.session_id["#text"],
        agentId: notification.ui_notification.agent_id['#text'],
        callDts: notification.ui_notification.call_dts['#text'],
        duration: duration,
        termParty: termParty,
        termReason: termReason,
        recordingUrl: notification.ui_notification.recording_url['#text'],
        dispositionTimeout: notification.ui_notification.disposition_timeout['#text']
    };

    return formattedResponse;
};


var GatesChangeNotification = function() {

};

/*
 * This class is responsible for handling a gates change notification
 *
 * <ui_notification message_id="IQ10012016080815372800837" type="GATES_CHANGE">
 *    <agent_id>1180958</agent_id>
 *    <gate_ids>11117,3</gate_ids>
 * </ui_notification>
 */
GatesChangeNotification.prototype.processResponse = function(notification) {
    var model = UIModel.getInstance();
    var newAssignedGates = [];
    var availableQueues = model.inboundSettings.availableQueues;
    var assignedGateIds = notification.ui_notification.gate_ids['#text'] || "";
    if(assignedGateIds !== ""){
        assignedGateIds = assignedGateIds.split(',');
    }

    for(var a = 0; a < assignedGateIds.length; a++){
        // find gate in avail list
        var id = assignedGateIds[a];
        var foundGate = utils.findObjById(availableQueues, id, "gateId");
        if(foundGate){
            newAssignedGates.push(foundGate);
        }else{
            // gate not in assigned list, add stub
            var gate = {
                gateId: id,
                gateName:"",
                gateDesc:"",
                defaultDestOverride:"",
                isAgentSelectable:false
            };
            newAssignedGates.push(gate);
        }
    }

    model.inboundSettings.queues = JSON.parse(JSON.stringify(newAssignedGates));

    var formattedResponse = {
        agentId: notification.ui_notification.agent_id['#text'],
        message: "Gates Change notification received.",
        queues: newAssignedGates
    };

    return formattedResponse;
};


var GenericNotification = function() {

};

/*
 * This class is responsible for handling a generic notification
 *
 *  <ui_notification message_id="IQ10012016080317400400011"
 *      response_to="1c2fe39f-a31e-aff8-8d23-92a61c88270f" type="GENERIC">
 *      <message_code>0</message_code>
 *      <message>OK</message>
 *      <detail>Pending Callback Successfully Cancelled.</detail>
 *  </ui_notification>
 */
GenericNotification.prototype.processResponse = function(notification) {
    var formattedResponse = utils.buildDefaultResponse(notification);

    // add message and detail if present
    var msgCode = notification.ui_notification.message_code;
    var messageCode = "";
    if(msgCode){
        messageCode = msgCode['#text'] || "";
    }
    formattedResponse.messageCode = messageCode;

    return formattedResponse;
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
            agentStateRequest : null,
            callbacksPendingRequest : null,
            configRequest : null,
            logoutRequest : null,
            loginRequest : null,                // Original LoginRequest sent to IS - used for reconnects
            offhookInitRequest : null,
            offhookTermRequest : null,

            // response packets
            agentStatePacket : null,
            configPacket : null,
            currentCallPacket : null,
            loginPacket : null,
            offhookInitPacket : null,
            offhookTermPacket : null,
            transferSessions: null,

            // notification packets
            dialGroupChangeNotification : new DialGroupChangeNotification(),
            dialGroupChangePendingNotification : new DialGroupChangePendingNotification(),
            endCallNotification : new EndCallNotification(),
            gatesChangeNotification : new GatesChangeNotification(),
            genericNotification : new GenericNotification(),
            currentCall: {},                        // save the NEW-CALL notification in original form??

            // application state
            applicationSettings : {
                availableCountries : [],
                isLoggedInIS : false,               // a check for whether or not user is logged in with IntelliServices
                socketConnected : false,
                socketDest : "",
                isTcpaSafeMode : false              // Comes in at the account-level - will get set to true if this interface should be in tcpa-safe-mode only.
            },

            // current agent settings
            agentSettings : {
                agentId : 0,
                agentType : "AGENT",                // AGENT | SUPERVISOR
                altDefaultLoginDest : "",
                availableAgentStates : [],
                callerIds : [],
                callState: null,                     // display the current state of the call
                currentState : "OFFLINE",           // Agent system/base state
                currentStateLabel : "",             // Agent aux state label
                defaultLoginDest : "",
                dialDest : "",                      // Destination agent is logged in with for offhook session, set on configure response, if multi values in format "xxxx|,,xxxx"
                email : "",
                externalAgentId : "",
                firstName : "",
                isLoggedIn : false,                 // agent is logged in to the platform
                isOffhook : false,                  // track whether or not the agent has an active offhook session
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
                pendingCallbacks : [],
                pendingDialGroupChange: 0,          // Set to Dial Group Id if we are waiting to change dial groups until agent ends call
                realAgentType : "AGENT",
                updateDGFromAdminUI : false,        // if pending Dial Group change came from AdminUI, set to true (only used if request is pending)
                updateLoginMode : false,            // gets set to true when doing an update login (for events control)
                wasMonitoring : false               // used to track if the last call was a monitoring call
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
            // add message id to request map, then send message
            var msgObj = JSON.parse(msg);
            instance._requests[msgObj.ui_request['@message_id']] = { type: msgObj.ui_request['@type'], msg: msgObj.ui_request };
            instance.socket.send(msg);
        } else {
            console.warn("AgentLibrary: WebSocket is not connected, cannot send message.");
        }
    },

    processResponse: function(instance, response)
    {
        var type = response.ui_response['@type'];
        var messageId = response.ui_response['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        console.log("AgentLibrary: received response: (" + dest + ") " + type.toUpperCase());

        // Send generic on message response
        utils.fireCallback(instance, CALLBACK_TYPES.ON_MESSAGE, response);

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.LOGIN:
                if (dest === "IS") {
                    var loginResponse = UIModel.getInstance().loginRequest.processResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.LOGIN, loginResponse);
                } else if (dest === 'IQ') {
                    var configResponse = UIModel.getInstance().configRequest.processResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.CONFIG, configResponse);
                }
                break;
            case MESSAGE_TYPES.LOGOUT:
                // TODO add processResponse?
                utils.fireCallback(instance, CALLBACK_TYPES.LOGOUT, response);
                break;
            case MESSAGE_TYPES.AGENT_STATE:
                if(UIModel.getInstance().agentStateRequest === null){
                    UIModel.getInstance().agentStateRequest = new AgentStateRequest(response.ui_response.current_state["#text"], response.ui_response.agent_aux_state['#text']);
                }
                var stateChangeResposne = UIModel.getInstance().agentStateRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.AGENT_STATE, stateChangeResposne);
                break;
            case MESSAGE_TYPES.OFFHOOK_INIT:
                var initResponse = UIModel.getInstance().offhookInitRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.OFFHOOK_INIT, initResponse);
                break;
            case MESSAGE_TYPES.CALLBACK_PENDING:
                var pendingCallbacks = UIModel.getInstance().callbacksPendingRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.CALLBACK_PENDING, pendingCallbacks);
            break;
        }

    },

    processNotification: function(instance, data){
        var type = data.ui_notification['@type'];
        var messageId = data.ui_notification['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        console.log("AgentLibrary: received notification: (" + dest + ") " + type.toUpperCase());

        switch (type.toUpperCase()){
            case MESSAGE_TYPES.GATES_CHANGE:
                var gateChangeNotif = new GatesChangeNotification();
                var gateChangeResponse = gateChangeNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.GATES_CHANGE, gateChangeResponse);
                break;
            case MESSAGE_TYPES.DIAL_GROUP_CHANGE:
                var dgChangeNotif = new DialGroupChangeNotification();
                var changeResponse = dgChangeNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.DIAL_GROUP_CHANGE, changeResponse);
                break;
            case MESSAGE_TYPES.DIAL_GROUP_CHANGE_PENDING:
                var dgChangePendNotif = new DialGroupChangePendingNotification();
                var pendResponse = dgChangePendNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.DIAL_GROUP_CHANGE_PENDING, pendResponse);
                break;
            case MESSAGE_TYPES.END_CALL:
                var endCallNotif = new EndCallNotification(instance);
                var endCallResponse = endCallNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.END_CALL, endCallResponse);
                break;
            case MESSAGE_TYPES.GENERIC:
                var genericNotif = new GenericNotification();
                var generic = genericNotif.processResponse(data);
                var responseTo = data.ui_notification['@response_to'];
                if(instance._requests[responseTo]){
                    // found corresponding request, fire registered callback for type
                    var type = instance._requests[responseTo].type;
                    var callbackFnName = utils.findCallbackBasedOnMessageType(type);
                    utils.fireCallback(instance, callbackFnName, generic);
                }else{
                    // no corresponding request, just fire generic notification callback
                    utils.fireCallback(instance, CALLBACK_TYPES.GENERIC_NOTIFICATION, generic);
                }
                break;
            case MESSAGE_TYPES.OFFHOOK_TERM:
                if(UIModel.getInstance().offhookTermRequest === null){
                    // offhook term initiated by IQ
                    UIModel.getInstance().offhookTermRequest = new OffhookTermRequest();
                }
                var termResponse = UIModel.getInstance().offhookTermRequest.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.OFFHOOK_TERM, termResponse);
                break;
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

        if(response[groupProp] && typeof response[groupProp][itemProp] !== 'undefined'){
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
            availIds.push(parseInt(objArray[o][idProperty], 10));
        }

        // go through selected ids and mark unfound ones for removal
        for(var i = 0; i < idArray.length; i++){
            if(availIds.indexOf(parseInt(idArray[i],10)) === -1){
                // selected id not found in available list, mark for removal
                removeIds.push(parseInt(idArray[i],10));
            }
        }

        // remove marked ids
        for(var r = idArray.length -1; r >= 0; r--){
            if(removeIds.indexOf(parseInt(idArray[r],10)) > -1){
                // remove
                idArray.splice(r,1);
            }
        }

        return idArray;
    },

    // find an object by given id in an array of objects
    findObjById: function(objArray, id, propName){
        for(var o = 0; o < objArray.length; o++){
            var obj = objArray[o];
            if(obj[propName] === id){
                return obj;
            }
        }

        return null;
    },

    // check whether agent dialDest is either a 10-digit number or valid sip
    validateDest: function(dialDest){
        var isValid = false;
        var isNum = /^\d+$/.test(dialDest);
        if(isNum && dialDest.length === 10){
            // is a 10-digit number
            isValid = true;
        }else if(dialDest.slice(0,4).toLowerCase() === "sip:" && dialDest.indexOf("@") !== -1){
            // has sip prefix and '@'
            isValid = true;
        }

        return isValid;
    },

    // pass in MESSAGE_TYPE string (e.g. "CANCEL-CALLBACK"),
    // return corresponding CALLBACK_TYPE function name string (e.g. "callbackCancelResponse")
    findCallbackBasedOnMessageType: function(messageType){
        var callbackFnName = "";
        for(key in MESSAGE_TYPES){
            if(MESSAGE_TYPES[key] === messageType){
                callbackFnName = CALLBACK_TYPES[key];
            }
        }
        return callbackFnName;
    },

    // add message, detail, and status values to the formattedResponse
    // returned from each request processResponse method
    buildDefaultResponse: function(response){
        var message = "";
        var detail = "";
        var status = "";
        var msg = "";
        var det = "";
        var stat = "";

        // add message and detail if present
        if(response.ui_response){
            msg = response.ui_response.message;
            det = response.ui_response.detail;
            stat = response.ui_response.status;
        }else if(response.ui_notification){
            msg = response.ui_notification.message;
            det = response.ui_notification.detail;
            stat = response.ui_notification.status;
        }

        if(msg){
            message = msg['#text'] || "";
        }
        if(det){
            detail = det['#text'] || "";
        }
        if(stat){
            status = stat['#text'] || "";
        }

        return ({
            message: message,
            detail: detail,
            status: status
        });
    },

    toString: function(val){
        if(val){
            return val.toString();
        }else{
            return "";
        }
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

/*jshint esnext: true */
const CALLBACK_TYPES = {
    "AGENT_STATE":"agentStateResponse",
    "CLOSE_SOCKET":"closeResponse",
    "CONFIG":"configureResponse",
    "CALLBACK_PENDING":"callbacksPendingResponse",
    "CALLBACK_CANCEL":"callbackCancelResponse",
    "DIAL_GROUP_CHANGE":"dialGroupChangeNotification",
    "DIAL_GROUP_CHANGE_PENDING":"dialGroupChangePendingNotification",
    "END_CALL":"endCallNotification",
    "GATES_CHANGE":"gatesChangeNotification",
    "GENERIC_NOTIFICATION":"genericNotification",
    "GENERIC_RESPONSE":"genericResponse",
    "LOGIN":"loginResponse",
    "OFFHOOK_INIT":"offhookInitResponse",
    "OFFHOOK_TERM":"offhookTermResponse",
    "OPEN_SOCKET":"openResponse"
};

const MESSAGE_TYPES = {
    "LOGIN":"LOGIN",
    "LOGOUT":"LOGOUT",
    "AGENT_STATE":"AGENT-STATE",
    "CALLBACK_PENDING":"PENDING-CALLBACKS",
    "CALLBACK_CANCEL":"CANCEL-CALLBACK",
    "END_CALL":"END-CALL",
    "DIAL_GROUP_CHANGE":"DIAL_GROUP_CHANGE",
    "DIAL_GROUP_CHANGE_PENDING":"DIAL_GROUP_CHANGE_PENDING",
    "GATES_CHANGE":"GATES_CHANGE",
    "ON_MESSAGE":"ON-MESSAGE",
    "GENERIC":"GENERIC",
    "OFFHOOK_INIT":"OFF-HOOK-INIT",
    "OFFHOOK_TERM":"OFF-HOOK-TERM"
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
     * @property {object} _requests Internal map of requests by message id, private property.
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
        this._requests = {};

        // set default values
        if(typeof config.callbacks !== 'undefined'){
            this.callbacks = config.callbacks;
        }

        if(typeof config.socketDest !== 'undefined'){
            UIModel.getInstance().applicationSettings.socketDest = config.socketDest;
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
     * Get latest outgoing offhook init Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getOffhookInitRequest = function() {
        return UIModel.getInstance().offhookInitRequest;
    };
    /**
     * Get latest outgoing offhook termination Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getOffhookTermRequest = function() {
        return UIModel.getInstance().offhookTermRequest;
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
    /**
     * Get latest received packet for initiating an offhook session
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getOffhookInitPacket = function() {
        return UIModel.getInstance().offhookInitPacket;
    };
    /**
     * Get latest received packet for terminating an offhook session
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getOffhookTermPacket = function() {
        return UIModel.getInstance().offhookTermPacket;
    };

    // notifications
    /**
     * Get latest received notification for Dial Group Change message
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getDialGroupChangeNotification = function() {
        return UIModel.getInstance().dialGroupChangeNotification;
    };
    /**
     * Get latest received notification for Dial Group Change Pending message
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getDialGroupChangePendingNotification = function() {
        return UIModel.getInstance().dialGroupChangePendingNotification;
    };
    /**
     * Get latest received notification for End Call message
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getEndCallNotification = function() {
        return UIModel.getInstance().endCallNotification;
    };
    /**
     * Get latest received notification for Gates Change message
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getGatesChangeNotification = function() {
        return UIModel.getInstance().gatesChangeNotification;
    };
    /**
     * Get latest received generic notification message
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getGenericNotification = function() {
        return UIModel.getInstance().genericNotification;
    };
    /**
     * Get current call object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCurrentCall = function() {
        return UIModel.getInstance().currentCall;
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
     * Get Connection Settings object containing the current state of connection related data
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getConnectionSettings = function() {
        return UIModel.getInstance().connectionSettings;
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
            instance.socket = new WebSocket(UIModel.getInstance().applicationSettings.socketDest);

            instance.socket.onopen = function() {
                UIModel.getInstance().applicationSettings.socketConnected = true;
                utils.fireCallback(instance, CALLBACK_TYPES.OPEN_SOCKET, '');
            };

            instance.socket.onmessage = function(evt){
                var data = JSON.parse(evt.data);
                if(data.ui_response){
                    utils.processResponse(instance, data);
                }else if(data.ui_notification){
                    utils.processNotification(instance, data);
                }
            };

            instance.socket.onclose = function(){
                utils.fireCallback(instance, CALLBACK_TYPES.CLOSE_SOCKET, '');
                UIModel.getInstance().applicationSettings.socketConnected = false;
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
     * @param {function} [callback=null] Callback function when loginAgent response received
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
     * @param {string} [dialGroupId=null] The outbound dial group id the agent will be logged into.
     * @param {string} dialDest The agent's number, sip | DID.
     * @param {string} [updateFromAdminUI=false] Whether the request is generated from the AdminUI or not.
     * @param {function} [callback=null] Callback function when configureAgent response received.
     */
    AgentLibrary.prototype.configureAgent = function(queueIds, chatIds, skillProfileId, dialGroupId, dialDest, updateFromAdminUI, callback){
        UIModel.getInstance().configRequest = new ConfigRequest(queueIds, chatIds, skillProfileId, dialGroupId, dialDest, updateFromAdminUI);
        var msg = UIModel.getInstance().configRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CONFIG, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends agent logout message to IntelliQueue
     * @memberof AgentLibrary
     * @param {number} agentId Id of the agent that will be logged out.
     * @param {function} [callback=null] Callback function when logoutAgent response received.
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
     * @param {function} [callback=null] Callback function when agentState response received
     */
    AgentLibrary.prototype.setAgentState = function(agentState, agentAuxState, callback){
        UIModel.getInstance().agentStateRequest = new AgentStateRequest(agentState, agentAuxState);
        var msg = UIModel.getInstance().agentStateRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.AGENT_STATE, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Initiates an agent offhook session
     * @memberof AgentLibrary
     * @param {function} [callback=null] Callback function when offhookInit response received
     */
    AgentLibrary.prototype.offhookInit = function(callback){
        UIModel.getInstance().offhookInitRequest = new OffhookInitRequest();
        var msg = UIModel.getInstance().offhookInitRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.OFFHOOK_INIT, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Terminates agent's offhook session
     * @memberof AgentLibrary
     * @param {function} [callback=null] Callback function when offhookTerm response received
     */
    AgentLibrary.prototype.offhookTerm = function(callback){
        UIModel.getInstance().offhookTermRequest = new OffhookTermRequest();
        var msg = UIModel.getInstance().offhookTermRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.OFFHOOK_TERM, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Returns scheduled callbacks for the given agent
     * @memberof AgentLibrary
     * @param {number} [agentId=logged in agent id] Id of agent to get callbacks for
     * @param {function} [callback=null] Callback function when pending callbacks response received
     */
    AgentLibrary.prototype.getPendingCallbacks = function(agentId, callback){
        UIModel.getInstance().callbacksPendingRequest = new CallbacksPendingRequest(agentId);
        var msg = UIModel.getInstance().callbacksPendingRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CALLBACK_PENDING, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Cancel a scheduled callback for the given agent based on lead id
     * @memberof AgentLibrary
     * @param {number} leadId Id of lead callback to cancel
     * @param {number} [agentId=logged in agent id] Id of agent to cancel specified lead callback for
     * @param {function} [callback=null] Callback function when offhookTerm response received
     */
    AgentLibrary.prototype.cancelCallback = function(leadId, agentId, callback){
        UIModel.getInstance().callbackCancelRequest = new CallbackCancelRequest(leadId, agentId);
        var msg = UIModel.getInstance().callbackCancelRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CALLBACK_CANCEL, callback);
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
