
var StatsRequest = function() {
    
};

/*
 * { "ui_request": {
 *      "@response_to":"",
 *      "@message_id":"IS20160901142437535",
 *      "@type":"STATS"
 *    }
 * }
 */
StatsRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IS",
            "@type":MESSAGE_TYPES.STATS,
            "@message_id":utils.getMessageId(),
            "@response_to":""
        }
    };

    return JSON.stringify(msg);
};
