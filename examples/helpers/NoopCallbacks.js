function noop() {}

const callbacks = {
  // agent functions
  agentStateResponse: noop,
  offhookInitResponse: noop,
  offhookTermNotification: noop,
  agentDebugEmailNotification: noop,
  updateDialDestination: noop,
  // call functions
  addSessionNotification: noop,
  earlyUiiNotification: noop,
  endCallNotification: noop,
  newCallNotification: noop,
  pendingDispNotification: noop,
  holdResponse: noop,
  directAgentTransferResponse: noop,
  directAgentTransferNotification: noop,
  // chat
  chatResponse: noop,
  chatActiveNotification: noop,
  chatCancelledNotification: noop,
  chatClientReconnectNotification: noop,
  chatInactiveNotification: noop,
  chatListResponse: noop,
  chatMessageNotification: noop,
  chatNewNotification: noop,
  chatPresentedNotification: noop,
  chatStateResponse: noop,
  chatTypingNotification: noop,
  pendingChatDispNotification: noop,
  addChatSessionNotification: noop,
  stopAgentChatMonitorNotification: noop,
  // outbound
  dialGroupChangeNotification: noop,
  dialGroupChangePendingNotification: noop,
  leadSearchResponse: noop,
  previewFetchResponse: noop,
  safeModeSearchResponse: noop,
  safeModeFetchResponse: noop,
  previewLeadStateNotification: noop,
  tcpaSafeLeadStateNotification: noop,
  // inbound
  gatesChangeNotification: noop,
  // session
  genericNotification: noop,
  closeResponse: noop,
  acknowledgeResponse: noop,
  // stats
  agentDailyStats: noop,
  queueStats: noop,
  campaignStats: noop,
  agentStats: noop,
  chatQueueStats: noop
};

module.exports = {
  callbacks
};
