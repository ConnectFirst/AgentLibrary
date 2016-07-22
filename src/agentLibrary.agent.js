function initAgentLibraryAgent (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Sends agent login message to IntelliServices
     * @memberof AgentLibrary
     * @param {Object} props Contains login properties:
     * 'username' {String}
     * 'password' {String}
     * @param {function} callback Callback function when loginAgent response received
     */
    AgentLibrary.prototype.loginAgent = function(props, callback){
        UIModel.getInstance().loginRequest = new LoginRequest(props);
        var msg = UIModel.getInstance().loginRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.LOGIN, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends agent configure message (2nd layer login) to IntelliQueue
     * @memberof AgentLibrary
     * @param {Object} props Contains configuration properties:
     * 'gateIds' {array} [gateIds=null],
     * 'chatIds' {array} optional,
     * 'skillId' {string} optional,
     * 'outdialGroupId' {string} optional,
     * 'dialDest' {string} required,
     * 'loginType' {string} 'NO-SELECTION' | 'INBOUND' | 'OUTBOUND' | 'BLENDED' required ,
     * 'updateFromAdminUI' {boolean} optional,
     * 'ipAddress' {string} required
     * @param {function} callback Callback function when configureAgent response received
     */
    AgentLibrary.prototype.configureAgent = function(props, callback){
        UIModel.getInstance().configRequest = new ConfigRequest(props);
        var msg = UIModel.getInstance().configRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CONFIG, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends agent logout message to IntelliQueue
     * @memberof AgentLibrary
     * @param {Object} props Contains logout properties:
     * <li>'agentId' {number}</li>
     * @param {function} callback Callback function when logoutAgent response received
     */
    AgentLibrary.prototype.logoutAgent = function(props, callback){
        UIModel.getInstance().logoutRequest = new LogoutRequest(props);
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
     * @param {Object} props Contains agent state properties:
     * @param {function} callback Callback function when agentState response received
     */
    AgentLibrary.prototype.setAgentState = function(props, callback){
        UIModel.getInstance().agentStateRequest = new AgentStateRequest(props);
        var msg = UIModel.getInstance().agentStateRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.AGENT_STATE, callback);
        utils.sendMessage(this, msg);
    };
}
