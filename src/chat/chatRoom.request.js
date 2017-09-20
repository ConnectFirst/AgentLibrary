
var ChatRoomRequest = function(action, roomType, roomId, agentOne, agentTwo) {
    this.action = action;
    this.roomType = roomType;
    this.roomId = roomId;
    this.agentOne = agentOne || "";
    this.agentTwo = agentTwo || "";
};

/*
 * This class is responsible for sending the packet requesting to either enter
 * a chatroom, or to exit a chatroom to IS. It also handles private chats. There are
 * two possible ways these packets could look:
 *
 * //PUBLIC
 * {"ui_request":{
 *      "@destination":"IS",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "@type":"CHAT-ROOM",
 *      "@room_type":"PUBLIC",
 *      "room_id":{"#text":""},
 *      "action":{"#text":"EXIT|ENTER"}
 *    }
 * }
 * -OR-
 * // PRIVATE
 * {"ui_request":{
 *      "@destination":"IS",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "@type":"CHAT-ROOM",
 *      "@room_type":"PRIVATE",
 *      "agent_one":{"#text":""},
 *      "agent_two":{"#text":""},
 *      "action":{"#text":"ENTER|EXIT"}
 *    }
 * }
 *
 */
ChatRoomRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IS",
            "@type":MESSAGE_TYPES.CHAT_ROOM,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "action":{
                "#text":utils.toString(this.action)
            }
        }
    };

    if(this.action !== "EXIT"){
        msg.ui_request["@room_type"] = this.roomType;
    }

    if(this.roomType === "PRIVATE" && this.action === "ENTER"){
        msg.ui_request.agent_one = { "#text":utils.toString(this.agentOne) };
        msg.ui_request.agent_two = { "#text":utils.toString(this.agentTwo) };
    }else{
        msg.ui_request.room_id = { "#text":utils.toString(this.roomId) };
    }
    return JSON.stringify(msg);
};
