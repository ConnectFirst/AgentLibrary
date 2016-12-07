
var ChatSendRequest = function(roomId, message) {
    this.roomId = roomId;
    this.message = message;
};

/*
 * This class is responsible for creating the CHAT message packet and sending
 * it to IntelliServices.
 *
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"CHAT",
 *      "room_id":{"#text":""}
 *      "message":{"#text":""}
 *    }
 * }
 */
ChatSendRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IS",
            "@type":MESSAGE_TYPES.CHAT_SEND,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "room_id":{
                "#text":utils.toString(this.roomId)
            },
            "message":{
                "#text":utils.toString(this.message)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class is responsible for handling CHAT packets received from
 * IntelliServices.
 *
 * //PUBLIC
 * {"ui_request":{
 *      "@message_id":"",
 *      "@response_to":"",
 *      "@type":"CHAT",
 *      "room_type":"GROUP",
 *      "room_id":{"#text":""},
 *      "message":{"#text":""},
 *      "sender":{"#text":""},
 *      "sender_id":{"#text":""},
 *      "room_name":{"#text":""}
 *    }
 * }
 * -OR-
 * // PRIVATE
 * {"ui_request":{
 *      "@dynamic_create":"TRUE",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "@type":"CHAT",
 *      "room_type":"PRIVATE",
 *      "room_id":{"#text":""},
 *      "message":{"#text":""},
 *      "sender":{"#text":""},
 *      "room_name":{"#text":""}
 *    }
 * }
 */

ChatSendRequest.prototype.processResponse = function(response) {
    var resp = response.ui_request;
    var formattedResponse = {
        roomType: utils.getText(resp, 'room_type'),
        roomId: utils.getText(resp, 'room_id'),
        message: utils.getText(resp, 'message'),
        sender: utils.getText(resp, 'sender'),
        senderId: utils.getText(resp, 'sender_id'),
        roomName: utils.getText(resp, 'room_name'),
        dynamicCreate: utils.getText(resp, 'dynamic_create') === "TRUE"
    };

    utils.logMessage(LOG_LEVELS.DEBUG, "New CHAT packet received from IntelliServices", response);

    return formattedResponse;
};