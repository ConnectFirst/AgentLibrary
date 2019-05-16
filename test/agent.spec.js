
"use strict";

var socketMock;
var windowMock;
var address = 'ws://test.address';
var username = "testUser";
var password = "sp!phy";
var platformId = "local";
var dialGroupId = "1";
var gateIds = ["1","2"];
var chatIds = ["1"];
var skillProfileId = "1";
var dialDest = "sip:99@boulder-voip.connectfirst.com";
/*var Promise = function(){
    return {};
};
var HttpService = function(){
    return {
        httpPost: function(){
            return {};
        }
    }
};*/

var _mock = function(){
    return {};
};

describe( 'Tests for Agent Library agent methods', function() {
    beforeEach(function() {
        gateIds = ["1","2"];
        chatIds = ["1"];
        skillProfileId = "1";
        dialDest = "sip:99@boulder-voip.connectfirst.com";

        fixture.setBase('mock');  // If base path is different from the default `spec/fixtures`
        this.response_authenticate = fixture.load('response.authenticate.json');
        this.ui_response_login = fixture.load('ui_response.Login.json');
        this.ui_response_Configure = fixture.load('ui_response.Configure.json');

        this.processed_data_AgentSettings = fixture.load('processed_data.AgentSettings.json');
        this.processed_data_AgentPermissions = fixture.load('processed_data.AgentPermissions.json');
        this.processed_data_InboundSettings = fixture.load('processed_data.InboundSettings.json');
        this.processed_data_OutboundSettings = fixture.load('processed_data.OutboundSettings.json');
        this.processed_data_ConnectionSettings = fixture.load('processed_data.ConnectionSettings.json');
        this.processed_data_ChatSettings = fixture.load('processed_data.ChatSettings.json');

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

    /*it( 'should build authenticateAgent message with username, password, platformId', function() {
        var Lib = new AgentLibrary();
        Lib.authenticateAgent(username, password, platformId);
        Lib.getAuthenticateRequest().processResponse(this.response_authenticate);

        var authenticateRequest = Lib.getAuthenticateRequest();
        var applicationSettings = Lib.getApplicationSettings();

        expect(authenticateRequest.accessToken).toEqual("123456789");
        expect(authenticateRequest.refreshToken).toEqual("223867e6-ad0f-4af1-bbe7-5090d8259065");
        expect(authenticateRequest.tokenType).toEqual("Bearer");
        expect(authenticateRequest.agents.length).toEqual(1);

        expect(applicationSettings.socketDest).toEqual("wss://d01-dev.vacd.biz:8080?access_token=123456789");
    });*/

    /*it( 'should process loginAgent response message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.ui_response_login);

        var settings = Lib.getAgentSettings();
        delete settings.loginDTS; // datetime won't match, remove
        var permissions = Lib.getAgentPermissions();
        var inbound = Lib.getInboundSettings();
        var outbound = Lib.getOutboundSettings();

        expect(permissions).toEqual(this.processed_data_AgentPermissions);
        expect(settings).toEqual(this.processed_data_AgentSettings);
        expect(inbound).toEqual(this.processed_data_InboundSettings);
        expect(outbound).toEqual(this.processed_data_OutboundSettings);
    });

     it( 'should build configureAgent message and send message over socket', function() {
         var Lib = new AgentLibrary();
         Lib.socket = windowMock.WebSocket(address);
         Lib.socket._open();

         Lib.loginAgent(username, password);
         Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
         var msg = Lib.getConfigRequest().formatJSON();

         Lib.socket._message(msg);

         expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
         expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
     });

    it( 'should process configureAgent response message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.ui_response_login);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.ui_response_Configure);

        var settings = Lib.getAgentSettings();
        delete settings.loginDTS; // datetime won't match, remove
        var connection = Lib.getConnectionSettings();
        var outbound = Lib.getOutboundSettings();
        var inbound = Lib.getInboundSettings();
        var chat = Lib.getChatSettings();

        var expectedOutbound = JSON.parse(JSON.stringify(this.processed_data_OutboundSettings));
        var expectedInbound = JSON.parse(JSON.stringify(this.processed_data_InboundSettings));
        var expectedChat = JSON.parse(JSON.stringify(this.processed_data_ChatSettings));

        // set expected dial group
        for(var e = 0; e < expectedOutbound.availableOutdialGroups.length; e++){
            var group = expectedOutbound.availableOutdialGroups[e];
            if(group.dialGroupId === dialGroupId){
                expectedOutbound.outdialGroup = group;
            }
        }

        // set expected gates
        for(var g = 0; g < expectedInbound.availableQueues.length; g++){
            var gate = expectedInbound.availableQueues[g];
            if(gateIds.indexOf(gate.gateId) !== -1){
                expectedInbound.queues.push(gate);
            }
        }

        // set expected skill profile
        for(var p = 0; p < expectedInbound.availableSkillProfiles.length; p++){
            var profile = expectedInbound.availableSkillProfiles[p];
            if(skillProfileId === profile.profileId){
                expectedInbound.skillProfile = profile;
            }
        }

        // set expected chat queues
        for(var q = 0; q < expectedChat.availableChatQueues.length; q++){
            var queue = expectedChat.availableChatQueues[q];
            if(chatIds.indexOf(queue.chatQueueId) !== -1){
                expectedChat.chatQueues.push(queue);
            }
        }

        expect(inbound).toEqual(expectedInbound);
        expect(outbound).toEqual(expectedOutbound);
        expect(chat).toEqual(expectedChat);
        expect(connection).toEqual(this.processed_data_ConnectionSettings);
    });*/

});
