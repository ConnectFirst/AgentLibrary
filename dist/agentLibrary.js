/*! cf-agent-library - v0.0.0 - 2016-08-18 - Connect First */
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
    var resp = response.ui_response;
    var status = utils.getText(resp, "status");
    var prevState = utils.getText(resp, "prev_state");
    var currState = utils.getText(resp, "current_state");
    var prevAuxState = utils.getText(resp, "prev_aux_state");
    var currAuxState = utils.getText(resp, "agent_aux_state");
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
        console.warn("AgentLibrary: Unable to change agent state " + formattedResponse.detail);
    }

    return formattedResponse;
};




var CallNotesRequest = function(notes) {
    this.notes = notes;
};

/*
* This event is responsible for allowing an agent to tag a call with notes
*
* <ui_request type="CALL-NOTES" uii="" response_to="" message_id="IQ20081027151806763">
* 		<notes><![[BLAH]]></notes>
* </ui_request>
* */
CallNotesRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "@type":MESSAGE_TYPES.CALL_NOTES,
            "agent_id": {
                "#text" : utils.toString(model.agentSettings.agentId)
            },
            "uii": {
                "#text" : utils.toString(model.currentCall.uii)
            },
            "notes": {
                "#text" : utils.toString(this.notes)
            }
        }
    };


    return JSON.stringify(msg);
};


/*
 * This class process CALL-NOTES packets rec'd from IntelliQueue.
 *
 * <ui_response message_id="IQ982008082817165103294" type="CALL-NOTES">
 *	  <status>OK</status>
 * 	  <message/>
 *	  <detail/>
 * </ui_response>
 */
CallNotesRequest.prototype.processResponse = function(response) {
    var formattedResponse = utils.buildDefaultResponse(response);

    if(formattedResponse.status === "OK"){
        formattedResponse.message = "Call notes have been updated.";
        formattedResponse.type = "INFO_EVENT";
    }else{
        formattedResponse.type = "ERROR_EVENT";
        formattedResponse.message = "Unable to update notes.";
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
        firstName : utils.getText(leadRaw, "first_name"),
        midName : utils.getText(leadRaw, "mid_name"),
        lastName : utils.getText(leadRaw, "last_name"),
        sufix : utils.getText(leadRaw, "suffix"),
        title : utils.getText(leadRaw, "title"),
        address1 : utils.getText(leadRaw, "address1"),
        address2 : utils.getText(leadRaw, "address2"),
        city : utils.getText(leadRaw, "city"),
        state : utils.getText(leadRaw, "state"),
        zip : utils.getText(leadRaw, "zip"),
        gateKeeper : utils.getText(leadRaw, "gate_keeper")
    };

    return lead;
}


/*
 * This request is used to get the list of dispositions for a given campaign
 * E.g. in the lead search form for manual passes
 */
var CampaignDispositionsRequest = function(campaignId) {
    this.agentId = UIModel.getInstance().agentSettings.agentId;
    this.campaignId = campaignId;
};

CampaignDispositionsRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CAMPAIGN_DISPOSITIONS,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(this.agentId)
            },
            "campaign_id": {
                "#text":utils.toString(this.campaignId)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class is responsible for handling CAMPAIGN-DISPOSITIONS packets received
 * from IntelliQueue. It will save a copy of it in the UIModel.
 *
  <ui_response message_id="IQ982008091512353000875"  response_to="UIV220089151235539" type="CAMPAIGN-DISPOSITIONS">
  		<outdial_dispositions>
     		<disposition disposition_id="130">complete</disposition>
     		<disposition disposition_id="131">incomplete</disposition>
     		<disposition disposition_id="132">warm xfer</disposition>
     		<disposition disposition_id="133">cold xfer</disposition>
   	</outdial_dispositions>
  </ui_response>
 */
CampaignDispositionsRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var model = UIModel.getInstance();
    var dispositions = utils.processResponseCollection(resp, 'outdial_dispositions', 'disposition', 'disposition');

    model.outboundSettings.campaignDispositions = dispositions;
    return dispositions;
};


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
    var resp = response.ui_response;
    var status = utils.getText(resp, "status");
    var detail = utils.getText(resp, "detail");
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
            model.connectionSettings.hashCode = utils.getText(resp, "hash_code");
            model.agentSettings.isLoggedIn = true;
            model.agentSettings.loginDTS = new Date();
            model.connectionSettings.reconnect = true;
            model.agentPermissions.allowLeadSearch = false;
            model.agentSettings.dialDest = model.configRequest.dialDest; // not sent in response
            model.agentSettings.loginType = utils.getText(resp, "login_type");

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
                model.agentSettings.dialDest = model.configRequest.dialDest;

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

var DispositionRequest = function(uii, dispId, notes, callback, callbackDTS, contactForwardNumber, survey) {
    this.uii = uii;
    this.dispId = dispId;
    this.notes = notes;
    this.callback = callback;
    this.callbackDTS = callbackDTS || "";
    this.contactForwardNumber = contactForwardNumber || null;

    /*
     * survey = [
     *      { label: "", externId: "", leadUpdateColumn: ""}
     * ]
     */
    this.survey = survey || null;
};

/*
 * This class is responsible for creating an inbound or outbound disposition packet to
 * send to intelliqueue. It will grab uii and agent_id directly from packets saved
 * in the UIModel. Then, using the information passed in, it will
 * create the remainder of the packet. This class is called from the ExtendedCallForm
 *
 * <ui_request response_to="" message_id="UIV220089241119416" type="OUTDIAL-DISPOSITION|INBOUND-DISPOSITION">
 * 		<uii>200809241119590139990000000069</uii>
 * 		<lead_id>213215</lead_id>
 * 		<outbound_externid>909809</outbound_externid>
 * 		<agent_id>1810</agent_id>
 * 		<disposition_id>126</disposition_id>
 * 		<notes>here are my notes :)</notes>
 * 		<call_back>TRUE | FALSE</call_back>
 * 		<call_back_DTS>2008-09-30 22:30:00 | null</call_back_DTS>
 * 		<contact_forward_number>5555555555 | null</contact_forward_number>
 * 		<session_id>2</session_id>  ONLY WHEN AVAILABLE otherwise the node is left blank. this is the AGENT session_id
 * </ui_request>
 *
 */
DispositionRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "@type":MESSAGE_TYPES.OUTDIAL_DISPOSITION,
            "agent_id": {
                "#text" : utils.toString(model.agentSettings.agentId)
            },
            "session_id":{
                "#text": ""
            },
            "uii": {
                "#text" : utils.toString(this.uii)
            },
            "disposition_id": {
                "#text" : utils.toString(this.dispId)
            },
            "notes": {
                "#text" : utils.toString(this.notes)
            },
            "call_back": {
                "#text" : this.callback === true? "TRUE" : "FALSE"
            },
            "call_back_DTS": {
                "#text" : utils.toString(this.callbackDTS)
            },
            "contact_forwarding": {
                "#text" : utils.toString(this.contactForwardNumber)
            }
        }
    };


    if(model.currentCall.outdialDispositions && model.currentCall.outdialDispositions.type === "GATE") {
        msg.ui_request['@type'] = MESSAGE_TYPES.INBOUND_DISPOSITION;
    }

    if(model.currentCall.sessionId){
        msg.ui_request.session_id = {"#text":model.currentCall.sessionId};
    }

    /*
     * survey : {
     *      response: [
     *          { "@extern_id":"", "@lead_update_column":"", "#text":"" }
     *      ]
     * }
     */
    if(this.survey !== null){
        var response = [];
        for(var i = 0; i < this.survey.length; i++){
            var obj = {
                "@extern_id": utils.toString(this.survey[i].externId),
                "@lead_update_column": utils.toString(this.survey[i].leadUpdateColumn),
                "#text": this.survey[i].label
            };
            response.push(obj);
        }
        msg.ui_request.survey = {"response":response};
    }


    return JSON.stringify(msg);
};


var DispositionManualPassRequest = function(dispId, notes, callback, callbackDTS, leadId, requestKey, externId) {
    this.dispId = dispId;
    this.notes = notes;
    this.callback = callback;
    this.callbackDTS = callbackDTS || "";
    this.leadId = leadId || null;
    this.requestKey = requestKey || null;
    this.externId = externId || null;
};

/*
 * Sends an OUTDIAL-DISPOSITION request, just a separate class
 * specifically for dispositions on manual pass.
 *
 * <ui_request response_to="" message_id="UIV220089241119416" type="OUTDIAL-DISPOSITION">
 *      <manual_disp>TRUE</manual_disp>
 *      <request_key>IQ10012016081719070100875</request_key>
 *      <session_id/>
 * 		<uii/>
 * 	    <agent_id>1810</agent_id>
 * 		<lead_id>213215</lead_id>
 * 		<outbound_externid>909809</outbound_externid>
 * 		<disposition_id>126</disposition_id>
 * 		<notes>here are my notes :)</notes>
 * 		<call_back>TRUE | FALSE</call_back>
 * 		<call_back_DTS>2008-09-30 22:30:00 | null</call_back_DTS>
 * 	    <contact_forwarding>null</contact_forwarding>
 * </ui_request>
 *
 */
DispositionManualPassRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "@type":MESSAGE_TYPES.OUTDIAL_DISPOSITION,
            "manual_disp": {
                "#text" : "TRUE"
            },
            "agent_id": {
                "#text" : utils.toString(model.agentSettings.agentId)
            },
            "request_key": {
                "#text": utils.toString(this.requestKey)
            },
            "disposition_id": {
                "#text" : utils.toString(this.dispId)
            },
            "notes": {
                "#text" : utils.toString(this.notes)
            },
            "call_back": {
                "#text" : this.callback === true? "TRUE" : "FALSE"
            },
            "call_back_DTS": {
                "#text" : utils.toString(this.callbackDTS)
            },
            "lead_id": {
                "#text" : utils.toString(this.leadId)
            },
            "extern_id": {
                "#text" : utils.toString(this.externId)
            },
            "contact_forwarding": {
                "#text": "null"
            },
            "session_id":{},
            "uii": {}
        }
    };

    return JSON.stringify(msg);
};


var HangupRequest = function(sessionId) {
    this.sessionId = sessionId || null;
};

HangupRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.HANGUP,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "uii":{
                "#text":utils.toString(UIModel.getInstance().currentCall.uii)
            },
            "session_id":{
                "#text":utils.toString(this.sessionId === null ? UIModel.getInstance().currentCall.sessionId : this.sessionId)
            }
        }
    };

    return JSON.stringify(msg);
};


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
    var resp = response.ui_response;
    var status = resp.status['#text'];
    var model = UIModel.getInstance();
    var formattedResponse = utils.buildDefaultResponse(response);

    if(status === 'OK'){
        if(!model.isLoggedInIS){
            // save login packet properties to UIModel
            model.loginPacket = response;
            model.applicationSettings.isLoggedInIS = true;
            model.applicationSettings.isTcpaSafeMode = utils.getText(resp, 'tcpa_safe_mode') === "1";
            model.chatSettings.alias = utils.getText(resp, 'first_name') + " " + utils.getText(resp, 'last_name');

            model.agentSettings.loginDTS = new Date();
            model.agentSettings.maxBreakTime = utils.getText(resp, 'max_break_time');
            model.agentSettings.maxLunchTime = utils.getText(resp, 'max_lunch_time');
            model.agentSettings.firstName = utils.getText(resp, 'first_name');
            model.agentSettings.lastName = utils.getText(resp, 'last_name');
            model.agentSettings.email = utils.getText(resp, 'email');
            model.agentSettings.agentId = utils.getText(resp, 'agent_id');
            model.agentSettings.externalAgentId = utils.getText(resp, 'external_agent_id');
            model.agentSettings.agentType = utils.getText(resp, 'agent_type');
            model.agentSettings.realAgentType = utils.getText(resp, 'real_agent_type');
            model.agentSettings.defaultLoginDest = utils.getText(resp, 'default_login_dest');
            model.agentSettings.altDefaultLoginDest = utils.getText(resp, 'alt_default_login_dest');
            model.agentSettings.disableSupervisorMonitoring = utils.getText(resp, 'disable_supervisor_monitoring');
            model.agentSettings.initLoginState = utils.getText(resp, 'init_login_state');
            model.agentSettings.initLoginStateLabel = utils.getText(resp, 'init_login_state_label');
            model.agentSettings.outboundManualDefaultRingtime = utils.getText(resp, 'outbound_manual_default_ringtime');
            model.agentSettings.isOutboundPrepay = utils.getText(resp, 'outbound_prepay') === "1";

            model.agentPermissions.allowCallControl = utils.getText(resp, 'allow_call_control') === "1";
            model.agentPermissions.allowChat = utils.getText(resp, 'allow_chat') === "1";
            model.agentPermissions.showLeadHistory = utils.getText(resp, 'show_lead_history') === "1";
            model.agentPermissions.allowManualOutboundGates = utils.getText(resp, 'allow_manual_outbound_gates') === "1";
            model.agentPermissions.allowOffHook = utils.getText(resp, 'allow_off_hook') === "1";
            model.agentPermissions.allowManualCalls = utils.getText(resp, 'allow_manual_calls') === "1";
            model.agentPermissions.allowManualPass = utils.getText(resp, 'allow_manual_pass') === "1";
            model.agentPermissions.allowManualIntlCalls = utils.getText(resp, 'allow_manual_intl_calls') === "1";
            model.agentPermissions.allowLoginUpdates = utils.getText(resp, 'allow_login_updates') === "1";
            model.agentPermissions.allowInbound = utils.getText(resp, 'allow_inbound') === "1";
            model.agentPermissions.allowOutbound = utils.getText(resp, 'allow_outbound') === "1";
            model.agentPermissions.allowBlended = utils.getText(resp, 'allow_blended') === "1";
            model.agentPermissions.allowLoginControl = utils.getText(resp, 'allow_login_control') === "1";
            model.agentPermissions.allowCrossQueueRequeue = utils.getText(resp, 'allow_cross_gate_requeue') === "1";

            var allowLeadInserts = typeof resp.insert_campaigns === 'undefined' ? false : response.ui_response.insert_campaigns.campaign;
            if(allowLeadInserts && allowLeadInserts.length > 0){
                model.agentPermissions.allowLeadInserts = true;
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
    var notif = data.ui_notification;
    var monitoring = utils.getText(notif, "monitoring") === '1';
    var model = UIModel.getInstance();

    model.agentSettings.wasMonitoring = monitoring;
    model.offhookTermPacket = data;
    model.agentSettings.isOffhook = false;

    var formattedResponse = {
        agentId: utils.getText(notif, "agent_id"),
        startDts: utils.getText(notif, "start_dts"),
        endDts: utils.getText(notif, "end_dts"),
        monitoring: monitoring
    };

    return formattedResponse;
};


var OneToOneOutdialRequest = function(destination, ringTime, callerId, countryId, gateId) {
    this.destination = destination;
    this.ringTime = ringTime || "60";
    this.callerId = callerId;
    this.countryId = countryId || "USA";
    this.gateId = gateId || "";
};

OneToOneOutdialRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.ONE_TO_ONE_OUTDIAL,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "destination":{
                "#text":utils.toString(this.destination)
            },
            "ring_time":{
                "#text":utils.toString(this.ringTime)
            },
            "caller_id":{
                "#text":utils.toString(this.callerId)
            },
            "country_id":{
                "#text":utils.toString(this.countryId)
            },
            "gate_id":{
                "#text":utils.toString(this.gateId)
            }
        }
    };

    return JSON.stringify(msg);
};




var OneToOneOutdialCancelRequest = function(uii) {
    this.uii = uii
};

/*
 * This class is responsible for creating a new packet to cancel
 * an in-progress outbound call.
 */
OneToOneOutdialCancelRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.ONE_TO_ONE_OUTDIAL_CANCEL,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "uii":{
                "#text":utils.toString(this.uii)
            }
        }
    };

    return JSON.stringify(msg);
};





var PreviewDialRequest = function(action, searchFields, requestId) {
    this.agentId = UIModel.getInstance().agentSettings.agentId;
    this.searchFields = searchFields || [];
    this.requestId = requestId || "";
    this.action = action || "";
};

/*
 * searchFields = [
 *  {key: "name", value: "Danielle"},
 *  {key: "number", value: "5555555555"
 * ];
 */
PreviewDialRequest.prototype.formatJSON = function() {
    var fields = {};
    for(var i =0; i < this.searchFields.length; i++){
        var fieldObj = this.searchFields[i];
        fields[fieldObj.key] = { "#text" : utils.toString(fieldObj.value) };
    }

    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.PREVIEW_DIAL,
            "@message_id":utils.getMessageId(),
            "@action":this.action,
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "pending_request_id":{
                "#text":utils.toString(this.requestId)
            },
            "search_fields": fields
                // { "name": {"#text": "Danielle" } }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class is responsible for handling PREVIEW-DIAL packets received
 * from the dialer. It will save a copy of it in the UIModel.
 *
 * <dialer_request message_id="ID2008091513163400220" response_to="" type="PREVIEW_DIAL" callbacks="TRUE|FALSE">
 * 		<dial_group_id>200018</dial_group_id>
 * 		<account_id>99999999</account_id>
 * 		<agent_id>1810</agent_id>
 * 		<destinations>
 * 			<lead aux_data1="" aux_data2="" aux_data3="" aux_data4="" aux_data5="" aux_phone="" campaign_id="51" destination="9548298548" dnis="1112223333" extern_id="amanda" lead_id="2646" lead_state="PENDING" live_answer_msg="" mach_answer_msg="" machine_detect="FALSE" request_key="IQ982008091516241101125" valid_until="2008-09-15 17:24:11">
 * 				<extern_id><![CDATA[9548298548]]></extern_id>
 * 				<first_name><![CDATA[Amanda]]></first_name>
 * 				<mid_name><![CDATA[Amanda]]></mid_name>
 * 				<last_name><![CDATA[Machutta2]]></last_name>
 * 				<address1/>
 * 				<address2/>
 * 				<city/>
 * 				<state/>
 * 				<zip/>
 * 				<aux_greeting/>
 * 				<aux_external_url/>
 * 			</lead>
 * 		</destinations>
 * </dialer_request>
 *
 */
PreviewDialRequest.prototype.processResponse = function(notification) {
    var notif = notification.dialer_request;
    var model = UIModel.getInstance();
    var leads = utils.processResponseCollection(notif, 'destinations', 'lead');
    var formattedResponse = {
        dialGroupId: utils.getText(notif,"dial_group_id"),
        accountId: utils.getText(notif,"account_id"),
        agentId: utils.getText(notif,"agent_id"),
        leads: leads
    };

    if(notif['@callbacks'] === 'TRUE'){
        console.log("AgentLibrary: New CALLBACK packet request rec'd from dialer");
        // clear callbacks??
        //model.callbacks = [];
        for(var l = 0; l < leads.length; l++){
            var lead = leads[l];
            model.callbacks.push(lead);
        }
    }else{
        console.log("AgentLibrary: New PREVIEW-DIAL packet rec'd from dialer");
        model.outboundSettings.previewDialLeads = leads;
    }

    return formattedResponse;
};


var TcpaSafeRequest = function(action, searchFields, requestId) {
    this.agentId = UIModel.getInstance().agentSettings.agentId;
    this.searchFields = searchFields || [];
    this.requestId = requestId || "";
    this.action = action || "";
};

/*
 * searchFields = [
 *  {key: "name", value: "Danielle"},
 *  {key: "number", value: "5555555555"
 * ];
 */
TcpaSafeRequest.prototype.formatJSON = function() {
    var fields = {};
    for(var i =0; i < this.searchFields.length; i++){
        var fieldObj = this.searchFields[i];
        fields[fieldObj.key] = { "#text" : utils.toString(fieldObj.value) };
    }

    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.TCPA_SAFE,
            "@message_id":utils.getMessageId(),
            "@action":this.action,
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "pending_request_id":{
                "#text":utils.toString(this.requestId)
            },
            "search_fields": fields
                // { "name": {"#text": "Danielle"} }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class is responsible for handling TCPA-SAFE packets received
 * from the dialer. It will save a copy of it in the UIModel.
 *
 * <dialer_request message_id="ID2008091513163400220" response_to="" type="TCPA_SAFE" callbacks="TRUE|FALSE">
 * 		<dial_group_id>200018</dial_group_id>
 * 		<account_id>99999999</account_id>
 * 		<agent_id>1810</agent_id>
 * 		<destinations>
 * 			<lead aux_data1="" aux_data2="" aux_data3="" aux_data4="" aux_data5="" aux_phone="" campaign_id="51" destination="9548298548" dnis="1112223333" extern_id="amanda" lead_id="2646" lead_state="PENDING" live_answer_msg="" mach_answer_msg="" machine_detect="FALSE" request_key="IQ982008091516241101125" valid_until="2008-09-15 17:24:11">
 * 				<extern_id><![CDATA[9548298548]]></extern_id>
 * 				<first_name><![CDATA[Amanda]]></first_name>
 * 				<mid_name><![CDATA[Amanda]]></mid_name>
 * 				<last_name><![CDATA[Machutta2]]></last_name>
 * 				<address1/>
 * 				<address2/>
 * 				<city/>
 * 				<state/>
 * 				<zip/>
 * 				<aux_greeting/>
 * 				<aux_external_url/>
 * 			</lead>
 * 		</destinations>
 * </dialer_request>
 *
 */
TcpaSafeRequest.prototype.processResponse = function(notification) {
    var notif = notification.dialer_request;
    var model = UIModel.getInstance();
    var leads = utils.processResponseCollection(notif, 'destinations', 'lead');
    var formattedResponse = {
        dialGroupId: utils.getText(notif,"dial_group_id"),
        accountId: utils.getText(notif,"account_id"),
        agentId: utils.getText(notif,"agent_id"),
        leads: leads
    };

    if(notif['@callbacks'] === 'TRUE'){
        console.log("AgentLibrary: New CALLBACK packet request rec'd from dialer");
        // clear callbacks??
        //model.callbacks = [];
        for(var l = 0; l < leads.length; l++){
            var lead = leads[l];
            model.callbacks.push(lead);
        }
    }else{
        console.log("AgentLibrary: New TCPA_SAFE packet rec'd from dialer");
        model.outboundSettings.tcpaSafeLeads = leads;
    }

    return formattedResponse;
};


var AddSessionNotification = function() {

};

/*
 * This class is responsible for handling "ADD-SESSION" packets from IntelliQueue.  This is used by
 * the CallControlForm. Then it will increment the total_calls count.
 *
 * <ui_notification message_id="IQ982008082918151403727" response_to="" type="ADD-SESSION">
 *     <session_id>2</session_id>
 *     <uii>200808291814560000000900016558</uii>
 *     <phone>200808291814370000000900016555</phone>
 *     <session_type>AGENT</session_type>
 *     <session_label>Primary Agents Call Session</session_label>
 *     <allow_control>TRUE</allow_control>
 *     <monitoring>FALSE</monitoring>
 *     <agent_id>1856</agent_id>
 * </ui_notification>
 */
AddSessionNotification.prototype.processResponse = function(notification) {
    var formattedResponse = utils.buildDefaultResponse(notification);
    var model = UIModel.getInstance();
    var notif = notification.ui_notification;
    var sessionAgentId = utils.getText(notif, "agent_id");

    if(utils.getText(notif, "session_type") === "AGENT"){
        model.incrementTotalCalls();
    }

    if(sessionAgentId === model.agentSettings.agentId){
        // add the session_id of this leg to the current call packet -
        // this way we can use it for hangups later.
        model.currentCall.sessionId = utils.getText(notif, "session_id");

    }else if(sessionAgentId != ""){
        // this is a monitoring session, lets save the monitored agent id for barge-ins
        model.currentCall.monitorAgentId = sessionAgentId;
    }

    // Check to see if we have a transfer leg here, if so, register it
    if(utils.getText(notif, "session_type") === 'OUTBOUND' && sessionAgentId === "" && utils.getText(notif, "allow_control") === true){
        model.transferSessions[utils.getText(notif, "session_id")] = {sessionId:utils.getText(notif, "session_id"),destination:utils.getText(notif, "phone"),uii:utils.getText(notif, "uii")};
    }

    formattedResponse.status = "OK";
    formattedResponse.message = "Received ADD-SESSION notification";
    formattedResponse.sessionId = utils.getText(notif, "session_id");
    formattedResponse.uii = utils.getText(notif, "uii");
    formattedResponse.phone = utils.getText(notif, "phone");
    formattedResponse.sessionType = utils.getText(notif, "session_type");
    formattedResponse.sessionLabel = utils.getText(notif, "session_label");
    formattedResponse.allowControl = utils.getText(notif, "allow_control");
    formattedResponse.monitoring = utils.getText(notif, "monitoring");
    formattedResponse.agentId = utils.getText(notif, "agent_id");

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
    var notif = notification.ui_notification;
    var origLoginType = model.configRequest.loginType;
    var newDgId = utils.getText(notif, "dial_group_id");

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
        dialGroupId: utils.getText(notif, "dial_group_id"),
        dialGroupName: utils.getText(notif, "dialGroupName"), // camel case from server for some reason :/
        dialGroupDesc: utils.getText(notif, "dial_group_desc"),
        agentId: utils.getText(notif, "agent_id")
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
    var notif = notification.ui_notification;
    model.agentSettings.pendingDialGroupChange = parseInt(utils.getText(notif, "dial_group_id"), 10);

    // check if request originated with AdminUI
    if(notif.update_from_adminui){
        model.agentSettings.updateDGFromAdminUI = utils.getText(notif, "update_from_adminui") === true;
    }else{
        model.agentSettings.updateDGFromAdminUI = false;
    }

    var formattedResponse = {
        message: "Dial Group Change Pending notification received.",
        detail: "DialGroup switch for existing session pending until active call ends.",
        agentId: utils.getText(notif, "agent_id"),
        dialGroupId: utils.getText(notif, "dial_group_id"),
        updateFromAdminUI: utils.getText(notif, "update_from_adminui")
    };

    return formattedResponse;
};


var DropSessionNotification = function() {

};

/*
 * This class handles the DROP-SESSION packet from IQ. It doesn't really do anything
 * besides format a response for the callback notification since there isn't any action needed.
 *
  <ui_notification message_id="IQ10012016081613222800341" response_to="" type="DROP-SESSION">
     <session_id>3</session_id>
     <uii>201608161322180139000000000124</uii>
  </ui_notification>
 */
DropSessionNotification.prototype.processResponse = function(notification) {
    var formattedResponse = utils.buildDefaultResponse(notification);
    var notif = notification.ui_notification;

    formattedResponse.message = "Received DROP-SESSION Notification";
    formattedResponse.status = "OK";
    formattedResponse.sessionId = utils.getText(notif, "session_id");
    formattedResponse.uii = utils.getText(notif, "uii");

    return formattedResponse;
};


var EarlyUiiNotification = function() {

};

/*
 * This class is responsible for handling "EARLY_UII" packets from IntelliQueue.
 * For manual outdials, this gives the uii to cancel a ringing line.
 *
 * <ui_notification message_id="IQ10012016081611595000289" type="EARLY_UII">
 *      <agent_id>1180958</agent_id>
 *      <uii>201608161200240139000000000120</uii>
 *  </ui_notification>
 */
EarlyUiiNotification.prototype.processResponse = function(notification) {
    var formattedResponse = utils.buildDefaultResponse(notification);
    var notif = notification.ui_notification;

    formattedResponse.message = "Received EARLY_UII notification";
    formattedResponse.status = "OK";
    formattedResponse.agentId = utils.getText(notif, "agent_id");
    formattedResponse.uii = utils.getText(notif, "uii");

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
    var model = UIModel.getInstance();
    var notif = notification.ui_notification;
    model.endCallNotification = notification;

    // add callDuration, termParty, and termReason to the current call packet
    model.currentCall.duration = utils.getText(notif, "call_duration");
    model.currentCall.termParty = utils.getText(notif, "term_party");
    model.currentCall.termReason = utils.getText(notif, "term_reason");

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
        uii: utils.getText(notif, "uii"),
        sessionId: utils.getText(notif, "session_id"),
        agentId: utils.getText(notif, "agent_id"),
        callDts: utils.getText(notif, "call_dts"),
        duration: model.currentCall.duration,
        termParty: model.currentCall.termParty,
        termReason: model.currentCall.termReason,
        recordingUrl: utils.getText(notif, "recording_url"),
        dispositionTimeout: utils.getText(notif, "disposition_timeout")
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
    var notif = notification.ui_notification;
    var newAssignedGates = [];
    var availableQueues = model.inboundSettings.availableQueues;
    var assignedGateIds = utils.getText(notif, "gate_ids");
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
        agentId: utils.getText(notif, "agent_id"),
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
    formattedResponse.messageCode = utils.getText(notification.ui_notification,"message_code");

    return formattedResponse;
};


var NewCallNotification = function() {

};

/*
 * This class processes a "NEW-CALL" packet received from Intelliqueue. It will determine
 * if the call is a regular or monitoring call:
 * 		@Monitoring==true:  set state to ACTIVE-MONITORING, send NewMonitoringCall event
 * 		@Monitoring==false: set state to ACTIVE, send newcall packet and increment total calls
 *
 *  <ui_notification message_id="IQ982010020911335300027" response_to="" type="NEW-CALL">
 *      <uii>201002091133350139990000000010</uii>
 *      <agent_id>657</agent_id>
 *      <dial_dest>sip:+16789050673@sip.connectfirst.com</dial_dest>
 *      <queue_dts>2010-02-09 11:33:53</queue_dts>
 *      <queue_time>-1</queue_time>
 *      <ani>9548298548</ani>
 *      <dnis/>
 *      <call_type>OUTBOUND</call_type>
 *      <app_url><![CDATA[]]></app_url>
 *      <is_monitoring>FALSE</is_monitoring>
 *      <gate number="17038">
 *          <name>AM Campaign</name>
 *      <description/>
 *      </gate>
 *      <message/>
 *      <survey_id/>
 *      <survey_pop_type>SUPPRESS</survey_pop_type>
 *      <agent_recording default="ON" pause="10">TRUE</agent_recording>
 *      <outdial_dispositions type="CAMPAIGN|GATE">
 *          <disposition disposition_id="20556" contact_forwarding="FALSE">Not Available</disposition>
 *          <disposition disposition_id="20559" contact_forwarding="FALSE">Transfer Not Available</disposition>
 *          <disposition disposition_id="20560" contact_forwarding="FALSE">Transfer Not Available - Ringing (no answer)</disposition>
 *          <disposition disposition_id="20561" contact_forwarding="TRUE">Succesfull Transfer</disposition>
 *          <disposition disposition_id="20562" contact_forwarding="TRUE">High School Senior</disposition>
 *          <disposition disposition_id="20563" contact_forwarding="FALSE">Transfer Not Available - Voicemail</disposition>
 *          <disposition disposition_id="20564" contact_forwarding="FALSE">Transfer Not Available - On Hold Too Long</disposition>
 *          <disposition disposition_id="20565" contact_forwarding="FALSE">Transfer Not Available - Busy</disposition>
 *          <disposition disposition_id="20557" contact_forwarding="FALSE">Not Available</disposition>
 *      </outdial_dispositions>
 *      <baggage allow_updates="TRUE" show_lead_passes="TRUE" show_list_name="TRUE">
 *          <state>OH</state>
 *          <aux_data4/>
 *          <address2/>
 *          <mid_name/>
 *          <extern_id>9548298548</extern_id>
 *          <aux_data1>BMAK</aux_data1>
 *          <aux_external_url/>
 *          <lead_id>64306</lead_id>
 *          <aux_data5/>
 *          <aux_data2>BMAK-041653-934</aux_data2>
 *          <last_name>Taylor</last_name>
 *          <lead_passes>1</lead_passes>
 *          <first_name>Ryant</first_name>
 *          <city>Cleveland</city>
 *          <aux_greeting/>
 *          <address1>8010 Maryland Ave</address1>
 *      <zip>44105</zip>
 *      <aux_data3>Call Ctr 1</aux_data3>
 *      <aux_phone/>
 *      <custom_labels>
 *      <aux_1_label/>
 *      <aux_2_label/>
 *      <aux_3_label/>
 *      <aux_4_label/>
 *      <aux_5_label/>
 *      </custom_labels>
 *      </baggage>
 *      <survey_response response_id="24" survey_id="1775">
 *          <details>
 *              <detail element_id="9001" option_id="0"><![CDATA[Box 1]]></detail>
 *              <detail element_id="9002" option_id="0"><![CDATA[Area 1]]></detail>
 *              <detail element_id="9003" option_id="6439"/>
 *              <detail element_id="9004" option_id="6443"/>
 *              <detail element_id="9004" option_id="6444"/>
 *              <detail element_id="9005" option_id="6447"/>
 *              <detail element_id="9006" option_id="0"><![CDATA[11/20/2013]]></detail>
 *              <detail element_id="9015" option_id="0"><![CDATA[Box 2]]></detail>
 *              <detail element_id="9016" option_id="0"><![CDATA[Area 2]]></detail>
 *              <detail element_id="9017" option_id="6466"/>
 *              <detail element_id="9018" option_id="6471"/>
 *              <detail element_id="9018" option_id="6472"/>
 *              <detail element_id="9019" option_id="6477"/>
 *              <detail element_id="9020" option_id="0"><![CDATA[11/21/2013]]></detail>
 *          </details>
 *      </survey_response>
 *  </ui_notification>
 */
NewCallNotification.prototype.processResponse = function(notification) {
    var model = UIModel.getInstance();
    var notif = notification.ui_notification;

    // set up new call obj
    var newCall = {
        uii: utils.getText(notif,'uii'),
        agentId: utils.getText(notif,'agent_id'),
        dialDest: utils.getText(notif,'dial_dest'),
        queueDts: utils.getText(notif,'queue_dts'),
        queueTime: utils.getText(notif,'queue_time'),
        ani: utils.getText(notif,'ani'),
        dnis: utils.getText(notif,'dnis'),
        callType: utils.getText(notif,'call_type'),
        appUrl: utils.getText(notif,'app_url'),
        isMonitoring: utils.getText(notif,'is_monitoring'),
        allowHold: utils.getText(notif,'allow_hold'),
        allowTransfer: utils.getText(notif,'allow_transfer'),
        allowHangup: utils.getText(notif,'allow_hangup'),
        allowRequeue: utils.getText(notif,'allow_requeue'),
        allowEndCallForEveryone: utils.getText(notif,'allow_endcallforeveryone'),
        surveyId: utils.getText(notif,'survey_id'),
        surveyPopType: utils.getText(notif,'survey_pop_type'),
        requeueType: utils.getText(notif,'requeue_type')
    };

    // set collection values
    newCall.queue = utils.processResponseCollection(notification, 'ui_notification', 'gate')[0];
    newCall.agentRecording = utils.processResponseCollection(notification, 'ui_notification', 'agent_recording', 'agentRecording')[0];
    newCall.outdialDispositions = utils.processResponseCollection(notification, 'ui_notification', 'outdial_dispositions', 'disposition')[0];
    newCall.baggage = utils.processResponseCollection(notification, 'ui_notification', 'baggage')[0];
    newCall.surveyResponse = utils.processResponseCollection(notification, 'ui_notification', 'survey_response', 'detail')[0];
    newCall.transferPhoneBook = utils.processResponseCollection(notification, 'ui_notification', 'transfer_phone_book')[0];

    // convert numbers to boolean where applicable
    newCall.queue.isCampaign = newCall.queue.isCampaign === "1";
    if(newCall.outdialDispositions && newCall.outdialDispositions.type && newCall.outdialDispositions.type.toUpperCase() === "GATE"){
        for(var d = 0; d < newCall.outdialDispositions.dispositions.length; d++) {
            var disp = newCall.outdialDispositions.dispositions[d];
            disp.isComplete = disp.isComplete === "1";
            disp.requireNote = disp.requireNote === "1";
            disp.saveSurvey = disp.saveSurvey === "1";
            disp.xfer = disp.xfer === "1";
        }
    }

    // Build token map
    model.callTokens = buildTokenMap(notif, newCall);

    // Is Monitoring Call?
    if(newCall.isMonitoring){
        model.agentSettings.callState = "ACTIVE-MONITORING";
    }else{
        model.agentSettings.callState = "ACTIVE";

        // check for preloaded transfer number
        if(newCall.baggage && newCall.baggage.auxPhone != ""){
            model.transferNumber = newCall.baggage.auxPhone;
        }
    }

    // Reset the current call counter for Agent Daily Stats
    model.agentDailyStats.currCallTime = 0;

    // todo handle scripting??

    model.currentCall = newCall;

    return newCall;
};


function buildTokenMap(notif, newCall){
    var model = UIModel.getInstance();
    var tokens = {};
    if(isCampaign(newCall.queue)){
        var keyValuePairs = [];
        if (notif.generic_key_value_pairs){
            var keyValuePairsStr = utils.getText(notif, 'generic_key_value_pairs');
            if (keyValuePairsStr.length > 0){
                keyValuePairs = util.parseKeyValuePairsFromString(keyValuePairsStr, "|", "::");
            }
        }

        for(var keyValue in keyValuePairs){
            tokens[keyValue] = keyValuePairs[keyValue];
        }
    }

    tokens["ani"] = newCall.ani;
    tokens["dnis"] = newCall.dnis;
    tokens["uii"] = newCall.uii;

    try{
        if(newCall.queue.number){
            tokens["source_id"] = newCall.number || "";
            tokens["source_name"] = newCall.name || "";
            tokens["source_desc"] = newCall.description || "";

            if(newCall.queue.isCampaign === "0"){
                tokens["source_type"] = "INBOUND";
            }else{
                tokens["source_type"] = "OUTBOUND";
            }
        }else{
            tokens["source_id"] = "0";
            tokens["source_type"] = "MANUAL";
            tokens["source_name"] = "";
            tokens["source_desc"] = "";
        }
    }catch(any){
        console.error("There was an error processing source tokenization", + any);
    }

    try{
        tokens["agent_first_name"] = model.agentSettings.firstName;
        tokens["agent_last_name"] = model.agentSettings.lastName;
        tokens["agent_external_id"] = model.agentSettings.externalAgentId;
        tokens["agent_extern_id"] = model.agentSettings.externalAgentId;
        tokens["agent_type"] = model.agentSettings.agentType;
    }catch(any){
        console.error("There was an error parsing tokens for agent info. ", any);
    }

    if(notif.baggage){
        try{
            tokens["lead_id"] = newCall.baggage.leadId || "";
            tokens["extern_id"] = newCall.baggage.externId || "";
            tokens["first_name"] = newCall.baggage.firstName || "";
            tokens["mid_name"] = newCall.baggage.midName || "";
            tokens["last_name"] = newCall.baggage.lastName || "";
            tokens["address1"] = newCall.baggage.address1 || "";
            tokens["address2"] = newCall.baggage.address2 || "";
            tokens["suffix"] = newCall.baggage.suffix || "";
            tokens["title"] = newCall.baggage.title || "";
            tokens["city"] = newCall.baggage.city || "";
            tokens["state"] = newCall.baggage.state || "";
            tokens["zip"] = newCall.baggage.zip || "";
            tokens["aux_data1"] = newCall.baggage.auxData1 || "";
            tokens["aux_data2"] = newCall.baggage.auxData2 || "";
            tokens["aux_data3"] = newCall.baggage.auxData3 || "";
            tokens["aux_data4"] = newCall.baggage.auxData4 || "";
            tokens["aux_data5"] = newCall.baggage.auxData5 || "";
            tokens["aux_phone"] = newCall.baggage.auxPhone || "";
            tokens["email"] = newCall.baggage.email || "";
            tokens["gate_keeper"] = newCall.baggage.gateKeeper || "";

        }catch(any){
            console.error("There was an error parsing baggage tokens. ", any);
        }
    }else{
        tokens["lead_id"] = "";
        tokens["extern_id"] = "";
        tokens["first_name"] = "";
        tokens["mid_name"] = "";
        tokens["last_name"] = "";
        tokens["address1"] = "";
        tokens["address2"] = "";
        tokens["suffix"] = "";
        tokens["title"] = "";
        tokens["city"] = "";
        tokens["state"] = "";
        tokens["zip"] = "";
        tokens["aux_data1"] = "";
        tokens["aux_data2"] = "";
        tokens["aux_data3"] = "";
        tokens["aux_data4"] = "";
        tokens["aux_data5"] = "";
        tokens["aux_phone"] = "";
        tokens["email"] = "";
        tokens["gate_keeper"] = "";
    }

    return tokens;
}


function isCampaign(gate){
    if (gate && gate.isCampaign){
        return gate.isCampaign === "1";
    }
    return false;
}
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
            callNotesRequest : null,
            callbacksPendingRequest : null,
            campaignDispositionsRequest : null,
            configRequest : null,
            dispositionRequest : null,
            dispositionManualPassRequest : null,
            hangupRequest : null,
            logoutRequest : null,
            loginRequest : null,                // Original LoginRequest sent to IS - used for reconnects
            offhookInitRequest : null,
            offhookTermRequest : null,
            oneToOneOutdialRequest : null,
            oneToOneOutdialCancelRequest : null,
            previewDialRequest : null,
            tcpaSafeRequest : null,

            // response packets
            agentStatePacket : null,
            configPacket : null,
            currentCallPacket : null,
            loginPacket : null,
            offhookInitPacket : null,
            offhookTermPacket : null,
            transferSessions: {},

            // notification packets
            addSessionNotification: new AddSessionNotification(),
            dialGroupChangeNotification : new DialGroupChangeNotification(),
            dialGroupChangePendingNotification : new DialGroupChangePendingNotification(),
            dropSessionNotification: new DropSessionNotification(),
            earlyUiiNotification: new EarlyUiiNotification(),
            endCallNotification : new EndCallNotification(),
            gatesChangeNotification : new GatesChangeNotification(),
            genericNotification : new GenericNotification(),
            newCallNotification: new NewCallNotification(),

            // application state
            applicationSettings : {
                availableCountries : [],
                isLoggedInIS : false,               // a check for whether or not user is logged in with IntelliServices
                socketConnected : false,
                socketDest : "",
                isTcpaSafeMode : false              // Comes in at the account-level - will get set to true if this interface should be in tcpa-safe-mode only.
            },

            currentCall: {},                        // save the NEW-CALL notification in parsed form
            callTokens:{},                          // Stores a map of all tokens for a call
            callbacks:[],

            agentDailyStats: {
                loginTime: 0,
                offhookTime: 0,
                talkTime: 0,
                currCallTime: 0
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
                totalCalls : 0,                     // Call counter that is incremented every time a new session is received
                transferNumber : "",                // May be pre-populated by an external interface, if so, the transfer functionality uses it
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
                outdialGroup : {},                  // dial group agent is signed into
                previewDialLeads : [],              // list of leads returned from preview dial request
                tcpaSafeLeads : [],                 // list of leads returned from tcpa safe request
                campaignDispositions : []           // list of campaign dispositions for specific campaign
            },

            surveySettings : {
                availableSurveys : []
            },


            // Public methods
            incrementTotalCalls: function() {
                this.agentSettings.totalCalls = this.agentSettings.totalCalls + 1;
            }

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
            case MESSAGE_TYPES.AGENT_STATE:
                if(UIModel.getInstance().agentStateRequest === null){
                    UIModel.getInstance().agentStateRequest = new AgentStateRequest(response.ui_response.current_state["#text"], response.ui_response.agent_aux_state['#text']);
                }
                var stateChangeResposne = UIModel.getInstance().agentStateRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.AGENT_STATE, stateChangeResposne);
                break;
            case MESSAGE_TYPES.CAMPAIGN_DISPOSITIONS:
                var campaignDispsResposne = UIModel.getInstance().campaignDispositionsRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.CAMPAIGN_DISPOSITIONS, campaignDispsResposne);
                break;
            case MESSAGE_TYPES.CALL_NOTES:
                var callNotes = UIModel.getInstance().callNotesRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.CALL_NOTES, callNotes);
                break;
            case MESSAGE_TYPES.CALLBACK_PENDING:
                var pendingCallbacks = UIModel.getInstance().callbacksPendingRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.CALLBACK_PENDING, pendingCallbacks);
                break;
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
            case MESSAGE_TYPES.OFFHOOK_INIT:
                var initResponse = UIModel.getInstance().offhookInitRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.OFFHOOK_INIT, initResponse);
                break;

        }

    },

    processNotification: function(instance, data){
        var type = data.ui_notification['@type'];
        var messageId = data.ui_notification['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        console.log("AgentLibrary: received notification: (" + dest + ") " + type.toUpperCase());

        switch (type.toUpperCase()){
            case MESSAGE_TYPES.ADD_SESSION:
                var addSesNotif = new AddSessionNotification();
                var addResponse = addSesNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.ADD_SESSION, addResponse);
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
            case MESSAGE_TYPES.DROP_SESSION:
                var dropSesNotif = new DropSessionNotification(instance);
                var dropSesResponse = dropSesNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.DROP_SESSION, dropSesResponse);
                break;
            case MESSAGE_TYPES.EARLY_UII:
                var earlyUiiNotif = new EarlyUiiNotification(instance);
                var earlyUiiResponse = earlyUiiNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.EARLY_UII, earlyUiiResponse);
                break;
            case MESSAGE_TYPES.END_CALL:
                var endCallNotif = new EndCallNotification(instance);
                var endCallResponse = endCallNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.END_CALL, endCallResponse);
                break;
            case MESSAGE_TYPES.GATES_CHANGE:
                var gateChangeNotif = new GatesChangeNotification();
                var gateChangeResponse = gateChangeNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.GATES_CHANGE, gateChangeResponse);
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
            case MESSAGE_TYPES.NEW_CALL:
                var newCallNotif = new NewCallNotification(instance);
                var newCallResponse = newCallNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.NEW_CALL, newCallResponse);
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

    processDialerResponse: function(instance, response)
    {
        var type = response.dialer_request['@type'];
        var messageId = response.dialer_request['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        console.log("AgentLibrary: received response: (" + dest + ") " + type.toUpperCase());

        // Send generic on message response
        utils.fireCallback(instance, CALLBACK_TYPES.ON_MESSAGE, response);

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.PREVIEW_DIAL_ID:
                var dialResponse = UIModel.getInstance().previewDialRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.PREVIEW_DIAL, dialResponse);
                break;
            case MESSAGE_TYPES.TCPA_SAFE_ID:
                var tcpaResponse = UIModel.getInstance().tcpaSafeRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.TCPA_SAFE, tcpaResponse);
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
     *
     *   OR
     *
     *   "outdial_dispositions": {
     *       "@type": "GATE",
     *       "disposition": [
     *          {
     *           "@contact_forwarding": "false",
     *           "@disposition_id": "926",
     *           "@is_complete": "1",
     *           "@require_note": "0",
     *           "@save_survey": "1",
     *           "@xfer": "0",
     *           "#text": "One B"
     *          }
     *      ]
     *   }
     */

    processResponseCollection: function(response, groupProp, itemProp, textName){
        var items = [];
        var item = {};
        var itemsRaw = [];
        var textName = textName || "text";

        if(response[groupProp] && typeof response[groupProp][itemProp] !== 'undefined'){
            itemsRaw = response[groupProp][itemProp];
        }

        if(Array.isArray(itemsRaw)) {
            // multiple items
            for (var i = 0; i < itemsRaw.length; i++) {
                var formattedKey = "";
                for(var key in itemsRaw[i]){
                    if(key.match(/^#/)){
                        // dealing with text property
                        formattedKey = textName;
                    }else{
                        // dealing with attribute
                        formattedKey = key.replace(/@/, ''); // remove leading '@'
                        formattedKey = formattedKey.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); }); // convert to camelCase
                    }

                    if(typeof itemsRaw[i][key] === "object"){
                        // check for #text element
                        if(itemsRaw[i][key]['#text']) {
                            item[formattedKey] = itemsRaw[i][key]['#text'];
                        }else if(Object.keys(itemsRaw[i][key]).length === 0){
                            // dealing with empty property
                            item[formattedKey] = "";
                        }else {
                            // make recursive call
                            if(Array.isArray(itemsRaw[key])){
                                var newIt = [];
                                newIt = utils.processResponseCollection(response[groupProp], itemProp, key, textName);
                                item[formattedKey + 's'] = newIt;
                            }else{
                                var newItemProp = Object.keys(itemsRaw[i][key])[0];
                                var newItems = [];
                                newItems = utils.processResponseCollection(itemsRaw[i], key, newItemProp);
                                item[formattedKey] = newItems;
                            }
                        }
                    }else{
                        // can't convert 0 | 1 to boolean since some are counters
                        if(itemsRaw[i][key].toUpperCase() === "TRUE"){
                            item[formattedKey] = true;
                        }else if(itemsRaw[i][key].toUpperCase() === "FALSE"){
                            item[formattedKey] = false;
                        }else{
                            item[formattedKey] = itemsRaw[i][key];
                        }
                    }
                }

                items.push(item);
                item = {};
            }
        }else{
            // single item
            var formattedProp = "";
            for(var prop in itemsRaw){
                if(prop.match(/^#/)) {
                    // dealing with text property
                    formattedProp = textName;
                }else{
                    // dealing with attribute
                    formattedProp = prop.replace(/@/, ''); // remove leading '@'
                    formattedProp = formattedProp.replace(/_([a-z])/g, function (g) {
                        return g[1].toUpperCase();
                    }); // convert to camelCase
                }

                if(typeof itemsRaw[prop] === "object"){
                    if(itemsRaw[prop]['#text']) {
                        // dealing with #text element
                        item[formattedProp] = itemsRaw[prop]['#text'];
                    }else if(Object.keys(itemsRaw[prop]).length === 0){
                        // dealing with empty property
                        item[formattedProp] = "";
                    }else{
                        // make recursive call
                        if(Array.isArray(itemsRaw[prop])){
                            var newIt = [];
                            newIt = utils.processResponseCollection(response[groupProp], itemProp, prop, textName);
                            item[formattedProp + 's'] = newIt;
                        }else {
                            var newProp = Object.keys(itemsRaw[prop])[0];
                            var newItms = [];
                            newItms = utils.processResponseCollection(itemsRaw, prop, newProp);
                            item[formattedProp] = newItms;
                        }
                    }
                }else{
                    // can't convert 0 | 1 to boolean since some are counters
                    if(itemsRaw[prop].toUpperCase() === "TRUE"){
                        item[formattedProp] = true;
                    }else if(itemsRaw[prop].toUpperCase() === "FALSE"){
                        item[formattedProp] = false;
                    }else {
                        item[formattedProp] = itemsRaw[prop];
                    }
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
    },

    // safely check if property exists and return empty string
    // instead of undefined if it doesn't exist
    // convert "TRUE" | "FALSE" to boolean
    getText: function(obj,prop){
        var o = obj[prop];
        if(o){
            if(o['#text']){
                if(o['#text'].toUpperCase() === "TRUE"){
                    return true;
                }else if(o['#text'].toUpperCase() === "FALSE"){
                    return false;
                }else{
                    return o['#text'] || "";
                }
            }else{
                return "";
            }
        }else{
            return "";
        }
    },

    /**
     * Parses a string of key value pairs and returns an Array of KeyValue objects.
     *
     * @param str The string of keyvalue pairs to parse
     * @param outerDelimiter The delimiter that separates each keyValue pair
     * @param innerDelimiter The delimiter that separates each key from its value
     */
    parseKeyValuePairsFromString: function(str, outerDelimiter, innerDelimiter){
    if (!str){
        return [];
    }
    var arr = [];
    var keyValuesPairs = str.split(outerDelimiter);
    for (var p = 0; p < keyValuesPairs.length; p++){
        var keyValuePair = keyValuesPairs[p];
        var pair = keyValuePair.split(innerDelimiter);
        var keyValue = {};
        keyValue[pair[0]] = pair[1];
        arr.push(keyValue);
    }

    return arr;
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
    "ADD_SESSION":"addSessionResponse",
    "AGENT_STATE":"agentStateResponse",
    "CLOSE_SOCKET":"closeResponse",
    "CONFIG":"configureResponse",
    "CALL_NOTES":"callNotesResponse",
    "CALLBACK_PENDING":"callbacksPendingResponse",
    "CALLBACK_CANCEL":"callbackCancelResponse",
    "CAMPAIGN_DISPOSITIONS":"campaignDispositionsResponse",
    "DIAL_GROUP_CHANGE":"dialGroupChangeNotification",
    "DIAL_GROUP_CHANGE_PENDING":"dialGroupChangePendingNotification",
    "DROP_SESSION":"dropSessionNotification",
    "EARLY_UII":"earlyUiiNotification",
    "END_CALL":"endCallNotification",
    "GATES_CHANGE":"gatesChangeNotification",
    "GENERIC_NOTIFICATION":"genericNotification",
    "GENERIC_RESPONSE":"genericResponse",
    "LOGIN":"loginResponse",
    "NEW_CALL":"newCallNotification",
    "OFFHOOK_INIT":"offhookInitResponse",
    "OFFHOOK_TERM":"offhookTermResponse",
    "OPEN_SOCKET":"openResponse",
    "PREVIEW_DIAL":"previewDialResponse",
    "TCPA_SAFE":"tcpaSafeResponse"
};

const MESSAGE_TYPES = {
    "ADD_SESSION":"ADD-SESSION",
    "LOGIN":"LOGIN",
    "LOGOUT":"LOGOUT",
    "AGENT_STATE":"AGENT-STATE",
    "CALL_NOTES":"CALL-NOTES",
    "CALLBACK_PENDING":"PENDING-CALLBACKS",
    "CALLBACK_CANCEL":"CANCEL-CALLBACK",
    "CAMPAIGN_DISPOSITIONS":"CAMPAIGN-DISPOSITIONS",
    "EARLY_UII":"EARLY_UII",
    "END_CALL":"END-CALL",
    "DIAL_GROUP_CHANGE":"DIAL_GROUP_CHANGE",
    "DIAL_GROUP_CHANGE_PENDING":"DIAL_GROUP_CHANGE_PENDING",
    "DROP_SESSION":"DROP-SESSION",
    "GATES_CHANGE":"GATES_CHANGE",
    "GENERIC":"GENERIC",
    "HANGUP":"HANGUP",
    "INBOUND_DISPOSITION":"INBOUND-DISPOSITION",
    "NEW_CALL":"NEW-CALL",
    "OFFHOOK_INIT":"OFF-HOOK-INIT",
    "OFFHOOK_TERM":"OFF-HOOK-TERM",
    "ON_MESSAGE":"ON-MESSAGE",
    "ONE_TO_ONE_OUTDIAL":"ONE-TO-ONE-OUTDIAL",
    "ONE_TO_ONE_OUTDIAL_CANCEL":"ONE-TO-ONE-OUTDIAL-CANCEL",
    "OUTDIAL_DISPOSITION":"OUTDIAL-DISPOSITION",
    "PREVIEW_DIAL":"PREVIEW-DIAL",
    "PREVIEW_DIAL_ID":"PREVIEW_DIAL",
    "TCPA_SAFE":"TCPA-SAFE",
    "TCPA_SAFE_ID":"TCPA_SAFE"
};


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

    ////////////////////////////
    // requests and responses //
    ////////////////////////////
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
     * Get latest Agent Daily Stats object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentDailyStats = function() {
        return UIModel.getInstance().agentDailyStats;
    };
    /**
     * Get latest Call Tokens object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCallTokens = function() {
        return UIModel.getInstance().callTokens;
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
     * Get latest outgoing Hangup Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getHangupRequest = function() {
        return UIModel.getInstance().hangupRequest;
    };
    /**
     * Get latest outgoing Preview Dial Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getPreviewDialRequest = function() {
        return UIModel.getInstance().previewDialRequest;
    };
    /**
     * Get latest TCPA Safe Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getTcpaSafeRequest = function() {
        return UIModel.getInstance().tcpaSafeRequest;
    };
    /**
     * Get latest Manual Outdial Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getManualOutdialRequest = function() {
        return UIModel.getInstance().oneToOneOutdialRequest;
    };
    /**
     * Get latest Manual Outdial Cancel Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getManualOutdialCancelRequest = function() {
        return UIModel.getInstance().oneToOneOutdialCancelRequest;
    };
    /**
     * Get latest Call Notes Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCallNotesRequest = function() {
        return UIModel.getInstance().callNotesRequest;
    };
    /**
     * Get latest Campaign Dispositions Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCampaignDispositionsRequest = function() {
        return UIModel.getInstance().campaignDispositionsRequest;
    };
    /**
     * Get latest Disposition Call Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getDispositionRequest = function() {
        return UIModel.getInstance().dispositionRequest;
    };
    /**
     * Get latest Disposition Manual Pass Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getDispositionManualPassRequest = function() {
        return UIModel.getInstance().dispositionManualPassRequest;
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

    ///////////////////
    // notifications //
    ///////////////////
    /**
     * Get Dial Group Change notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getDialGroupChangeNotification = function() {
        return UIModel.getInstance().dialGroupChangeNotification;
    };
    /**
     * Get Dial Group Change Pending notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getDialGroupChangePendingNotification = function() {
        return UIModel.getInstance().dialGroupChangePendingNotification;
    };
    /**
     * Get End Call notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getEndCallNotification = function() {
        return UIModel.getInstance().endCallNotification;
    };
    /**
     * Get Gates Change notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getGatesChangeNotification = function() {
        return UIModel.getInstance().gatesChangeNotification;
    };
    /**
     * Get Generic notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getGenericNotification = function() {
        return UIModel.getInstance().genericNotification;
    };
    /**
     * Get New Call notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getNewCallNotification = function() {
        return UIModel.getInstance().newCallNotification;
    };
    /**
     * Get current call object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCurrentCall = function() {
        return UIModel.getInstance().currentCall;
    };
    /**
     * Get Add Session notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAddSessionNotification = function() {
        return UIModel.getInstance().addSessionNotification;
    };
    /**
     * Get Drop Session notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getDropSessionNotification = function() {
        return UIModel.getInstance().dropSessionNotification;
    };
    /**
     * Get Early UII notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getEarlyUiiNotification = function() {
        return UIModel.getInstance().earlyUiiNotification;
    };


    //////////////////////
    // settings objects //
    //////////////////////
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
                }else if(data.dialer_request){
                    utils.processDialerResponse(instance, data);
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

function initAgentLibraryCall (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Sends a manual outdial request message
     * @memberof AgentLibrary
     * @param {string} destination Number to call - ANI
     * @param {number} [ringTime=60] Time in seconds to ring call
     * @param {number} callerId Number displayed to callee, DNIS
     * @param {string} [countryId='USA'] Country for the destination number
     * @param {number} [queueId=''] Queue id to tie manual call to
     */
    AgentLibrary.prototype.manualOutdial = function(destination, ringTime, callerId, countryId, queueId){
        UIModel.getInstance().oneToOneOutdialRequest = new OneToOneOutdialRequest(destination, ringTime, callerId, countryId, queueId);
        var msg = UIModel.getInstance().oneToOneOutdialRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a manual outdial request message
     * @memberof AgentLibrary
     * @param {string} destination Number to call - ANI
     * @param {number} [ringTime=60] Time in seconds to ring call
     * @param {number} callerId Number displayed to callee, DNIS
     * @param {string} [countryId='USA'] Country for the destination number
     * @param {number} [queueId=''] Queue id to tie manual call to
     */
    AgentLibrary.prototype.manualOutdialCancel = function(uii){
        UIModel.getInstance().oneToOneOutdialCancelRequest = new OneToOneOutdialCancelRequest(uii);
        var msg = UIModel.getInstance().oneToOneOutdialCancelRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a hangup request message
     * @memberof AgentLibrary
     * @param {string} [sessionId=""] Session to hangup, defaults to current call session id
     */
    AgentLibrary.prototype.hangup = function(sessionId){
        UIModel.getInstance().hangupRequest = new HangupRequest(sessionId);
        var msg = UIModel.getInstance().hangupRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a preview dial request message
     * @memberof AgentLibrary
     * @param {string} [action=""] Action to take
     * @param {array} [searchFields=[]] Array of objects with key/value pairs for search parameters
     * e.g. [ {key: "name", value: "Geoff"} ]
     * @param {number} [requestId=""] Number displayed to callee, DNIS
     */
    AgentLibrary.prototype.previewDial = function(action, searchFields, requestId){
        UIModel.getInstance().previewDialRequest = new PreviewDialRequest(action, searchFields, requestId);
        var msg = UIModel.getInstance().previewDialRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a TCPA Safe call request message
     * @memberof AgentLibrary
     * @param {string} [action=""] Action to take
     * @param {array} [searchFields=[]] Array of objects with key/value pairs for search parameters
     * e.g. [ {key: "name", value: "Geoff"} ]
     * @param {number} [requestId=""] Number displayed to callee, DNIS
     */
    AgentLibrary.prototype.tcpaSafeCall = function(action, searchFields, requestId){
        UIModel.getInstance().tcpaSafeRequest = new TcpaSafeRequest(action, searchFields, requestId);
        var msg = UIModel.getInstance().tcpaSafeRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Get a list of all campaign dispositions for given campaign id
     * @memberof AgentLibrary
     * @param {string} campaignId Id for campaign to get dispositions for
     * @param {function} [callback=null] Callback function when campaign dispositions response received
     */
    AgentLibrary.prototype.getCampaignDispositions = function(campaignId, callback){
        UIModel.getInstance().campaignDispositionsRequest = new CampaignDispositionsRequest(campaignId);
        var msg = UIModel.getInstance().campaignDispositionsRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CAMPAIGN_DISPOSITIONS, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Send a disposition for an inbound or outbound call
     * @memberof AgentLibrary
     * @param {string} uii UII (unique id) for call
     * @param {string} dispId The disposition id
     * @param {string} notes Agent notes for call
     * @param {boolean} callback Boolean for whether or not this call is a callback
     * @param {string} [callbackDTS=""] date time stamp if callback
     * @param {string} [contactForwardNumber=null] Number for contact forwarding
     * @param {string} [survey=null] The survey response values for the call.
     * Format: survey = [ { label: "", externId: "", leadUpdateColumn: ""} ]
     */
    AgentLibrary.prototype.dispositionCall = function(uii, dispId, notes, callback, callbackDTS, contactForwardNumber, survey){
        UIModel.getInstance().dispositionRequest = new DispositionRequest(uii, dispId, notes, callback, callbackDTS, contactForwardNumber, survey);
        var msg = UIModel.getInstance().dispositionRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Send a disposition for a manual pass on a lead
     * @memberof AgentLibrary
     * @param {string} dispId The disposition id
     * @param {string} notes Agent notes for call
     * @param {boolean} callback Boolean for whether or not this call is a callback
     * @param {string} [callbackDTS=""] date time stamp if callback
     * @param {string} [leadId=null] The lead id (for outbound dispositions)
     * @param {string} [requestKey=null] The request key for the lead (if manual pass disposition)
     * @param {string} [externId=null] The external id of the lead (outbound)
     */
    AgentLibrary.prototype.dispositionManualPass = function(dispId, notes, callback, callbackDTS, leadId, requestKey, externId){
        UIModel.getInstance().dispositionManualPassRequest = new DispositionManualPassRequest(dispId, notes, callback, callbackDTS, leadId, requestKey, externId);
        var msg = UIModel.getInstance().dispositionManualPassRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Set agent notes for a call
     * @memberof AgentLibrary
     * @param {string} notes Agent notes to add to call
     * @param {function} [callback=null] Callback function when call notes response received
     */
    AgentLibrary.prototype.setCallNotes = function(notes, callback){
        UIModel.getInstance().callNotesRequest = new CallNotesRequest(notes);
        var msg = UIModel.getInstance().callNotesRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CALL_NOTES, callback);
        utils.sendMessage(this, msg);
    };

}

var initAgentLibrary = function (context) {

    initAgentLibraryCore(context);
    initAgentLibrarySocket(context);
    initAgentLibraryAgent(context);
    initAgentLibraryCall(context);

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
