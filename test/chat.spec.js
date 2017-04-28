
"use strict";

var socketMock;
var windowMock;
var address = 'ws://test.address';
var uii = "123456789";
var sessionId = "2";
var agentId = "1";
var accountId = "99999999";

describe( 'Tests for Agent Library chat methods', function() {
    beforeEach(function() {
        uii = "123456789";
        sessionId = "2";
        agentId = "1";
        accountId = "99999999";

        fixture.setBase('mock');  // If base path is different from the default `spec/fixtures`
        this.chatActiveNotificationRaw = fixture.load('chat/chatActiveNotificationRaw.json');
        this.chatInactiveNotificationRaw = fixture.load('chat/chatInactiveNotificationRaw.json');
        this.chatPresentedNotificationRaw = fixture.load('chat/chatPresentedNotificationRaw.json');
        this.chatTypingNotificationRaw = fixture.load('chat/chatTypingNotificationRaw.json');
        this.newChatNotificationRaw = fixture.load('chat/newChatNotificationRaw.json');

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

    });

    afterEach(function(){
        fixture.cleanup()
    });

    it( 'should build chatPresented message and send message over socket', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var response = "ACCEPT";
        var responseReason = "some reason";

        Lib.chatPresentedResponse(uii, sessionId, response, responseReason);
        var msg = Lib.getChatPresentedRequest().formatJSON();
        var msgObj = JSON.parse(msg);

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
        expect(msgObj.ui_request.response["#text"]).toEqual(response);
    });

    it( 'should build chatDisposition message and send message over socket', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var dispositionId = "1";
        var notes = "an agent note";
        var script = null;

        Lib.chatDisposition(uii, agentId, dispositionId, sessionId, notes, script);
        var msg = Lib.getChatDispositionRequest().formatJSON();
        var msgObj = JSON.parse(msg);

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
        expect(msgObj.ui_request.notes["#text"]).toEqual(notes);
    });

    it( 'should build chatMessage message and send message over socket', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var message = "hello";

        Lib.chatMessage(uii, accountId, message);
        var msg = Lib.getChatMessageRequest().formatJSON();
        var msgObj = JSON.parse(msg);

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
        expect(msgObj.ui_request.message["#text"]).toEqual(message);
    });

    it( 'should build chatRequeue message and send message over socket', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var chatQueueId = "1";
        var skillId = "5";
        var maintainAgent = true;

        Lib.chatRequeue(uii, agentId, chatQueueId, skillId, maintainAgent);
        var msg = Lib.getChatRequeueRequest().formatJSON();
        var msgObj = JSON.parse(msg);

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
        expect(msgObj.ui_request.maintain_agent["#text"]).toEqual("true");
    });

    it( 'should build chatTyping message and send message over socket', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var isTyping = true;

        Lib.chatTyping(uii, accountId, isTyping);
        var msg = Lib.getChatTypingRequest().formatJSON();
        var msgObj = JSON.parse(msg);

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
        expect(msgObj.ui_request.is_typing["#text"]).toEqual("true");
    });

    it( 'should process a chat-active notification message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var response = Lib.getChatActiveNotification().processResponse(this.chatActiveNotificationRaw);
        var expectedResponse =  {
            message: "Received CHAT-ACTIVE notification",
            status: "OK",
            agentId: "1180958",
            uii: "201608161200240139000000000120"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a chat-inactive notification message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var response = Lib.getChatInactiveNotification().processResponse(this.chatInactiveNotificationRaw);
        var expectedResponse =  {
            message: "Received CHAT-INACTIVE notification",
            status: "OK",
            agentId: "1180958",
            uii: "201608161200240139000000000120"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a chat-presented notification message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var response = Lib.getChatPresentedNotification().processResponse(this.chatPresentedNotificationRaw);
        var expectedResponse =  {
            message: "Received CHAT-PRESENTED notification",
            status: "OK",
            agentId: "1180958",
            sessionId: "2",
            uii: "201608161200240139000000000120"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a chat-typing notification message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var response = Lib.getChatTypingNotification().processResponse(this.chatTypingNotificationRaw);
        var expectedResponse =  {
            message: "Received CHAT-TYPING notification",
            status: "OK",
            agentId: "1180958",
            accountId: "99999999",
            uii: "201608161200240139000000000120",
            isTyping: true,
            pendingMessage: "this is the message before actual send"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a new-chat notification message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // process new call event
        var newChatNotifRaw = JSON.parse(JSON.stringify(this.newChatNotificationRaw));
        var response = Lib.getNewChatNotification().processResponse(newChatNotifRaw);

        var expectedResponse = {
            uii: "201608161200240139000000000120",
            sessionId: "2",
            agentId: "1180958",
            queueTime: "-1",
            queueDts: "2017-04-26 11:25:00",
            chatQueueName: "Test Chat Queue",
            isSms: false,
            appUrl: "www.test.url",
            scriptId:"1",
            surveyPopType: "SUPPRESS",
            scriptVersion: "1",
            preChatData: "json_string_form_data",
            requeueShortcuts: [
                { chatQueueId: "2", name:"test queue", skillId:"" }
            ],
            chatDispositions: [
                {dispositionId:"2", disposition:"Complete"},
                {dispositionId:"3", disposition:"Requeue"}
            ],
            history: [
                {from:"system", type:"SYSTEM", message:"User1 connected"},
                {from:"dlbooks", type:"AGENT", message:"Hello"},
                {from:"user1", type:"CLIENT", message:"Hi"}
            ]

        };

        expect(response).toEqual(expectedResponse);
    });
});