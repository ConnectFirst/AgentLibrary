
var AddChatSessionNotification = function() {

};

/*
 * This class is responsible for handling "ADD-CHAT-SESSION" packets from IntelliQueue.
 *
 * {
 *   "ui_notification": {
 *       "@message_id": "IQ982008082918151403727",
 *       "@response_to": "",
 *       "@type": "ADD-CHAT-SESSION",
 *       "session_id": { "#text": "2" },
 *       "uii": { "#text": "200808291814560000000900016558" },
 *       "session_type": { "#text": "AGENT|MONITORING" },
 *       "agent_id": { "#text": "1856" } // null unless monitor type,
 *       "transcript": { }
 *   }
 *  }
 */
AddChatSessionNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;
    var formattedResponse = utils.buildDefaultResponse(notification);

    formattedResponse.status = "OK";
    formattedResponse.message = "Received ADD-CHAT-SESSION notification";
    formattedResponse.sessionId = utils.getText(notif, "session_id");
    formattedResponse.uii = utils.getText(notif, "uii");
    formattedResponse.sessionType = utils.getText(notif, "session_type");
    formattedResponse.agentId = utils.getText(notif, "agent_id");
    formattedResponse.transcript = utils.processResponseCollection(notification, 'ui_notification', 'transcript')[0];

    return formattedResponse;
};
