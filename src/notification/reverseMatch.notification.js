
var ReverseMatchNotification = function() {

};

/*
 * This class is responsible for processing a REVERSE_MATCH packet from IQ. It
 * will log the packet was rec'd, save the packet to the UIModel for use by
 * components like the WhosCallingForm
 * {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016080317400400011",
 *          "@response_to":"1c2fe39f-a31e-aff8-8d23-92a61c88270f",
 *          "@type":"REVERSE_MATCH",
 *          "first_name":{"#text":""},
 *          "mid_name":{"#text":""},
 *          "last_name":{"#text":""},
 *          "address1":{"#text":""},
 *          "address2":{"#text":""},
 *          "city":{"#text":""},
 *          "state":{"#text":""},
 *          "zip":{"#text":""},
 *          "business_name":{"#text":""}
 *      }
 * }
 */
ReverseMatchNotification.prototype.processResponse = function(notification) {
    var notif = notification.ui_notification;
    var model = UIModel.getInstance();

    model.tokens["first_name"] = utils.getText(notif,'first_name');
    model.tokens["mid_name"] = utils.getText(notif,'mid_name');
    model.tokens["last_name"] = utils.getText(notif,'last_name');
    model.tokens["address1"] = utils.getText(notif,'address1');
    model.tokens["address2"] = utils.getText(notif,'address2');
    model.tokens["suffix"] = utils.getText(notif,'suffix');
    model.tokens["title"] = utils.getText(notif,'title');
    model.tokens["city"] = utils.getText(notif,'city');
    model.tokens["state"] = utils.getText(notif,'state');
    model.tokens["zip"] = utils.getText(notif,'zip');
    model.tokens["business_name"] = utils.getText(notif,'business_name');

    return model.tokens;
};
