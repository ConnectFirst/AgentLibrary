function initAgentLibrarySocket (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    AgentLibrary.prototype.openSocket = function(callback){
        var instance = this;
        utils.setCallback(instance, CALLBACK_TYPES.OPEN_SOCKET, callback);
        if("WebSocket" in context){
            console.log("AgentLibrary: attempting to open socket connection...");
            instance.socket = new WebSocket(UIModel.getInstance().applicationSettings.socketDest);

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
                }
            };

            instance.socket.onclose = function(){
                utils.fireCallback(instance, CALLBACK_TYPES.CLOSE_SOCKET, '');
                UIModel.getInstance().applicationSettings.socketConnected = false;
            };
        }else{
            console.warn("AgentLibrary: WebSocket NOT supported by your Browser.");
        }
    };

    AgentLibrary.prototype.closeSocket = function(){
        this.socket.close();
    };

}