
var LoginRequest = function(username, password, isCaseSensitive) {
    this.username = username;
    this.password = password;
    this.isCaseSensitive = isCaseSensitive || false;
};

LoginRequest.prototype.formatJSON = function() {
    var msg = {
        "ui_request": {
            "@destination":"IS",
            "@type":MESSAGE_TYPES.LOGIN,
            "@message_id":utils.getMessageId(),
            "response_to":"",
            "username":{
                "#text":this.username
            },
            "password":{
                "#text":this.password
            },
            "is_case_sensitive":{
                "#text":utils.toString(this.isCaseSensitive === true ? "TRUE" : "FALSE")
            }
        }
    };

    return JSON.stringify(msg);
};


/*
 * This function is responsible for handling the login packet received from IntelliServices. It will save
 * a copy of it in the UIModel as loginPacket, as well as set the isLoggedInIS variable to
 * true (for reconnect purposes) and the loginDTS with the current date/time.
 *
 * {"ui_response":{
 *      "@type":"login",
 *      "status":{"#text":"OK"},
 *      "agent_id":{"#text":"1810"},
 *      "agent_pwd":{"#text":"bound25"},
 *      "first_name":{"#text":"mandy"},
 *      "last_name":{"#text":"pants"},
 *      "email":{"#text":"mandypants@aol.coim"},
 *      "agent_type":{"#text":"AGENT"},
 *      "external_agent_id":{"#text":"blahblah"},
 *      "default_login_dest":{"#text":"9548298548|123"},
 *      "alt_default_login_dest":{"#text":"9548298548|123"},
 *      "iq_url":{"#text":"dev.connectfirst.com"},
 *      "iq_port":{"#text":"1313"},
 *      "iq_ssl_port":{"#text":"1213"},
 *      "iq_secret_key":{"#text":"F-OFF"},
 *      "allow_inbound":{"#text":"1"},
 *      "allow_outbound":{"#text":"1"},
 *      "allow_chat":{"#text":"1"},
 *      "allow_blended":{"#text":"0"},
 *      "allow_off_hook":{"#text":"1"},
 *      "allow_call_control":{"#text":"1"},
 *      "allow_login_control":{"#text":"1"},
 *      "allow_login_updates":{"#text":"1"},
 *      "allow_lead_inserts":{"#text":"1"},
 *      "show_lead_history":{"#text":"1"},
 *      "allow_cross_gate_requeue":{"#text":"1"},
 *      "phone_login_dial_group":{"#text":"44"},
 *      "phone_login_pin":{"#text":"1234"},
 *      "allow_manual_calls":{"#text":"1"},
 *      "allow_manual_intl_calls":{"#text":"0"},
 *      "init_login_state":{"#text":"ON-BREAK"},
 *      "init_login_state_label":{"#text":"Morning Break"},
 *      "outbound_prepay":{"#text":"0"},
 *      "max_break_time":{"#text":"-1"},
 *      "max_lunch_time":{"#text":"-1"},
 *      "allow_lead_search":{"#text":"YES_ALL"},
 *      "tcpa_safe_mode":{"#text":"1|0"},
 *      "pci_enabled":{"#text":"1|0"},
 *      "login_gates":{
 *          "gate":[
 *              {"@default_dest_override":"","@gate_desc":"","@gate_id":"37","@gate_name":"test"},
 *              {"@default_dest_override":"","@gate_desc":"","@gate_id":"42","@gate_name":"test gate two"},
 *              {"@default_dest_override":"","@gate_desc":"","@gate_id":"43","@gate_name":"test gate three"},
 *              {"@default_dest_override":"","@gate_desc":"Amandas Other Gate","@gate_id":"46","@gate_name":"You know it!"}
 *          ]
 *      },
 *      "login_chat_queues":{
 *          "chat_queue":[
 *              {"@chat_queue_description":"","@chat_queue_id":"","@chat_queue_name":""},
 *              {"@chat_queue_description":"","@chat_queue_id":"","@chat_queue_name":""}
 *          ]
 *      },
 *      "outdial_groups":{
 *          "group":[
 *              {"@billing_key":"","@dial_group_desc":"","@dial_group_id":"44","@dial_group_name":"Geoff Dial Test","@dial_mode":"PREDICTIVE"},
 *              {"@billing_key":"2","@dial_group_desc":"AutoDial Configured Dial Group","@dial_group_id":"46","@dial_group_name":"Phone Only test5","@dial_mode":"PREDICTIVE"},
 *              {"@billing_key":"","@dial_group_desc":"Test","@dial_group_id":"200000","@dial_group_name":"Test","@dial_mode":"PREDICTIVE"},
 *              {"@billing_key":"","@dial_group_desc":"Test","@dial_group_id":"200010","@dial_group_name":"Carissa's Test Group","@dial_mode":"PREDICTIVE"}
 *          ]
 *      },"skill_profiles":{
 *          "profile":[
 *              {"@profile_desc":"","@profile_id":"571","@profile_name":"skill1"},
 *              {"@profile_desc":"","@profile_id":"572","@profile_name":"skill2"}
 *          ]
 *      },
 *      "requeue_gates":{
 *          "gate_group":[
 *              {
 *                  "@gate_group_id":"18",
 *                  "@group_name":"new gate group",
 *                  "gates":{
 *                      "gate":[
 *                          {"@gate_desc":"","@gate_id":"37","@gate_name":"test"},
 *                          {"@gate_desc":"","@gate_id":"43","@gate_name":"test gate three"},
 *                          {"@gate_desc":"","@gate_id":"42","@gate_name":"test gate two"}
 *                      ]
 *                  },
 *                  "skills":{
 *                      "skill":[
 *                          {"@skill_desc":"","@skill_id":"58","@skill_name":"one"},
 *                          {"@skill_desc":"","@skill_id":"59","@skill_name":"two"},
 *                      ]
 *                  }
 *              }
 *          ]
 *      },
 *      "chat_rooms":{},
 *      "scripts": {
 *           "script": {
 *               "@script_id": "15",
 *               "@script_name": "Don't Read This Script"
 *           }
 *      },
 *      "campaigns": {
 *          "campaign": {
 *              "@allow_lead_updates": "",
 *              "@campaign_id": "",
 *              "@campaign_name": "",
 *              "@survey_id": "",
 *              "@survey_name": "",
 *              "custom_labels": {
 *                  "@aux_1_label": "",
 *                  "@aux_2_label": "",
 *                  "@aux_3_label": "",
 *                  "@aux_4_label": "",
 *                  "@aux_5_label": ""
 *              },
 *              "generic_key_value_pairs": {}
 *          }
 *      },
 *      "account_countries":{
 *          "country":[
 *              {"@country_id":"BRA"},{"@country_id":"FRA"},{"@country_id":"GER"}
 *          ]
 *      }
 *   }
 * }
 */
LoginRequest.prototype.processResponse = function(response) {
    var resp = response.ui_response;
    var status = resp.status['#text'];
    var model = UIModel.getInstance();
    var formattedResponse = utils.buildDefaultResponse(response);

    if(status === 'OK'){
        if(!model.isLoggedInIS){
            // save login packet properties to UIModel
            model.loginPacket = response;
            model.applicationSettings.isLoggedInIS = true;
            model.applicationSettings.isTcpaSafeMode = utils.getText(resp, 'tcpa_safe_mode') === "1";
            model.applicationSettings.pciEnabled = utils.getText(resp, 'pci_enabled') === "1";
            model.chatSettings.alias = utils.getText(resp, 'first_name') + " " + utils.getText(resp, 'last_name');

            model.agentSettings.loginDTS = new Date();
            model.agentSettings.maxBreakTime = utils.getText(resp, 'max_break_time');
            model.agentSettings.maxLunchTime = utils.getText(resp, 'max_lunch_time');
            model.agentSettings.firstName = utils.getText(resp, 'first_name');
            model.agentSettings.lastName = utils.getText(resp, 'last_name');
            model.agentSettings.email = utils.getText(resp, 'email');
            model.agentSettings.agentId = utils.getText(resp, 'agent_id');
            model.agentSettings.externalAgentId = utils.getText(resp, 'external_agent_id');
            model.agentSettings.agentType = utils.getText(resp, 'agent_type');
            model.agentSettings.realAgentType = utils.getText(resp, 'real_agent_type');
            model.agentSettings.defaultLoginDest = utils.getText(resp, 'default_login_dest');
            model.agentSettings.altDefaultLoginDest = utils.getText(resp, 'alt_default_login_dest');
            model.agentSettings.initLoginState = utils.getText(resp, 'init_login_state');
            model.agentSettings.initLoginStateLabel = utils.getText(resp, 'init_login_state_label');
            model.agentSettings.outboundManualDefaultRingtime = utils.getText(resp, 'outbound_manual_default_ringtime');
            model.agentSettings.isOutboundPrepay = utils.getText(resp, 'outbound_prepay') === "1";
            model.agentSettings.phoneLoginPin = utils.getText(resp, 'phone_login_pin');
            model.agentSettings.username = model.loginRequest.username;

            model.agentPermissions.allowCallControl = utils.getText(resp, 'allow_call_control') === "1";
            model.agentPermissions.allowChat = utils.getText(resp, 'allow_chat') === "1";
            model.agentPermissions.showLeadHistory = utils.getText(resp, 'show_lead_history') === "1";
            model.agentPermissions.allowManualOutboundGates = utils.getText(resp, 'allow_manual_outbound_gates') === "1";
            model.agentPermissions.allowOffHook = utils.getText(resp, 'allow_off_hook') === "1";
            model.agentPermissions.allowManualCalls = utils.getText(resp, 'allow_manual_calls') === "1";
            model.agentPermissions.allowManualPass = utils.getText(resp, 'allow_manual_pass') === "1";
            model.agentPermissions.allowManualIntlCalls = utils.getText(resp, 'allow_manual_intl_calls') === "1";
            model.agentPermissions.allowLoginUpdates = utils.getText(resp, 'allow_login_updates') === "1";
            model.agentPermissions.allowInbound = utils.getText(resp, 'allow_inbound') === "1";
            model.agentPermissions.allowOutbound = utils.getText(resp, 'allow_outbound') === "1";
            model.agentPermissions.allowBlended = utils.getText(resp, 'allow_blended') === "1";
            model.agentPermissions.allowLoginControl = utils.getText(resp, 'allow_login_control') === "1";
            model.agentPermissions.allowCrossQueueRequeue = utils.getText(resp, 'allow_cross_gate_requeue') === "1";
            model.agentPermissions.disableSupervisorMonitoring = utils.getText(resp, 'disable_supervisor_monitoring') === "1";
            model.agentPermissions.allowAutoAnswer = utils.getText(resp, 'allow_auto_answer') === "1";
            model.agentPermissions.enableAutoAnswer = utils.getText(resp, 'enable_auto_answer') === "1";
            model.agentPermissions.allowHistoricalDialing = utils.getText(resp, 'allow_historical_dialing') === "1";

            model.outboundSettings.defaultDialGroup = utils.getText(resp, 'phone_login_dial_group');

            if(response.ui_response.allow_lead_inserts && typeof resp.insert_campaigns !== 'undefined' && response.ui_response.insert_campaigns.campaign){
                model.agentPermissions.allowLeadInserts = utils.getText(resp, 'allow_lead_inserts') === "1";
            }

            // Set collection values
            model.outboundSettings.availableCampaigns = _processCampaigns(response);
            model.chatSettings.availableChatQueues = utils.processResponseCollection(response.ui_response, "login_chat_queues", "chat_queue");
            processChatQueueDnis(model.chatSettings, response);
            model.chatSettings.availableChatRequeueQueues = utils.processResponseCollection(response.ui_response, "chat_requeue_queues", "chat_group");
            model.inboundSettings.availableQueues = utils.processResponseCollection(response.ui_response, "login_gates", "gate");
            model.inboundSettings.availableSkillProfiles = utils.processResponseCollection(response.ui_response, "skill_profiles", "profile");
            model.inboundSettings.availableRequeueQueues = utils.processResponseCollection(response.ui_response, "requeue_gates", "gate_group");
            model.chatSettings.availableChatRooms = utils.processResponseCollection(response.ui_response, "chat_rooms", "room");
            model.scriptSettings.availableScripts = utils.processResponseCollection(response.ui_response, "scripts", "script");
            model.agentSettings.callerIds = utils.processResponseCollection(response.ui_response, "caller_ids", "caller_id");
            model.agentSettings.availableAgentStates = utils.processResponseCollection(response.ui_response, "agent_states", "agent_state");
            model.applicationSettings.availableCountries = utils.processResponseCollection(response.ui_response, "account_countries", "country");
            model.outboundSettings.insertCampaigns = utils.processResponseCollection(response.ui_response, "insert_campaigns", "campaign");

            var dialGroups = utils.processResponseCollection(response.ui_response, "outdial_groups", "group");
            // set boolean values
            for(var dg = 0; dg < dialGroups.length; dg++){
                var group = dialGroups[dg];
                group.allowLeadSearch = group.allowLeadSearch === "YES";
                group.allowPreviewLeadFilters = group.allowPreviewLeadFilters === "1";
                group.progressiveEnabled = group.progressiveEnabled === "1";
                group.requireFetchedLeadsCalled = group.requireFetchedLeadsCalled === "1";
                group.hciType = parseInt(group.hciEnabled) || 0;
                group.hciEnabled = group.hciEnabled === "1" || group.hciEnabled === "2";
                group.hciClicker = group.hciClicker === "1";
            }
            model.outboundSettings.availableOutdialGroups = dialGroups;
        }

        formattedResponse.agentSettings = model.agentSettings;
        formattedResponse.agentPermissions = model.agentPermissions;
        formattedResponse.applicationSettings = model.applicationSettings;
        formattedResponse.chatSettings = model.chatSettings;
        formattedResponse.connectionSettings = model.connectionSettings;
        formattedResponse.inboundSettings = model.inboundSettings;
        formattedResponse.outboundSettings = model.outboundSettings;
        formattedResponse.scriptSettings = model.scriptSettings;

    }else if(status === 'RESTRICTED'){
        formattedResponse.message = "Invalid IP Address";
        utils.logMessage(LOG_LEVELS.WARN, formattedResponse.message, response);
    }else{
        formattedResponse.message = "Invalid Username or password";
        utils.logMessage(LOG_LEVELS.WARN, formattedResponse.message, response);
    }

    return formattedResponse;
};


function _processCampaigns(response){
    var campaigns = [];
    var campaignsRaw = null;

    if(typeof response.ui_response.campaigns.campaign !== 'undefined'){
        campaignsRaw = response.ui_response.campaigns.campaign;
    }

    if(campaignsRaw){
        if(!Array.isArray(campaignsRaw)) {
            campaignsRaw = [campaignsRaw];
        }

        for(var c = 0; c < campaignsRaw.length; c++){
            campaigns.push(_processCampaign(campaignsRaw[c]));
        }
    }

    return campaigns;
}


function _processCampaign(campaignRaw) {
    // single campaign object
    var campaignId = campaignRaw['@campaign_id'];
    var allowLeadUpdates = campaignRaw['@allow_lead_updates']; // 0 = no update, 1 = allow phone update, 2 = don't allow phone update
    UIModel.getInstance().agentPermissions.allowLeadUpdatesByCampaign[campaignId] = allowLeadUpdates;

    var customLabels = campaignRaw['custom_labels'];
    var labelArray = [];

    for (var p in customLabels) {
        var label = p.replace(/@/, ''); // remove leading '@'
        var obj = {};
        obj[label] = customLabels[p];

        labelArray.push(obj);
    }

    return {
        campaignId: campaignId,
        campaignName: campaignRaw['@campaign_name'],
        surveyId: campaignRaw['@survey_id'],
        surveyName: campaignRaw['@survey_name'],
        customLabels: labelArray,
        allowLeadUpdates: allowLeadUpdates
    };
}


/**
 * example packet
 *  {
 *      "chat_queue":[
 *          {
 *              "@chat_queue_desc":"",
 *              "@chat_queue_id":"74",
 *              "@chat_queue_name":"Please don't delete"
 *          },
 *          {
 *              "@chat_queue_desc":"blah",
 *              "@chat_queue_id":"131",
 *              "@chat_queue_name":"cris chat queue",
 *              "dnis":[
 *                  {"#text":"5555551215"},
 *                  {"#text":"5555554444"},
 *                  {"#text":"8885551212"},
 *                  {"#text":"97687"}
 *              ]
 *          }
 *      ]
 *   }
 *
 *
 *      This function will format the dnis list and put them back on chatSettings.availableChatQueues
 **/
function processChatQueueDnis(chatSettings, response) {
    var queues = chatSettings.availableChatQueues;
    var rawQueues = response.ui_response.login_chat_queues.chat_queue;

    if(!Array.isArray(rawQueues)) {
        rawQueues = [rawQueues];
    }

    for(var i = 0; i < queues.length; i++) {
        var queue = queues[i];

        var rawQueue = {};
        for (var j = 0; j < rawQueues.length; j++) {
            var rq = rawQueues[j];
            if(rq['@chat_queue_id'] === queue.chatQueueId) {
                rawQueue = rq;
                break;
            }
        }

        if(rawQueue.dnis) {
            if(!Array.isArray(rawQueue.dnis)) {
                rawQueue.dnis = [rawQueue.dnis];
            }

            // update the dnis array to just be a list
            queue.dnis = rawQueue.dnis.map(function(d) {
                return d['#text'];
            });
        }
    }

}
