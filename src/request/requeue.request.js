
var RequeueRequest = function(queueId, skillId, maintain) {
    this.queueId = queueId;
    this.skillId = skillId;
    this.maintain = maintain;
};

RequeueRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.REQUEUE,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "uii":{
                "#text":UIModel.getInstance().currentCall.uii
            },
            "gate_number":{
                "#text":utils.toString(this.queueId)
            },
            "skill_id":{
                "#text":utils.toString(this.skillId)
            },
            "maintain_agent":{
                "#text":this.maintain === true ? "TRUE" : "FALSE"
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes RE-QUEUE packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008082817165103291",
 *      "@response_to":"UIV220088281716486",
 *      "@type":"RE-QUEUE",
 *      "status":"OK",
 *      "message":"Success.",
 *      "detail":"The re-queue request was successfully processed.",
 *      "agent_id":{"#text":"1856"},
 *      "uii":{"#text":"200808281716090000000900028070"},
 *      "gate_number":{"#text":"19"},
 *      "maintain_agent":{"#text":"FALSE"}
 *    }
 * }
 */
RequeueRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.agentId = utils.getText(resp, 'agent_id');
    formattedResponse.uii = utils.getText(resp, 'uii');
    formattedResponse.queueId = utils.getText(resp, 'gate_number');

    if(formattedResponse.status === "OK"){
        console.log("AgentLibrary: Requeue successfull." );
    }else{
        console.warn("AgentLibrary: There was an error processing the requeue request. " + formattedResponse.message + "\n" + formattedResponse.detail);
    }

    return formattedResponse;
};
