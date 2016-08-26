
var GatesChangeNotification = function() {

};

/*
 * This class is responsible for handling a gates change notification
 *
 * {
 *      "ui_notification":{
 *          "@message_id":"IQ10012016080817344100936",
 *          "@type":"GATES_CHANGE",
 *          "agent_id":{"#text":"1180958"},
 *          "gate_ids":{"#text":"11117,3"}
 *      }
 * }
 */
GatesChangeNotification.prototype.processResponse = function(notification) {
    var model = UIModel.getInstance();
    var notif = notification.ui_notification;
    var newAssignedGates = [];
    var availableQueues = model.inboundSettings.availableQueues;
    var assignedGateIds = utils.getText(notif, "gate_ids");
    if(assignedGateIds !== ""){
        assignedGateIds = assignedGateIds.split(',');
    }

    for(var a = 0; a < assignedGateIds.length; a++){
        // find gate in avail list
        var id = assignedGateIds[a];
        var foundGate = utils.findObjById(availableQueues, id, "gateId");
        if(foundGate){
            newAssignedGates.push(foundGate);
        }else{
            // gate not in assigned list, add stub
            var gate = {
                gateId: id,
                gateName:"",
                gateDesc:"",
                defaultDestOverride:"",
                isAgentSelectable:false
            };
            newAssignedGates.push(gate);
        }
    }

    model.inboundSettings.queues = JSON.parse(JSON.stringify(newAssignedGates));

    var formattedResponse = {
        agentId: utils.getText(notif, "agent_id"),
        message: "Gates Change notification received.",
        queues: newAssignedGates
    };

    return formattedResponse;
};
