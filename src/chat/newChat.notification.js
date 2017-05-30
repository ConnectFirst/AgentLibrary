
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
 *          "transcript":{
 *              "message":[
 *                  { "@from":"system", "@type":"", "@dts":"yyyy-MM-dd HH:mm:ss", "#text":"User1 connected"},
 *                  { "@from":"dlbooks", "@type":"", "@dts":"yyyy-MM-dd HH:mm:ss", "#text":"Hello"},
 *                  { "@from":"user1", "@type":"", "@dts":"yyyy-MM-dd HH:mm:ss", "#text":"Hi"}
 *              ]
 *          },
 *          "json_baggage":{"#text":"json_string_form_data"},
 *      }
 *  }
 */
NewChatNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    // set up new call obj
    var newChat = {
        uii: utils.getText(notif,'uii'),
        accountId: utils.getText(notif,'account_id'),
        sessionId: utils.getText(notif,'session_id'),
        agentId: utils.getText(notif,'agent_id'),
        queueDts: utils.getText(notif,'queue_dts'),
        queueTime: utils.getText(notif,'queue_time'),
        chatQueueId: utils.getText(notif,'chat_queue_id'),
        chatQueueName: utils.getText(notif,'chat_queue_name'),
        appUrl: utils.getText(notif,'app_url'),
        channelType: utils.getText(notif,'channel_type'),
        ani: utils.getText(notif,'ani'),
        dnis: utils.getText(notif,'dnis'),
        surveyPopType: utils.getText(notif,'survey_pop_type'),
        scriptId: utils.getText(notif,'script_id'),
        scriptVersion: utils.getText(notif,'script_version'),
        preChatData: utils.getText(notif,'json_baggage')
    };

    //newChat.requeueShortcuts = utils.processResponseCollection(notification, 'ui_notification', 'requeue_shortcuts', 'requeueShortcut')[0];
    newChat.chatDispositions = utils.processResponseCollection(notification, 'ui_notification', 'chat_dispositions', 'disposition')[0];
    newChat.transcript = utils.processResponseCollection(notification, 'ui_notification', 'transcript', 'message')[0];

    if(newChat.chatDispositions && newChat.chatDispositions.disposition){
        newChat.outdialDispositions.dispositions = [newChat.chatDispositions]
    }else{
        newChat.chatDispositions = newChat.chatDispositions.dispositions;
    }

    /*if(newChat.requeueShortcuts && newChat.requeueShortcuts.name){
        newChat.requeueShortcuts = [newChat.requeueShortcuts];
    }else{
        newChat.requeueShortcuts = newChat.requeueShortcuts.requeueShortcuts;
    }*/

    if(newChat.transcript && newChat.transcript.message){
        newChat.transcript = [newChat.transcript];
    }else{
        newChat.transcript = newChat.transcript.messages;
    }

    return newChat;
};
