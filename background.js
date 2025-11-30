import { CONFIG } from "./config.js";

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
