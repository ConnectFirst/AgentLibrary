function initAgentLibraryAgent (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Sends agent login message to IntelliServices
     * @memberof AgentLibrary
     * @param {string} username Agent's username
     * @param {string} password Agent's password
     * @param {function} callback Callback function when loginAgent response received
     */
    AgentLibrary.prototype.loginAgent = function(username, password, callback){
        UIModel.getInstance().loginRequest = new LoginRequest(username, password);
        var msg = UIModel.getInstance().loginRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.LOGIN, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends agent configure message (2nd layer login) to IntelliQueue
     * @memberof AgentLibrary
     * @param {string[]} [queueIds=null] The queue ids the agent will be logged into.
     * @param {string[]} [chatIds=null] The chat ids the agent will be logged into.
     * @param {string} [skillProfileId=null] The skill profile the agent will be logged into.
     * @param {string} [outdialGroupId=null] The outbound dial group id the agent will be logged into.
     * @param {string} dialDest The agent's number, sip | DID.
     * @param {function} callback Callback function when configureAgent response received.
     */
    AgentLibrary.prototype.configureAgent = function(queueIds, chatIds, skillProfileId, outdialGroupId, dialDest, callback){
        UIModel.getInstance().configRequest = new ConfigRequest(queueIds, chatIds, skillProfileId, outdialGroupId, dialDest);
        var msg = UIModel.getInstance().configRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CONFIG, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends agent logout message to IntelliQueue
     * @memberof AgentLibrary
     * @param {number} agentId Id of the agent that will be logged out.
     * @param {function} callback Callback function when logoutAgent response received.
     */
    AgentLibrary.prototype.logoutAgent = function(agentId, callback){
        UIModel.getInstance().logoutRequest = new LogoutRequest(agentId);
        utils.setCallback(this, CALLBACK_TYPES.LOGOUT, callback);

        if(UIModel.getInstance().logoutRequest.isSupervisor){
            //This is a supervisor request to log an agent out. Create the
            //logout packet and then send the packet to IntelliQueue.
            var msg = UIModel.getInstance().logoutRequest.formatJSON();
            utils.sendMessage(this, msg);
        }else{
            // Agent requested logout, just close socket??
            utils.fireCallback(this, CALLBACK_TYPES.LOGOUT, "");
            this.closeSocket();
        }

    };

    /**
     * Sends agent state change message to IntelliQueue
     * @memberof AgentLibrary
     * @param {string} agentState The system/base state to transition to <br />
     * AVAILABLE | TRANSITION | ENGAGED | ON-BREAK | WORKING | AWAY | LUNCH | AUX-UNAVAIL-NO-OFFHOOK | AUX-UNAVAIL-OFFHOOK
     * @param {string} [agentAuxState=""] The aux state display label
     * @param {function} callback Callback function when agentState response received
     */
    AgentLibrary.prototype.setAgentState = function(agentState, agentAuxState, callback){
        UIModel.getInstance().agentStateRequest = new AgentStateRequest(agentState, agentAuxState);
        var msg = UIModel.getInstance().agentStateRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.AGENT_STATE, callback);
        utils.sendMessage(this, msg);
    };
}
