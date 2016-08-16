
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
        this.loginResponseRaw = fixture.load('loginResponseRaw.json');
        this.configResponseRaw = fixture.load('configResponseRaw.json');
        this.dgChangeNotificationRaw = fixture.load('dialGroupChangeNotificationRaw.json');
        this.expectedAgentSettings = fixture.load('expectedAgentSettings.json');
        this.expectedAgentPermissions = fixture.load('expectedAgentPermissions.json');
        this.expectedInboundSettings = fixture.load('expectedInboundSettings.json');
        this.expectedOutboundSettings = fixture.load('expectedOutboundSettings.json');
        this.gatesChangeNotificationRaw = fixture.load('gatesChangeNotificationRaw.json');
        this.endCallNotificationRaw = fixture.load('endCallNotificationRaw.json');
        this.genericCancelCallbackNotificationRaw = fixture.load('genericCancelCallbackNotificationRaw.json');
        this.newCallNotificationRaw = fixture.load('newCallNotificationRaw.json');
        this.expectedNewCallOutbound = fixture.load('expectedNewCallOutbound.json');
        this.addSessionNotificationRaw = fixture.load('addSessionNotificationRaw.json');
        this.dropSessionNotificationRaw = fixture.load('dropSessionNotificationRaw.json');
        this.earlyUiiNotificationRaw = fixture.load('earlyUiiNotificationRaw.json');

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


    it( 'should process a dial_group_change notification message', function() {
        var updatedDialGroupId = "2";
        var Lib = new AgentLibrary();

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(gateIds, chatIds, skillProfileId, dialGroupId, dialDest);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        // for change dial group event, first we receive a IQ LOGIN message
        // then we get the DIAL_GROUP_CHANGE message
        var updatedConfigMessage = JSON.parse(JSON.stringify(this.configResponseRaw));
        updatedConfigMessage.ui_response.outdial_group_id["#text"] = updatedDialGroupId;
        updatedConfigMessage.ui_response.detail["#text"] = "Logon Session Configuration Updated!";

        // update outboundSettings and agentPermissions on model
        Lib.getConfigRequest().processResponse(updatedConfigMessage);
        Lib.getDialGroupChangeNotification().processResponse(this.dgChangeNotificationRaw);

        var dialGroup = Lib.getOutboundSettings().outdialGroup;
        var agentPermissions = Lib.getAgentPermissions();
        var expectedDialGroups = this.expectedOutboundSettings.availableOutdialGroups;
        var expectedDialGroup = {};
        var updatedExpectedPermissions = JSON.parse(JSON.stringify(this.expectedAgentPermissions));

        // find new dial group, set expected permission values
        for(var e = 0; e < expectedDialGroups.length; e++){
            var group = expectedDialGroups[e];
            if(group.dialGroupId === updatedDialGroupId){
                expectedDialGroup = group;
                updatedExpectedPermissions.allowLeadSearch = group.allowLeadSearch;
                updatedExpectedPermissions.requireFetchedLeadsCalled = group.requireFetchedLeadsCalled;
                updatedExpectedPermissions.allowPreviewLeadFilters = group.allowPreviewLeadFilters;
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
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(gateIds, chatIds, skillProfileId, dialGroupId, dialDest);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        // process end call event
        Lib.getEndCallNotification().processResponse(this.endCallNotificationRaw);

        var currentCall = Lib.getCurrentCall();
        var expectedCurrentCall = {
          duration: this.endCallNotificationRaw.ui_notification.call_duration['#text'] || "",
          termParty: this.endCallNotificationRaw.ui_notification.term_party['#text'] || "",
          termReason: this.endCallNotificationRaw.ui_notification.term_reason['#text'] || ""
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
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(gateIds, chatIds, skillProfileId, dialGroupId, dialDest);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        // process gates change event
        var gateChangeNotifRaw = JSON.parse(JSON.stringify(this.gatesChangeNotificationRaw));
        gateChangeNotifRaw.ui_notification.gate_ids["#text"] = updatedGateIds;
        Lib.getGatesChangeNotification().processResponse(gateChangeNotifRaw);

        var gates = Lib.getInboundSettings().queues;
        var availGates = this.expectedInboundSettings.availableQueues;
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
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(gateIds, chatIds, skillProfileId, dialGroupId, dialDest);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        // process gates change event
        var response = Lib.getGenericNotification().processResponse(this.genericCancelCallbackNotificationRaw);
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
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(gateIds, chatIds, skillProfileId, dialGroupId, dialDest);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        // process new call event
        var newCallNotifRaw = JSON.parse(JSON.stringify(this.newCallNotificationRaw));
        var response = Lib.getNewCallNotification().processResponse(newCallNotifRaw);

        delete response.queueDts; // dates won't match

        expect(response).toEqual(this.expectedNewCallOutbound);
    });

    it( 'should process a add-session notification message', function() {
        var Lib = new AgentLibrary();

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(gateIds, chatIds, skillProfileId, dialGroupId, dialDest);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        // process add session event
        var addSessionNotifRaw = JSON.parse(JSON.stringify(this.addSessionNotificationRaw));
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
            "agentId": "1"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a drop-session notification message', function() {
        var Lib = new AgentLibrary();

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(gateIds, chatIds, skillProfileId, dialGroupId, dialDest);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        // process early uii event
        var dropSesNotifRaw = JSON.parse(JSON.stringify(this.dropSessionNotificationRaw));
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
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(gateIds, chatIds, skillProfileId, dialGroupId, dialDest);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        // process early uii event
        var earlyUiiNotifRaw = JSON.parse(JSON.stringify(this.earlyUiiNotificationRaw));
        var response = Lib.getEarlyUiiNotification().processResponse(earlyUiiNotifRaw);

        var expectedResponse = {
            "message":"Received EARLY_UII notification",
            "detail":"",
            "status":"OK",
            "uii": "201608161200240139000000000120",
            "agentId": "1"
        };

        expect(response).toEqual(expectedResponse);
    });

});
