
/*
 * This request is used to get the list of dispositions for a given campaign
 * E.g. in the lead search form for manual passes
 *
 */
var CampaignDispositionsRequest = function(campaignId) {
    this.agentId = UIModel.getInstance().agentSettings.agentId;
    this.campaignId = campaignId;
};

CampaignDispositionsRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.CAMPAIGN_DISPOSITIONS,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(this.agentId)
            },
            "campaign_id": {
                "#text":utils.toString(this.campaignId)
            }
        }
    };

    return JSON.stringify(msg);
};

/*
 * This class is responsible for handling CAMPAIGN-DISPOSITIONS packets received
 * from IntelliQueue. It will save a copy of it in the UIModel.
 *
 * {"ui_response":{
 *      "@campaign_id":"60403",
 *      "@message_id":"IQ10012016081813480400006",
 *      "@response_to":"0b61c3ca-c4fc-9942-c139-da4978053c9d",
 *      "@type":"CAMPAIGN-DISPOSITIONS",
 *      "outdial_dispositions":{
 *          "disposition":[
 *              {"@disposition_id":"1","#text":"requeue"},
 *              {"@disposition_id":"2","#text":"complete"}
 *          ]
 *       }
 *    }
 * }
 */
CampaignDispositionsRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var model = UIModel.getInstance();
    var dispositions = utils.processResponseCollection(resp, 'outdial_dispositions', 'disposition', 'disposition');

    model.outboundSettings.campaignDispositions = dispositions;
    return dispositions;
};
