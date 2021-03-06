function initAgentLibraryLead (context) {
    /**
     * @namespace Lead
     * @memberof AgentLibrary
     */
    
    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Get the history for a given lead
     * @memberof AgentLibrary.Lead
     * @param {number} leadId The lead id to retrieve history for
     * @param {function} [callback=null] Callback function when lead history response received
     */
    AgentLibrary.prototype.leadHistory = function(leadId, callback){
        UIModel.getInstance().leadHistoryRequest = new LeadHistoryRequest(leadId);
        var msg = UIModel.getInstance().leadHistoryRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.LEAD_HISTORY, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Insert a lead to the given campaign
     * @memberof AgentLibrary.Lead
     * @param {object} dataObj agentId, campaignId, and lead info
     * @param {function} [callback=null] Callback function when lead history response received
     */
    AgentLibrary.prototype.leadInsert = function(dataObj, callback){
        UIModel.getInstance().leadInsertRequest = new LeadInsertRequest(dataObj);
        var msg = UIModel.getInstance().leadInsertRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.LEAD_INSERT, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Update lead information
     * @memberof AgentLibrary.Lead
     * @param {string} leadId Id for lead to update
     * @param {string} leadPhone Lead phone number
     * @param {object} baggage Object containing lead information
     * @param {function} [callback=null] Callback function when lead history response received
     */
    AgentLibrary.prototype.leadUpdate = function(leadId, leadPhone, baggage, callback){
        UIModel.getInstance().leadUpdateRequest = new LeadUpdateRequest(leadId, leadPhone, baggage);
        var msg = UIModel.getInstance().leadUpdateRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.LEAD_UPDATE, callback);
        utils.sendMessage(this, msg);
    };

}
