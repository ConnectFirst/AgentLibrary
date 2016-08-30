
// CONSTANTS
/**
 * @memberof AgentLibrary
 * Possible callback types:
 * <li>"openResponse"</li>
 * <li>"closeResponse"</li>
 * <li>"loginResponse"</li>
 * <li>"logoutResponse"</li>
 * <li>"configureResponse"</li>
 * <li>"agentStateResponse"</li>
 * @type {object}
 */

/*jshint esnext: true */
const CALLBACK_TYPES = {
    "ADD_SESSION":"addSessionResponse",
    "AGENT_STATE":"agentStateResponse",
    "BARGE_IN":"bargeResponse",
    "CLOSE_SOCKET":"closeResponse",
    "COACH_CALL":"coachResponse",
    "CONFIG":"configureResponse",
    "CALL_NOTES":"callNotesResponse",
    "CALLBACK_PENDING":"callbacksPendingResponse",
    "CALLBACK_CANCEL":"callbackCancelResponse",
    "CAMPAIGN_DISPOSITIONS":"campaignDispositionsResponse",
    "DIAL_GROUP_CHANGE":"dialGroupChangeNotification",
    "DIAL_GROUP_CHANGE_PENDING":"dialGroupChangePendingNotification",
    "DROP_SESSION":"dropSessionNotification",
    "EARLY_UII":"earlyUiiNotification",
    "END_CALL":"endCallNotification",
    "GATES_CHANGE":"gatesChangeNotification",
    "GENERIC_NOTIFICATION":"genericNotification",
    "GENERIC_RESPONSE":"genericResponse",
    "HOLD":"holdResponse",
    "LOGIN":"loginResponse",
    "SILENT_MONITOR":"silentMonitorResponse",
    "NEW_CALL":"newCallNotification",
    "OFFHOOK_INIT":"offhookInitResponse",
    "OFFHOOK_TERM":"offhookTermResponse",
    "OPEN_SOCKET":"openResponse",
    "PAUSE_RECORD":"pauseRecordResponse",
    "PREVIEW_DIAL":"previewDialResponse",
    "REQUEUE":"requeueResponse",
    "TCPA_SAFE":"tcpaSafeResponse",
    "XFER_COLD":"coldXferResponse",
    "XFER_WARM":"warmXferResponse"

};

const MESSAGE_TYPES = {
    "ADD_SESSION":"ADD-SESSION",
    "BARGE_IN":"BARGE-IN",
    "LOGIN":"LOGIN",
    "LOGOUT":"LOGOUT",
    "AGENT_STATE":"AGENT-STATE",
    "CALL_NOTES":"CALL-NOTES",
    "CALLBACK_PENDING":"PENDING-CALLBACKS",
    "CALLBACK_CANCEL":"CANCEL-CALLBACK",
    "CAMPAIGN_DISPOSITIONS":"CAMPAIGN-DISPOSITIONS",
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
    "PREVIEW_DIAL_ID":"PREVIEW_DIAL",
    "RECORD":"RECORD",
    "REQUEUE":"RE-QUEUE",
    "TCPA_SAFE":"TCPA-SAFE",
    "TCPA_SAFE_ID":"TCPA_SAFE",
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
     * @memberof AgentLibrary
     * @property {object} callbacks Internal map of registered callback functions
     * @property {object} _requests Internal map of requests by message id, private property.
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
        this._requests = {};

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

        // set instance on model object
        UIModel.getInstance().libraryInstance = this;

        return this;
    };

    /**
     * Set multiple callback functions based on type
     * @memberof AgentLibrary
     * @param {Object} callbackMap Contains map of callback types to their respective functions:<br />
     * <tt>callbackMap = {<br />
     *      closeResponse: onCloseFunction,<br />
     *      openResponse: onOpenFunction<br />
     * }</tt>
     */
    AgentLibrary.prototype.setCallbacks = function(callbackMap) {
        for(var property in callbackMap) {
            this.callbacks[property] = callbackMap[property];
        }
    };


    /**
     * Set an individual callback function for the given type
     * @memberof AgentLibrary
     * @param {string} type The name of the event that fires the callback function
     * @param {function} callback The function to call for the given type
     */
    AgentLibrary.prototype.setCallback = function(type, callback) {
        this.callbacks[type] = callback;
    };

    /**
     * Get the map of all registered callbacks
     * @memberof AgentLibrary
     * @returns {array}
     */
    AgentLibrary.prototype.getCallbacks = function(){
        return this.callbacks;
    };

    /**
     * Get a given registered callback by type
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCallback = function(type){
        return this.callbacks[type];
    };

    ////////////////////////////
    // requests and responses //
    ////////////////////////////
    /**
     * Get outgoing Login Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getLoginRequest = function() {
        return UIModel.getInstance().loginRequest;
    };
    /**
     * Get outgoing Config Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getConfigRequest = function() {
        return UIModel.getInstance().configRequest;
    };
    /**
     * Get outgoing Logout Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getLogoutRequest = function() {
        return UIModel.getInstance().logoutRequest;
    };
    /**
     * Get latest Agent Daily Stats object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentDailyStats = function() {
        return UIModel.getInstance().agentDailyStats;
    };
    /**
     * Get latest Call Tokens object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCallTokens = function() {
        return UIModel.getInstance().callTokens;
    };
    /**
     * Get latest outgoing Agent State Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentStateRequest = function() {
        return UIModel.getInstance().agentStateRequest;
    };
    /**
     * Get latest outgoing offhook init Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getOffhookInitRequest = function() {
        return UIModel.getInstance().offhookInitRequest;
    };
    /**
     * Get latest outgoing offhook termination Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getOffhookTermRequest = function() {
        return UIModel.getInstance().offhookTermRequest;
    };
    /**
     * Get latest outgoing Hangup Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getHangupRequest = function() {
        return UIModel.getInstance().hangupRequest;
    };
    /**
     * Get latest outgoing Preview Dial Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getPreviewDialRequest = function() {
        return UIModel.getInstance().previewDialRequest;
    };
    /**
     * Get latest TCPA Safe Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getTcpaSafeRequest = function() {
        return UIModel.getInstance().tcpaSafeRequest;
    };
    /**
     * Get latest Manual Outdial Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getManualOutdialRequest = function() {
        return UIModel.getInstance().oneToOneOutdialRequest;
    };
    /**
     * Get latest Manual Outdial Cancel Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getManualOutdialCancelRequest = function() {
        return UIModel.getInstance().oneToOneOutdialCancelRequest;
    };
    /**
     * Get latest Call Notes Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCallNotesRequest = function() {
        return UIModel.getInstance().callNotesRequest;
    };
    /**
     * Get latest Campaign Dispositions Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCampaignDispositionsRequest = function() {
        return UIModel.getInstance().campaignDispositionsRequest;
    };
    /**
     * Get latest Disposition Call Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getDispositionRequest = function() {
        return UIModel.getInstance().dispositionRequest;
    };
    /**
     * Get latest Disposition Manual Pass Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getDispositionManualPassRequest = function() {
        return UIModel.getInstance().dispositionManualPassRequest;
    };
    /**
     * Get latest Warm Transfer Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getWarmTransferRequest = function() {
        return UIModel.getInstance().warmXferRequest;
    };
    /**
     * Get latest Cold Transfer Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getColdTransferRequest = function() {
        return UIModel.getInstance().coldXferRequest;
    };
    /**
     * Get latest Warm Transfer Cancel Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getWarmTransferCancelRequest = function() {
        return UIModel.getInstance().warmXferCancelRequest;
    };
    /**
     * Get latest Requeue Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getRequeueRequest = function() {
        return UIModel.getInstance().requeueRequest;
    };
    /**
     * Get latest Barge-In Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getBargeInRequest = function() {
        return UIModel.getInstance().bargeInRequest;
    };
    /**
     * Get latest Hold Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getHoldRequest = function() {
        return UIModel.getInstance().holdRequest;
    };
    /**
     * Get latest Pause Record Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getPauseRecordRequest = function() {
        return UIModel.getInstance().pauseRecordRequest;
    };
    /**
     * Get latest Record Request object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getRecordRequest = function() {
        return UIModel.getInstance().recordRequest;
    };
    /**
     * Get packet received on successful Login
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getLoginPacket = function() {
        return UIModel.getInstance().loginPacket;
    };
    /**
     * Get packet received on successful Configuration (2nd layer login)
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getConfigPacket = function() {
        return UIModel.getInstance().configPacket;
    };
    /**
     * Get latest received packet for Agent State
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentStatePacket = function() {
        return UIModel.getInstance().agentStatePacket;
    };
    /**
     * Get latest received packet for the Current Call
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCurrentCallPacket = function() {
        return UIModel.getInstance().currentCallPacket;
    };
    /**
     * Get latest received packet for initiating an offhook session
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getOffhookInitPacket = function() {
        return UIModel.getInstance().offhookInitPacket;
    };
    /**
     * Get latest received packet for terminating an offhook session
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getOffhookTermPacket = function() {
        return UIModel.getInstance().offhookTermPacket;
    };

    ///////////////////
    // notifications //
    ///////////////////
    /**
     * Get Dial Group Change notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getDialGroupChangeNotification = function() {
        return UIModel.getInstance().dialGroupChangeNotification;
    };
    /**
     * Get Dial Group Change Pending notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getDialGroupChangePendingNotification = function() {
        return UIModel.getInstance().dialGroupChangePendingNotification;
    };
    /**
     * Get End Call notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getEndCallNotification = function() {
        return UIModel.getInstance().endCallNotification;
    };
    /**
     * Get Gates Change notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getGatesChangeNotification = function() {
        return UIModel.getInstance().gatesChangeNotification;
    };
    /**
     * Get Generic notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getGenericNotification = function() {
        return UIModel.getInstance().genericNotification;
    };
    /**
     * Get New Call notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getNewCallNotification = function() {
        return UIModel.getInstance().newCallNotification;
    };
    /**
     * Get current call object
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getCurrentCall = function() {
        return UIModel.getInstance().currentCall;
    };
    /**
     * Get Add Session notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAddSessionNotification = function() {
        return UIModel.getInstance().addSessionNotification;
    };
    /**
     * Get Drop Session notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getDropSessionNotification = function() {
        return UIModel.getInstance().dropSessionNotification;
    };
    /**
     * Get Early UII notification class
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getEarlyUiiNotification = function() {
        return UIModel.getInstance().earlyUiiNotification;
    };


    //////////////////////
    // settings objects //
    //////////////////////
    /**
     * Get Application Settings object containing the current state of application related data
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getApplicationSettings = function() {
        return UIModel.getInstance().applicationSettings;
    };
    /**
     * Get Chat Settings object containing the current state of chat related data
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getChatSettings = function() {
        return UIModel.getInstance().chatSettings;
    };
    /**
     * Get Connection Settings object containing the current state of connection related data
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getConnectionSettings = function() {
        return UIModel.getInstance().connectionSettings;
    };
    /**
     * Get Inbound Settings object containing the current state of inbound related data
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getInboundSettings = function() {
        return UIModel.getInstance().inboundSettings;
    };
    /**
     * Get Outbound Settings object containing the current state of outbound related data
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getOutboundSettings = function() {
        return UIModel.getInstance().outboundSettings;
    };
    /**
     * Get Agent Settings object containing the current state of agent related data
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentSettings = function() {
        return UIModel.getInstance().agentSettings;
    };
    /**
     * Get the Agent Permissions object containing the current state of agent permissions
     * @memberof AgentLibrary
     * @returns {object}
     */
    AgentLibrary.prototype.getAgentPermissions = function() {
        return UIModel.getInstance().agentPermissions;
    };

}
