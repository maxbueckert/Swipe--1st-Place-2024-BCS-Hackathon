console.log('background is running')

// background.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'getTabIndex') {
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      // Find the sender tab in the list of tabs and return its index
      const tabIndex = tabs.findIndex((tab) => tab.id === sender.tab.id)
      sendResponse({ index: tabIndex })
    })
    return true // Indicates an asynchronous response
  }
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'changeTab') {
    console.log('background script notified')

    // Placeholder response since the tab query and update are commented out.
    // sendResponse({ result: 'Tab switching not implemented yet.' })
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      // Find the active tab
      const activeTabIndex = tabs.findIndex((tab) => tab.active)
      // Calculate the next tab index
      let nextTabIndex = (activeTabIndex + 1) % tabs.length
      // Activate the next tab
      chrome.tabs.update(tabs[nextTabIndex].id, { active: true })

      sendResponse({ result: 'Tab changed' })
    })

    return true // Keep the message channel open for the response
  }
})
