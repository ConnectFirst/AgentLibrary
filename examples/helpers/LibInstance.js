require('../../dist/agentLibrary');
require('./InitGlobals');

const callbacks = require('./NoopCallbacks').callbacks;

let Lib = null;

module.exports.get = function(callbackOverrides) {
  // use the existing instance
  if (Lib) {
    return Lib;
  }

  var config = {
    authHost: window.location.origin,
    callbacks: Object.assign(callbackOverrides, callbacks),
    isSecureSocket: false
  };
  Lib = new AgentLibrary(config);

  return Lib;
};
