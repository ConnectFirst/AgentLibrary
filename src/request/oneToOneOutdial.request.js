
var OneToOneOutdialRequest = function(destination, ringTime, callerId, countryId, gateId) {
    this.destination = destination;
    this.ringTime = ringTime || "60";
    this.callerId = callerId;
    this.countryId = countryId || "USA";
    this.gateId = gateId || "";
};

OneToOneOutdialRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.ONE_TO_ONE_OUTDIAL,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "destination":{
                "#text":utils.toString(this.destination)
            },
            "ring_time":{
                "#text":utils.toString(this.ringTime)
            },
            "caller_id":{
                "#text":utils.toString(this.callerId)
            },
            "country_id":{
                "#text":utils.toString(this.countryId)
            },
            "gate_id":{
                "#text":utils.toString(this.gateId)
            }
        }
    };

    return JSON.stringify(msg);
};


