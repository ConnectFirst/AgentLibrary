

var MonitorChatRequest = function(uii, agentId, monitorAgentId) {
    this.uii = uii;
    this.agentId = agentId;
    this.monitorAgentId = monitorAgentId;
};

/*
 * External Chat:
 * Requests a new session on an existing chat uii
 *
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"CHAT-MONITOR",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "uii":{"#text":""},
 *      "agent_id":{"#text":""},
 *      "monitor_agent_id":{"#text":""}
 *    }
 * }
 */
MonitorChatRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.MONITOR_CHAT,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "uii":{
                "#text":utils.toString(this.uii)
            },
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
