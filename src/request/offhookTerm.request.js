
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
 * <ui_notification message_id="IQ10012016080217135001344" response_to="" type="OFF-HOOK-TERM">
 *    <agent_id>1</agent_id>
 *    <start_dts>2016-08-02 17:11:38</start_dts>
 *    <end_dts>2016-08-02 17:14:07</end_dts>
 *    <monitoring>0</monitoring>
 * </ui_notification>
 */
OffhookTermRequest.prototype.processResponse = function(data) {
    var monitoring = data.ui_notification.monitoring['#text'] === '1';

    UIModel.getInstance().agentSettings.wasMonitoring = monitoring;
    UIModel.getInstance().offhookTermPacket = data;
    UIModel.getInstance().agentSettings.isOffhook = false;

    var formattedResponse = {
        agentId: data.ui_notification.agent_id['#text'],
        startDts: data.ui_notification.start_dts['#text'],
        endDts: data.ui_notification.end_dts['#text'],
        monitoring: monitoring
    };

    return formattedResponse;
};
