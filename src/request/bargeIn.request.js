
var BargeInRequest = function(audioType) {
    this.audioType = audioType || "FULL";
};

/*
 *
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UIV22008931055822",
 *      "@response_to":"",
 *      "@type":"BARGE-IN",
 *      "agent_id":{"#text":"94"},
 *      "uii":{"#text":"200809031054510000000900020961"},
 *      "audio_state":{"#text":"FULL"},
 *      "monitor_agent_id":{"#text":"1856"}
 *    }
 * }
 */
BargeInRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.BARGE_IN,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(model.agentSettings.agentId)
            },
            "uii":{
                "#text":utils.toString(model.currentCall.uii)
            },
            "audio_state":{
                "#text":utils.toString(this.audioType)
            },
            "monitor_agent_id":{
                "#text":utils.toString(model.currentCall.monitorAgentId)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes BARGE-IN packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008090317393001252",
 *      "@response_to":"",
 *      "@type":"BARGE-IN",
 *      "agent_id":{"#text":"94"},
 *      "uii":{},
 *      "status":{"#text":"OK"},
 *      "message":{"#text":"Barge-In processed successfully!"},
 *      "detail":{}
 *    }
 * }
 */
BargeInRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.agentId = utils.getText(resp, 'agent_id');
    formattedResponse.uii = utils.getText(resp, 'uii');

    if(formattedResponse.status === "OK"){
        utils.logMessage(LOG_LEVELS.DEBUG, formattedResponse.message, response);
    }else{
        utils.logMessage(LOG_LEVELS.WARN, "There was an error processing the Barge-In request. " + formattedResponse.detail, response);
    }

    return formattedResponse;
};
