const LibInstance = require('./helpers/LibInstance');
const EngageAuth = require('engage-auth-js').default;

// override the auth response callback
const Lib = LibInstance.get({
  authenticateResponse: authResponse
});

function authResponse(data) {
  var urlParams = new URLSearchParams($window.location.search);
  var selectedAgentId = urlParams.get('agentId');

  // the login packet will contain a list of available agents to login with
  var found = _.some(data.agents, function(agent) {
    return agent.agentId === parseInt(selectedAgentId);
  });

  // if we have an agent we can log in with, use it
  if (found) {
    Lib.openSocket(selectedAgentId, function(response) {
      // response.error
      // response.reconnect
    });
  }
}

function EngageAuthLogin() {
  console.log('attempting legacy login');
  return EngageAuth.Session.legacyLogin({
    username: 'rm',
    password: 'rm',
    loginType: 'agent',
    platformId: 'aws28'
  }).then((login) => {
    console.log('Legacy Login', login);
  });
}

function InitAgentLib() {
  // authenticate agent
  if (!Lib.socket) {
    Lib.authenticateAgentWithEngageAccessToken(
      EngageAuth.Session.getAccessToken()
    );
  }

  SessionSvc.setIqUrl(EngageAuth.Session.getUserDetails().iqUrl);
}

EngageAuthLogin().then(() => {
  console.log('init agent lib');
  InitAgentLib();
});
