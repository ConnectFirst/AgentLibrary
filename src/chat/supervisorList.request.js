
var SupervisorListRequest = function() {

};

/*
 * This class is responsible for creating a packet to request a list of
 * supervisors from IntelliServices. This is used by the chat function so an
 * agent can grab a list of supervisors and then select one for a private chat.
 *
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"SUPERVISOR-LIST",
 *      "agent_id":{"#text":""}
 *    }
 * }
 */
SupervisorListRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IS",
            "@type":MESSAGE_TYPES.SUPERVISOR_LIST,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class is responsible for handling the SUPERVISOR-LIST packet
 * rec'd from intelliservices. It will save a copy of this list in the
 * UIModel under a variable called "supervisors". Whenever a new list
 * is rec'd it is overwritten.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008082910361503344",
 *      "@response_to":"",
 *      "supervisor":[
 *          {"id":{"#text":""}, "fname":{"#text":""}, "lname":{"#text":""}, "uname":{"#text":""} }
 *          {"id":{"#text":""}, "fname":{"#text":""}, "lname":{"#text":""}, "uname":{"#text":""} }
 *      ]
 *    }
 * }
 */

SupervisorListRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var model = UIModel.getInstance();

    utils.logMessage(LOG_LEVELS.DEBUG, "New supervisor list received ", response);
    model.supervisors = utils.processResponseCollection(response, "ui_response", "supervisor");

    return model.supervisors;
};