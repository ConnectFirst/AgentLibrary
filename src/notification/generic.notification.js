
var GenericNotification = function() {

};

/*
 * This class is responsible for handling a generic notification
 *
 *  <ui_notification message_id="IQ10012016080317400400011"
 *      response_to="1c2fe39f-a31e-aff8-8d23-92a61c88270f" type="GENERIC">
 *      <message_code>0</message_code>
 *      <message>OK</message>
 *      <detail>Pending Callback Successfully Cancelled.</detail>
 *  </ui_notification>
 */
GenericNotification.prototype.processResponse = function(notification) {
    var formattedResponse = utils.buildDefaultResponse(notification);

    // add message and detail if present
    var msgCode = notification.ui_notification.message_code;
    var messageCode = "";
    if(msgCode){
        messageCode = msgCode['#text'] || "";
    }
    formattedResponse.messageCode = messageCode;

    return formattedResponse;
};
