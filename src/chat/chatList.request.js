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
                "#text":utils.toString(this.agentId)
            },
            "monitor_agent_id":{
                "#text":utils.toString(this.monitorAgentId)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * External Chat:
 * This class is responsible for handling "CHAT-LIST" packets from IntelliQueue.
 *
 *  {
 *      "ui_response":{
 *          "@message_id":"IQ10012016081611595000289",
 *          "@type":"CHAT-LIST",
 *          "@response_to":"",
 *          "agent_id":{"#text":"17"},
 *          "monitor_agent_id":{"#text":"18"},
 *          "chat_list": {}
 *      }
 *  }
 */

ChatListRequest.prototype.processResponse = function(response) {
    var notif = response.ui_response;
    var model = UIModel.getInstance();
    model.chatListResponse = response;

    return {
        message: "Received CHAT-LIST notification",
        status: "OK",
        messageId: notif['@message_id'],
        agentId: utils.getText(notif, "agent_id"),
        monitorAgentId: utils.getText(notif, "monitor_agent_id"),
        chatList: utils.processResponseCollection( notif, "chat_list", "active_chat")
    };
};


