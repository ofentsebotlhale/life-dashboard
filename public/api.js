// API integration functions

class APIManager {
  constructor() {
    this.config = window.CONFIG;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Cache management
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  // GitHub API
  async fetchGitHubRepos(username = null) {
    const user = username || this.config.github.username;
    const cacheKey = `github-repos-${user}`;

    // Check cache first
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const headers = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Personal-Dashboard",
      };

      // Add token if available for higher rate limits
      if (this.config.github.token) {
        headers["Authorization"] = `token ${this.config.github.token}`;
      }

      const response = await fetch(
        `https://api.github.com/users/${user}/repos?sort=updated&per_page=10`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos = await response.json();
      this.setCache(cacheKey, repos);
      return repos;
    } catch (error) {
      console.error("Error fetching GitHub repos:", error);
      throw error;
    }
  }

  async fetchGitHubUser(username = null) {
    const user = username || this.config.github.username;
    const cacheKey = `github-user-${user}`;

    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const headers = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Personal-Dashboard",
      };

      if (this.config.github.token) {
        headers["Authorization"] = `token ${this.config.github.token}`;
      }

      const response = await fetch(`https://api.github.com/users/${user}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const userData = await response.json();
      this.setCache(cacheKey, userData);
      return userData;
    } catch (error) {
      console.error("Error fetching GitHub user:", error);
      throw error;
    }
  }

  // Notion API
  async fetchNotionPages() {
    if (!this.config.notion.token) {
      throw new Error("Notion token not configured");
    }

    const cacheKey = "notion-pages";
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch("https://api.notion.com/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.notion.token}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          filter: {
            property: "object",
            value: "page",
          },
          sort: {
            direction: "descending",
            timestamp: "last_edited_time",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Notion API error: ${response.status}`);
      }

      const data = await response.json();
      this.setCache(cacheKey, data.results);
      return data.results;
    } catch (error) {
      console.error("Error fetching Notion pages:", error);
      throw error;
    }
  }

  // Spotify API
  async getSpotifyAccessToken() {
    if (!this.config.spotify.clientId || !this.config.spotify.clientSecret) {
      throw new Error("Spotify credentials not configured");
    }

    const cached = this.getCache("spotify-token");
    if (cached) return cached;

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            btoa(
              this.config.spotify.clientId +
                ":" +
                this.config.spotify.clientSecret
            ),
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }

      const data = await response.json();
      this.setCache("spotify-token", data.access_token);
      return data.access_token;
    } catch (error) {
      console.error("Error getting Spotify token:", error);
      throw error;
    }
  }

  async searchSpotifyTracks(query, limit = 10) {
    try {
      const token = await this.getSpotifyAccessToken();

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=track&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify search error: ${response.status}`);
      }

      const data = await response.json();
      return data.tracks.items;
    } catch (error) {
      console.error("Error searching Spotify:", error);
      throw error;
    }
  }

  // Apple Music (requires MusicKit JS)
  async initializeAppleMusic() {
    if (!this.config.appleMusic.developerToken) {
      throw new Error("Apple Music developer token not configured");
    }

    try {
      // Load MusicKit if not already loaded
      if (!window.MusicKit) {
        await this.loadScript(
          "https://js-cdn.music.apple.com/musickit/v1/musickit.js"
        );
      }

      await window.MusicKit.configure({
        developerToken: this.config.appleMusic.developerToken,
        app: {
          name: this.config.appleMusic.appName,
          build: "1.0.0",
        },
      });

      return window.MusicKit.getInstance();
    } catch (error) {
      console.error("Error initializing Apple Music:", error);
      throw error;
    }
  }

  // Utility function to load external scripts
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Last.fm API (for music scrobbling data)
  async fetchLastFmRecentTracks(username, apiKey) {
    if (!username || !apiKey) {
      throw new Error("Last.fm username and API key required");
    }

    const cacheKey = `lastfm-${username}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=10`
      );

      if (!response.ok) {
        throw new Error(`Last.fm API error: ${response.status}`);
      }

      const data = await response.json();
      this.setCache(cacheKey, data.recenttracks.track);
      return data.recenttracks.track;
    } catch (error) {
      console.error("Error fetching Last.fm data:", error);
      throw error;
    }
  }
}

// Create global instance
window.apiManager = new APIManager();
