
var DirectAgentTransferList = function() { };

DirectAgentTransferList.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination": "IQ",
            "@type": MESSAGE_TYPES.DIRECT_AGENT_TRANSFER_LIST,
            "@message_id": utils.getMessageId(),
            "@response_to": "",
            "agent_id":{
                "#text": UIModel.getInstance().agentSettings.agentId
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes DIRECT-AGENT-TRANSFER-LIST packets rec'd from IQ.
 *
 *  {
 *      "ui_response":{
 *          "@message_id":"IQD01DEV2018052917202600038",
 *          "@response_to":"f0b2e8a3-87fe-13ee-4d00-9d145bfe2be8",
 *          "@type":"DIRECT-AGENT-TRANSFER-LIST",
 *          "status":{
 *              "#text":"true"
 *          },
 *          "message":{
 *              "#text":"OK"
 *          },
 *          "agents":{
 *              "agent": [
 *                  {
 *                      "@agent_aux_state":"AVAILABLE",
 *                      "@agent_id":"1184160",
 *                      "@agent_state":"AVAILABLE",
 *                      "@available":"true",
 *                      "@first_name":"ross",
 *                      "@last_name":"m",
 *                      "@pending_disp":"false",
 *                      "@state_duration":"379",
 *                      "@username":"rm1"
 *                  },
 *                  {
 *                      "@agent_aux_state":"AVAILABLE",
 *                      "@agent_id":"1184161",
 *                      "@agent_state":"AVAILABLE",
 *                      "@available":"true",
 *                      "@first_name":"ross",
 *                      "@last_name":"m",
 *                      "@pending_disp":"false",
 *                      "@state_duration":"84",
 *                      "@username":"rm2"
 *                  }
 *              ]
 *          }
 *      }
 *  }
 */
DirectAgentTransferList.prototype.processResponse = function(response) {
    var formattedResponse = utils.buildDefaultResponse(response);
    formattedResponse.agents = utils.processResponseCollection(response, 'ui_response', 'agents');

    if(formattedResponse.status !== "OK"){
        // log message response
        var message = "There was an error processing the Direct Agent Transfer List request. " + formattedResponse.message + " : " + formattedResponse.detail;
        utils.logMessage(LOG_LEVELS.WARN, message, response);
    }

    return formattedResponse;
};
