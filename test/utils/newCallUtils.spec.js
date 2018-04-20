describe('NewCallUtils', function() {
    var Lib;

    beforeEach(function() {
        Lib = new AgentLibrary();
    });

    afterEach(function() {
        Lib._getUIModel().resetInstance();
    });

    it('should init correctly', function() {
        var utils = new Lib._NewCallUtils({}, {});
        expect(utils.data).toBeDefined();
        expect(utils.instance).toBeDefined();
        expect(utils.setupAddSessionCallback).toBeDefined();
        expect(utils.processSessionsForCall).toBeDefined();
    });

    describe('setupAddSessionCallback', function() {
        beforeEach(function() {
            spyOn(Lib._utils, 'fireCallback');
        });

        it('should process sessions if call matches', function() {
            Lib._getUIModel().getInstance().currentCall = {
                uii: "1234"
            };

            var data = {
                ui_notification: {
                    uii: {
                        '#text': "1234"
                    },
                    session_id: {
                        '#text': "1"
                    }
                }
            };
            var utils = new Lib._NewCallUtils({}, data);
            utils.setupAddSessionCallback();

            var nofif = new Lib.getAddSessionNotification().processResponse(data);
            expect(Lib._utils.fireCallback).toHaveBeenCalled();
            expect(Lib._utils.fireCallback).toHaveBeenCalledWith({}, 'addSessionNotification', nofif);
        });

        it('should stores sessions if call doesnt match', function() {
            Lib._getUIModel().getInstance().currentCall = {
                uii: "4321"
            };

            var data = {
                ui_notification: {
                    uii: {
                        '#text': "1234"
                    },
                    session_id: {
                        '#text': "1"
                    }
                }
            };
            var utils = new Lib._NewCallUtils({}, data);
            utils.setupAddSessionCallback();

            new Lib.getAddSessionNotification().processResponse(data);
            expect(Lib._utils.fireCallback).not.toHaveBeenCalled();

            var sessions = Lib._getUIModel().getInstance().pendingNewCallSessions;
            expect(sessions).toBeDefined();
            expect(sessions['1234']).toBeDefined();
            expect(sessions['1234']['1']).toBeDefined();
            expect(sessions['1234']['1'].instance).toBeDefined();
            expect(sessions['1234']['1'].data).toBeDefined();
        });

        it('should fire stored session callbacks when processing a new call', function() {
            var session1 = {
                ui_notification: {
                    uii: {
                        '#text': "1234"
                    },
                    session_id: {
                        '#text': "1"
                    }
                }
            };

            var session2 = {
                ui_notification: {
                    uii: {
                        '#text': "1234"
                    },
                    session_id: {
                        '#text': "2"
                    }
                }
            };

            // save sessions on model
            var utils1 = new Lib._NewCallUtils({}, session1);
            utils1.setupAddSessionCallback();

            var utils2 = new Lib._NewCallUtils({}, session2);
            utils2.setupAddSessionCallback();

            Lib._getUIModel().getInstance().currentCall = {
                uii: "1234"
            };

            var utils = new Lib._NewCallUtils();
            utils.processSessionsForCall();

            var notif1 = new Lib.getAddSessionNotification().processResponse(session1);
            var notif2 = new Lib.getAddSessionNotification().processResponse(session2);
            expect(Lib._utils.fireCallback.callCount).toBe(2);
            expect(Lib._utils.fireCallback).toHaveBeenCalledWith({}, 'addSessionNotification', notif1);
            expect(Lib._utils.fireCallback).toHaveBeenCalledWith({}, 'addSessionNotification', notif2);
        });
    });
});
