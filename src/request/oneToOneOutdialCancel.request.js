
var OneToOneOutdialCancelRequest = function(uii) {
    this.uii = uii
};

/*
 * This class is responsible for creating a new packet to cancel
 * an in-progress outbound call.
 */
OneToOneOutdialCancelRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.ONE_TO_ONE_OUTDIAL_CANCEL,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "uii":{
                "#text":utils.toString(this.uii)
            }
        }
    };

    return JSON.stringify(msg);
};



