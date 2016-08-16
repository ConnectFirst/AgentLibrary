
var EarlyUiiNotification = function() {

};

/*
 * This class is responsible for handling "EARLY_UII" packets from IntelliQueue.
 * For manual outdials, this gives the uii to cancel a ringing line.
 *
 * <ui_notification message_id="IQ10012016081611595000289" type="EARLY_UII">
 *      <agent_id>1180958</agent_id>
 *      <uii>201608161200240139000000000120</uii>
 *  </ui_notification>
 */
EarlyUiiNotification.prototype.processResponse = function(notification) {
    var formattedResponse = utils.buildDefaultResponse(notification);
    var notif = notification.ui_notification;

    formattedResponse.message = "Received EARLY_UII notification";
    formattedResponse.status = "OK";
    formattedResponse.agentId = utils.getText(notif, "agent_id");
    formattedResponse.uii = utils.getText(notif, "uii");

    return formattedResponse;
};
