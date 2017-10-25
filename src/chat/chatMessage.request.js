
var ChatMessageRequest = function(uii, agentId, message, whisper) {
    this.uii = uii;
    this.agentId = agentId;
    this.message = message;
    this.whisper = whisper;
};

/*
 * External Chat:
 * When agent submits a chat message, send "CHAT-MESSAGE" request to IntelliQueue
 *
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"CHAT-MESSAGE",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "uii":{"#text":""},
 *      "agent_id":{"#text":""},
 *      "message":{"#text":"hello"},
 *      "whisper":{"#text":"true|false"}
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
            },
            "whisper":{
                "#text":utils.toString(this.whisper)
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
 *      "message":{"#text":"hello"},
 *      "dts":{"#text":"2017-05-10 12:40:28"}
 *    }
 * }
 */

ChatMessageRequest.prototype.processResponse = function(response) {
    var resp = response.ui_notification;
    var dts = utils.getText(resp, 'dts').trim();
    var dtsDate = new Date(dts.replace(' ','T'));
    var formattedResponse = {
        uii: utils.getText(resp, 'uii'),
        accountId: utils.getText(resp, 'account_id'),
        from: utils.getText(resp, 'from'),
        type: utils.getText(resp, 'type'),
        message: utils.getText(resp, 'message'),
        whisper: utils.getText(resp, 'whisper'),
        dts: dtsDate
    };

    utils.logMessage(LOG_LEVELS.DEBUG, "New CHAT-MESSAGE packet received from IntelliQueue", response);

    return formattedResponse;
};
