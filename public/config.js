// Configuration for API integrations
const CONFIG = {
  // GitHub Configuration
  github: {
    username: "octocat", // Change this to your GitHub username
    token: "", // Optional: Add your GitHub personal access token for higher rate limits
  },

  // Notion Configuration
  notion: {
    token: "", // Add your Notion integration token
    databaseId: "", // Add your Notion database ID for pages
  },

  // Spotify Configuration (Web API)
  spotify: {
    clientId: "", // Add your Spotify client ID
    clientSecret: "", // Add your Spotify client secret
    redirectUri: window.location.origin + "/callback",
  },

  // Apple Music Configuration (MusicKit JS)
  appleMusic: {
    developerToken: "", // Add your Apple Music developer token
    appName: "Personal Dashboard",
  },

  // YouTube Music (unofficial API)
  youtubeMusic: {
    enabled: false, // Set to true when you have API access
  },
};

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}
