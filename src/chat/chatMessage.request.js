
var ChatMessageRequest = function(uii, agentId, message) {
    this.uii = uii;
    this.agentId = agentId;
    this.message = message;
};

/*
 * External Chat:
 * When agent submits a chat message, send "CHAT-MESSAGE" request to IntelliQueue
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"CHAT-MESSAGE",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "uii":{"#text":""},
 *      "agent_id":{"#text":""},
 *      "message":{"#text":"hello"}
 *    }
 * }
 */
ChatMessageRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CHAT_MESSAGE,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "uii":{
                "#text":utils.toString(this.uii)
            },
            "agent_id":{
                "#text":utils.toString(this.agentId)
            },
            "message":{
                "#text":utils.toString(this.message)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class is responsible for handling external CHAT-MESSAGE packets received from
 * IntelliQueue.
 *
 * {"ui_notification":{
 *      "@message_id":"",
 *      "@response_to":"",
 *      "@type":"CHAT-MESSAGE",
 *      "uii":{"#text":""},
 *      "account_id":{"#text":""},
 *      "from":{"#text":""},
 *      "message":{"#text":"hello"}
 *    }
 * }
 */

ChatMessageRequest.prototype.processResponse = function(response) {
    var resp = response.ui_notification;
    var formattedResponse = {
        uii: utils.getText(resp, 'uii'),
        accountId: utils.getText(resp, 'account_id'),
        from: utils.getText(resp, 'from'),
        message: utils.getText(resp, 'message')
    };

    utils.logMessage(LOG_LEVELS.DEBUG, "New CHAT-MESSAGE packet received from IntelliQueue", response);

    return formattedResponse;
};
