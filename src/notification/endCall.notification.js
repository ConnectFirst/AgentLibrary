
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
        duration = notification.ui_notification.term_party["#text"];
    }
    if(notification.ui_notification.term_reason){
        duration = notification.ui_notification.term_reason["#text"];
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

        // reset pending dial group variables
        model.agentSettings.pendingDialGroupChange = 0;
        model.agentSettings.updateDGFromAdminUI = false;

        // send login update request
        this.libInstance.configureAgent(model.configRequest.queueIds, model.configRequest.chatIds, model.configRequest.skillProfileId, model.configRequest.dialGroupId, model.configRequest.dialDest, model.configRequest.updateFromAdminUI);
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
