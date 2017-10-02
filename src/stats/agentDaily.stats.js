
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
    var model = UIModel.getInstance().agentDailyStats;
    var resp = stats.ui_stats;

    model.agentId = utils.getText(resp, "agent_id");
    model.totalLoginSessions = utils.getText(resp, "total_login_sessions");
    model.totalChatsHandled = utils.getText(resp, "total_chats_handled");
    model.totalCallsHandled = utils.getText(resp, "total_calls_handled");
    model.totalPreviewDials = utils.getText(resp, "total_preview_dials");
    model.totalManualDials = utils.getText(resp, "total_manual_dials");
    model.totalRna = utils.getText(resp, "total_rna");
    model.totalSuccessDispositions = utils.getText(resp, "total_success_dispositions");

    if(!model.totalTalkTime) {
        // init daily stats to first stats packet if they don't exist
        model.totalLoginTime = utils.getText(resp, "total_login_time");
        model.totalOffhookTime = utils.getText(resp, "total_offhook_time");
        model.totalTalkTime = utils.getText(resp, "total_talk_time");
        model.currCallTime = "0";
    }

    return model;
};
