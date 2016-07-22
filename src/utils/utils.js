var utils = {
    sendMessage: function (instance, msg) {
        if (instance.socket.readyState === 1) {
            instance.socket.send(msg);
        } else {
            alert("WebSocket is not connected");
        }
    },

    processMessage: function (instance, response)
    {
        var type = response.ui_response['@type'];
        var messageId = response.ui_response['@message_id'];
        var dest = messageId === "" ? "IS" : messageId.slice(0, 2);
        console.log("AgentLibrary: received message: (" + dest + ") " + type.toUpperCase());

        // Fire callback function
        switch (type.toUpperCase()) {
            case MESSAGE_TYPES.LOGIN:
                if (dest === "IS") {
                    UIModel.getInstance().loginRequest.setResponse(response);
                    utils.fireCallback(instance, CALLBACK_TYPES.LOGIN, response);
                } else if (dest === 'IQ') {
                    utils.fireCallback(instance, CALLBACK_TYPES.CONFIG, response);
                }
                break;
            case MESSAGE_TYPES.LOGOUT:
                utils.fireCallback(instance, CALLBACK_TYPES.LOGOUT, response);
                break;
            case MESSAGE_TYPES.AGENT_STATE:
                utils.fireCallback(instance, CALLBACK_TYPES.AGENT_STATE, response);
        }
    },

    fireCallback: function (instance, type, response) {
        response = response || "";
        if (typeof instance.callbacks[type] === 'function') {
            instance.callbacks[type].call(instance, response);
        }
    },

    setCallback: function (instance, type, callback) {
        if (typeof callback !== 'undefined') {
            instance.callbacks[type] = callback;
        }
    },

    getMessageId: function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }
};
