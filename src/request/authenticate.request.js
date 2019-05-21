
var AuthenticateRequest = function(username, password, platformId, jwt, tokenType, engageAuthtoken) {
    this.username = username;
    this.password = password;
    this.platformId = platformId;
    this.jwt = jwt;
    this.tokenType = tokenType;
    this.engageAuthtoken = engageAuthtoken;
};

AuthenticateRequest.prototype.sendPost = function() {
    var model = UIModel.getInstance();
    var baseUrl = model.authHost + model.baseAuthUri;
    model.authenticateRequest = this;
    if(this.username && this.password && this.platformId){
        // username/password authentication
        var params = {
            headers: {
                "Content-Type": "application/json"
            },
            queryParams: {
                username:this.username,
                password: this.password,
                platformId: this.platformId
            }
        };
        new HttpService(baseUrl).httpPost(
            "login/agent",
            params)
            .then(function(response){
                try{
                    response = JSON.parse(response.response);

                    var authenticateResponse = UIModel.getInstance().authenticateRequest.processResponse(response);
                    utils.fireCallback(UIModel.getInstance().libraryInstance, CALLBACK_TYPES.AUTHENTICATE, authenticateResponse);
                }catch(err){
                    utils.logMessage(LOG_LEVELS.WARN, "Error on agent authenticate with Username/Password", err);
                }
            }, function(err){
                var errResponse = {
                    type: "Authenticate Error",
                    message: "Error authenticating agent with username/password."
                };
                utils.logMessage(LOG_LEVELS.WARN, "error on agent authenticate", err);
                utils.fireCallback(UIModel.getInstance().libraryInstance, CALLBACK_TYPES.AUTHENTICATE, errResponse);
            });
    }else if(this.jwt && this.tokenType){
        // JWT authentication
        var jwtParams = {
            headers: {
                "Content-Type": "application/json"
            },
            queryParams: {
                rcAccessToken:this.jwt,
                rcTokenType: this.tokenType
            }
        };
        new HttpService(baseUrl).httpPost(
            "login/rc/accesstoken",
            jwtParams)
            .then(function(response){
                try{
                    response = JSON.parse(response.response);

                    var authenticateResponse = UIModel.getInstance().authenticateRequest.processResponse(response);
                    utils.fireCallback(UIModel.getInstance().libraryInstance, CALLBACK_TYPES.AUTHENTICATE, authenticateResponse);
                }catch(err){
                    utils.logMessage(LOG_LEVELS.WARN, "Error on agent authenticate with JWT", err);
                }
            }, function(err){
                var errResponse = {
                    type: "Authenticate Error",
                    message: "Error authenticating agent with RC JSON web token."
                };
                utils.logMessage(LOG_LEVELS.WARN, "error on agent authenticate", err);
                utils.fireCallback(UIModel.getInstance().libraryInstance, CALLBACK_TYPES.AUTHENTICATE, errResponse);
            });
    }else if(this.engageAuthtoken) {
        // Engage Auth Access Token Authentication
        var authParams = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + utils.toString(this.engageAuthtoken)
            }
        };
        new HttpService(baseUrl).httpGet(
            "user",
            authParams)
            .then(function (response) {
                try {
                    response = JSON.parse(response.response);

                    var authenticateResponse = UIModel.getInstance().authenticateRequest.processResponse(response);
                    utils.fireCallback(UIModel.getInstance().libraryInstance, CALLBACK_TYPES.AUTHENTICATE, authenticateResponse);
                } catch (err) {
                    utils.logMessage(LOG_LEVELS.WARN, "Error on agent authenticate with Engage Auth access token", err);
                }
            }, function (err) {
                var errResponse = {
                    type: "Authenticate Error",
                    message: "Error authenticating agent with Engage Auth access token."
                };
                utils.logMessage(LOG_LEVELS.WARN, "error on agent authenticate", err);
                utils.fireCallback(UIModel.getInstance().libraryInstance, CALLBACK_TYPES.AUTHENTICATE, errResponse);
            });
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
