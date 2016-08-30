
var AgentDailyStats = function() {

};


/*
 * This class is responsible for handling an Agent Daily Stats packet rec'd from IntelliServices.
 * It will save a copy of it in the UIModel.
 *
 * {"ui_stats":{
 *      "@type":"AGENTDAILY",
 *      "agent_id":{"#text":"1180723"},
 *      "total_login_sessions":{"#text":"1"},
 *      "total_calls_handled":{"#text":"0"},
 *      "total_preview_dials":{"#text":"0"},
 *      "total_manual_dials":{"#text":"0"},
 *      "total_rna":{"#text":"0"},
 *      "total_talk_time":{"#text":"0"},
 *      "total_offhook_time":{"#text":"0"},
 *      "total_login_time":{"#text":"7808"},
 *      "total_success_dispositions":{"#text":"0"}
 *    }
 * }
 */
AgentDailyStats.prototype.processResponse = function(stats) {
    var resp = stats.ui_stats;
    var agentDailyStats = {
        agentId: utils.getText(resp, "agent_id"),
        totalLoginSessions: utils.getText(resp, "total_login_sessions"),
        totalCallsHandled: utils.getText(resp, "total_calls_handled"),
        totalPreviewDials: utils.getText(resp, "total_preview_dials"),
        totalManualDials: utils.getText(resp, "total_manual_dials"),
        totalRna: utils.getText(resp, "total_rna"),
        totalTalkTime: utils.getText(resp, "total_talk_time"),
        totalOffhookTime: utils.getText(resp, "total_offhook_time"),
        totalLoginTime: utils.getText(resp, "total_login_time"),
        totalSuccessDispositions: utils.getText(resp, "total_success_dispositions"),
        currCallTime: UIModel.getInstance().agentDailyStats.currCallTime
    };

    UIModel.getInstance().agentDailyStats = agentDailyStats;

    return agentDailyStats;
};
