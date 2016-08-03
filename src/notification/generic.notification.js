
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

    // add message and detail if present
    var msgCode = notification.ui_notification.message_code;
    var msg = notification.ui_notification.message;
    var det = notification.ui_notification.detail;
    var messageCode = "";
    var message = "";
    var detail = "";
    if(msg){
        message = msg['#text'] || "";
    }
    if(det){
        detail = det['#text'] || "";
    }
    if(msgCode){
        messageCode = msgCode['#text'] || "";
    }
    var formattedResponse = {
        messageCode: messageCode,
        message: message,
        detail: detail
    };

    return formattedResponse;
};
