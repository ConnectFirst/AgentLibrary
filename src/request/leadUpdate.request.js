
var LeadUpdateRequest = function(leadId, leadPhone, baggage) {
    this.leadId = leadId;
    this.leadPhone = leadPhone;
    this.baggage = baggage;
    this.agentId = utils.toString(UIModel.getInstance().agentSettings.agentId);
};

/*
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"LEAD-UPDATE",
 *      "agent_id":{"#text":"1"},
 *      "lead_id":{"#text":"12"},
 *      "lead_phone":{"#text":"12"},
 *       "baggage":{
 *          "lead_id":{"#text":"64306"},
 *          "extern_id":{"#text":"9548298548"},
 *          "first_name":{"#text":"Ryant"},
 *          "mid_name":{},
 *          "last_name":{"#text":"Taylor"},
 *          "state":{"#text":"OH"},
 *          "aux_data1":{"#text":"BMAK"},
 *          "aux_data2":{"#text":"BMAK-041653-934"},
 *          "aux_data3":{"#text":"Call Ctr 1"},
 *          "aux_data4":{},
 *          "aux_data5":{},
 *          "address1":{"#text":"8010 Maryland Ave"},
 *          "address2":{},
 *          "city":{"#text":"Cleveland"},
 *          "zip":{"#text":"44105"},
 *          "aux_external_url":{},
 *          "aux_greeting":{},
 *          "aux_phone":{}
 *      },
 *    }
 * }
 */
LeadUpdateRequest.prototype.formatJSON = function() {
    // make sure required baggage fields are present
    this.baggage = _formatBaggage(this.baggage);
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.LEAD_UPDATE,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":this.agentId
            },
            "lead_id":{
                "#text":utils.toString(this.leadId)
            },
            "lead_phone":{
                "#text":utils.toString(this.leadPhone)
            },
            "baggage": this.baggage
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes LEAD-UPDATE packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008091512353000875",
 *      "@response_to":"UIV220089151235539",
 *      "@type":"LEAD-UPDATE",
 *      "status":{"#text":"TRUE|FALSE"},
 *      "msg":{"#text":"64306"},
 *      "detail":{"#text":"64306"},
 *   }
 * }
 */
LeadUpdateRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.message = resp.msg["#text"];

    return formattedResponse;
};

_formatBaggage = function(baggage){
    baggage.first_name = {"#text": baggage.first_name || ""};
    baggage.mid_name = {"#text":baggage.mid_name || ""};
    baggage.last_name = {"#text":baggage.last_name || ""};
    baggage.suffix =  {"#text":baggage.suffix || ""};
    baggage.title = {"#text":baggage.title || ""};
    baggage.address1 = {"#text":baggage.address1 || ""};
    baggage.address2 = {"#text":baggage.address2 || ""};
    baggage.city = {"#text":baggage.city || ""};
    baggage.state = {"#text":baggage.state || ""};
    baggage.zip = {"#text":baggage.zip || ""};
    baggage.email = {"#text":baggage.email || ""};
    baggage.gate_keeper = {"#text":baggage.gate_keeper || ""};
    baggage.extern_id = {"#text":baggage.extern_id || ""};
    baggage.aux_data1 = {"#text":baggage.aux_data1 || ""};
    baggage.aux_data2 = {"#text":baggage.aux_data2 || ""};
    baggage.aux_data3 = {"#text":baggage.aux_data3 || ""};
    baggage.aux_data4 = {"#text":baggage.aux_data4 || ""};
    baggage.aux_data5 = {"#text":baggage.aux_data5 || ""};

    return baggage;
};
