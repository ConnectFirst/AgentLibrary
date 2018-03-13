
var ChatStateRequest = function(chatState) {
    this.chatState = (chatState && chatState.toUpperCase()) || "";
};

ChatStateRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CHAT_STATE,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "state":{
                "#text":this.chatState
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes CHAT-STATE packets rec'd from IQ. It will check the state of the
 * packet and then set the state on the model.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008082817165103294",
 *      "@type":"AGENT-STATE",
 *      "status":{"#text":"OK"},
 *      "message":{},
 *      "detail":{},
 *      "agent_id":{"#text":"1856"},
 *      "prev_state":{"#text":"CHAT-PRESENTED"},
 *      "current_state":{"#text":"CHAT-ENGAGED"}
 *   }
 * }
 */
ChatStateRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var status = utils.getText(resp, "status");
    var prevState = utils.getText(resp, "prev_state");
    var currState = utils.getText(resp, "current_state");
    var model = UIModel.getInstance();

    // add message and detail if present
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.agentId = response.ui_response.agent_id['#text'] || "";
    formattedResponse.previousState = prevState;
    formattedResponse.currentState = currState;

    if(status=="OK"){
        // Update the state in the UIModel
        model.agentSettings.currentChatState = currState;
        model.chatStatePacket = response;
    }else{
        if(formattedResponse.message === ""){
            formattedResponse.message = "Unable to change chat state";
        }

        // log message response
        var message = "Unable to change chat state. " + formattedResponse.detail;
        utils.logMessage(LOG_LEVELS.WARN, message, response);
    }

    return formattedResponse;
};


