
var CallNotesRequest = function(notes) {
    this.notes = notes;
};

/*
* This event is responsible for allowing an agent to tag a call with notes
*/
CallNotesRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "@type":MESSAGE_TYPES.CALL_NOTES,
            "agent_id": {
                "#text" : utils.toString(model.agentSettings.agentId)
            },
            "uii": {
                "#text" : utils.toString(model.currentCall.uii)
            },
            "notes": {
                "#text" : utils.toString(this.notes)
            }
        }
    };

    return JSON.stringify(msg);
};


/*
 * This class process CALL-NOTES packets rec'd from IntelliQueue.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008082817165103294",
 *      "@type":"CALL-NOTES",
 *      "status":{"#text":"OK"},
 *      "message":{},
 *      "detail":{}
 *   }
 * }
 */
CallNotesRequest.prototype.processResponse = function(response) {
    var formattedResponse = utils.buildDefaultResponse(response);

    if(formattedResponse.status === "OK"){
        formattedResponse.message = "Call notes have been updated.";
        formattedResponse.type = "INFO_EVENT";
    }else{
        formattedResponse.type = "ERROR_EVENT";
        formattedResponse.message = "Unable to update notes.";
    }

    return formattedResponse;
};
