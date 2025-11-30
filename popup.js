document.addEventListener("DOMContentLoaded", async () => {
  const currentDomainEl = document.getElementById("current-domain");
  const whitelistCurrentBtn = document.getElementById("whitelist-current");
  const blockCurrentBtn = document.getElementById("block-current");
  const domainInput = document.getElementById("domain-input");
  const addDomainBtn = document.getElementById("add-domain");
  const whitelistItemsEl = document.getElementById("whitelist-items");
  const statusEl = document.getElementById("status");
  const predefinedItemsEl = document.getElementById("predefined-items");
  const toggleExtensionEl = document.getElementById("toggle-extension");
  const toggleLabelEl = document.getElementById("toggle-label");

  let currentDomain = "";
  let whitelist = [];
  let blocklist = [];
  let isEnabled = true;

  // Predefined social media domains
  const predefinedDomains = [
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "tiktok.com",
    "reddit.com",
    "linkedin.com",
    "pinterest.com",
    "youtube.com",
  ];

  // Faster GSAP animations
  function initAnimations() {
    // Set initial states
    gsap.set([".header", ".current-site", ".section"], {
      opacity: 0,
      y: 15,
    });

    // Animate in sequence (faster)
    const tl = gsap.timeline();

    tl.to(".header", {
      duration: 0.4,
      opacity: 1,
      y: 0,
      ease: "power3.out",
    })
      .to(
        ".current-site",
        {
          duration: 0.3,
          opacity: 1,
          y: 0,
          ease: "power3.out",
        },
        "-=0.2"
      )
      .to(
        ".section",
        {
          duration: 0.3,
          opacity: 1,
          y: 0,
          stagger: 0.05,
          ease: "power3.out",
        },
        "-=0.15"
      );

    // Faster floating animation
    gsap.to("button", {
      duration: 1.5,
      y: -1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.05,
      delay: 0.6,
    });
  }

  // Get current tab domain
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      
      // Check if we are on the block page
      if (url.protocol === 'chrome-extension:' && url.pathname.endsWith('block.html')) {
        const params = new URLSearchParams(url.search);
        const originalUrl = params.get('url');
        
        if (originalUrl) {
          try {
            const realUrl = new URL(originalUrl);
            currentDomain = realUrl.hostname;
            document.querySelector('.current-site .label').textContent = "Blocked Site";
          } catch (e) {
             currentDomain = "Blocked Page";
          }
        } else {
           // Fallback: Try to get from storage
           const result = await chrome.storage.local.get(['lastBlockedUrl']);
           if (result.lastBlockedUrl) {
             try {
                const realUrl = new URL(result.lastBlockedUrl);
                currentDomain = realUrl.hostname;
                document.querySelector('.current-site .label').textContent = "Blocked Site";
             } catch(e) {
                currentDomain = "Blocked Page";
             }
           } else {
              currentDomain = "Blocked Page";
           }
        }
      } else {
        currentDomain = url.hostname;
      }
      currentDomainEl.textContent = currentDomain;
    }
  } catch (e) {
    currentDomainEl.textContent = "Unable to detect domain";
  }

  // Load both whitelist, blocklist, and enabled state
  async function loadLists() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["whitelist", "blocklist", "enabled"], (result) => {
        whitelist = result.whitelist || [];
        blocklist = result.blocklist || [];
        isEnabled = result.enabled !== false; // Default to true

        // Update UI
        toggleExtensionEl.checked = isEnabled;
        updateToggleLabel();
        renderWhitelist();
        renderPredefinedItems();
        resolve();
      });
    });
  }

  function updateToggleLabel() {
    toggleLabelEl.textContent = isEnabled ? "Enabled" : "Disabled";
    toggleLabelEl.style.color = isEnabled ? "#28a745" : "rgba(255, 255, 255, 0.5)";
    
    // Dim the rest of the UI if disabled
    const mainContent = document.querySelectorAll(".current-site, .section");
    mainContent.forEach(el => {
      el.style.opacity = isEnabled ? "1" : "0.5";
      el.style.pointerEvents = isEnabled ? "auto" : "none";
    });
  }

  toggleExtensionEl.addEventListener("change", (e) => {
    isEnabled = e.target.checked;
    updateToggleLabel();
    chrome.storage.sync.set({ enabled: isEnabled });
  });

  // Render predefined items (hide whitelisted ones)
  function renderPredefinedItems() {
    predefinedItemsEl.innerHTML = "";

    // Filter out whitelisted domains
    const availableDomains = predefinedDomains.filter(
      (domain) => !whitelist.includes(domain)
    );

    if (availableDomains.length === 0) {
      predefinedItemsEl.innerHTML =
        '<div class="empty-state">All social media sites are whitelisted</div>';
      return;
    }

    availableDomains.forEach((domain, index) => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <span class="domain-name">${domain}</span>
        <button class="btn-predefined" data-domain="${domain}">Add</button>
      `;
      predefinedItemsEl.appendChild(item);

      // Animate in
      gsap.fromTo(
        item,
        { opacity: 0, x: -15 },
        { duration: 0.25, opacity: 1, x: 0, delay: index * 0.03 }
      );
    });

    // Add event listeners for predefined buttons
    predefinedItemsEl.querySelectorAll(".btn-predefined").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const domain = e.target.dataset.domain;
        await addDomain(domain);
      });
    });
  }

  // Render whitelist with faster animations
  function renderWhitelist() {
    whitelistItemsEl.innerHTML = "";

    if (whitelist.length === 0) {
      whitelistItemsEl.innerHTML =
        '<div class="empty-state">No whitelisted domains yet</div>';
      return;
    }

    whitelist.forEach((domain, index) => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <span class="domain-name">${domain}</span>
        <button class="btn-remove" data-index="${index}">Remove</button>
      `;
      whitelistItemsEl.appendChild(item);

      // Faster animate in
      gsap.fromTo(
        item,
        { opacity: 0, x: -15 },
        { duration: 0.25, opacity: 1, x: 0, delay: index * 0.05 }
      );
    });

    // Add remove event listeners
    whitelistItemsEl.querySelectorAll(".btn-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        removeDomain(index);
      });
    });
  }

  // Add domain to whitelist
  async function addDomain(domain) {
    if (!domain || domain.trim() === "") {
      showStatus("Please enter a domain", "error");
      return;
    }

    // Clean up domain
    domain = domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "")
      .trim();

    if (whitelist.includes(domain)) {
      showStatus("Domain already whitelisted!", "error");
      return;
    }

    whitelist.push(domain);
    await saveWhitelist();
    domainInput.value = "";
  }

  // Fixed block current domain functionality
  async function blockCurrentDomain() {
    if (!currentDomain || currentDomain === "Unable to detect domain") {
      showStatus("No valid domain to block", "error");
      return;
    }

    const cleanDomain = currentDomain.toLowerCase().replace(/^www\./, "");

    if (blocklist.includes(cleanDomain)) {
      showStatus("Domain already blocked!", "error");
      return;
    }

    blocklist.push(cleanDomain);

    // Save to storage first
    chrome.runtime.sendMessage(
      {
        action: "save_blocklist",
        blocklist: blocklist,
      },
      async (response) => {
        if (response?.success) {
          showStatus("Domain blocked! Closing tab...", "success");

          // Wait a moment then close tab
          setTimeout(async () => {
            try {
              const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
              });
              if (tab) {
                chrome.tabs.remove(tab.id);
              }
            } catch (e) {
              console.error("Could not close tab:", e);
            }
          }, 1000);
        } else {
          showStatus("Failed to block domain", "error");
        }
      }
    );
  }

  // Remove domain from whitelist
  async function removeDomain(index) {
    if (index >= 0 && index < whitelist.length) {
      const item = whitelistItemsEl.children[index];

      // Faster animate out
      gsap.to(item, {
        duration: 0.2,
        x: 15,
        opacity: 0,
        onComplete: async () => {
          whitelist.splice(index, 1);
          await saveWhitelist();
        },
      });
    }
  }

  // Save whitelist (updated to refresh predefined items)
  async function saveWhitelist() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "save_whitelist",
          whitelist: whitelist,
        },
        (response) => {
          if (response?.success) {
            renderWhitelist();
            renderPredefinedItems(); // Re-render to hide/show domains
            showStatus("Whitelist updated!", "success");
          } else {
            showStatus("Failed to save whitelist", "error");
          }
          resolve();
        }
      );
    });
  }

  // Show status with faster animation
  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;

    // Faster animate in
    gsap.fromTo(
      statusEl,
      { opacity: 0, y: 5, display: "block" },
      { duration: 0.25, opacity: 1, y: 0 }
    );

    setTimeout(() => {
      gsap.to(statusEl, {
        duration: 0.25,
        opacity: 0,
        y: -5,
        onComplete: () => {
          statusEl.style.display = "none";
        },
      });
    }, 2500);
  }

  // Event listeners with faster animations
  whitelistCurrentBtn.addEventListener("click", async () => {
    gsap.to(whitelistCurrentBtn, { duration: 0.05, scale: 0.95 });
    gsap.to(whitelistCurrentBtn, { duration: 0.05, scale: 1, delay: 0.05 });

    if (currentDomain && currentDomain !== "Unable to detect domain") {
      await addDomain(currentDomain);
    } else {
      showStatus("No valid domain to whitelist", "error");
    }
  });

  blockCurrentBtn.addEventListener("click", async () => {
    gsap.to(blockCurrentBtn, { duration: 0.05, scale: 0.95 });
    gsap.to(blockCurrentBtn, { duration: 0.05, scale: 1, delay: 0.05 });

    await blockCurrentDomain();
  });

  addDomainBtn.addEventListener("click", async () => {
    await addDomain(domainInput.value);
  });

  domainInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      await addDomain(domainInput.value);
    }
  });

  // Initialize
  await loadLists();
  initAnimations();
});
