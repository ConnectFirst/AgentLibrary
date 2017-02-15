function initAgentLibraryAgent (context) {
    /**
     * @namespace Agent
     * @memberof AgentLibrary
     */

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Sends agent login message to IntelliServices
     * @memberof AgentLibrary.Agent
     * @param {string} username Agent's username
     * @param {string} password Agent's password
     * @param {function} [callback=null] Callback function when loginAgent response received
     */
    AgentLibrary.prototype.loginAgent = function(username, password, callback){
        UIModel.getInstance().loginRequest = new LoginRequest(username, password);
        var msg = UIModel.getInstance().loginRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.LOGIN, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends agent configure message (2nd layer login) to IntelliQueue
     * @memberof AgentLibrary.Agent
     * @param {string} dialDest The agent's number, sip | DID.
     * @param {string[]} [queueIds=null] The queue ids the agent will be logged into.
     * @param {string[]} [chatIds=null] The chat ids the agent will be logged into.
     * @param {string} [skillProfileId=null] The skill profile the agent will be logged into.
     * @param {string} [dialGroupId=null] The outbound dial group id the agent will be logged into.
     * @param {string} [updateFromAdminUI=false] Whether the request is generated from the AdminUI or not.
     * @param {function} [callback=null] Callback function when configureAgent response received.
     */
    AgentLibrary.prototype.configureAgent = function(dialDest, queueIds, chatIds, skillProfileId, dialGroupId, updateFromAdminUI, callback){
        UIModel.getInstance().configRequest = new ConfigRequest(dialDest, queueIds, chatIds, skillProfileId, dialGroupId, updateFromAdminUI);
        var msg = UIModel.getInstance().configRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CONFIG, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends agent logout message to IntelliQueue
     * @memberof AgentLibrary.Agent
     * @param {number} agentId Id of the agent that will be logged out.
     * @param {function} [callback=null] Callback function when logoutAgent response received.
     */
    AgentLibrary.prototype.logoutAgent = function(agentId, callback){
        UIModel.getInstance().logoutRequest = new LogoutRequest(agentId);
        utils.setCallback(this, CALLBACK_TYPES.LOGOUT, callback);
        UIModel.getInstance().agentSettings.isLoggedIn = false;

        // Agent requested logout, just close socket??
        utils.fireCallback(this, CALLBACK_TYPES.LOGOUT, "");
        this.closeSocket();

    };

    /**
     * Sends agent logout for the given agent to logout message to IntelliQueue
     * @memberof AgentLibrary.Agent
     * @param {number} agentToLogout Id of the agent that will be logged out.
     * @param {number} [requestMessage=""] Message to send for the logout request.
     * @param {function} [callback=null] Callback function when logoutAgent response received.
     */
    AgentLibrary.prototype.requestLogoutAgent = function(agentToLogout, requestMessage, callback){
        var isSupervisor = UIModel.getInstance().agentSettings.agentType === 'SUPERVISOR';
        UIModel.getInstance().logoutRequest = new LogoutRequest(agentToLogout, requestMessage, isSupervisor);
        utils.setCallback(this, CALLBACK_TYPES.LOGOUT, callback);

        if(UIModel.getInstance().logoutRequest.isSupervisor){
            //This is a supervisor request to log an agent out. Create the
            //logout packet and then send the packet to IntelliQueue.
            var msg = UIModel.getInstance().logoutRequest.formatJSON();
            utils.sendMessage(this, msg);
        }
    };

    /**
     * Sends agent state change message to IntelliQueue
     * @memberof AgentLibrary.Agent
     * @param {string} agentState The system/base state to transition to <br />
     * AVAILABLE | TRANSITION | ENGAGED | ON-BREAK | WORKING | AWAY | LUNCH | AUX-UNAVAIL-NO-OFFHOOK | AUX-UNAVAIL-OFFHOOK
     * @param {string} [agentAuxState=""] The aux state display label
     * @param {function} [callback=null] Callback function when agentState response received
     */
    AgentLibrary.prototype.setAgentState = function(agentState, agentAuxState, callback){
        UIModel.getInstance().agentStateRequest = new AgentStateRequest(agentState, agentAuxState);
        var msg = UIModel.getInstance().agentStateRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.AGENT_STATE, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Initiates an agent offhook session
     * @memberof AgentLibrary.Agent
     * @param {function} [callback=null] Callback function when offhookInit response received
     */
    AgentLibrary.prototype.offhookInit = function(callback){
        UIModel.getInstance().offhookInitRequest = new OffhookInitRequest();
        var msg = UIModel.getInstance().offhookInitRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.OFFHOOK_INIT, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Terminates agent's offhook session
     * @memberof AgentLibrary.Agent
     * @param {function} [callback=null] Callback function when offhookTerm response received
     */
    AgentLibrary.prototype.offhookTerm = function(forceOffhook){
        UIModel.getInstance().offhookTermRequest = new OffhookTermRequest(forceOffhook);
        var msg = UIModel.getInstance().offhookTermRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Returns scheduled callbacks for the given agent
     * @memberof AgentLibrary.Agent
     * @param {number} [agentId=logged in agent id] Id of agent to get callbacks for
     * @param {function} [callback=null] Callback function when pending callbacks response received
     */
    AgentLibrary.prototype.getPendingCallbacks = function(agentId, callback){
        UIModel.getInstance().callbacksPendingRequest = new CallbacksPendingRequest(agentId);
        var msg = UIModel.getInstance().callbacksPendingRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CALLBACK_PENDING, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Cancel a scheduled callback for the given agent based on lead id
     * @memberof AgentLibrary.Agent
     * @param {number} leadId Id of lead callback to cancel
     * @param {number} [agentId=logged in agent id] Id of agent to cancel specified lead callback for
     * @param {function} [callback=null] Callback function when callback is canceled
     */
    AgentLibrary.prototype.cancelCallback = function(leadId, agentId, callback){
        UIModel.getInstance().callbackCancelRequest = new CallbackCancelRequest(leadId, agentId);
        var msg = UIModel.getInstance().callbackCancelRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CALLBACK_CANCEL, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Request stats messages to be sent every 5 seconds. The stats responses will be sent as
     * four possible callback types: agentStats, agentDailyStats, campaignStats, or queueStats
     * @memberof AgentLibrary.Agent
     */
    AgentLibrary.prototype.requestStats = function(){
        // start stats interval timer, request stats every 5 seconds
        UIModel.getInstance().statsIntervalId = setInterval(utils.sendStatsRequestMessage, 5000);
    };

    /**
     * Reconnect the agent session, similar to configureAgent, but doesn't reset set all
     * configure values if not needed.
     * @memberof AgentLibrary.Agent
     */
    AgentLibrary.prototype.reconnect = function(){
        UIModel.getInstance().reconnectRequest = new ReconnectRequest();
        var msg = UIModel.getInstance().reconnectRequest.formatJSON();

        UIModel.getInstance().statsIntervalId = setInterval(utils.sendStatsRequestMessage, 5000);
    };

}
