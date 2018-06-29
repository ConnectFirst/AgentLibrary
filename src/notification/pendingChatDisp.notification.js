
var PendingChatDispNotification = function() {

};

/*
 * This class is responsible for handling a generic notification
 *
 *  {
 *       "ui_notification":{
 *           "@message_id":"IQD01DEV2018062912352800014",
 *           "@type":"PENDING_CHAT_DISP",
 *           "agent_id":{ "#text":"1182160" },
 *           "uii":{ "#text":"201806291234550147950000000000" },
 *           "status":{ "#text":"false" }
 *       }
 *   }
 */
PendingChatDispNotification.prototype.processResponse = function(notification) {
    var formattedResponse = {};
    formattedResponse.agentId = utils.getText(notification.ui_notification,"agent_id");
    formattedResponse.uii = utils.getText(notification.ui_notification,"uii");
    formattedResponse.status = utils.getText(notification.ui_notification,"status") === 'true';

    return formattedResponse;
};
