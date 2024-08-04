chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "navigateAndSendMessage") {
    chrome.tabs.update(sender.tab.id, {url: request.url}, function(tab) {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.sendMessage(tabId, {
            action: "continueMessageSend",
            message: request.message
          });
        }
      });
    });
  }
});
