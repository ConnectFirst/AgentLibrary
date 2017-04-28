
var ChatTypingRequest = function(uii, accountId, isTyping) {
    this.uii = uii;
    this.accountId = accountId;
    this.isTyping = isTyping;
};

/*
 * External Chat:
 * Agent sends typing message to notify client widgets,
 * but the agent's pending message is not sent going this direction (just empty string).
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"CHAT-TYPING",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "uii":{"#text":""},
 *      "agent_id":{"#text":""},
 *      "account_id":{"#text":""},
 *      "isTyping":{"#text":"true|false"},
 *      "pendingMessage":{"#text":""}
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
            "account_id":{
                "#text":utils.toString(this.accountId)
            },
            "is_typing":{
                "#text":utils.toString(this.isTyping)
            },
            "pending_message":{
                "#text":""
            }
        }
    };

    return JSON.stringify(msg);
};

