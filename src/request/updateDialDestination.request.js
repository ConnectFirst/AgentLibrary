
var UpdateDialDestinationRequest = function(dialDest, isSoftphoneError) {
    this.dialDest = dialDest;
    this.isSoftphoneError = isSoftphoneError || false;
};

/*
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":MESSAGE_TYPES.UPDATE_DIAL_DESTINATION,
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "agent_id":"1",
 *      "dial_dest":{"#text":"blah@something.com"},
 *      "log_softphone_error": {"#text":"TRUE|FALSE"},
 *    }
 * }
 */
UpdateDialDestinationRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.UPDATE_DIAL_DESTINATION,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "dial_dest":{
                "#text":utils.toString(this.dialDest)
            },
            "log_softphone_error":{
                "#text":utils.toString(this.isSoftphoneError === true ? "TRUE" : "FALSE")
            }
        }
    };

    return JSON.stringify(msg);
};


