var utils = {
    logMessage: function(logLevel, message, data){
        var instance = UIModel.getInstance().libraryInstance;
        if(instance._db){
            var transaction = instance._db.transaction(["logger"], "readwrite");
            var store = transaction.objectStore("logger");

            var record = {
                logLevel: logLevel,
                message: message,
                dts: new Date(),
                data: data
            };

            var request = store.add(record);

        }else{
            //console.log("AgentLibrary: indexedDb not available");
        }
    },

    sendMessage: function(instance, msg) {
        var msgObj = JSON.parse(msg);

        if (instance.socket && instance.socket.readyState === 1) {
            // add message id to request map, then send message
            var type = msgObj.ui_request['@type'];
            var destination = msgObj.ui_request['@destination'];
            var message = "Sending " + type + " request message to " + destination;
            instance._requests.push({ id: msgObj.ui_request['@message_id'], type: msgObj.ui_request['@type'], msg: msgObj.ui_request });

            // keep rolling window of latest 1000 requests
            if(instance._requests.length > 1000){
                instance._requests.shift();
            }

            instance.socket.send(msg);

            if(type === 'STATS'){
                utils.logMessage(LOG_LEVELS.STATS, message, msgObj);
            }else{
                utils.logMessage(LOG_LEVELS.INFO, message, msgObj);
            }

        } else {
            // add message to queue
            instance._queuedMsgs.push({dts: new Date(), msg: msg});

            if(UIModel.getInstance().agentSettings.isLoggedIn){
                // try to reconnect
                instance._isReconnect = true;
                instance.openSocket();
                console.warn("AgentLibrary: WebSocket is not connected, attempting to reconnect.");
            }
        }
    },

    processResponse: function(instance, response)
    {
        var type = response.ui_response['@type'];
        var messageId = response.ui_response['@message_id'];
        var dest = (messageId === "" || !messageId) ? "IS" : messageId.slice(0, 2);
        var message = "Received " + type.toUpperCase() + " response message from " + dest;

        // log message response
        utils.logMessage(LOG_LEVELS.INFO, message, response);

        // Send generic on message response
        utils.fireCallback(instance, CALLBACK_TYPES.ON_MESSAGE, response);

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.AGENT_STATE:
                if (UIModel.getInstance().agentStateRequest === null) {
                    UIModel.getInstance().agentStateRequest = new AgentStateRequest(response.ui_response.current_state["#text"], response.ui_response.agent_aux_state['#text']);
                }
                var stateChangeResponse = UIModel.getInstance().agentStateRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.AGENT_STATE, stateChangeResponse);
                break;
            case MESSAGE_TYPES.BARGE_IN:
                var resp = UIModel.getInstance().bargeInRequest.processResponse(response);
                var responseTo = response.ui_response['@response_to'];
                var request = utils.findRequestById(instance, responseTo);
                if (request) {
                    // found corresponding request, fire registered callback for type
                    var audioState = request.msg.audio_state['#text'];
                    if (audioState === "MUTE") {
                        utils.fireCallback(instance, CALLBACK_TYPES.SILENT_MONITOR, resp);
                    } else if (audioState === "COACHING") {
                        utils.fireCallback(instance, CALLBACK_TYPES.COACH_CALL, resp);
                    } else {
                        utils.fireCallback(instance, CALLBACK_TYPES.BARGE_IN, resp);
                    }
                } else {
                    // no corresponding request, just fire FULL audio type BARGE-IN callback
                    utils.fireCallback(instance, CALLBACK_TYPES.BARGE_IN, resp);
                }
                break;
            case MESSAGE_TYPES.CAMPAIGN_DISPOSITIONS:
                var campaignDispsResposne = UIModel.getInstance().campaignDispositionsRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.CAMPAIGN_DISPOSITIONS, campaignDispsResposne);
                break;
            case MESSAGE_TYPES.CALL_NOTES:
                var callNotes = UIModel.getInstance().callNotesRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.CALL_NOTES, callNotes);
                break;
            case MESSAGE_TYPES.CALLBACK_PENDING:
                var pendingCallbacks = UIModel.getInstance().callbacksPendingRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.CALLBACK_PENDING, pendingCallbacks);
                break;
            case MESSAGE_TYPES.HOLD:
                var holdRequest;
                if(UIModel.getInstance().holdRequest === null){
                    holdRequest = new HoldRequest();
                }else{
                    holdRequest = UIModel.getInstance().holdRequest;
                }
                var hold = holdRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.HOLD, hold);
                break;
            case MESSAGE_TYPES.LEAD_HISTORY:
                var history = UIModel.getInstance().leadHistoryRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.LEAD_HISTORY, history);
                break;
            case MESSAGE_TYPES.LEAD_INSERT:
                var insert = UIModel.getInstance().leadInsertRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.LEAD_INSERT, insert);
                break;
            case MESSAGE_TYPES.LEAD_UPDATE:
                var update = UIModel.getInstance().leadUpdateRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.LEAD_UPDATE, update);
                break;
            case MESSAGE_TYPES.LOGIN:
                if (dest === "IS") {
                    var loginResponse = UIModel.getInstance().loginRequest.processResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.LOGIN, loginResponse);
                } else if (dest === 'IQ') {
                    var configResponse = UIModel.getInstance().configRequest.processResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.CONFIG, configResponse);

                    if (configResponse.status === "SUCCESS") {
                        // start stats interval timer, request stats every 5 seconds
                        UIModel.getInstance().statsIntervalId = setInterval(utils.sendStatsRequestMessage, 5000);
                    }
                }
                break;
            case MESSAGE_TYPES.LOGOUT:
                // TODO add processResponse?
                utils.fireCallback(instance, CALLBACK_TYPES.LOGOUT, response);
                break;
            case MESSAGE_TYPES.OFFHOOK_INIT:
                var offhook = new OffhookInitRequest();
                var initResponse = offhook.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.OFFHOOK_INIT, initResponse);
                break;
            case MESSAGE_TYPES.PAUSE_RECORD:
                var pauseRequest;
                if(UIModel.getInstance().pauseRecordRequest === null){
                    pauseRequest = new PauseRecordRequest();
                }else{
                    pauseRequest = UIModel.getInstance().pauseRecordRequest;
                }
                var pauseRec = pauseRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.PAUSE_RECORD, pauseRec);
                break;
            case MESSAGE_TYPES.RECORD:
                var record = UIModel.getInstance().recordRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.RECORD, record);
                break;
            case MESSAGE_TYPES.REQUEUE:
                var requeue = UIModel.getInstance().requeueRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.REQUEUE, requeue);
                break;
            case MESSAGE_TYPES.SUPERVISOR_LIST:
                var supervisorList = UIModel.getInstance().supervisorListRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.SUPERVISOR_LIST, supervisorList);
                break;
            case MESSAGE_TYPES.SCRIPT_CONFIG:
                var script = UIModel.getInstance().scriptConfigRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.SCRIPT_CONFIG, script);
                break;
            case MESSAGE_TYPES.XFER_COLD:
                var coldXfer = UIModel.getInstance().coldXferRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.XFER_COLD, coldXfer);
                break;
            case MESSAGE_TYPES.XFER_WARM:
                var warmXfer = UIModel.getInstance().warmXferRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.XFER_WARM, warmXfer);
                break;
            case MESSAGE_TYPES.XFER_WARM_CANCEL:
                var warmXferCancel = UIModel.getInstance().warmXferCancelRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.XFER_WARM_CANCEL, warmXferCancel);
                break;
            case MESSAGE_TYPES.ACK:
                var ack = UIModel.getInstance().ackRequest.processResponse(response);
                var responseTo = response.ui_response['@response_to'];
                var request = utils.findRequestById(instance, responseTo);
                ack.uii = request.msg.uii && request.msg.uii["#text"];
                utils.fireCallback(instance, CALLBACK_TYPES.ACK, ack);
                break;
            case MESSAGE_TYPES.CHAT_LIST:
                var chatList = new ChatListRequest();
                var chatListResponse = chatList.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.CHAT_LIST, chatListResponse);
                break;
            case MESSAGE_TYPES.CHAT_STATE:
                var chatState = new ChatStateRequest();
                var chatStateResponse = chatState.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.CHAT_STATE, chatStateResponse);
                break;
        }
    },

    processNotification: function(instance, data){
        var type = data.ui_notification['@type'];
        var messageId = data.ui_notification['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        var message = "Received " + type.toUpperCase() + " notification message from " + dest;

        // log message response
        utils.logMessage(LOG_LEVELS.INFO, message, data);

        switch (type.toUpperCase()){
            case MESSAGE_TYPES.ADD_SESSION:
                var newCallUtils = new NewCallUtils(instance, data);
                newCallUtils.setupAddSessionCallback();
                break;
            case MESSAGE_TYPES.DIAL_GROUP_CHANGE:
                var dgChangeNotif = new DialGroupChangeNotification();
                var changeResponse = dgChangeNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.DIAL_GROUP_CHANGE, changeResponse);
                break;
            case MESSAGE_TYPES.DIAL_GROUP_CHANGE_PENDING:
                var dgChangePendNotif = new DialGroupChangePendingNotification();
                var pendResponse = dgChangePendNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.DIAL_GROUP_CHANGE_PENDING, pendResponse);
                break;
            case MESSAGE_TYPES.DROP_SESSION:
                var dropSesNotif = new DropSessionNotification(instance);
                var dropSesResponse = dropSesNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.DROP_SESSION, dropSesResponse);
                break;
            case MESSAGE_TYPES.EARLY_UII:
                var earlyUiiNotif = new EarlyUiiNotification(instance);
                var earlyUiiResponse = earlyUiiNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.EARLY_UII, earlyUiiResponse);
                break;
            case MESSAGE_TYPES.END_CALL:
                var endCallNotif = new EndCallNotification(instance);
                var endCallResponse = endCallNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.END_CALL, endCallResponse);
                break;
            case MESSAGE_TYPES.GATES_CHANGE:
                var gateChangeNotif = new GatesChangeNotification();
                var gateChangeResponse = gateChangeNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.GATES_CHANGE, gateChangeResponse);
                break;
            case MESSAGE_TYPES.GENERIC:
                var genericNotif = new GenericNotification();
                var generic = genericNotif.processResponse(data);
                var responseTo = data.ui_notification['@response_to'];
                var request = utils.findRequestById(instance, responseTo);
                if(request){
                    // found corresponding request, fire registered callback for type
                    var type = request.type;
                    var callbackFnName = utils.findCallbackBasedOnMessageType(type);

                    if(callbackFnName){
                        if(type === MESSAGE_TYPES.CALLBACK_CANCEL){
                            generic.leadId = request.msg.lead_id["#text"];
                        }
                        utils.fireCallback(instance, callbackFnName, generic);
                    }else{
                        // no registered callback, fallback to generic notification
                        utils.fireCallback(instance, CALLBACK_TYPES.GENERIC_NOTIFICATION, generic);
                    }
                }else{
                    // no corresponding request, just fire generic notification callback
                    utils.fireCallback(instance, CALLBACK_TYPES.GENERIC_NOTIFICATION, generic);
                }
                break;
            case MESSAGE_TYPES.NEW_CALL:
                setTimeout(function() {
                    var newCallNotif = new NewCallNotification();
                    var newCallResponse = newCallNotif.processResponse(data);
                    utils.fireCallback(instance, CALLBACK_TYPES.NEW_CALL, newCallResponse);
                    var newCallUtils = new NewCallUtils(instance, data);
                    newCallUtils.processSessionsForCall();
                }, 2000);
                break;
            case MESSAGE_TYPES.OFFHOOK_TERM:
                if(UIModel.getInstance().offhookTermRequest === null){
                    // offhook term initiated by IQ
                    UIModel.getInstance().offhookTermRequest = new OffhookTermRequest();
                }
                var termResponse = UIModel.getInstance().offhookTermRequest.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.OFFHOOK_TERM, termResponse);
                break;
            case MESSAGE_TYPES.PREVIEW_LEAD_STATE:
                var leadStateNotif = new PreviewLeadStateNotification();
                var leadStateResponse = leadStateNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.PREVIEW_LEAD_STATE, leadStateResponse);
                break;
            case MESSAGE_TYPES.PENDING_DISP:
                var pendingDispNotif = new PendingDispNotification();
                var pendingDispResponse = pendingDispNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.PENDING_DISP, pendingDispResponse);
                break;
            case MESSAGE_TYPES.REVERSE_MATCH:
                var reverseMatchNotif = new ReverseMatchNotification();
                var reverseMatchResponse = reverseMatchNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.REVERSE_MATCH, reverseMatchResponse);
                break;
            case MESSAGE_TYPES.TCPA_SAFE_LEAD_STATE:
                var leadStateTcpaNotif = new TcpaSafeLeadStateNotification();
                var leadStateTcpaResponse = leadStateTcpaNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.TCPA_SAFE_LEAD_STATE, leadStateTcpaResponse);
                break;
            case MESSAGE_TYPES.CHAT_ACTIVE:
                var activeNotif = new ChatActiveNotification();
                var activeResponse = activeNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.CHAT_ACTIVE, activeResponse);
                break;
            case MESSAGE_TYPES.CHAT_INACTIVE:
                var inactiveNotif = new ChatInactiveNotification();
                var inactiveResponse = inactiveNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.CHAT_INACTIVE, inactiveResponse);
                break;
            case MESSAGE_TYPES.CHAT_CLIENT_RECONNECT :
                var reconnectNotif = new ChatClientReconnectNotification();
                var reconnectResponse = reconnectNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.CHAT_CLIENT_RECONNECT, reconnectResponse);
                break;
            case MESSAGE_TYPES.CHAT_PRESENTED:
                var presentedNotif = new ChatPresentedNotification();
                var presentedResponse = presentedNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.CHAT_PRESENTED, presentedResponse);
                break;
            case MESSAGE_TYPES.CHAT_TYPING:
                var typingNotif = new ChatTypingNotification();
                var typingResponse = typingNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.CHAT_TYPING, typingResponse);
                break;
            case MESSAGE_TYPES.CHAT_NEW:
                var newChatNotif = new NewChatNotification();
                var newChatResponse = newChatNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.CHAT_NEW, newChatResponse);
                break;
            case MESSAGE_TYPES.CHAT_MESSAGE:
                var chatMessage = new ChatMessageRequest();
                var chatMessageResponse = chatMessage.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.CHAT_MESSAGE, chatMessageResponse);
                break;
            case MESSAGE_TYPES.CHAT_CANCELLED:
                var chatCancelled = new ChatCancelledNotification();
                var chatCancelledResponse = chatCancelled.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.CHAT_CANCELLED, chatCancelledResponse);
                break;
            case MESSAGE_TYPES.MONITOR_CHAT:
                //TODO: do this

                break;
            case MESSAGE_TYPES.LEAVE_CHAT:
                //TODO: do this

                break;
        }
    },

    processDialerResponse: function(instance, response) {
        var type = response.dialer_request['@type'];
        var messageId = response.dialer_request['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        var message = "Received " + type.toUpperCase() + " dialer response message from " + dest;

        // log message response
        utils.logMessage(LOG_LEVELS.INFO, message, response);

        // Send generic on message response
        utils.fireCallback(instance, CALLBACK_TYPES.ON_MESSAGE, response);

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.PREVIEW_DIAL_ID:
                var pdRequest = new PreviewDialRequest();
                var dialResponse = pdRequest.processResponse(response);
                if(dialResponse.action.toUpperCase() === "SEARCH"){
                    utils.fireCallback(instance, CALLBACK_TYPES.LEAD_SEARCH, dialResponse);
                }else{
                    utils.fireCallback(instance, CALLBACK_TYPES.PREVIEW_FETCH, dialResponse);
                }
                break;
            case MESSAGE_TYPES.TCPA_SAFE_ID:
                var tcpaRequest = new TcpaSafeRequest();
                var tcpaResponse = tcpaRequest.processResponse(response);
                if(tcpaResponse.action.toUpperCase() === "SEARCH"){
                    utils.fireCallback(instance, CALLBACK_TYPES.SAFE_MODE_SEARCH, tcpaResponse);
                }else{
                    utils.fireCallback(instance, CALLBACK_TYPES.SAFE_MODE_FETCH, tcpaResponse);
                }
                break;
        }

    },

    processRequest: function(instance, message) {
        var type = message.ui_request['@type'];

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.CHAT_SEND:
                var chatSendRequest = new ChatSendRequest();
                var chatSendResponse = chatSendRequest.processResponse(message);
                utils.fireCallback(instance, CALLBACK_TYPES.CHAT, chatSendResponse);
                break;
            case MESSAGE_TYPES.CHAT_ROOM_STATE:
                var chatRoomStateRequest = new ChatRoomStateRequest();
                var chatRoomStateResponse = chatRoomStateRequest.processResponse(message);
                utils.fireCallback(instance, CALLBACK_TYPES.CHAT_ROOM_STATE, chatRoomStateResponse);
                break;
        }
    },

    processStats: function(instance, data) {
        var type = data.ui_stats['@type'];
        var message = "Received " + type.toUpperCase() + " response message from IS";

        // log message response
        utils.logMessage(LOG_LEVELS.STATS, message, data);

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.STATS_AGENT:
                var agentStats = UIModel.getInstance().agentStatsPacket.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.STATS_AGENT, agentStats);
                break;
            case MESSAGE_TYPES.STATS_AGENT_DAILY:
                var agentDailyStats = UIModel.getInstance().agentDailyStatsPacket.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.STATS_AGENT_DAILY, agentDailyStats);

                // start daily stats interval timer, request update every second
                if(UIModel.getInstance().agentDailyIntervalId === null){
                    UIModel.getInstance().agentDailyIntervalId = setInterval(utils.onAgentDailyStats, 1000);
                }

                break;
            case MESSAGE_TYPES.STATS_CAMPAIGN:
                var campaignStats = UIModel.getInstance().campaignStatsPacket.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.STATS_CAMPAIGN, campaignStats);
                break;
            case MESSAGE_TYPES.STATS_QUEUE:
                var queueStats = UIModel.getInstance().queueStatsPacket.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.STATS_QUEUE, queueStats);
                break;
            case MESSAGE_TYPES.STATS_CHAT:
                var chatStats = UIModel.getInstance().chatQueueStatsPacket.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.STATS_CHAT_QUEUE, chatStats);
                break;
        }
    },

    /*
     * Take the xml marked JSON, group and item property names and reformat to
     * simple javascript object without the xml markers.
     * Will work recursively down the tree on nested objects and arrays.
     *
     * example of acceptable response tree (groupProp = requeue_gates, itemProp = gate_group):
     *   "requeue_gates": {
     *       "gate_group": [
     *           {
     *               "@gate_group_id": "4",
     *               "@group_name": "Test Gate Group",
     *               "gates": {
     *                   "gate": [
     *                       {
     *                           "@gate_desc": "",
     *                           "@gate_id": "10951",
     *                           "@gate_name": "CD ACD Queue"
     *                       },
     *                       {
     *                           "@gate_desc": "",
     *                           "@gate_id": "11036",
     *                           "@gate_name": "Xerox Test Gate"
     *                       }
     *                   ]
     *               },
     *               "skills": {
     *                   "skill": [
     *                       {
     *                           "@skill_desc": "",
     *                           "@skill_id": "322",
     *                           "@skill_name": "English"
     *                       },
     *                       {
     *                           "@skill_desc": "",
     *                           "@skill_id": "323",
     *                           "@skill_name": "Spanish"
     *                       }
     *                   ]
     *               }
     *           },
     *           {
     *               "@gate_group_id": "14292",
     *               "@group_name": "New Test Group",
     *               "gates": {
     *                   "gate": {
     *                       "@gate_desc": "",
     *                       "@gate_id": "15535",
     *                       "@gate_name": "New Test Gate"
     *                   }
     *               },
     *               "skills": {
     *                   "skill": {
     *                       "@skill_desc": "",
     *                       "@skill_id": "1658",
     *                       "@skill_name": "new skill"
     *                   }
     *               }
     *           }
     *       ]
     *   }
     *
     *   OR
     *
     *   "outdial_dispositions": {
     *       "@type": "GATE",
     *       "disposition": [
     *          {
     *           "@contact_forwarding": "false",
     *           "@disposition_id": "926",
     *           "@is_complete": "1",
     *           "@require_note": "0",
     *           "@save_survey": "1",
     *           "@xfer": "0",
     *           "#text": "One B"
     *          },
     *          {
     *           "@contact_forwarding": "false",
     *           "@disposition_id": "926",
     *           "@is_complete": "1",
     *           "@require_note": "0",
     *           "@save_survey": "1",
     *           "@xfer": "0",
     *           "#text": "One B"
     *          }
     *      ]
     *   }
     *
     *   OR
     *
     *   "outdial_dispositions": {
     *       "@type": "GATE",
     *       "disposition": {
     *          {
     *           "@contact_forwarding": "false",
     *           "@disposition_id": "926",
     *           "@is_complete": "1",
     *           "@require_note": "0",
     *           "@save_survey": "1",
     *           "@xfer": "0",
     *           "#text": "One B"
     *          }
     *      }
     *   }
     */

    processResponseCollection: function(response, groupProp, itemProp, textName) {
        var items = [];
        var item = {};
        var itemsRaw = [];
        var textName = textName || "text";

        if(response[groupProp] && typeof response[groupProp][itemProp] !== 'undefined'){
            itemsRaw = response[groupProp][itemProp];
        }

        if(Array.isArray(itemsRaw)) {
            // multiple items
            for (var i = 0; i < itemsRaw.length; i++) {
                var formattedKey = "";
                for(var key in itemsRaw[i]){
                    if(key.match(/^#/)){
                        // dealing with text property
                        formattedKey = textName;
                    }else{
                        // dealing with attribute
                        formattedKey = key.replace(/@/, ''); // remove leading '@'
                        formattedKey = formattedKey.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); }); // convert to camelCase
                    }

                    if(typeof itemsRaw[i][key] === "object"){
                        if(Object.keys(itemsRaw[i][key]).length === 1 && itemsRaw[i][key]['#text']) {
                            // only one property - #text attribute
                            item[formattedKey] = itemsRaw[i][key]['#text'];
                        }else if(Object.keys(itemsRaw[i][key]).length === 0){
                            // dealing with empty property
                            item[formattedKey] = "";
                        }else {
                            if(Array.isArray(itemsRaw[key]) || Object.keys(itemsRaw[i][key]).length > 1) {
                                //console.error('notify ross, array code has been hit', itemsRaw.toString(), key, groupProp, itemProp, textName);
                                var newIt = [];
                                newIt = utils.processResponseCollection(response[groupProp], itemProp, key, textName);
                                if(formattedKey.substr(formattedKey.length - 1) !== 's') {
                                    item[formattedKey + 's'] = newIt;
                                } else {
                                    item[formattedKey] = newIt;
                                }
                            } else {
                                var newItemProp = Object.keys(itemsRaw[i][key])[0];
                                var newItems = [];
                                newItems = utils.processResponseCollection(itemsRaw[i], key, newItemProp);
                                item[formattedKey] = newItems;
                            }
                        }
                    }else{
                        // can't convert 0 | 1 to boolean since some are counters
                        if(itemsRaw[i][key].toUpperCase() === "TRUE"){
                            item[formattedKey] = true;
                        }else if(itemsRaw[i][key].toUpperCase() === "FALSE"){
                            item[formattedKey] = false;
                        }else{
                            item[formattedKey] = itemsRaw[i][key];
                        }
                    }
                }

                items.push(item);
                item = {};
            }
        }else{
            // single item
            var formattedProp = "";
            for(var prop in itemsRaw){
                if(prop.match(/^#/)) {
                    // dealing with text property
                    formattedProp = textName;
                }else{
                    // dealing with attribute
                    formattedProp = prop.replace(/@/, ''); // remove leading '@'
                    formattedProp = formattedProp.replace(/_([a-z])/g, function (g) {
                        return g[1].toUpperCase();
                    }); // convert to camelCase
                }

                if(typeof itemsRaw[prop] === "object"){
                    if(itemsRaw[prop]['#text'] && Object.keys(itemsRaw[prop]).length === 1) {
                        // dealing only with #text element
                        item[formattedProp] = itemsRaw[prop]['#text'];
                    }else if(Object.keys(itemsRaw[prop]).length === 0){
                        // dealing with empty property
                        item[formattedProp] = "";
                    }else{
                        // make recursive call
                        if(Array.isArray(itemsRaw[prop]) || Object.keys(itemsRaw[prop]).length > 1){
                            var newIt = [];
                            newIt = utils.processResponseCollection(response[groupProp], itemProp, prop, textName);
                            if(formattedProp.substr(formattedProp.length - 1) !== 's'){
                                item[formattedProp + 's'] = newIt;
                            }else{
                                item[formattedProp] = newIt;
                            }
                        }else {
                            var newProp = Object.keys(itemsRaw[prop])[0];
                            var newItms = [];
                            newItms = utils.processResponseCollection(itemsRaw, prop, newProp);
                            item[formattedProp] = newItms;
                        }
                    }
                }else{
                    // can't convert 0 | 1 to boolean since some are counters
                    if(itemsRaw[prop].toUpperCase() === "TRUE"){
                        item[formattedProp] = true;
                    }else if(itemsRaw[prop].toUpperCase() === "FALSE"){
                        item[formattedProp] = false;
                    }else {
                        item[formattedProp] = itemsRaw[prop];
                    }
                }
            }

            items.push(item);
        }

        return items;
    },

    fireCallback: function(instance, type, response) {
        response = response || "";
        if (typeof type !== 'undefined' && typeof instance.callbacks[type] === 'function') {
            instance.callbacks[type].call(instance, response);
        }
    },

    setCallback: function(instance, type, callback) {
        if (typeof type !== 'undefined' && typeof callback !== 'undefined') {
            instance.callbacks[type] = callback;
        }
    },

    getMessageId: function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    },

    // check whether the given array of ids exist in the given array of objects
    // if not available, remove the id
    // returns the clean list of acceptable ids
    checkExistingIds: function(objArray, idArray, idProperty) {
        var availIds = [];
        var removeIds = [];

        // get list of available ids
        for(var o = 0; o < objArray.length; o++){
            availIds.push(parseInt(objArray[o][idProperty], 10));
        }

        // go through selected ids and mark unfound ones for removal
        for(var i = 0; i < idArray.length; i++){
            if(availIds.indexOf(parseInt(idArray[i],10)) === -1){
                // selected id not found in available list, mark for removal
                removeIds.push(parseInt(idArray[i],10));
            }
        }

        // remove marked ids
        for(var r = idArray.length -1; r >= 0; r--){
            if(removeIds.indexOf(parseInt(idArray[r],10)) > -1){
                // remove
                idArray.splice(r,1);
            }
        }

        return idArray;
    },

    // find an object by given id in an array of objects
    findObjById: function(objArray, id, propName) {
        for(var o = 0; o < objArray.length; o++){
            var obj = objArray[o];
            if(obj[propName] === id){
                return obj;
            }
        }

        return null;
    },

    // check whether agent dialDest is either a 10-digit number or valid sip
    validateDest: function(dialDest) {
        var isValid = false;
        var isNum = /^\d+$/.test(dialDest);
        if(isNum && dialDest.length === 10){
            // is a 10-digit number
            isValid = true;
        }else if(dialDest.slice(0,4).toLowerCase() === "sip:" && dialDest.indexOf("@") !== -1){
            // has sip prefix and '@'
            isValid = true;
        }

        return isValid;
    },

    // pass in MESSAGE_TYPE string (e.g. "CANCEL-CALLBACK"),
    // return corresponding CALLBACK_TYPE function name string (e.g. "callbackCancelResponse")
    findCallbackBasedOnMessageType: function(messageType) {
        var callbackFnName = "";
        for(var key in MESSAGE_TYPES){
            if(MESSAGE_TYPES[key] === messageType){
                callbackFnName = CALLBACK_TYPES[key];
            }
        }
        return callbackFnName;
    },

    // add message, detail, and status values to the formattedResponse
    // returned from each request processResponse method
    buildDefaultResponse: function(response) {
        var message = "";
        var detail = "";
        var status = "";
        var msg = "";
        var det = "";
        var stat = "";

        // add message and detail if present
        if(response.ui_response){
            msg = response.ui_response.message;
            det = response.ui_response.detail;
            stat = response.ui_response.status;
        }else if(response.ui_notification){
            msg = response.ui_notification.message;
            det = response.ui_notification.detail;
            stat = response.ui_notification.status;
        }

        if(msg){
            message = msg['#text'] || "";
        }
        if(det){
            detail = det['#text'] || "";
        }
        if(stat){
            status = stat['#text'] || "";
        }

        return ({
            message: message,
            detail: detail,
            status: status
        });
    },

    toString: function(val) {
        if(val){
            return val.toString();
        }else{
            return "";
        }
    },

    // safely check if property exists and return empty string
    // instead of undefined if it doesn't exist
    // convert "TRUE" | "FALSE" to boolean
    getText: function(obj,prop) {
        var o = obj[prop];
        if(o && o['#text']){
            if(o['#text'].toUpperCase() === "TRUE"){
                return true;
            }else if(o['#text'].toUpperCase() === "FALSE"){
                return false;
            }else{
                return o['#text'] || "";
            }
        }else{
            return "";
        }
    },

    // safely check if property exists and return empty string
    // instead of undefined if it doesn't exist
    // convert "TRUE" | "FALSE" to boolean
    getAttribute: function(obj,prop) {
        var o = obj[prop];
        if(o && o[prop]){
            if(o[prop].toUpperCase() === "TRUE"){
                return true;
            }else if(o[prop].toUpperCase() === "FALSE"){
                return false;
            }else{
                return o[prop] || "";
            }
        }else{
            return "";
        }
    },

    // Parses a string of key value pairs and returns an Array of KeyValue objects.
    // @param str The string of keyvalue pairs to parse
    // @param outerDelimiter The delimiter that separates each keyValue pair
    // @param innerDelimiter The delimiter that separates each key from its value
    parseKeyValuePairsFromString: function(str, outerDelimiter, innerDelimiter) {
        if (!str){
            return [];
        }

        var arr = str.split(outerDelimiter).reduce(function(dict, pair){
            var keyValue = pair.split(innerDelimiter);
            dict[keyValue[0]] = keyValue[1];
            return dict;
        },{});

        return arr;
    },

    // Finds a request by responseTo id
    findRequestById: function(instance, id) {
        var request = null;
        for(var i = 0; i < instance._requests.length; i++){
            if(instance._requests[i].id === id){
                request = instance._requests[i];
                break;
            }
        }
        return request;
    },

    // called every 30 seconds letting intelliQueue know
    // not to archive the call so dispositions and other call
    // clean up actions can happen
    sendPingCallMessage: function() {
        UIModel.getInstance().pingCallRequest = new PingCallRequest();
        var msg = UIModel.getInstance().pingCallRequest.formatJSON();
        var msgObj = JSON.parse(msg);
        var agentId = utils.getText(msgObj.ui_request,'agent_id');
        var uii = utils.getText(msgObj.ui_request,'uii');
        if(agentId === "" || uii === ""){
            utils.logMessage(LOG_LEVELS.WARN, "PING-CALL message failed, agentId or UII is empty", msgObj);
        }else{
            utils.sendMessage(UIModel.getInstance().libraryInstance, msg);
        }
    },

    // called every 5 seconds to request stats from IntelliServices
    sendStatsRequestMessage: function() {
        UIModel.getInstance().statsRequest = new StatsRequest();
        var msg = UIModel.getInstance().statsRequest.formatJSON();
        utils.sendMessage(UIModel.getInstance().libraryInstance, msg);
    },

    // called every second
    // if we have received agent daily stats
    // start incrementing various data points since not all
    // data is incremented when we want on the IntelliServices side
    onAgentDailyStats: function() {
        if(Object.keys(UIModel.getInstance().agentDailyStats).length !== 0){
            var agentSettings = UIModel.getInstance().agentSettings,
                stats = UIModel.getInstance().agentDailyStats;

            var curLoginTime = stats.totalLoginTime;
            stats.totalLoginTime = Number(curLoginTime) + 1;

            if(agentSettings.isOffhook){
                var curOffhookTime = stats.totalOffhookTime;
                stats.totalOffhookTime = Number(curOffhookTime) + 1;
            }

            if(agentSettings.currentState == 'ENGAGED'){
                var curTalkTime = stats.totalTalkTime;
                stats.totalTalkTime = Number(curTalkTime) + 1;

                var curCallTime = stats.currCallTime;
                stats.currCallTime = Number(curCallTime) + 1;
            }
        }
    }
};


