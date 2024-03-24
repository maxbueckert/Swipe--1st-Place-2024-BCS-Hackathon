let isThrottled = false
const throttleDuration = 1000 // Throttle duration in milliseconds

const leftEnabled = false
const rightEnabled = false
const upEnabled = false
const downENabled = false

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // console.log('here')
  chrome.storage.sync.get(['left', 'right', 'up', 'down'], (result) => {
    console.log('result')
    console.log(result)
    let left = result.left || false
    let right = result.right || false
    let up = result.up || false
    let down = result.down || false

    if (request.action === 'nextTab' && !isThrottled && right) {
      console.log('background script notified')
      isThrottled = true
      // Query for the currently active tab in the current window
      chrome.tabs.query({ active: true, currentWindow: true }, function (currentTabs) {
        // Check if the sender tab is the active tab
        if (sender.tab.id === currentTabs[0].id) {
          chrome.tabs.query({ currentWindow: true }, function (tabs) {
            // Find the active tab
            const activeTabIndex = tabs.findIndex((tab) => tab.active)
            // Calculate the next tab index
            let nextTabIndex = (activeTabIndex + 1) % tabs.length
            // Activate the next tab
            chrome.tabs.update(tabs[nextTabIndex].id, { active: true }, function () {
              sendResponse({ result: 'Tab changed' })
            })
          })
        } else {
          // If the sender tab is not the active tab, respond accordingly
          sendResponse({ result: 'Request ignored, not from the active tab' })
        }
      })

      // Reset the throttle flag after the specified duration
      setTimeout(() => {
        isThrottled = false
      }, throttleDuration)

      return true // Indicates an asynchronous response
    } else if (request.action === 'changeTab' && isThrottled) {
      // Optionally, send a response immediately if the request is throttled
      sendResponse({ result: 'Request throttled' })
      return true // This return is necessary if you're sending a response
    }
    if (request.action === 'prevTab' && !isThrottled && left) {
      console.log('background script notified')
      isThrottled = true

      // Query for the currently active tab in the current window
      chrome.tabs.query({ active: true, currentWindow: true }, function (currentTabs) {
        // Check if the sender tab is the active tab
        if (sender.tab.id === currentTabs[0].id) {
          chrome.tabs.query({ currentWindow: true }, function (tabs) {
            // Find the active tab index
            const activeTabIndex = tabs.findIndex((tab) => tab.active)
            // Calculate the previous tab index, wrapping to the last tab if the first tab is active
            let prevTabIndex = activeTabIndex - 1 < 0 ? tabs.length - 1 : activeTabIndex - 1
            // Activate the previous tab
            chrome.tabs.update(tabs[prevTabIndex].id, { active: true }, function () {
              sendResponse({ result: 'Tab changed' })
            })
          })
        } else {
          // If the sender tab is not the active tab, respond accordingly
          sendResponse({ result: 'Request ignored, not from the active tab' })
        }
      })

      // Reset the throttle flag after the specified duration
      setTimeout(() => {
        isThrottled = false
      }, throttleDuration)

      return true // Indicates an asynchronous response
    } else if (request.action === 'changeTab' && isThrottled) {
      // Optionally, send a response immediately if the request is throttled
      sendResponse({ result: 'Request throttled' })
      return true // This return is necessary if you're sending a response
    }
  })
})
