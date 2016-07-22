
var AgentStateRequest = function(props) {
    this.agentState = props.agentState;
    this.agentAuxState = props.agentAuxState;
    this.isSupervisor = props.isSupervisor;
};

AgentStateRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":"LOGOUT",
            "agent_id":{
                "#text":this.agentId
            },
            "message":{
                "#text":this.message
            }
        }
    };

    msg.ui_request['@message_id'] = utils.getMessageId();
    msg.ui_request['@response_to'] = "";

    return JSON.stringify(msg);
};