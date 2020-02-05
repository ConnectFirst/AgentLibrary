const lib = require('../dist/agentLibrary');
const NoopCallbacks = require('./helpers/NoopCallbacks');

var config = {
  authHost: '',
  callbacks,
  isSecureSocket: false
};
const Lib = new AgentLibrary(config);
console.log('hello');
