
var GenericNotification = function() {

};

/*
 * This class is responsible for handling a generic notification
 *
 * {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016080317400400011",
 *          "@response_to":"1c2fe39f-a31e-aff8-8d23-92a61c88270f",
 *          "@type":"GENERIC",
 *          "message_code":{"#text":"0"},
 *          "message":{"#text":"OK"},
 *          "detail":{"#text":"Pending Callback Successfully Cancelled."}
 *      }
 * }
 */
GenericNotification.prototype.processResponse = function(notification) {
    var formattedResponse = utils.buildDefaultResponse(notification);

    // add message and detail if present
    formattedResponse.messageCode = utils.getText(notification.ui_notification,"message_code");

    return formattedResponse;
};
