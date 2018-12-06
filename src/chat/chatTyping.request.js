
var ChatTypingRequest = function(uii,message) {
    this.uii = uii;
    this.message=message;
};

/*
 * External Chat:
 * Agent sends typing message to notify client widgets,
 * but the agent's pending message is not sent going this direction.
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"CHAT-TYPING",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "uii":{"#text":""},
 *      "agent_id":{"#text":""},
 *      "message":{"#text":""}
 *    }
 * }
 */
ChatTypingRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CHAT_TYPING,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "uii":{
                "#text":utils.toString(this.uii)
            },
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "message":{
                "#text":utils.toString(this.message)
            }
        }
    };

    return JSON.stringify(msg);
};

