
var ChatAliasRequest = function(alias) {
    this.alias = alias;
};

/*
 * This class is responsible for creating the request to change chat alias
 * packet and sending it to intelliservices.
 * {"ui_request":{
 *      "@destination":"IQ",
 *      "@message_id":"UI200809291036128",
 *      "@response_to":"",
 *      "@type":"CHAT-ALIAS",
 *      "alias":{"#text":""}
 *    }
 * }
 */
ChatAliasRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IS",
            "@type":MESSAGE_TYPES.CHAT_ALIAS,
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "alias":{
                "#text":utils.toString(this.alias)
            }
        }
    };

    return JSON.stringify(msg);
};
