
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

    it( 'should build a one-to-one-outdial message and send message over socket', function() {
        var Lib = new AgentLibrary();
        var destination = "55555555555";
        var callerId = "3035555555555";

        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.manualOutdial(destination, null, callerId, null, null);
        var msg = Lib.getOneToOneOutdialRequest().formatJSON();

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
        var msg = Lib.getOneToOneOutdialCancelRequest().formatJSON();

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
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

    it( 'should build a previewDial message and send message over socket', function() {
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

    it( 'should build a tcpaSafe message and send message over socket', function() {
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


});
