
var ChatClientReconnectNotification = function() {

};

/*
 * External Chat:
 * This class is responsible for handling "CHAT-CLIENT-RECONNECT" packets from IntelliQueue.
 * This is sent when a chat connect message is sent to a non-archieved chat.
 *
 *  {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016081611595000289",
 *          "@type":"CHAT-CLIENT-RECONNECT",
 *          "@destination":"IQ",
 *          "@response_to":"",
 *          "account_id":{"#text":"99999999"},
 *          "uii":{"#text":"201608161200240139000000000120"}
 *          "agent_id":{"#text":"1"}
 *      }
 *  }
 */

ChatClientReconnectNotification.prototype.processResponse = function(notification){
    var notif = notification.ui_notification;

    return {
        message : "Received CHAT-CLIENT-RECONNECT notification",
        status : "OK",
        accountId : utils.getText(notif, "account_id"),
        uii : utils.getText(notif, "uii"),
        agentId : utils.getText(notif, "agent_id")
    };

};