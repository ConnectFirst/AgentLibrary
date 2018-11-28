
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


    // start ping call interval timer, sends message every 30 seconds
    // if this is not a manual outdial and we are not suppressing disposition pop
    if(model.currentCall.outdialDispositions && model.currentCall.outdialDispositions.dispositions && model.currentCall.outdialDispositions.dispositions.length > 0 && model.currentCall.surveyPopType !== "SUPPRESS"){
        model.pingIntervalId = setInterval(utils.sendPingCallMessage, 30000);
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
