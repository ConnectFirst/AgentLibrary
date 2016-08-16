function initAgentLibraryCall (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Sends a manual outdial request message
     * @memberof AgentLibrary
     * @param {string} destination Number to call - ANI
     * @param {number} [ringTime=60] Time in seconds to ring call
     * @param {number} callerId Number displayed to callee, DNIS
     * @param {string} [countryId='USA'] Country for the destination number
     * @param {number} [queueId=''] Queue id to tie manual call to
     */
    AgentLibrary.prototype.manualOutdial = function(destination, ringTime, callerId, countryId, queueId){
        UIModel.getInstance().oneToOneOutdialRequest = new OneToOneOutdialRequest(destination, ringTime, callerId, countryId, queueId);
        var msg = UIModel.getInstance().oneToOneOutdialRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a manual outdial request message
     * @memberof AgentLibrary
     * @param {string} destination Number to call - ANI
     * @param {number} [ringTime=60] Time in seconds to ring call
     * @param {number} callerId Number displayed to callee, DNIS
     * @param {string} [countryId='USA'] Country for the destination number
     * @param {number} [queueId=''] Queue id to tie manual call to
     */
    AgentLibrary.prototype.manualOutdialCancel = function(uii){
        UIModel.getInstance().oneToOneOutdialCancelRequest = new OneToOneOutdialCancelRequest(uii);
        var msg = UIModel.getInstance().oneToOneOutdialCancelRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a hangup request message
     * @memberof AgentLibrary
     * @param {string} [sessionId=""] Session to hangup, defaults to current call session id
     */
    AgentLibrary.prototype.hangup = function(sessionId){
        UIModel.getInstance().hangupRequest = new HangupRequest(sessionId);
        var msg = UIModel.getInstance().hangupRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a preview dial request message
     * @memberof AgentLibrary
     * @param {string} [action=""] Action to take
     * @param {array} [searchFields=[]] Array of objects with key/value pairs for search parameters
     * e.g. [ {key: "name", value: "Geoff"} ]
     * @param {number} [requestId=""] Number displayed to callee, DNIS
     */
    AgentLibrary.prototype.previewDial = function(action, searchFields, requestId){
        UIModel.getInstance().previewDialRequest = new PreviewDialRequest(action, searchFields, requestId);
        var msg = UIModel.getInstance().previewDialRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a TCPA Safe call request message
     * @memberof AgentLibrary
     * @param {string} [action=""] Action to take
     * @param {array} [searchFields=[]] Array of objects with key/value pairs for search parameters
     * e.g. [ {key: "name", value: "Geoff"} ]
     * @param {number} [requestId=""] Number displayed to callee, DNIS
     */
    AgentLibrary.prototype.tcpaSafeCall = function(action, searchFields, requestId){
        UIModel.getInstance().tcpaSafeRequest = new TcpaSafeRequest(action, searchFields, requestId);
        var msg = UIModel.getInstance().tcpaSafeRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

}
