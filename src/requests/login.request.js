
var LoginRequest = function(props) {
    this.username = props.username;
    this.password = props.password;
};

LoginRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IS",
            "@type":"LOGIN",
            "username":{
                "#text":this.username
            },
            "password":{
                "#text":this.password
            }
        }
    };

    msg.ui_request['@message_id'] = utils.getMessageId();

    return JSON.stringify(msg);
};


LoginRequest.prototype.setResponse = function(response) {
    var status = response.ui_response.status['#text'];
    if(status === 'OK'){
        if(!UIModel.getInstance().isLoggedInIS){

            // set lead updates value
            var campaigns = response.ui_response.campaigns.campaign;
            for(var c = 0; c < campaigns.length; c++){
                var campaignId = campaigns[c]['@campaign_id'];
                var allowLeadUpdates = campaigns[c]['@allow_lead_updates'];
                UIModel.getInstance().allowLeadUpdatesByCampaign[campaignId] = allowLeadUpdates;
            }

            // save login packet properties to UIModel
            UIModel.getInstance().loginPacket = response;
            UIModel.getInstance().isLoggedInIS = true;
            UIModel.getInstance().loginDTS = new Date();
            UIModel.getInstance().alias = response.ui_response.first_name['#text'] + " " + response.ui_response.last_name['#text']
            UIModel.getInstance().maxBreakTime = response.ui_response.max_break_time['#text'];
            UIModel.getInstance().maxLunchTime = response.ui_response.max_lunch_time['#text'];

            var allowCallControl = typeof response.ui_response.allow_call_control == 'undefined' ? false : response.ui_response.allow_call_control['#text'];
            var allowChat = typeof response.ui_response.allow_chat == 'undefined' ? false : response.ui_response.allow_chat['#text'];
            var showLeadHistory = typeof response.ui_response.show_lead_history == 'undefined' ? false : response.ui_response.show_lead_history['#text'];
            var allowManualOutboundGates = typeof response.ui_response.allow_manual_outbound_gates == 'undefined' ? false : response.ui_response.allow_manual_outbound_gates['#text'];
            var tcpaSafeModeSet = typeof response.ui_response.tcpa_safe_mode == 'undefined' ? false : response.ui_response.tcpa_safe_mode['#text'];
            var allowLeadInserts = typeof response.ui_response.insert_campaigns == 'undefined' ? false : response.ui_response.insert_campaigns.campaign;

            if(allowCallControl){
                if(allowCallControl == "0"){
                    UIModel.getInstance().allowCallControl = false;
                }
            }
            if(allowChat){
                if(allowChat == "1"){
                    UIModel.getInstance().allowChat = true;
                }
            }
            if(showLeadHistory){
                if(showLeadHistory == "0"){
                    UIModel.getInstance().showLeadHistory = false;
                }
            }
            if(allowManualOutboundGates){
                if(allowManualOutboundGates == "1"){
                    UIModel.getInstance().allowManualOutboundGates = true;
                }
            }
            if(tcpaSafeModeSet){
                if(tcpaSafeModeSet == "1"){
                    UIModel.getInstance().tcpaSafeModeSet = true;
                }
            }
            if(allowLeadInserts){
                if(allowLeadInserts.length > 0){
                    UIModel.getInstance().allowLeadInserts = true;
                }
            }
            if(response.ui_response.allow_off_hook['#text'] == "0"){
                UIModel.getInstance().allowOffHook = false;
            }
            if(response.ui_response.allow_manual_calls['#text'] == "0"){
                UIModel.getInstance().allowManualCalls = false;
            }
            if(response.ui_response.allow_manual_pass['#text'] == "0"){
                UIModel.getInstance().allowManualPass = false;
            }
            if(response.ui_response.allow_manual_intl_calls['#text'] == "1"){
                UIModel.getInstance().allowManualIntlCalls = true;
            }
            if(response.ui_response.allow_login_updates['#text'] == "0"){
                UIModel.getInstance().AllowLoginUpdates = false;
            }

        }
    }else if(status === 'RESTRICTED'){
        // todo logger 'Invalid IP Address'
        console.log("AgentLibrary: Invalid IP Address");
    }else{
        // todo logger 'Invalid Username or password'
        console.log("AgentLibrary: Invalid Username or password");
    }
};

