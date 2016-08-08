
"use strict";

var socketMock;
var windowMock;
var address = 'ws://test.address';
var username = "testUser";
var password = "sp!phy";

describe( 'Tests for Agent Library agent methods', function() {
    beforeEach(function() {
        fixture.setBase('mock');  // If base path is different from the default `spec/fixtures`
        this.loginResponseRaw = fixture.load('loginResponseRaw.json');
        this.expectedAgentSettings = fixture.load('expectedAgentSettings.json');
        this.expectedAgentPermissions = fixture.load('expectedAgentPermissions.json');
        this.expectedInboundSettings = fixture.load('expectedInboundSettings.json');
        this.expectedOutboundSettings = fixture.load('expectedOutboundSettings.json');

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

    it( 'should build agentLogin message and send message over socket', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.loginAgent(username, password);
        var msg = Lib.getLoginRequest().formatJSON();

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should process agentLogin response message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.loginAgent(username, password);
        Lib.getLoginRequest().processResponse(this.loginResponseRaw);

        var settings = Lib.getAgentSettings();
        delete settings.loginDTS; // datetime won't match, remove
        var permissions = Lib.getAgentPermissions();
        var inbound = Lib.getInboundSettings();
        var outbound = Lib.getOutboundSettings();

        expect(permissions).toEqual(this.expectedAgentPermissions);
        expect(settings).toEqual(this.expectedAgentSettings);
        expect(inbound).toEqual(this.expectedInboundSettings);
        expect(outbound).toEqual(this.expectedOutboundSettings);
    });

});
