
var NewChatNotification = function() {

};

/*
 * External Chat:
 * This class is responsible for handling "NEW-CHAT" packets from IntelliQueue.
 *
 *  {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016081611595000289",
 *          "@type":"NEW-CHAT",
 *          "@destination":"IQ",
 *          "@response_to":"",
 *          "uii":{"#text":"201608161200240139000000000120"},
 *          "account_id":{"#text":"99999999"},
 *          "session_id":{"#text":"2"},
 *          "agent_id":{"#text":"1180958"},
 *          "queue_dts":{"#text":""},
 *          "queue_time":{"#text":""},
 *          "chat_queue_id":{"#text":""},
 *          "chat_queue_name":{"#text":""},
 *          "chat_requeue_type" : {"#text":""}
 *          "app_url":{"#text":""},
 *          "channel_type":{"#text":""},
 *          "ani":{"#text":""},
 *          "dnis":{"#text":""},
 *          "survey_pop_type":{"#text":""},
 *          "script_id":{"#text":""},
 *          "script_version":{"#text":""},
 *          "requeue_shortcuts":{
 *              "requeue_shortcut":{
 *                  "@chat_queue_id":"2",
 *                  "@name":"test queue",
 *                  "@skill_id":""
 *              }
 *          },
 *          "chat_dispositions":{
 *              "disposition":[
 *                  { "@disposition_id":"2", "@is_success":"true", "@is_complete":"false", "@email_template_id":"1", "#text":"Complete"},
 *                  { "@disposition_id":"3", "@is_success":"true", "@is_complete":"false", "#text":"Requeue"}
 *              ]
 *          },
 *          "chat_requeue_shortcuts" :{
 *              shortcut : [
 *                {@chat_requeue_shortcut_id:"3", @name:"test", @rank:"1",@requeue_chat_queue_id:"74",@skill_id:""}
 *              ]
 *          }
 *          "transcript":{
 *              "message":[
 *                  { "@from":"system", "@type":"SYSTEM", "@dts":"yyyy-MM-dd HH:mm:ss", "#text":"User1 connected"},
 *                  { "@from":"dlbooks", "@type":"AGENT", "@dts":"yyyy-MM-dd HH:mm:ss", "#text":"Hello"},
 *                  { "@from":"user1", "@type":"CLIENT", "@dts":"yyyy-MM-dd HH:mm:ss", "#text":"Hi"}
 *              ]
 *          },
 *          "json_baggage":{"#text":"json_string_form_data"}, <--- pre-form chat data
 *      }
 *  }
 */
NewChatNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    var dts = utils.getText(notif,'queue_dts');
    dts = new Date(dts.replace(' ','T'));

    // set up new call obj
    var newChat = {
        uii: utils.getText(notif,'uii'),
        accountId: utils.getText(notif,'account_id'),
        sessionId: utils.getText(notif,'session_id'),
        agentId: utils.getText(notif,'agent_id'),
        queueDts: dts,
        queueTime: utils.getText(notif,'queue_time'),
        chatQueueId: utils.getText(notif,'chat_queue_id'),
        chatQueueName: utils.getText(notif,'chat_queue_name'),
        chatRequeueType : utils.getText(notif, 'chat_requeue_type'),
        appUrl: utils.getText(notif,'app_url'),
        channelType: utils.getText(notif,'channel_type'),
        ani: utils.getText(notif,'ani'),
        dnis: utils.getText(notif,'dnis'),
        surveyPopType: utils.getText(notif,'survey_pop_type'),
        scriptId: utils.getText(notif,'script_id'),
        scriptVersion: utils.getText(notif,'script_version'),
        preChatData: utils.getText(notif,'json_baggage')
    };

    newChat.requeueShortcuts = utils.processResponseCollection(notification, 'ui_notification', 'chat_requeue_shortcuts', 'shortcut')[0];
    newChat.chatDispositions = utils.processResponseCollection(notification, 'ui_notification', 'chat_dispositions', 'disposition')[0];
    newChat.transcript = utils.processResponseCollection(notification, 'ui_notification', 'transcript', 'message')[0];
    newChat.baggage = utils.processResponseCollection(notification, 'ui_notification', 'json_baggage')[0];

    if(newChat.chatDispositions && newChat.chatDispositions.disposition){
        newChat.chatDispositions.dispositions = [newChat.chatDispositions]
    }else{
        newChat.chatDispositions = newChat.chatDispositions.dispositions;
    }

    if(newChat.transcript && newChat.transcript.message){
        newChat.transcript = [newChat.transcript];
    }else{
        newChat.transcript = newChat.transcript.messages;
    }

    if(newChat.preChatData){
        try {
            newChat.preChatData = JSON.parse(newChat.preChatData);
        }catch(err){
            utils.logMessage(LOG_LEVELS.ERROR, "Error parsing the pre-form chat data.", notif);
        }

    }

    // convert numbers to boolean
    if(newChat.chatDispositions){
        for(var d = 0; d < newChat.chatDispositions.length; d++){
            var disp = newChat.chatDispositions[d];
            disp.isComplete = disp.isComplete === "1";
            disp.isSuccess = disp.isSuccess === "1";
        }
    }

    // convert dates
    if(newChat.transcript){
        for(var t = 0; t < newChat.transcript.length; t++){
            var msg = newChat.transcript[t];
            if(msg.dts){
                msg.dts = new Date(msg.dts.replace(' ','T'));
            }
        }
    }

    // Build token map
    newChat.baggage = buildChatTokenMap(notif, newChat);

    return newChat;
};

function buildChatTokenMap(notif, newChat){
    var tokens = {};
    var model = UIModel.getInstance();

    if(newChat.preChatData){
        for(var prop in newChat.preChatData){
            if(newChat.preChatData.hasOwnProperty(prop)){
                tokens[prop] = newChat.preChatData[prop];
            }
        }
    }

    try{
        tokens["chatQueueId"] = newChat.chatQueueId;
        tokens["chatQueueName"] = newChat.chatQueueName;
        tokens["ani"] = newChat.ani;
        tokens["dnis"] = newChat.dnis;
        tokens["uii"] = newChat.uii;
    }catch(any){
        console.error("There was an error parsing chat tokens for basic chat info. ", any);
    }

    try{
        tokens["agentFirstName"] = model.agentSettings.firstName;
        tokens["agentLastName"] = model.agentSettings.lastName;
        tokens["agentExternalId"] = model.agentSettings.externalAgentId;
        tokens["agentType"] = model.agentSettings.agentType;
        tokens["agentEmail"] = model.agentSettings.email;
        tokens["agentUserName"] = model.agentSettings.username;
    }catch(any){
        console.error("There was an error parsing chat tokens for agent info. ", any);
    }

    return tokens;
}
