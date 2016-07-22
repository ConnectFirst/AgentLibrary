
var ConfigRequest = function(props) {
    this.gateIds = props.gateIds || [];
    this.chatIds = props.chatIds || [];
    this.skillId = props.skillId || "";
    this.outdialGroupId = props.outdialGroupId || "";
    this.updateFromAdminUI = props.updateFromAdminUI || "";
    this.dialDest = props.dialDest;
    this.loginType = props.loginType;
};

ConfigRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request":{
            "@destination":"IQ",
            "@type":"LOGIN",
            "response_to":"",
            "agent_id":{
                "#text":"1"
            },
            "agent_pwd":{
                "#text":"gmina"
            },
            "dial_dest":{
                "#text":this.dialDest
            },
            "login_type":{
                "#text":this.loginType
            },
            "update_login":{
                "#text":"FALSE"
            },
            "outdial_group_id":{
                "#text":this.outdialGroupId
            },
            "skill_profile_id":{
                "#text":this.skillId
            },
            "update_from_adminui":{
                "#text":this.updateFromAdminUI
            },
            "public_ip":{
                "#text":this.ipAddress
            }
        }
    };

    // add arrays
    var gateIds = [];
    for(var i = 0; i < this.gateIds.length; i++){
        if(this.gateIds[i] !== ""){
            gateIds.push(
                {  "#text": props.gateIds[i] }
            );
        }
    }
    msg.ui_request.gates = { "gate_id" : gateIds };

    var chatIds = [];
    for(var i = 0; i < this.chatIds.length; i++){
        if(this.chatIds[i] !== "") {
            chatIds.push( {"#text": props.chatIds[i]} );
        }
    }
    msg.ui_request.chat_queues = { "chat_queue_id" : chatIds };
    msg.ui_request['@message_id'] = utils.getMessageId();

    return JSON.stringify(msg);
};
