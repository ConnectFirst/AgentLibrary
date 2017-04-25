
var ChatTypingNotification = function() {

};

/*
 * External Chat:
 * This class is responsible for handling "CHAT-TYPING" packets from IntelliQueue.
 * When this notification is received, the AgentUI will show the pending message
 * so far from the client chat widget and typing notification.
 *
 *  {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016081611595000289",
 *          "@type":"CHAT-TYPING",
 *          "@destination":"IQ",
 *          "@response_to":"",
 *          "agent_id":{"#text":"1180958"},
 *          "account_id":{"#text":"99999999"},
 *          "uii":{"#text":"201608161200240139000000000120"},
 *          "is_typing":{"#text":"true"},
 *          "pending_message":{"#text":"this is the message before actual send"}
 *      }
 *  }
 */
ChatTypingNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    return {
        message: "Received CHAT-TYPING notification",
        status: "OK",
        agentId: utils.getText(notif, "agent_id"),
        accountId: utils.getText(notif, "account_id"),
        uii: utils.getText(notif, "uii"),
        isTyping: utils.getText(notif, "is_typing"),
        pendingMessage: utils.getText(notif, "pending_message")
    };

};
