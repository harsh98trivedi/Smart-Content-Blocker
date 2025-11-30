# 🛡️ Smart Content Blocker

> **Focus on what matters.** A powerful, zero-build Chrome extension that intelligently blocks inappropriate content and social media distractions using smart heuristic analysis.

![Smart Content Blocker](images/meta.jpg)

## ✨ Features

- **🧠 Smart Analysis**: Uses a local AI classifier to automatically detect and block inappropriate (adult) content in real-time.
- **🚫 Social Media Blocker**: Pre-configured blocking for major distractions like Facebook, Instagram, Twitter/X, TikTok, and Reddit.
- **⚡ Zero-Build Architecture**: No complex build steps (Webpack/Parcel). Just standard HTML, CSS, and JavaScript.
- **🎨 Dynamic Block Page**: Features a beautiful, animated block page that serves GIFs via the GIPHY API (or a fallback emoji) to lighten the mood.
- **✅ Whitelist & Blocklist**: Easily manage your allowed and blocked sites directly from the extension popup.
- **🔒 Privacy First**: All analysis happens locally on your device. No browsing history is ever sent to a server.

## 🚀 Installation

### Option 1: Load Unpacked (Developer Mode)

1.  **Clone this repository**:
    ```bash
    git clone https://github.com/harsh98trivedi/siteblocker.git
    ```
2.  **Configure API Key**:
    - Create a `.env` file in the root directory.
    - Add your GIPHY API key: `GIPHY_API_KEY=your_key_here`
    - Run `npm run config` to generate the `config.js` file.
    - *Alternatively, manually create `config.js` with:*
      ```javascript
      export const CONFIG = {
        GIPHY_API_KEY: "your_key_here"
      };
      ```
3.  **Load in Chrome**:
    - Open Chrome and go to `chrome://extensions/`.
    - Enable **Developer mode** (top right toggle).
    - Click **Load unpacked**.
    - Select the `siteblocker` folder.

## 🛠️ Configuration

### GIPHY API Key
To enable the animated GIFs on the block page, you need a free GIPHY API key:
1.  Go to the [GIPHY Developers Dashboard](https://developers.giphy.com/dashboard/).
2.  Create an account and a new App.
3.  Copy your API Key.
4.  Add it to your `.env` file or directly into `config.js`.

## 📖 Usage

### The Popup
Click the extension icon in your toolbar to access controls:
- **Current Site**: View the current domain and instantly Block or Whitelist it.
- **Whitelisted Domains**: Add domains that should never be blocked (e.g., specific research sites).
- **Quick Add**: One-click buttons to block common social media platforms.

### The Block Page
When you visit a blocked site:
- You'll be redirected to a "Content Blocked" or "Stay Focused" page.
- A random GIF related to "focus" or "smirk" will play (if API is configured).
- If the API fails or is missing, a large friendly emoji will appear instead.
- You can click **Close Tab** to quickly get back to work.

## 💻 Technologies

- **Manifest V3**: Built with the latest Chrome Extension standards.
- **Vanilla JS**: No frameworks, ensuring lightweight performance.
- **GSAP**: Powered by GreenSock for smooth, professional animations.
- **TensorFlow/Classifier**: (Concept) Local heuristic analysis for content detection.

---

Made with ❤️ for productivity.
