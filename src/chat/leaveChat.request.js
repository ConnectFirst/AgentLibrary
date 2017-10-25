

var LeaveChatRequest = function(uii, agentId, sessionId) {
    this.uii = uii;
    this.agentId = agentId;
    this.sessionId = sessionId;
};

/*
 * External Chat:
 * Requests to terminate a chat session on an existing chat uii
 *
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"CHAT-DROP-SESSION",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "uii":{"#text":""},
 *      "agent_id":{"#text":""},
 *      "session_id":{"#text":""}
 *    }
 * }
 */
LeaveChatRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.LEAVE_CHAT,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "uii":{
                "#text":utils.toString(this.uii)
            },
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "session_id":{
                "#text":utils.toString(this.sessionId)
            }
        }
    };

    return JSON.stringify(msg);
};

