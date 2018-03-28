
var ChatInactiveNotification = function() {

};

/*
 * External Chat:
 * This class is responsible for handling "CHAT-INACTIVE" packets from IntelliQueue.
 * This is sent to the agent when the last session is disconnected from a chat.
 *
 *  {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016081611595000289",
 *          "@type":"CHAT-INACTIVE",
 *          "@destination":"IQ",
 *          "@response_to":"",
 *          "account_id":{"#text":"99999999"},
 *          "uii":{"#text":"201608161200240139000000000120"},
 *          "disposition_timeout":{"#text":"30"}
 *      }
 *  }
 */
ChatInactiveNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    return {
        message: "Received CHAT-INACTIVE notification",
        status: "OK",
        accountId: utils.getText(notif, "account_id"),
        uii: utils.getText(notif, "uii"),
        dispositionTimeout: utils.getText(notif, "disposition_timeout")
    };

};
