
var DropSessionNotification = function() {

};

/*
 * This class handles the DROP-SESSION packet from IQ. It doesn't really do anything
 * besides format a response for the callback notification since there isn't any action needed.
 *
 *  {
 *      "ui_notification": {
 *          "@message_id":"IQ10012016081613222800341",
 *          "@response_to":"",
 *          "@type":"DROP-SESSION",
 *          "session_id":{"#text":"3"},
 *          "uii":{"#text":"201608161322180139000000000124"}
 *      }
 *  }
 */
DropSessionNotification.prototype.processResponse = function(notification) {
    var formattedResponse = utils.buildDefaultResponse(notification);
    var notif = notification.ui_notification;

    formattedResponse.message = "Received DROP-SESSION Notification";
    formattedResponse.status = "OK";
    formattedResponse.sessionId = utils.getText(notif, "session_id");
    formattedResponse.uii = utils.getText(notif, "uii");

    return formattedResponse;
};
