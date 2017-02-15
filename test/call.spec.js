
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

describe( 'Tests for Agent Library agent methods', function() {
    beforeEach(function() {
        dialGroupId = "1";
        gateIds = ["1","2"];
        chatIds = ["1"];
        skillProfileId = "1";
        dialDest = "sip:99@boulder-voip.connectfirst.com";

        fixture.setBase('mock');  // If base path is different from the default `spec/fixtures`
        this.loginResponseRaw = fixture.load('loginResponseRaw.json');
        this.configResponseRaw = fixture.load('configResponseRaw.json');
        this.previewDialResponseRaw = fixture.load('call/previewDialResponseRaw.json');
        this.expectedPreviewDialResponse = fixture.load('call/expectedPreviewDialResponse.json');
        this.campaignDispositionsRaw = fixture.load('call/campaignDispositionsRaw.json');
        this.expectedOutdialDispositionRequest = fixture.load('call/expectedOutdialDispositionRequest.json');
        this.expectedDispositionManualPassRequest = fixture.load('call/expectedDispositionManualPassRequest.json');
        this.expectedWarmXferRequest = fixture.load('call/expectedWarmXferRequest.json');
        this.expectedColdXferRequest = fixture.load('call/expectedColdXferRequest.json');
        this.expectedWarmXferCancelRequest = fixture.load('call/expectedWarmXferCancelRequest.json');
        this.warmXferResponseRaw = fixture.load('call/warmXferResponseRaw.json');
        this.coldXferResponseRaw = fixture.load('call/coldXferResponseRaw.json');

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

    it( 'should build a barge-in message and send message over socket', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.bargeIn(1, "", "");
        var msg = Lib.getBargeInRequest().formatJSON();
        var requestMsg = JSON.parse(msg);
        delete requestMsg.ui_request['@message_id']; // won't match

        Lib.socket._message(msg);

        var expectedBargeInRequest = {
            "ui_request":{
                "@destination":"IQ",
                "@type":"BARGE-IN",
                "@response_to":"",
                "agent_id":{"#text":"1"},
                "uii":{"#text":""},
                "audio_state":{"#text":"FULL"},
                "monitor_agent_id":{"#text":""}
            }
        };

        expect(requestMsg).toEqual(expectedBargeInRequest);
        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should process a barge-in response message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);
        Lib.bargeIn("FULL");

        var bargeInResponse =   {
            "ui_response":{
                "@response_to":"",
                "@type":"BARGE-IN",
                "agent_id":{"#text":""},
                "uii":{},
                "status":{"#text":"OK"},
                "message":{"#text":"Barge-In processed successfully!"},
                "detail":{}
            }
        };
        var response = Lib.getBargeInRequest().processResponse(bargeInResponse);
        var expectedResponse = {
            message: "Barge-In processed successfully!",
            detail: "",
            status: "OK",
            agentId: "",
            uii:""
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a call-notes response message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);
        Lib.setCallNotes("A new Note!");

        // process call-notes response
        var callNotesResponse = {
            "ui_response": {
                "@type":"CALL-NOTES",
                "status":{"#text": "OK"},
                "message": {},
                "detail":{}
            }
        };
        var response = Lib.getCallNotesRequest().processResponse(callNotesResponse);
        var expectedResponse = {
            message: "Call notes have been updated.",
            detail: "",
            status: "OK",
            type:"INFO_EVENT"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a campaign-dispositions response message', function() {
        var Lib = new AgentLibrary();
        var campaignId = "1";
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);
        Lib.getCampaignDispositions(campaignId);

        // process response
        var response = Lib.getCampaignDispositionsRequest().processResponse(this.campaignDispositionsRaw);
        var expectedResponse = [
            {dispositionId: "1", disposition:"requeue"},
            {dispositionId: "2", disposition:"complete"}
        ];

        // check model
        var dispositions = Lib.getOutboundSettings().campaignDispositions;

        expect(response).toEqual(expectedResponse);
        expect(dispositions).toEqual(expectedResponse);
    });


    it( 'should build a cold-xfer message and send message over socket', function() {
        var Lib = new AgentLibrary();
        var dest = "5555555555";
        var callerId = "5555555551";

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        Lib.coldXfer(dest, callerId);
        var msg = Lib.getColdTransferRequest().formatJSON();
        var requestMsg = JSON.parse(msg);
        delete requestMsg.ui_request['@message_id']; // won't match

        Lib.socket._message(msg);

        expect(requestMsg).toEqual(this.expectedColdXferRequest);
        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should process a cold-xfer response message', function() {
        var Lib = new AgentLibrary();
        var dest = "5555555555";
        var callerId = "5555555551";

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);
        Lib.coldXfer(dest, callerId);

        // process warm-xfer response
        var response = Lib.getColdTransferRequest().processResponse(this.coldXferResponseRaw);
        var expectedResponse = {
            "message":"OK",
            "detail":"",
            "status":"OK",
            "agentId": "1",
            "uii":"1111",
            "sessionId":"3",
            "dialDest":"5555555555"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should build a hangup message and send message over socket', function() {
        var Lib = new AgentLibrary();

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.hangup();
        var msg = Lib.getHangupRequest().formatJSON();

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should build a hold message and send message over socket', function() {
        var Lib = new AgentLibrary();
        var holdState = true;
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.hold(holdState);
        var msg = Lib.getHoldRequest().formatJSON();
        var requestMsg = JSON.parse(msg);
        delete requestMsg.ui_request['@message_id']; // won't match

        Lib.socket._message(msg);

        var expectedRequest =   {
            "ui_request":{
                "@destination":"IQ",
                "@type":"HOLD",
                "@response_to":"",
                "agent_id":{"#text":""},
                "uii":{"#text":""},
                "session_id":{"#text":"1"},
                "hold_state":{"#text":"ON"}
            }
        };

        expect(requestMsg).toEqual(expectedRequest);
        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should process a hold response message', function() {
        var Lib = new AgentLibrary();
        var holdState = true;
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);
        Lib.hold(holdState);

        var holdResponse = {
            "ui_response":{
                "@response_to":"",
                "@type":"HOLD",
                "uii":{"#text":""},
                "session_id":{"#text":"1"},
                "status":{"#text":"OK"},
                "message":{},
                "detail":{},
                "hold_state":{"#text":"ON"}
            }
        };
        var response = Lib.getHoldRequest().processResponse(holdResponse);
        var expectedResponse = {
            message: "Broadcasting new hold state of true",
            detail: "",
            status: "OK",
            holdState: true,
            sessionId: "1",
            uii:""
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should build a one-to-one-outdial message and send message over socket', function() {
        var Lib = new AgentLibrary();
        var destination = "55555555555";
        var callerId = "3035555555555";

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.manualOutdial(destination, callerId, null, null, null);
        var msg = Lib.getManualOutdialRequest().formatJSON();

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should build a one-to-one-outdial-cancel message and send message over socket', function() {
        var Lib = new AgentLibrary();
        var uii = "1111";

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.manualOutdialCancel(uii);
        var msg = Lib.getManualOutdialCancelRequest().formatJSON();

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should build a outdial-disposition request message and send over socket', function() {
        var Lib = new AgentLibrary();
        var uii = "1111";
        var dispId = "1";
        var notes = "A note!";
        var callback = false;
        var survey = {
            "name": {value: "Geoff", leadField: "first_name"},
            "title": {value: "CEO", leadField: "title"}
        };

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        Lib.dispositionCall(uii, dispId, notes, callback, null, null, survey);
        var msg = Lib.getDispositionRequest().formatJSON();
        var requestMsg = JSON.parse(msg);
        delete requestMsg.ui_request['@message_id']; // won't match

        Lib.socket._message(msg);

        expect(requestMsg).toEqual(this.expectedOutdialDispositionRequest);
        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should build a manual pass request message and send over socket', function() {
        var Lib = new AgentLibrary();
        var dispId = "1";
        var notes = "A note!";
        var callback = false;
        var leadId = "1";
        var requestKey = "11111";
        var externId = "1";

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        Lib.dispositionManualPass(dispId, notes, callback, null, leadId, requestKey, externId);
        var msg = Lib.getDispositionManualPassRequest().formatJSON();
        var requestMsg = JSON.parse(msg);
        delete requestMsg.ui_request['@message_id']; // won't match

        Lib.socket._message(msg);

        expect(requestMsg).toEqual(this.expectedDispositionManualPassRequest);
        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should build a pause-record message and send message over socket', function() {
        var Lib = new AgentLibrary();
        var record = true;
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.pauseRecord(record);
        var msg = Lib.getPauseRecordRequest().formatJSON();
        var requestMsg = JSON.parse(msg);
        delete requestMsg.ui_request['@message_id']; // won't match

        Lib.socket._message(msg);

        var expectedRequest = {
            "ui_request":{
                "@destination":"IQ",
                "@type":"PAUSE-RECORD",
                "@response_to":"",
                "agent_id":{"#text":""},
                "uii":{"#text":""},
                "record":{"#text":"TRUE"},
                "pause":{"#text":"10"}
            }
        };

        expect(requestMsg).toEqual(expectedRequest);
        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should process a pause-record response message', function() {
        var Lib = new AgentLibrary();
        var record = true;
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);
        Lib.pauseRecord(record);

        var pauseResponse =  {
            "ui_response":{
                "@response_to":"",
                "@type":"PAUSE-RECORD",
                "uii":{"#text":""},
                "status":{"#text":"OK"},
                "message":{},
                "detail":{},
                "state":{"#text":"PAUSED"},
                "pause":{"#text":"10"}
            }
        };
        var response = Lib.getPauseRecordRequest().processResponse(pauseResponse);
        var expectedResponse = {
            message: "Broadcasting new record state of PAUSED",
            detail: "",
            status: "OK",
            uii: "",
            state: "PAUSED",
            pause:"10"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should build a preview-dial message and send message over socket', function() {
        var Lib = new AgentLibrary();
        var action = "";
        var requestId = "";
        var searchFields = [
            {"key":"name", "value":"Danielle"},
            {"key":"number", "value":"5555555555"}
        ];

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.previewDial(action, searchFields, requestId);
        var msg = Lib.getPreviewDialRequest().formatJSON();

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should process a preview-dial dialer response message', function() {
        var action = "";
        var requestId = "";
        var searchFields = [
            {"key":"name", "value":"Danielle"},
            {"key":"number", "value":"5555555555"}
        ];

        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);
        Lib.previewDial(action, searchFields, requestId);

        // process preview dial response
        var previewDialResponse = JSON.parse(JSON.stringify(this.previewDialResponseRaw));
        var response = Lib.getPreviewDialRequest().processResponse(previewDialResponse);
        var expectedResponse = this.expectedPreviewDialResponse;

        expect(response).toEqual(expectedResponse);
    });

    it( 'should build a record message and send message over socket', function() {
        var Lib = new AgentLibrary();
        var record = true;
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.record(record);
        var msg = Lib.getRecordRequest().formatJSON();
        var requestMsg = JSON.parse(msg);
        delete requestMsg.ui_request['@message_id']; // won't match

        Lib.socket._message(msg);

        var expectedRequest = {
            "ui_request":{
                "@destination":"IQ",
                "@type":"RECORD",
                "@response_to":"",
                "agent_id":{"#text":""},
                "uii":{"#text":""},
                "record":{"#text":"TRUE"}
            }
        };

        expect(requestMsg).toEqual(expectedRequest);
        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should process a record response message', function() {
        var Lib = new AgentLibrary();
        var record = true;
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);
        Lib.record(record);

        var recordResponse =  {
            "ui_response":{
                "@response_to":"",
                "@type":"RECORD",
                "uii":{"#text":""},
                "status":{"#text":"OK"},
                "message":{},
                "detail":{},
                "state":{"#text":"RECORDING"}
            }
        };
        var response = Lib.getRecordRequest().processResponse(recordResponse);
        var expectedResponse = {
            message: "Broadcasting new record state of RECORDING",
            detail: "",
            status: "OK",
            uii: "",
            state: "RECORDING"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should build a tcpa-safe message and send message over socket', function() {
        var Lib = new AgentLibrary();
        var action = "";
        var requestId = "";
        var searchFields = [
            {"key":"name", "value":"Danielle"},
            {"key":"number", "value":"5555555555"}
        ];

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.tcpaSafeCall(action, searchFields, requestId);
        var msg = Lib.getTcpaSafeRequest().formatJSON();

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should process a tcpa-safe dialer response message', function() {
        var Lib = new AgentLibrary();
        var action = "";
        var requestId = "";
        var searchFields = [
            {"key":"name", "value":"Danielle"},
            {"key":"number", "value":"5555555555"}
        ];

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);
        Lib.tcpaSafeCall(action, searchFields, requestId);

        // process tcpa safe response
        var tcpaSafeResponse = JSON.parse(JSON.stringify(this.previewDialResponseRaw));
        var response = Lib.getTcpaSafeRequest().processResponse(tcpaSafeResponse);
        var expectedResponse = this.expectedPreviewDialResponse;

        expect(response).toEqual(expectedResponse);
    });

    it( 'should build a warm-xfer message and send message over socket', function() {
        var Lib = new AgentLibrary();
        var dest = "5555555555";
        var callerId = "5555555551";

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        Lib.warmXfer(dest, callerId);
        var msg = Lib.getWarmTransferRequest().formatJSON();
        var requestMsg = JSON.parse(msg);
        delete requestMsg.ui_request['@message_id']; // won't match

        Lib.socket._message(msg);

        expect(requestMsg).toEqual(this.expectedWarmXferRequest);
        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should process a warm-xfer response message', function() {
        var Lib = new AgentLibrary();
        var dest = "5555555555";
        var callerId = "5555555551";
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);
        Lib.warmXfer(dest, callerId);

        // process warm-xfer response
        var response = Lib.getWarmTransferRequest().processResponse(this.warmXferResponseRaw);
        var expectedResponse = {
            "message":"OK",
            "detail":"",
            "status":"OK",
            "agentId": "1",
            "uii":"1111",
            "sessionId":"3",
            "dialDest":"5555555555"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should build a warm-xfer-cancel message and send message over socket', function() {
        var Lib = new AgentLibrary();
        var dest = "5555555555";

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(dialDest, gateIds, chatIds, skillProfileId, dialGroupId);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        Lib.warmXferCancel(dest);
        var msg = Lib.getWarmTransferCancelRequest().formatJSON();
        var requestMsg = JSON.parse(msg);
        delete requestMsg.ui_request['@message_id']; // won't match

        Lib.socket._message(msg);

        expect(requestMsg).toEqual(this.expectedWarmXferCancelRequest);
        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });


});
