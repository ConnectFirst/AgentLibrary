
var ChatPresentedResponseRequest = function(uii, response, responseReason) {
    this.uii = uii;
    this.response = response;
    this.responseReason = responseReason || "";
};

/*
 * External Chat:
 * When Agent receives a CHAT-PRESENTED notification, respond with
 * either ACCEPT or REJECT for presented chat.
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"CHAT-PRESENTED",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "uii":{"#text":""},
 *      "agent_id":{"#text":""},
 *      "response":{"#text":"ACCEPT|REJECT"},
 *      "response_reason":{"#text":""}
 *    }
 * }
 */
ChatPresentedResponseRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CHAT_PRESENTED_RESPONSE,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "uii":{
                "#text":utils.toString(this.uii)
            },
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
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

