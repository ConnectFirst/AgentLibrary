var ChatAgentEndRequest = function(agentId, uii){
    this.uii = uii;
    this.agentId = agentId;
};

/*

External Chat :
when agent submits a chat end request, send "CHAT-AGENT-END" request to IntelliQueue

{
    "ui_request" : {
        "@destination" : "IQ",
        "@type" : MESSAGE_TYPES.CHAT_AGENT_END,
        "uii":{
            "#text":utils.toString(this.uii)
        },
        "agent_id":{
            "#text":utils.toString(this.agentId)
        }
    }
}

*/


ChatAgentEndRequest.prototype.formatJSON = function(){
    var msg = {
        "ui_request" : {
            "@destination" : "IQ",
            "@type" : MESSAGE_TYPES.CHAT_AGENT_END,
            "uii":{
                "#text":utils.toString(this.uii)
            },
            "agent_id":{
                "#text":utils.toString(this.agentId)
            }
        }
    };

    return JSON.stringify(msg);

};