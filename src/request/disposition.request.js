
var DispositionRequest = function(uii, dispId, notes, callback, callbackDTS, contactForwardNumber, survey) {
    this.uii = uii;
    this.dispId = dispId;
    this.notes = notes;
    this.callback = callback;
    this.callbackDTS = callbackDTS || "";
    this.contactForwardNumber = contactForwardNumber || null;

    /*
     * survey = {
     *      first_name: {
     *          leadField: "first_name"
     *          value: "Geoff"
     *      },
     *      last_name: {
     *          leadField: "last_name"
     *          value: "Mina"
     *      }
     *      ...
     * }
     */
    this.survey = survey || null;
};

/*
 * This class is responsible for creating an inbound or outbound disposition packet to
 * send to intelliqueue. It will grab uii and agent_id directly from packets saved
 * in the UIModel. Then, using the information passed in, it will
 * create the remainder of the packet. This class is called from the ExtendedCallForm
 *
 * {"ui_request":{
 *      "@message_id":"IQ20160817145840132",
 *      "@response_to":"",
 *      "@type":"OUTDIAL-DISPOSITION|INBOUND-DISPOSITION",
 *      "session_id":{"#text":"2"},  <-- ONLY WHEN AVAILABLE otherwise the node is left blank. this is the AGENT session_id
 *      "uii":{"#text":"201608171658440139000000000165"},
 *      "agent_id":{"#text":"1180958"},
 *      "lead_id":{"#text":"1800"},
 *      "outbound_externid":{"#text":"3038593775"},
 *      "disposition_id":{"#text":"5950"},
 *      "notes":{"#text":"note here"},
 *      "call_back":{"#text":"FALSE"},
 *      "call_back_DTS":{},
 *      "contact_forwarding":{},
 *      "survey":{
 *          "response":[
 *              {"@extern_id":"text_box","@lead_update_column":"","#text":"hello"},
 *              {"@extern_id":"check_box","@lead_update_column":"","#text":"20"},
 *              {"@extern_id":"radio_save","@lead_update_column":"","#text":"23"}
 *          ]
 *      }
 *   }
 * }
 */
DispositionRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "@type":MESSAGE_TYPES.OUTDIAL_DISPOSITION,
            "agent_id": {
                "#text" : utils.toString(model.agentSettings.agentId)
            },
            "session_id":{
                "#text": ""
            },
            "uii": {
                "#text" : utils.toString(this.uii)
            },
            "disposition_id": {
                "#text" : utils.toString(this.dispId)
            },
            "notes": {
                "#text" : utils.toString(this.notes)
            },
            "call_back": {
                "#text" : this.callback === true? "TRUE" : "FALSE"
            },
            "call_back_DTS": {
                "#text" : utils.toString(this.callbackDTS)
            },
            "contact_forwarding": {
                "#text" : utils.toString(this.contactForwardNumber)
            }
        }
    };


    if(model.currentCall.outdialDispositions && model.currentCall.outdialDispositions.type === "GATE") {
        msg.ui_request['@type'] = MESSAGE_TYPES.INBOUND_DISPOSITION;
    }

    if(model.currentCall.sessionId){
        msg.ui_request.session_id = {"#text":model.currentCall.sessionId};
    }

    /*
     * converts survey to this response
     * survey : {
     *      response: [
     *          { "@extern_id":"", "@lead_update_column":"", "#text":"" }
     *      ]
     * }
     */
    if(this.survey !== null){
        var response = [];
        var keys = Object.keys(this.survey);
        for(var i = 0; i < keys.length; i++){
            var key = keys[i];
            var obj = {
                "@extern_id": key,
                "@lead_update_column": utils.toString(this.survey[key].leadField),
                "#text": utils.toString(this.survey[key].value)
            };
            response.push(obj);
        }
        msg.ui_request.survey = {"response":response};
    }


    return JSON.stringify(msg);
};
