
var AdminDebugEmailNotification = function() {

};

/*
 * This class is responsible for handling "AGENT-DEBUG-EMAIL" packets from IntelliQueue
 *
 * {
 *   "ui_notification":{
 *      "@message_id":"IQD01DEV2018071616521500004",
 *      "@response_to":"",
 *      "@type":"AGENT-DEBUG-EMAIL",
 *      "email_to": {
 *          "#text":"rmyers@connectfirst.com"
 *      }
 *      "requested_by": {
 *          "#text":"Ross Myers"
 *      }
 *   }
 * }
 */
AdminDebugEmailNotification.prototype.processResponse = function(notification) {
    var formattedResponse = utils.buildDefaultResponse(notification);
    var notif = notification.ui_notification;

    formattedResponse.status = "OK";
    formattedResponse.message = "Received AGENT-DEBUG-EMAIL notification";
    formattedResponse.emailTo = utils.getText(notif, "email_to");
    formattedResponse.requestedBy = utils.getText(notif, "requested_by");

    return formattedResponse;
};
