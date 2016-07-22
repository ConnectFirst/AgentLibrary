
var LogoutRequest = function(props) {
    this.agentId = props.agentId;
    this.message = props.message;
    this.isSupervisor = props.isSupervisor;
};

LogoutRequest.prototype.formatJSON = function() {
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