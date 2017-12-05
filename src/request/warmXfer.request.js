
var XferWarmRequest = function(dialDest, callerId, sipHeaders) {
    this.dialDest = dialDest;
    this.callerId = callerId || "";
    this.sipHeaders = sipHeaders || [];
};

XferWarmRequest.prototype.formatJSON = function() {
    var fields = [];
    for(var i =0; i < this.sipHeaders.length; i++){
        var fieldObj = this.sipHeaders[i];
        fields.push({ '@name' : utils.toString(fieldObj.name), '@value' : utils.toString(fieldObj.value)});
    }

    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.XFER_WARM,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "uii":{
                "#text":UIModel.getInstance().currentCall.uii
            },
            "dial_dest":{
                "#text":utils.toString(this.dialDest)
            },
            "caller_id":{
                "#text":utils.toString(this.callerId)
            },
            "xfer_header": fields
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes WARM-XFER packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ10012016082314475000219",
 *      "@response_to":"",
 *      "@type":"WARM-XFER",
 *      "agent_id":{"#text":"1"},
 *      "uii":{"#text":"201608231447590139000000000200"},
 *      "session_id":{"#text":"3"},
 *      "status":{"#text":"OK"},
 *      "dial_dest":{"#text":"3038593775"},
 *      "message":{"#text":"OK"},"detail":{}
 *    }
 * }
 *  Response on CANCEL:
 *  {"ui_response":{
 *      "@message_id":"IQ10012016082315005000264",
 *      "@response_to":"",
 *      "@type":"WARM-XFER",
 *      "agent_id":{"#text":"1"},
 *      "uii":{"#text":"201608231501090139000000000204"},
 *      "session_id":{},
 *      "status":{"#text":"FAILURE"},
 *      "dial_dest":{"#text":"3038593775"},
 *      "message":{"#text":"Transfer CANCELED"},
 *      "detail":{"#text":"NOANSWER after 3 seconds."}
 *    }
 * }
 */
XferWarmRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.agentId = utils.getText(resp, 'agent_id');
    formattedResponse.uii = utils.getText(resp, 'uii');
    formattedResponse.sessionId = utils.getText(resp, 'session_id');
    formattedResponse.dialDest = utils.getText(resp, 'dial_dest');

    if(formattedResponse.status === "OK"){
        utils.logMessage(LOG_LEVELS.DEBUG, "Warm Xfer to " + formattedResponse.dialDest + " processed successfully.", response);
    }else{
        utils.logMessage(LOG_LEVELS.WARN, "There was an error processing the Warm Xfer request. " + formattedResponse.message + "\n" + formattedResponse.detail, response);
    }

    return formattedResponse;
};
