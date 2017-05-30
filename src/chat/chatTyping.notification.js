
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
 *          "uii":{"#text":"201608161200240139000000000120"},
 *          "account_id":{"#text":"99999999"},
 *          "from":{"#text":""},
 *          "message":{"#text":"this is the message before actual send"}
 *      }
 *  }
 */
ChatTypingNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    return {
        message: "Received CHAT-TYPING notification",
        status: "OK",
        accountId: utils.getText(notif, "account_id"),
        uii: utils.getText(notif, "uii"),
        from: utils.getText(notif, "from"),
        pendingMessage: utils.getText(notif, "message")
    };

};
