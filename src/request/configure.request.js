
var ConfigRequest = function(dialDest, queueIds, chatIds, skillPofileId, dialGroupId, updateFromAdminUI) {
    this.queueIds = queueIds || [];
    this.chatIds = chatIds || [];
    this.skillPofileId = skillPofileId || "";
    this.dialGroupId = dialGroupId || "";
    this.dialDest = dialDest || "";
    this.updateFromAdminUI = updateFromAdminUI || false;
    this.loginType = "NO-SELECTION";
    this.updateLogin = false;

    // Remove any ids agent doesn't have access to
    var model = UIModel.getInstance();
    this.queueIds = utils.checkExistingIds(model.inboundSettings.availableQueues, this.queueIds, "gateId");
    this.chatIds = utils.checkExistingIds(model.chatSettings.availableChatQueues, this.chatIds, "chatQueueId");
    this.skillPofileId = utils.checkExistingIds(model.inboundSettings.availableSkillProfiles, [this.skillPofileId], "profileId")[0] || "";
    this.dialGroupId = utils.checkExistingIds(model.outboundSettings.availableOutdialGroups, [this.dialGroupId], "dialGroupId")[0] || "";

    // Set loginType value
    if(this.queueIds.length > 0 && this.dialGroupId !== ""){
        this.loginType = "BLENDED";
    }else if(this.queueIds.length > 0){
        this.loginType = "INBOUND";
    }else if(this.dialGroupId !== ""){
        this.loginType = "OUTBOUND";
    }else {
        this.loginType = "NO-SELECTION";
    }

    // set updateLogin value
    if(model.agentSettings.isLoggedIn){
        this.updateLogin = true;
    }

    // validate dialDest is sip or 10-digit num
    if(!utils.validateDest(this.dialDest)){
        utils.logMessage(LOG_LEVELS.WARN, "dialDest [" + this.dialDest + "] must be a valid sip or 10-digit DID", "");
    }

};

ConfigRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request":{
            "@destination":"IQ",
            "@type":MESSAGE_TYPES.LOGIN,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "agent_id":{
                "#text":utils.toString(UIModel.getInstance().agentSettings.agentId)
            },
            "agent_pwd":{
                "#text": UIModel.getInstance().loginRequest.password
            },
            "dial_dest":{
                "#text":utils.toString(this.dialDest)
            },
            "login_type":{
                "#text":this.loginType
            },
            "update_login":{
                "#text":utils.toString(this.updateLogin)
            },
            "outdial_group_id":{
                "#text":utils.toString(this.dialGroupId)
            },
            "skill_profile_id":{
                "#text":utils.toString(this.skillPofileId)
            },
            "update_from_adminui":{
                "#text":utils.toString(this.updateFromAdminUI)
            }
        }
    };

    // add arrays
    var queueIds = [];
    for(var i = 0; i < this.queueIds.length; i++){
        if(this.queueIds[i] !== ""){
            queueIds.push( { "#text": utils.toString(this.queueIds[i]) } );
        }
    }
    if(queueIds.length > 0){
        msg.ui_request.gates = { "gate_id" : queueIds };
    }else{
        msg.ui_request.gates = {};
    }

    var chatIds = [];
    for(var i = 0; i < this.chatIds.length; i++){
        if(this.chatIds[i] !== "") {
            chatIds.push( {"#text": utils.toString(this.chatIds[i]) } );
        }
    }
    if(chatIds.length > 0) {
        msg.ui_request.chat_queues = {"chat_queue_id": chatIds};
    }else{
        msg.ui_request.chat_queues = {};
    }

    return JSON.stringify(msg);
};


/*
 * This function is responsible for handling the response to Login from IntelliQueue.
 *
 * {"ui_response":{
 *      "@message_id":"IQ10012016082513212000447",
 *      "@response_to":"IQ201608251121200",
 *      "@type":"LOGIN",
 *      "agent_id":{"#text":"1"},
 *      "status":{"#text":"SUCCESS"},
 *      "message":{"#text":"Hello Geoffrey Mina!"},
 *      "detail":{"#text":"Logon request processed successfully!"},
 *      "hash_code":{"#text":"404946966"},
 *      "login_type":{"#text":"BLENDED"},
 *      "outdial_group_id":{"#text":"50692"},
 *      "skill_profile_id":{"#text":"1513"},
 *      "gates":{
 *          "gate_id":[
 *              {"#text":"11116"},
 *              {"#text":"11117"}
 *          ]
 *      },
 *      "chat_queues":{
 *          "chat_queue_id":{"#text":"30"}
 *      }
 *    }
 * }
 */
ConfigRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var status = utils.getText(resp, "status");
    var detail = utils.getText(resp, "detail");
    var model = UIModel.getInstance();
    var message = "";
    var formattedResponse = utils.buildDefaultResponse(response);

    if(detail === "Logon Session Configuration Updated!"){
        // this is an update login packet
        model.agentSettings.updateLoginMode = true;

        message = "Logon Session Configuration Updated!";
        utils.logMessage(LOG_LEVELS.INFO, message, response);
    }

    if(status === "SUCCESS"){
        if(!model.agentSettings.isLoggedIn){
            // fresh login, set UI Model properties
            model.configPacket = response;
            model.connectionSettings.hashCode = utils.getText(resp, "hash_code");
            model.agentSettings.isLoggedIn = true;
            model.agentSettings.loginDTS = new Date();
            model.connectionSettings.reconnect = true;
            model.agentPermissions.allowLeadSearch = false;
            model.agentSettings.dialDest = model.configRequest.dialDest; // not sent in response
            model.agentSettings.loginType = utils.getText(resp, "login_type");
            model.agentSettings.guid = utils.getText(resp,"guid");
            model.agentSettings.accountId = utils.getText(resp,"account_id");

            // Set collection values
            setDialGroupSettings(response);
            setGateSettings(response);
            setChatQueueSettings(response);
            setSkillProfileSettings(response);

        }else{
            if(model.agentSettings.updateLoginMode){
                model.agentSettings.dialDest = model.configRequest.dialDest;
                model.agentSettings.loginType = utils.getText(resp, "login_type");
                model.agentSettings.guid = utils.getText(resp,"guid");
                model.agentSettings.accountId = utils.getText(resp,"account_id");

                // This was an update login request
                model.agentSettings.updateLoginMode = false;

                // reset to false before updating dial group settings
                model.agentPermissions.allowLeadSearch = false;
                model.agentPermissions.requireFetchedLeadsCalled = false;
                model.agentPermissions.allowPreviewLeadFilters = false;

                // Set collection values
                setDialGroupSettings(response);
                setGateSettings(response);
                setChatQueueSettings(response);
                setSkillProfileSettings(response);

            }else{
                // this was a reconnect
                message = "Processed a Layer 2 Reconnect Successfully";
                utils.logMessage(LOG_LEVELS.INFO, message, response);
            }
        }

        formattedResponse.agentSettings = model.agentSettings;
        formattedResponse.agentPermissions = model.agentPermissions;
        formattedResponse.applicationSettings = model.applicationSettings;
        formattedResponse.chatSettings = model.chatSettings;
        formattedResponse.connectionSettings = model.connectionSettings;
        formattedResponse.inboundSettings = model.inboundSettings;
        formattedResponse.outboundSettings = model.outboundSettings;
        formattedResponse.scriptSettings = model.scriptSettings;
    }else{
        // Login failed
        if(formattedResponse.message === ""){
            formattedResponse.message = "Agent configuration attempt failed (2nd layer login)"
        }
        utils.logMessage(LOG_LEVELS.WARN, formattedResponse.message, response);
    }

    return formattedResponse;
};

function setDialGroupSettings(response){
    var model = UIModel.getInstance();
    var outdialGroups = model.outboundSettings.availableOutdialGroups;
    for(var g = 0; g < outdialGroups.length; g++){
        var group = outdialGroups[g];
        if(group.dialGroupId === response.ui_response.outdial_group_id['#text']){
            model.agentPermissions.allowLeadSearch = group.allowLeadSearch;
            model.agentPermissions.allowPreviewLeadFilters = group.allowPreviewLeadFilters;
            model.agentPermissions.progressiveEnabled = group.progressiveEnabled;
            model.outboundSettings.outdialGroup = JSON.parse(JSON.stringify(group)); // copy object

            // Only used for Preview or TCPA Safe accounts.
            // If set to true, only allow fetching new leads when current leads are called or expired
            model.agentPermissions.requireFetchedLeadsCalled = group.requireFetchedLeadsCalled;
        }
    }
}

function setSkillProfileSettings(response){
    var model = UIModel.getInstance();
    var skillProfiles = model.inboundSettings.availableSkillProfiles;
    for(var s = 0; s < skillProfiles.length; s++){
        var profile = skillProfiles[s];
        if(profile.skillProfileId === response.ui_response.skill_profile_id){
            model.inboundSettings.skillProfile = JSON.parse(JSON.stringify(profile)); // copy object
        }
    }
}

function setGateSettings(response){
    var model = UIModel.getInstance();
    var gates = model.inboundSettings.availableQueues;
    var selectedGateIds = [];
    var selectedGates = [];
    var gateIds = response.ui_response.gates.gate_id;

    if(gateIds){
        if(Array.isArray(gateIds)){ // multiple gates assigned
            for(var s = 0; s < gateIds.length; s++){
                var obj = gateIds[s];
                selectedGateIds.push(obj["#text"]);
            }
        }else{ // single gate assigned
            selectedGateIds.push(gateIds["#text"]);
        }
    }

    for(var gIdx = 0; gIdx < gates.length; gIdx++){
        var gate = gates[gIdx];
        if(selectedGateIds.indexOf(gate.gateId) > -1){
            selectedGates.push(gate);
        }
    }

    model.inboundSettings.queues = JSON.parse(JSON.stringify(selectedGates)); // copy array
}

function setChatQueueSettings(response){
    var model = UIModel.getInstance();
    var chatQueues = model.chatSettings.availableChatQueues;
    var selectedChatQueueIds = [];
    var selectedChatQueues = [];
    var chatQueueIds = response.ui_response.chat_queues.chat_queue_id;

    if(chatQueueIds){
        if(Array.isArray(chatQueueIds)){ // multiple chatQueues assigned
            for(var c = 0; c < chatQueueIds.length; c++){
                var obj = chatQueueIds[c];
                selectedChatQueueIds.push(obj["#text"]);
            }
        }else{ // single chat queue assigned
            selectedChatQueueIds.push(chatQueueIds["#text"]);
        }

    }

    for(var cIdx = 0; cIdx < chatQueues.length; cIdx++){
        var chatQueue = chatQueues[cIdx];
        if(selectedChatQueueIds.indexOf(chatQueue.chatQueueId) > -1){
            selectedChatQueues.push(chatQueue);
        }
    }

    model.chatSettings.chatQueues = JSON.parse(JSON.stringify(selectedChatQueues)); // copy array
}
