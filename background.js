// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ cookies: [], localStorage: [] });
});

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;
    chrome.windows.create({
      url: 'popup.html',
      type: 'popup',
      width: 500,
      height: 600
    });
  });
});