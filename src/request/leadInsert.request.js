
var LeadInsertRequest = function(dataObj) {
    this.dataObj = dataObj;
};

/*
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"LEAD-INSERT",
 *      "agent_id":{"#text":"1"},
 *      "campaign_id":{"#text":""},
 *      "lead_phone":{"#text":""},
 *      "dialable":{"#text":""},
 *      "agent_reserved":{"#text":""},
 *      "callback_dts":{"#text":""},
 *      "first_name":{"#text":""},
 *      "mid_name":{"#text":""},
 *      "last_name":{"#text":""},
 *      "suffix":{"#text":""},
 *      "title":{"#text":""},
 *      "address1":{"#text":""},
 *      "address2":{"#text":""},
 *      "city":{"#text":""},
 *      "state":{"#text":""},
 *      "zip":{"#text":""},
 *      "email":{"#text":""},
 *      "gateKeeper":{"#text":""},
 *      "aux_data1":{"#text":""},
 *      "aux_data2":{"#text":""},
 *      "aux_data3":{"#text":""},
 *      "aux_data4":{"#text":""},
 *      "aux_data5":{"#text":""},
 *    }
 * }
 */
LeadInsertRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.LEAD_INSERT,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(this.dataObj.agentId)
            },
            "campaign_id":{
                "#text":utils.toString(this.dataObj.campaignId)
            },
            "lead_phone":{
                "#text":utils.toString(this.dataObj.leadPhone)
            },
            "dialable":{
                "#text":utils.toString(this.dataObj.dialable)
            },
            "agent_reserved":{
                "#text":utils.toString(this.dataObj.agentReserved)
            },
            "callback_dts":{
                "#text":utils.toString(this.dataObj.callbackDts)
            },
            "first_name":{
                "#text":utils.toString(this.dataObj.firstName)
            },
            "mid_name":{
                "#text":utils.toString(this.dataObj.midName)
            },
            "last_name":{
                "#text":utils.toString(this.dataObj.lastName)
            },
            "suffix":{
                "#text":utils.toString(this.dataObj.suffix)
            },
            "title":{
                "#text":utils.toString(this.dataObj.title)
            },
            "address1":{
                "#text":utils.toString(this.dataObj.address1)
            },
            "address2":{
                "#text":utils.toString(this.dataObj.address2)
            },
            "city":{
                "#text":utils.toString(this.dataObj.city)
            },
            "state":{
                "#text":utils.toString(this.dataObj.state)
            },
            "zip":{
                "#text":utils.toString(this.dataObj.zip)
            },
            "email":{
                "#text":utils.toString(this.dataObj.email)
            },
            "gateKeeper":{
                "#text":utils.toString(this.dataObj.gateKeeper)
            },
            "aux_data1":{
                "#text":utils.toString(this.dataObj.auxData1)
            },
            "aux_data2":{
                "#text":utils.toString(this.dataObj.auxData2)
            },
            "aux_data3":{
                "#text":utils.toString(this.dataObj.auxData3)
            },
            "aux_data4":{
                "#text":utils.toString(this.dataObj.auxData4)
            },
            "aux_data5":{
                "#text":utils.toString(this.dataObj.auxData5)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class processes LEAD-INSERT packets rec'd from IQ.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008091512353000875",
 *      "@response_to":"UIV220089151235539",
 *      "@type":"LEAD-INSERT",
 *      "status":{"#text":"TRUE|FALSE"},
 *      "msg":{"#text":""},
 *      "detail":{"#text":""},
 *   }
 * }
 */
LeadInsertRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var formattedResponse = utils.buildDefaultResponse(response);

    formattedResponse.message = resp.msg["#text"];

    return formattedResponse;
};
