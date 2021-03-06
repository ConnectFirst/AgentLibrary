
var PreviewLeadStateNotification = function() {

};

/*
 * This class is responsible for processing the lead state packet
 * received from intelliqueue. It will decide what type of leads are
 * being processed, and depending on if the callback is true or false, it will
 * call the appropriate form to update the lead state.
 *
 * {
 *      "ui_notification":{
 *          "@type":"PREVIEW-LEAD-STATE",
 *          "@call_type":"MANUAL|PREVIEW",
 *          "@message_id":"IQ10012016092715393600184",
 *          "request_id":{"#text":"IQ10012016092715390900179"},
 *          "lead_state":{"#text":"ANSWER"},
 *          "callback":{"#text":"FALSE"}
 *      }
 *   }
 * }
 */
PreviewLeadStateNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    UIModel.getInstance().agentSettings.onManualOutdial = true;

    var response = {
        callType: notif['@call_type'],
        messageId: notif['@message_id'],
        requestId: utils.getText(notif, "request_id"),
        leadState: utils.getText(notif,"lead_state"),
        callback: utils.getText(notif,"callback")
    };

    return response;
};
