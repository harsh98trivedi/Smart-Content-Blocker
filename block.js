document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const blockType = urlParams.get("type");

  const content = {
    porn: {
      query: "smirk",
      title: "Content Blocked",
      subtitle: "This page was blocked by the content filter.",
      emoji: "🛡️",
    },
    social: {
      query: "focus work",
      title: "Stay Focused",
      subtitle: "This page appears to be social media.",
      emoji: "🧘",
    },
  };

  const current = content[blockType] || content.porn;

  document.getElementById("title").textContent = current.title;
  document.getElementById("subtitle").textContent = current.subtitle;

  let gifCache = [];
  let currentGifIndex = 0;

  const gifElement = document.getElementById("gif");
  const closeButton = document.getElementById("btn-close");

  // Initial state: Show emoji immediately
  showFallbackEmoji();
  animateIn();

  // Faster GSAP animations that preserve text position
  function animateIn() {
    // Initial state - hide everything
    gsap.set([".text-content", ".gif-container", ".button-container"], {
      opacity: 0,
    });

    gsap.set(".text-content", { y: -25 });
    gsap.set(".gif-container", { scale: 0.8, y: 15 });
    gsap.set(".button-container", { y: 25 });

    // Faster timeline
    const tl = gsap.timeline();

    // Animate text content first
    tl.to(".text-content", {
      duration: 0.8,
      y: 0,
      opacity: 1,
      ease: "power3.out",
    })
      // Then GIF/Emoji container with elastic effect
      .to(
        ".gif-container",
        {
          duration: 1.0,
          y: 0,
          opacity: 1,
          scale: 1,
          ease: "elastic.out(1, 0.8)",
        },
        "-=0.4"
      )
      // Finally the button
      .to(
        ".button-container",
        {
          duration: 0.6,
          y: 0,
          opacity: 1,
          ease: "power3.out",
        },
        "-=0.5"
      );
  }

  // Enhanced GIF transition animation
  function loadNextGif() {
    if (gifCache.length === 0) return;
    currentGifIndex = (currentGifIndex + 1) % gifCache.length;

    // Faster transition
    const tl = gsap.timeline();

    tl.to(gifElement, {
      duration: 0.25,
      scale: 0.9,
      rotation: 3,
      opacity: 0.6,
      ease: "power2.in",
    })
      .call(() => {
        gifElement.src = gifCache[currentGifIndex];
      })
      .to(gifElement, {
        duration: 0.3,
        scale: 1,
        rotation: 0,
        opacity: 1,
        ease: "elastic.out(1, 0.6)",
      });
  }

  // Close tab functionality with faster animation
  closeButton.addEventListener("click", () => {
    const tl = gsap.timeline();

    tl.to(".container > *", {
      duration: 0.4,
      y: -25,
      opacity: 0,
      stagger: 0.05,
      ease: "power3.in",
    }).call(() => {
      chrome.runtime.sendMessage({ action: "close_tab" });
    });
  });

  // Allow clicking on GIF to cycle through them (no hover effect)
  gifElement.addEventListener("click", loadNextGif);

  // Function to show fallback emoji using native emoji
  function showFallbackEmoji() {
    gifElement.style.display = "none";
    // Check if emoji already exists to avoid duplicates
    if (!document.getElementById("fallback-emoji")) {
      const emojiDiv = document.createElement("div");
      emojiDiv.id = "fallback-emoji";
      emojiDiv.textContent = current.emoji;
      emojiDiv.style.fontSize = "120px";
      emojiDiv.style.lineHeight = "1";
      emojiDiv.style.cursor = "default";
      // Native emoji font stack
      emojiDiv.style.fontFamily = '"Segoe UI Emoji", "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
      
      const container = document.querySelector(".gif-container");
      container.appendChild(emojiDiv);

      // Float animation for emoji
      gsap.to(emojiDiv, {
        y: -15,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        duration: 2,
      });
    } else {
        document.getElementById("fallback-emoji").style.display = "block";
    }
  }

  // Load GIF in background
  chrome.runtime.sendMessage(
    { action: "fetch_gif", query: current.query },
    (response) => {
      if (response && response.gifs && response.gifs.length > 0) {
        gifCache = response.gifs;
        currentGifIndex = Math.floor(Math.random() * gifCache.length);
        
        // Create a temporary image to load the GIF
        const tempImg = new Image();
        tempImg.onload = () => {
            // GIF loaded successfully
            const emojiDiv = document.getElementById("fallback-emoji");
            
            // Transition from Emoji to GIF
            if (emojiDiv) {
                gsap.to(emojiDiv, {
                    duration: 0.5,
                    opacity: 0,
                    scale: 0.8,
                    onComplete: () => {
                        emojiDiv.style.display = "none";
                        
                        // Show GIF
                        gifElement.src = gifCache[currentGifIndex];
                        gifElement.alt = current.query + " GIF";
                        gifElement.style.display = "block";
                        gifElement.style.opacity = 0;
                        gifElement.style.scale = 0.8;

                        gsap.to(gifElement, {
                            duration: 0.8,
                            opacity: 1,
                            scale: 1,
                            ease: "elastic.out(1, 0.8)"
                        });

                        // Start floating animation for GIF
                        gsap.to("#gif", {
                            duration: 3,
                            y: -6,
                            repeat: -1,
                            yoyo: true,
                            ease: "power2.inOut",
                            delay: 0.5,
                        });
                    }
                });
            } else {
                // If for some reason emoji isn't there, just show GIF
                gifElement.src = gifCache[currentGifIndex];
                gifElement.style.display = "block";
            }
        };
        
        // Start loading
        tempImg.src = gifCache[currentGifIndex];
      }
    }
  );
});