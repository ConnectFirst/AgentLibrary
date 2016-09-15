
var QueueStats = function() {

};


/*
 * This class is responsible for handling an Queue Stats packet rec'd from IntelliServices.
 * It will save a copy of it in the UIModel.
 *
 * {
 *   "ui_stats":{
 *       "@type":"GATE",
 *       "gate":{
 *           "@aba":"0","@active":"0","@ans":"0","@asa":"00.0","@avail":"2",
 *           "@avga":"00.0","@avgq":"00.0","@avgt":"00.0","@def":"0","@id":"12126",
 *           "@inq":"0","@long_c":"0","@longq":"0","@name":"Cris inbound",
 *           "@pres":"0","@route":"0","@short_aba":"0","@short_c":"0","@sla":"100.0",
 *           "@sla_f":"0","@sla_p":"0","@staff":"2","@t_aba":"0","@t_q":"0","@t_soa":"0","@util":"00.0"
 *       },
 *       "totals":{
 *           "inQueue":{"#text":"0"},
 *           "answered":{"#text":"0"},
 *           "totalABATime":{"#text":"0"},
 *           "active":{"#text":"0"},
 *           "longCall":{"#text":"0"},
 *           "shortCall":{"#text":"0"},
 *           "slaPass":{"#text":"0"},
 *           "totalQueueTime":{"#text":"0"},
 *           "routing":{"#text":"0"},
 *           "totalTalkTime":{"#text":"0"},
 *           "shortAbandon":{"#text":"0"},
 *           "presented":{"#text":"0"},
 *           "totalSOA":{"#text":"0"},
 *           "slaFail":{"#text":"0"},
 *           "deflected":{"#text":"0"},
 *           "abandoned":{"#text":"0"}
 *      }
 *   }
 * }
 */
QueueStats.prototype.processResponse = function(stats) {
    var resp = stats.ui_stats;
    var totals = utils.processResponseCollection(stats,"ui_stats","totals")[0];
    var queues = [];
    var gate = {};
    var gateRaw = {};

    if(Array.isArray(resp.gate)){
        for(var c=0; c< resp.gate.length; c++){
            gateRaw = resp.gate[c];
            if(gateRaw){
                gate = {
                    abandon:gateRaw["@aba"],
                    active:gateRaw["@active"],
                    answer:gateRaw["@ans"],
                    asa:gateRaw["@asa"],
                    available:gateRaw["@avail"],
                    avgAbandon:gateRaw["@avga"],
                    avgQueue:gateRaw["@avgq"],
                    avgTalk:gateRaw["@avgt"],
                    deflected:gateRaw["@def"],
                    queueId:gateRaw["@id"],
                    inQueue:gateRaw["@inq"],
                    longCall:gateRaw["@long_c"],
                    longestInQueue:gateRaw["@longq"],
                    queueName:gateRaw["@name"],
                    presented:gateRaw["@pres"],
                    routing:gateRaw["@route"],
                    shortAbandon:gateRaw["@short_aba"],
                    shortCall:gateRaw["@short_c"],
                    sla:gateRaw["@sla"],
                    slaPass:gateRaw["@sla_p"],
                    slaFail:gateRaw["@sla_f"],
                    staffed:gateRaw["@staff"],
                    tAbandonTime:gateRaw["@t_aba"],
                    tQueueTime:gateRaw["@t_q"],
                    tSpeedOfAnswer:gateRaw["@t_soa"],
                    utilization:gateRaw["@util"]
                };
            }

            queues.push(gate);
        }
    }else{
        gateRaw = resp.gate;
        if(gateRaw){
            gate = {
                abandon:gateRaw["@aba"],
                active:gateRaw["@active"],
                answer:gateRaw["@ans"],
                asa:gateRaw["@asa"],
                available:gateRaw["@avail"],
                avgAbandon:gateRaw["@avga"],
                avgQueue:gateRaw["@avgq"],
                avgTalk:gateRaw["@avgt"],
                deflected:gateRaw["@def"],
                queueId:gateRaw["@id"],
                inQueue:gateRaw["@inq"],
                longCall:gateRaw["@long_c"],
                longestInQueue:gateRaw["@longq"],
                queueName:gateRaw["@name"],
                presented:gateRaw["@pres"],
                routing:gateRaw["@route"],
                shortAbandon:gateRaw["@short_aba"],
                shortCall:gateRaw["@short_c"],
                sla:gateRaw["@sla"],
                slaPass:gateRaw["@sla_p"],
                slaFail:gateRaw["@sla_f"],
                staffed:gateRaw["@staff"],
                tAbandonTime:gateRaw["@t_aba"],
                tQueueTime:gateRaw["@t_q"],
                tSpeedOfAnswer:gateRaw["@t_soa"],
                utilization:gateRaw["@util"]
            };
        }

        queues.push(gate);
    }

    var queueStats = {
        type:resp["@type"],
        queues: queues,
        totals:totals
    };

    UIModel.getInstance().queueStats = queueStats;

    return queueStats;
};
