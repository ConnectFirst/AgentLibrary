
var LeadHistoryRequest = function(leadId) {
    this.leadId = leadId;
};

/*
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"LEAD-HISTORY",
 *      "agent_id":{"#text":"1"},
 *      "lead_id":{"#text":"12"},
 *    }
 * }
 */
LeadHistoryRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.LEAD_HISTORY,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(model.agentSettings.agentId)
            },
            "lead_id":{
                "#text":utils.toString(this.leadId)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes LEAD-HISTORY packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@lead_id":"2653",
 *      "@message_id":"IQ982008091512353000875",
 *      "@response_to":"UIV220089151235539",
 *      "@type":"LEAD-HISTORY",
 *      "previous_dial":{
 *          "@agent_name":"mandy pants (mandy)",
 *          "@duration":"",
 *          "@pass_disposition":"",
 *          "@pass_dts":"2008-09-15 12:35:27",
 *          "@pass_number":"",
 *          "@pass_uii":"200809151234140000000900021288",
 *          "agent_notes":{"#text":"This person was incredibly nice and agreed to buy donuts. "},
 *          "agent_disposition":{"#text":"Incomplete"}
 *      }
 *   }
 * }
 *
 * OR
 *
 * {"ui_response":{
 *      "@lead_id":"2653",
 *      "@message_id":"IQ982008091512353000875",
 *      "@response_to":"UIV220089151235539",
 *      "@type":"LEAD-HISTORY",
 *      "previous_dial":[
 *        {
 *          "@agent_name":"mandy pants (mandy)",
 *          "@duration":"",
 *          "@pass_disposition":"",
 *          "@pass_dts":"2008-09-15 12:35:27",
 *          "@pass_number":"",
 *          "@pass_uii":"200809151234140000000900021288",
 *          "agent_notes":{"#text":"This person was incredibly nice and agreed to buy donuts. "},
 *          "agent_disposition":{"#text":"Incomplete"}
 *        },
 *        {
 *          "@agent_name":"mandy pants (mandy)",
 *          "@duration":"",
 *          "@pass_disposition":"",
 *          "@pass_dts":"2008-09-15 12:35:27",
 *          "@pass_number":"",
 *          "@pass_uii":"200809151234140000000900021288",
 *          "agent_notes":{"#text":"This person was incredibly nice and agreed to buy donuts. "},
 *          "agent_disposition":{"#text":"Incomplete"}
 *        }
 *      ]
 *   }
 * }
 */
LeadHistoryRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var histResponse = {
        leadId: resp['@lead_id']
    };

    var history = utils.processResponseCollection(response, 'ui_response', 'previous_dial');

    // always return array, even if only one item
    if(!Array.isArray(history)){
        history = [history];
    }
    histResponse.leadHistory = history;

    return histResponse;
};
