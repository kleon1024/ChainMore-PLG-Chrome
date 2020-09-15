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

var invalidUrlRegs = [/^[^(http)]/, /(http|https):\/\/(127\.0\.0\.1|localhost)/, /(http|https):\/\/(.+\.)?xitu\.io/, /(http|https):\/\/(.+\.)?juejin\.im/];

var checkUrlTemplate = 'https://juejin.im/check?url=:url';
var shareUrlTemplate = 'https://juejin.im/new-entry?url=:url&title=:title';
var entryUrlTemplate = 'https://juejin.im/entry/:entryId/detail';

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
  console.log('hhhhh');
  var state = states[tab.id] || defaultState;
  var shareUrl;
  var entryUrl;
  var entry;
  if (state.shareable) {
    shareUrl = shareUrlTemplate.resolveQueryString('url', tab.url).resolveQueryString('title', tab.title);
    chrome.tabs.create({ url: shareUrl });
  } else if (state.info.shared) {
    entry = state.info.entry;
    entryUrl = entryUrlTemplate.resolveQueryString('entryId', entry.objectId);
    chrome.tabs.create({ url: entryUrl });
  }
});

function updateBrowserAction(state) {
  var icon, badge, title;
  if (state.shareable) {
    icon = browserActionIcon.shareable;
    badge = '';
    title = '分享本页到掘金';
  } else {
    icon = browserActionIcon.normal;
    badge = '';
    title = '掘金快捷分享（本页不可分享）';
  }
  chrome.browserAction.setIcon({ path: icon });
  chrome.browserAction.setBadgeText({ text: badge });
  chrome.browserAction.setTitle({ title: title });
}

function getUrlInfo(url, onDone, onError) {
  checkUrlTemplate.resolveQueryString('url', url);
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

String.prototype.resolveQueryString = function (placeholder, value) {
  var reg = new RegExp(':' + placeholder, 'g')
  var encodedValue = encodeURIComponent(value)
  return this.replace(reg, encodedValue)
}