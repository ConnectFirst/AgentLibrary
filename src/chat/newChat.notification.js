
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
 *          "session_id":{"#text":"2"},
 *          "agent_id":{"#text":"1180958"},
 *          "queue_dts":{"#text":""},
 *          "queue_time":{"#text":""},
 *          "chat_queue_name":{"#text":""},
 *          "is_sms":{"#text":"true|false"},
 *          "requeue_shortcuts":{
 *              "requeue_shortcut":{
 *                  "@chat_queue_id":"2",
 *                  "@name":"test queue",
 *                  "@skill_id":""
 *              }
 *          },
 *          "chat_dispositions":{
 *              "dispositions":[
 *                  { "@disposition_id":"2", "#text":"Complete"},
 *                  { "@disposition_id":"3", "#text":"Requeue"}
 *              ]
 *          },
 *          "app_url":{"#text":""},
 *          "script_id":{"#text":""},
 *          "survey_pop_type":{"#text":""},
 *          "script_version":{"#text":""},
 *          "pre_chat_data":{"#text":"json_string_form_data"},
 *          "history":{
 *              "message":[
 *                  { "@from":"system", "@type":"SYSTEM", "#text":"User1 connected"},
 *                  { "@from":"dlbooks", "@type":"AGENT", "#text":"Hello"},
 *                  { "@from":"user1", "@type":"CLIENT", "#text":"Hi"}
 *              ]
 *          }
 *      }
 *  }
 */
NewChatNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;

    // set up new call obj
    var newChat = {
        uii: utils.getText(notif,'uii'),
        sessionId: utils.getText(notif,'session_id'),
        agentId: utils.getText(notif,'agent_id'),
        queueDts: utils.getText(notif,'queue_dts'),
        queueTime: utils.getText(notif,'queue_time'),
        chatQueueName: utils.getText(notif,'chat_queue_name'),
        isSms: utils.getText(notif,'is_sms'),
        appUrl: utils.getText(notif,'app_url'),
        scriptId: utils.getText(notif,'script_id'),
        surveyPopType: utils.getText(notif,'survey_pop_type'),
        scriptVersion: utils.getText(notif,'script_version'),
        preChatData: utils.getText(notif,'pre_chat_data')
    };

    newChat.requeueShortcuts = utils.processResponseCollection(notification, 'ui_notification', 'requeue_shortcuts', 'requeueShortcut')[0];
    newChat.chatDispositions = utils.processResponseCollection(notification, 'ui_notification', 'chat_dispositions', 'disposition')[0];
    newChat.history = utils.processResponseCollection(notification, 'ui_notification', 'history', 'message')[0];

    if(newChat.chatDispositions && newChat.chatDispositions.disposition){
        newChat.outdialDispositions.dispositions = [newChat.chatDispositions]
    }else{
        newChat.chatDispositions = newChat.chatDispositions.dispositions;
    }

    if(newChat.requeueShortcuts && newChat.requeueShortcuts.name){
        newChat.requeueShortcuts = [newChat.requeueShortcuts];
    }else{
        newChat.requeueShortcuts = newChat.requeueShortcuts.requeueShortcuts;
    }

    if(newChat.history && newChat.history.message){
        newChat.history = [newChat.history];
    }else{
        newChat.history = newChat.history.messages;
    }

    return newChat;
};
