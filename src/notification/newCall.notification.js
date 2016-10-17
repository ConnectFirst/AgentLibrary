
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
