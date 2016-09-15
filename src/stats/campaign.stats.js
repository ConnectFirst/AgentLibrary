
var CampaignStats = function() {

};


/*
 * This class is responsible for handling a Campaign Stats packet rec'd from IntelliServices.
 * It will save a copy of it in the UIModel.
 *
 * {"ui_stats":{
 *      "@type":"CAMPAIGN",
 *      "campaign":[
 *          {
 *              "@a":"0","@aba":"0","@an":"0","@av":"0","@b":"0","@c":"1","@e":"0","@f":"0",
 *              "@id":"60275","@int":"0","@m":"0","@na":"0","@name":"Test Campaign",
 *              "@p":"0","@r":"1","@s":"0","@tc":"0","@ttt":"0"
 *          },
 *          {
 *              "@a":"0","@aba":"0","@an":"0","@av":"0","@b":"0","@c":"0","@e":"0","@f":"0",
 *              "@id":"60293","@int":"0","@m":"0","@na":"0","@name":"Test Campaign w\\ Search",
 *              "@p":"0","@r":"19","@s":"0","@tc":"0","@ttt":"0"
 *          }
 *     ],
 *     "totals":{
 *          "noanswer":{"#text":"0"},
 *          "totalConnects":{"#text":"0"},
 *          "pending":{"#text":"0"},
 *          "active":{"#text":"0"},
 *          "error":{"#text":"0"},
 *          "totalTalkTime":{"#text":"0"},
 *          "answer":{"#text":"0"},
 *          "abandon":{"#text":"0"},
 *          "ready":{"#text":"20"},
 *          "machine":{"#text":"0"},
 *          "intercept":{"#text":"0"},
 *          "busy":{"#text":"0"},
 *          "complete":{"#text":"1"},
 *          "fax":{"#text":"0"}
 *     }
 *   }
 * }
 */
CampaignStats.prototype.processResponse = function(stats) {
    var resp = stats.ui_stats;
    var totals = utils.processResponseCollection(stats,"ui_stats","totals")[0];
    var campaigns = [];
    var campRaw = {};
    var camp = {};

    if(Array.isArray(resp.campaign)){
        for(var c=0; c< resp.campaign.length; c++){
            campRaw = resp.campaign[c];
            if(campRaw){
                camp = {
                    active:campRaw["@a"],
                    abandon:campRaw["@aba"],
                    answer:campRaw["@an"],
                    available:campRaw["@av"],
                    busy:campRaw["@b"],
                    complete:campRaw["@c"],
                    error:campRaw["@e"],
                    fax:campRaw["@f"],
                    campaignId:campRaw["@id"],
                    intercept:campRaw["@int"],
                    machine:campRaw["@m"],
                    noanswer:campRaw["@na"],
                    campaignName:campRaw["@name"],
                    pending:campRaw["@p"],
                    ready:campRaw["@r"],
                    staffed:campRaw["@s"],
                    totalConnects:campRaw["@tc"],
                    totalTalkTime:campRaw["@ttt"]
                };
            }

            campaigns.push(camp);
        }
    }else{
        campRaw = resp.campaign;
        if(campRaw){
            camp = {
                active:campRaw["@a"],
                abandon:campRaw["@aba"],
                answer:campRaw["@an"],
                available:campRaw["@av"],
                busy:campRaw["@b"],
                complete:campRaw["@c"],
                error:campRaw["@e"],
                fax:campRaw["@f"],
                campaignId:campRaw["@id"],
                intercept:campRaw["@int"],
                machine:campRaw["@m"],
                noanswer:campRaw["@na"],
                campaignName:campRaw["@name"],
                pending:campRaw["@p"],
                ready:campRaw["@r"],
                staffed:campRaw["@s"],
                totalConnects:campRaw["@tc"],
                totalTalkTime:campRaw["@ttt"]
            };
        }

        campaigns.push(camp);
    }

    var campaignStats = {
        type:resp["@type"],
        campaigns: campaigns,
        totals:totals
    };

    UIModel.getInstance().campaignStats = campaignStats;

    return campaignStats;
};
