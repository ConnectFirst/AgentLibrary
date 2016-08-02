
var ConfigRequest = function(queueIds, chatIds, skillPofileId, outdialGroupId, dialDest) {
    this.queueIds = queueIds || [];
    this.chatIds = chatIds || [];
    this.skillPofileId = skillPofileId || "";
    this.outdialGroupId = outdialGroupId || "";
    this.dialDest = dialDest || "";

    this.updateFromAdminUI = false;
    this.loginType = "NO-SELECTION";
    this.updateLogin = false;

    // Remove any ids agent doesn't have access to
    this.queueIds = utils.checkExistingIds(UIModel.getInstance().inboundSettings.availableQueues, this.queueIds, "gateId");
    this.chatIds = utils.checkExistingIds(UIModel.getInstance().chatSettings.availableChatQueues, this.chatIds, "chatQueueId");
    this.skillPofileId = utils.checkExistingIds(UIModel.getInstance().inboundSettings.availableSkillProfiles, [this.skillPofileId], "profileId")[0] || "";
    this.outdialGroupId = utils.checkExistingIds(UIModel.getInstance().outboundSettings.availableOutdialGroups, [this.outdialGroupId], "dialGroupId")[0] || "";

    // Set loginType value
    if(this.queueIds.length > 0 && this.outdialGroupId !== ""){
        this.loginType = "BLENDED";
    }else if(this.queueIds.length > 0){
        this.loginType = "INBOUND";
    }else if(this.outdialGroupId !== ""){
        this.loginType = "OUTBOUND";
    }else {
        this.loginType = "NO-SELECTION";
    }

    // set updateLogin value
    if(UIModel.getInstance().isLoggedIn){
        this.updateLogin = true;
    }

    // validate dialDest is sip or 10-digit num
    if(!utils.validateDest(this.dialDest)){
        // TODO propagate this to the client
        console.error("AgentLibrary: dialDest must be a valid sip or 10-digit DID");
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
                "#text":UIModel.getInstance().agentSettings.agentId
            },
            "agent_pwd":{
                "#text": UIModel.getInstance().loginRequest.password
            },
            "dial_dest":{
                "#text":this.dialDest
            },
            "login_type":{
                "#text":this.loginType
            },
            "update_login":{
                "#text":this.updateLogin.toString()
            },
            "outdial_group_id":{
                "#text":this.outdialGroupId
            },
            "skill_profile_id":{
                "#text":this.skillPofileId
            },
            "update_from_adminui":{
                "#text":this.updateFromAdminUI.toString()
            }
        }
    };

    // add arrays
    var queueIds = [];
    for(var i = 0; i < this.queueIds.length; i++){
        if(this.queueIds[i] !== ""){
            queueIds.push(
                {  "#text": this.queueIds[i] }
            );
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
            chatIds.push( {"#text": this.chatIds[i]} );
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
 * <ui_response message_id="IQ982008100319095501435"  response_to="IQ200810319947384" type="LOGIN">
 * 		<agent_id>1810</agent_id>
 * 		<status>SUCCESS</status>
 * 		<message>Hello Geoff Mina!</message>
 * 		<detail>Logon request processed successfully!</detail>
 * 		<hash_code>117800988</hash_code>
 * 		<login_type>OUTBOUND</login_type>
 * 		<outdial_group_id>200018</outdial_group_id>
 * 		<gates/>
 * </ui_response>
 */
ConfigRequest.prototype.processResponse = function(response) {
    var status = response.ui_response.status['#text'];

    if(status === "SUCCESS"){
        if(!UIModel.getInstance().isLoggedIn){
            // fresh login, set UI Model properties
            UIModel.getInstance().configPacket = response;
            UIModel.getInstance().connectionSettings.hashCode = response.ui_response.hash_code['#text'];
            UIModel.getInstance().applicationSettings.message = response.ui_response.message['#text'];
            UIModel.getInstance().agentSettings.isLoggedIn = true;
            UIModel.getInstance().agentSettings.loginDTS = new Date();
            UIModel.getInstance().connectionSettings.reconnect = true;
            UIModel.getInstance().agentPermissions.allowLeadSearch = false;
            UIModel.getInstance().agentSettings.dialDest = UIModel.getInstance().configRequest.dialDest; // not sent in response
            UIModel.getInstance().agentSettings.loginType = response.ui_response.login_type['#text'];

            // Set collection values
            setDialGroupSettings(response);

            // For some strange reason IQ is not returning any collections other than outboundDialGroups
            // so for now, get the list of ids for the following collections from the request
            setGateSettings();
            setChatQueueSettings();
            setSkillProfileSettings();

        }else{
            if(UIModel.getInstance().agentSettings.updateLoginMode){
                // This was an update login request
                UIModel.getInstance().agentSettings.updateLoginMode = false;

                // update dial group settings
                UIModel.getInstance().agentPermissions.allowLeadSearch = false;
                UIModel.getInstance().agentPermissions.requireFetchedLeadsCalled = false;
                UIModel.getInstance().agentPermissions.allowPreviewLeadFilters = false;

                // Set collection values
                setDialGroupSettings(response);

                // For some strange reason IQ is not returning any collections other than outboundDialGroups
                // so for now, get the list of ids for the following collections from the request
                setGateSettings();
                setChatQueueSettings();
                setSkillProfileSettings();

            }else{
                // this was a reconnect
                console.log("AgentLibrary: Processed a Layer 2 Reconnect Successfully");
            }
        }
    }else{
        // Login failed
        console.warn("AgentLibrary: Layer 2 login failed!");
    }
};

function setDialGroupSettings(response){
    var outdialGroups = UIModel.getInstance().outboundSettings.availableOutdialGroups;
    for(var g = 0; g < outdialGroups.length; g++){
        var group = outdialGroups[g];
        if(group.dialGroupId === response.ui_response.outdial_group_id['#text']){
            UIModel.getInstance().agentPermissions.allowLeadSearch = group.allowLeadSearch;
            UIModel.getInstance().agentPermissions.allowPreviewLeadFilters = group.allowPreviewLeadFilters;
            UIModel.getInstance().outboundSettings.outdialGroup = JSON.parse(JSON.stringify(group)); // copy object

            // Only used for Preview or TCPA Safe accounts.
            // If set to true, only allow fetching new leads when current leads are called or expired
            UIModel.getInstance().agentPermissions.requireFetchedLeadsCalled = group.requireFetchedLeadsCalled;
        }
    }
}

function setGateSettings(){
    var gates = UIModel.getInstance().inboundSettings.availableQueues;
    var selectedGateIds = UIModel.getInstance().configRequest.queueIds;
    var selectedGates = [];

    for(var gIdx = 0; gIdx < gates.length; gIdx++){
        var gate = gates[gIdx];
        if(selectedGateIds.indexOf(gate.gateId) > -1){
            selectedGates.push(gate);
        }
    }

    UIModel.getInstance().inboundSettings.queues = JSON.parse(JSON.stringify(selectedGates)); // copy array
}

function setChatQueueSettings(){
    var chatQueues = UIModel.getInstance().chatSettings.availableChatQueues;
    var selectedChatQueueIds = UIModel.getInstance().configRequest.chatIds;
    var selectedChatQueues = [];

    for(var cIdx = 0; cIdx < chatQueues.length; cIdx++){
        var chatQueue = chatQueues[cIdx];
        if(selectedChatQueueIds.indexOf(chatQueue.chatQueueId) > -1){
            selectedChatQueues.push(chatQueue);
        }
    }

    UIModel.getInstance().chatSettings.chatQueues = JSON.parse(JSON.stringify(selectedChatQueues)); // copy array
}

function setSkillProfileSettings(){
    var skillProfiles = UIModel.getInstance().inboundSettings.availableSkillProfiles;
    for(var s = 0; s < skillProfiles.length; s++){
        var profile = skillProfiles[s];
        if(profile.skillProfileId === UIModel.getInstance().configRequest.skillProfileId){
            UIModel.getInstance().inboundSettings.skillProfile = JSON.parse(JSON.stringify(profile)); // copy object
        }
    }
}