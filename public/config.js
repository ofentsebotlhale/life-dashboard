// Configuration for API integrations
// Replace these with your actual API keys and tokens

window.CONFIG = {
  github: {
    username: "octocat", // Replace with your GitHub username
    token: "", // Optional: GitHub personal access token for higher rate limits
  },

  notion: {
    token: "", // Your Notion integration token
    databaseId: "", // Optional: specific database ID
  },

  spotify: {
    clientId: "", // Your Spotify app client ID
    clientSecret: "", // Your Spotify app client secret
  },

  appleMusic: {
    developerToken: "", // Your Apple Music developer token
    appName: "Personal Dashboard",
  },

  lastfm: {
    apiKey: "", // Your Last.fm API key
    username: "", // Your Last.fm username
  },
};

// Development mode - set to false in production
window.CONFIG.isDevelopment = true;
