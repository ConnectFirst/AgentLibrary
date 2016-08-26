
var DialGroupChangeNotification = function() {

};

/*
 * This class is responsible for handling a DIAL_GROUP_CHANGE notification.
 * This event is sent from IQ when an agent's dial group is changed in through the AdminUI.
 *
 *   {
 *       "ui_notification": {
 *           "@message_id": "IQ10012016080413085500263",
 *           "@type": "DIAL_GROUP_CHANGE",
 *           "agent_id": { "#text": "1180958" },
 *           "dial_group_id": { "#text": "50354" },
 *           "dialGroupName": { "#text": "Preview Dial Mode" },
 *           "dial_group_desc": {}
 *       }
 *   }
 */
DialGroupChangeNotification.prototype.processResponse = function(notification) {
    //Modify configRequest with new DialGroupId
    var model = UIModel.getInstance();
    var notif = notification.ui_notification;
    var origLoginType = model.configRequest.loginType;
    var newDgId = utils.getText(notif, "dial_group_id");

    model.dialGroupChangeNotification = notification;

    // Calculate type of login - called from AdminUI when assigning agent to new dial group.
    // Only options should be BLENDED or OUTBOUND here.
    if(newDgId && newDgId !== "" && (origLoginType === "INBOUND" || origLoginType === "BLENDED") ){
        model.configRequest.loginType = "BLENDED";
    }else if (newDgId && newDgId !== ""){
        model.configRequest.loginType = "OUTBOUND";
    }else if (origLoginType  === "INBOUND"){
        model.configRequest.loginType = "INBOUND";
    }else{
        model.configRequest.loginType = "NO-SELECTION";
    }

    UIModel.getInstance().configRequest.dialGroupId = newDgId;

    var formattedResponse = {
        message: "Dial Group Updated Successfully.",
        detail: "Dial Group changed to [" + newDgId + "].",
        dialGroupId: utils.getText(notif, "dial_group_id"),
        dialGroupName: utils.getText(notif, "dialGroupName"), // camel case from server for some reason :/
        dialGroupDesc: utils.getText(notif, "dial_group_desc"),
        agentId: utils.getText(notif, "agent_id")
    };

    return formattedResponse;
};
