
var PauseRecordRequest = function(record) {
    this.record = record;
};

/*
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"PAUSE-RECORD",
 *      "agent_id":{"#text":"1856"},
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "record":{"#text":"TRUE | FALSE"},
 *      "pause":{"#text":"10"}
 *    }
 * }
 */
PauseRecordRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var pauseTime = "10";
    if(model.currentCall.agentRecording && model.currentCall.agentRecording.pause){
        pauseTime = model.currentCall.agentRecording.pause;
    }
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.PAUSE_RECORD,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(model.currentCall.agentId)
            },
            "uii":{
                "#text":utils.toString(model.currentCall.uii)
            },
            "record":{
                "#text":utils.toString(this.record === true ? "TRUE" : "FALSE")
            },
            "pause":{
                "#text":utils.toString(pauseTime)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes PAUSE-RECORD packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008082910361503344",
 *      "@response_to":"",
 *      "@type":"PAUSE-RECORD",
 *      "uii":{"#text":"200808291035510000000900029412"},
 *      "status":{"#text":"OK | FAILURE"},
 *      "message":{},
 *      "detail":{},
 *      "state":{"#text":"RECORDING | PAUSED"},
 *      "pause":{"#text":"10"}
 *    }
 * }
 */
PauseRecordRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);
    var currUII = "";
    if(UIModel.getInstance().currentCall.uii){
        currUII = UIModel.getInstance().currentCall.uii;
    }

    formattedResponse.uii = utils.getText(resp, 'uii');
    formattedResponse.state = utils.getText(resp, 'state');
    formattedResponse.pause = utils.getText(resp, 'pause');

    if(formattedResponse.status === "OK"){
        // make sure we are talking about the same call
        if(formattedResponse.uii === currUII) {
            if(formattedResponse.message === ""){
                formattedResponse.message = "Broadcasting new record state of " + formattedResponse.state;
            }
            console.log("AgentLibrary: Broadcasting new record state of " + formattedResponse.state);
        }else{
            console.log("AgentLibrary: Pause Record Response is for a different call...discarding");
        }
    }else{
        if(formattedResponse.message === ""){
            formattedResponse.message = "Error processing PAUSE-RECORD request." + formattedResponse.message + "\n" + formattedResponse.detail;
        }
        console.warn("AgentLibrary: Error processing PAUSE-RECORD request. " + formattedResponse.message + "\n" + formattedResponse.detail);
    }

    return formattedResponse;
};
