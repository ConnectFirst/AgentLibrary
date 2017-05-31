
var ChatPresentedNotification = function() {

};

/*
 * External Chat:
 * This class is responsible for handling "CHAT-PRESENTED" packets from IntelliQueue.
 * When this notification is received, the Agent can either Accept or Decline which will
 * be sent back to IntelliQueue as a CHAT-PRESENTED-RESPONSE.
 *
 *  {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016081611595000289",
 *          "@type":"CHAT-PRESENTED",
 *          "@destination":"IQ",
 *          "@response_to":"",
 *          "chat_queue_id":{"#text":"3"},
 *          "chat_queue_name":{"#text":"Support Chat"},
 *          "account_id":{"#text":"99999999"},
 *          "uii":{"#text":"201608161200240139000000000120"},
 *          "channel_type":{"#text":""}
 *      }
 *  }
 */
ChatPresentedNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    return {
        message: "Received CHAT-PRESENTED notification",
        status: "OK",
        messageId: notif['@message_id'],
        accountId: utils.getText(notif, "account_id"),
        uii: utils.getText(notif, "uii"),
        channelType: utils.getText(notif, "channel_type"),
        chatQueueId: utils.getText(notif, "chat_queue_id"),
        chatQueueName: utils.getText(notif, "chat_queue_name")
    };

};
