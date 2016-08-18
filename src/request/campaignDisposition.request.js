
/*
 * This request is used to get the list of dispositions for a given campaign
 * E.g. in the lead search form for manual passes
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
  <ui_response message_id="IQ982008091512353000875"  response_to="UIV220089151235539" type="CAMPAIGN-DISPOSITIONS">
  		<outdial_dispositions>
     		<disposition disposition_id="130">complete</disposition>
     		<disposition disposition_id="131">incomplete</disposition>
     		<disposition disposition_id="132">warm xfer</disposition>
     		<disposition disposition_id="133">cold xfer</disposition>
   	</outdial_dispositions>
  </ui_response>
 */
CampaignDispositionsRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var model = UIModel.getInstance();
    var dispositions = utils.processResponseCollection(resp, 'outdial_dispositions', 'disposition', 'disposition');

    model.outboundSettings.campaignDispositions = dispositions;
    return dispositions;
};
