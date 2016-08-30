
"use strict";

var socketMock;
var windowMock;
var address = 'ws://test.address';

describe( 'Tests for processing stat messages in Agent Library', function() {
    beforeEach(function() {
        fixture.setBase('mock');  // If base path is different from the default `spec/fixtures`
        this.loginResponseRaw = fixture.load('loginResponseRaw.json');
        this.configResponseRaw = fixture.load('configResponseRaw.json');
        this.campaignStatsRaw = fixture.load('stats/campaignStatsRaw.json');
        this.queueStatsRaw = fixture.load('stats/queueStatsRaw.json');
        this.agentStatsRaw = fixture.load('stats/agentStatsRaw.json');
        this.agentDailyStatsRaw = fixture.load('stats/agentDailyStatsRaw.json');
        this.expectedCampaignStats = fixture.load('stats/expectedCampaignStats.json');
        this.expectedQueueStats = fixture.load('stats/expectedQueueStats.json');
        this.expectedAgentStats = fixture.load('stats/expectedAgentStats.json');
        this.expectedAgentDailyStats = fixture.load('stats/expectedAgentDailyStats.json');

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

    it( 'should process an agent stat message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.getAgentStatsPacket().processResponse(this.agentStatsRaw);
        var agentStats = Lib.getAgentStats();

        expect(agentStats).toEqual(this.expectedAgentStats);
    });

    it( 'should process an agent daily stat message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.getAgentDailyStatsPacket().processResponse(this.agentDailyStatsRaw);
        var agentDailyStats = Lib.getAgentDailyStats();

        expect(agentDailyStats).toEqual(this.expectedAgentDailyStats);
    });


    it( 'should process a queue stat message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.getQueueStatsPacket().processResponse(this.queueStatsRaw);
        var queueStats = Lib.getQueueStats();

        expect(queueStats).toEqual(this.expectedQueueStats);
    });

    it( 'should process a campaign stat message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.getCampaignStatsPacket().processResponse(this.campaignStatsRaw);
        var campaignStats = Lib.getCampaignStats();

        expect(campaignStats).toEqual(this.expectedCampaignStats);
    });

});
