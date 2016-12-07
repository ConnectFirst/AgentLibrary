
var ChatRoomStateRequest = function() {

};

/*
 * This class is responsible for processing CHAT-ROOM-STATE packets received
 * from IntelliServices.
 *
 * {"ui_request":{
 *      "@message_id":"",
 *      "@response_to":"",
 *      "@type":"CHAT-ROOM-STATE",
 *      "room_id":{"#text":""},
 *      "agent_id":{"#text":""},
 *      "chat_alias":{"#text":""},
 *      "state":{"#text":""}
 *    }
 * }
 */
ChatRoomStateRequest.prototype.processResponse = function(response) {
    var resp = response.ui_request;
    var formattedResponse = {
        roomId: utils.getText(resp, 'room_id'),
        agentId: utils.getText(resp, 'agent_id'),
        chatAlias: utils.getText(resp, 'chat_alias'),
        state: utils.getText(resp, 'state')
    };

    utils.logMessage(LOG_LEVELS.DEBUG, "Chat-Room-State update packet received for room #" + formattedResponse.roomId, response);
    return formattedResponse;
};