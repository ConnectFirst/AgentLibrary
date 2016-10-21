
var TcpaSafeLeadStateNotification = function() {

};

/*
 * This class is responsible for processing the lead state packet
 * received from intelliqueue. It will decide what type of leads are
 * being processed, and depending on if the callback is true or false, it will
 * call the appropriate form to update the lead state.
 *
 * {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016080317400400011",
 *          "@type":"TCPA-SAFE-LEAD-STATE",
 *          "@call_type":"MANUAL|TCPA-SAFE",
 *          "request_id":{"#text":""},
 *          "lead_state":{"#text":"CALLING"},
 *          "callback":{"#text":"false"}
 *      }
 * }
 */
TcpaSafeLeadStateNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    var response = {
        callType: notif['@call_type'],
        messageId: notif['@message_id'],
        requestId: utils.getText(notif, "request_id"),
        leadState: utils.getText(notif,"lead_state"),
        callback: utils.getText(notif,"callback")
    };

    return response;
};
