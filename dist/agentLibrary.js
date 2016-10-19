/*! cf-agent-library - v0.0.0 - 2016-10-19 - Connect First */
/**
 * @fileOverview Exposed functionality for Connect First AgentUI.
 * @author <a href="mailto:dlbooks@connectfirst.com">Danielle Lamb-Books </a>
 * @version 0.0.1
 * @namespace AgentLibrary
 */

;(function (global) {

var AddSessionNotification = function() {

};

/*
 * This class is responsible for handling "ADD-SESSION" packets from IntelliQueue.  This is used by
 * the CallControlForm. Then it will increment the total_calls count.
 *
 * {
 *   "ui_notification": {
 *       "@message_id": "IQ982008082918151403727",
 *       "@response_to": "",
 *       "@type": "ADD-SESSION",
 *       "session_id": { "#text": "2" },
 *       "uii": { "#text": "200808291814560000000900016558" },
 *       "phone": { "#text": "200808291814370000000900016555" },
 *       "session_type": { "#text": "AGENT" },
 *       "session_label": { "#text": "Primary Agents Call Session" },
 *       "allow_control": { "#text": "TRUE" },
 *       "monitoring": { "#text": "FALSE" },
 *       "agent_id": { "#text": "1856" }
 *   }
 *  }
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

    // if agent session, set on call status
    if(notif.session_id === '2'){
        model.agentSettings.onCall = true;
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
 *   {
 *       "ui_notification": {
 *           "@message_id": "IQ10012016080413085500263",
 *           "@type": "DIAL_GROUP_CHANGE",
 *           "agent_id": { "#text": "1180958" },
 *           "dial_group_id": { "#text": "50354" },
 *           "dialGroupName": { "#text": "Preview Dial Mode" },
 *           "dial_group_desc": {}
 *       }
 *   }
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
 * {
 *     "ui_notification": {
 *         "@message_id": "IQ10012016080515294800318",
 *         "@type": "DIAL_GROUP_CHANGE_PENDING",
 *         "agent_id": { "#text": "1180958" },
 *         "dial_group_id": { "#text": "50354" },
 *         "update_from_adminui": { "#text": "TRUE" }
 *     }
 * }
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
 *  {
 *      "ui_notification": {
 *          "@message_id":"IQ10012016081613222800341",
 *          "@response_to":"",
 *          "@type":"DROP-SESSION",
 *          "session_id":{"#text":"3"},
 *          "uii":{"#text":"201608161322180139000000000124"}
 *      }
 *  }
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
 *  {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016081611595000289",
 *          "@type":"EARLY_UII",
 *          "agent_id":{"#text":"1180958"},
 *          "uii":{"#text":"201608161200240139000000000120"}
 *      }
 *  }
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
 * {
 *  "ui_notification":{
 *      "@message_id":"IQ982008082910362203349",
 *      "@response_to":"",
 *      "@type":"END-CALL",
 *      "agent_id":{"#text":"1856"},
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "session_id":{"#text":"2"},
 *      "call_dts":{"#text":"2008-08-29 10:36:04"},
 *      "call_duration":{"#text":"16"},
 *      "term_party":{"#text":"CALLER"},
 *      "term_reason":{},
 *      "recording_url":{},
 *      "disposition_timeout:{"#text":"60"}
 *  }
 * }
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
    model.agentSettings.onCall = false;
    model.agentSettings.onManualOutdial = false;

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
 * {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016080817344100936",
 *          "@type":"GATES_CHANGE",
 *          "agent_id":{"#text":"1180958"},
 *          "gate_ids":{"#text":"11117,3"}
 *      }
 * }
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
 * {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016080317400400011",
 *          "@response_to":"1c2fe39f-a31e-aff8-8d23-92a61c88270f",
 *          "@type":"GENERIC",
 *          "message_code":{"#text":"0"},
 *          "message":{"#text":"OK"},
 *          "detail":{"#text":"Pending Callback Successfully Cancelled."}
 *      }
 * }
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
 *  {"ui_notification":{
 *      "@message_id":"IQ982010020911335300027",
 *      "@response_to":"",
 *      "@type":"NEW-CALL",
 *      "uii":{"#text":"201002091133350139990000000010"},
 *      "agent_id":{"#text":"657"},
 *      "dial_dest":{"#text":"sip:+16789050673@sip.connectfirst.com"},
 *      "queue_dts":{"#text":"2010-02-09 11:33:53"},
 *      "queue_time":{"#text":"-1"},
 *      "ani":{"#text":"9548298548"},
 *      "dnis":{},
 *      "call_type":{"#text":"OUTBOUND"},
 *      "app_url":{},
 *      "is_monitoring":{"#text":"FALSE"},
 *      "gate":{
 *          "@number":"17038",
 *          "name":{"#text":"AM Campaign"},
 *          "description":{}
 *      },
 *      "message":{},
 *      "survey_id":{},
 *      "survey_pop_type":{"#text":"SUPPRESS"},
 *      "agent_recording":{"@default":"ON","@pause":"10","#text":"TRUE"},
 *      "outdial_dispositions":{
 *          "@type":"CAMPAIGN|GATE",
 *          "disposition":[
 *              { "@contact_forwarding":"FALSE", "@disposition_id":"20556", "#text":"Not Available"},
 *              { "@contact_forwarding":"FALSE", "@disposition_id":"20559", "#text":"Transfer Not Available"}
 *          ]
 *      },
 *      "baggage":{
 *          "@allow_updates":"TRUE",
 *          "@show_lead_passes":"TRUE",
 *          "@show_list_name":"TRUE",
 *          "state":{"#text":"OH"},
 *          "aux_data4":{},
 *          "address2":{},
 *          "mid_name":{},
 *          "extern_id":{"#text":"9548298548"},
 *          "aux_data1":{"#text":"BMAK"},
 *          "aux_external_url":{},
 *          "lead_id":{"#text":"64306"},
 *          "aux_data5":{},
 *          "aux_data2":{"#text":"BMAK-041653-934"},
 *          "last_name":{"#text":"Taylor"},
 *          "lead_passes":{"#text":"1"},
 *          "first_name":{"#text":"Ryant"},
 *          "city":{"#text":"Cleveland"},
 *          "aux_greeting":{},
 *          "address1":{"#text":"8010 Maryland Ave"},
 *          "zip":{"#text":"44105"},
 *          "aux_data3":{"#text":"Call Ctr 1"},
 *          "aux_phone":{},
 *          "custom_labels":{
 *              "aux_1_label":{},
 *              "aux_2_label":{},
 *              "aux_3_label":{},
 *              "aux_4_label":{},
 *              "aux_5_label":{}
 *          }
 *      },
 *      "survey_response":{
 *          "@response_id":"24",
 *          "@survey_id":"1775",
 *          "details":{
 *              "detail":[
 *                  {"@element_id":"9001","@option_id":"0","#text":"Box 1"},
 *                  {"@element_id":"9002","@option_id":"0","#text":"Area 1"},
 *                  {"@element_id":"9003","@option_id":"6439"},
 *                  {"@element_id":"9004","@option_id":"6443"},
 *                  {"@element_id":"9004","@option_id":"6444"},
 *                  {"@element_id":"9005","@option_id":"6447"},
 *                  {"@element_id":"9006","@option_id":"0","#text":"11/20/2013"},
 *                  {"@element_id":"9015","@option_id":"0","#text":"Box 2"},
 *                  {"@element_id":"9016","@option_id":"0","#text":"Area 2"},
 *                  {"@element_id":"9017","@option_id":"6466"},
 *                  {"@element_id":"9018","@option_id":"6471"},
 *                  {"@element_id":"9018","@option_id":"6472"},
 *                  {"@element_id":"9019","@option_id":"6477"},
 *                  {"@element_id":"9020","@option_id":"0","#text":"11/21/2013"}
 *             ]
 *          }
 *      }
 *    }
 *  }
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

    // if only one disposition, convert to array
    if(newCall.outdialDispositions && newCall.outdialDispositions.disposition){
        newCall.outdialDispositions.dispositions = [newCall.outdialDispositions]
    }

    // convert numbers to boolean where applicable
    newCall.queue.isCampaign = newCall.queue.isCampaign === "1";
    if(newCall.outdialDispositions && newCall.outdialDispositions.dispositions){
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

    // start ping call interval timer, sends message every 30 seconds
    // if this is not a manual outdial and we are not suppressing disposition pop
    if(newCall.outdialDispositions && newCall.outdialDispositions.dispositions && newCall.outdialDispositions.dispositions.length > 0 && newCall.surveyPopType !== "SUPPRESS"){
        UIModel.getInstance().pingIntervalId = setInterval(utils.sendPingCallMessage, 30000);
    }

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


var PendingDispNotification = function() {

};

/*
 * This class is responsible for handling a generic notification
 *
 * {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016080317400400011",
 *          "@type":"PENDING_DISP",
 *          "agent_id":{"#text":"3"},
 *          "status":{"#text":"false"}
 *      }
 * }
 */
PendingDispNotification.prototype.processResponse = function(notification) {
    var formattedResponse = {};
    formattedResponse.agentId = utils.getText(notification.ui_notification,"agent_id");
    formattedResponse.status = utils.getText(notification.ui_notification,"status");

    return formattedResponse;
};


var PreviewLeadStateNotification = function() {

};

/*
 * This class is responsible for handling a generic notification
 *
 * {
 *      "ui_notification":{
 *          "@type":"PREVIEW-LEAD-STATE",
 *          "@call_type":"MANUAL|PREVIEW",
 *          "@message_id":"IQ10012016092715393600184",
 *          "request_id":{"#text":"IQ10012016092715390900179"},
 *          "lead_state":{"#text":"ANSWER"},
 *          "callback":{"#text":"FALSE"}
 *      }
 *   }
 * }
 */
PreviewLeadStateNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    UIModel.getInstance().agentSettings.onManualOutdial = true;

    var response = {
        callType: notif['@call_type'],
        messageId: notif['@message_id'],
        requestId: utils.getText(notif, "request_id"),
        leadState: utils.getText(notif,"lead_state"),
        callback: utils.getText(notif,"callback")
    };

    return response;
};


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
 * {"ui_response":{
 *      "@message_id":"IQ982008082817165103294",
 *      "@type":"AGENT-STATE",
 *      "status":{"#text":"OK"},
 *      "message":{},
 *      "detail":{},
 *      "agent_id":{"#text":"1856"},
 *      "prev_state":{"#text":"ENGAGED"},
 *      "current_state":{"#text":"WORKING"},
 *      "agent_aux_state":{"#text":"Offhook Work"},
 *      "prev_aux_state":{}
 *   }
 * }
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

        // Update the state in the UIModel
        model.agentSettings.currentState = currState;
        model.agentSettings.currentStateLabel = currAuxState;
        model.agentStatePacket = response;
    }else{
        if(formattedResponse.message === ""){
            formattedResponse.message = "Unable to change agent state";
        }

        // log message response
        var message = "Unable to change agent state. " + formattedResponse.detail;
        utils.logMessage(LOG_LEVELS.WARN, message, response);
    }

    return formattedResponse;
};




var BargeInRequest = function(audioType) {
    this.audioType = audioType || "FULL";
};

/*
 *
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UIV22008931055822",
 *      "@response_to":"",
 *      "@type":"BARGE-IN",
 *      "agent_id":{"#text":"94"},
 *      "uii":{"#text":"200809031054510000000900020961"},
 *      "audio_state":{"#text":"FULL"},
 *      "monitor_agent_id":{"#text":"1856"}
 *    }
 * }
 */
BargeInRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.BARGE_IN,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(model.agentSettings.agentId)
            },
            "uii":{
                "#text":utils.toString(model.currentCall.uii)
            },
            "audio_state":{
                "#text":utils.toString(this.audioType)
            },
            "monitor_agent_id":{
                "#text":utils.toString(model.currentCall.monitorAgentId)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes BARGE-IN packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008090317393001252",
 *      "@response_to":"",
 *      "@type":"BARGE-IN",
 *      "agent_id":{"#text":"94"},
 *      "uii":{},
 *      "status":{"#text":"OK"},
 *      "message":{"#text":"Barge-In processed successfully!"},
 *      "detail":{}
 *    }
 * }
 */
BargeInRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.agentId = utils.getText(resp, 'agent_id');
    formattedResponse.uii = utils.getText(resp, 'uii');

    if(formattedResponse.status === "OK"){
        utils.logMessage(LOG_LEVELS.DEBUG, formattedResponse.message, response);
    }else{
        utils.logMessage(LOG_LEVELS.WARN, "There was an error processing the Barge-In request. " + formattedResponse.detail, response);
    }

    return formattedResponse;
};


var CallNotesRequest = function(notes) {
    this.notes = notes;
};

/*
* This event is responsible for allowing an agent to tag a call with notes
*/
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
 * {"ui_response":{
 *      "@message_id":"IQ982008082817165103294",
 *      "@type":"CALL-NOTES",
 *      "status":{"#text":"OK"},
 *      "message":{},
 *      "detail":{}
 *   }
 * }
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
 * {"ui_response":{
 *      "@message_id":"IQ982008091512353000875",
 *      "@response_to":"UIV220089151235539",
 *      "@type":"PENDING-CALLBACKS",
 *      "lead":{
 *          "@aux_data1":"",
 *          "@aux_data2":"",
 *          "@aux_data3":"",
 *          "@aux_data4":"",
 *          "@aux_data5":"",
 *          "@destination":"5555555555",
 *          "@dial_group_id":"",
 *          "@dial_group_name":"",
 *          "@dial_time":"2016-08-03 10:00",
 *          "@extern_id":"",
 *          "@lead_id":"",
 *          "lead_id":{},
 *          "extern_id":{},
 *          "extern_id":{},
 *          "first_name":{},
 *          "mid_name":{},
 *          "last_name":{},
 *          "suffix":{},
 *          "title":{},
 *          "address1":{},
 *          "address2":{},
 *          "city":{},
 *          "state":{},
 *          "zip":{},
 *          "gate_keeper":{}
 *      }
 *   }
 * }
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
 *
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
 * {"ui_response":{
 *      "@campaign_id":"60403",
 *      "@message_id":"IQ10012016081813480400006",
 *      "@response_to":"0b61c3ca-c4fc-9942-c139-da4978053c9d",
 *      "@type":"CAMPAIGN-DISPOSITIONS",
 *      "outdial_dispositions":{
 *          "disposition":[
 *              {"@disposition_id":"1","#text":"requeue"},
 *              {"@disposition_id":"2","#text":"complete"}
 *          ]
 *       }
 *    }
 * }
 */
CampaignDispositionsRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var model = UIModel.getInstance();
    var dispositions = utils.processResponseCollection(resp, 'outdial_dispositions', 'disposition', 'disposition');

    model.outboundSettings.campaignDispositions = dispositions;
    return dispositions;
};


var XferColdRequest = function(dialDest, callerId) {
    this.dialDest = dialDest;
    this.callerId = callerId || "";
};

XferColdRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.XFER_COLD,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "uii":{
                "#text":UIModel.getInstance().currentCall.uii
            },
            "dial_dest":{
                "#text":utils.toString(this.dialDest)
            },
            "caller_id":{
                "#text":utils.toString(this.callerId)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes COLD-XFER packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ10012016082314475000219",
 *      "@response_to":"",
 *      "@type":"COLD-XFER",
 *      "agent_id":{"#text":"1"},
 *      "uii":{"#text":"201608231447590139000000000200"},
 *      "session_id":{"#text":"3"},
 *      "status":{"#text":"OK"},
 *      "dial_dest":{"#text":"3038593775"},
 *      "message":{"#text":"OK"},
 *      "detail":{}
 *   }
 * }
 */
XferColdRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.agentId = utils.getText(resp, 'agent_id');
    formattedResponse.uii = utils.getText(resp, 'uii');
    formattedResponse.sessionId = utils.getText(resp, 'session_id');
    formattedResponse.dialDest = utils.getText(resp, 'dial_dest');

    if(formattedResponse.status === "OK"){

    }else{
        // log message response
        var message = "There was an error processing the Cold Xfer request. " + formattedResponse.message + " : " + formattedResponse.detail;
        utils.logMessage(LOG_LEVELS.WARN, message, response);
    }

    return formattedResponse;
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
        utils.logMessage(LOG_LEVELS.WARN, "dialDest [" + this.dialDest + "] must be a valid sip or 10-digit DID", "");
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
 * {"ui_response":{
 *      "@message_id":"IQ10012016082513212000447",
 *      "@response_to":"IQ201608251121200",
 *      "@type":"LOGIN",
 *      "agent_id":{"#text":"1"},
 *      "status":{"#text":"SUCCESS"},
 *      "message":{"#text":"Hello Geoffrey Mina!"},
 *      "detail":{"#text":"Logon request processed successfully!"},
 *      "hash_code":{"#text":"404946966"},
 *      "login_type":{"#text":"BLENDED"},
 *      "outdial_group_id":{"#text":"50692"},
 *      "skill_profile_id":{"#text":"1513"},
 *      "gates":{
 *          "gate_id":[
 *              {"#text":"11116"},
 *              {"#text":"11117"}
 *          ]
 *      },
 *      "chat_queues":{
 *          "chat_queue_id":{"#text":"30"}
 *      }
 *    }
 * }
 */
ConfigRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var status = utils.getText(resp, "status");
    var detail = utils.getText(resp, "detail");
    var model = UIModel.getInstance();
    var message = "";
    var formattedResponse = utils.buildDefaultResponse(response);

    if(detail === "Logon Session Configuration Updated!"){
        // this is an update login packet
        model.agentSettings.updateLoginMode = true;

        message = "Logon Session Configuration Updated!";
        utils.logMessage(LOG_LEVELS.INFO, message, response);
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
            setGateSettings(response);
            setChatQueueSettings(response);
            setSkillProfileSettings(response);

        }else{
            if(model.agentSettings.updateLoginMode){
                model.agentSettings.dialDest = model.configRequest.dialDest;
                model.agentSettings.loginType = utils.getText(resp, "login_type");

                // This was an update login request
                model.agentSettings.updateLoginMode = false;

                // reset to false before updating dial group settings
                model.agentPermissions.allowLeadSearch = false;
                model.agentPermissions.requireFetchedLeadsCalled = false;
                model.agentPermissions.allowPreviewLeadFilters = false;

                // Set collection values
                setDialGroupSettings(response);
                setGateSettings(response);
                setChatQueueSettings(response);
                setSkillProfileSettings(response);

            }else{
                // this was a reconnect
                message = "Processed a Layer 2 Reconnect Successfully";
                utils.logMessage(LOG_LEVELS.INFO, message, response);
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
        utils.logMessage(LOG_LEVELS.WARN, formattedResponse.message, response);
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

function setSkillProfileSettings(response){
    var model = UIModel.getInstance();
    var skillProfiles = model.inboundSettings.availableSkillProfiles;
    for(var s = 0; s < skillProfiles.length; s++){
        var profile = skillProfiles[s];
        if(profile.skillProfileId === response.ui_response.skill_profile_id){
            model.inboundSettings.skillProfile = JSON.parse(JSON.stringify(profile)); // copy object
        }
    }
}

function setGateSettings(response){
    var model = UIModel.getInstance();
    var gates = model.inboundSettings.availableQueues;
    var selectedGateIds = [];
    var selectedGates = [];
    var gateIds = response.ui_response.gates.gate_id;

    if(gateIds){
        if(Array.isArray(gateIds)){ // multiple gates assigned
            for(var s = 0; s < gateIds.length; s++){
                var obj = gateIds[s];
                selectedGateIds.push(obj["#text"]);
            }
        }else{ // single gate assigned
            selectedGateIds.push(gateIds["#text"]);
        }
    }

    for(var gIdx = 0; gIdx < gates.length; gIdx++){
        var gate = gates[gIdx];
        if(selectedGateIds.indexOf(gate.gateId) > -1){
            selectedGates.push(gate);
        }
    }

    model.inboundSettings.queues = JSON.parse(JSON.stringify(selectedGates)); // copy array
}

function setChatQueueSettings(response){
    var model = UIModel.getInstance();
    var chatQueues = model.chatSettings.availableChatQueues;
    var selectedChatQueueIds = [];
    var selectedChatQueues = [];
    var chatQueueIds = response.ui_response.chat_queues.chat_queue_id;

    if(chatQueueIds){
        if(Array.isArray(chatQueueIds)){ // multiple chatQueues assigned
            for(var c = 0; c < chatQueueIds.length; c++){
                var obj = chatQueueIds[c];
                selectedChatQueueIds.push(obj["#text"]);
            }
        }else{ // single chat queue assigned
            selectedChatQueueIds.push(chatQueueIds["#text"]);
        }

    }

    for(var cIdx = 0; cIdx < chatQueues.length; cIdx++){
        var chatQueue = chatQueues[cIdx];
        if(selectedChatQueueIds.indexOf(chatQueue.chatQueueId) > -1){
            selectedChatQueues.push(chatQueue);
        }
    }

    model.chatSettings.chatQueues = JSON.parse(JSON.stringify(selectedChatQueues)); // copy array
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
 * {"ui_request":{
 *      "@message_id":"IQ20160817145840132",
 *      "@response_to":"",
 *      "@type":"OUTDIAL-DISPOSITION|INBOUND-DISPOSITION",
 *      "session_id":{"#text":"2"},  <-- ONLY WHEN AVAILABLE otherwise the node is left blank. this is the AGENT session_id
 *      "uii":{"#text":"201608171658440139000000000165"},
 *      "agent_id":{"#text":"1180958"},
 *      "lead_id":{"#text":"1800"},
 *      "outbound_externid":{"#text":"3038593775"},
 *      "disposition_id":{"#text":"5950"},
 *      "notes":{"#text":"note here"},
 *      "call_back":{"#text":"FALSE"},
 *      "call_back_DTS":{},
 *      "contact_forwarding":{},
 *      "survey":{
 *          "response":[
 *              {"@extern_id":"text_box","@lead_update_column":"","#text":"hello"},
 *              {"@extern_id":"check_box","@lead_update_column":"","#text":"20"},
 *              {"@extern_id":"radio_save","@lead_update_column":"","#text":"23"}
 *          ]
 *      }
 *   }
 * }
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
 * {"ui_request":{
 *      "@message_id":"UIV220089241119416",
 *      "@response_to":"",
 *      "@type":"OUTDIAL-DISPOSITION",
 *      "manual_disp":{"#text":"TRUE"},
 *      "request_key":{"#text":"IQ10012016081719070100875"},
 *      "session_id":{},
 *      "uii":{},
 *      "agent_id":{"#text":"1810"},
 *      "lead_id":{"#text":"213215"},
 *      "outbound_externid":{"#text":"909809"},
 *      "disposition_id":{"#text":"126"},
 *      "notes":{"#text":"here are my notes :)"},
 *      "call_back":{"#text":"TRUE | FALSE"},
 *      "call_back_DTS":{"#text":"2008-09-30 22:30:00 | null"},
 *      "contact_forwarding":{"#text":"null"}
 *    }
 * }
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


var HoldRequest = function(holdState) {
    this.holdState = holdState;
};

/*
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"HOLD",
 *      "agent_id":{"#text":"1856"},
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "session_id":{"#text":"1"},
 *      "hold_state":{"#text":"ON"}
 *    }
 * }
 */
HoldRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.HOLD,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(model.currentCall.agentId)
            },
            "uii":{
                "#text":utils.toString(model.currentCall.uii)
            },
            "session_id":{
                "#text":"1"
            },
            "hold_state":{
                "#text":this.holdState === true || this.holdState === "true" ? "ON" : "OFF"
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes HOLD packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008082910361503344",
 *      "@response_to":"",
 *      "@type":"HOLD",
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "session_id":{"#text":"1"},
 *      "status":{"#text":"OK"},
 *      "message":{},
 *      "detail":{},
 *      "hold_state":{"#text":"ON"}
 *    }
 * }
 */
HoldRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);
    var currUII = "";
    if(UIModel.getInstance().currentCall.uii){
       currUII = UIModel.getInstance().currentCall.uii;
    }

    formattedResponse.holdState = utils.getText(resp, 'hold_state') === "ON";
    formattedResponse.sessionId = utils.getText(resp, 'session_id');
    formattedResponse.uii = utils.getText(resp, 'uii');

    if(formattedResponse.status === "OK"){
        // make sure we are talking about the same call
        if(formattedResponse.uii === currUII){
            if(formattedResponse.message === ""){
                formattedResponse.message = "Broadcasting new hold state of " + formattedResponse.holdState;
            }
            utils.logMessage(LOG_LEVELS.DEBUG, "Broadcasting new hold state of " + formattedResponse.holdState, response);
        }
        else{
            utils.logMessage(LOG_LEVELS.DEBUG, "Hold Response is for a different call...discarding", response);
        }
    }else{
        if(formattedResponse.message === ""){
            formattedResponse.message = "Error processing HOLD request. " +  + formattedResponse.message + "\n" + formattedResponse.detail;
        }
        utils.logMessage(LOG_LEVELS.WARN, "Error processing HOLD request. " + formattedResponse.detail, response);
    }

    return formattedResponse;
};


var LeadHistoryRequest = function(leadId) {
    this.leadId = leadId;
};

/*
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"LEAD-HISTORY",
 *      "agent_id":{"#text":"1"},
 *      "lead_id":{"#text":"12"},
 *    }
 * }
 */
LeadHistoryRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.LEAD_HISTORY,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(model.agentSettings.agentId)
            },
            "lead_id":{
                "#text":utils.toString(this.leadId)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes LEAD-HISTORY packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@lead_id":"2653",
 *      "@message_id":"IQ982008091512353000875",
 *      "@response_to":"UIV220089151235539",
 *      "@type":"LEAD-HISTORY",
 *      "previous_dial":{
 *          "@agent_name":"mandy pants (mandy)",
 *          "@duration":"",
 *          "@pass_disposition":"",
 *          "@pass_dts":"2008-09-15 12:35:27",
 *          "@pass_number":"",
 *          "@pass_uii":"200809151234140000000900021288",
 *          "agent_notes":{"#text":"This person was incredibly nice and agreed to buy donuts. "},
 *          "agent_disposition":{"#text":"Incomplete"}
 *      }
 *   }
 * }
 *
 * OR
 *
 * {"ui_response":{
 *      "@lead_id":"2653",
 *      "@message_id":"IQ982008091512353000875",
 *      "@response_to":"UIV220089151235539",
 *      "@type":"LEAD-HISTORY",
 *      "previous_dial":[
 *        {
 *          "@agent_name":"mandy pants (mandy)",
 *          "@duration":"",
 *          "@pass_disposition":"",
 *          "@pass_dts":"2008-09-15 12:35:27",
 *          "@pass_number":"",
 *          "@pass_uii":"200809151234140000000900021288",
 *          "agent_notes":{"#text":"This person was incredibly nice and agreed to buy donuts. "},
 *          "agent_disposition":{"#text":"Incomplete"}
 *        },
 *        {
 *          "@agent_name":"mandy pants (mandy)",
 *          "@duration":"",
 *          "@pass_disposition":"",
 *          "@pass_dts":"2008-09-15 12:35:27",
 *          "@pass_number":"",
 *          "@pass_uii":"200809151234140000000900021288",
 *          "agent_notes":{"#text":"This person was incredibly nice and agreed to buy donuts. "},
 *          "agent_disposition":{"#text":"Incomplete"}
 *        }
 *      ]
 *   }
 * }
 */
LeadHistoryRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var histResponse = {
        leadId: resp['@lead_id']
    };

    var history = utils.processResponseCollection(response, 'ui_response', 'previous_dial');

    // always return array, even if only one item
    if(!Array.isArray(history)){
        history = [history];
    }
    histResponse.leadHistory = history;

    return histResponse;
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
 * {"ui_response":{
 *      "@type":"login",
 *      "status":{"#text":"OK"},
 *      "agent_id":{"#text":"1810"},
 *      "agent_pwd":{"#text":"bound25"},
 *      "first_name":{"#text":"mandy"},
 *      "last_name":{"#text":"pants"},
 *      "email":{"#text":"mandypants@aol.coim"},
 *      "agent_type":{"#text":"AGENT"},
 *      "external_agent_id":{"#text":"blahblah"},
 *      "default_login_dest":{"#text":"9548298548|123"},
 *      "alt_default_login_dest":{"#text":"9548298548|123"},
 *      "iq_url":{"#text":"dev.connectfirst.com"},
 *      "iq_port":{"#text":"1313"},
 *      "iq_ssl_port":{"#text":"1213"},
 *      "iq_secret_key":{"#text":"F-OFF"},
 *      "allow_inbound":{"#text":"1"},
 *      "allow_outbound":{"#text":"1"},
 *      "allow_chat":{"#text":"1"},
 *      "allow_blended":{"#text":"0"},
 *      "allow_off_hook":{"#text":"1"},
 *      "allow_call_control":{"#text":"1"},
 *      "allow_login_control":{"#text":"1"},
 *      "allow_login_updates":{"#text":"1"},
 *      "allow_lead_inserts":{"#text":"1"},
 *      "show_lead_history":{"#text":"1"},
 *      "allow_cross_gate_requeue":{"#text":"1"},
 *      "phone_login_dial_group":{"#text":"44"},
 *      "phone_login_pin":{"#text":"1234"},
 *      "allow_manual_calls":{"#text":"1"},
 *      "allow_manual_intl_calls":{"#text":"0"},
 *      "init_login_state":{"#text":"ON-BREAK"},
 *      "init_login_state_label":{"#text":"Morning Break"},
 *      "outbound_prepay":{"#text":"0"},
 *      "max_break_time":{"#text":"-1"},
 *      "max_lunch_time":{"#text":"-1"},
 *      "allow_lead_search":{"#text":"YES_ALL"},
 *      "tcpa_safe_mode":{"#text":"1|0"},
 *      "login_gates":{
 *          "gate":[
 *              {"@default_dest_override":"","@gate_desc":"","@gate_id":"37","@gate_name":"test"},
 *              {"@default_dest_override":"","@gate_desc":"","@gate_id":"42","@gate_name":"test gate two"},
 *              {"@default_dest_override":"","@gate_desc":"","@gate_id":"43","@gate_name":"test gate three"},
 *              {"@default_dest_override":"","@gate_desc":"Amandas Other Gate","@gate_id":"46","@gate_name":"You know it!"}
 *          ]
 *      },
 *      "login_chat_queues":{
 *          "chat_queue":[
 *              {"@chat_queue_description":"","@chat_queue_id":"","@chat_queue_name":""},
 *              {"@chat_queue_description":"","@chat_queue_id":"","@chat_queue_name":""}
 *          ]
 *      },
 *      "outdial_groups":{
 *          "group":[
 *              {"@billing_key":"","@dial_group_desc":"","@dial_group_id":"44","@dial_group_name":"Geoff Dial Test","@dial_mode":"PREDICTIVE"},
 *              {"@billing_key":"2","@dial_group_desc":"AutoDial Configured Dial Group","@dial_group_id":"46","@dial_group_name":"Phone Only test5","@dial_mode":"PREDICTIVE"},
 *              {"@billing_key":"","@dial_group_desc":"Test","@dial_group_id":"200000","@dial_group_name":"Test","@dial_mode":"PREDICTIVE"},
 *              {"@billing_key":"","@dial_group_desc":"Test","@dial_group_id":"200010","@dial_group_name":"Carissa's Test Group","@dial_mode":"PREDICTIVE"}
 *          ]
 *      },"skill_profiles":{
 *          "profile":[
 *              {"@profile_desc":"","@profile_id":"571","@profile_name":"skill1"},
 *              {"@profile_desc":"","@profile_id":"572","@profile_name":"skill2"}
 *          ]
 *      },
 *      "requeue_gates":{
 *          "gate_group":[
 *              {
 *                  "@gate_group_id":"18",
 *                  "@group_name":"new gate group",
 *                  "gates":{
 *                      "gate":[
 *                          {"@gate_desc":"","@gate_id":"37","@gate_name":"test"},
 *                          {"@gate_desc":"","@gate_id":"43","@gate_name":"test gate three"},
 *                          {"@gate_desc":"","@gate_id":"42","@gate_name":"test gate two"}
 *                      ]
 *                  },
 *                  "skills":{
 *                      "skill":[
 *                          {"@skill_desc":"","@skill_id":"58","@skill_name":"one"},
 *                          {"@skill_desc":"","@skill_id":"59","@skill_name":"two"},
 *                      ]
 *                  }
 *              }
 *          ]
 *      },
 *      "chat_rooms":{},
 *      "surveys": {
 *           "survey": {
 *               "@survey_id": "15",
 *               "@survey_name": "Don't Read This Survey"
 *           }
 *      },
 *      "campaigns": {
 *          "campaign": {
 *              "@allow_lead_updates": "",
 *              "@campaign_id": "",
 *              "@campaign_name": "",
 *              "@survey_id": "",
 *              "@survey_name": "",
 *              "custom_labels": {
 *                  "@aux_1_label": "",
 *                  "@aux_2_label": "",
 *                  "@aux_3_label": "",
 *                  "@aux_4_label": "",
 *                  "@aux_5_label": ""
 *              },
 *              "generic_key_value_pairs": {}
 *          }
 *      },
 *      "account_countries":{
 *          "country":[
 *              {"@country_id":"BRA"},{"@country_id":"FRA"},{"@country_id":"GER"}
 *          ]
 *      }
 *   }
 * }
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
            model.agentSettings.phoneLoginPin = utils.getText(resp, 'phone_login_pin');

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

            model.outboundSettings.defaultDialGroup = utils.getText(resp, 'phone_login_dial_group');

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
        utils.logMessage(LOG_LEVELS.WARN, formattedResponse.message, response);
    }else{
        formattedResponse.message = "Invalid Username or password";
        utils.logMessage(LOG_LEVELS.WARN, formattedResponse.message, response);
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
 * {"ui_response":{
 *      "@message_id":"UI2005",
 *      "@response_to":"",
 *      "@type":"OFF-HOOK-INIT",
 *      "status":{"#text":"OK|FAILURE"},
 *      "message":{},
 *      "detail":{}
 *    }
 * }
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
        utils.logMessage(LOG_LEVELS.WARN, formattedResponse.message + ' ' + formattedResponse.detail, response);
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
 * {"ui_notification":{
 *      "@message_id":"IQ10012016080217135001344",
 *      "@response_to":"",
 *      "@type":"OFF-HOOK-TERM",
 *      "agent_id":{"#text":"1"},
 *      "start_dts":{"#text":"2016-08-02 17:11:38"},
 *      "end_dts":{"#text":"2016-08-02 17:14:07"},
 *      "monitoring":{"#text":"0"}
 *    }
 * }
 */
OffhookTermRequest.prototype.processResponse = function(data) {
    var notif = data.ui_notification;
    var monitoring = utils.getText(notif, "monitoring") === '1';
    var model = UIModel.getInstance();

    model.agentSettings.wasMonitoring = monitoring;
    model.offhookTermPacket = data;
    model.agentSettings.isOffhook = false;

    var formattedResponse = {
        status: "OK",
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





var PauseRecordRequest = function(record) {
    this.record = record;
};

/*
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"PAUSE-RECORD",
 *      "agent_id":{"#text":"1856"},
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "record":{"#text":"TRUE | FALSE"},
 *      "pause":{"#text":"10"}
 *    }
 * }
 */
PauseRecordRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var pauseTime = "10";
    if(model.currentCall.agentRecording && model.currentCall.agentRecording.pause){
        pauseTime = model.currentCall.agentRecording.pause;
    }
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.PAUSE_RECORD,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(model.currentCall.agentId)
            },
            "uii":{
                "#text":utils.toString(model.currentCall.uii)
            },
            "record":{
                "#text":utils.toString(this.record === true ? "TRUE" : "FALSE")
            },
            "pause":{
                "#text":utils.toString(pauseTime)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes PAUSE-RECORD packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008082910361503344",
 *      "@response_to":"",
 *      "@type":"PAUSE-RECORD",
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "status":{"#text":"OK | FAILURE"},
 *      "message":{},
 *      "detail":{},
 *      "state":{"#text":"RECORDING | PAUSED"},
 *      "pause":{"#text":"10"}
 *    }
 * }
 */
PauseRecordRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);
    var currUII = "";
    if(UIModel.getInstance().currentCall.uii){
        currUII = UIModel.getInstance().currentCall.uii;
    }

    formattedResponse.uii = utils.getText(resp, 'uii');
    formattedResponse.state = utils.getText(resp, 'state');
    formattedResponse.pause = utils.getText(resp, 'pause');

    if(formattedResponse.status === "OK"){
        // make sure we are talking about the same call
        if(formattedResponse.uii === currUII) {
            if(formattedResponse.message === ""){
                formattedResponse.message = "Broadcasting new record state of " + formattedResponse.state;
            }
            utils.logMessage(LOG_LEVELS.DEBUG, "Broadcasting new record state of " + formattedResponse.state, response);
        }else{
            utils.logMessage(LOG_LEVELS.DEBUG, "Pause Record Response is for a different call...discarding", response);
        }
    }else{
        if(formattedResponse.message === ""){
            formattedResponse.message = "Error processing PAUSE-RECORD request." + formattedResponse.message + "\n" + formattedResponse.detail;
        }
        utils.logMessage(LOG_LEVELS.WARN, formattedResponse.message, response);
    }

    return formattedResponse;
};


var PingCallRequest = function() {
    
};

PingCallRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.PING_CALL,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().currentCall.agentId
            },
            "uii":{
                "#text":UIModel.getInstance().currentCall.uii
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
            "@response_to":"",
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
 * {"dialer_request":{
 *      "@action":"",
 *      "@callbacks":"TRUE|FALSE"
 *      ,"@message_id":"ID2008091513163400220",
 *      "@response_to":"",
 *      "@type":"PREVIEW_DIAL",
 *      "dial_group_id":{"#text":"200018"},
 *      "account_id":{"#text":"99999999"},
 *      "agent_id":{"#text":"1810"},
 *      "destinations":{
 *          "lead":[
 *              {
 *                  "@aux_data1":"","@aux_data2":"","@aux_data3":"","@aux_data4":"","@aux_data5":"",
 *                  "@aux_phone":"","@campaign_id":"51","@destination":"9548298548","@dnis":"1112223333",
 *                  "@extern_id":"amanda","@lead_id":"2646","@lead_state":"PENDING","@live_answer_msg":"",
 *                  "@mach_answer_msg":"","@machine_detect":"FALSE","@request_key":"IQ982008091516241101125",
 *                  "@valid_until":"2008-09-15 17:24:11","extern_id":{"#text":"9548298548"},
 *                  "first_name":{"#text":"Amanda"},"mid_name":{"#text":"Amanda"},"last_name":{"#text":"Machutta2"},
 *                  "address1":{},"address2":{},"city":{},"state":{},"zip":{},"aux_greeting":{},
 *                  "aux_external_url":{}
 *              },
 *          ]
 *      }
 *    }
 * }
 */
PreviewDialRequest.prototype.processResponse = function(notification) {
    var notif = notification.dialer_request;
    var model = UIModel.getInstance();
    var leads = utils.processResponseCollection(notif, 'destinations', 'lead');
    var formattedResponse = {
        action: notif['@action'],
        dialGroupId: utils.getText(notif,"dial_group_id"),
        accountId: utils.getText(notif,"account_id"),
        agentId: utils.getText(notif,"agent_id"),
        leads: leads
    };

    if(notif['@callbacks'] === 'TRUE'){
        utils.logMessage(LOG_LEVELS.INFO, "New CALLBACK packet request rec'd from dialer", notification);
        // clear callbacks??
        //model.callbacks = [];
        for(var l = 0; l < leads.length; l++){
            var lead = leads[l];
            model.callbacks.push(lead);
        }
    }else{
        model.outboundSettings.previewDialLeads = leads;
    }

    return formattedResponse;
};


var ReconnectRequest = function() {

};

ReconnectRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var loginMsg = JSON.parse(model.loginRequest.formatJSON());

    loginMsg.hash_code = {"#text":model.hashCode};
    loginMsg.update_login = {"#text":"FALSE"};
    loginMsg.reconnect = {"#text":"TRUE"};

    return JSON.stringify(loginMsg);
};

var RecordRequest = function(record) {
    this.record = record;
};

/*
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"RECORD",
 *      "agent_id":{"#text":"1856"},
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "record":{"#text":"TRUE | FALSE"}
 *    }
 * }
 */
RecordRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.RECORD,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(model.currentCall.agentId)
            },
            "uii":{
                "#text":utils.toString(model.currentCall.uii)
            },
            "record":{
                "#text": this.record === true ? "TRUE" : "FALSE"
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes RECORD packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008082910361503344",
 *      "@response_to":"",
 *      "@type":"RECORD",
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "status":{"#text":"OK"},
 *      "message":{},
 *      "detail":{},
 *      "state":{"#text":"RECORDING | STOPPED"}
 *    }
 * }
 */
RecordRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);
    var currUII = "";
    if(UIModel.getInstance().currentCall.uii){
        currUII = UIModel.getInstance().currentCall.uii;
    }

    formattedResponse.uii = utils.getText(resp, 'uii');
    formattedResponse.state = utils.getText(resp, 'state');

    if(formattedResponse.status === "OK"){
        // make sure we are talking about the same call
        if(formattedResponse.uii === currUII) {
            if(formattedResponse.message === ""){
                formattedResponse.message = "Broadcasting new record state of " + formattedResponse.state;
            }
            utils.logMessage(LOG_LEVELS.DEBUG, formattedResponse.message, response);
        }else{
            utils.logMessage(LOG_LEVELS.DEBUG, "Record Response is for a different call...discarding", response);
        }
    }else{
        if(formattedResponse.message === ""){
            formattedResponse.message = "Error processing RECORD request." + formattedResponse.message + "\n" + formattedResponse.detail;
        }
        utils.logMessage(LOG_LEVELS.WARN, formattedResponse.message, response);
    }

    return formattedResponse;
};


var RequeueRequest = function(queueId, skillId, maintain) {
    this.queueId = queueId;
    this.skillId = skillId;
    this.maintain = maintain;
};

RequeueRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.REQUEUE,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "uii":{
                "#text":UIModel.getInstance().currentCall.uii
            },
            "gate_number":{
                "#text":utils.toString(this.queueId)
            },
            "skill_id":{
                "#text":utils.toString(this.skillId)
            },
            "maintain_agent":{
                "#text":this.maintain === true ? "TRUE" : "FALSE"
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes RE-QUEUE packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008082817165103291",
 *      "@response_to":"UIV220088281716486",
 *      "@type":"RE-QUEUE",
 *      "status":"OK",
 *      "message":"Success.",
 *      "detail":"The re-queue request was successfully processed.",
 *      "agent_id":{"#text":"1856"},
 *      "uii":{"#text":"200808281716090000000900028070"},
 *      "gate_number":{"#text":"19"},
 *      "maintain_agent":{"#text":"FALSE"}
 *    }
 * }
 */
RequeueRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.agentId = utils.getText(resp, 'agent_id');
    formattedResponse.uii = utils.getText(resp, 'uii');
    formattedResponse.queueId = utils.getText(resp, 'gate_number');

    if(formattedResponse.status === "OK"){
    }else{
        var message = "There was an error processing the requeue request. " + formattedResponse.detail;
        utils.logMessage(LOG_LEVELS.WARN, message, response);
    }

    return formattedResponse;
};


var StatsRequest = function() {
    
};

/*
 * { "ui_request": {
 *      "@response_to":"",
 *      "@message_id":"IS20160901142437535",
 *      "@type":"STATS"
 *    }
 * }
 */
StatsRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IS",
            "@type":MESSAGE_TYPES.STATS,
            "@message_id":utils.getMessageId(),
            "@response_to":""
        }
    };

    return JSON.stringify(msg);
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
 * {"dialer_request":{
 *      "@callbacks":"TRUE|FALSE"
 *      ,"@message_id":"ID2008091513163400220",
 *      "@response_to":"",
 *      "@type":"TCPA_SAFE",
 *      "dial_group_id":{"#text":"200018"},
 *      "account_id":{"#text":"99999999"},
 *      "agent_id":{"#text":"1810"},
 *      "destinations":{
 *          "lead":[
 *              {
 *                  "@aux_data1":"","@aux_data2":"","@aux_data3":"","@aux_data4":"","@aux_data5":"",
 *                  "@aux_phone":"","@campaign_id":"51","@destination":"9548298548","@dnis":"1112223333",
 *                  "@extern_id":"amanda","@lead_id":"2646","@lead_state":"PENDING","@live_answer_msg":"",
 *                  "@mach_answer_msg":"","@machine_detect":"FALSE","@request_key":"IQ982008091516241101125",
 *                  "@valid_until":"2008-09-15 17:24:11","extern_id":{"#text":"9548298548"},
 *                  "first_name":{"#text":"Amanda"},"mid_name":{"#text":"Amanda"},"last_name":{"#text":"Machutta2"},
 *                  "address1":{},"address2":{},"city":{},"state":{},"zip":{},"aux_greeting":{},
 *                  "aux_external_url":{}
 *              },
 *          ]
 *      }
 *    }
 * }
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
        var message = "New CALLBACK packet request rec'd from dialer";
        utils.logMessage(LOG_LEVELS.INFO, message, notification);
        // clear callbacks??
        //model.callbacks = [];
        for(var l = 0; l < leads.length; l++){
            var lead = leads[l];
            model.callbacks.push(lead);
        }
    }else{
        model.outboundSettings.tcpaSafeLeads = leads;
    }

    return formattedResponse;
};


var XferWarmRequest = function(dialDest, callerId) {
    this.dialDest = dialDest;
    this.callerId = callerId || "";
};

XferWarmRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.XFER_WARM,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "uii":{
                "#text":UIModel.getInstance().currentCall.uii
            },
            "dial_dest":{
                "#text":utils.toString(this.dialDest)
            },
            "caller_id":{
                "#text":utils.toString(this.callerId)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes WARM-XFER packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ10012016082314475000219",
 *      "@response_to":"",
 *      "@type":"WARM-XFER",
 *      "agent_id":{"#text":"1"},
 *      "uii":{"#text":"201608231447590139000000000200"},
 *      "session_id":{"#text":"3"},
 *      "status":{"#text":"OK"},
 *      "dial_dest":{"#text":"3038593775"},
 *      "message":{"#text":"OK"},"detail":{}
 *    }
 * }
 *  Response on CANCEL:
 *  {"ui_response":{
 *      "@message_id":"IQ10012016082315005000264",
 *      "@response_to":"",
 *      "@type":"WARM-XFER",
 *      "agent_id":{"#text":"1"},
 *      "uii":{"#text":"201608231501090139000000000204"},
 *      "session_id":{},
 *      "status":{"#text":"FAILURE"},
 *      "dial_dest":{"#text":"3038593775"},
 *      "message":{"#text":"Transfer CANCELED"},
 *      "detail":{"#text":"NOANSWER after 3 seconds."}
 *    }
 * }
 */
XferWarmRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.agentId = utils.getText(resp, 'agent_id');
    formattedResponse.uii = utils.getText(resp, 'uii');
    formattedResponse.sessionId = utils.getText(resp, 'session_id');
    formattedResponse.dialDest = utils.getText(resp, 'dial_dest');

    if(formattedResponse.status === "OK"){
        utils.logMessage(LOG_LEVELS.DEBUG, "Warm Xfer to " + formattedResponse.dialDest + " processed successfully.", response);
    }else{
        utils.logMessage(LOG_LEVELS.WARN, "There was an error processing the Warm Xfer request. " + formattedResponse.message + "\n" + formattedResponse.detail, response);
    }

    return formattedResponse;
};


var XferWarmCancelRequest = function(dialDest) {
    this.dialDest = dialDest;
};

XferWarmCancelRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.XFER_WARM_CANCEL,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "uii":{
                "#text":UIModel.getInstance().currentCall.uii
            },
            "dial_dest":{
                "#text":utils.toString(this.dialDest)
            }
        }
    };

    return JSON.stringify(msg);
};


var AgentStats = function() {

};


/*
 * This class is responsible for handling an Agent Stats packet rec'd from IntelliServices.
 * It will save a copy of it in the UIModel.
 *
  {"ui_stats":{
       "@type":"AGENT",
       "agent":{
           "@alt":"INBOUND",
           "@atype":"AGENT",
           "@avgtt":"00.0",
           "@calls":"0",
           "@da":"0",
           "@droute":"6789050673",
           "@f":"John",
           "@gdesc":"",
           "@gname":"",
           "@id":"1856",
           "@l":"Doe",
           "@ldur":"6",
           "@ltype":"INBOUND",
           "@oh":"0",
           "@pd":"0",
           "@pres":"0",
           "@rna":"0",
           "@sdur":"6",
           "@sp":"",
           "@state":"AVAILABLE",
           "@ttt":"0",
           "@u":"jdoe",
           "@uii":"",
           "@util":"0.00"
       }
     }
  }
 */
AgentStats.prototype.processResponse = function(stats) {
    var resp = stats.ui_stats.agent;
    var agentStats = {};
    if(resp){
        agentStats = {
            agentLoginType: resp["@alt"],
            agentType: resp["@atype"],
            avgTalkTime:resp["@avgtt"],
            calls: resp["@calls"],
            isDequeueAgent: resp["@da"],
            defaultRoute: resp["@droute"],
            firstName: resp["@f"],
            queueDesc: resp["@gdesc"],
            queueName: resp["@gname"],
            agentId: resp["@id"],
            lastName: resp["@l"],
            loginDuration: resp["@ldur"],
            loginType: resp["@ltype"],
            offHook: resp["@oh"],
            pendingDisp: resp["@pd"],
            presented: resp["@pres"],
            rna: resp["@rna"],
            stateDuration: resp["@sdur"],
            skillProfileName: resp["@sp"],
            agentState: resp["@state"],
            totalTalkTime: resp["@ttt"],
            username: resp["@u"],
            uii: resp["@uii"],
            utilization: resp["@util"]
        };
    }


    UIModel.getInstance().agentStats = agentStats;

    return agentStats;
};


var AgentDailyStats = function() {

};


/*
 * This class is responsible for handling an Agent Daily Stats packet rec'd from IntelliServices.
 * It will save a copy of it in the UIModel.
 *
 * {"ui_stats":{
 *      "@type":"AGENTDAILY",
 *      "agent_id":{"#text":"1180723"},
 *      "total_login_sessions":{"#text":"1"},
 *      "total_calls_handled":{"#text":"0"},
 *      "total_preview_dials":{"#text":"0"},
 *      "total_manual_dials":{"#text":"0"},
 *      "total_rna":{"#text":"0"},
 *      "total_talk_time":{"#text":"0"},
 *      "total_offhook_time":{"#text":"0"},
 *      "total_login_time":{"#text":"7808"},
 *      "total_success_dispositions":{"#text":"0"}
 *    }
 * }
 */
AgentDailyStats.prototype.processResponse = function(stats) {
    var resp = stats.ui_stats;
    var agentDailyStats = {
        agentId: utils.getText(resp, "agent_id"),
        totalLoginSessions: utils.getText(resp, "total_login_sessions"),
        totalCallsHandled: utils.getText(resp, "total_calls_handled"),
        totalPreviewDials: utils.getText(resp, "total_preview_dials"),
        totalManualDials: utils.getText(resp, "total_manual_dials"),
        totalRna: utils.getText(resp, "total_rna"),
        totalTalkTime: utils.getText(resp, "total_talk_time"),
        totalOffhookTime: utils.getText(resp, "total_offhook_time"),
        totalLoginTime: utils.getText(resp, "total_login_time"),
        totalSuccessDispositions: utils.getText(resp, "total_success_dispositions"),
        currCallTime: UIModel.getInstance().agentDailyStats.currCallTime
    };

    UIModel.getInstance().agentDailyStats = agentDailyStats;

    return agentDailyStats;
};


var CampaignStats = function() {

};


/*
 * This class is responsible for handling a Campaign Stats packet rec'd from IntelliServices.
 * It will save a copy of it in the UIModel.
 *
 * {"ui_stats":{
 *      "@type":"CAMPAIGN",
 *      "campaign":[
 *          {
 *              "@a":"0","@aba":"0","@an":"0","@av":"0","@b":"0","@c":"1","@e":"0","@f":"0",
 *              "@id":"60275","@int":"0","@m":"0","@na":"0","@name":"Test Campaign",
 *              "@p":"0","@r":"1","@s":"0","@tc":"0","@ttt":"0"
 *          },
 *          {
 *              "@a":"0","@aba":"0","@an":"0","@av":"0","@b":"0","@c":"0","@e":"0","@f":"0",
 *              "@id":"60293","@int":"0","@m":"0","@na":"0","@name":"Test Campaign w\\ Search",
 *              "@p":"0","@r":"19","@s":"0","@tc":"0","@ttt":"0"
 *          }
 *     ],
 *     "totals":{
 *          "noanswer":{"#text":"0"},
 *          "totalConnects":{"#text":"0"},
 *          "pending":{"#text":"0"},
 *          "active":{"#text":"0"},
 *          "error":{"#text":"0"},
 *          "totalTalkTime":{"#text":"0"},
 *          "answer":{"#text":"0"},
 *          "abandon":{"#text":"0"},
 *          "ready":{"#text":"20"},
 *          "machine":{"#text":"0"},
 *          "intercept":{"#text":"0"},
 *          "busy":{"#text":"0"},
 *          "complete":{"#text":"1"},
 *          "fax":{"#text":"0"}
 *     }
 *   }
 * }
 */
CampaignStats.prototype.processResponse = function(stats) {
    var resp = stats.ui_stats;
    var totals = utils.processResponseCollection(stats,"ui_stats","totals")[0];
    var campaigns = [];
    var campRaw = {};
    var camp = {};

    if(Array.isArray(resp.campaign)){
        for(var c=0; c< resp.campaign.length; c++){
            campRaw = resp.campaign[c];
            if(campRaw){
                camp = {
                    active:campRaw["@a"],
                    abandon:campRaw["@aba"],
                    answer:campRaw["@an"],
                    available:campRaw["@av"],
                    busy:campRaw["@b"],
                    complete:campRaw["@c"],
                    error:campRaw["@e"],
                    fax:campRaw["@f"],
                    campaignId:campRaw["@id"],
                    intercept:campRaw["@int"],
                    machine:campRaw["@m"],
                    noanswer:campRaw["@na"],
                    campaignName:campRaw["@name"],
                    pending:campRaw["@p"],
                    ready:campRaw["@r"],
                    staffed:campRaw["@s"],
                    totalConnects:campRaw["@tc"],
                    totalTalkTime:campRaw["@ttt"]
                };
            }

            campaigns.push(camp);
        }
    }else{
        campRaw = resp.campaign;
        if(campRaw){
            camp = {
                active:campRaw["@a"],
                abandon:campRaw["@aba"],
                answer:campRaw["@an"],
                available:campRaw["@av"],
                busy:campRaw["@b"],
                complete:campRaw["@c"],
                error:campRaw["@e"],
                fax:campRaw["@f"],
                campaignId:campRaw["@id"],
                intercept:campRaw["@int"],
                machine:campRaw["@m"],
                noanswer:campRaw["@na"],
                campaignName:campRaw["@name"],
                pending:campRaw["@p"],
                ready:campRaw["@r"],
                staffed:campRaw["@s"],
                totalConnects:campRaw["@tc"],
                totalTalkTime:campRaw["@ttt"]
            };
        }

        campaigns.push(camp);
    }

    var campaignStats = {
        type:resp["@type"],
        campaigns: campaigns,
        totals:totals
    };

    UIModel.getInstance().campaignStats = campaignStats;

    return campaignStats;
};


var QueueStats = function() {

};


/*
 * This class is responsible for handling an Queue Stats packet rec'd from IntelliServices.
 * It will save a copy of it in the UIModel.
 *
 * {
 *   "ui_stats":{
 *       "@type":"GATE",
 *       "gate":{
 *           "@aba":"0","@active":"0","@ans":"0","@asa":"00.0","@avail":"2",
 *           "@avga":"00.0","@avgq":"00.0","@avgt":"00.0","@def":"0","@id":"12126",
 *           "@inq":"0","@long_c":"0","@longq":"0","@name":"Cris inbound",
 *           "@pres":"0","@route":"0","@short_aba":"0","@short_c":"0","@sla":"100.0",
 *           "@sla_f":"0","@sla_p":"0","@staff":"2","@t_aba":"0","@t_q":"0","@t_soa":"0","@util":"00.0"
 *       },
 *       "totals":{
 *           "inQueue":{"#text":"0"},
 *           "answered":{"#text":"0"},
 *           "totalABATime":{"#text":"0"},
 *           "active":{"#text":"0"},
 *           "longCall":{"#text":"0"},
 *           "shortCall":{"#text":"0"},
 *           "slaPass":{"#text":"0"},
 *           "totalQueueTime":{"#text":"0"},
 *           "routing":{"#text":"0"},
 *           "totalTalkTime":{"#text":"0"},
 *           "shortAbandon":{"#text":"0"},
 *           "presented":{"#text":"0"},
 *           "totalSOA":{"#text":"0"},
 *           "slaFail":{"#text":"0"},
 *           "deflected":{"#text":"0"},
 *           "abandoned":{"#text":"0"}
 *      }
 *   }
 * }
 */
QueueStats.prototype.processResponse = function(stats) {
    var resp = stats.ui_stats;
    var totals = utils.processResponseCollection(stats,"ui_stats","totals")[0];
    var queues = [];
    var gate = {};
    var gateRaw = {};

    if(Array.isArray(resp.gate)){
        for(var c=0; c< resp.gate.length; c++){
            gateRaw = resp.gate[c];
            if(gateRaw){
                gate = {
                    abandon:gateRaw["@aba"],
                    active:gateRaw["@active"],
                    answer:gateRaw["@ans"],
                    asa:gateRaw["@asa"],
                    available:gateRaw["@avail"],
                    avgAbandon:gateRaw["@avga"],
                    avgQueue:gateRaw["@avgq"],
                    avgTalk:gateRaw["@avgt"],
                    deflected:gateRaw["@def"],
                    queueId:gateRaw["@id"],
                    inQueue:gateRaw["@inq"],
                    longCall:gateRaw["@long_c"],
                    longestInQueue:gateRaw["@longq"],
                    queueName:gateRaw["@name"],
                    presented:gateRaw["@pres"],
                    routing:gateRaw["@route"],
                    shortAbandon:gateRaw["@short_aba"],
                    shortCall:gateRaw["@short_c"],
                    sla:gateRaw["@sla"],
                    slaPass:gateRaw["@sla_p"],
                    slaFail:gateRaw["@sla_f"],
                    staffed:gateRaw["@staff"],
                    tAbandonTime:gateRaw["@t_aba"],
                    tQueueTime:gateRaw["@t_q"],
                    tSpeedOfAnswer:gateRaw["@t_soa"],
                    utilization:gateRaw["@util"]
                };
            }

            queues.push(gate);
        }
    }else{
        gateRaw = resp.gate;
        if(gateRaw){
            gate = {
                abandon:gateRaw["@aba"],
                active:gateRaw["@active"],
                answer:gateRaw["@ans"],
                asa:gateRaw["@asa"],
                available:gateRaw["@avail"],
                avgAbandon:gateRaw["@avga"],
                avgQueue:gateRaw["@avgq"],
                avgTalk:gateRaw["@avgt"],
                deflected:gateRaw["@def"],
                queueId:gateRaw["@id"],
                inQueue:gateRaw["@inq"],
                longCall:gateRaw["@long_c"],
                longestInQueue:gateRaw["@longq"],
                queueName:gateRaw["@name"],
                presented:gateRaw["@pres"],
                routing:gateRaw["@route"],
                shortAbandon:gateRaw["@short_aba"],
                shortCall:gateRaw["@short_c"],
                sla:gateRaw["@sla"],
                slaPass:gateRaw["@sla_p"],
                slaFail:gateRaw["@sla_f"],
                staffed:gateRaw["@staff"],
                tAbandonTime:gateRaw["@t_aba"],
                tQueueTime:gateRaw["@t_q"],
                tSpeedOfAnswer:gateRaw["@t_soa"],
                utilization:gateRaw["@util"]
            };
        }

        queues.push(gate);
    }

    var queueStats = {
        type:resp["@type"],
        queues: queues,
        totals:totals
    };

    UIModel.getInstance().queueStats = queueStats;

    return queueStats;
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

            currentCall: {},                        // save the NEW-CALL notification in parsed form
            callTokens:{},                          // Stores a map of all tokens for a call
            callbacks:[],
            libraryInstance: null,                  // Initialized to the library instance on startup
            pingIntervalId: null,                   // The id of the timer used to send ping-call messages
            statsIntervalId: null,                  // The id of the timer used to send stats request messages

            // request instances
            agentStateRequest : null,
            bargeInRequest : null,
            callNotesRequest : null,
            callbacksPendingRequest : null,
            campaignDispositionsRequest : null,
            configRequest : null,
            coldXferRequest : null,
            dispositionRequest : null,
            dispositionManualPassRequest : null,
            hangupRequest : null,
            holdRequest : null,
            leadHistoryRequest : null,
            logoutRequest : null,
            loginRequest : null,                // Original LoginRequest sent to IS - used for reconnects
            offhookInitRequest : null,
            offhookTermRequest : null,
            oneToOneOutdialRequest : null,
            oneToOneOutdialCancelRequest : null,
            pauseRecordRequest : null,
            pingCallRequest : null,
            previewDialRequest : null,
            reconnectRequest : null,
            recordRequest : null,
            requeueRequest : null,
            statsRequest : null,
            tcpaSafeRequest : null,
            warmXferRequest : null,
            warmXferCancelRequest : null,

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

            // stats packets
            agentStatsPacket: new AgentStats(),
            agentDailyStatsPacket: new AgentDailyStats(),
            queueStatsPacket: new QueueStats(),
            campaignStatsPacket: new CampaignStats(),

            // application state
            applicationSettings : {
                availableCountries : [],
                isLoggedInIS : false,               // a check for whether or not user is logged in with IntelliServices
                socketConnected : false,
                socketDest : "",
                isTcpaSafeMode : false             // Comes in at the account-level - will get set to true if this interface should be in tcpa-safe-mode only.
            },

            // stat objects
            agentStats:{},
            agentDailyStats: {
                totalLoginTime: 0,
                totalOffhookTime: 0,
                totalTalkTime: 0,
                currCallTime: 0
            },
            campaignStats:{},
            queueStats:{},

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
                onManualOutdial : false,            // true if agent is on a manual outdial call
                outboundManualDefaultRingtime : "30",
                pendingCallbacks : [],
                pendingDialGroupChange: 0,          // Set to Dial Group Id if we are waiting to change dial groups until agent ends call
                phoneLoginPin: "",
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
                defaultDialGroup: 0,
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
    logMessage: function(logLevel, message, data){
        var instance = UIModel.getInstance().libraryInstance;
        if(instance._db){
            var transaction = instance._db.transaction(["logger"], "readwrite");
            var store = transaction.objectStore("logger");

            var record = {
                logLevel: logLevel,
                message: message,
                dts: new Date(),
                data: data
            };

            var request = store.add(record);

        }else{
            //console.log("AgentLibrary: indexedDb not available");
        }
    },

    sendMessage: function(instance, msg) {
        if (instance.socket.readyState === 1) {
            // add message id to request map, then send message
            var msgObj = JSON.parse(msg);
            var type = msgObj.ui_request['@type'];
            var destination = msgObj.ui_request['@destination'];
            var message = "Sending " + type + " request message to " + destination;
            instance._requests[msgObj.ui_request['@message_id']] = { type: msgObj.ui_request['@type'], msg: msgObj.ui_request };
            instance.socket.send(msg);

            if(type === 'STATS'){
                utils.logMessage(LOG_LEVELS.STATS, message, msgObj);
            }else{
                utils.logMessage(LOG_LEVELS.INFO, message, msgObj);
            }

        } else {
            console.warn("AgentLibrary: WebSocket is not connected, cannot send message.");
        }
    },

    processResponse: function(instance, response)
    {
        var type = response.ui_response['@type'];
        var messageId = response.ui_response['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        var message = "Received " + type.toUpperCase() + " response message from " + dest;

        // log message response
        utils.logMessage(LOG_LEVELS.INFO, message, response);

        // Send generic on message response
        utils.fireCallback(instance, CALLBACK_TYPES.ON_MESSAGE, response);

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.AGENT_STATE:
                if(UIModel.getInstance().agentStateRequest === null){
                    UIModel.getInstance().agentStateRequest = new AgentStateRequest(response.ui_response.current_state["#text"], response.ui_response.agent_aux_state['#text']);
                }
                var stateChangeResponse = UIModel.getInstance().agentStateRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.AGENT_STATE, stateChangeResponse);
                break;
            case MESSAGE_TYPES.BARGE_IN:
                var resp = UIModel.getInstance().bargeInRequest.processResponse(response);
                var responseTo = data.ui_response['@response_to'];
                if(instance._requests[responseTo]){
                    // found corresponding request, fire registered callback for type
                    var audioState = instance._requests[responseTo].msg.audioState;
                    if(audioState === "MUTE"){
                        utils.fireCallback(instance, CALLBACK_TYPES.SILENT_MONITOR, resp);
                    }else if(audioState === "COACHING"){
                        utils.fireCallback(instance, CALLBACK_TYPES.COACH_CALL, resp);
                    }else{
                        utils.fireCallback(instance, CALLBACK_TYPES.BARGE_IN, resp);
                    }
                }else{
                    // no corresponding request, just fire FULL audio type BARGE-IN callback
                    utils.fireCallback(instance, CALLBACK_TYPES.BARGE_IN, resp);
                }
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
            case MESSAGE_TYPES.HOLD:
                var hold = UIModel.getInstance().holdRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.HOLD, hold);
                break;
            case MESSAGE_TYPES.LEAD_HISTORY:
                var history = UIModel.getInstance().leadHistoryRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.LEAD_HISTORY, history);
                break;
            case MESSAGE_TYPES.LOGIN:
                if (dest === "IS") {
                    var loginResponse = UIModel.getInstance().loginRequest.processResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.LOGIN, loginResponse);
                } else if (dest === 'IQ') {
                    var configResponse = UIModel.getInstance().configRequest.processResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.CONFIG, configResponse);

                    if(configResponse.status === "SUCCESS"){
                        // start stats interval timer, request stats every 5 seconds
                        UIModel.getInstance().statsIntervalId = setInterval(utils.sendStatsRequestMessage, 5000);
                    }
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
            case MESSAGE_TYPES.PAUSE_RECORD:
                var pauseRec = UIModel.getInstance().pauseRecordRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.PAUSE_RECORD, pauseRec);
                break;
            case MESSAGE_TYPES.RECORD:
                var record = UIModel.getInstance().recordRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.RECORD, record);
                break;
            case MESSAGE_TYPES.REQUEUE:
                var requeue = UIModel.getInstance().requeueRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.REQUEUE, requeue);
                break;
            case MESSAGE_TYPES.XFER_COLD:
                var coldXfer = UIModel.getInstance().coldXferRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.XFER_COLD, coldXfer);
                break;
            case MESSAGE_TYPES.XFER_WARM:
                var warmXfer = UIModel.getInstance().warmXferRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.XFER_WARM, warmXfer);
                break;
            case MESSAGE_TYPES.XFER_WARM_CANCEL:
                var warmXferCancel = UIModel.getInstance().warmXferCancelRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.XFER_WARM_CANCEL, warmXferCancel);
                break;

        }

    },

    processNotification: function(instance, data){
        var type = data.ui_notification['@type'];
        var messageId = data.ui_notification['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        var message = "Received " + type.toUpperCase() + " notification message from " + dest;

        // log message response
        utils.logMessage(LOG_LEVELS.INFO, message, data);

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
                var newCallNotif = new NewCallNotification();
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
            case MESSAGE_TYPES.PREVIEW_LEAD_STATE:
                var leadStateNotif = new PreviewLeadStateNotification();
                var leadStateResponse = leadStateNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.PREVIEW_LEAD_STATE, leadStateResponse);
                break;
            case MESSAGE_TYPES.PENDING_DISP:
                var pendingDispNotif = new PendingDispNotification();
                var pendingDispResponse = pendingDispNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.PENDING_DISP, pendingDispResponse);
                break;
        }
    },

    processDialerResponse: function(instance, response)
    {
        var type = response.dialer_request['@type'];
        var messageId = response.dialer_request['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        var message = "Received " + type.toUpperCase() + " dialer response message from " + dest;

        // log message response
        utils.logMessage(LOG_LEVELS.INFO, message, response);

        // Send generic on message response
        utils.fireCallback(instance, CALLBACK_TYPES.ON_MESSAGE, response);

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.PREVIEW_DIAL_ID:
                var dialResponse = UIModel.getInstance().previewDialRequest.processResponse(response);
                if(dialResponse.action.toUpperCase() === "SEARCH"){
                    utils.fireCallback(instance, CALLBACK_TYPES.LEAD_SEARCH, dialResponse);
                }else{
                    utils.fireCallback(instance, CALLBACK_TYPES.PREVIEW_FETCH, dialResponse);
                }

                break;
            case MESSAGE_TYPES.TCPA_SAFE_ID:
                var tcpaResponse = UIModel.getInstance().tcpaSafeRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.TCPA_SAFE, tcpaResponse);
                break;
        }

    },

    processStats: function(instance, data)
    {
        var type = data.ui_stats['@type'];
        var message = "Received " + type.toUpperCase() + " response message from IS";

        // log message response
        utils.logMessage(LOG_LEVELS.STATS, message, data);

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.STATS_AGENT:
                var agentStats = UIModel.getInstance().agentStatsPacket.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.STATS_AGENT, agentStats);
                break;
            case MESSAGE_TYPES.STATS_AGENT_DAILY:
                var agentDailyStats = UIModel.getInstance().agentDailyStatsPacket.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.STATS_AGENT_DAILY, agentDailyStats);
                break;
            case MESSAGE_TYPES.STATS_CAMPAIGN:
                var campaignStats = UIModel.getInstance().campaignStatsPacket.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.STATS_CAMPAIGN, campaignStats);
                break;
            case MESSAGE_TYPES.STATS_QUEUE:
                var queueStats = UIModel.getInstance().queueStatsPacket.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.STATS_QUEUE, queueStats);
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
     *          },
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
     *
     *   OR
     *
     *   "outdial_dispositions": {
     *       "@type": "GATE",
     *       "disposition": {
     *          {
     *           "@contact_forwarding": "false",
     *           "@disposition_id": "926",
     *           "@is_complete": "1",
     *           "@require_note": "0",
     *           "@save_survey": "1",
     *           "@xfer": "0",
     *           "#text": "One B"
     *          }
     *      }
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
                        if(Object.keys(itemsRaw[i][key]).length === 1 && itemsRaw[i][key]['#text']) {
                            // only one property - #text attribute
                            item[formattedKey] = itemsRaw[i][key]['#text'];
                        }else if(Object.keys(itemsRaw[i][key]).length === 0){
                            // dealing with empty property
                            item[formattedKey] = "";
                        }else {
                            // make recursive call
                            if(Array.isArray(itemsRaw[key]) || Object.keys(itemsRaw[i][key]).length > 1){
                                var newIt = [];
                                newIt = utils.processResponseCollection(response[groupProp], itemProp, key, textName);
                                if(formattedKey.substr(formattedKey.length - 1) !== 's') {
                                    item[formattedKey + 's'] = newIt;
                                }else{
                                    item[formattedKey] = newIt;
                                }
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
                    if(itemsRaw[prop]['#text'] && Object.keys(itemsRaw[prop]).length === 1) {
                        // dealing only with #text element
                        item[formattedProp] = itemsRaw[prop]['#text'];
                    }else if(Object.keys(itemsRaw[prop]).length === 0){
                        // dealing with empty property
                        item[formattedProp] = "";
                    }else{
                        // make recursive call
                        if(Array.isArray(itemsRaw[prop]) || Object.keys(itemsRaw[prop]).length > 1){
                            var newIt = [];
                            newIt = utils.processResponseCollection(response[groupProp], itemProp, prop, textName);
                            if(formattedProp.substr(formattedProp.length - 1) !== 's'){
                                item[formattedProp + 's'] = newIt;
                            }else{
                                item[formattedProp] = newIt;
                            }
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
        if (typeof type !== 'undefined' && typeof instance.callbacks[type] === 'function') {
            instance.callbacks[type].call(instance, response);
        }
    },

    setCallback: function(instance, type, callback) {
        if (typeof type !== 'undefined' && typeof callback !== 'undefined') {
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
        if(o && o['#text']){
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
    },

    // safely check if property exists and return empty string
    // instead of undefined if it doesn't exist
    // convert "TRUE" | "FALSE" to boolean
    getAttribute: function(obj,prop){
        var o = obj[prop];
        if(o && o[prop]){
            if(o[prop].toUpperCase() === "TRUE"){
                return true;
            }else if(o[prop].toUpperCase() === "FALSE"){
                return false;
            }else{
                return o[prop] || "";
            }
        }else{
            return "";
        }
    },

    // Parses a string of key value pairs and returns an Array of KeyValue objects.
    // @param str The string of keyvalue pairs to parse
    // @param outerDelimiter The delimiter that separates each keyValue pair
    // @param innerDelimiter The delimiter that separates each key from its value
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
    },


    // called every 30 seconds letting intelliQueue know
    // not to archive the call so dispositions and other call
    // clean up actions can happen
    sendPingCallMessage: function(){
        UIModel.getInstance().pingCallRequest = new PingCallRequest();
        var msg = UIModel.getInstance().pingCallRequest.formatJSON();
        utils.sendMessage(UIModel.getInstance().libraryInstance, msg);
    },

    // called every 5 seconds to request stats from IntelliServices
    sendStatsRequestMessage: function(){
        UIModel.getInstance().statsRequest = new StatsRequest();
        var msg = UIModel.getInstance().statsRequest.formatJSON();
        utils.sendMessage(UIModel.getInstance().libraryInstance, msg);
    }
};


// CONSTANTS


/*jshint esnext: true */
const LOG_LEVELS ={
    "DEBUG":"debug",
    "STATS":"stats",
    "INFO":"info",
    "WARN":"warn",
    "ERROR":"error"
};

/**
 * @memberof AgentLibrary
 * Possible callback types:
 * <li>"addSessionNotification"</li>
 * <li>"agentStateResponse"</li>
 * <li>"bargeInResponse"</li>
 * <li>"closeResponse"</li>
 * <li>"coachResponse"</li>
 * <li>"configureResponse"</li>
 * <li>"callNotesResponse"</li>
 * <li>"callbacksPendingResponse"</li>
 * <li>"callbackCancelResponse"</li>
 * <li>"campaignDispositionsResponse"</li>
 * <li>"dialGroupChangeNotification"</li>
 * <li>"dialGroupChangePendingNotification"</li>
 * <li>"dropSessionNotification"</li>
 * <li>"earlyUiiNotification"</li>
 * <li>"endCallNotification"</li>
 * <li>"gatesChangeNotification"</li>
 * <li>"genericNotification"</li>
 * <li>"genericResponse"</li>
 * <li>"holdResponse"</li>
 * <li>"leadSearchResponse"</li>
 * <li>"loginResponse"</li>
 * <li>"logoutResponse"</li>
 * <li>"monitorResponse"</li>
 * <li>"newCallNotification"</li>
 * <li>"offhookInitResponse"</li>
 * <li>"offhookTermNotification"</li>
 * <li>"openResponse"</li>
 * <li>"pauseRecordResponse"</li>
 * <li>"pendingDispNotification"</li>
 * <li>"previewFetchResponse"</li>
 * <li>"previewLeadStateNotification"</li>
 * <li>"requeueResponse"</li>
 * <li>"agentStats"</li>
 * <li>"agentDailyStats"</li>
 * <li>"campaignStats"</li>
 * <li>"queueStats"</li>
 * <li>"tcpaSafeResponse"</li>
 * <li>"coldXferResponse"</li>
 * <li>"warmXferResponse"</li>
 * @type {object}
 */
const CALLBACK_TYPES = {
    "ADD_SESSION":"addSessionNotification",
    "AGENT_STATE":"agentStateResponse",
    "BARGE_IN":"bargeInResponse",
    "CLOSE_SOCKET":"closeResponse",
    "COACH_CALL":"coachResponse",
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
    "HOLD":"holdResponse",
    "LOG_RESULTS":"logResultsResponse",
    "LOGIN":"loginResponse",
    "LOGOUT":"logoutResponse",
    "NEW_CALL":"newCallNotification",
    "LEAD_HISTORY":"leadHistoryResponse",
    "LEAD_SEARCH":"leadSearchResponse",
    "OFFHOOK_INIT":"offhookInitResponse",
    "OFFHOOK_TERM":"offhookTermNotification",
    "OPEN_SOCKET":"openResponse",
    "PAUSE_RECORD":"pauseRecordResponse",
    "PENDING_DISP":"pendingDispNotification",
    "PREVIEW_FETCH":"previewFetchResponse",
    "PREVIEW_LEAD_STATE":"previewLeadStateNotification",
    "REQUEUE":"requeueResponse",
    "SILENT_MONITOR":"monitorResponse",
    "STATS_AGENT":"agentStats",
    "STATS_AGENT_DAILY":"agentDailyStats",
    "STATS_CAMPAIGN":"campaignStats",
    "STATS_QUEUE":"queueStats",
    "TCPA_SAFE":"tcpaSafeResponse",
    "XFER_COLD":"coldXferResponse",
    "XFER_WARM":"warmXferResponse"
};

const MESSAGE_TYPES = {
    "ADD_SESSION":"ADD-SESSION",
    "BARGE_IN":"BARGE-IN",
    "AGENT_STATE":"AGENT-STATE",
    "CALL_NOTES":"CALL-NOTES",
    "CALLBACK_PENDING":"PENDING-CALLBACKS",
    "CALLBACK_CANCEL":"CANCEL-CALLBACK",
    "CAMPAIGN_DISPOSITIONS":"CAMPAIGN-DISPOSITIONS",
    "DIAL_GROUP_CHANGE":"DIAL_GROUP_CHANGE",
    "DIAL_GROUP_CHANGE_PENDING":"DIAL_GROUP_CHANGE_PENDING",
    "DROP_SESSION":"DROP-SESSION",
    "EARLY_UII":"EARLY_UII",
    "END_CALL":"END-CALL",
    "GATES_CHANGE":"GATES_CHANGE",
    "GENERIC":"GENERIC",
    "HANGUP":"HANGUP",
    "HOLD":"HOLD",
    "INBOUND_DISPOSITION":"INBOUND-DISPOSITION",
    "LEAD_HISTORY":"LEAD-HISTORY",
    "LOGIN":"LOGIN",
    "LOGOUT":"LOGOUT",
    "NEW_CALL":"NEW-CALL",
    "OFFHOOK_INIT":"OFF-HOOK-INIT",
    "OFFHOOK_TERM":"OFF-HOOK-TERM",
    "ON_MESSAGE":"ON-MESSAGE",
    "ONE_TO_ONE_OUTDIAL":"ONE-TO-ONE-OUTDIAL",
    "ONE_TO_ONE_OUTDIAL_CANCEL":"ONE-TO-ONE-OUTDIAL-CANCEL",
    "OUTDIAL_DISPOSITION":"OUTDIAL-DISPOSITION",
    "PAUSE_RECORD":"PAUSE-RECORD",
    "PING_CALL":"PING-CALL",
    "PREVIEW_DIAL":"PREVIEW-DIAL",
    "PENDING_DISP":"PENDING_DISP",
    "PREVIEW_DIAL_ID":"PREVIEW_DIAL",
    "PREVIEW_LEAD_STATE":"PREVIEW-LEAD-STATE",
    "RECORD":"RECORD",
    "REQUEUE":"RE-QUEUE",
    "STATS":"STATS",
    "STATS_AGENT":"AGENT",
    "STATS_AGENT_DAILY":"AGENTDAILY",
    "STATS_CAMPAIGN":"CAMPAIGN",
    "STATS_QUEUE":"GATE",
    "TCPA_SAFE":"TCPA-SAFE",
    "TCPA_SAFE_ID":"TCPA_SAFE",
    "XFER_COLD":"COLD-XFER",
    "XFER_WARM":"WARM-XFER",
    "XFER_WARM_CANCEL":"WARM-XFER-CANCEL"
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
     * @property {object} _db Internal IndexedDB used for logging
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

        // set instance on model object
        UIModel.getInstance().libraryInstance = this;

        // initialize indexedDB for logging
        this.openLogger();

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
     * Get latest Warm Transfer Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getWarmTransferRequest = function() {
        return UIModel.getInstance().warmXferRequest;
    };
    /**
     * Get latest Cold Transfer Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getColdTransferRequest = function() {
        return UIModel.getInstance().coldXferRequest;
    };
    /**
     * Get latest Warm Transfer Cancel Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getWarmTransferCancelRequest = function() {
        return UIModel.getInstance().warmXferCancelRequest;
    };
    /**
     * Get latest Requeue Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getRequeueRequest = function() {
        return UIModel.getInstance().requeueRequest;
    };
    /**
     * Get latest Barge-In Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getBargeInRequest = function() {
        return UIModel.getInstance().bargeInRequest;
    };
    /**
     * Get latest Hold Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getHoldRequest = function() {
        return UIModel.getInstance().holdRequest;
    };
    /**
     * Get latest Pause Record Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getPauseRecordRequest = function() {
        return UIModel.getInstance().pauseRecordRequest;
    };
    /**
     * Get latest Record Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getRecordRequest = function() {
        return UIModel.getInstance().recordRequest;
    };
    /**
     * Get latest Agent Stats object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentStatsPacket = function() {
        return UIModel.getInstance().agentStatsPacket;
    };
    /**
     * Get latest Agent Daily Stats object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentDailyStatsPacket = function() {
        return UIModel.getInstance().agentDailyStatsPacket;
    };
    /**
     * Get latest Queue Stats object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getQueueStatsPacket = function() {
        return UIModel.getInstance().queueStatsPacket;
    };
    /**
     * Get latest Campaign Stats object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCampaignStatsPacket = function() {
        return UIModel.getInstance().campaignStatsPacket;
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
    /**
     * Get the Agent stats object containing the current state of agent stats
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentStats = function() {
        return UIModel.getInstance().agentStats;
    };
    /**
     * Get the Agent Daily stats object containing the current state of agent daily stats
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentDailyStats = function() {
        return UIModel.getInstance().agentDailyStats;
    };
    /**
     * Get the Queue stats object containing the current state of queue stats
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getQueueStats = function() {
        return UIModel.getInstance().queueStats;
    };
    /**
     * Get the Campaign stats object containing the current state of campaign stats
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCampaignStats = function() {
        return UIModel.getInstance().campaignStats;
    };

}

function initAgentLibrarySocket (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    AgentLibrary.prototype.openSocket = function(callback){
        var instance = this;
        utils.setCallback(instance, CALLBACK_TYPES.OPEN_SOCKET, callback);
        if("WebSocket" in context){
            var socketDest = UIModel.getInstance().applicationSettings.socketDest;
            utils.logMessage(LOG_LEVELS.DEBUG, "Attempting to open socket connection to " + socketDest, "");
            instance.socket = new WebSocket(socketDest);

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
                }else if(data.ui_stats){
                    utils.processStats(instance, data);
                }
            };

            instance.socket.onclose = function(){
                utils.fireCallback(instance, CALLBACK_TYPES.CLOSE_SOCKET, '');
                UIModel.getInstance().applicationSettings.socketConnected = false;

                // cancel stats timer
                clearInterval(UIModel.getInstance().statsIntervalId);
                UIModel.getInstance().statsIntervalId = null;
            };
        }else{
            utils.logMessage(LOG_LEVELS.WARN, "WebSocket NOT supported by your Browser", "");
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
    AgentLibrary.prototype.offhookTerm = function(){
        UIModel.getInstance().offhookTermRequest = new OffhookTermRequest();
        var msg = UIModel.getInstance().offhookTermRequest.formatJSON();
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

    /**
     * Request stats messages to be sent every 5 seconds. The stats responses will be sent as
     * four possible callback types: agentStats, agentDailyStats, campaignStats, or queueStats
     * @memberof AgentLibrary
     */
    AgentLibrary.prototype.requestStats = function(){
        // start stats interval timer, request stats every 5 seconds
        UIModel.getInstance().statsIntervalId = setInterval(utils.sendStatsRequestMessage, 5000);
    };

    /**
     * Reconnect the agent session, similar to configureAgent, but doesn't reset set all
     * configure values if not needed.
     * @memberof AgentLibrary
     */
    AgentLibrary.prototype.reconnect = function(){
        UIModel.getInstance().reconnectRequest = new ReconnectRequest();
        var msg = UIModel.getInstance().reconnectRequest.formatJSON();

        UIModel.getInstance().statsIntervalId = setInterval(utils.sendStatsRequestMessage, 5000);
    };

}

function initAgentLibraryCall (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Barge in on a call, can hear all parties and be heard by all
     * @memberof AgentLibrary
     * @param {function} [callback=null] Callback function when barge in response received
     */
    AgentLibrary.prototype.bargeIn = function(callback){
        UIModel.getInstance().bargeInRequest = new BargeInRequest("FULL");
        var msg = UIModel.getInstance().bargeInRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.BARGE_IN, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Add a coaching session to the call, can hear all parties but only able to speak on agent channel
     * @memberof AgentLibrary
     * @param {function} [callback=null] Callback function when coaching session response received
     */
    AgentLibrary.prototype.coach = function(callback){
        UIModel.getInstance().bargeInRequest = new BargeInRequest("COACHING");
        var msg = UIModel.getInstance().bargeInRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.COACH_CALL, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Transfer to another number and end the call for the original agent (cold transfer).
     * @memberof AgentLibrary
     * @param {number} dialDest Number to transfer to
     * @param {number} [callerId=""] Caller Id for caller (DNIS)
     * @param {function} [callback=null] Callback function when cold transfer response received
     */
    AgentLibrary.prototype.coldXfer = function(dialDest, callerId, callback){
        UIModel.getInstance().coldXferRequest = new XferColdRequest(dialDest, callerId);
        var msg = UIModel.getInstance().coldXferRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.XFER_COLD, callback);
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

        // cancel ping call timer
        clearInterval(UIModel.getInstance().pingIntervalId);
        UIModel.getInstance().pingIntervalId = null;
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
     * Place a call on hold
     * @memberof AgentLibrary
     * @param {boolean} holdState Whether we are putting call on hold or taking off hold - values true | false
     * @param {function} [callback=null] Callback function when hold response received
     */
    AgentLibrary.prototype.hold = function(holdState, callback){
        UIModel.getInstance().holdRequest = new HoldRequest(holdState);
        var msg = UIModel.getInstance().holdRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.HOLD, callback);
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
     * Pause call recording
     * @memberof AgentLibrary
     * @param {boolean} record Whether we are recording or not
     * @param {function} [callback=null] Callback function when pause record response received
     */
    AgentLibrary.prototype.pauseRecord = function(record, callback){
        UIModel.getInstance().pauseRecordRequest = new PauseRecordRequest(record);
        var msg = UIModel.getInstance().pauseRecordRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.PAUSE_RECORD, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a preview dial request to call lead based on request id. Call previewFetch method first to get request id.
     * @memberof AgentLibrary
     * @param {number} requestId Pending request id sent back with lead, required to dial lead.
     */
    AgentLibrary.prototype.previewDial = function(requestId){
        UIModel.getInstance().previewDialRequest = new PreviewDialRequest("", [], requestId);
        var msg = UIModel.getInstance().previewDialRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a message to fetch preview dialable leads
     * @memberof AgentLibrary
     * @param {array} [searchFields=[]] Array of objects with key/value pairs for search parameters
     * e.g. [ {key: "name", value: "Geoff"} ]
     * @param {function} [callback=null] Callback function when preview fetch completed, returns matched leads
     */
    AgentLibrary.prototype.previewFetch = function(searchFields, callback){
        UIModel.getInstance().previewDialRequest = new PreviewDialRequest("", searchFields, "");
        var msg = UIModel.getInstance().previewDialRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.PREVIEW_FETCH, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Pull back leads that match search criteria
     * @memberof AgentLibrary
     * @param {array} [searchFields=[]] Array of objects with key/value pairs for search parameters
     * e.g. [ {key: "name", value: "Geoff"} ]
     * @param {function} [callback=null] Callback function when lead search completed, returns matched leads
     */
    AgentLibrary.prototype.serachLeads = function(searchFields, callback){
        UIModel.getInstance().previewDialRequest = new PreviewDialRequest("search", searchFields, "");
        var msg = UIModel.getInstance().previewDialRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.LEAD_SEARCH, callback);
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

    /**
     * Add a silent monitor session to a call, can hear all channels but can't be heard by any party
     * @memberof AgentLibrary
     * @param {function} [callback=null] Callback function when silent monitor response received
     */
    AgentLibrary.prototype.monitor = function(callback){
        UIModel.getInstance().bargeInRequest = new BargeInRequest("MUTE");
        var msg = UIModel.getInstance().bargeInRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.SILENT_MONITOR, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Toggle call recording based on passed in boolean true | false
     * @memberof AgentLibrary
     * @param {boolean} record Whether we are recording or not
     * @param {function} [callback=null] Callback function when record response received
     */
    AgentLibrary.prototype.record = function(record, callback){
        UIModel.getInstance().recordRequest = new RecordRequest(record);
        var msg = UIModel.getInstance().recordRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.RECORD, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Requeue a call
     * @memberof AgentLibrary
     * @param {number} queueId Queue Id to send the call to
     * @param {number} skillId Skill Id for the requeued call
     * @param {boolean} maintain Whether or not to maintain the current agent
     * @param {function} [callback=null] Callback function when requeue response received
     */
    AgentLibrary.prototype.requeueCall = function(queueId, skillId, maintain, callback){
        UIModel.getInstance().requeueRequest = new RequeueRequest(queueId, skillId, maintain);
        var msg = UIModel.getInstance().requeueRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.REQUEUE, callback);
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
     * Transfer to another number while keeping the original agent on the line (warm transfer).
     * @memberof AgentLibrary
     * @param {number} dialDest Number to transfer to
     * @param {number} [callerId=""] Caller Id for caller (DNIS)
     * @param {function} [callback=null] Callback function when warm transfer response received
     */
    AgentLibrary.prototype.warmXfer = function(dialDest, callerId, callback){
        UIModel.getInstance().warmXferRequest = new XferWarmRequest(dialDest, callerId);
        var msg = UIModel.getInstance().warmXferRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.XFER_WARM, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Cancel a warm transfer
     * @memberof AgentLibrary
     * @param {number} dialDest Number that was transfered to
     */
    AgentLibrary.prototype.warmXferCancel = function(dialDest){
        UIModel.getInstance().warmXferCancelRequest = new XferWarmCancelRequest(dialDest);
        var msg = UIModel.getInstance().warmXferCancelRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

}

function initAgentLibraryLead (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Get the history for a given lead
     * @memberof AgentLibrary
     * @param {function} [callback=null] Callback function when lead history response received
     */
    AgentLibrary.prototype.leadHistory = function(leadId, callback){
        UIModel.getInstance().leadHistoryRequest = new LeadHistoryRequest(leadId);
        var msg = UIModel.getInstance().leadHistoryRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.LEAD_HISTORY, callback);
        utils.sendMessage(this, msg);
    };

}

function initAgentLibraryLogger (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    AgentLibrary.prototype.openLogger = function(){
        var instance = this;

        if("indexedDB" in context){
            // Open database
            var dbRequest = indexedDB.open("AgentLibraryLogging", 5); // version number

            dbRequest.onerror = function(event){
                console.error("Error requesting DB access");
            };

            dbRequest.onsuccess = function(event){
                instance._db = event.target.result;

                //prune items older than 2 days
                instance.purgeLog();

                instance._db.onerror = function(event){
                    // Generic error handler for all errors targeted at this database requests
                    console.error("AgentLibrary: Database error - " + event.target.errorCode);
                };

                instance._db.onsuccess = function(event){
                    console.log("AgentLibrary: Successful logging of record");
                };
            };

            // This event is only implemented in recent browsers
            dbRequest.onupgradeneeded = function(event){
                instance._db = event.target.result;

                // Create an objectStore to hold log information. Key path should be unique
                if(!instance._db.objectStoreNames.contains("logger")){
                    var objectStore = instance._db.createObjectStore("logger", { autoIncrement: true });

                    // simple indicies: index name, index column path
                    objectStore.createIndex("logLevel", "logLevel", {unique: false});
                    objectStore.createIndex("dts", "dts", {unique: false});

                    // index for logLevel and date range
                    var name = "levelAndDate";
                    var keyPath = ['logLevel','dts'];
                    objectStore.createIndex(name, keyPath, {unique: false});
                }

            };

        }else{
            console.warn("AgentLibrary: indexedDB NOT supported by your Browser.");
        }
    };


    /**
     * Purge records older than 2 days from the AgentLibrary log
     * @memberof AgentLibrary
     */
    AgentLibrary.prototype.purgeLog = function(){
        var instance = this;

        if(instance._db){
            var transaction = instance._db.transaction(["logger"], "readwrite");
            var objectStore = transaction.objectStore("logger");
            var dateIndex = objectStore.index("dts");
            var endDate = new Date();
            endDate.setDate(endDate.getDate() - 2); // two days ago

            var range = IDBKeyRange.upperBound(endDate);
            var destroy = dateIndex.openCursor(range).onsuccess = function(event){
                var cursor = event.target.result;
                if(cursor){
                    objectStore.delete(cursor.primaryKey);
                    cursor.continue();
                }

            };
        }
    };

    /**
     * Clear the AgentLibrary log by emptying the IndexedDB object store
     * @memberof AgentLibrary
     */
    AgentLibrary.prototype.clearLog = function(){
        var instance = this;

        var transaction = instance._db.transaction(["logger"], "readwrite");
        var objectStore = transaction.objectStore("logger");

        var objectStoreRequest = objectStore.clear();

        objectStoreRequest.onsuccess = function(event){
            console.log("AgentLibrary: logger database cleared");
        };
    };

    AgentLibrary.prototype.deleteDB = function(){
        var DBDeleteRequest = indexedDB.deleteDatabase("AgentLibraryLogging");

         DBDeleteRequest.onerror = function(event) {
         console.log("Error deleting database.");
         };

         DBDeleteRequest.onsuccess = function(event) {
         console.log("Database deleted successfully");
         };
    };

    AgentLibrary.prototype.getLogRecords = function(logLevel, startDate, endDate, callback){
        logLevel = logLevel || "";
        var instance = this;
        var transaction = instance._db.transaction(["logger"], "readonly");
        var objStore = transaction.objectStore("logger");
        var index = null,
            cursor = null,
            range = null;
        utils.setCallback(instance, CALLBACK_TYPES.LOG_RESULTS, callback);

        if(logLevel.toUpperCase() !== "ALL") { // looking for specific log level type
            if(startDate && endDate){
                var lowerBound = [logLevel.toLowerCase(), startDate];
                var upperBound = [logLevel.toLowerCase(), endDate];
                range = IDBKeyRange.bound(lowerBound,upperBound);
            }else if(startDate){
                range = IDBKeyRange.lowerBound([logLevel.toLowerCase(), startDate]);
            }else if(endDate){
                range = IDBKeyRange.upperBound([logLevel.toLowerCase(), endDate]);
            }

            if(range !== null){
                // with the provided date range
                var levelAndDateReturn = [];
                index = objStore.index("levelAndDate");
                index.openCursor(range).onsuccess = function(event){
                    cursor = event.target.result;
                    if(cursor){
                        levelAndDateReturn.push(cursor.value);
                        cursor.continue();
                    }
                    utils.fireCallback(instance, CALLBACK_TYPES.LOG_RESULTS, levelAndDateReturn);
                };

            }else{
                // no date range specified, return all within log level
                var logLevelReturn = [];
                index = objStore.index("logLevel");
                index.openCursor(logLevel).onsuccess = function(event){
                    cursor = event.target.result;
                    if(cursor){
                        logLevelReturn.push(cursor.value);
                        cursor.continue();
                    }
                    utils.fireCallback(instance, CALLBACK_TYPES.LOG_RESULTS, logLevelReturn);
                };

            }
        } else { // give us all log level types

            if(startDate && endDate){
                range = IDBKeyRange.bound(startDate,endDate);
            }else if(startDate){
                range = IDBKeyRange.lowerBound(startDate);
            }else if(endDate){
                range = IDBKeyRange.upperBound(endDate);
            }

            if(range !== null){
                // with the provided date range
                var dtsReturn = [];
                index = objStore.index("dts");

                index.openCursor(range).onsuccess = function(event){
                    cursor = event.target.result;
                    if(cursor){
                        dtsReturn.push(cursor.value);
                        cursor.continue();
                    }
                    utils.fireCallback(instance, CALLBACK_TYPES.LOG_RESULTS, dtsReturn);
                };
            }else{
                // no date range specified, return all records
                var allValsReturn = [];
                objStore.openCursor().onsuccess = function(event){
                    cursor = event.target.result;
                    if(cursor){
                        allValsReturn.push(cursor.value);
                        cursor.continue();
                    }
                    utils.fireCallback(instance, CALLBACK_TYPES.LOG_RESULTS, allValsReturn);
                };
            }

        }

        return null;

    };

}
var initAgentLibrary = function (context) {

    initAgentLibraryCore(context);
    initAgentLibrarySocket(context);
    initAgentLibraryAgent(context);
    initAgentLibraryCall(context);
    initAgentLibraryLead(context);
    initAgentLibraryLogger(context);

    return context.AgentLibrary;
};

if (typeof define === 'function' && define.amd) {
    // Expose Library as an AMD module if it's loaded with RequireJS or
    // similar.
    //console.log("AgentLibrary: using AMD");
    define(function () {
        return initAgentLibrary({});
    });
} else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    //console.log("AgentLibrary: Using Node");
    module.exports = initAgentLibrary(this);
} else {
    // Load Library normally (creating a Library global) if not using an AMD
    // loader.
    //console.log("AgentLibrary: Not using AMD");
    initAgentLibrary(this);
}
} (this));
