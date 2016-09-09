
var OffhookTermRequest = function(showWarning) {

};

OffhookTermRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.OFFHOOK_TERM,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            }
        }
    };

    return JSON.stringify(msg);
};


/*
 * Process an OFF-HOOK-TERM packet and update various variables in the UI
 *
 * {"ui_notification":{
 *      "@message_id":"IQ10012016080217135001344",
 *      "@response_to":"",
 *      "@type":"OFF-HOOK-TERM",
 *      "agent_id":{"#text":"1"},
 *      "start_dts":{"#text":"2016-08-02 17:11:38"},
 *      "end_dts":{"#text":"2016-08-02 17:14:07"},
 *      "monitoring":{"#text":"0"}
 *    }
 * }
 */
OffhookTermRequest.prototype.processResponse = function(data) {
    var notif = data.ui_notification;
    var monitoring = utils.getText(notif, "monitoring") === '1';
    var model = UIModel.getInstance();

    model.agentSettings.wasMonitoring = monitoring;
    model.offhookTermPacket = data;
    model.agentSettings.isOffhook = false;

    var formattedResponse = {
        status: "OK",
        agentId: utils.getText(notif, "agent_id"),
        startDts: utils.getText(notif, "start_dts"),
        endDts: utils.getText(notif, "end_dts"),
        monitoring: monitoring
    };

    return formattedResponse;
};
