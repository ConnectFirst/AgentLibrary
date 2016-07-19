/**
 * @fileOverview Exposed functionality for Connect First AgentUI.
 * @author <a href="mailto:dlbooks@connectfirst.com">Danielle Lamb-Books </a>
 * @version 0.0.1
 */


;(function (global) {


/**
 * Init wrapper for the core module.
 * @param {Object} The Object that the library gets attached to in
 * library.init.js.  If the library was not loaded with an AMD loader such as
 * require.js, this is the global Object.
 */
function initAgentLibraryCore (context) {
    'use strict';

    /**
     * This is the constructor for the Library Object. Note that the constructor is also being
     * attached to the context that the library was loaded in.
     * @param {Object} config Contains any properties that should be used to
     * configure this instance of the library.
     * @constructor
     */
    var AgentLibrary = context.AgentLibrary = function (config) {

        config = config || {};

        if(Object.keys(config).length > 0){
            this.socketDest = config.socketDest;
        }else{
            // todo default socket address?
        }

        var helloStr = AgentLibrary.hello();
        console.log(helloStr);

        this.socket = AgentLibrary.openSocket(this.socketDest);

        return this;
    };

}

function initAgentLibrarySocket (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    AgentLibrary.hello = function() {
        return "Hello World";
    };

    AgentLibrary.openSocket = function(url){
        if("WebSocket" in context){
            console.log("attempting to open socket connection...");
            var ws = new WebSocket(url);

            ws.onopen = function() {
                console.log("websocket opened");
            };

            ws.onmessage = function(evt){
                var receivedMsg = evt.data;
                console.log("received message...");
                console.log(receivedMsg);

                processMessage(receivedMsg);
            };

            return ws;
        }else{
            console.log("WebSocket NOT supported by your Browser.");
        }

    };

    AgentLibrary.sendMessage = function(msg){
        console.log("sending message...");
        AgentLibrary.socket.send(msg);

    };

    AgentLibrary.closeSocket = function(){
        ws.onclose = function(){
            // websocket is closed
            console.log("websocket closed");
        };
    };

    function processMessage(msg) {
        console.log("processing message...");
    }

}

var initAgentLibrary = function (context) {

    initAgentLibraryCore(context);
    initAgentLibrarySocket(context);

    console.log("initAgentLibrary: " + context.AgentLibrary);

    return context.AgentLibrary;
};

if (typeof define === 'function' && define.amd) {
    // Expose Library as an AMD module if it's loaded with RequireJS or
    // similar.
    console.log("using AMD");
    define(function () {
        return initAgentLibrary({});
    });
} else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    console.log("Using Node");
    module.exports = initAgentLibrary(this);
} else {
    // Load Library normally (creating a Library global) if not using an AMD
    // loader.
    console.log("Not using AMD");
    initAgentLibrary(this);

}

}(this));