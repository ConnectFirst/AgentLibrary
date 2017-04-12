
var ChatPresentedNotification = function() {

};

/*
 * External Chat:
 * This class is responsible for handling "CHAT-PRESENTED" packets from IntelliQueue.
 * When this notification is received, the Agent can either Accept or Decline which will
 * be sent back to IntelliQueue as a CHAT-PRESENTED response.
 *
 *  {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016081611595000289",
 *          "@type":"CHAT-PRESENTED",
 *          "@destination":"IQ",
 *          "@response_to":"",
 *          "agent_id":{"#text":"1180958"},
 *          "session_id":{"#text":"2"},
 *          "uii":{"#text":"201608161200240139000000000120"}
 *      }
 *  }
 */
ChatPresentedNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    return {
        message: "Received CHAT-PRESENTED notification",
        status: "OK",
        agentId: utils.getText(notif, "agent_id"),
        sessionId: utils.getText(notif, "session_id"),
        uii: utils.getText(notif, "uii")
    };

};
