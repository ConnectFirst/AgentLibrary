
var ChatPresentedRequest = function(uii, sessionId, response, responseReason) {
    this.uii = uii;
    this.sessionId = sessionId;
    this.response = response;
    this.responseReason = responseReason || "";
};

/*
 * External Chat:
 * When Agent receives a CHAT-PRESENTED notification, repond with
 * either ACCEPT or REJECT for presented chat.
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"CHAT-PRESENTED",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "uii":{"#text":""},
 *      "agent_id":{"#text":""},
 *      "session_id":{"#text":""},
 *      "response":{"#text":"ACCEPT|REJECT"},
 *      "response_reason":{"#text":""}
 *    }
 * }
 */
ChatPresentedRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CHAT_PRESENTED,
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
            },
            "response":{
                "#text":utils.toString(this.response)
            },
            "response_reason":{
                "#text":utils.toString(this.responseReason)
            }
        }
    };

    return JSON.stringify(msg);
};

