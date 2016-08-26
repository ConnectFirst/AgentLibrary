
var OffhookInitRequest = function() {

};

OffhookInitRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.OFFHOOK_INIT,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "dial_dest":{
                "#text":UIModel.getInstance().agentSettings.dialDest
            }
        }
    };

    return JSON.stringify(msg);
};


/*
 * This class is responsible for handling an off-hook-init response packet from IntelliQueue.
 * If the offhookinit is successful, it will go into the UIModel and set the isOffhook variable
 * to true.
 *
 * {"ui_response":{
 *      "@message_id":"UI2005",
 *      "@response_to":"",
 *      "@type":"OFF-HOOK-INIT",
 *      "status":{"#text":"OK|FAILURE"},
 *      "message":{},
 *      "detail":{}
 *    }
 * }
 */
OffhookInitRequest.prototype.processResponse = function(response) {
    var status = response.ui_response.status['#text'];
    var formattedResponse = utils.buildDefaultResponse(response);

    if(status === 'OK'){
        UIModel.getInstance().offhookInitPacket = response;
        UIModel.getInstance().agentSettings.isOffhook = true;
    }else{
        if(formattedResponse.message === ""){
            formattedResponse.message = "Unable to process offhook request";
        }
        console.log("AgentLibrary: Unable to process offhook request ", detail);
    }

    return formattedResponse;
};

