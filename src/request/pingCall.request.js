
var PingCallRequest = function() {
    
};

PingCallRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.PING_CALL,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().currentCall.agentId
            },
            "uii":{
                "#text":UIModel.getInstance().currentCall.uii
            }
        }
    };

    return JSON.stringify(msg);
};
