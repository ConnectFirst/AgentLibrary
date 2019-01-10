
var AgentStats = function() {

};


/*
 * This class is responsible for handling an Agent Stats packet rec'd from IntelliServices.
 * It will save a copy of it in the UIModel. Could be a single agent or array of agents.
 *
  {"ui_stats":{
       "@type":"AGENT",
       "agent":{
           "@alt":"INBOUND",
           "@atype":"AGENT",
           "@avgtt":"00.0",
           "@calls":"0",
           "@da":"0",
           "@droute":"6789050673",
           "@f":"John",
           "@gdesc":"",
           "@gname":"",
           "@id":"1856",
           "@l":"Doe",
           "@ldur":"6",
           "@ltype":"INBOUND",
           "@oh":"0",
           "@pd":"0",
           "@pdt":"0",
           "@pres":"0",
           "@rna":"0",
           "@sdur":"6",
           "@sp":"",
           "@state":"AVAILABLE",
           "@ttt":"0",
           "@u":"jdoe",
           "@uii":"",
           "@util":"0.00",
           "@call_duration:0"
       }
     }
  }
 */
AgentStats.prototype.processResponse = function(stats) {
    var resp = stats.ui_stats.agent;
    var agentStats = [];

    if (!Array.isArray(resp)) {
        resp = [resp];
    }

    try {
        for (var i = 0; i < resp.length; i++) {
            agentStats.push({
                agentLoginType: resp[i]["@alt"],
                agentType: resp[i]["@atype"],
                avgTalkTime: resp[i]["@avgtt"],
                calls: resp[i]["@calls"],
                isDequeueAgent: resp[i]["@da"],
                defaultRoute: resp[i]["@droute"],
                firstName: resp[i]["@f"],
                queueDesc: resp[i]["@gdesc"],
                queueName: resp[i]["@gname"],
                agentId: resp[i]["@id"],
                lastName: resp[i]["@l"],
                loginDuration: resp[i]["@ldur"],
                loginType: resp[i]["@ltype"],
                offHook: resp[i]["@oh"],
                pendingDisp: resp[i]["@pd"],
                pendingDispTime: resp[i]["@pdt"],
                presented: resp[i]["@pres"],
                rna: resp[i]["@rna"],
                stateDuration: resp[i]["@sdur"],
                skillProfileName: resp[i]["@sp"],
                agentState: resp[i]["@state"],
                totalTalkTime: resp[i]["@ttt"],
                username: resp[i]["@u"],
                uii: resp[i]["@uii"],
                utilization: resp[i]["@util"],
                callDuration: resp[i]["@call_duration"]
            });
        }
    } catch(e) {

    }

    UIModel.getInstance().agentStats = agentStats;
    return agentStats;
};
