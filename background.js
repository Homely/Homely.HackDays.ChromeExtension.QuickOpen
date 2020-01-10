
chrome.browserAction.onClicked.addListener(function(tab) {

    // Send a message to the active tab - this kicks off the background task.
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var activeTab = tabs[0];
        var json = {
            "message": "clicked_browser_action",
            "url" : activeTab.url,
            "title" : activeTab.title
        };
        chrome.tabs.sendMessage(activeTab.id, json);
    });
});
  
  
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.message === "open_new_tab" ) {
            chrome.tabs.create({"url": request.url});
        }
    }
);

