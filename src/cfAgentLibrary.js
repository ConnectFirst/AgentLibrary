/**
 * Created by dlbooks on 7/14/16.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.cfAgentLibrary = factory();
    }
}(this, function () {
    "use strict";

    // public object
    var exports = {};

    exports.hello = function() {
        return "Hello World";
    };

    exports.greet = function() {
        var name = "Agent Library";
        alert("Hello from the " + name);
    };

    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return exports;
}));