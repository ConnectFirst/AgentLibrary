function initAgentLibraryLead (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Get the history for a given lead
     * @memberof AgentLibrary
     * @param {function} [callback=null] Callback function when lead history response received
     */
    AgentLibrary.prototype.leadHistory = function(leadId, callback){
        UIModel.getInstance().leadHistoryRequest = new LeadHistoryRequest(leadId);
        var msg = UIModel.getInstance().leadHistoryRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.LEAD_HISTORY, callback);
        utils.sendMessage(this, msg);
    };

}
