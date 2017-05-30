
var ChatDispositionRequest = function(uii, agentId, dispositionId, notes, sendAcknowlegement, survey) {
    this.uii = uii;
    this.agentId = agentId;
    this.dispositionId = dispositionId;
    this.notes = notes || "";
    this.sendAcknowlegement = sendAcknowlegement || false;

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
 *      "notes":{"#text":"hello"},
 *      "do_ack":{"#text":"true"},
 *      "survey":{
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
            "notes":{
                "#text":utils.toString(this.notes)
            },
            "do_ack":{
                "#text":utils.toString(this.sendAcknowlegement)
            }
        }
    };

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
                "#text": utils.toString(this.survey[key].value)
            };
            response.push(obj);
        }
        msg.ui_request.survey = {"response":response};
    }

    return JSON.stringify(msg);
};

