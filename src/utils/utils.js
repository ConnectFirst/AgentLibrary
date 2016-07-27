var utils = {
    sendMessage: function(instance, msg) {
        if (instance.socket.readyState === 1) {
            instance.socket.send(msg);
        } else {
            console.warn("WebSocket is not connected");
        }
    },

    processMessage: function(instance, response)
    {
        var type = response.ui_response['@type'];
        var messageId = response.ui_response['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        console.log("AgentLibrary: received message: (" + dest + ") " + type.toUpperCase());

        // Send generic on message response
        utils.fireCallback(instance, CALLBACK_TYPES.ON_MESSAGE, response);

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.LOGIN:
                if (dest === "IS") {
                    UIModel.getInstance().loginRequest.processResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.LOGIN, response);
                } else if (dest === 'IQ') {
                    UIModel.getInstance().configRequest.processResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.CONFIG, response);
                }
                break;
            case MESSAGE_TYPES.LOGOUT:
                // TODO add processResponse
                utils.fireCallback(instance, CALLBACK_TYPES.LOGOUT, response);
                break;
            case MESSAGE_TYPES.AGENT_STATE:
                if(UIModel.getInstance().agentStateRequest === null){
                    UIModel.getInstance().agentStateRequest = new AgentStateRequest(response.ui_response.current_state["#text"], response.ui_response.agent_aux_state['#text']);
                }
                UIModel.getInstance().agentStateRequest.processResponse(response);
                utils.fireCallback(instance, CALLBACK_TYPES.AGENT_STATE, response);
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

        if(typeof response[groupProp][itemProp] !== 'undefined'){
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
            availIds.push(objArray[o][idProperty]);
        }

        // go through selected ids and mark unfound ones for removal
        for(var i = 0; i < idArray.length; i++){
            if(availIds.indexOf(idArray[i]) === -1){
                // selected id not found in available list, mark for removal
                removeIds.push(idArray[i]);
            }
        }

        // remove marked ids
        for(var r = idArray.length -1; r >= 0; r--){
            if(removeIds.indexOf(idArray[r]) > -1){
                // remove
                idArray.splice(r,1);
            }
        }

        return idArray;
    }
};
