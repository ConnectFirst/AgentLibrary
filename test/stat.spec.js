
"use strict";

var socketMock;
var windowMock;
var address = 'ws://test.address';

describe( 'Tests for processing stat messages in Agent Library', function() {
    beforeEach(function() {
        fixture.setBase('mock');  // If base path is different from the default `spec/fixtures`
        this.ui_response_Login = fixture.load('ui_response.Login.json');
        this.ui_response_Configure = fixture.load('ui_response.Configure.json');

        this.ui_stats_Campaign = fixture.load('stats/ui_stats.Campaign.json');
        this.ui_stats_Queue = fixture.load('stats/ui_stats.Queue.json');
        this.ui_stats_Agent = fixture.load('stats/ui_stats.Agent.json');
        this.ui_stats_AgentDaily = fixture.load('stats/ui_stats.AgentDaily.json');

        this.processed_data_Campaign = fixture.load('stats/processed_data.Campaign.json');
        this.processed_data_Queue = fixture.load('stats/processed_data.Queue.json');
        this.processed_data_Agent = fixture.load('stats/processed_data.Agent.json');
        this.processed_data_AgentDaily = fixture.load('stats/processed_data.AgentDaily.json');

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

        Lib.getAgentStatsPacket().processResponse(this.ui_stats_Agent);
        var agentStats = Lib.getAgentStats();

        expect(agentStats).toEqual(this.processed_data_Agent);
    });

    it( 'should process an agent daily stat message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.getAgentDailyStatsPacket().processResponse(this.ui_stats_AgentDaily);
        var agentDailyStats = Lib.getAgentDailyStats();

        expect(agentDailyStats).toEqual(this.processed_data_AgentDaily);
    });


    it( 'should process a queue stat message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.getQueueStatsPacket().processResponse(this.ui_stats_Queue);
        var queueStats = Lib.getQueueStats();

        expect(queueStats).toEqual(this.processed_data_Queue);
    });

    it( 'should process a campaign stat message', function() {
        var Lib = new AgentLibrary();
        Lib.socket = windowMock.WebSocket(address);
        Lib.socket._open();

        Lib.getCampaignStatsPacket().processResponse(this.ui_stats_Campaign);
        var campaignStats = Lib.getCampaignStats();

        expect(campaignStats).toEqual(this.processed_data_Campaign);
    });

});
