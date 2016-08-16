
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
