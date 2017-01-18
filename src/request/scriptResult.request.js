
var ScriptResultRequest = function(uii, scriptId, jsonResult) {
    this.uii = uii;
    this.scriptId = scriptId;
    this.jsonResult = jsonResult;
};

/*
* This event is responsible for sending the script result object
*/
ScriptResultRequest.prototype.formatJSON = function() {
    // format survey response object
    var formattedJson = _formatResponse(this.jsonResult);
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
                "#text": JSON.stringify(formattedJson)
            }
        }
    };

    return JSON.stringify(msg);
};


_formatResponse = function(result){
    var res = {};

    for(var i = 0; i < Object.keys(result).length; i++){
        var key = Object.keys(result)[i];
        res[key] = result[key].value || "";
    }

    return res;
};
