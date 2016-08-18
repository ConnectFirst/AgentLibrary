
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
        fixture.setBase('mock');  // If base path is different from the default `spec/fixtures`
        this.loginResponseRaw = fixture.load('loginResponseRaw.json');
        this.configResponseRaw = fixture.load('configResponseRaw.json');
        this.previewDialResponseRaw = fixture.load('previewDialResponseRaw.json');
        this.expectedPreviewDialResponse = fixture.load('expectedPreviewDialResponse.json');
        this.campaignDispositionsRaw = fixture.load('campaignDispositionsRaw.json');
        this.expectedOutdialDispositionRequest = fixture.load('expectedOutdialDispositionRequest.json');
        this.expectedDispositionManualPassRequest = fixture.load('expectedDispositionManualPassRequest.json');

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

    it( 'should process a call-notes response message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(gateIds, chatIds, skillProfileId, dialGroupId, dialDest);
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
        Lib.configureAgent(gateIds, chatIds, skillProfileId, dialGroupId, dialDest);
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

    it( 'should build a one-to-one-outdial message and send message over socket', function() {
        var Lib = new AgentLibrary();
        var destination = "55555555555";
        var callerId = "3035555555555";

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.manualOutdial(destination, null, callerId, null, null);
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
        var survey = [
            { label: "hello", externId: "text_box", leadUpdateColumn: ""},
            { label: "20", externId: "check_box", leadUpdateColumn: ""}
        ];

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

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

        Lib.dispositionManualPass(dispId, notes, callback, null, leadId, requestKey, externId);
        var msg = Lib.getDispositionManualPassRequest().formatJSON();
        var requestMsg = JSON.parse(msg);
        delete requestMsg.ui_request['@message_id']; // won't match

        Lib.socket._message(msg);

        expect(requestMsg).toEqual(this.expectedDispositionManualPassRequest);
        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
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
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(gateIds, chatIds, skillProfileId, dialGroupId, dialDest);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        // process preview dial response
        var previewDialResponse = JSON.parse(JSON.stringify(this.previewDialResponseRaw));
        var response = Lib.getPreviewDialRequest().processResponse(previewDialResponse);
        var expectedResponse = this.expectedPreviewDialResponse;

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
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // set login and config values
        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);
        Lib.configureAgent(gateIds, chatIds, skillProfileId, dialGroupId, dialDest);
        Lib.getConfigRequest().processResponse(this.configResponseRaw);

        // process tcpa safe response
        var tcpaSafeResponse = JSON.parse(JSON.stringify(this.previewDialResponseRaw));
        var response = Lib.getTcpaSafeRequest().processResponse(tcpaSafeResponse);
        var expectedResponse = this.expectedPreviewDialResponse;

        expect(response).toEqual(expectedResponse);
    });


});
