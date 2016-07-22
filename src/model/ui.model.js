var UIModel = (function() {

    var instance;

    function init() {
        // Singleton

        // Private methods and variables here //
        function privateMethod(){
            console.log( "I am private" );
        }

        var privateVariable = "I'm also private";

        // Public methods and variables
        return {

            // application state
            isLoggedInIS : false,               // a check for whether or not user is logged in with IntelliServices
            socketConnected : false,

            // request packets
            loginRequest : null,                // Original LoginRequest sent to IS - used for reconnects
            configRequest : null,
            logoutRequest : null,
            agentStateRequest : null,

            // campaign info
            allowLeadUpdatesByCampaign : {},    // For each campaign ID, store whether leads can be updated

            // current user state
            allowCallControl : true,            // Set from the the login response packet
            allowChat : false,                  // Controls whether or not the user has the option to open the Chat Queue Manager
            showLeadHistory : true,             // Controls whether or not the agents can view lead history
            allowLeadInserts : false,           // Controls whether or not the agents can insert leads
            allowOffHook : true,                // Controls whether or not the agents can go offhook
            allowManualCalls : true,            // Controls whether or not the agents have the option to make a manual outbound call
            allowManualPass : true,             // Controls whether or not the agent has the option to make a manual pass on a lead
            allowManualIntlCalls : false,       // Controls whether or not the agent has the option to make international manual outbound calls
            allowManualOutboundGates : false,   // Controls whether or not the agent has the option to select queues to convert manual outbound calls to
            allowLoginUpdates : true,           // Controls whether or not the agent can update their login
            tcpaSafeModeSet : false,            //Comes in at the account-level - will get set to true if this interface should be in tcpa-safe-mode only.


            // chat
            alias : ""                          // Chat alias, on-login this is the UID, but is changed if the user changes it.

            //publicMethod: function () {
            //    console.log( "The public can see me!" );
            //},


        };
    }


    return {
        // Get the Singleton instance if one exists
        // or create one if it doesn't
        getInstance: function () {
            if (!instance) {
                instance = init();
            }
            return instance;
        }
    };

})();
