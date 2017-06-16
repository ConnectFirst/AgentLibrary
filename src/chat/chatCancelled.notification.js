
var ChatCancelledNotification = function() {

};

/*
 * External Chat:
 * This class is responsible for processing "CHAT-CANCELLED" packets from IntelliQueue.
 * If an agent is presented a chat and doesn't respond before the timeout, the CHAT-CANCELLED
 * message is sent from IQ.
 *
 *  {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016081611595000289",
 *          "@type":"CHAT-CANCELLED",
 *          "@destination":"IQ",
 *          "@response_to":"",
 *          "account_id":{"#text":"99999999"},
 *          "uii":{"#text":"201608161200240139000000000120"}
 *      }
 *  }
 */
ChatCancelledNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    return {
        message: "Received CHAT-CANCELLED notification",
        status: "OK",
        messageId: notif['@message_id'],
        accountId: utils.getText(notif, "account_id"),
        uii: utils.getText(notif, "uii")
    };

};
