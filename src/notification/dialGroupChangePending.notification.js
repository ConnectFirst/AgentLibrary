
var DialGroupChangePendingNotification = function() {

};

/*
 * This class is responsible for handling a DIAL_GROUP_CHANGE_PENDING notification.
 * This event is sent from IQ when an agent's dial group is changed and the agent is on a call.
 *
 * {
 *     "ui_notification": {
 *         "@message_id": "IQ10012016080515294800318",
 *         "@type": "DIAL_GROUP_CHANGE_PENDING",
 *         "agent_id": { "#text": "1180958" },
 *         "dial_group_id": { "#text": "50354" },
 *         "update_from_adminui": { "#text": "TRUE" }
 *     }
 * }
 */
DialGroupChangePendingNotification.prototype.processResponse = function(notification) {
    var model = UIModel.getInstance();
    var notif = notification.ui_notification;
    model.agentSettings.pendingDialGroupChange = parseInt(utils.getText(notif, "dial_group_id"), 10);

    // check if request originated with AdminUI
    if(notif.update_from_adminui){
        model.agentSettings.updateDGFromAdminUI = utils.getText(notif, "update_from_adminui") === true;
    }else{
        model.agentSettings.updateDGFromAdminUI = false;
    }

    var formattedResponse = {
        message: "Dial Group Change Pending notification received.",
        detail: "DialGroup switch for existing session pending until active call ends.",
        agentId: utils.getText(notif, "agent_id"),
        dialGroupId: utils.getText(notif, "dial_group_id"),
        updateFromAdminUI: utils.getText(notif, "update_from_adminui")
    };

    return formattedResponse;
};
