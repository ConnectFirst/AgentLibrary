
var ScriptResultRequest = function(uii, scriptId, jsonResult) {
    this.uii = uii;
    this.scriptId = scriptId;
    this.jsonResult = jsonResult;
};

/*
* This event is responsible for sending the script result object
*/
ScriptResultRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "@type":MESSAGE_TYPES.SCRIPT_RESULT,
            "agent_id": {
                "#text" : utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "uii":{
                "#text":utils.toString(this.uii)
            },
            "script_id": {
                "#text" : utils.toString(this.scriptId)
            },
            "json_result": {
                "#text": JSON.stringify(this.jsonResult)
            }
        }
    };

    return JSON.stringify(msg);
};
