function initAgentLibraryCall (context) {
    /**
     * @namespace Call
     * @memberof AgentLibrary
     */

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    /**
     * Barge in on a call, can hear all parties and be heard by all
     * @memberof AgentLibrary.Call
     * @param {number} agentId Agent Id of the current logged in agent
     * @param {string} uii UII of the active call you wish to monitor
     * @param {number} monitorAgentId UII Agent Id of the agent you wish to monitor
     * @param {function} [callback=null] Callback function when barge in response received
     */
    AgentLibrary.prototype.bargeIn = function(agentId, uii, monitorAgentId, callback){
        UIModel.getInstance().bargeInRequest = new BargeInRequest("FULL", agentId, uii, monitorAgentId);
        var msg = UIModel.getInstance().bargeInRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.BARGE_IN, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Add a coaching session to the call, can hear all parties but only able to speak on agent channel
     * @memberof AgentLibrary.Call
     * @param {number} agentId Agent Id of the current logged in agent
     * @param {string} uii UII of the active call you wish to monitor
     * @param {number} monitorAgentId UII Agent Id of the agent you wish to monitor
     * @param {function} [callback=null] Callback function when coaching session response received
     */
    AgentLibrary.prototype.coach = function(agentId, uii, monitorAgentId, callback){
        UIModel.getInstance().bargeInRequest = new BargeInRequest("COACHING", agentId, uii, monitorAgentId);
        var msg = UIModel.getInstance().bargeInRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.COACH_CALL, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Transfer to another number and end the call for the original agent (cold transfer).
     * @memberof AgentLibrary.Call
     * @param {number} dialDest Number to transfer to
     * @param {number} [callerId=""] Caller Id for caller (DNIS)
     * @param {number} [sipHeaders=[]] Name/Value header pairs
     * @param {function} [callback=null] Callback function when cold transfer response received
     */
    AgentLibrary.prototype.coldXfer = function(dialDest, callerId, sipHeaders, callback){
        UIModel.getInstance().coldXferRequest = new XferColdRequest(dialDest, callerId, sipHeaders);
        var msg = UIModel.getInstance().coldXferRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.XFER_COLD, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Transfer to another number and end the call for the original agent (cold transfer).
     * @memberof AgentLibrary.Call
     * @param {number} dialDest Number to transfer to
     * @param {number} [callerId=""] Caller Id for caller (DNIS)
     * @param {number} [sipHeaders=[]] Name/Value header pairs
     * @param {number} [countryId=""] Country Id for the dialDest
     * @param {function} [callback=null] Callback function when warm transfer response received
     */
    AgentLibrary.prototype.internationalColdXfer = function(dialDest, callerId, sipHeaders, countryId, callback){

        UIModel.getInstance().coldXferRequest = new XferColdRequest(dialDest, callerId, sipHeaders, countryId);
        var msg = UIModel.getInstance().coldXferRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.XFER_COLD, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Send a disposition for an inbound or outbound call
     * @memberof AgentLibrary.Call
     * @param {string} uii UII (unique id) for call
     * @param {string} dispId The disposition id
     * @param {string} notes Agent notes for call
     * @param {boolean} callback Boolean for whether or not this call is a callback
     * @param {string} [callbackDTS=""] date time stamp if callback
     * @param {string} [contactForwardNumber=null] Number for contact forwarding
     * @param {string} [survey=null] The survey response values for the call.
     * Format: survey = [ { label: "", externId: "", leadUpdateColumn: ""} ]
     * @param {string} [externId=null] The external id associated with the lead for this call (only for Outbound Dispositions).
     * @param {string} [leadId=null] The lead id associated with this call (only for Outbound Dispositions).
     * @param {string} [requestId=null] The request id associated with a preview fetched lead (only for Outbound Dispositions).
     */
    AgentLibrary.prototype.dispositionCall = function(uii, dispId, notes, callback, callbackDTS, contactForwardNumber, survey, externId, leadId, requestId){
        UIModel.getInstance().dispositionRequest = new DispositionRequest(uii, dispId, notes, callback, callbackDTS, contactForwardNumber, survey, externId, leadId, requestId);
        var msg = UIModel.getInstance().dispositionRequest.formatJSON();
        utils.sendMessage(this, msg);

        // cancel ping call timer
        clearInterval(UIModel.getInstance().pingIntervalId);
        UIModel.getInstance().pingIntervalId = null;
    };

    /**
     * Send a disposition for a manual pass on a lead
     * @memberof AgentLibrary.Call
     * @param {string} dispId The disposition id
     * @param {string} notes Agent notes for call
     * @param {boolean} callback Boolean for whether or not this call is a callback
     * @param {string} [callbackDTS=""] date time stamp if callback
     * @param {string} [leadId=null] The lead id
     * @param {string} [requestId=null] The request key for the lead
     * @param {string} [externId=null] The external id of the lead
     */
    AgentLibrary.prototype.dispositionManualPass = function(dispId, notes, callback, callbackDTS, leadId, requestId, externId){
        UIModel.getInstance().dispositionManualPassRequest = new DispositionManualPassRequest(dispId, notes, callback, callbackDTS, leadId, requestId, externId);
        var msg = UIModel.getInstance().dispositionManualPassRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Get a list of all campaign dispositions for given campaign id
     * @memberof AgentLibrary.Call
     * @param {string} campaignId Id for campaign to get dispositions for
     * @param {function} [callback=null] Callback function when campaign dispositions response received
     */
    AgentLibrary.prototype.getCampaignDispositions = function(campaignId, callback){
        UIModel.getInstance().campaignDispositionsRequest = new CampaignDispositionsRequest(campaignId);
        var msg = UIModel.getInstance().campaignDispositionsRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CAMPAIGN_DISPOSITIONS, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a hangup request message
     * @memberof AgentLibrary.Call
     * @param {string} [sessionId=""] Session to hangup, defaults to current call session id
     */
    AgentLibrary.prototype.hangup = function(sessionId){
        UIModel.getInstance().hangupRequest = new HangupRequest(sessionId);
        var msg = UIModel.getInstance().hangupRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Place a call on hold
     * @memberof AgentLibrary.Call
     * @param {boolean} holdState Whether we are putting call on hold or taking off hold - values true | false
     * @param {function} [callback=null] Callback function when hold response received
     */
    AgentLibrary.prototype.hold = function(holdState, callback){
        UIModel.getInstance().holdRequest = new HoldRequest(holdState);
        var msg = UIModel.getInstance().holdRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.HOLD, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Place a specified session of a call on hold
     * @memberof AgentLibrary.Call
     * @param {boolean} holdState Whether we are putting call on hold or taking off hold - values true | false
     * @param {integer|string} sessionId session id of the call to place on hold
     * @param {function} [callback=null] Callback function when hold response received
     */
    AgentLibrary.prototype.holdSession = function(holdState, sessionId, callback){
        UIModel.getInstance().holdRequest = new HoldRequest(holdState, sessionId);
        var msg = UIModel.getInstance().holdRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.HOLD, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a manual outdial request message
     * @memberof AgentLibrary.Call
     * @param {string} destination Number to call - ANI
     * @param {number} callerId Number displayed to callee, DNIS
     * @param {number} [ringTime=60] Time in seconds to ring call
     * @param {string} [countryId='USA'] Country for the destination number
     * @param {number} [queueId=''] Queue id to tie manual call to
     */
    AgentLibrary.prototype.manualOutdial = function(destination, callerId, ringTime, countryId, queueId){
        UIModel.getInstance().oneToOneOutdialRequest = new OneToOneOutdialRequest(destination, callerId, ringTime, countryId, queueId);
        var msg = UIModel.getInstance().oneToOneOutdialRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Cancels a manual outdial request by UII.
     * @memberof AgentLibrary.Call
     * @param {string} uii UII of manual call request, the UII is returned in the EARLY_UII notification.
     */
    AgentLibrary.prototype.manualOutdialCancel = function(uii){
        UIModel.getInstance().oneToOneOutdialCancelRequest = new OneToOneOutdialCancelRequest(uii);
        var msg = UIModel.getInstance().oneToOneOutdialCancelRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Pause call recording
     * @memberof AgentLibrary.Call
     * @param {boolean} record Whether we are recording or not
     * @param {function} [callback=null] Callback function when pause record response received
     */
    AgentLibrary.prototype.pauseRecord = function(record, callback){
        UIModel.getInstance().pauseRecordRequest = new PauseRecordRequest(record);
        var msg = UIModel.getInstance().pauseRecordRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.PAUSE_RECORD, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a preview dial request to call lead based on request id and (optional) lead phone.
     * Call previewFetch method first to get request id.
     * @memberof AgentLibrary.Call
     * @param {number} requestId Pending request id sent back with lead, required to dial lead.
     * @param {number} [leadPhone=""] Lead phone number. Only needed if there are multiple numbers loaded for given lead.
     */
    AgentLibrary.prototype.previewDial = function(requestId, leadPhone){
        UIModel.getInstance().previewDialRequest = new PreviewDialRequest("", [], requestId, leadPhone);
        var msg = UIModel.getInstance().previewDialRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a message to fetch preview dialable leads
     * @memberof AgentLibrary.Call
     * @param {array} [searchFields=[]] Array of objects with key/value pairs for search parameters
     * e.g. [ {key: "name", value: "Geoff"} ]
     * @param {function} [callback=null] Callback function when preview fetch completed, returns matched leads
     */
    AgentLibrary.prototype.previewFetch = function(searchFields, callback){
        UIModel.getInstance().previewDialRequest = new PreviewDialRequest("", searchFields, "");
        var msg = UIModel.getInstance().previewDialRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.PREVIEW_FETCH, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Pull back leads that match search criteria
     * @memberof AgentLibrary.Call
     * @param {array} [searchFields=[]] Array of objects with key/value pairs for search parameters
     * e.g. [ {key: "name", value: "Geoff"} ]
     * @param {function} [callback=null] Callback function when lead search completed, returns matched leads
     */
    AgentLibrary.prototype.searchLeads = function(searchFields, callback){
        UIModel.getInstance().previewDialRequest = new PreviewDialRequest("search", searchFields, "");
        var msg = UIModel.getInstance().previewDialRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.LEAD_SEARCH, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Set agent notes for a call
     * @memberof AgentLibrary.Call
     * @param {string} notes Agent notes to add to call
     * @param {function} [callback=null] Callback function when call notes response received
     */
    AgentLibrary.prototype.setCallNotes = function(notes, callback){
        UIModel.getInstance().callNotesRequest = new CallNotesRequest(notes);
        var msg = UIModel.getInstance().callNotesRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.CALL_NOTES, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Add a silent monitor session to a call, can hear all channels but can't be heard by any party
     * @memberof AgentLibrary.Call
     * @param {number} agentId Agent Id of the current logged in agent
     * @param {string} uii UII of the active call you wish to monitor
     * @param {number} monitorAgentId UII Agent Id of the agent you wish to monitor
     * @param {function} [callback=null] Callback function when silent monitor response received
     */
    AgentLibrary.prototype.monitor = function(agentId, uii, monitorAgentId, callback){
        UIModel.getInstance().bargeInRequest = new BargeInRequest("MUTE", agentId, uii, monitorAgentId);
        var msg = UIModel.getInstance().bargeInRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.SILENT_MONITOR, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Toggle call recording based on passed in boolean true | false
     * @memberof AgentLibrary.Call
     * @param {boolean} record Whether we are recording or not
     * @param {function} [callback=null] Callback function when record response received
     */
    AgentLibrary.prototype.record = function(record, callback){
        UIModel.getInstance().recordRequest = new RecordRequest(record);
        var msg = UIModel.getInstance().recordRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.RECORD, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Requeue a call
     * @memberof AgentLibrary.Call
     * @param {number} queueId Queue Id to send the call to
     * @param {number} skillId Skill Id for the requeued call
     * @param {boolean} maintain Whether or not to maintain the current agent
     * @param {function} [callback=null] Callback function when requeue response received
     */
    AgentLibrary.prototype.requeueCall = function(queueId, skillId, maintain, callback){
        UIModel.getInstance().requeueRequest = new RequeueRequest(queueId, skillId, maintain);
        var msg = UIModel.getInstance().requeueRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.REQUEUE, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a TCPA Safe call request to call lead based on request id and (optional) lead phone.
     * Call safeModeFetch method first to get request id.
     * @memberof AgentLibrary.Call
     * @param {number} requestId Pending request id sent back with lead, required to dial lead.
     * @param {number} [leadPhone=""] Lead phone number. Only needed if there are multiple numbers loaded for given lead.
     */
    AgentLibrary.prototype.safeModeCall = function(requestId, leadPhone){
        UIModel.getInstance().tcpaSafeRequest = new TcpaSafeRequest("", [], requestId, leadPhone);
        var msg = UIModel.getInstance().tcpaSafeRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Sends a message to fetch safe mode dialable leads
     * @memberof AgentLibrary.Call
     * @param {array} [searchFields=[]] Array of objects with key/value pairs for search parameters
     * e.g. [ {key: "name", value: "Geoff"} ]
     * @param {function} [callback=null] Callback function when safe mode fetch completed, returns matched leads
     */
    AgentLibrary.prototype.safeModeFetch = function(searchFields, callback){
        UIModel.getInstance().tcpaSafeRequest = new TcpaSafeRequest("", searchFields, "");
        var msg = UIModel.getInstance().tcpaSafeRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.SAFE_MODE_FETCH, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Pull back Safe Mode leads that match search criteria
     * @memberof AgentLibrary.Call
     * @param {array} [searchFields=[]] Array of objects with key/value pairs for search parameters
     * e.g. [ {key: "name", value: "Geoff"} ]
     * @param {function} [callback=null] Callback function when safe mode fetch completed, returns matched leads
     */
    AgentLibrary.prototype.safeSearchLeads = function(searchFields, callback){
        UIModel.getInstance().tcpaSafeRequest = new TcpaSafeRequest("search", searchFields, "");
        var msg = UIModel.getInstance().tcpaSafeRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.SAFE_MODE_SEARCH, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Transfer to another number while keeping the original agent on the line (warm transfer).
     * @memberof AgentLibrary.Call
     * @param {number} dialDest Number to transfer to
     * @param {number} [callerId=""] Caller Id for caller (DNIS)
     * @param {number} [countryId=""] Country Id for the dialDest
     * @param {function} [callback=null] Callback function when warm transfer response received
     */
    AgentLibrary.prototype.internationalWarmXfer = function(dialDest, callerId, sipHeaders, countryId, callback){

        UIModel.getInstance().warmXferRequest = new XferWarmRequest(dialDest, callerId, sipHeaders, countryId);
        var msg = UIModel.getInstance().warmXferRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.XFER_WARM, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Transfer to another number while keeping the original agent on the line (warm transfer).
     * @memberof AgentLibrary.Call
     * @param {number} dialDest Number to transfer to
     * @param {number} [callerId=""] Caller Id for caller (DNIS)
     * @param {function} [callback=null] Callback function when warm transfer response received
     */
    AgentLibrary.prototype.warmXfer = function(dialDest, callerId, sipHeaders, callback){

        UIModel.getInstance().warmXferRequest = new XferWarmRequest(dialDest, callerId, sipHeaders);
        var msg = UIModel.getInstance().warmXferRequest.formatJSON();

        utils.setCallback(this, CALLBACK_TYPES.XFER_WARM, callback);
        utils.sendMessage(this, msg);
    };

    /**
     * Cancel a warm transfer
     * @memberof AgentLibrary.Call
     * @param {number} dialDest Number that was transfered to
     */
    AgentLibrary.prototype.warmXferCancel = function(dialDest){
        UIModel.getInstance().warmXferCancelRequest = new XferWarmCancelRequest(dialDest);
        var msg = UIModel.getInstance().warmXferCancelRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

    /**
     * Requests a script object based on given id
     * @memberof AgentLibrary.Call
     * @param {number} scriptId Id of script
     * @param {number} version The version number of the script, if the current loaded script version matches,
     *                 just return current script. Otherwise, fetch new version of script.
     * @param {function} [callback=null] Callback function when warm transfer response received
     */
    AgentLibrary.prototype.getScript = function(scriptId, version, callback){
        var model = UIModel.getInstance();
        var script = model.scriptSettings.loadedScripts[scriptId];
        utils.setCallback(this, CALLBACK_TYPES.SCRIPT_CONFIG, callback);

        if(script && script.version === version){
            // return from memory
            var savedScript = UIModel.getInstance().scriptSettings.loadedScripts[scriptId];
            callback(savedScript);
        }else{
            // load script
            model.scriptConfigRequest = new ScriptConfigRequest(scriptId);
            var msg = UIModel.getInstance().scriptConfigRequest.formatJSON();
            utils.sendMessage(this, msg);
        }
    };

    /**
     * Saves the results from a script
     * @memberof AgentLibrary.Call
     * @param {string} uii The UII of the call the script results belong to
     * @param {number} scriptId Id of script
     * @param {object} jsonResult JSON object of script results, name/value pairs
     */
    AgentLibrary.prototype.saveScriptResult = function(uii, scriptId, jsonResult){
        UIModel.getInstance().scriptResultRequest = new ScriptResultRequest(uii, scriptId, jsonResult);
        var msg = UIModel.getInstance().scriptResultRequest.formatJSON();
        utils.sendMessage(this, msg);
    };

}
