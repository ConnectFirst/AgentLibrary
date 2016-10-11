
var PendingDispNotification = function() {

};

/*
 * This class is responsible for handling a generic notification
 *
 * {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016080317400400011",
 *          "@type":"PENDING_DISP",
 *          "agent_id":{"#text":"3"},
 *          "status":{"#text":"false"}
 *      }
 * }
 */
PendingDispNotification.prototype.processResponse = function(notification) {
    var formattedResponse = {};
    formattedResponse.agentId = utils.getText(notification.ui_notification,"agent_id");
    formattedResponse.status = utils.getText(notification.ui_notification,"status");

    return formattedResponse;
};
