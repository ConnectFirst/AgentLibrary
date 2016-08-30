
var AgentStats = function() {

};


/*
 * This class is responsible for handling an Agent Stats packet rec'd from IntelliServices.
 * It will save a copy of it in the UIModel.
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
           "@pres":"0",
           "@rna":"0",
           "@sdur":"6",
           "@sp":"",
           "@state":"AVAILABLE",
           "@ttt":"0",
           "@u":"jdoe",
           "@uii":"",
           "@util":"0.00"
       }
     }
  }
 */
AgentStats.prototype.processResponse = function(stats) {
    var resp = stats.ui_stats.agent;
    var agentStats = {
        agentLoginType: resp["@alt"],
        agentType: resp["@atype"],
        avgTalkTime:resp["@avgtt"],
        calls: resp["@calls"],
        isDequeueAgent: resp["@da"],
        defaultRoute: resp["@droute"],
        firstName: resp["@f"],
        queueDesc: resp["@gdesc"],
        queueName: resp["@gname"],
        agentId: resp["@id"],
        lastName: resp["@l"],
        loginDuration: resp["@ldur"],
        loginType: resp["@ltype"],
        offHook: resp["@oh"],
        pendingDisp: resp["@pd"],
        presented: resp["@pres"],
        rna: resp["@rna"],
        stateDuration: resp["@sdur"],
        skillProfileName: resp["@sp"],
        agentState: resp["@state"],
        totalTalkTime: resp["@ttt"],
        username: resp["@u"],
        uii: resp["@uii"],
        utilization: resp["@util"]
    };

    UIModel.getInstance().agentStats = agentStats;

    return agentStats;
};
