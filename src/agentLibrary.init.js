var initAgentLibrary = function (context) {

    initAgentLibraryCore(context);
    initAgentLibrarySocket(context);
    initAgentLibraryAgent(context);
    initAgentLibraryCall(context);
    initAgentLibraryLead(context);
    initAgentLibraryChat(context);
    initAgentLibraryLogger(context);
    initAgentLibraryConsoleLogger(context);

    return context.AgentLibrary;
};

if (typeof define === 'function' && define.amd) {
    // Expose Library as an AMD module if it's loaded with RequireJS or
    // similar.
    //console.log("AgentLibrary: using AMD");
    define(function () {
        return initAgentLibrary({});
    });
} else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    //console.log("AgentLibrary: Using Node");
    module.exports = initAgentLibrary(this);
} else {
    // Load Library normally (creating a Library global) if not using an AMD
    // loader.
    //console.log("AgentLibrary: Not using AMD");
    initAgentLibrary(this);
}
