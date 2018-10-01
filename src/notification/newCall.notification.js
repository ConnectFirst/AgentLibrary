
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
 *      "ani":{"#text":"9548298548"},
 *      "dnis":{},
 *      "dial_dest":{"#text":"sip:+16789050673@sip.connectfirst.com"},
 *      "call_type":{"#text":"OUTBOUND"},
 *      "queue_dts":{"#text":"2010-02-09 11:33:53"},
 *      "queue_time":{"#text":"-1"},
 *      "agent_id":{"#text":"657"},
 *      "app_url":{},
 *      "is_monitoring":{"#text":"FALSE"},
 *      "script_id":{},
 *      "script_version":{},
 *      "survey_id":{},
 *      "survey_pop_type":{"#text":"SUPPRESS"},
 *      "message":{},
 *      "agent_recording":{"@default":"ON","@pause":"10","#text":"TRUE"},
 *      "hangup_on_disposition":{"#text":"FALSE"},
 *      "gate":{
 *          "@number":"17038",
 *          "name":{"#text":"AM Campaign"},
 *          "description":{}
 *      },
 *      "outdial_dispositions":{
 *          "@type":"CAMPAIGN|GATE",
 *          "disposition":[
 *              { "@contact_forwarding":"FALSE", "@disposition_id":"20556", "@is_complete":"1", "@is_default"="0", "@require_note"="0", "@save_survey"="1", "@xfer"="0", "#text":"Not Available"},
 *              { "@contact_forwarding":"FALSE", "@disposition_id":"20559", "@is_complete":"1", "@is_default"="1", "@require_note"="1", "@save_survey"="1", "@xfer"="0", #text":"Transfer Not Available"}
 *          ]
 *      },
 *      "requeue_shortcuts":{
 *          "requeue_shortcut":[
 *              { "@gate_id":"2", "@name":"test queue" "@skill_id":""}
 *          ]
 *      },
 *      "baggage":{
 *          "@allow_updates":"TRUE",
 *          "@show_lead_passes":"TRUE",
 *          "@show_list_name":"TRUE",
 *          "aux_phone":{},
 *          "aux_greeting":{},
 *          "aux_external_url":{},
 *          "aux_data1":{"#text":"BMAK"},
 *          "aux_data2":{"#text":"BMAK-041653-934"},
 *          "aux_data3":{"#text":"Call Ctr 1"},
 *          "aux_data4":{},
 *          "aux_data5":{},
 *          "extern_id":{"#text":"9548298548"},
 *          "lead_id":{"#text":"64306"},
 *          "lead_passes":{"#text":"1"},
 *          "first_name":{"#text":"Ryant"},
 *          "last_name":{"#text":"Taylor"},
 *          "mid_name":{},
 *          "address1":{"#text":"8010 Maryland Ave"},
 *          "address2":{},
 *          "city":{"#text":"Cleveland"},
 *          "state":{"#text":"OH"},
 *          "zip":{"#text":"44105"},
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
        allowManualInternationalTransfer: utils.getText(notif,'allow_manual_international_transfer'),
        allowDirectAgentTransfer: utils.getText(notif,'allow_direct_agent_transfer'),
        allowHangup: utils.getText(notif,'allow_hangup'),
        allowRequeue: utils.getText(notif,'allow_requeue'),
        allowEndCallForEveryone: utils.getText(notif,'allow_endcallforeveryone'),
        scriptId: utils.getText(notif,'script_id'),
        scriptVersion: utils.getText(notif,'script_version'),
        surveyId: utils.getText(notif,'survey_id'),
        surveyPopType: utils.getText(notif,'survey_pop_type'),
        requeueType: utils.getText(notif,'requeue_type'),
        hangupOnDisposition: utils.getText(notif,'hangup_on_disposition')
    };

    // set collection values
    newCall.queue = utils.processResponseCollection(notification, 'ui_notification', 'gate')[0];
    newCall.agentRecording = utils.processResponseCollection(notification, 'ui_notification', 'agent_recording', 'agentRecording')[0];
    newCall.outdialDispositions = utils.processResponseCollection(notification, 'ui_notification', 'outdial_dispositions', 'disposition')[0];
    newCall.requeueShortcuts = utils.processResponseCollection(notification, 'ui_notification', 'requeue_shortcuts', 'requeueShortcut')[0] || [];
    newCall.baggage = utils.processResponseCollection(notification, 'ui_notification', 'baggage')[0];
    newCall.surveyResponse = utils.processResponseCollection(notification, 'ui_notification', 'survey_response', 'detail')[0];
    newCall.scriptResponse = {};
    newCall.transferPhoneBook = utils.processResponseCollection(notification, 'ui_notification', 'transfer_phone_book')[0];
    newCall.lead = utils.processResponseCollection(notification, 'ui_notification', 'lead')[0];

    // parse extra data correctly
    try {
        if(notif.lead && notif.lead.extra_data) {
            delete newCall.lead.extraDatas;
            newCall.lead.extraData = {};
            for(var key in notif.lead.extra_data) {
                newCall.lead.extraData[key] = notif.lead.extra_data[key]['#text'];
            }
        }
    } catch(e) {
        console.warn('error parsing new call lead extra data: ' + e);
    }
    // set saved script response if present
    try{
        var savedModel = JSON.parse(notif.script_result["#text"]).model;
        var results = {};
        var keys = Object.keys(savedModel);
        for(var idx = 0; idx < keys.length; idx++){
            var key = keys[idx];
            var value = savedModel[key].value;
            results[key] = value;
        }
        newCall.scriptResponse = results;
    }catch(err){}

    // fix phonebook format
    if(newCall.transferPhoneBook && newCall.transferPhoneBook.entrys){
        newCall.transferPhoneBook = newCall.transferPhoneBook.entrys;
    }

    // fix requeue shortcuts
    if(newCall.requeueShortcuts && newCall.requeueShortcuts.requeueShortcuts){
        newCall.requeueShortcuts = newCall.requeueShortcuts.requeueShortcuts;
    }

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
            disp.isDefault = disp.isDefault === "1";
        }
    }

    // Build token map
    model.callTokens = buildCallTokenMap(notif, newCall);
    newCall.baggage = model.callTokens; // add all tokens to baggage

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


function buildCallTokenMap(notif, newCall){
    var model = UIModel.getInstance();
    var tokens = newCall.baggage || {}; // seed with baggage values
    if(notif.baggage && notif.baggage.generic_key_value_pairs){
        var keyValuePairs = [];
        var keyValuePairsStr = utils.getText(notif.baggage, 'generic_key_value_pairs');
        if (keyValuePairsStr.length > 0){
            keyValuePairs = utils.parseKeyValuePairsFromString(keyValuePairsStr, "|", "::");
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
            tokens["sourceId"] = newCall.queue.number || "";
            tokens["sourceName"] = newCall.queue.name || "";
            tokens["sourceDesc"] = newCall.queue.description || "";

            if(newCall.queue.isCampaign === "1" || newCall.queue.isCampaign === true){
                tokens["sourceType"] = "OUTBOUND";
            }else{
                tokens["sourceType"] = "INBOUND";
            }
        }else{
            tokens["sourceId"] = "0";
            tokens["sourceType"] = "MANUAL";
            tokens["sourceName"] = "";
            tokens["sourceDesc"] = "";
        }
    }catch(any){
        console.error("There was an error processing source tokenization", + any);
    }

    try{
        tokens["agentFirstName"] = model.agentSettings.firstName;
        tokens["agentLastName"] = model.agentSettings.lastName;
        tokens["agentExternalId"] = model.agentSettings.externalAgentId;
        tokens["agentType"] = model.agentSettings.agentType;
        tokens["agentEmail"] = model.agentSettings.email;
        tokens["agentUserName"] = model.agentSettings.username;
    }catch(any){
        console.error("There was an error parsing tokens for agent info. ", any);
    }

    return tokens;
}

function isCampaign(gate){
    if (gate && gate.isCampaign){
        return gate.isCampaign === "1" || gate.isCampaign === true;
    }
    return false;
}
