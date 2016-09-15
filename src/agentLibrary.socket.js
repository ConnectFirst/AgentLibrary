function initAgentLibrarySocket (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    AgentLibrary.prototype.openSocket = function(callback){
        var instance = this;
        utils.setCallback(instance, CALLBACK_TYPES.OPEN_SOCKET, callback);
        if("WebSocket" in context){
            var socketDest = UIModel.getInstance().applicationSettings.socketDest;
            utils.logMessage(LOG_LEVELS.DEBUG, "Attempting to open socket connection to " + socketDest, "");
            instance.socket = new WebSocket(socketDest);

            instance.socket.onopen = function() {
                UIModel.getInstance().applicationSettings.socketConnected = true;
                utils.fireCallback(instance, CALLBACK_TYPES.OPEN_SOCKET, '');
            };

            instance.socket.onmessage = function(evt){
                var data = JSON.parse(evt.data);
                if(data.ui_response){
                    utils.processResponse(instance, data);
                }else if(data.ui_notification){
                    utils.processNotification(instance, data);
                }else if(data.dialer_request){
                    utils.processDialerResponse(instance, data);
                }else if(data.ui_stats){
                    utils.processStats(instance, data);
                }
            };

            instance.socket.onclose = function(){
                utils.fireCallback(instance, CALLBACK_TYPES.CLOSE_SOCKET, '');
                UIModel.getInstance().applicationSettings.socketConnected = false;

                // cancel stats timer
                clearInterval(UIModel.getInstance().statsIntervalId);
                UIModel.getInstance().statsIntervalId = null;
            };
        }else{
            utils.logMessage(LOG_LEVELS.WARN, "WebSocket NOT supported by your Browser", "");
        }
    };

    AgentLibrary.prototype.closeSocket = function(){
        this.socket.close();
    };

}