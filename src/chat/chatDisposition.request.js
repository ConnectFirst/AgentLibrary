
var ChatDispositionRequest = function(uii, agentId, dispositionId, sessionId, notes, script) {
    this.uii = uii;
    this.agentId = agentId;
    this.dispositionId = dispositionId;
    this.sessionId = sessionId;
    this.notes = notes || "";

    /*
     * script = {
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
    this.script = script || null;
};

/*
 * External Chat:
 * When agent dispositions a chat, send "CHAT-DISPOSITION" request to IntelliQueue
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@type":"CHAT-DISPOSITION",
 *      "@message_id":"",
 *      "@response_to":"",
 *      "uii":{"#text":""},
 *      "agent_id":{"#text":""},
 *      "disposition_id":{"#text":""},
 *      "session_id":{"#text":""},
 *      "notes":{"#text":"hello"},
 *      "script":{
 *          "response":[
 *              {"@extern_id":"text_box","#text":"hello"},
 *              {"@extern_id":"check_box","#text":"20"},
 *              {"@extern_id":"radio_save","#text":"23"}
 *          ]
 *      }
 *    }
 * }
 */
ChatDispositionRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CHAT_DISPOSITION,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "uii":{
                "#text":utils.toString(this.uii)
            },
            "agent_id":{
                "#text":utils.toString(this.accountId)
            },
            "disposition_id":{
                "#text":utils.toString(this.dispositionId)
            },
            "session_id":{
                "#text": utils.toString(this.sessionId)
            },
            "notes":{
                "#text":utils.toString(this.notes)
            }
        }
    };

    /*
     * converts script to this response
     * script : {
     *      response: [
     *          { "@extern_id":"", "@lead_update_column":"", "#text":"" }
     *      ]
     * }
     */
    if(this.script !== null){
        var response = [];
        var keys = Object.keys(this.script);
        for(var i = 0; i < keys.length; i++){
            var key = keys[i];
            var obj = {
                "@extern_id": key,
                "#text": utils.toString(this.script[key].value)
            };
            response.push(obj);
        }
        msg.ui_request.script = {"response":response};
    }

    return JSON.stringify(msg);
};

