
var ChatActiveNotification = function() {

};

/*
 * External Chat:
 * This class is responsible for handling "CHAT-ACTIVE" packets from IntelliQueue.
 * This is sent in response to an agent's CHAT-PRESENTED-RESPONSE accept request.
 *
 *  {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016081611595000289",
 *          "@type":"CHAT-ACTIVE",
 *          "@destination":"IQ",
 *          "@response_to":"",
 *          "account_id":{"#text":"99999999"},
 *          "uii":{"#text":"201608161200240139000000000120"}
 *      }
 *  }
 */
ChatActiveNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    return {
        message: "Received CHAT-ACTIVE notification",
        status: "OK",
        accountId: utils.getText(notif, "account_id"),
        uii: utils.getText(notif, "uii")
    };

};
