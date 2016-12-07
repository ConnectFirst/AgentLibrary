function initAgentLibraryChat (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Set the agent chat alias
     * @memberof AgentLibrary
     * @param {string} alias The alias string to be used for agent chat messages
     */
    AgentLibrary.prototype.setChatAlias = function(alias){
        UIModel.getInstance().chatAliasRequest = new ChatAliasRequest(alias);
        var msg = UIModel.getInstance().chatAliasRequest.formatJSON();

        utils.sendMessage(this, msg);
    };

    /**
     * Request to enter/exit a public chat room
     * @memberof AgentLibrary
     * @param {string} action "ENTER" | "EXIT"
     * @param {integer} roomId Chat room id
     */
    AgentLibrary.prototype.publicChatRoom = function(action, roomId){
        UIModel.getInstance().chatRoomRequest = new ChatRoomRequest(action, "PUBLIC", roomId);
        var msg = UIModel.getInstance().chatRoomRequest.formatJSON();

        utils.sendMessage(this, msg);
    };

    /**
     * Request to enter/exit a private chat room
     * @memberof AgentLibrary
     * @param {string} action "ENTER" | "EXIT"
     * @param {integer} roomId Chat room id
     * @param {integer} agentOne Id for the logged in agent
     * @param {integer} agentTwo Id for the agent or supervisor the logged in agent is chatting with
     */
    AgentLibrary.prototype.privateChatRoom = function(action, roomId, agentOne, agentTwo){
        UIModel.getInstance().chatRoomRequest = new ChatRoomRequest(action, "PRIVATE", roomId, agentOne, agentTwo);
        var msg = UIModel.getInstance().chatRoomRequest.formatJSON();

        utils.sendMessage(this, msg);
    };

    /**
     * Send a chat message to the given room
     * @memberof AgentLibrary
     * @param {integer} roomId Id for chat room
     * @param {string} message The message to be sent
     * @param {function} [callback=null] Callback function when chat message received
     */
    AgentLibrary.prototype.sendChat = function(roomId, message, callback){
        UIModel.getInstance().chatSendRequest = new ChatSendRequest(roomId, message);
        var msg = UIModel.getInstance().chatSendRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CHAT, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Get list of supervisors for logged in agent
     * @memberof AgentLibrary
     * @param {function} [callback=null] Callback function when chat message received
     */
    AgentLibrary.prototype.getSupervisors = function(callback){
        UIModel.getInstance().supervisorListRequest = new SupervisorListRequest();
        var msg = UIModel.getInstance().supervisorListRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.SUPERVISOR_LIST, callback);
        utils.sendMessage(this, msg);
    };

}
