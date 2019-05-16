function initAgentLibrarySocket (context) {
    'use strict';
    var AgentLibrary = context.AgentLibrary;
    AgentLibrary.prototype.openSocket = function(agentId, callback){
        var instance = this;
        utils.setCallback(instance, CALLBACK_TYPES.OPEN_SOCKET, callback);
        if("WebSocket" in context){
            if(!instance.socket){
                UIModel.getInstance().agentSettings.agentId = agentId; // set agentId here since id is in scope
                UIModel.getInstance().applicationSettings.socketDest += "&agent_id=" + agentId;

                var socketDest = UIModel.getInstance().applicationSettings.socketDest;
                utils.logMessage(LOG_LEVELS.DEBUG, "Attempting to open socket connection to " + socketDest, "");
                instance.socket = new WebSocket(socketDest);
                instance.socket.onopen = function() {
                    UIModel.getInstance().applicationSettings.socketConnected = true;
                    utils.fireCallback(instance, CALLBACK_TYPES.OPEN_SOCKET, {reconnect:instance._isReconnect});
                    instance.socketOpened();
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
                    }else if(data.ui_request){
                        utils.processRequest(instance, data);
                    }
                };

                instance.socket.onclose = function(){
                    utils.fireCallback(instance, CALLBACK_TYPES.CLOSE_SOCKET, '');
                    UIModel.getInstance().applicationSettings.socketConnected = false;
                    instance.socket = null;

                    // cancel daily stats timer
                    clearInterval(UIModel.getInstance().agentDailyIntervalId);
                    UIModel.getInstance().agentDailyIntervalId = null;

                    // cancel stats timer
                    clearInterval(UIModel.getInstance().statsIntervalId);
                    UIModel.getInstance().statsIntervalId = null;

                    // if we are still logged in, set reconnect flag and try to reconnect
                    if(UIModel.getInstance().agentSettings.isLoggedIn){
                        instance._isReconnect = true;
                        console.warn("AgentLibrary: WebSocket is not connected, attempting to reconnect.");

                        setTimeout(function(){
                            instance.openSocket(UIModel.getInstance().agentSettings.agentId);
                        }, 5000);
                    }
                };
            }
        }else{
            utils.logMessage(LOG_LEVELS.WARN, "WebSocket NOT supported by your Browser", "");
        }
    };
    AgentLibrary.prototype.closeSocket = function(){
        this.socket.close();
    };
    // when socket is successfully opened, check to see if there are any queued messaged
    // and if so, send them.
    AgentLibrary.prototype.socketOpened = function(){
        var instance = this;
        var currDts = new Date();
        var threeMins = 3 * 60 * 1000; // milliseconds
        var queuedMsg;

        // get agent configuration information - "phase 1 login"
        UIModel.getInstance().loginPhase1Request = new LoginPhase1Request();
        var msg = UIModel.getInstance().loginPhase1Request.formatJSON();
        utils.sendMessage(this, msg);

        // if this is a reconnect, we need to re-authenticate with IntelliServices & IntelliQueue
        if(instance._isReconnect){
            instance._isReconnect = false;
            // Add IntelliQueue reconnect
            var loginRequest = JSON.parse(UIModel.getInstance().loginRequest.formatJSON());
            var hashCode = UIModel.getInstance().connectionSettings.hashCode;
            loginRequest.ui_request.hash_code = {
                "#text":hashCode
            };
            loginRequest.ui_request.update_login = {
                "#text": "FALSE"
            };
            loginRequest.ui_request.reconnect = {
                "#text": "TRUE"
            };
            instance._queuedMsgs.unshift({dts: new Date(), msg: JSON.stringify(loginRequest)});

            // todo - dlb - remove with new RC SSO
            // Add IntelliServices reconnect
            /*var loginRequest = JSON.parse(UIModel.getInstance().loginRequest.formatJSON());
            var agentId = UIModel.getInstance().agentSettings.agentId;
            loginRequest.ui_request.reconnect = {
                "#text":"TRUE"
            };
            loginRequest.ui_request.agent_id = {
                "#text": utils.toString(agentId)
            };
            instance._queuedMsgs.unshift({dts: new Date(), msg: JSON.stringify(loginRequest)});*/
        }
        for(var idx=0; idx < instance._queuedMsgs.length; idx++){
            queuedMsg = instance._queuedMsgs[idx];
            if(currDts.getTime() - queuedMsg.dts.getTime() < threeMins){
                // message queued less than 3 mins ago, send
                utils.logMessage(LOG_LEVELS.DEBUG, "Sending queued message to IntelliSocket.", queuedMsg.msg);
                utils.sendMessage(instance,queuedMsg.msg);
            }else{
                // message expired, don't send
                utils.logMessage(LOG_LEVELS.DEBUG, "Queued message expired, discarding.", queuedMsg.msg);
            }
        }
        // reset queued messages
        instance._queuedMsgs = [];
    };
}
