var utils = {
    sendMessage: function(instance, msg) {
        if (instance.socket.readyState === 1) {
            // add message id to request map, then send message
            var msgObj = JSON.parse(msg);
            instance._requests[msgObj.ui_request['@message_id']] = { type: msgObj.ui_request['@type'], msg: msgObj.ui_request };
            instance.socket.send(msg);
        } else {
            console.warn("AgentLibrary: WebSocket is not connected, cannot send message.");
        }
    },

    processResponse: function(instance, response)
    {
        var type = response.ui_response['@type'];
        var messageId = response.ui_response['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        console.log("AgentLibrary: received response: (" + dest + ") " + type.toUpperCase());

        // Send generic on message response
        utils.fireCallback(instance, CALLBACK_TYPES.ON_MESSAGE, response);

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.LOGIN:
                if (dest === "IS") {
                    var loginResponse = UIModel.getInstance().loginRequest.processResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.LOGIN, loginResponse);
                } else if (dest === 'IQ') {
                    var configResponse = UIModel.getInstance().configRequest.processResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.CONFIG, configResponse);
                }
                break;
            case MESSAGE_TYPES.LOGOUT:
                // TODO add processResponse?
                utils.fireCallback(instance, CALLBACK_TYPES.LOGOUT, response);
                break;
            case MESSAGE_TYPES.AGENT_STATE:
                if(UIModel.getInstance().agentStateRequest === null){
                    UIModel.getInstance().agentStateRequest = new AgentStateRequest(response.ui_response.current_state["#text"], response.ui_response.agent_aux_state['#text']);
                }
                var stateChangeResposne = UIModel.getInstance().agentStateRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.AGENT_STATE, stateChangeResposne);
                break;
            case MESSAGE_TYPES.OFFHOOK_INIT:
                var initResponse = UIModel.getInstance().offhookInitRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.OFFHOOK_INIT, initResponse);
                break;
            case MESSAGE_TYPES.CALLBACK_PENDING:
                var pendingCallbacks = UIModel.getInstance().callbacksPendingRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.CALLBACK_PENDING, pendingCallbacks);
            break;
        }

    },

    processNotification: function(instance, data){
        var type = data.ui_notification['@type'];
        var messageId = data.ui_notification['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        console.log("AgentLibrary: received notification: (" + dest + ") " + type.toUpperCase());

        switch (type.toUpperCase()){
            case MESSAGE_TYPES.GATES_CHANGE:
                var gateChangeNotif = new GatesChangeNotification();
                var gateChangeResponse = gateChangeNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.GATES_CHANGE, gateChangeResponse);
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
            case MESSAGE_TYPES.END_CALL:
                var endCallNotif = new EndCallNotification(instance);
                var endCallResponse = endCallNotif.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.END_CALL, endCallResponse);
                break;
            case MESSAGE_TYPES.GENERIC:
                var genericNotif = new GenericNotification();
                var generic = genericNotif.processResponse(data);
                var responseTo = data.ui_notification['@response_to'];
                if(instance._requests[responseTo]){
                    // found corresponding request, fire registered callback for type
                    var type = instance._requests[responseTo].type;
                    var callbackFnName = utils.findCallbackBasedOnMessageType(type);
                    utils.fireCallback(instance, callbackFnName, generic);
                }else{
                    // no corresponding request, just fire generic notification callback
                    utils.fireCallback(instance, CALLBACK_TYPES.GENERIC_NOTIFICATION, generic);
                }
                break;
            case MESSAGE_TYPES.OFFHOOK_TERM:
                if(UIModel.getInstance().offhookTermRequest === null){
                    // offhook term initiated by IQ
                    UIModel.getInstance().offhookTermRequest = new OffhookTermRequest();
                }
                var termResponse = UIModel.getInstance().offhookTermRequest.processResponse(data);
                utils.fireCallback(instance, CALLBACK_TYPES.OFFHOOK_TERM, termResponse);
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
     */

    processResponseCollection: function(response, groupProp, itemProp){
        var items = [];
        var item = {};
        var itemsRaw = [];

        if(response[groupProp] && typeof response[groupProp][itemProp] !== 'undefined'){
            itemsRaw = response[groupProp][itemProp];
        }

        if(Array.isArray(itemsRaw)) {
            // multiple items
            for (var i = 0; i < itemsRaw.length; i++) {
                var formattedKey = "";
                for(var key in itemsRaw[i]){
                    formattedKey = key.replace(/@/, ''); // remove leading '@'
                    formattedKey = formattedKey.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); }); // convert to camelCase

                    if(typeof itemsRaw[i][key] === "object"){
                        // make recursive call
                        var newItemProp = Object.keys(itemsRaw[i][key])[0];
                        var newItems = [];
                        newItems = utils.processResponseCollection(itemsRaw[i], key, newItemProp);
                        item[formattedKey] = newItems;
                    }else{
                        item[formattedKey] = itemsRaw[i][key];
                    }
                }

                items.push(item);
                item = {};
            }
        }else{
            // single item
            var formattedProp = "";
            for(var prop in itemsRaw){
                formattedProp = prop.replace(/@/, ''); // remove leading '@'
                formattedProp = formattedProp.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); }); // convert to camelCase

                if(typeof itemsRaw[prop] === "object"){
                    // make recursive call
                    var newProp = Object.keys(itemsRaw[prop])[0];
                    var newItms = [];
                    newItms = utils.processResponseCollection(itemsRaw, prop, newProp);
                    item[formattedProp] = itemsRaw[prop];
                }else{
                    item[formattedProp] = itemsRaw[prop];
                }
            }

            items.push(item);
        }

        return items;
    },

    fireCallback: function(instance, type, response) {
        response = response || "";
        if (typeof instance.callbacks[type] === 'function') {
            instance.callbacks[type].call(instance, response);
        }
    },

    setCallback: function(instance, type, callback) {
        if (typeof callback !== 'undefined') {
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
    findObjById: function(objArray, id, propName){
        for(var o = 0; o < objArray.length; o++){
            var obj = objArray[o];
            if(obj[propName] === id){
                return obj;
            }
        }

        return null;
    },

    // check whether agent dialDest is either a 10-digit number or valid sip
    validateDest: function(dialDest){
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
    findCallbackBasedOnMessageType: function(messageType){
        var callbackFnName = "";
        for(key in MESSAGE_TYPES){
            if(MESSAGE_TYPES[key] === messageType){
                callbackFnName = CALLBACK_TYPES[key];
            }
        }
        return callbackFnName;
    },

    // add message, detail, and status values to the formattedResponse
    // returned from each request processResponse method
    buildDefaultResponse: function(response){
        // add message and detail if present
        var msg = response.ui_response.message;
        var det = response.ui_response.detail;
        var stat = response.ui_response.status;
        var message = "";
        var detail = "";
        var status = "";
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
    }
};
