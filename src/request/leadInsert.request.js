
var LeadInsertRequest = function(dataObj) {
    // handle boolean value conversion
    if(dataObj.agent_reserved && dataObj.agent_reserved === true){
        dataObj.agent_reserved = "1";
    }else{
        dataObj.agent_reserved = "0";
    }

    if(dataObj.dialable && dataObj.dialable === true){
        dataObj.dialable = "1";
    }else{
        dataObj.dialable = "0";
    }

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
                "#text":utils.toString(this.dataObj.agent_id)
            },
            "campaign_id":{
                "#text":utils.toString(this.dataObj.campaign_id)
            },
            "lead_phone":{
                "#text":utils.toString(this.dataObj.lead_phone)
            },
            "dialable":{
                "#text":utils.toString(this.dataObj.dialable)
            },
            "agent_reserved":{
                "#text":utils.toString(this.dataObj.agent_reserved)
            },
            "call_back_dts":{
                "#text":utils.toString(this.dataObj.callback_dts)
            },
            "first_name":{
                "#text":utils.toString(this.dataObj.first_name)
            },
            "mid_name":{
                "#text":utils.toString(this.dataObj.mid_name)
            },
            "last_name":{
                "#text":utils.toString(this.dataObj.last_name)
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
            "gate_keeper":{
                "#text":utils.toString(this.dataObj.gate_keeper)
            },
            "aux_data1":{
                "#text":utils.toString(this.dataObj.aux_data1)
            },
            "aux_data2":{
                "#text":utils.toString(this.dataObj.aux_data2)
            },
            "aux_data3":{
                "#text":utils.toString(this.dataObj.aux_data3)
            },
            "aux_data4":{
                "#text":utils.toString(this.dataObj.aux_data4)
            },
            "aux_data5":{
                "#text":utils.toString(this.dataObj.aux_data5)
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
