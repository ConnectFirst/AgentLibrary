var UIModel = (function() {

    var instance;

    function init() {
        // Singleton

        // Private methods and variables here //
        //function privateMethod(){
        //    console.log( "I am private" );
        //}
        //
        //var privateVariable = "I'm also private";

        // Public methods and variables
        return {

            currentCall: {},                        // save the NEW-CALL notification in parsed form
            callTokens:{},                          // Stores a map of all tokens for a call
            callbacks:[],
            libraryInstance: null,                  // Initialized to the library instance on startup
            pingIntervalId: null,                   // The id of the timer used to send ping-call messages
            statsIntervalId: null,                  // The id of the timer used to send stats request messages
            agentDailyIntervalId: null,             // The id of the timer used to update some agent daily stats values

            // internal chat requests
            chatAliasRequest : null,
            chatRoomRequest : null,
            chatSendRequest : null,
            supervisorListRequest : null,
            chatRoomStateRequest : new ChatRoomStateRequest(),

            // external chat requests/notifications
            chatActiveNotification : new ChatActiveNotification(),
            chatInactiveNotification : new ChatInactiveNotification(),
            chatDispositionRequest : null,
            chatMessageRequest : new ChatMessageRequest(),
            chatPresentedNotification : new ChatPresentedNotification(),
            chatPresentedRequest : null,
            chatRequeueRequest : null,
            chatTypingNotification : new ChatTypingNotification(),
            chatTypingRequest : null,
            newChatNotification : new NewChatNotification(),

            // request instances
            agentStateRequest : null,
            ackRequest : new AckRequest(),
            bargeInRequest : null,
            callNotesRequest : null,
            callbacksPendingRequest : null,
            campaignDispositionsRequest : null,
            configRequest : null,
            coldXferRequest : null,
            dispositionRequest : null,
            dispositionManualPassRequest : null,
            hangupRequest : null,
            holdRequest : null,
            leadHistoryRequest : null,
            leadInsertRequest : null,
            leadUpdateRequest : null,
            logoutRequest : null,
            loginRequest : null,                // Original LoginRequest sent to IS - used for reconnects
            offhookInitRequest : null,
            offhookTermRequest : null,
            oneToOneOutdialRequest : null,
            oneToOneOutdialCancelRequest : null,
            pauseRecordRequest : null,
            pingCallRequest : null,
            previewDialRequest : null,
            reconnectRequest : null,
            recordRequest : null,
            requeueRequest : null,
            statsRequest : null,
            tcpaSafeRequest : null,
            warmXferRequest : null,
            warmXferCancelRequest : null,

            // response packets
            agentStatePacket : null,
            configPacket : null,
            currentCallPacket : null,
            loginPacket : null,
            offhookInitPacket : null,
            offhookTermPacket : null,
            transferSessions: {},

            // notification packets
            addSessionNotification: new AddSessionNotification(),
            dialGroupChangeNotification : new DialGroupChangeNotification(),
            dialGroupChangePendingNotification : new DialGroupChangePendingNotification(),
            dropSessionNotification: new DropSessionNotification(),
            earlyUiiNotification: new EarlyUiiNotification(),
            endCallNotification : new EndCallNotification(),
            gatesChangeNotification : new GatesChangeNotification(),
            genericNotification : new GenericNotification(),
            newCallNotification: new NewCallNotification(),

            // stats packets
            agentStatsPacket: new AgentStats(),
            agentDailyStatsPacket: new AgentDailyStats(),
            queueStatsPacket: new QueueStats(),
            campaignStatsPacket: new CampaignStats(),

            // application state
            applicationSettings : {
                availableCountries : [],
                isLoggedInIS : false,               // a check for whether or not user is logged in with IntelliServices
                socketConnected : false,
                socketDest : "",
                isTcpaSafeMode : false             // Comes in at the account-level - will get set to true if this interface should be in tcpa-safe-mode only.
            },

            // stat objects
            agentStats:[],
            agentDailyStats: {},
            campaignStats:{},
            queueStats:{},

            // current agent settings
            agentSettings : {
                accountId: null,                    // account agent belongs to
                agentId : 0,
                agentType : "AGENT",                // AGENT | SUPERVISOR
                altDefaultLoginDest : "",
                availableAgentStates : [],
                callerIds : [],
                callState: null,                     // display the current state of the call
                currentState : "OFFLINE",           // Agent system/base state
                currentStateLabel : "",             // Agent aux state label
                defaultLoginDest : "",
                dialDest : "",                      // Destination agent is logged in with for offhook session, set on configure response, if multi values in format "xxxx|,,xxxx"
                email : "",
                externalAgentId : "",
                firstName : "",
                guid: "",                           // unique key generated on login, used for accessing spring endpoints
                isLoggedIn : false,                 // agent is logged in to the platform
                isOffhook : false,                  // track whether or not the agent has an active offhook session
                initLoginState : "AVAILABLE",       // state agent is placed in on successful login
                initLoginStateLabel : "Available",  // state label for agent on successful login
                isOutboundPrepay : false,           // determines if agent is a prepay agent
                lastName : "",
                loginDTS : null,                    // date and time of the final login phase (IQ)
                loginType : "NO-SELECTION",         // Could be INBOUND | OUTBOUND | BLENDED | NO-SELECTION, set on login response
                maxBreakTime : -1,
                maxLunchTime : -1,
                onCall : false,                     // true if agent is on an active call
                onManualOutdial : false,            // true if agent is on a manual outdial call
                outboundManualDefaultRingtime : "30",
                pendingCallbacks : [],
                pendingDialGroupChange: 0,          // Set to Dial Group Id if we are waiting to change dial groups until agent ends call
                phoneLoginPin: "",
                realAgentType : "AGENT",
                supervisors : [],                   // Used for agent chat
                totalCalls : 0,                     // Call counter that is incremented every time a new session is received
                transferNumber : "",                // May be pre-populated by an external interface, if so, the transfer functionality uses it
                updateDGFromAdminUI : false,        // if pending Dial Group change came from AdminUI, set to true (only used if request is pending)
                updateLoginMode : false,            // gets set to true when doing an update login (for events control)
                username : "",                      // Agent's username
                wasMonitoring : false               // used to track if the last call was a monitoring call
            },

            // current agent permissions
            agentPermissions : {
                allowBlended : true,                // Controls whether or not the agent can log into both inbound queues and an outbound dialgroup
                allowCallControl : true,            // Set from the the login response packet
                allowChat : false,                  // Controls whether or not the agent has the option to open the Chat Queue Manager
                allowCrossQueueRequeue : false,     // Controls whether or not the agent can requeue to a different queue group
                allowInbound : true,                // Controls whether or not the agent can log into an inbound queue
                allowLeadInserts : false,           // Controls whether or not the agents can insert leads
                allowLeadSearch : false,            // Controlled by the dial-group allow_lead_search setting. Enables or disables the lead search
                allowLoginControl : true,           // Controls whether or not the agent can log in
                allowLoginUpdates : true,           // Controls whether or not the agent can update their login
                allowManualCalls : true,            // Controls whether or not the agents have the option to make a manual outbound call
                allowManualPass : true,             // Controls whether or not the agent has the option to make a manual pass on a lead
                allowManualIntlCalls : false,       // Controls whether or not the agent has the option to make international manual outbound calls
                allowManualOutboundGates : false,   // Controls whether or not the agent has the option to select queues to convert manual outbound calls to
                allowOffHook : true,                // Controls whether or not the agents can go offhook
                allowOutbound : true,               // Controls whether or not the agent can log into an outdial group
                allowPreviewLeadFilters : false,    // Controlled by the dial-group allow_preview_lead_filters setting. Enables or disables the filters on the preview style forms
                allowLeadUpdatesByCampaign : {},    // For each campaign ID, store whether leads can be updated
                disableSupervisorMonitoring : true, // Controls whether or not a supervisor can view agent stats
                progressiveEnabled : false,         // Preview dial feature that enables auto-calls from the preview window.
                requireFetchedLeadsCalled : false,  // Controlled by the dial-group require_fetched_leads_called setting. Enables or disables the requirement to only fetch new leads when current leads are called or expired. ONly for Preview or TCPA-SAFE.
                showLeadHistory : true              // Controls whether or not the agents can view lead history
            },

            // chat
            chatSettings :{
                availableChatQueues : [],           // List of all chat queues agent has access to, set on login
                availableChatRooms : [],            // List of all chat rooms agent has access to, set on login
                chatQueues : [],                    // Array of chat queues agent is signed into
                alias : ""                          // Chat alias, on-login this is the UID, but is changed if the user changes it
            },

            // connection objects
            connectionSettings : {
                hashCode : null,                    // used specifically for reconnects
                reconnect : false                   // variable tracks the type of login, on init it's false...once connected it's set to true
            },

            // inbound settings
            inboundSettings : {
                availableQueues : [],               // array of queues agent has access to, set on login
                availableSkillProfiles : [],        // array of skill profiles agent has access to, set on login
                queues : [],                        // array of queues agent is signed into, set on config response
                skillProfile : {}                   // The skill profile the agent is signed into, set on config response
            },

            // outbound settings
            outboundSettings : {
                availableCampaigns : [],            // array of campaigns agent has access to, set on login
                availableOutdialGroups : [],        // array of dial groups agent has access to, set on login
                insertCampaigns : [],
                defaultDialGroup: 0,
                outdialGroup : {},                  // dial group agent is signed into
                previewDialLeads : [],              // list of leads returned from preview dial request
                tcpaSafeLeads : [],                 // list of leads returned from tcpa safe request
                campaignDispositions : []           // list of campaign dispositions for specific campaign
            },

            scriptSettings : {
                availableScripts : [],              // array of all scripts associated with any campaigns or queues agent is logged into
                loadedScripts: {}                   // stores script data by script id e.g. {1:{}, 32:{}}
            },


            // Public methods
            incrementTotalCalls: function() {
                this.agentSettings.totalCalls = this.agentSettings.totalCalls + 1;
            }

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
        },

        resetInstance: function () {
            instance = null;
        }
    };

})();

