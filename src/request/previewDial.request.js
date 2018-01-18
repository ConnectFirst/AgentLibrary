
var PreviewDialRequest = function(action, searchFields, requestId, leadPhone) {
    this.agentId = UIModel.getInstance().agentSettings.agentId;
    this.searchFields = searchFields || [];
    this.requestId = requestId || "";
    this.action = action || "";
    this.leadPhone = leadPhone || "";   // pipe leads only
};

/*
 * searchFields = [
 *  {key: "name", value: "Danielle"},
 *  {key: "number", value: "5555555555"
 * ];
 */
PreviewDialRequest.prototype.formatJSON = function() {
    var fields = {};
    for(var i =0; i < this.searchFields.length; i++){
        var fieldObj = this.searchFields[i];
        fields[fieldObj.key] = { "#text" : utils.toString(fieldObj.value) };
    }

    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.PREVIEW_DIAL,
            "@message_id":utils.getMessageId(),
            "@action":this.action,
            "@response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "pending_request_id":{
                "#text":utils.toString(this.requestId)
            },
            "lead_phone":{
                "#text":utils.toString(this.leadPhone)
            },
            "search_fields": fields
                // { "name": {"#text": "Danielle" } }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class is responsible for handling PREVIEW-DIAL packets received
 * from the dialer. It will save a copy of it in the UIModel.
 *
 * {"dialer_request":{
 *      "@action":"", // <-- empty for Preview fetch, otherwise "SEARCH"
 *      "@callbacks":"TRUE|FALSE"
 *      ,"@message_id":"ID2008091513163400220",
 *      "@response_to":"",
 *      "@type":"PREVIEW_DIAL",
 *      "dial_group_id":{"#text":"200018"},
 *      "account_id":{"#text":"99999999"},
 *      "agent_id":{"#text":"1810"},
 *      "is_insert":{"#text":"TRUE|FALSE"}, <--- TRUE if search triggered by insert
 *      "destinations":{
 *          "lead":[
 *              {
 *                  "@aux_data1":"","@aux_data2":"","@aux_data3":"","@aux_data4":"","@aux_data5":"",
 *                  "@aux_phone":"","@campaign_id":"51","@destination":"9548298548","@dnis":"1112223333",
 *                  "@extern_id":"amanda","@lead_id":"2646","@lead_state":"PENDING","@live_answer_msg":"",
 *                  "@mach_answer_msg":"","@machine_detect":"FALSE","@request_key":"IQ982008091516241101125",
 *                  "@valid_until":"2008-09-15 17:24:11","extern_id":{"#text":"9548298548"},
 *                  "first_name":{"#text":"Amanda"},"mid_name":{"#text":"Amanda"},"last_name":{"#text":"Machutta2"},
 *                  "address1":{},"address2":{},"city":{},"state":{},"zip":{},"aux_greeting":{},
 *                  "aux_external_url":{}
 *              },
 *          ]
 *      }
 *    }
 * }
 */
PreviewDialRequest.prototype.processResponse = function(notification) {
    var notif = notification.dialer_request;
    var model = UIModel.getInstance();
    var leads = utils.processResponseCollection(notif, 'destinations', 'lead');

    // send over requestId (as well as requestKey for backwards compatibility)
    // to match previewLeadState.notification property
    for(var l = 0; l < leads.length; l++){
        leads[l].requestId = leads[l].requestKey;
    }

    var formattedResponse = {
        action: notif['@action'],
        callbacks: notif['@callbacks'] === "TRUE",
        dialGroupId: utils.getText(notif,"dial_group_id"),
        accountId: utils.getText(notif,"account_id"),
        agentId: utils.getText(notif,"agent_id"),
        isInsert: utils.getText(notif,"is_insert"),
        leads: leads
    };

    if(notif['@callbacks'] === 'TRUE'){
        utils.logMessage(LOG_LEVELS.INFO, "New CALLBACK packet request rec'd from dialer", notification);
        // clear callbacks??
        //model.callbacks = [];
        for(var l = 0; l < leads.length; l++){
            var lead = leads[l];
            model.callbacks.push(lead);
        }
    }else{
        model.outboundSettings.previewDialLeads = leads;
    }

    return formattedResponse;
};
