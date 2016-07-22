function initAgentLibrarySocket (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    AgentLibrary.prototype.openSocket = function(callback){
        var instance = this;
        utils.setCallback(instance, CALLBACK_TYPES.OPEN_SOCKET, callback);
        if("WebSocket" in context){
            console.log("AgentLibrary: attempting to open socket connection...");
            instance.socket = new WebSocket(UIModel.getInstance().socketDest);
            UIModel.getInstance().socketConnected = true;

            instance.socket.onopen = function() {
                utils.fireCallback(instance, CALLBACK_TYPES.OPEN_SOCKET, '');
            };

            instance.socket.onmessage = function(evt){
                utils.processMessage(instance, JSON.parse(evt.data));
            };

            instance.socket.onclose = function(){
                utils.fireCallback(instance, CALLBACK_TYPES.CLOSE_SOCKET, '');
                UIModel.getInstance().socketConnected = false;
            };
        }else{
            console.log("AgentLibrary: WebSocket NOT supported by your Browser.");
        }
    };

    AgentLibrary.prototype.closeSocket = function(){
        this.socket.close();
    };

}