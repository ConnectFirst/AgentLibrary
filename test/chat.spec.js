
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
        this.ui_notification_ChatActive = fixture.load('chat/ui_notification.ChatActive.json');
        this.ui_notification_ChatInactive = fixture.load('chat/ui_notification.ChatInactive.json');
        this.ui_notification_ChatPresented = fixture.load('chat/ui_notification.ChatPresented.json');
        this.ui_notification_ChatTyping = fixture.load('chat/ui_notification.ChatTyping.json');
        this.ui_notification_NewChat = fixture.load('chat/ui_notification.NewChat.json');
        this.ui_notification_ChatMessage = fixture.load('chat/ui_notification.ChatMessage.json');
        this.ui_notification_ChatClientReconnect = fixture.load('chat/ui_notification.ChatClientReconnect.json');

        this.ui_response_ChatList = fixture.load('chat/ui_response.ChatList.json');

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

    it( 'should build chatPresentedResponse message and send message over socket', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var response = "ACCEPT";
        var responseReason = "some reason";
        var messageId = "123456789";

        Lib.chatPresentedResponse(uii, messageId, response, responseReason);
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
        var sendAck = false;
        var script = null;
        var sessionId = 3;

        Lib.chatDisposition(uii, agentId, dispositionId, notes, sendAck, script, sessionId);
        var msg = Lib.getChatDispositionRequest().formatJSON();
        var msgObj = JSON.parse(msg);

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
        expect(msgObj.ui_request.notes["#text"]).toEqual(notes);
        expect(msgObj.ui_request.session_id["#text"]).toEqual('3');
    });


    it('should process a chat list request', function(){
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();
        Lib.chatList(17,18);

        var msg = Lib.getChatListRequest().formatJSON();
        var msgObj = JSON.parse(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(msgObj.ui_request.agent_id["#text"]).toBe('17');
        expect(msgObj.ui_request.monitor_agent_id["#text"]).toBe('18');
    });

    it( 'should build chatMessage message and send message over socket', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var message = "hello";

        Lib.chatMessage(uii, agentId, message);
        var msg = Lib.getChatMessageRequest().formatJSON();
        var msgObj = JSON.parse(msg);

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
        expect(msgObj.ui_request.message["#text"]).toEqual(message);
    });

    it('should build a chatAgentEnd message and send message over socket', function(){
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var uii = "8675309";
        var agentId = 4;

        Lib.chatAgentEnd(agentId, uii);
        var msg = Lib.getChatAgentEnd().formatJSON();
        var msgObj = JSON.parse(msg);

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
        expect(msgObj.ui_request.uii["#text"]).toEqual(uii);
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

        Lib.chatTyping(uii);
        var msg = Lib.getChatTypingRequest().formatJSON();
        var msgObj = JSON.parse(msg);

        Lib.socket._message(msg);

        expect(windowMock.WebSocket).toHaveBeenCalledWith(address);
        expect(Lib.socket.onmessage).toHaveBeenCalledWith(msg);
    });

    it( 'should process a chat-active notification message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var response = Lib.getChatActiveNotification().processResponse(this.ui_notification_ChatActive);
        var expectedResponse =  {
            message: "Received CHAT-ACTIVE notification",
            status: "OK",
            accountId: "99999999",
            uii: "201608161200240139000000000120",
            isMonitoring: false
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a chat-inactive notification message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var response = Lib.getChatInactiveNotification().processResponse(this.ui_notification_ChatInactive);
        var expectedResponse =  {
            message: "Received CHAT-INACTIVE notification",
            status: "OK",
            accountId: "99999999",
            uii: "201608161200240139000000000120",
            dispositionTimeout: "30",
            dequeueAgentId: "1"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a chat-presented notification message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var response = Lib.getChatPresentedNotification().processResponse(this.ui_notification_ChatPresented);
        var expectedResponse =  {
            message: "Received CHAT-PRESENTED notification",
            status: "OK",
            messageId:"IQ10012016081611595000289",
            accountId: "99999999",
            uii: "201608161200240139000000000120",
            channelType: "SMS",
            chatQueueId: "2",
            chatQueueName: "Support Queue",
            allowAccept: true

        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a chat-typing notification message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var response = Lib.getChatTypingNotification().processResponse(this.ui_notification_ChatTyping);
        var expectedResponse =  {
            message: "Received CHAT-TYPING notification",
            status: "OK",
            accountId: "99999999",
            uii: "201608161200240139000000000120",
            from: "System",
            type: "SYSTEM",
            pendingMessage: "this is the message before actual send",
            dequeueAgentId: "1"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a chatlist response', function(){
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();
        Lib.chatList(17,18);

        var msg = Lib.getChatListRequest().processResponse(this.ui_response_ChatList);

        expect(Number(msg.agentId)).toBe(17);
        expect(msg.chatList[0].uii).toBe("333");
    });

    it( 'should process a chat-message notification message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        var response = Lib.getChatMessageRequest().processResponse(this.ui_notification_ChatMessage);
        var expectedResponse =  {
            uii: "201608161200240139000000000120",
            accountId: "99999999",
            from: "",
            type: "AGENT",
            message: "Hello. How can I help you?",
            whisper: true,
            dequeueAgentId: "1",
            dts: new Date("2017-05-10T12:40:28"),
            mediaLinks : [ 'https://d01-mms-files.s3.amazonaws.com/99999999/088f5c25-055a-4eb4-b25c-75f03ec59f8d.jpg' ]
        };

        expect(response).toEqual(expectedResponse);
    });

    it('should process a client-chat-reconnect notification message', function(){
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // process chat client reconnect
        var ui_notification_ChatClientReconnect = JSON.parse(JSON.stringify(this.ui_notification_ChatClientReconnect));
        var response = Lib.getChatClientReconnectNotification().processResponse(ui_notification_ChatClientReconnect);


        var expectedResponse = {
            message : 'Received CHAT-CLIENT-RECONNECT notification',
            status : 'OK',
            uii: "201608161200240139000000000120",
            accountId: "99999999",
            agentId: "1"
        };

        expect(response).toEqual(expectedResponse);
    });

    it( 'should process a new-chat notification message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        // process new call event
        var newChatNotifRaw = JSON.parse(JSON.stringify(this.ui_notification_NewChat));
        var response = Lib.getNewChatNotification().processResponse(newChatNotifRaw);

        var expectedResponse = {
            uii: "201608161200240139000000000120",
            accountId: "99999999",
            sessionId: "2",
            agentId: "1180958",
            queueDts: new Date("2017-04-26T11:25:00"),
            queueTime: "-1",
            chatQueueId: "2",
            chatQueueName: "Test Chat Queue",
            chatRequeueType : "SHORTCUT",
            appUrl: "www.test.url",
            channelType: "SMS",
            ani: "5551234567",
            dnis: "5557654321",
            surveyPopType: "SUPPRESS",
            scriptId:"1",
            scriptVersion: "1",
            idleTimeout: "60",
            isMonitoring: false,
            monitoredAgentId: "",
            preChatData: {name:'danielle', email:'dani.libros@gmail.com'},
            requeueShortcuts : { shortcuts : [
                { chatQueueId : '2', name : 'test queue', skillId : '' }
            ]},
            chatDispositions: [
                {dispositionId:"2", isSuccess:true, isComplete:true, isDefault:false, emailTemplateId: "1", disposition:"Complete"},
                {dispositionId:"3", isSuccess:true, isComplete:false, isDefault:true, disposition:"Requeue"}
            ],
            transcript: [
                {from:"system", type:"SYSTEM", dts:new Date("2017-06-07T16:05:23"), message:"User1 connected"},
                {from:"dlbooks", type:"AGENT", dts:new Date("2017-06-07T16:05:23"), message:"Hello"},
                {from:"user1", type:"CLIENT", dts:new Date("2017-06-07T16:05:23"), message:"Hi"}
            ],
            baggage: {
                name:'danielle',
                email:'dani.libros@gmail.com',
                chatQueueId: '2',
                chatQueueName: 'Test Chat Queue',
                ani : '5551234567',
                dnis : '5557654321',
                uii : '201608161200240139000000000120',
                agentFirstName : '',
                agentLastName : '',
                agentExternalId : '',
                agentType : 'AGENT',
                agentEmail : '',
                agentUserName : ''
            }
        };

        expect(response).toEqual(expectedResponse);
    });
});
