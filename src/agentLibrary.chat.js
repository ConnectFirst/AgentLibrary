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
     * @param {string} response ACCEPT|REJECT response
     * @param {string} responseReason Agent reason for Reject
     */
    AgentLibrary.prototype.chatPresentedResponse = function(uii, messageId, response, responseReason){
        UIModel.getInstance().chatPresentedRequest = new ChatPresentedResponseRequest(uii, messageId, response, responseReason);
        var msg = UIModel.getInstance().chatPresentedRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Send an external chat message
     * @memberof AgentLibrary.Chat
     * @param {string} uii Unique identifier for the chat session
     * @param {string} agentId The agent associated with the chat
     * @param {string} message The message sent by the agent
     */
    AgentLibrary.prototype.chatMessage = function(uii, agentId, message){
        UIModel.getInstance().chatMessageRequest = new ChatMessageRequest(uii, agentId, message, false);
        var msg = UIModel.getInstance().chatMessageRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Send an whisper type chat message
     * @memberof AgentLibrary.Chat
     * @param {string} uii Unique identifier for the chat session
     * @param {string} agentId The agent associated with the chat
     * @param {string} message The message sent by the agent
     */
    AgentLibrary.prototype.chatWhisper = function(uii, agentId, message){
        UIModel.getInstance().chatMessageRequest = new ChatMessageRequest(uii, agentId, message, true);
        var msg = UIModel.getInstance().chatMessageRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Send a disposition to end a chat session
     * @memberof AgentLibrary.Chat
     * @param {string} uii Unique identifier for the chat session
     * @param {number} agentId The agent's id
     * @param {number} dispositionId Id of the selected disposition
     * @param {string} [notes=""] Agent notes
     * @param {boolean} sendAcknowlegement Whether or not to fire callback
     * @param {object} [script=null] Script data associated with the chat session
     */
    AgentLibrary.prototype.chatDisposition = function(uii, agentId, dispositionId, notes, sendAcknowlegement, script){
        UIModel.getInstance().chatDispositionRequest = new ChatDispositionRequest(uii, agentId, dispositionId, notes, sendAcknowlegement, script);
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
     */
    AgentLibrary.prototype.chatTyping = function(uii){
        UIModel.getInstance().chatTypingRequest = new ChatTypingRequest(uii);
        var msg = UIModel.getInstance().chatTypingRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Request to add a session on an existing chat
     * @memberof AgentLibrary.Chat
     * @param {string} uii Unique identifier for the chat session
     * @param {string} agentId Current logged in agent id
     * @param {string} monitorAgentId Agent id handling this chat
     */
    AgentLibrary.prototype.monitorChat = function(uii, agentId, monitorAgentId){
        UIModel.getInstance().monitorChatRequest = new MonitorChatRequest(uii, agentId, monitorAgentId);
        var msg = UIModel.getInstance().monitorChatRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Request to terminate an active chat session
     * @memberof AgentLibrary.Chat
     * @param {string} uii Unique identifier for the chat session
     * @param {string} agentId Current logged in agent id
     * @param {string} sessionId Chat session id
     */
    AgentLibrary.prototype.leaveChat = function(uii, agentId, sessionId){
        UIModel.getInstance().leaveChatRequest = new LeaveChatRequest(uii, agentId, sessionId);
        var msg = UIModel.getInstance().leaveChatRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Request a list of active chats by agent id
     * @memberof AgentLibrary.Chat
     * @param {string} uii Unique identifier for the chat session
     * @param {string} agentId Current logged in agent id
     * @param {string} monitorAgentId Agent id handling chats
     */
    AgentLibrary.prototype.chatList = function(agentId, monitorAgentId){
        UIModel.getInstance().chatList = new ChatListRequest(agentId, monitorAgentId);
        var msg = UIModel.getInstance().chatList.formatJSON();
        utils.sendMessage(this, msg);
    };
}
