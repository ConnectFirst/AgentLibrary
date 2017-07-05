
var ChatQueueStats = function() {

};


/*
 * This class is responsible for handling an Chat Stats packet rec'd from IntelliServices.
 * It will save a copy of it in the UIModel.
 *
 *{
 *  "ui_stats": {
 *  "@type": "CHAT",
 *  "chatQueue": [
 *      {
 *          "@active": "1",
 *          "@available": "0",
 *          "@avgAbandon": "00.0",
 *          "@avgChatTime": "00.0",
 *          "@avgQueueTime": "00.0",
 *          "@chatQueueId": "1",
 *          "@chatQueueName": "testing chat quuee",
 *          "@deflected": "0",
 *          "@inQueue": "0",
 *          "@longestInQueue": "0",
 *          "@presented": "0",
 *          "@routing": "0",
 *          "@staffed": "0",
 *          "@totalAbandonTime": "0",
 *          "@totalAnswerTime": "0",
 *          "@totalChatTime": "0",
 *          "@totalQueueTime": "0",
 *          "@utilization": "00.0"
 *      },
 *      {
 *          "@active": "0",
 *          "@available": "0",
 *          "@avgAbandon": "00.0",
 *          "@avgChatTime": "00.0",
 *          "@avgQueueTime": "00.0",
 *          "@chatQueueId": "3",
 *          "@chatQueueName": "testing test",
 *          "@deflected": "0",
 *          "@inQueue": "0",
 *          "@longestInQueue": "0",
 *          "@presented": "0",
 *          "@routing": "0",
 *          "@staffed": "0",
 *          "@totalAbandonTime": "0",
 *          "@totalAnswerTime": "0",
 *          "@totalChatTime": "0",
 *          "@totalQueueTime": "0",
 *          "@utilization": "00.0"
 *      }
 *  ],
 *  "totals": {
 *      "routing": {"#text": "0"},
 *      "ttotalAnswerTime": {"#text": "0"},
 *      "inQueue": { "#text": "0"},
 *      "ttotalChatTime": {"#text": "0"},
 *      "ttotalAbandonTime": {"#text": "0"},
 *      "presented": {"#text": "0},
 *      "accepted": {"#text": "0"},
 *      "deflected": {"#text": "0"},
 *      "active": {"#text": "1"},
 *      "abandoned": {"#text": "0"},
 *      "ttotalQueueTime": {"#text": "0"}
 *   }
 *  }
 *}
 */
ChatQueueStats.prototype.processResponse = function(stats) {
    var resp = stats.ui_stats;
    var totals = utils.processResponseCollection(stats,"ui_stats","totals")[0];
    var chatQueues = utils.processResponseCollection(stats,"ui_stats","chatQueue");

    var chatQueueStats = {
        type:resp["@type"],
        chatQueues: chatQueues,
        totals:totals
    };

    UIModel.getInstance().chatQueueStats = chatQueueStats;

    return chatQueueStats;
};
