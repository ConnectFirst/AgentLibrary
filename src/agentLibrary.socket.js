
<<<<<<< Updated upstream
            instance.socket.onclose = function(){
                utils.fireCallback(instance, CALLBACK_TYPES.CLOSE_SOCKET, '');
                UIModel.getInstance().applicationSettings.socketConnected = false;
=======
                    // cancel daily stats timer
                    clearInterval(UIModel.getInstance().agentDailyIntervalId);
                    UIModel.getInstance().agentDailyIntervalId = null;
                    // if we are still logged in, try to reconnect
                    if(UIModel.getInstance().agentSettings.isLoggedIn){
                        setTimeout(function(){
                            instance.openSocket();
                        }, 5000);
                    }
>>>>>>> Stashed changes

                // cancel stats timer
                clearInterval(UIModel.getInstance().statsIntervalId);
                UIModel.getInstance().statsIntervalId = null;
            };
            // Add IntelliQueue reconnect
            var configRequest = JSON.parse(UIModel.getInstance().configRequest.formatJSON());
            var hashCode = UIModel.getInstance().connectionSettings.hashCode;
            configRequest.ui_request.hash_code = {
                "#text":hashCode
            };
            configRequest.ui_request.update_login = {
                "#text": "FALSE"
            };
            configRequest.ui_request.reconnect = {
                "#text": "TRUE"
            };
            instance._queuedMsgs.unshift({dts: new Date(), msg: JSON.stringify(configRequest)});

            // Add IntelliServices reconnect
            var loginRequest = JSON.parse(UIModel.getInstance().loginRequest.formatJSON());
            var agentId = UIModel.getInstance().agentSettings.agentId;
            loginRequest.ui_request.reconnect = {
                "#text":"TRUE"
            };
            loginRequest.ui_request.agent_id = {
                "#text": utils.toString(agentId)
            };
            instance._queuedMsgs.unshift({dts: new Date(), msg: JSON.stringify(loginRequest)});
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