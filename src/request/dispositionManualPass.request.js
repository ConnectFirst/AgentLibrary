
var DispositionManualPassRequest = function(dispId, notes, callback, callbackDTS, leadId, requestId, externId) {
    this.dispId = dispId;
    this.notes = notes;
    this.callback = callback;
    this.callbackDTS = callbackDTS || "";
    this.leadId = leadId || null;
    this.requestId = requestId || null;
    this.externId = externId || null;
};

/*
 * Sends an OUTDIAL-DISPOSITION request, just a separate class
 * specifically for dispositions on manual pass.
 *
 * {"ui_request":{
 *      "@message_id":"UIV220089241119416",
 *      "@response_to":"",
 *      "@type":"OUTDIAL-DISPOSITION",
 *      "manual_disp":{"#text":"TRUE"},
 *      "request_key":{"#text":"IQ10012016081719070100875"},
 *      "session_id":{},
 *      "uii":{},
 *      "agent_id":{"#text":"1810"},
 *      "lead_id":{"#text":"213215"},
 *      "outbound_externid":{"#text":"909809"},
 *      "disposition_id":{"#text":"126"},
 *      "notes":{"#text":"here are my notes :)"},
 *      "call_back":{"#text":"TRUE | FALSE"},
 *      "call_back_DTS":{"#text":"2008-09-30 22:30:00 | null"},
 *      "contact_forwarding":{"#text":"null"}
 *    }
 * }
 */
DispositionManualPassRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "@type":MESSAGE_TYPES.OUTDIAL_DISPOSITION,
            "manual_disp": {
                "#text" : "TRUE"
            },
            "agent_id": {
                "#text" : utils.toString(model.agentSettings.agentId)
            },
            "request_key": {
                "#text": utils.toString(this.requestId)
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
            "lead_id": {
                "#text" : utils.toString(this.leadId)
            },
            "extern_id": {
                "#text" : utils.toString(this.externId)
            },
            "contact_forwarding": {
                "#text": "null"
            },
            "session_id":{},
            "uii": {}
        }
    };

    return JSON.stringify(msg);
};
