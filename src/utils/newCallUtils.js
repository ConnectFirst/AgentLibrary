function NewCallUtils(instance, data) {
    this.instance = instance;
    this.data = data;

    var that = this;

    this.setupAddSessionCallback = function() {
        var sessionUii = utils.getText(data.ui_notification, "uii"),
            sessionId = utils.getText(data.ui_notification, "session_id"),
            call = UIModel.getInstance().currentCall;

        if(call.uii === sessionUii) {
            // we already have a new call packet for this session
            _delayedAddSessionCallback(that.instance, that.data);

        } else {
            // uii mismatch, but call has been dispositioned
            UIModel.getInstance().pendingNewCallSessions[sessionUii] = UIModel.getInstance().pendingNewCallSessions[sessionUii] || {};
            UIModel.getInstance().pendingNewCallSessions[sessionUii][sessionId] = that;
        }
    };

    this.processSessionsForCall = function() {
        var uii = UIModel.getInstance().currentCall.uii,
            delayedSessions = UIModel.getInstance().pendingNewCallSessions[uii];

        if(delayedSessions && Object.keys(delayedSessions).length > 0) {
            // we have delayed sessions to process
            for(var sessionId in delayedSessions) {
                if(delayedSessions.hasOwnProperty(sessionId)) {
                    var session = delayedSessions[sessionId];
                    _delayedAddSessionCallback(session.instance, session.data);
                } else {
                    console.error('error processing sessions for uii: ' + uii + ' session: ' + sessionId );
                }
            }

            delete UIModel.getInstance().pendingNewCallSessions[uii];
        }
    };

    function _delayedAddSessionCallback(instance, data) {
        var addSessionNotif = new AddSessionNotification();
        var addResponse = addSessionNotif.processResponse(data);
        utils.fireCallback(instance, CALLBACK_TYPES.ADD_SESSION, addResponse);
    }
}
