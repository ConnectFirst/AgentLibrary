
var DialGroupChangeNotification = function() {

};

/*
 * This class is responsible for handling a DIAL_GROUP_CHANGE notification.
 * This event is sent from IQ when an agent's dial group is changed in through the AdminUI.
 *
 *  <ui_notification message_id="IQ10012016080413085500263" type="DIAL_GROUP_CHANGE">
 *      <agent_id>1180958</agent_id>
 *      <dial_group_id>50354</dial_group_id>
 *      <dialGroupName>Preview Dial Mode</dialGroupName>
 *      <dial_group_desc/>
 *  </ui_notification>
 */
DialGroupChangeNotification.prototype.processResponse = function(notification) {
    //Modify configRequest with new DialGroupId
    var origLoginType = UIModel.getInstance().configRequest.loginType;
    var origDgId = UIModel.getInstance().configRequest.dialGroupId;
    var newDgId = notification.ui_notification.dial_group_id['#text'] || "";

    // Calculate type of login - called from AdminUI when assigning agent to new dial group.
    // Only options should be BLENDED or OUTBOUND here.
    if(newDgId && newDgId !== "" && (origLoginType === "INBOUND" || origLoginType === "BLENDED") ){
        UIModel.getInstance().configRequest.loginType = "BLENDED";
    }else if (newDgId && newDgId !== ""){
        UIModel.getInstance().configRequest.loginType = "OUTBOUND";
    }else if (origLoginType  === "INBOUND"){
        UIModel.getInstance().configRequest.loginType = "INBOUND";
    }else{
        UIModel.getInstance().configRequest.loginType = "NO-SELECTION";
    }

    UIModel.getInstance().configRequest.dialGroupId = newDgId;

    var formattedResponse = {
        message: "Dial Group Updated Successfully.",
        detail: "Dial Group changed from [" + origDgId + "] to [" + newDgId + "].",
        dialGroupId: notification.ui_notification.dial_group_id['#text'],
        dialGroupName: notification.ui_notification.dialGroupName['#text'], // camel case from server for some reason :/
        dialGroupDesc: notification.ui_notification.dial_group_desc['#text'],
        agentId: notification.ui_notification.agent_id['#text']
    };

    return formattedResponse;
};
