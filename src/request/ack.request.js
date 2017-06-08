
var AckRequest = function(audioType, agentId, uii, monitorAgentId) {
    this.audioType = audioType || "FULL";
    this.agentId = agentId;
    this.uii = uii;
    this.monitorAgentId = monitorAgentId;
};


/*
 * This class processes ACK packets rec'd from IQ.
 * This is a callback triggered by certain actions like
 * sending dispositions or script results.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008090317393001252",
 *      "@response_to":"1112222",
 *      "@type":"ACK",
 *      "type":{"#text":"CHAT-DISPOSITION|INBOUND-DISPOSITION|OUTDIAL-DISPOSITION|SCRIPT-RESULT"},
 *      "status":{"#text":"OK|FAILURE"},
 *      "message":{"#text":""},
 *      "detail":{}
 *    }
 * }
 */
AckRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.type = utils.getText(resp, 'type');

    if(formattedResponse.status === "OK"){
        utils.logMessage(LOG_LEVELS.DEBUG, formattedResponse.message, response);
    }else{
        utils.logMessage(LOG_LEVELS.WARN, formattedResponse.message + ': ' + formattedResponse.detail, response);
    }

    return formattedResponse;
};
