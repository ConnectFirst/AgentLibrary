
var CallbackCancelRequest = function(leadId, agentId) {
    this.agentId = agentId || UIModel.getInstance().agentSettings.agentId;
    this.leadId = leadId;
};

CallbackCancelRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CALLBACK_CANCEL,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":this.agentId    
            },
            "lead_id":{
                "#text":this.leadId
            }
        }
    };

    return JSON.stringify(msg);
};


