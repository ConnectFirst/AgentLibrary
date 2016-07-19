/**
 * @fileOverview Exposed functionality for Connect First AgentUI.
 * @author <a href="mailto:dlbooks@connectfirst.com">Danielle Lamb-Books </a>
 * @version 0.0.1
 */


;(function (global) {

// GLOBAL is a reference to the global Object.
var Fn = Function, GLOBAL = new Fn('return this')();

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

        this.helloStr = "Hello World";
        this._callbacks = {};

        return this;
    };

    // LIBRARY PROTOTYPE METHODS
    //
    // These methods define the public API.

}

function initAgentLibrarySocket (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    AgentLibrary.prototype.hello = function() {
        /*var instance = this;
        return new Promise(function(resolve, reject) {
            resolve(instance.helloStr);
        });*/

        this._callbacks.helloResponse = callback;

        return this.helloStr;
    };

    AgentLibrary.prototype.helloResponse = function() {
        this._callbacks.helloResponse.call(this,"test arg");

    };

    AgentLibrary.prototype.openSocket = function(callback){
        var instance = this;
        instance._callbacks.openResponse = callback;
        if("WebSocket" in context){
            console.log("attempting to open socket connection...");
            this.socket = new WebSocket(this.socketDest);

            this.socket.onopen = function() {
                console.log("websocket opened");
                socketOpened(instance);
            };

            this.socket.onmessage = function(evt){
                var receivedMsg = evt.data;
                console.log("received message...");
                console.log(receivedMsg);

                processMessage(instance, receivedMsg);
            };

            //return this.socket;
        }else{
            console.log("WebSocket NOT supported by your Browser.");
        }

    };


    AgentLibrary.prototype.closeSocket = function(){
        this.socket.onclose = function(){
            // websocket is closed
            console.log("websocket closed");
        };
    };

    AgentLibrary.prototype.loginAgent = function(msg, callback){
        this._callbacks.loginResponse = callback;
        sendMessage(this, msg);
    };

    function sendMessage(instance, msg){
        console.log("sending message...");
        console.log(AgentLibrary);
        instance.socket.send(msg);
    }

    function processMessage(instance, response) {
        console.log("processing message...");

        var type = response.ui_response['@type'];
        console.log("message type: " + type);

        if(type === 'login'){
            instance._callbacks.loginResponse.call(instance, response);
        }
    }

    function socketOpened(instance){
        instance._callbacks.openResponse.call(instance);
    }
}

var initAgentLibrary = function (context) {

    initAgentLibraryCore(context);
    initAgentLibrarySocket(context);

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