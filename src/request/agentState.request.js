
var AgentStateRequest = function(agentState, agentAuxState) {
    if(agentState.toUpperCase() == "ON-BREAK" && UIModel.getInstance().onCall == true){
        this.agentState = "BREAK-AFTER-CALL";
        this.agentAuxState = "";
    }else{
        this.agentState = agentState.toUpperCase() || "";
        this.agentAuxState = agentAuxState || "";
    }
};

AgentStateRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.AGENT_STATE,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "state":{
                "#text":this.agentState
            },
            "agent_aux_state":{
                "#text":this.agentAuxState
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes AGENT-STATE packets rec'd from IQ. It will check the state of the
 * packet and then set the state on the model. It will also check for deferred surveys,
 * if one is found it will load it at this point.
 *
 * <ui_response message_id="IQ982008082817165103294" type="AGENT-STATE">
 *	  <status>OK</status>
 * 	  <message/>
 *	  <detail/>
 *	  <agent_id>1856</agent_id>
 *	  <prev_state>ENGAGED</prev_state>
 *	  <current_state>WORKING</current_state>
 * 	  <agent_aux_state>Offhook Work</agent_aux_state>
 * 	  <prev_aux_state></prev_aux_state>
 * </ui_response>
 */
AgentStateRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var status = utils.getText(resp, "status");
    var prevState = utils.getText(resp, "prev_state");
    var currState = utils.getText(resp, "current_state");
    var prevAuxState = utils.getText(resp, "prev_aux_state");
    var currAuxState = utils.getText(resp, "agent_aux_state");
    var model = UIModel.getInstance();

    // add message and detail if present
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.agentId = response.ui_response.agent_id['#text'] || "";
    formattedResponse.previousState = prevState;
    formattedResponse.currentState = currState;
    formattedResponse.previousAuxState = prevAuxState;
    formattedResponse.currentAuxState = currAuxState;

    if(status=="OK"){
        var prevStateStr = prevState;
        var currStateStr = currState;

        if(prevAuxState.length > 0){
            prevStateStr = prevAuxState;
        }

        if(currAuxState.length > 0){
            currStateStr = currAuxState;
        }

        console.log("AgentLibrary: Agent state changed from [" + prevStateStr + "] to [" + currStateStr + "]" );

        // Update the state in the UIModel
        model.agentSettings.currentState = currState;
        model.agentSettings.currentStateLabel = currAuxState;
        model.agentStatePacket = response;
    }else{
        if(formattedResponse.message === ""){
            formattedResponse.message = "Unable to change agent state";
        }
        console.warn("AgentLibrary: Unable to change agent state " + formattedResponse.detail);
    }

    return formattedResponse;
};


