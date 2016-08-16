
var TcpaSafeRequest = function(action, searchFields, requestId) {
    this.agentId = UIModel.getInstance().agentSettings.agentId;
    this.searchFields = searchFields || [];
    this.requestId = requestId || "";
    this.action = action || "";
};

/*
 * searchFields = [
 *  {key: "name", value: "Danielle"},
 *  {key: "number", value: "5555555555"
 * ];
 */
TcpaSafeRequest.prototype.formatJSON = function() {
    var fields = {};
    for(var i =0; i < this.searchFields.length; i++){
        var fieldObj = this.searchFields[i];
        fields[fieldObj.key] = { "#text" : utils.toString(fieldObj.value) };
    }

    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.TCPA_SAFE,
            "@message_id":utils.getMessageId(),
            "@action":this.action,
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "pending_request_id":{
                "#text":utils.toString(this.requestId)
            },
            "search_fields": fields
                // { "name": {"#text": "Danielle"} }
        }
    };

    return JSON.stringify(msg);
};
