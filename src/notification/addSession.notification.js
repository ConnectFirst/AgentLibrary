
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
    var sessionType = utils.getText(notif, "session_type"),
        allowControl = utils.getText(notif, "allow_control"),
        sessionId = utils.getText(notif, "session_id"),
        uii = utils.getText(notif, "uii");
    if(sessionId !== '1' && sessionAgentId !== model.agentSettings.agentId && allowControl) {
        if(sessionType === 'OUTBOUND' || sessionType === 'AGENT') {
            var destination = utils.getText(notif, "phone");
            if(sessionType === 'AGENT' || sessionAgentId !== '') {
                destination = utils.getText(notif, "agent_name");
            }

            model.transferSessions[sessionId] = {
                sessionId: sessionId,
                destination: destination,
                uii: uii
            };
        }
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
    formattedResponse.transferSessions = model.transferSessions;

    return formattedResponse;
};
