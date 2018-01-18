
// CONSTANTS


/*jshint esnext: true */
const LOG_LEVELS ={
    "DEBUG":"debug",
    "STATS":"stats",
    "INFO":"info",
    "WARN":"warn",
    "ERROR":"error"
};

// add all callback types to setCallback method description
const CALLBACK_TYPES = {
    "ADD_SESSION":"addSessionNotification",
    "AGENT_STATE":"agentStateResponse",
    "ACK":"acknowledgeResponse",
    "BARGE_IN":"bargeInResponse",
    "CLOSE_SOCKET":"closeResponse",
    "COACH_CALL":"coachResponse",
    "CONFIG":"configureResponse",
    "CALL_NOTES":"callNotesResponse",
    "CALLBACK_PENDING":"callbacksPendingResponse",
    "CALLBACK_CANCEL":"callbackCancelResponse",
    "CAMPAIGN_DISPOSITIONS":"campaignDispositionsResponse",
    "CHAT":"chatResponse",                          // internal chat
    "CHAT_ACTIVE":"chatActiveNotification",         // external chat
    "CHAT_CANCELLED":"chatCancelledNotification",   // external chat
    "CHAT_INACTIVE":"chatInactiveNotification",     // external chat
    "CHAT_PRESENTED":"chatPresentedNotification",   // external chat
    "CHAT_TYPING":"chatTypingNotification",         // external chat
    "CHAT_MESSAGE":"chatMessageNotification",       // external chat
    "CHAT_NEW":"chatNewNotification",               // external chat
    "CHAT_LIST":"chatListResponse",                 // external chat
    "CHAT_ROOM_STATE":"chatRoomStateResponse",
    "DIAL_GROUP_CHANGE":"dialGroupChangeNotification",
    "DIAL_GROUP_CHANGE_PENDING":"dialGroupChangePendingNotification",
    "DROP_SESSION":"dropSessionNotification",
    "EARLY_UII":"earlyUiiNotification",
    "END_CALL":"endCallNotification",
    "GATES_CHANGE":"gatesChangeNotification",
    "GENERIC_NOTIFICATION":"genericNotification",
    "GENERIC_RESPONSE":"genericResponse",
    "HOLD":"holdResponse",
    "LOG_RESULTS":"logResultsResponse",
    "LOGIN":"loginResponse",
    "LOGOUT":"logoutResponse",
    "NEW_CALL":"newCallNotification",
    "LEAD_HISTORY":"leadHistoryResponse",
    "LEAD_INSERT":"leadInsertResponse",
    "LEAD_SEARCH":"leadSearchResponse",
    "LEAD_UPDATE":"leadUpdateResponse",
    "OFFHOOK_INIT":"offhookInitResponse",
    "OFFHOOK_TERM":"offhookTermNotification",
    "OPEN_SOCKET":"openResponse",
    "PAUSE_RECORD":"pauseRecordResponse",
    "PENDING_DISP":"pendingDispNotification",
    "PREVIEW_FETCH":"previewFetchResponse",
    "PREVIEW_LEAD_STATE":"previewLeadStateNotification",
    "RECORD":"recordResponse",
    "REQUEUE":"requeueResponse",
    "REVERSE_MATCH":"reverseMatchNotification",
    "SAFE_MODE_FETCH":"safeModeFetchResponse",
    "SAFE_MODE_SEARCH":"safeModeSearchResponse",
    "SCRIPT_CONFIG":"scriptConfigResponse",
    "SILENT_MONITOR":"monitorResponse",
    "STATS_AGENT":"agentStats",
    "STATS_AGENT_DAILY":"agentDailyStats",
    "STATS_CAMPAIGN":"campaignStats",
    "STATS_QUEUE":"queueStats",
    "STATS_CHAT_QUEUE":"chatQueueStats",
    "SUPERVISOR_LIST":"supervisorListResponse",
    "TCPA_SAFE_LEAD_STATE":"tcpaSafeLeadStateNotification",
    "XFER_COLD":"coldXferResponse",
    "XFER_WARM":"warmXferResponse"
};

const MESSAGE_TYPES = {
    "ACK":"ACK",
    "ADD_SESSION":"ADD-SESSION",
    "BARGE_IN":"BARGE-IN",
    "AGENT_STATE":"AGENT-STATE",
    "CALL_NOTES":"CALL-NOTES",
    "CALLBACK_PENDING":"PENDING-CALLBACKS",
    "CALLBACK_CANCEL":"CANCEL-CALLBACK",
    "CAMPAIGN_DISPOSITIONS":"CAMPAIGN-DISPOSITIONS",
    "CHAT_SEND":"CHAT",                                     // internal chat
    "CHAT_ALIAS":"CHAT-ALIAS",                              // internal chat
    "CHAT_ROOM":"CHAT-ROOM",                                // internal chat
    "CHAT_ROOM_STATE":"CHAT-ROOM-STATE",                    // internal chat
    "CHAT_ACTIVE":"CHAT-ACTIVE",                            // external chat
    "CHAT_CANCELLED":"CHAT-CANCELLED",                      // external chat
    "CHAT_INACTIVE":"CHAT-INACTIVE",                        // external chat
    "CHAT_DISPOSITION":"CHAT-DISPOSITION",                  // external chat
    "CHAT_MESSAGE":"CHAT-MESSAGE",                          // external chat
    "CHAT_NEW":"NEW-CHAT",                                  // external chat
    "CHAT_PRESENTED":"CHAT-PRESENTED",                      // external chat
    "CHAT_PRESENTED_RESPONSE":"CHAT-PRESENTED-RESPONSE",    // external chat
    "CHAT_REQUEUE":"CHAT-REQUEUE",                          // external chat
    "CHAT_TYPING":"CHAT-TYPING",                            // external chat
    "MONITOR_CHAT":"CHAT-MONITOR",                          // external chat
    "LEAVE_CHAT":"CHAT-DROP-SESSION",                       // external chat
    "CHAT_LIST":"CHAT-LIST",                                // external chat
    "CHAT_AGENT_END" : "CHAT-END",                          // external chat
    "DIAL_GROUP_CHANGE":"DIAL_GROUP_CHANGE",
    "DIAL_GROUP_CHANGE_PENDING":"DIAL_GROUP_CHANGE_PENDING",
    "DROP_SESSION":"DROP-SESSION",
    "EARLY_UII":"EARLY_UII",
    "END_CALL":"END-CALL",
    "GATES_CHANGE":"GATES_CHANGE",
    "GENERIC":"GENERIC",
    "HANGUP":"HANGUP",
    "HOLD":"HOLD",
    "INBOUND_DISPOSITION":"INBOUND-DISPOSITION",
    "LEAD_HISTORY":"LEAD-HISTORY",
    "LEAD_INSERT":"LEAD-INSERT",
    "LEAD_UPDATE":"LEAD-UPDATE",
    "LOGIN":"LOGIN",
    "LOGOUT":"LOGOUT",
    "NEW_CALL":"NEW-CALL",
    "OFFHOOK_INIT":"OFF-HOOK-INIT",
    "OFFHOOK_TERM":"OFF-HOOK-TERM",
    "ON_MESSAGE":"ON-MESSAGE",
    "ONE_TO_ONE_OUTDIAL":"ONE-TO-ONE-OUTDIAL",
    "ONE_TO_ONE_OUTDIAL_CANCEL":"ONE-TO-ONE-OUTDIAL-CANCEL",
    "OUTDIAL_DISPOSITION":"OUTDIAL-DISPOSITION",
    "PAUSE_RECORD":"PAUSE-RECORD",
    "PING_CALL":"PING-CALL",
    "PREVIEW_DIAL":"PREVIEW-DIAL",
    "PENDING_DISP":"PENDING_DISP",
    "PREVIEW_DIAL_ID":"PREVIEW_DIAL",
    "PREVIEW_LEAD_STATE":"PREVIEW-LEAD-STATE",
    "RECORD":"RECORD",
    "REQUEUE":"RE-QUEUE",
    "REVERSE_MATCH":"REVERSE_MATCH",
    "SCRIPT_CONFIG":"SCRIPT-CONFIG",
    "SCRIPT_RESULT":"SCRIPT-RESULT",
    "STATS":"STATS",
    "STATS_AGENT":"AGENT",
    "STATS_AGENT_DAILY":"AGENTDAILY",
    "STATS_CAMPAIGN":"CAMPAIGN",
    "STATS_QUEUE":"GATE",
    "STATS_CHAT":"CHAT",
    "SUPERVISOR_LIST":"SUPERVISOR-LIST",                // internal chat
    "TCPA_SAFE":"TCPA-SAFE",
    "TCPA_SAFE_ID":"TCPA_SAFE",
    "TCPA_SAFE_LEAD_STATE":"TCPA-SAFE-LEAD-STATE",
    "XFER_COLD":"COLD-XFER",
    "XFER_WARM":"WARM-XFER",
    "XFER_WARM_CANCEL":"WARM-XFER-CANCEL"
};


/*
 * Init wrapper for the core module.
 * @param {Object} The Object that the library gets attached to in
 * library.init.js.  If the library was not loaded with an AMD loader such as
 * require.js, this is the global Object.
 */
function initAgentLibraryCore (context) {
    'use strict';

    /**
     * This is the constructor for the Library Object. Note that the constructor is also being
     * attached to the context that the library was loaded in.
     * @param {Object} [config={}] Set socket url and callback functions.
     * @constructor
     * @namespace Core
     * @memberof AgentLibrary
     * @property {object} callbacks Internal map of registered callback functions
     * @property {array} _requests Internal map of requests by message id, private property.
     * @property {array} _queuedMsgs Array of pending messages to be sent when socket reconnected
     * @property {boolean} _isReconnect Whether or not we are doing a reconnect for the socket
     * @example
     * var Lib = new AgentLibrary({
     *      socketDest:'ws://d01-test.cf.dev:8080',
     *      callbacks: {
     *          closeResponse: onCloseFunction,
     *          openResponse: onOpenFunction
     *      }
     * });
     */
    var AgentLibrary = context.AgentLibrary = function (config) {

        config = config || {};

        // define properties
        this.callbacks = {};
        this._requests = [];
        this._queuedMsgs = [];
        this._isReconnect = false;

        // start with new model instance
        UIModel.resetInstance();

        // set instance on model object
        UIModel.getInstance().libraryInstance = this;

        // initialize indexedDB for logging
        this.openLogger();

        // set default values
        if(typeof config.callbacks !== 'undefined'){
            this.callbacks = config.callbacks;
        }

        if(typeof config.socketDest !== 'undefined'){
            UIModel.getInstance().applicationSettings.socketDest = config.socketDest;
            this.openSocket();
        }else{
            // todo default socket address?
        }

        return this;
    };

    /**
     * Set multiple callback functions based on type
     * @memberof AgentLibrary.Core
     * @param {Object} callbackMap Contains map of callback types to their respective functions:<br />
     * <tt>callbackMap = {<br />
     *      closeResponse: onCloseFunction,<br />
     *      openResponse: onOpenFunction<br />
     * }
     * </tt>
     *<br />
     * Possible callback types:
     * <li>"addSessionNotification"</li>
     * <li>"agentStateResponse"</li>
     * <li>"acknowledgeResponse"</li>
     * <li>"bargeInResponse"</li>
     * <li>"closeResponse"</li>
     * <li>"coachResponse"</li>
     * <li>"configureResponse"</li>
     * <li>"callNotesResponse"</li>
     * <li>"callbacksPendingResponse"</li>
     * <li>"callbackCancelResponse"</li>
     * <li>"campaignDispositionsResponse"</li>
     * <li>"chatResponse"</li>
     * <li>"dialGroupChangeNotification"</li>
     * <li>"dialGroupChangePendingNotification"</li>
     * <li>"dropSessionNotification"</li>
     * <li>"earlyUiiNotification"</li>
     * <li>"endCallNotification"</li>
     * <li>"gatesChangeNotification"</li>
     * <li>"genericNotification"</li>
     * <li>"genericResponse"</li>
     * <li>"holdResponse"</li>
     * <li>"leadSearchResponse"</li>
     * <li>"loginResponse"</li>
     * <li>"logoutResponse"</li>
     * <li>"monitorResponse"</li>
     * <li>"newCallNotification"</li>
     * <li>"offhookInitResponse"</li>
     * <li>"offhookTermNotification"</li>
     * <li>"openResponse"</li>
     * <li>"pauseRecordResponse"</li>
     * <li>"pendingDispNotification"</li>
     * <li>"previewFetchResponse"</li>
     * <li>"previewLeadStateNotification"</li>
     * <li>"recordResponse"</li>
     * <li>"requeueResponse"</li>
     * <li>"reverseMatchNotification"</li>
     * <li>"safeModeFetchResponse"</li>
     * <li>"safeModeSearchResponse"</li>
     * <li>"scriptConfigResponse"</li>
     * <li>"supervisorListResponse"</li>
     * <li>"coldXferResponse"</li>
     * <li>"warmXferResponse"</li>
     * <li>"agentStats"</li>
     * <li>"agentDailyStats"</li>
     * <li>"campaignStats"</li>
     * <li>"queueStats"</li>
     * <li>"chatQueueStats"</li>
     * @type {object}
     */
    AgentLibrary.prototype.setCallbacks = function(callbackMap) {
        for(var property in callbackMap) {
            this.callbacks[property] = callbackMap[property];
        }
    };


    /**
     * Set an individual callback function for the given type
     * @memberof AgentLibrary.Core
     * @param {string} type The name of the event that fires the callback function
     * @param {function} callback The function to call for the given type
     */
    AgentLibrary.prototype.setCallback = function(type, callback) {
        this.callbacks[type] = callback;
    };

    /**
     * Get the map of all registered callbacks
     * @memberof AgentLibrary.Core
     * @returns {array}
     */
    AgentLibrary.prototype.getCallbacks = function(){
        return this.callbacks;
    };

    /**
     * Get a given registered callback by type
     * @memberof AgentLibrary.Core
     * @returns {object}
     */
    AgentLibrary.prototype.getCallback = function(type){
        return this.callbacks[type];
    };

    /**
     * Get the socket connection to IntelliSocket
     * @memberof AgentLibrary.Core
     * @returns {object}
     */
    AgentLibrary.prototype.getSocket = function(type){
        return this.socket;
    };

    /**
     * @namespace Requests
     * @memberof AgentLibrary.Core
     */

    ////////////////////////////
    // requests and responses //
    ////////////////////////////
    /**
     * Get outgoing Login Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getLoginRequest = function() {
        return UIModel.getInstance().loginRequest;
    };
    /**
     * Get outgoing Config Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getConfigRequest = function() {
        return UIModel.getInstance().configRequest;
    };
    /**
     * Get outgoing Logout Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getLogoutRequest = function() {
        return UIModel.getInstance().logoutRequest;
    };
    /**
     * Get latest Agent Daily Stats object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentDailyStats = function() {
        return UIModel.getInstance().agentDailyStats;
    };
    /**
     * Get latest Call Tokens object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getCallTokens = function() {
        return UIModel.getInstance().callTokens;
    };
    /**
     * Get latest outgoing Agent State Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentStateRequest = function() {
        return UIModel.getInstance().agentStateRequest;
    };
    /**
     * Get latest outgoing offhook init Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getOffhookInitRequest = function() {
        return UIModel.getInstance().offhookInitRequest;
    };
    /**
     * Get latest outgoing offhook termination Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getOffhookTermRequest = function() {
        return UIModel.getInstance().offhookTermRequest;
    };
    /**
     * Get latest outgoing Hangup Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getHangupRequest = function() {
        return UIModel.getInstance().hangupRequest;
    };
    /**
     * Get latest outgoing Preview Dial Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getPreviewDialRequest = function() {
        return UIModel.getInstance().previewDialRequest;
    };
    /**
     * Get latest TCPA Safe Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getTcpaSafeRequest = function() {
        return UIModel.getInstance().tcpaSafeRequest;
    };
    /**
     * Get latest Manual Outdial Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getManualOutdialRequest = function() {
        return UIModel.getInstance().oneToOneOutdialRequest;
    };
    /**
     * Get latest Manual Outdial Cancel Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getManualOutdialCancelRequest = function() {
        return UIModel.getInstance().oneToOneOutdialCancelRequest;
    };
    /**
     * Get latest Call Notes Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getCallNotesRequest = function() {
        return UIModel.getInstance().callNotesRequest;
    };
    /**
     * Get latest Campaign Dispositions Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getCampaignDispositionsRequest = function() {
        return UIModel.getInstance().campaignDispositionsRequest;
    };
    /**
     * Get latest Disposition Call Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getDispositionRequest = function() {
        return UIModel.getInstance().dispositionRequest;
    };
    /**
     * Get latest Disposition Manual Pass Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getDispositionManualPassRequest = function() {
        return UIModel.getInstance().dispositionManualPassRequest;
    };
    /**
     * Get latest Warm Transfer Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getWarmTransferRequest = function() {
        return UIModel.getInstance().warmXferRequest;
    };
    /**
     * Get latest Cold Transfer Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getColdTransferRequest = function() {
        return UIModel.getInstance().coldXferRequest;
    };
    /**
     * Get latest Warm Transfer Cancel Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getWarmTransferCancelRequest = function() {
        return UIModel.getInstance().warmXferCancelRequest;
    };
    /**
     * Get latest Requeue Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getRequeueRequest = function() {
        return UIModel.getInstance().requeueRequest;
    };
    /**
     * Get latest Barge-In Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getBargeInRequest = function() {
        return UIModel.getInstance().bargeInRequest;
    };
    /**
     * Get latest Hold Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getHoldRequest = function() {
        return UIModel.getInstance().holdRequest;
    };
    /**
     * Get latest Pause Record Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getPauseRecordRequest = function() {
        return UIModel.getInstance().pauseRecordRequest;
    };
    /**
     * Get latest Record Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getRecordRequest = function() {
        return UIModel.getInstance().recordRequest;
    };
    /**
     * Get latest Chat Presented Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getChatPresentedRequest = function() {
        return UIModel.getInstance().chatPresentedRequest;
    };
    /**
     * Get latest Chat Disposition Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getChatDispositionRequest = function() {
        return UIModel.getInstance().chatDispositionRequest;
    };
    /**
     * Get latest Chat Message Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getChatMessageRequest = function() {
        return UIModel.getInstance().chatMessageRequest;
    };
    /**
     * Get latest Chat Requeue Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getChatRequeueRequest = function() {
        return UIModel.getInstance().chatRequeueRequest;
    };
    /**
     * Get latest Chat Typing Request object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getChatTypingRequest = function() {
        return UIModel.getInstance().chatTypingRequest;
    };
    /**
     * Get latest Agent Stats object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentStatsPacket = function() {
        return UIModel.getInstance().agentStatsPacket;
    };
    /**
     * Get latest Agent Daily Stats object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentDailyStatsPacket = function() {
        return UIModel.getInstance().agentDailyStatsPacket;
    };
    /**
     * Get latest Queue Stats object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getQueueStatsPacket = function() {
        return UIModel.getInstance().queueStatsPacket;
    };
    /**
     * Get latest Chat Queue Stats object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getChatQueueStatsPacket = function() {
        return UIModel.getInstance().chatQueueStatsPacket;
    };
    /**
     * Get latest Campaign Stats object
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getCampaignStatsPacket = function() {
        return UIModel.getInstance().campaignStatsPacket;
    };
    /**
     * Get packet received on successful Login
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getLoginPacket = function() {
        return UIModel.getInstance().loginPacket;
    };
    /**
     * Get packet received on successful Configuration (2nd layer login)
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getConfigPacket = function() {
        return UIModel.getInstance().configPacket;
    };
    /**
     * Get latest received packet for Agent State
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentStatePacket = function() {
        return UIModel.getInstance().agentStatePacket;
    };
    /**
     * Get latest received packet for the Current Call
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getCurrentCallPacket = function() {
        return UIModel.getInstance().currentCallPacket;
    };
    /**
     * Get latest received packet for initiating an offhook session
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getOffhookInitPacket = function() {
        return UIModel.getInstance().offhookInitPacket;
    };
    /**
     * Get latest received packet for terminating an offhook session
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */
    AgentLibrary.prototype.getOffhookTermPacket = function() {
        return UIModel.getInstance().offhookTermPacket;
    };

    /**
     * Get chat agent end request class
     * @memberof AgentLibrary.Core.Requests
     * @returns {object}
     */

    AgentLibrary.prototype.getChatAgentEnd = function(){
        return UIModel.getInstance().chatAgentEnd;
    };


    AgentLibrary.prototype.getChatListRequest = function(){
        return UIModel.getInstance().chatListRequest;
    };


    /**
     * @namespace Notifications
     * @memberof AgentLibrary.Core
     */
    ///////////////////
    // notifications //
    ///////////////////
    /**
     * Get Dial Group Change notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getDialGroupChangeNotification = function() {
        return UIModel.getInstance().dialGroupChangeNotification;
    };
    /**
     * Get Dial Group Change Pending notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getDialGroupChangePendingNotification = function() {
        return UIModel.getInstance().dialGroupChangePendingNotification;
    };
    /**
     * Get End Call notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getEndCallNotification = function() {
        return UIModel.getInstance().endCallNotification;
    };
    /**
     * Get Gates Change notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getGatesChangeNotification = function() {
        return UIModel.getInstance().gatesChangeNotification;
    };
    /**
     * Get Generic notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getGenericNotification = function() {
        return UIModel.getInstance().genericNotification;
    };
    /**
     * Get New Call notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getNewCallNotification = function() {
        return UIModel.getInstance().newCallNotification;
    };
    /**
     * Get current call object
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getCurrentCall = function() {
        return UIModel.getInstance().currentCall;
    };
    /**
     * Get Add Session notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getAddSessionNotification = function() {
        return UIModel.getInstance().addSessionNotification;
    };
    /**
     * Get Drop Session notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getDropSessionNotification = function() {
        return UIModel.getInstance().dropSessionNotification;
    };
    /**
     * Get Early UII notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getEarlyUiiNotification = function() {
        return UIModel.getInstance().earlyUiiNotification;
    };
    /**
     * Get Chat Active notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getChatActiveNotification = function() {
        return UIModel.getInstance().chatActiveNotification;
    };
    /**
     * Get Chat Inactive notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getChatInactiveNotification = function() {
        return UIModel.getInstance().chatInactiveNotification;
    };
    /**
     * Get Chat Presented notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getChatPresentedNotification = function() {
        return UIModel.getInstance().chatPresentedNotification;
    };
    /**
     * Get Chat Typing notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getChatTypingNotification = function() {
        return UIModel.getInstance().chatTypingNotification;
    };
    /**
     * Get New Chat notification class
     * @memberof AgentLibrary.Core.Notifications
     * @returns {object}
     */
    AgentLibrary.prototype.getNewChatNotification = function() {
        return UIModel.getInstance().newChatNotification;
    };

    /**
     * @namespace Settings
     * @memberof AgentLibrary.Core
     */
    //////////////////////
    // settings objects //
    //////////////////////
    /**
     * Get Application Settings object containing the current state of application related data
     * @memberof AgentLibrary.Core.Settings
     * @returns {object}
     */
    AgentLibrary.prototype.getApplicationSettings = function() {
        return UIModel.getInstance().applicationSettings;
    };
    /**
     * Get Chat Settings object containing the current state of chat related data
     * @memberof AgentLibrary.Core.Settings
     * @returns {object}
     */
    AgentLibrary.prototype.getChatSettings = function() {
        return UIModel.getInstance().chatSettings;
    };
    /**
     * Get Connection Settings object containing the current state of connection related data
     * @memberof AgentLibrary.Core.Settings
     * @returns {object}
     */
    AgentLibrary.prototype.getConnectionSettings = function() {
        return UIModel.getInstance().connectionSettings;
    };
    /**
     * Get Inbound Settings object containing the current state of inbound related data
     * @memberof AgentLibrary.Core.Settings
     * @returns {object}
     */
    AgentLibrary.prototype.getInboundSettings = function() {
        return UIModel.getInstance().inboundSettings;
    };
    /**
     * Get Outbound Settings object containing the current state of outbound related data
     * @memberof AgentLibrary.Core.Settings
     * @returns {object}
     */
    AgentLibrary.prototype.getOutboundSettings = function() {
        return UIModel.getInstance().outboundSettings;
    };
    /**
     * Get Agent Settings object containing the current state of agent related data
     * @memberof AgentLibrary.Core.Settings
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentSettings = function() {
        return UIModel.getInstance().agentSettings;
    };
    /**
     * Get Transfer Sessions
     * @memberof AgentLibrary.Core.Settings
     * @returns {object}
     */
    AgentLibrary.prototype.getTransferSessions = function() {
        return UIModel.getInstance().transferSessions;
    };
    /**
     * Get the Agent Permissions object containing the current state of agent permissions
     * @memberof AgentLibrary.Core.Settings
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentPermissions = function() {
        return UIModel.getInstance().agentPermissions;
    };

    /**
     * @namespace Stats
     * @memberof AgentLibrary.Core
     */
    ///////////////////
    // stats objects //
    ///////////////////

    /**
     * Get the Agent stats object containing the current state of agent stats
     * @memberof AgentLibrary.Core.Settings
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentStats = function() {
        return UIModel.getInstance().agentStats;
    };
    /**
     * Get the Agent Daily stats object containing the current state of agent daily stats
     * @memberof AgentLibrary.Core.Stats
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentDailyStats = function() {
        return UIModel.getInstance().agentDailyStats;
    };
    /**
     * Get the Queue stats object containing the current state of queue stats
     * @memberof AgentLibrary.Core.Stats
     * @returns {object}
     */
    AgentLibrary.prototype.getQueueStats = function() {
        return UIModel.getInstance().queueStats;
    };
    /**
     * Get the Chat Queue stats object containing the current state of chat queue stats
     * @memberof AgentLibrary.Core.Stats
     * @returns {object}
     */
    AgentLibrary.prototype.getChatQueueStats = function() {
        return UIModel.getInstance().chatQueueStats;
    };
    /**
     * Get the Campaign stats object containing the current state of campaign stats
     * @memberof AgentLibrary.Core.Stats
     * @returns {object}
     */
    AgentLibrary.prototype.getCampaignStats = function() {
        return UIModel.getInstance().campaignStats;
    };

}
