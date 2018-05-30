
var DirectAgentTransfer = function(targetAgentId, transferType) {
    this.targetAgentId = targetAgentId;
    this.transferType = transferType;
};

DirectAgentTransfer.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination": "IQ",
            "@type": MESSAGE_TYPES.DIRECT_AGENT_TRANSFER,
            "@message_id": utils.getMessageId(),
            "@response_to": "",
            "agent_id":{
                "#text": model.agentSettings.agentId
            },
            "uii": {
                "#text": utils.toString(model.currentCall.uii)
            },
            "target_agent_id": {
                "#text": utils.toString(this.targetAgentId)
            },
            "transfer_type": {
                "#text": utils.toString(this.transferType)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes DIRECT-AGENT-TRANSFER packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ10012016082314475000219",
 *      "@response_to":"",
 *      "@type":"DIRECT-AGENT-TRANSFER",
 *      "status":{"#text":"OK"},
 *      "message":{"#text":"OK"},
 *      "type":{"#text":"WARM|COLD|CANCEL"}
 *   }
 * }
 */
DirectAgentTransfer.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);
    formattedResponse.type = utils.getText(resp, 'type');

    if(formattedResponse.status !== "OK"){
        // log message response
        var message = "There was an error processing the Direct Agent Transfer request. " + formattedResponse.message + " : " + formattedResponse.detail;
        utils.logMessage(LOG_LEVELS.WARN, message, response);
    }

    return formattedResponse;
};
