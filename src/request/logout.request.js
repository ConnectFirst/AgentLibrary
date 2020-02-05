
var LogoutRequest = function(agentId, message) {
    this.agentId = agentId;
    this.message = message || "";
};

LogoutRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.LOGOUT,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":this.agentId
            },
            "message":{
                "#text":this.message
            }
        }
    };

    return JSON.stringify(msg);
};


LogoutRequest.prototype.processResponse = function(notification) {
    var formattedResponse = utils.buildDefaultResponse(notification);

    return formattedResponse;
};