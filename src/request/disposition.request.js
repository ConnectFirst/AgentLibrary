
var DispositionRequest = function(uii, dispId, notes, callback, callbackDTS, contactForwardNumber, survey) {
    this.uii = uii;
    this.dispId = dispId;
    this.notes = notes;
    this.callback = callback;
    this.callbackDTS = callbackDTS || "";
    this.contactForwardNumber = contactForwardNumber || null;

    /*
     * survey = [
     *      { label: "", externId: "", leadUpdateColumn: ""}
     * ]
     */
    this.survey = survey || null;
};

/*
 * This class is responsible for creating an inbound or outbound disposition packet to
 * send to intelliqueue. It will grab uii and agent_id directly from packets saved
 * in the UIModel. Then, using the information passed in, it will
 * create the remainder of the packet. This class is called from the ExtendedCallForm
 *
 * <ui_request response_to="" message_id="UIV220089241119416" type="OUTDIAL-DISPOSITION|INBOUND-DISPOSITION">
 * 		<uii>200809241119590139990000000069</uii>
 * 		<lead_id>213215</lead_id>
 * 		<outbound_externid>909809</outbound_externid>
 * 		<agent_id>1810</agent_id>
 * 		<disposition_id>126</disposition_id>
 * 		<notes>here are my notes :)</notes>
 * 		<call_back>TRUE | FALSE</call_back>
 * 		<call_back_DTS>2008-09-30 22:30:00 | null</call_back_DTS>
 * 		<contact_forward_number>5555555555 | null</contact_forward_number>
 * 		<session_id>2</session_id>  ONLY WHEN AVAILABLE otherwise the node is left blank. this is the AGENT session_id
 * </ui_request>
 *
 */
DispositionRequest.prototype.formatJSON = function() {
    var model = UIModel.getInstance();
    var msg = {
        "ui_request": {
            "@destination":"IQ",
            "@message_id":utils.getMessageId(),
            "@response_to":"",
            "@type":MESSAGE_TYPES.OUTDIAL_DISPOSITION,
            "agent_id": {
                "#text" : utils.toString(model.agentSettings.agentId)
            },
            "session_id":{
                "#text": ""
            },
            "uii": {
                "#text" : utils.toString(this.uii)
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
            "contact_forwarding": {
                "#text" : utils.toString(this.contactForwardNumber)
            }
        }
    };


    if(model.currentCall.outdialDispositions && model.currentCall.outdialDispositions.type === "GATE") {
        msg.ui_request['@type'] = MESSAGE_TYPES.INBOUND_DISPOSITION;
    }

    if(model.currentCall.sessionId){
        msg.ui_request.session_id = {"#text":model.currentCall.sessionId};
    }

    /*
     * survey : {
     *      response: [
     *          { "@extern_id":"", "@lead_update_column":"", "#text":"" }
     *      ]
     * }
     */
    if(this.survey !== null){
        var response = [];
        for(var i = 0; i < this.survey.length; i++){
            var obj = {
                "@extern_id": utils.toString(this.survey[i].externId),
                "@lead_update_column": utils.toString(this.survey[i].leadUpdateColumn),
                "#text": this.survey[i].label
            };
            response.push(obj);
        }
        msg.ui_request.survey = {"response":response};
    }


    return JSON.stringify(msg);
};
