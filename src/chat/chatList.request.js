

var ChatListRequest = function(agentId, monitorAgentId) {
    this.agentId = agentId;
    this.monitorAgentId = monitorAgentId;
};

/*
 * External Chat:
 * Requests a list of all chats by monitor agent id
 *
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"CHAT-LIST",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "agent_id":{"#text":""},
 *      "monitor_agent_id":{"#text":""}
 *    }
 * }
 */
ChatListRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CHAT_LIST,
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

