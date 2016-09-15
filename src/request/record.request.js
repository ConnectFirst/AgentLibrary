
var RecordRequest = function(record) {
    this.record = record;
};

/*
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"RECORD",
 *      "agent_id":{"#text":"1856"},
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "record":{"#text":"TRUE | FALSE"}
 *    }
 * }
 */
RecordRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.RECORD,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(model.currentCall.agentId)
            },
            "uii":{
                "#text":utils.toString(model.currentCall.uii)
            },
            "record":{
                "#text": this.record === true ? "TRUE" : "FALSE"
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes RECORD packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008082910361503344",
 *      "@response_to":"",
 *      "@type":"RECORD",
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "status":{"#text":"OK"},
 *      "message":{},
 *      "detail":{},
 *      "state":{"#text":"RECORDING | STOPPED"}
 *    }
 * }
 */
RecordRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);
    var currUII = "";
    if(UIModel.getInstance().currentCall.uii){
        currUII = UIModel.getInstance().currentCall.uii;
    }

    formattedResponse.uii = utils.getText(resp, 'uii');
    formattedResponse.state = utils.getText(resp, 'state');

    if(formattedResponse.status === "OK"){
        // make sure we are talking about the same call
        if(formattedResponse.uii === currUII) {
            if(formattedResponse.message === ""){
                formattedResponse.message = "Broadcasting new record state of " + formattedResponse.state;
            }
            utils.logMessage(LOG_LEVELS.DEBUG, formattedResponse.message, response);
        }else{
            utils.logMessage(LOG_LEVELS.DEBUG, "Record Response is for a different call...discarding", response);
        }
    }else{
        if(formattedResponse.message === ""){
            formattedResponse.message = "Error processing RECORD request." + formattedResponse.message + "\n" + formattedResponse.detail;
        }
        utils.logMessage(LOG_LEVELS.WARN, formattedResponse.message, response);
    }

    return formattedResponse;
};
