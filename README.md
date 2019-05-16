# AgentSDK

This project is expected to be used as a library to link client agent controls to the Engage Voice system. 
The AgentSDK also connects to the single point of entry authentication flow and is responsible for connecting
the WebSocket used for client messaging after authentication. 

## Setup

### Steps to build this project
- [Install NodeJS](https://nodejs.org/en/download/)
- run the following installs
```
    npm -g install grunt-cli karma
```
- install project dependencies
```
    npm install
```
- compile the project/run tests
```
   npm run compile
```

### Available build scripts
These scripts are available via the gruntfile.js

```
    npm run compile
    npm run build
    npm run test
```

## Documentation
The publicly exposed methods in this library are documented in the `/doc` directory. These files are hosted 
at [https://portal.vacd.biz/cfagent/doc/AgentLibrary.html](https://portal.vacd.biz/cfagent/doc/AgentLibrary.html)

## Getting Started
There are a few steps needed to authenticate and sign in an agent before being able to send and receive requests from the 
Engage Voice system.

1. Initialize the AgentSDK, pass in any needed callback functions. The AgentLibrary constructor expects an object of callbacks
that are set up as key/value pairs, the key representing the name of the callback and the value being the callback function.
    ```
    var Lib = new AgentLibrary({callbacks: objectOfCallbacks});
    ```
2. Authenticate the AgentSDK in one of three ways: username/password (legacy), RC JWT (API use), Engage Auth Access Token 
(Single Point of Entry). Each of these authenticate methods will return a list of available agents associated with the 
provided credentials. 
    - `authenticateAgentWithUsernamePassword(username, password, platformId, callback)`
    - `authenticateAgentWithRcJwt(jwt, tokenType, callback)`
    - `authenticateAgentWithEngageAccessToken(token, callback)`
3. Initialize the socket. Pass in the agent id to the `openSocket()` method for the agent you wish to sign in.
This call will return all the config options for the selected agent.
    ```
    Lib.openSocket(agentId, callback);
    ``` 
4. Log in the agent by passing in the selected configuration settings
    ```
    Lib.loginAgent(dialDest, queueIds, chatIds, skillProfileId, dialGroupId, updateFromAdminUI, isForce, callback);
    ```

## Breaking Changes from version 1.x and 2.x
#### loginAgent()
This method that had been responsible for taking a username/password and passing to IntelliServices for the first phase
login has been removed. There are now three types of authentication methods that are used instead to initiate the agent 
login process:
- `authenticateAgentWithUsernamePassword(username, password, platformId, callback)`
- `authenticateAgentWithRcJwt(jwt, tokenType, callback)`
- `authenticateAgentWithEngageAccessToken(token, callback)`

#### loginAgentCaseSensitive()
This method that had been responsible for the case sensitive first phase login with IntelliServices has been removed.
There are now three types of authentication methods that are used instead to initiate the agent login process:
- `authenticateAgentWithUsernamePassword(username, password, platformId, callback)`
- `authenticateAgentWithRcJwt(jwt, tokenType, callback)`
- `authenticateAgentWithEngageAccessToken(token, callback)`

#### configureAgent()
This method that is responsible for passing the selected agent configure options to IntelliQueue for the second phase 
login has been renamed. It is now called `loginAgent` to more accurately reflect its functionality. The method parameters
have not changed. 

#### openSocket()
In earlier versions of the AgentSDK (previously AgentLibrary), the socket could be set up on library initialization by passing
in the socket host. This process has changed to first require calling one of the authenticate methods to retrieve the 
socket destination and then passing in a specific agent id to the `openSocket()` method. 
The socket is then securely initialized with an access token and agent id. 

The `openSocket()` method will also now send a `LOGIN-PHASE-1` request to IntelliQueue to retrieve agent and environment
values that had previously been returned by the deprecated `loginAgent()` method that sent a request to IntelliServices.

