var browserActionIcon = {
  normal: {
    '19': 'icons/19-action.png',
    '38': 'icons/38-action.png',
  },
  shareable: {
    '19': 'icons/19-action-share.png',
    '38': 'icons/38-action-share.png',
  },
};

var invalidUrlRegs = [/^[^(http)]/, /(http|https):\/\/(127\.0\.0\.1|localhost)/, /(http|https):\/\/(.+\.)?chainmore\.fun/];

var shareUrlTemplate = 'https://www.chainmore.fun/op/create/resource?url=:url&title=:title';

var states = {};
var defaultState = {
  shareable: false,
  info: {},
};
var currentTabId = 0;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  console.log(changeInfo.status);
  if (changeInfo.status === 'loading') {
    getUrlInfo(tab.url, function(state) {
      states[tabId] = state;
      if (tabId === currentTabId) {
        updateBrowserAction(state);
      }
    });
  }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  currentTabId = activeInfo.tabId;
  updateBrowserAction(states[currentTabId] || defaultState);
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  delete states[tabId];
});

chrome.browserAction.onClicked.addListener(function(tab) {
  var state = states[tab.id] || defaultState;
  var shareUrl;
  var entryUrl;
  var entry;
  if (state.shareable) {
    shareUrl = shareUrlTemplate.resolveQueryString('url', tab.url).resolveQueryString('title', tab.title);
    chrome.tabs.create({ url: shareUrl });
  }
});

function updateBrowserAction(state) {
  var icon, badge, title;
  if (state.shareable) {
    icon = browserActionIcon.shareable;
    badge = '';
    title = '分享本页到阡陌';
  } else {
    icon = browserActionIcon.normal;
    badge = '';
    title = '阡陌快捷分享（本页不可分享）';
  }
  chrome.browserAction.setIcon({ path: icon });
  chrome.browserAction.setBadgeText({ text: badge });
  chrome.browserAction.setTitle({ title: title });
}

function getUrlInfo(url, onDone, onError) {
  var state = copy(defaultState);
  console.log(isValidUrl(url));
  if (isValidUrl(url)) {
    state.shareable = true;
  }
  onDone && onDone(state);
}

function isValidUrl(url) {
  return invalidUrlRegs.reduce(function(valid, reg) {
    return valid && !url.match(reg);
  }, true);
}

function copy(tar) {
  var res = {};
  var key;
  for (key in tar) {
    res[key] = tar[key];
  }
  return res;
}

String.prototype.resolveQueryString = function(placeholder, value) {
  var reg = new RegExp(':' + placeholder, 'g');
  var encodedValue = encodeURIComponent(value);
  return this.replace(reg, encodedValue);
};
