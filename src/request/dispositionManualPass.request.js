
var DispositionManualPassRequest = function(dispId, notes, callback, callbackDTS, leadId, requestKey, externId) {
    this.dispId = dispId;
    this.notes = notes;
    this.callback = callback;
    this.callbackDTS = callbackDTS || "";
    this.leadId = leadId || null;
    this.requestKey = requestKey || null;
    this.externId = externId || null;
};

/*
 * Sends an OUTDIAL-DISPOSITION request, just a separate class
 * specifically for dispositions on manual pass.
 *
 * <ui_request response_to="" message_id="UIV220089241119416" type="OUTDIAL-DISPOSITION">
 *      <manual_disp>TRUE</manual_disp>
 *      <request_key>IQ10012016081719070100875</request_key>
 *      <session_id/>
 * 		<uii/>
 * 	    <agent_id>1810</agent_id>
 * 		<lead_id>213215</lead_id>
 * 		<outbound_externid>909809</outbound_externid>
 * 		<disposition_id>126</disposition_id>
 * 		<notes>here are my notes :)</notes>
 * 		<call_back>TRUE | FALSE</call_back>
 * 		<call_back_DTS>2008-09-30 22:30:00 | null</call_back_DTS>
 * 	    <contact_forwarding>null</contact_forwarding>
 * </ui_request>
 *
 */
DispositionManualPassRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "@type":MESSAGE_TYPES.OUTDIAL_DISPOSITION,
            "manual_disp": {
                "#text" : "TRUE"
            },
            "agent_id": {
                "#text" : utils.toString(model.agentSettings.agentId)
            },
            "request_key": {
                "#text": utils.toString(this.requestKey)
            },
            "disposition_id": {
                "#text" : utils.toString(this.dispId)
            },
            "notes": {
                "#text" : utils.toString(this.notes)
            },
            "call_back": {
                "#text" : this.callback === true? "TRUE" : "FALSE"
            },
            "call_back_DTS": {
                "#text" : utils.toString(this.callbackDTS)
            },
            "lead_id": {
                "#text" : utils.toString(this.leadId)
            },
            "extern_id": {
                "#text" : utils.toString(this.externId)
            },
            "contact_forwarding": {
                "#text": "null"
            },
            "session_id":{},
            "uii": {}
        }
    };

    return JSON.stringify(msg);
};
