(function() {
  const hostname = window.location.hostname.toLowerCase();

  // Check if extension is enabled
  chrome.storage.sync.get(["enabled"], (result) => {
      // Check if extension is enabled
      if (result.enabled === false) {
        console.log("Smart Blocker: Extension is disabled");
        return;
      }

      // Check whitelist and blocklist
      chrome.runtime.sendMessage({ action: "get_whitelist" }, (response) => {
        const whitelist = response.whitelist || [];
        
        // Check if current domain is whitelisted
        const isWhitelisted = whitelist.some((domain) => {
          return hostname === domain || hostname.endsWith("." + domain);
        });

        if (isWhitelisted) {
          console.log("Smart Blocker: Domain whitelisted:", hostname);
          return;
        }

        // Check blocklist
        chrome.runtime.sendMessage({ action: "get_blocklist" }, (response) => {
            const blocklist = response.blocklist || [];
            const isBlocked = blocklist.some((domain) => {
                return hostname === domain || hostname.endsWith("." + domain);
            });

            if (isBlocked) {
                console.log("Smart Blocker: Domain in blocklist:", hostname);
                chrome.runtime.sendMessage({ 
                    action: "block_page", 
                    type: "social", // Default to social for manual blocks
                    url: window.location.href 
                });
                return;
            }

            // Initial check for content analysis
            analyzePageContent();

            // Observe for changes (SPA support) with debounce
            let timeout;
            const observer = new MutationObserver(() => {
              if (timeout) clearTimeout(timeout);
              timeout = setTimeout(() => {
                analyzePageContent();
              }, 1000); // Check at most once per second
            });
            
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            } else {
                // In case body isn't ready yet
                document.addEventListener('DOMContentLoaded', () => {
                    analyzePageContent();
                    observer.observe(document.body, { childList: true, subtree: true });
                });
            }
        });
      });
    });


  function analyzePageContent() {
    try {
      // Use the AI Classifier if available
      if (window.ContentClassifier) {
        const classifier = new window.ContentClassifier();
        
        // Combine title, meta description, and body text for analysis
        const title = document.title;
        const metaDesc = document.querySelector('meta[name="description"]')?.content || "";
        const metaKeywords = document.querySelector('meta[name="keywords"]')?.content || "";
        // Get a chunk of body text, but limit it for performance
        const bodyText = document.body.innerText.substring(0, 5000); 
        
        const combinedText = `${title} ${metaDesc} ${metaKeywords} ${bodyText}`;
        
        console.log("Smart Blocker: Running AI analysis...");
        const result = classifier.classify(combinedText);
        
        if (result) {
          console.log(`Smart Blocker: AI detected ${result} content.`);
          
          // Double check with strict DOM selectors for social media to be sure
          if (result === 'social') {
             const socialSelectors = [
                '[aria-label="Timeline"]', '[aria-label="News Feed"]', '[data-pagelet="Feed"]',
                '[role="feed"]', '.feed-shared-update-v2', '[data-testid="tweet"]'
             ];
             const hasSocialDom = socialSelectors.some(sel => document.querySelector(sel));
             if (!hasSocialDom && !document.title.toLowerCase().includes("feed")) {
                 console.log("Smart Blocker: AI detected social, but DOM check failed. Being cautious.");
                 // Optional: return or require higher threshold
             }
          }

          chrome.runtime.sendMessage({ 
            action: "block_page", 
            type: result,
            url: window.location.href 
          });
        } else {
          console.log("Smart Blocker: AI analysis returned safe/neutral.");
        }
      } else {
        console.error("Smart Blocker: ContentClassifier not found!");
      }
    } catch (error) {
      console.error("Smart Blocker: Analysis error:", error);
    }
  }
})();
