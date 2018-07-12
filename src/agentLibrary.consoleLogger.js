function initAgentLibraryConsoleLogger(context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    AgentLibrary.prototype.openConsoleLogger = function() {
        var instance = this;

        if("indexedDB" in context){
            var dbRequest = indexedDB.open("AgentLibraryConsoleLogging", 1);

            dbRequest.onerror = function(event){
                console.error("Error requesting DB access");
            };

            dbRequest.onsuccess = function(event){
                instance._consoleDb = event.target.result;

                //prune items older than 2 days
                instance.purgeLog(instance._consoleDb, "consoleLogger");

                instance._consoleDb.onerror = function(event) {
                    // Generic error handler for all errors targeted at this database requests
                    console.error("AgentLibrary: Database error - " + event.target.errorCode);
                };

                instance._consoleDb.onsuccess = function(event) {
                    console.log("AgentLibrary: Successful logging of record");
                };

                _overrideConsole();
            };

            // This event is only implemented in recent browsers
            dbRequest.onupgradeneeded = function(event) {
                instance._consoleDb = event.target.result;

                // Create an objectStore to hold log information. Key path should be unique
                if(!instance._consoleDb.objectStoreNames.contains("consoleLogger")){
                    var objectStore = instance._consoleDb.createObjectStore("consoleLogger", { autoIncrement: true });

                    // simple indicies: index name, index column path
                    objectStore.createIndex("type", "type", {unique: false});
                    objectStore.createIndex("dts", "dts", {unique: false});
                    objectStore.createIndex("agentId", "agentId", {unique: false});

                    // index for type and agent id
                    var name = "typeAndAgent";
                    var keyPath = ['type', 'agentId'];
                    objectStore.createIndex(name, keyPath, {unique: false});
                }

                _overrideConsole();
            };

        } else {
            console.warn("AgentLibrary: indexedDB NOT supported by your Browser.");
        }
    };

    AgentLibrary.prototype.getConsoleLogRecords = function(type, callback) {
        var agentId = this.agentSettings.agentId;   // only return records for this agent id
        var instance = this;
        var transaction = instance._db.transaction(["logger"], "readonly");
        var objStore = transaction.objectStore("logger");
        var index = null,
            cursor = null,
            range = null;

        utils.setCallback(instance, CALLBACK_TYPES.LOG_CONSOLE_RESULTS, callback);

        var result = [];
        if(type) {
            // everything with this type
            index = objStore.index("typeAndAgent");
            range = IDBKeyRange.only([type.toUpperCase(), agentId]);
        } else {
            index = objStore.index("agentId");
            range = IDBKeyRange.only(agentId);
        }

        index.openCursor(range, "prev").onsuccess = function(event){
            cursor = event.target.result;
            if(cursor) {
                result.push(cursor.value);
                cursor.continue();
            } else {
                utils.fireCallback(instance, CALLBACK_TYPES.LOG_CONSOLE_RESULTS, result);
            }
        };
    };

    function _overrideConsole() {
        // override the window.console functions, process as normal then save to the local db
        var browserConsole = Object.assign({}, window.console);
        (function (defaultConsole) {
            var instance = UIModel.getInstance().libraryInstance;
            var agentSettings = UIModel.getInstance().agentSettings;

            function _getRecord(type, text) {
                if(typeof text === 'function') {
                    text = text.toString();
                } else if(typeof text === 'object') {
                    try {
                        text = JSON.stringify(text);
                    } catch(e) {}
                }

                return {
                    type: type,
                    message: text,
                    dts: new Date(),
                    agentId: agentSettings.agentId,
                    agentName: agentSettings.firstName + ' ' + agentSettings.lastName
                };
            }

            function _saveRecord(type, text) {
                if (instance._consoleDb) {
                    var transaction = instance._consoleDb.transaction(["consoleLogger"], "readwrite");
                    var store = transaction.objectStore("consoleLogger");

                    store.add(_getRecord(type, text));
                }
            }

            window.console.log = function(text) {
                defaultConsole.log(text);
                _saveRecord('LOG', text);
            };
            window.console.info = function(text) {
                defaultConsole.info(text);
                _saveRecord('INFO', text);
            };
            window.console.warn = function(text) {
                defaultConsole.warn(text);
                _saveRecord('WARN', text);
            };
            window.console.error = function(text) {
                defaultConsole.error(text);
                _saveRecord('ERROR', text);
            };
        }(browserConsole));
    }
}
