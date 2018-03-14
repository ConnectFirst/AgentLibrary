
var ChatManualSmsRequest = function(agentId, chatQueueId, ani, dnis, message) {
    this.agentId = agentId;
    this.chatQueueId = chatQueueId;
    this.ani = ani;
    this.dnis = dnis;
    this.message = message;
};

/*
 * External Chat:
 * When agent submits a manual sms message, send "MANUAL-SMS" request to IntelliQueue
 *
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"MANUAL-SMS",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "agent_id":{"#text":"1995"},
 *      "chatQueueId":{"#text":"44"},
 *      "ani":{"#text":"1231231234"},
 *      "dnis":{"#text":"5435435432"},
 *      "message":{"#text":"hello"}
 *    }
 * }
 */
ChatManualSmsRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CHAT_MANUAL_SMS,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(this.agentId)
            },
            "chat_queue_id":{
                "#text":utils.toString(this.chatQueueId)
            },
            "ani":{
                "#text":utils.toString(this.ani)
            },
            "dnis":{
                "#text":utils.toString(this.dnis)
            },
            "message":{
                "#text":utils.toString(this.message)
            }
        }
    };

    return JSON.stringify(msg);
};
