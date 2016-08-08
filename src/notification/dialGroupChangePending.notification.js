
var DialGroupChangePendingNotification = function() {

};

/*
 * This class is responsible for handling a DIAL_GROUP_CHANGE_PENDING notification.
 * This event is sent from IQ when an agent's dial group is changed and the agent is on a call.
 *
 * <ui_notification message_id="IQ10012016080515294800318" type="DIAL_GROUP_CHANGE_PENDING">
 *   <agent_id>1180958</agent_id>
 *   <dial_group_id>50354</dial_group_id>
 *   <update_from_adminui>TRUE</update_from_adminui>
 * </ui_notification>
 */
DialGroupChangePendingNotification.prototype.processResponse = function(notification) {
    var model = UIModel.getInstance();
    model.agentSettings.pendingDialGroupChange = parseInt(notification.ui_notification.dial_group_id["#text"], 10);

    // check if request originated with AdminUI
    if(notification.ui_notification.update_from_adminui){
        model.agentSettings.updateDGFromAdminUI = notification.ui_notification.update_from_adminui["#text"].toUpperCase() === "TRUE";
    }else{
        model.agentSettings.updateDGFromAdminUI = false;
    }

    var formattedResponse = {
        message: "Dial Group Change Pending notification received.",
        detail: "DialGroup switch for existing session pending until active call ends.",
        agentId: notification.ui_notification.agent_id['#text'],
        dialGroupId: notification.ui_notification.dial_group_id['#text'],
        updateFromAdminUI: notification.ui_notification.update_from_adminui['#text']
    };

    return formattedResponse;
};
