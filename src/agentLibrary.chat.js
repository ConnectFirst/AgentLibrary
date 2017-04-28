function initAgentLibraryChat (context) {
    /**
     * @namespace Chat
     * @memberof AgentLibrary
     */

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Set the agent chat alias
     * @memberof AgentLibrary.Chat
     * @param {string} alias The alias string to be used for agent chat messages
     */
    AgentLibrary.prototype.setChatAlias = function(alias){
        UIModel.getInstance().chatAliasRequest = new ChatAliasRequest(alias);
        var msg = UIModel.getInstance().chatAliasRequest.formatJSON();

        utils.sendMessage(this, msg);
    };

    /**
     * Request to enter/exit a public chat room
     * @memberof AgentLibrary.Chat
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
     * @memberof AgentLibrary.Chat
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
     * @memberof AgentLibrary.Chat
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
     * @memberof AgentLibrary.Chat
     * @param {function} [callback=null] Callback function when chat message received
     */
    AgentLibrary.prototype.getSupervisors = function(callback){
        UIModel.getInstance().supervisorListRequest = new SupervisorListRequest();
        var msg = UIModel.getInstance().supervisorListRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.SUPERVISOR_LIST, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Send accept/decline response when a chat is presented to an agent
     * @memberof AgentLibrary.Chat
     * @param {string} uii Unique identifier for the chat session
     * @param {number} sessionId The agent's session id
     * @param {string} response ACCEPT|REJECT response
     * @param {string} responseReason Agent reason for Reject
     */
    AgentLibrary.prototype.chatPresentedResponse = function(uii, sessionId, response, responseReason){
        UIModel.getInstance().chatPresentedRequest = new ChatPresentedRequest(uii, sessionId, response, responseReason);
        var msg = UIModel.getInstance().chatPresentedRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Send an external chat message
     * @memberof AgentLibrary.Chat
     * @param {string} uii Unique identifier for the chat session
     * @param {string} accountId The account associated with the chat queue
     * @param {string} message The message sent by the agent
     * @param {function} [callback=null] Callback function when chat message received
     */
    AgentLibrary.prototype.chatMessage = function(uii, accountId, message, callback){
        UIModel.getInstance().chatMessageRequest = new ChatMessageRequest(uii, accountId, message);
        var msg = UIModel.getInstance().chatMessageRequest.formatJSON();
        utils.setCallback(this, CALLBACK_TYPES.CHAT_MESSAGE, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Send a disposition to end a chat session
     * @memberof AgentLibrary.Chat
     * @param {string} uii Unique identifier for the chat session
     * @param {number} agentId The agent's id
     * @param {number} dispositionId Id of the selected disposition
     * @param {number} sessionId Id of the Agent's session
     * @param {string} [notes=""] Agent notes
     * @param {object} [script=null] Script data associated with the chat session
     */
    AgentLibrary.prototype.chatDisposition = function(uii, agentId, dispositionId, sessionId, notes, script){
        UIModel.getInstance().chatDispositionRequest = new ChatDispositionRequest(uii, agentId, dispositionId, sessionId, notes, script);
        var msg = UIModel.getInstance().chatDispositionRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Send the chat to a different Chat Queue
     * @memberof AgentLibrary.Chat
     * @param {string} uii Unique identifier for the chat session
     * @param {number} agentId The agent's id
     * @param {number} chatQueueId Id of the Chat Queue to requeue to
     * @param {number} skillId Skill id associated with the Chat Queue
     * @param {boolean} [maintainAgent=fakse] Whether or not to keep the current agent connected to the chat on requeue
     */
    AgentLibrary.prototype.chatRequeue = function(uii, agentId, chatQueueId, skillId, maintainAgent){
        UIModel.getInstance().chatRequeueRequest = new ChatRequeueRequest(uii, agentId, chatQueueId, skillId, maintainAgent);
        var msg = UIModel.getInstance().chatRequeueRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Sent when agent starts/stops typing
     * @memberof AgentLibrary.Chat
     * @param {string} uii Unique identifier for the chat session
     * @param {number} accountId The account id associated with the Chat Queue
     * @param {boolean} isTyping Whether or not the agent is currently typing
     */
    AgentLibrary.prototype.chatTyping = function(uii, accountId, isTyping){
        UIModel.getInstance().chatTypingRequest = new ChatTypingRequest(uii, accountId, isTyping);
        var msg = UIModel.getInstance().chatTypingRequest.formatJSON();
        utils.sendMessage(this, msg);
    };
}
