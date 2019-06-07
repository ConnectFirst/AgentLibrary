
var AuthenticateRequest = function(config) {
    this.username = config.username;
    this.password = config.password;
    this.platformId = config.platformId;
    this.rcAccessToken = config.rcAccessToken;
    this.tokenType = config.tokenType;
    this.engageAccessToken = config.engageAccessToken;
    this.authType = config.authType;
};

AuthenticateRequest.prototype.sendHttpRequest = function() {
    UIModel.getInstance().authenticateRequest = this;
    switch(this.authType){
        case AUTHENTICATE_TYPES.USERNAME_PASSWORD:
            _buildHttpRequest(this.authType, "login/agent", {username:this.username, password: this.password, platformId: this.platformId});
            break;
        case AUTHENTICATE_TYPES.RC_TOKEN:
            _buildHttpRequest(this.authType, "login/rc/accesstoken", {rcAccessToken:this.rcAccessToken, rcTokenType: this.tokenType});
            break;
        case AUTHENTICATE_TYPES.ENGAGE_TOKEN:
            _buildHttpRequest(this.authType, "login", {});
            break;
    }
};

/*
 * response:
 * {
 *   "refreshToken": "223867e6-ad0f-4af1-bbe7-5090d8259065",
 *   "accessToken": "",
 *   "tokenType": "Bearer",
 *   "platformId": "local",
 *   "iqUrl": "d01-dev.vacd.biz",
 *   "port": 8080,
 *   "agentDetails": [
 *       {
 *           "agentId": 1,
 *           "firstName": "D",
 *           "lastName": "LB",
 *           "email": "dlb@somewhere.com",
 *           "username": "dlbooks"
 *       }
 *   ],
 *   "adminId": null,
 *   "mainAccountId": "99990000"
 * }
 */
AuthenticateRequest.prototype.processResponse = function(response) {
    var model = UIModel.getInstance();
    model.authenticatePacket = response; // raw response packet
    model.authenticateRequest.accessToken = response.accessToken; // TODO - dlb - store in local storage
    model.authenticateRequest.refreshToken = response.refreshToken;
    model.authenticateRequest.tokenType = response.tokenType;
    model.authenticateRequest.socketUrl = response.iqUrl;
    model.authenticateRequest.socketPort = response.port;
    model.authenticateRequest.agents = response.agentDetails;

    model.applicationSettings.socketDest = model.socketProtocol + response.iqUrl;
    model.applicationSettings.socketDest += ":" + response.port;
    model.applicationSettings.socketDest += "?access_token=" + response.accessToken;

    return model.authenticateRequest;
};

function _buildHttpRequest(authType, path, queryParams){
    var model = UIModel.getInstance();
    var baseUrl = model.authHost + model.baseAuthUri;
    var params = {
        headers: {
            "Content-Type": "application/json"
        }
    };

    switch(authType){
        case AUTHENTICATE_TYPES.USERNAME_PASSWORD:
        case AUTHENTICATE_TYPES.RC_TOKEN:
            params["queryParams"] = queryParams;
            var errorMsg = "Error on agent authenticate POST to engage-auth. URL: " + baseUrl + path;
            new HttpService(baseUrl).httpPost(
                path,
                params)
                .then(function(response){
                    try{
                        response = JSON.parse(response.response);

                        var authenticateResponse = UIModel.getInstance().authenticateRequest.processResponse(response);
                        utils.fireCallback(UIModel.getInstance().libraryInstance, CALLBACK_TYPES.AUTHENTICATE, authenticateResponse);
                    }catch(err){
                        utils.logMessage(LOG_LEVELS.WARN, errorMsg, err);
                    }
                }, function(err){
                    var errResponse = {
                        type: "Authenticate Error",
                        message: errorMsg
                    };
                    utils.logMessage(LOG_LEVELS.WARN, errorMsg, err);
                    utils.fireCallback(UIModel.getInstance().libraryInstance, CALLBACK_TYPES.AUTHENTICATE, errResponse);
                });
            break;
        case AUTHENTICATE_TYPES.ENGAGE_TOKEN:
            var errMsg = "Error on agent authenticate GET to engage-auth. URL: " + baseUrl + path;
            params.headers["Authorization"] =  "Bearer " + utils.toString(UIModel.getInstance().authenticateRequest.engageAccessToken);
            new HttpService(baseUrl).httpGet(
                path,
                params)
                .then(function (response) {
                    try {
                        response = JSON.parse(response.response);

                        var authenticateResponse = UIModel.getInstance().authenticateRequest.processResponse(response);
                        utils.fireCallback(UIModel.getInstance().libraryInstance, CALLBACK_TYPES.AUTHENTICATE, authenticateResponse);
                    } catch (err) {
                        utils.logMessage(LOG_LEVELS.WARN, errMsg, err);
                    }
                }, function (err) {
                    var errResponse = {
                        type: "Authenticate Error",
                        message: errMsg
                    };
                    if(err.status){
                        errResponse.status = err.status;
                    }
                    utils.logMessage(LOG_LEVELS.WARN, errMsg, err);
                    utils.fireCallback(UIModel.getInstance().libraryInstance, CALLBACK_TYPES.AUTHENTICATE, errResponse);
                });
            break;
    }

}