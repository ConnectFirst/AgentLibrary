function initAgentLibraryLogger (context) {

    'use strict';

    var AgentLibrary = context.AgentLibrary;

    AgentLibrary.prototype.openLogger = function(){
        var instance = this;

        if("indexedDB" in context){
            // Open database
            var dbRequest = indexedDB.open("AgentLibraryLogging", 5); // version number

            dbRequest.onerror = function(event){
                console.error("Error requesting DB access");
            };

            dbRequest.onsuccess = function(event){
                instance._db = event.target.result;

                //prune items older than 2 days
                instance.purgeLog();

                instance._db.onerror = function(event){
                    // Generic error handler for all errors targeted at this database requests
                    console.error("AgentLibrary: Database error - " + event.target.errorCode);
                };

                instance._db.onsuccess = function(event){
                    console.log("AgentLibrary: Successful logging of record");
                };
            };

            // This event is only implemented in recent browsers
            dbRequest.onupgradeneeded = function(event){
                instance._db = event.target.result;

                // Create an objectStore to hold log information. Key path should be unique
                if(!instance._db.objectStoreNames.contains("logger")){
                    var objectStore = instance._db.createObjectStore("logger", { autoIncrement: true });

                    // simple indicies: index name, index column path
                    objectStore.createIndex("logLevel", "logLevel", {unique: false});
                    objectStore.createIndex("dts", "dts", {unique: false});

                    // index for logLevel and date range
                    var name = "levelAndDate";
                    var keyPath = ['logLevel','dts'];
                    objectStore.createIndex(name, keyPath, {unique: false});
                }

            };

        }else{
            console.warn("AgentLibrary: indexedDB NOT supported by your Browser.");
        }
    };


    /**
     * Purge records older than 2 days from the AgentLibrary log
     * @memberof AgentLibrary
     */
    AgentLibrary.prototype.purgeLog = function(){
        var instance = this;

        if(instance._db){
            var transaction = instance._db.transaction(["logger"], "readwrite");
            var objectStore = transaction.objectStore("logger");
            var dateIndex = objectStore.index("dts");
            var endDate = new Date();
            endDate.setDate(endDate.getDate() - 2); // two days ago

            var range = IDBKeyRange.upperBound(endDate);
            var destroy = dateIndex.openCursor(range).onsuccess = function(event){
                var cursor = event.target.result;
                if(cursor){
                    objectStore.delete(cursor.primaryKey);
                    cursor.continue();
                }

            };
        }
    };

    /**
     * Clear the AgentLibrary log by emptying the IndexedDB object store
     * @memberof AgentLibrary
     */
    AgentLibrary.prototype.clearLog = function(){
        var instance = this;

        var transaction = instance._db.transaction(["logger"], "readwrite");
        var objectStore = transaction.objectStore("logger");

        var objectStoreRequest = objectStore.clear();

        objectStoreRequest.onsuccess = function(event){
            console.log("AgentLibrary: logger database cleared");
        };
    };

    AgentLibrary.prototype.deleteDB = function(){
        var DBDeleteRequest = indexedDB.deleteDatabase("AgentLibraryLogging");

         DBDeleteRequest.onerror = function(event) {
         console.log("Error deleting database.");
         };

         DBDeleteRequest.onsuccess = function(event) {
         console.log("Database deleted successfully");
         };
    };

    AgentLibrary.prototype.getLogRecords = function(logLevel, startDate, endDate, callback){
        logLevel = logLevel || "";
        var instance = this;
        var transaction = instance._db.transaction(["logger"], "readonly");
        var objStore = transaction.objectStore("logger");
        var index = null,
            cursor = null,
            range = null;
        utils.setCallback(instance, CALLBACK_TYPES.LOG_RESULTS, callback);

        if(logLevel.toUpperCase() !== "ALL") { // looking for specific log level type
            if(startDate && endDate){
                var lowerBound = [logLevel.toLowerCase(), startDate];
                var upperBound = [logLevel.toLowerCase(), endDate];
                range = IDBKeyRange.bound(lowerBound,upperBound);
            }else if(startDate){
                range = IDBKeyRange.lowerBound([logLevel.toLowerCase(), startDate]);
            }else if(endDate){
                range = IDBKeyRange.upperBound([logLevel.toLowerCase(), endDate]);
            }

            if(range !== null){
                // with the provided date range
                var levelAndDateReturn = [];
                index = objStore.index("levelAndDate");
                index.openCursor(range).onsuccess = function(event){
                    cursor = event.target.result;
                    if(cursor){
                        levelAndDateReturn.push(cursor.value);
                        cursor.continue();
                    }
                    utils.fireCallback(instance, CALLBACK_TYPES.LOG_RESULTS, levelAndDateReturn);
                };

            }else{
                // no date range specified, return all within log level
                var logLevelReturn = [];
                index = objStore.index("logLevel");
                index.openCursor(logLevel).onsuccess = function(event){
                    cursor = event.target.result;
                    if(cursor){
                        logLevelReturn.push(cursor.value);
                        cursor.continue();
                    }
                    utils.fireCallback(instance, CALLBACK_TYPES.LOG_RESULTS, logLevelReturn);
                };

            }
        } else { // give us all log level types

            if(startDate && endDate){
                range = IDBKeyRange.bound(startDate,endDate);
            }else if(startDate){
                range = IDBKeyRange.lowerBound(startDate);
            }else if(endDate){
                range = IDBKeyRange.upperBound(endDate);
            }

            if(range !== null){
                // with the provided date range
                var dtsReturn = [];
                index = objStore.index("dts");

                index.openCursor(range).onsuccess = function(event){
                    cursor = event.target.result;
                    if(cursor){
                        dtsReturn.push(cursor.value);
                        cursor.continue();
                    }
                    utils.fireCallback(instance, CALLBACK_TYPES.LOG_RESULTS, dtsReturn);
                };
            }else{
                // no date range specified, return all records
                var allValsReturn = [];
                objStore.openCursor().onsuccess = function(event){
                    cursor = event.target.result;
                    if(cursor){
                        allValsReturn.push(cursor.value);
                        cursor.continue();
                    }
                    utils.fireCallback(instance, CALLBACK_TYPES.LOG_RESULTS, allValsReturn);
                };
            }

        }

        return null;

    };

}