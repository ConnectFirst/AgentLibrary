
var ReconnectRequest = function() {

};

ReconnectRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var loginMsg = JSON.parse(model.loginRequest.formatJSON());

    loginMsg.hash_code = {"#text":model.hashCode};
    loginMsg.update_login = {"#text":"FALSE"};
    loginMsg.reconnect = {"#text":"TRUE"};

    return JSON.stringify(loginMsg);
};