
var CallbacksPendingRequest = function(agentId) {
    this.agentId = agentId || UIModel.getInstance().agentSettings.agentId;
};

CallbacksPendingRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CALLBACK_PENDING,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":this.agentId
            }
        }
    };

    return JSON.stringify(msg);
};


/*
 * This class is responsible for handling an PENDING-CALLBACKS response packet from IntelliQueue.
 *
 * {"ui_response":{
 *      "@message_id":"IQ982008091512353000875",
 *      "@response_to":"UIV220089151235539",
 *      "@type":"PENDING-CALLBACKS",
 *      "lead":{
 *          "@aux_data1":"",
 *          "@aux_data2":"",
 *          "@aux_data3":"",
 *          "@aux_data4":"",
 *          "@aux_data5":"",
 *          "@destination":"5555555555",
 *          "@dial_group_id":"",
 *          "@dial_group_name":"",
 *          "@dial_time":"2016-08-03 10:00",
 *          "@extern_id":"",
 *          "@lead_id":"",
 *          "lead_id":{},
 *          "extern_id":{},
 *          "extern_id":{},
 *          "first_name":{},
 *          "mid_name":{},
 *          "last_name":{},
 *          "suffix":{},
 *          "title":{},
 *          "address1":{},
 *          "address2":{},
 *          "city":{},
 *          "state":{},
 *          "zip":{},
 *          "gate_keeper":{}
 *      }
 *   }
 * }
 */
CallbacksPendingRequest.prototype.processResponse = function(response) {
    var leadsRaw = response.ui_response.lead;
    var leads = [];
    if(!Array.isArray(leadsRaw)) {
        leadsRaw = [leadsRaw];
    }

    for(var l = 0; l < leadsRaw.length; l++){
        var leadRaw = leadsRaw[l];
        if (leadRaw == null) {
            continue;
        }

        leads.push(parseLead(leadRaw));
    }

    UIModel.getInstance().agentSettings.pendingCallbacks = JSON.parse(JSON.stringify(leads));

    return UIModel.getInstance().agentSettings.pendingCallbacks;
};

function parseLead(leadRaw){
    var lead = {
        auxData1 : leadRaw['@aux_data1'],
        auxData2 : leadRaw['@aux_data2'],
        auxData3 : leadRaw['@aux_data3'],
        auxData4 : leadRaw['@aux_data4'],
        auxData5 : leadRaw['@aux_data5'],
        destination : leadRaw['@destination'],
        dialGroupId : leadRaw['@dial_group_id'],
        dialGroupName : leadRaw['@dial_group_name'],
        dialTime : leadRaw['@dial_time'],
        externId : leadRaw['@extern_id'],
        leadId : leadRaw['@lead_id'],
        firstName : utils.getText(leadRaw, "first_name"),
        midName : utils.getText(leadRaw, "mid_name"),
        lastName : utils.getText(leadRaw, "last_name"),
        sufix : utils.getText(leadRaw, "suffix"),
        title : utils.getText(leadRaw, "title"),
        address1 : utils.getText(leadRaw, "address1"),
        address2 : utils.getText(leadRaw, "address2"),
        city : utils.getText(leadRaw, "city"),
        state : utils.getText(leadRaw, "state"),
        zip : utils.getText(leadRaw, "zip"),
        gateKeeper : utils.getText(leadRaw, "gate_keeper")
    };

    return lead;
}
