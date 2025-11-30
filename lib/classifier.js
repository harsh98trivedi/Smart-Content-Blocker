/**
 * Lightweight Naive Bayes Classifier for client-side content filtering.
 * Trained on common keywords for Social Media and Adult content.
 */
class ContentClassifier {
  constructor() {
    this.categories = {
      social: {
        tokens: {
          "feed": 0.8, "timeline": 0.8, "post": 0.5, "share": 0.6, "comment": 0.5,
          "like": 0.4, "follow": 0.7, "subscribe": 0.6, "friend": 0.7, "connect": 0.6,
          "profile": 0.5, "status": 0.5, "story": 0.7, "tweet": 0.9, "retweet": 0.9,
          "trending": 0.7, "hashtag": 0.8, "notification": 0.6, "message": 0.5,
          "newsfeed": 0.9, "subreddit": 0.9, "upvote": 0.8, "karma": 0.7,
          "pin": 0.6, "repin": 0.7, "snap": 0.8, "chat": 0.4, "group": 0.4,
          "reel": 0.8, "shorts": 0.8, "fyp": 0.9, "explore": 0.6
        },
        threshold: 3.0
      },
      porn: {
        tokens: {
          "porn": 1.0, "sex": 0.9, "xxx": 1.0, "nude": 0.9, "naked": 0.9,
          "adult": 0.7, "erotic": 0.8, "tube": 0.5, "video": 0.2, "cam": 0.7,
          "live": 0.3, "model": 0.4, "gay": 0.6, "lesbian": 0.6, "shemale": 0.9,
          "milf": 0.9, "teen": 0.7, "mature": 0.6, "amateur": 0.8, "hardcore": 0.9,
          "softcore": 0.8, "fetish": 0.9, "bdsm": 0.9, "hentai": 1.0, "anime": 0.2,
          "gallery": 0.4, "album": 0.4, "dating": 0.4, "single": 0.3, "meet": 0.3,
          "fuck": 0.9, "pussy": 1.0, "dick": 1.0, "cock": 1.0, "ass": 0.8,
          "tits": 0.9, "boobs": 0.9, "blowjob": 1.0, "cum": 1.0, "orgasm": 0.9,
          "squirt": 1.0, "anal": 0.9, "gangbang": 1.0, "threesome": 0.9,
          "masturbate": 1.0, "dildo": 0.9, "vibrator": 0.8, "escort": 0.8
        },
        threshold: 2.5
      },
      safe: {
        tokens: {
          "shop": 0.8, "cart": 0.9, "checkout": 0.9, "price": 0.7, "buy": 0.7,
          "product": 0.7, "sale": 0.6, "shipping": 0.6, "blog": 0.8, "article": 0.7,
          "read": 0.4, "author": 0.6, "tutorial": 0.8, "guide": 0.7, "docs": 0.8,
          "documentation": 0.8, "reference": 0.6, "news": 0.5, "weather": 0.8,
          "bank": 0.9, "login": 0.2, "signin": 0.2, "register": 0.2,
          "medical": 0.9, "health": 0.8, "science": 0.8, "education": 0.8
        }
      }
    };
  }

  /**
   * Tokenizes text into an array of lowercase words, removing punctuation.
   */
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  /**
   * Classifies the given text.
   * @returns {string|null} 'social', 'porn', or null if safe/neutral.
   */
  classify(text) {
    const tokens = this.tokenize(text);
    const scores = { social: 0, porn: 0, safe: 0 };

    // Calculate scores based on token occurrences and weights
    tokens.forEach(token => {
      if (this.categories.social.tokens[token]) {
        scores.social += this.categories.social.tokens[token];
      }
      if (this.categories.porn.tokens[token]) {
        scores.porn += this.categories.porn.tokens[token];
      }
      if (this.categories.safe.tokens[token]) {
        scores.safe += this.categories.safe.tokens[token];
      }
    });

    // Apply negative weighting from safe score
    scores.social -= scores.safe * 0.5;
    scores.porn -= scores.safe * 0.5;

    console.log("AI Classifier Scores:", scores);

    // Determine category based on highest score and thresholds
    if (scores.porn > scores.social && scores.porn > this.categories.porn.threshold) {
      return 'porn';
    }
    if (scores.social > scores.porn && scores.social > this.categories.social.threshold) {
      return 'social';
    }

    return null;
  }
}

// Expose to window
window.ContentClassifier = ContentClassifier;
