
var OffhookInitRequest = function(showWarning) {

};

OffhookInitRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.OFFHOOK_INIT,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "dial_dest":{
                "#text":UIModel.getInstance().agentSettings.dialDest
            }
        }
    };

    return JSON.stringify(msg);
};


/*
 * This class is responsible for handling an off-hook-init response packet from IntelliQueue.
 * If the offhookinit is successful, it will go into the UIModel and set the isOffhook variable
 * to true.
 *
 * <ui_response type="OFF-HOOK-INIT" message_id="UI2005" response_to="">
 * 		<status>OK|FAILURE</status>
 * 		<message></message>
 * 		<detail></detail>
 * </ui_response>
 */
OffhookInitRequest.prototype.processResponse = function(response) {
    var status = response.ui_response.status['#text'];
    if(status === 'OK'){
        UIModel.getInstance().offhookInitPacket = response;
        UIModel.getInstance().agentSettings.isOffhook = true;
    }else{
        UIModel.getInstance().logger.error(this,"Unable to process offhook request, " + packet.detail[0]);
        console.log("AgentLibrary: Unable to process offhook request ", response.ui_response.detail['#text']);
    }
};

