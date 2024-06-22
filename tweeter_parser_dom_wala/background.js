chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updatePopup') {
      chrome.runtime.sendMessage({ action: 'updatePopup', content: request.content });
    }
  });
  