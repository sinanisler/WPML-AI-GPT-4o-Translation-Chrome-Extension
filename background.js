chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action == "saveAPIKey") {
        chrome.storage.local.set({ "OpenAIApiKey": message.key }, function() {
            if (chrome.runtime.lastError) {
                console.error("Error saving API Key:", chrome.runtime.lastError);
            } else {
                console.log("API Key saved");
            }
        });
    }
});
