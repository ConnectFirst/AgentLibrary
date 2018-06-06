
var DirectAgentTransferNotification = function() {

};

/*
 * This class is responsible for handling a DIRECT-AGENT-ROUTE notification.
 * This event is sent from IQ when an agent is presented a direct transfer, in the case they are not in an
 * available state to automatically be presented the call.
 *
 * {
 *     "ui_notification": {
 *         "@message_id": "IQ10012016080515294800318",
 *         "@type": "DIRECT-AGENT-ROUTE",
 *         "response_to": { "#text": "" },
 *         "agent_id": { "#text": "" },
 *         "uii": { "#text": "" },
 *         "status": { "#text": "" },
 *         "ani": { "#text": "" },
 *         "dnis": { "#text": "" }
 *         "source_type": { "#text": "" },
 *         "source_id": { "#text": "" },
 *         "source_name": { "#text": "" }
 *         "voicemail_url": { "#text": "" }
 *     }
 * }
 */
DirectAgentTransferNotification.prototype.processResponse = function(notification) {
    var formattedResponse = utils.buildDefaultResponse(notification);
    var notif = notification.ui_notification;

    formattedResponse.message = "Received DIRECT-AGENT-ROUTE notification";
    formattedResponse.status = utils.getText(notif, "status");
    formattedResponse.agentId = utils.getText(notif, "agent_id");
    formattedResponse.uii = utils.getText(notif, "uii");
    formattedResponse.ani = utils.getText(notif, "ani");
    formattedResponse.dnis = utils.getText(notif, "dnis");
    formattedResponse.sourceType = utils.getText(notif, "source_type");
    formattedResponse.sourceId = utils.getText(notif, "source_id");
    formattedResponse.sourceName = utils.getText(notif, "source_name");
    formattedResponse.voicemailUrl = utils.getText(notif, "voicemail_url");

    return formattedResponse;
};
