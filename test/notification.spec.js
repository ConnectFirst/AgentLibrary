
"use strict";

var socketMock;
var windowMock;
var address = 'ws://test.address';
var username = "testUser";
var password = "sp!phy";
var dialGroupId = "1";
var gateIds = ["1","2"];
var chatIds = ["1"];
var skillProfileId = "1";
var dialDest = "sip:99@boulder-voip.connectfirst.com";

describe( 'Tests for processing notification messages in Agent Library', function() {
    beforeEach(function() {
        fixture.setBase('mock');  // If base path is different from the default `spec/fixtures`
        this.ui_response_Login = fixture.load('ui_response.Login.json');
        this.ui_response_Configure = fixture.load('ui_response.Configure.json');

        this.processed_data_AgentSettings = fixture.load('processed_data.AgentSettings.json');
        this.processed_data_AgentPermissions = fixture.load('processed_data.AgentPermissions.json');
        this.processed_data_InboundSettings = fixture.load('processed_data.InboundSettings.json');
        this.processed_data_OutboundSettings = fixture.load('processed_data.OutboundSettings.json');
        this.processed_data_NewCall_Outbound = fixture.load('processed_data.NewCall.Outbound.json');
        this.processed_data_Lead = fixture.load('processed_data.Lead.json');

        this.ui_notification_DialGroupChange = fixture.load('ui_notification.DialGroupChange.json');
        this.ui_notification_GatesChange = fixture.load('ui_notification.GatesChange.json');
        this.ui_notification_EndCall = fixture.load('ui_notification.EndCall.json');
        this.ui_notification_Generic = fixture.load('ui_notification.Generic.json');
        this.ui_notification_NewCall = fixture.load('ui_notification.NewCall.json');
        this.ui_notification_AddSession = fixture.load('ui_notification.AddSession.json');
        this.ui_notification_DropSession = fixture.load('ui_notification.DropSession.json');
        this.ui_notification_EarlyUii = fixture.load('ui_notification.EarlyUii.json');

        var WebSocket = jasmine.createSpy();
        WebSocket.andCallFake(function (url) {
            socketMock = {
                url: url,
                readyState: WebSocket.CONNECTING,
                send: jasmine.createSpy(),
                close: jasmine.createSpy().andCallFake(function () {
                    socketMock.readyState = WebSocket.CLOSING;
                }),
                onopen: jasmine.createSpy('onopenCallback'),
                onmessage: jasmine.createSpy('onmessageCallback'),

                // methods to mock the internal behaviour of the real WebSocket
                _open: function () {
                    socketMock.readyState = WebSocket.OPEN;
                    socketMock.onopen && socketMock.onopen();
                },
                _message: function (msg) {
                    socketMock.onmessage && socketMock.onmessage(msg);
                },
                _error: function () {
                    socketMock.readyState = WebSocket.CLOSED;
                    socketMock.onerror && socketMock.onerror();
                },
                _close: function () {
                    socketMock.readyState = WebSocket.CLOSED;
                    socketMock.onclose && socketMock.onclose();
                }
            };
            return socketMock;
        });
        WebSocket.CONNECTING = 0;
        WebSocket.OPEN = 1;
        WebSocket.CLOSING = 2;
        WebSocket.CLOSED = 3;

        windowMock = {
            WebSocket: WebSocket
        };

        //spyOn(windowMock.WebSocket, '_message');
    });

    afterEach(function(){
        fixture.cleanup()
    });


    /*it( 'should process a dial_group_change notification message', function() {
        var updatedDialGroupId = "2";
        var Lib = new AgentLibrary();

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.ui_response_Login);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.ui_response_Configure);

        // for change dial group event, first we receive a IQ LOGIN message
        // then we get the DIAL_GROUP_CHANGE message
        var updatedConfigMessage = JSON.parse(JSON.stringify(this.ui_response_Configure));
        updatedConfigMessage.ui_response.outdial_group_id["#text"] = updatedDialGroupId;
        updatedConfigMessage.ui_response.detail["#text"] = "Logon Session Configuration Updated!";

        // update outboundSettings and agentPermissions on model
        Lib.getConfigRequest().processResponse(updatedConfigMessage);
        Lib.getDialGroupChangeNotification().processResponse(this.ui_notification_DialGroupChange);

        var dialGroup = Lib.getOutboundSettings().outdialGroup;
        var agentPermissions = Lib.getAgentPermissions();
        var expectedDialGroups = this.processed_data_OutboundSettings.availableOutdialGroups;
        var expectedDialGroup = {};
        var updatedExpectedPermissions = JSON.parse(JSON.stringify(this.processed_data_AgentPermissions));

        // find new dial group, set expected permission values
        for(var e = 0; e < expectedDialGroups.length; e++){
            var group = expectedDialGroups[e];
            if(group.dialGroupId === updatedDialGroupId){
                expectedDialGroup = group;
                updatedExpectedPermissions.allowLeadSearch = group.allowLeadSearch;
                updatedExpectedPermissions.requireFetchedLeadsCalled = group.requireFetchedLeadsCalled;
                updatedExpectedPermissions.allowPreviewLeadFilters = group.allowPreviewLeadFilters;
                updatedExpectedPermissions.progressiveEnabled = group.progressiveEnabled;
            }
        }

        expect(dialGroup).toEqual(expectedDialGroup);
        expect(agentPermissions).toEqual(updatedExpectedPermissions);
    });

    it( 'should process an end-call notification message', function() {
        var Lib = new AgentLibrary();

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.ui_response_Login);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.ui_response_Configure);

        // process end call event
        Lib.getEndCallNotification().processResponse(this.ui_notification_EndCall);

        var currentCall = Lib.getCurrentCall();
        var expectedCurrentCall = {
          duration: this.ui_notification_EndCall.ui_notification.call_duration['#text'] || "",
          termParty: this.ui_notification_EndCall.ui_notification.term_party['#text'] || "",
          termReason: this.ui_notification_EndCall.ui_notification.term_reason['#text'] || ""
        };

        var callState = Lib.getAgentSettings().callState;
        var expectedCallState = "CALL-ENDED";

        expect(currentCall).toEqual(expectedCurrentCall);
        expect(callState).toEqual(expectedCallState);
    });

    it( 'should process a gates_change notification message', function() {
        var updatedGateIds = "3";
        var gateIdArr = updatedGateIds.split(',');
        var Lib = new AgentLibrary();

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.ui_response_Login);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.ui_response_Configure);

        // process gates change event
        var gateChangeNotifRaw = JSON.parse(JSON.stringify(this.ui_notification_GatesChange));
        gateChangeNotifRaw.ui_notification.gate_ids["#text"] = updatedGateIds;
        Lib.getGatesChangeNotification().processResponse(gateChangeNotifRaw);

        var gates = Lib.getInboundSettings().queues;
        var availGates = this.processed_data_InboundSettings.availableQueues;
        var expectedGates = [];

        // find new gates
        for(var g = 0; g < availGates.length; g++){
            var gate = availGates[g];
            if(gateIdArr.indexOf(gate.gateId) !== -1){
                // found selected gate
                expectedGates.push(gate);
            }
        }

        expect(gates).toEqual(expectedGates);
    });

    it( 'should process a generic notification message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.ui_response_Login);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.ui_response_Configure);

        var response = Lib.getGenericNotification().processResponse(this.ui_notification_Generic);
        var expectedResponse = {
            message: "OK",
            detail: "Pending Callback Successfully Cancelled.",
            status: "",
            messageCode: "0"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a new_call notification message', function() {
        var Lib = new AgentLibrary();

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.ui_response_Login);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.ui_response_Configure);

        // process new call event
        var newCallNotifRaw = JSON.parse(JSON.stringify(this.ui_notification_NewCall));
        var response = Lib.getNewCallNotification().processResponse(newCallNotifRaw);
        var modelNewCall = Lib.getCurrentCall();
        var modelTokens = Lib.getCallTokens();

        delete response.queueDts; // dates won't match

        expect(response).toEqual(this.processed_data_NewCall_Outbound);
        expect(response).toEqual(modelNewCall);
        expect(modelTokens).toEqual(this.processed_data_Lead);
    });

    it( 'should process a add-session notification message', function() {
        var Lib = new AgentLibrary();

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.ui_response_Login);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.ui_response_Configure);

        // process add session event
        var addSessionNotifRaw = JSON.parse(JSON.stringify(this.ui_notification_AddSession));
        var response = Lib.getAddSessionNotification().processResponse(addSessionNotifRaw);

        var expectedResponse = {
            "message":"Received ADD-SESSION notification",
            "detail":"",
            "status":"OK",
            "sessionId": "2",
            "uii": "200808291814560000000900016558",
            "phone": "200808291814370000000900016555",
            "sessionType":"AGENT",
            "sessionLabel": "Primary Agents Call Session",
            "allowControl": true,
            "monitoring": false,
            "agentId": "1",
            "transferSessions":{}
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a drop-session notification message', function() {
        var Lib = new AgentLibrary();

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.ui_response_Login);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.ui_response_Configure);

        // process early uii event
        var dropSesNotifRaw = JSON.parse(JSON.stringify(this.ui_notification_DropSession));
        var response = Lib.getDropSessionNotification().processResponse(dropSesNotifRaw);

        var expectedResponse = {
            "message":"Received DROP-SESSION Notification",
            "detail":"",
            "status":"OK",
            "sessionId": "3",
            "uii": "201608161322180139000000000124"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a early_uii notification message', function() {
        var Lib = new AgentLibrary();

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.ui_response_Login);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.ui_response_Configure);

        // process early uii event
        var earlyUiiNotifRaw = JSON.parse(JSON.stringify(this.ui_notification_EarlyUii));
        var response = Lib.getEarlyUiiNotification().processResponse(earlyUiiNotifRaw);

        var expectedResponse = {
            "message":"Received EARLY_UII notification",
            "detail":"",
            "status":"OK",
            "uii": "201608161200240139000000000120",
            "agentId": "1"
        };

        expect(response).toEqual(expectedResponse);
    });*/

});
