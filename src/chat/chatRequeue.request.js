
var ChatRequeueRequest = function(uii, agentId, chatQueueId, skillId, maintainAgent) {
    this.uii = uii;
    this.agentId = agentId;
    this.chatQueueId = chatQueueId;
    this.skillId = skillId || "";
    this.maintainAgent = maintainAgent || false;
};

/*
 * External Chat:
 * When agent submits a chat message, send "CHAT-REQUEUE" request to IntelliQueue
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"CHAT-REQUEUE",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "uii":{"#text":""},
 *      "agent_id":{"#text":""},
 *      "chat_queue_id":{"#text":""},
 *      "skill_id":{"#text":""},
 *      "maintain_agent":{"#text":"true|false"}
 *    }
 * }
 */
ChatRequeueRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CHAT_REQUEUE,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "uii":{
                "#text":utils.toString(this.uii)
            },
            "agent_id":{
                "#text":utils.toString(this.agentId)
            },
            "chat_queue_id":{
                "#text":utils.toString(this.chatQueueId)
            },
            "skill_id":{
                "#text":utils.toString(this.skillId)
            },
            "maintain_agent":{
                "#text":utils.toString(this.maintainAgent)
            }
        }
    };

    return JSON.stringify(msg);
};

