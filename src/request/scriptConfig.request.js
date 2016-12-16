
var ScriptConfigRequest = function(scriptId, version) {
    this.scriptId = scriptId;
    this.version = version;
};

/*
* This event is responsible for requesting a script object
*/
ScriptConfigRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "@type":MESSAGE_TYPES.SCRIPT_CONFIG,
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "script_id": {
                "#text" : utils.toString(this.scriptId)
            }
        }
    };

    return JSON.stringify(msg);
};


/*
 * This class process SCRIPT-CONFIG packets received from IntelliQueue.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008082817165103294",
 *      "@response_to":"",
 *      "@type":"SCRIPT-CONFIG",
 *      "status":{"#text":"OK"},
 *      "message":{},
 *      "script_id":{"#text":"123"},
 *      "version":{"#text":"1"},
 *      "json":{},
 *   }
 * }
 */
ScriptConfigRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);

    if(formattedResponse.status === "true"){
        formattedResponse.status = true;
        formattedResponse.scriptId = utils.getText(resp, 'script_id');
        formattedResponse.version = utils.getText(resp, 'version');
        formattedResponse.json = utils.getText(resp, 'json');

        // store script on model
        UIModel.getInstance().scriptSettings.loadedScripts[formattedResponse.scriptId] = formattedResponse;
    }else{
        formattedResponse.status = false;
    }

    return formattedResponse;
};
