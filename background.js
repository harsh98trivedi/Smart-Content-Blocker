import { CONFIG } from "./config.js";

const RULESET_ID = "ruleset_1";

// Initialize on installation or startup
chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);

async function initialize() {
  const { enabled, whitelist } = await chrome.storage.sync.get(["enabled", "whitelist"]);
  
  // Set initial ruleset state (default to true if undefined)
  await updateRulesetState(enabled !== false);
  
  // Set initial whitelist rules
  await updateWhitelistRules(whitelist || []);
}

// Listen for storage changes
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === "sync") {
    if (changes.enabled) {
      await updateRulesetState(changes.enabled.newValue !== false);
    }
    if (changes.whitelist) {
      await updateWhitelistRules(changes.whitelist.newValue || []);
    }
  }
});

// Update static ruleset state
async function updateRulesetState(enabled) {
  try {
    if (enabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: [RULESET_ID]
      });
      console.log("Smart Blocker: Ruleset enabled");
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: [RULESET_ID]
      });
      console.log("Smart Blocker: Ruleset disabled");
    }
  } catch (e) {
    console.error("Smart Blocker: Failed to update ruleset state", e);
  }
}

// Update dynamic rules for whitelist
async function updateWhitelistRules(whitelist) {
  try {
    // Get existing dynamic rules to remove them
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = currentRules.map(rule => rule.id);

    // Create new allow rules
    const addRules = whitelist.map((domain, index) => ({
      id: index + 1,
      priority: 100,
      action: { type: "allow" },
      condition: {
        urlFilter: domain, // Matches occurrences of the domain
        resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "script", "image", "stylesheet", "media", "websocket", "other"]
      }
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules
    });
    console.log("Smart Blocker: Whitelist rules updated", addRules);
  } catch (e) {
    console.error("Smart Blocker: Failed to update whitelist rules", e);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "block_page") {
    const urlToBlock = request.url || sender.tab.url;
    // Save the blocked URL to storage so popup can retrieve it if params fail
    chrome.storage.local.set({ lastBlockedUrl: urlToBlock });
    
    const blockPageUrl = chrome.runtime.getURL(
      `block.html?type=${request.type}&url=${encodeURIComponent(urlToBlock)}`
    );
    chrome.tabs.update(sender.tab.id, { url: blockPageUrl });
  } else if (request.action === "close_tab") {
    chrome.tabs.remove(sender.tab.id);
  } else if (request.action === "fetch_gif") {
    fetchGif(request.query)
      .then((gifs) => sendResponse({ gifs: gifs }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  } else if (request.action === "get_whitelist") {
    chrome.storage.sync.get(["whitelist"], (result) => {
      sendResponse({ whitelist: result.whitelist || [] });
    });
    return true;
  } else if (request.action === "save_whitelist") {
    chrome.storage.sync.set({ whitelist: request.whitelist }, () => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === "get_blocklist") {
    chrome.storage.sync.get(["blocklist"], (result) => {
      sendResponse({ blocklist: result.blocklist || [] });
    });
    return true;
  } else if (request.action === "save_blocklist") {
    chrome.storage.sync.set({ blocklist: request.blocklist }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

async function fetchGif(query) {
  // Use API key from config (loaded from environment variables)
  const apiKey = CONFIG.GIPHY_API_KEY;
  const searchUrl = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
    query
  )}&limit=50`;

  const response = await fetch(searchUrl);
  if (!response.ok) throw new Error(`GIPHY API Error: ${response.status}`);

  const data = await response.json();
  const gifs = data.data || [];
  if (gifs.length === 0) throw new Error("No GIFs found.");

  return gifs
    .map((g) => g.images.downsized_large?.url || g.images.original.url)
    .filter(Boolean);
}
