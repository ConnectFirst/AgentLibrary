
var HangupRequest = function(sessionId, resetPendingDisp) {
    this.sessionId = sessionId || null;
    this.resetPendingDisp = resetPendingDisp || false;
};

HangupRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.HANGUP,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "uii":{
                "#text":utils.toString(UIModel.getInstance().currentCall.uii)
            },
            "session_id":{
                "#text":utils.toString(this.sessionId === null ? UIModel.getInstance().currentCall.sessionId : this.sessionId)
            },
            "cancel_pending_disp" : {
                "#text" : utils.toString(this.resetPendingDisp)
            }
        }
    };

    return JSON.stringify(msg);
};
