

var StopMonitorChatRequest = function(monitorAgentId) {
    this.monitorAgentId = monitorAgentId || "";
};

/*
 * External Chat:
 * Requests a termination of a chat monitor session for an agent
 *
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"CHAT-DROP-MONITORING-SESSION",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "agent_id":{"#text":""},
 *      "monitor_agent_id":{"#text":""}
 *    }
 * }
 */
StopMonitorChatRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.STOP_MONITOR_CHAT,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "monitor_agent_id":{
                "#text":utils.toString(this.monitorAgentId)
            }
        }
    };

    return JSON.stringify(msg);
};
