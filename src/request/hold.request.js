
var HoldRequest = function(holdState, sessionId) {
    this.holdState = holdState;
    this.sessionId = sessionId || '1';

};

/*
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"HOLD",
 *      "agent_id":{"#text":"1856"},
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "session_id":{"#text":"1"},
 *      "hold_state":{"#text":"ON"}
 *    }
 * }
 */
HoldRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.HOLD,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(model.currentCall.agentId)
            },
            "uii":{
                "#text":utils.toString(model.currentCall.uii)
            },
            "session_id":{
                "#text": utils.toString(this.sessionId)
            },
            "hold_state":{
                "#text":this.holdState === true || this.holdState === "true" ? "ON" : "OFF"
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes HOLD packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008082910361503344",
 *      "@response_to":"",
 *      "@type":"HOLD",
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "session_id":{"#text":"1"},
 *      "status":{"#text":"OK"},
 *      "message":{},
 *      "detail":{},
 *      "hold_state":{"#text":"ON"}
 *    }
 * }
 */
HoldRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);
    var currUII = "";
    if(UIModel.getInstance().currentCall.uii){
       currUII = UIModel.getInstance().currentCall.uii;
    }

    formattedResponse.holdState = utils.getText(resp, 'hold_state') === "ON";
    formattedResponse.sessionId = utils.getText(resp, 'session_id');
    formattedResponse.uii = utils.getText(resp, 'uii');

    if(formattedResponse.status === "OK"){
        // make sure we are talking about the same call
        if(formattedResponse.uii === currUII){
            if(formattedResponse.message === ""){
                formattedResponse.message = "Broadcasting new hold state of " + formattedResponse.holdState;
            }
            utils.logMessage(LOG_LEVELS.DEBUG, "Broadcasting new hold state of " + formattedResponse.holdState, response);
        }
        else{
            utils.logMessage(LOG_LEVELS.DEBUG, "Hold Response is for a different call...discarding", response);
        }
    }else{
        if(formattedResponse.message === ""){
            formattedResponse.message = "Error processing HOLD request. " +  + formattedResponse.message + "\n" + formattedResponse.detail;
        }
        utils.logMessage(LOG_LEVELS.WARN, "Error processing HOLD request. " + formattedResponse.detail, response);
    }

    var model = UIModel.getInstance();
    if(formattedResponse.sessionId !== '1' && model.transferSessions[formattedResponse.sessionId]) {
        // we have a hold for a transfer session
        model.transferSessions[formattedResponse.sessionId].onHold = formattedResponse.holdState;
    }

    return formattedResponse;
};
