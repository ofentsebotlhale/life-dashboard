// Global state
let currentPage = "home";
let journalEntries = JSON.parse(localStorage.getItem("journalEntries")) || [];
let poems = JSON.parse(localStorage.getItem("poems")) || [];
let currentTrack = 0;
let isPlaying = false;
let currentMood = "😊";
let currentTags = [];
let musicService = null; // Will hold Spotify or Apple Music instance
let currentPlaylist = [];

// Default playlist data (will be replaced by real data)
let playlist = [
  {
    id: "1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:22",
    artwork:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
  },
  {
    id: "2",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    duration: "2:54",
    artwork:
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop",
  },
  {
    id: "3",
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    album: "SOUR",
    duration: "2:58",
    artwork:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop",
  },
];

// Default assignments data
let assignments = [
  {
    id: "1",
    title: "Computer Science Project",
    subject: "CS",
    dueDate: "2025-02-15",
    priority: "high",
    completed: false,
  },
  {
    id: "2",
    title: "Mathematics Problem Set",
    subject: "Math",
    dueDate: "2025-02-12",
    priority: "medium",
    completed: true,
  },
  {
    id: "3",
    title: "Physics Lab Report",
    subject: "Physics",
    dueDate: "2025-02-20",
    priority: "low",
    completed: false,
  },
];

// Will be populated by API
let notionPages = [];
let githubRepos = [];
let githubUser = null;

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  lucide.createIcons();
  setGreeting();
  updateStats();
  renderPlaylist();
  renderAssignments();
  setupEventListeners();
  initializeAPIs();
  showPage("home");
});

// Initialize API connections
async function initializeAPIs() {
  try {
    // Initialize GitHub
    await initializeGitHub();

    // Initialize Notion
    await initializeNotion();

    // Initialize Music Services
    await initializeMusicServices();
  } catch (error) {
    console.error("Error initializing APIs:", error);
  }
}

async function initializeGitHub() {
  try {
    const repos = await window.apiManager.fetchGitHubRepos();
    githubRepos = repos;

    const user = await window.apiManager.fetchGitHubUser();
    githubUser = user;

    updateGitHubUI();
  } catch (error) {
    console.error("GitHub initialization failed:", error);
    showGitHubError();
  }
}

async function initializeNotion() {
  try {
    if (window.CONFIG.notion.token) {
      const pages = await window.apiManager.fetchNotionPages();
      notionPages = pages;
      renderNotionPages();
    } else {
      showNotionSetupMessage();
    }
  } catch (error) {
    console.error("Notion initialization failed:", error);
    showNotionError();
  }
}

async function initializeMusicServices() {
  try {
    // Try Spotify first
    if (window.CONFIG.spotify.clientId) {
      await initializeSpotify();
    }
    // Try Apple Music if Spotify fails
    else if (window.CONFIG.appleMusic.developerToken) {
      await initializeAppleMusic();
    } else {
      showMusicSetupMessage();
    }
  } catch (error) {
    console.error("Music service initialization failed:", error);
    showMusicError();
  }
}

async function initializeSpotify() {
  try {
    // For demo purposes, search for popular tracks
    const tracks = await window.apiManager.searchSpotifyTracks(
      "top hits 2024",
      10
    );

    playlist = tracks.map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      duration: formatDuration(track.duration_ms),
      artwork:
        track.album.images[0]?.url ||
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
      preview_url: track.preview_url,
    }));

    renderPlaylist();
    updateCurrentTrack();
    musicService = "spotify";
  } catch (error) {
    console.error("Spotify initialization failed:", error);
    throw error;
  }
}

async function initializeAppleMusic() {
  try {
    const musicKit = await window.apiManager.initializeAppleMusic();
    musicService = musicKit;

    // Load some sample tracks
    // This would typically load user's library or recommendations
    console.log("Apple Music initialized successfully");
  } catch (error) {
    console.error("Apple Music initialization failed:", error);
    throw error;
  }
}

// Set greeting based on time
function setGreeting() {
  const hour = new Date().getHours();
  let greeting = "";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

  document.getElementById("greeting").textContent = `${greeting}, User 👋`;
}

// Update statistics
function updateStats() {
  document.getElementById(
    "journal-count"
  ).textContent = `${journalEntries.length} entries`;
  document.getElementById("poems-count").textContent = `${poems.length} poems`;
  document.getElementById(
    "journal-shortcut-count"
  ).textContent = `${journalEntries.length} entries`;
  document.getElementById(
    "poems-shortcut-count"
  ).textContent = `${poems.length} poems`;

  // Update repo count
  document.getElementById("repos-count").textContent =
    githubRepos.length.toString();

  // Update recent journal entries
  const recentJournalContainer = document.getElementById(
    "recent-journal-entries"
  );
  if (journalEntries.length === 0) {
    recentJournalContainer.innerHTML =
      '<p class="text-gray-500 text-center py-4">No journal entries yet</p>';
  } else {
    recentJournalContainer.innerHTML = journalEntries
      .slice(0, 3)
      .map(
        (entry) => `
            <div class="p-3 bg-gray-50 rounded-lg">
                <h3 class="font-medium text-gray-800 mb-1">${entry.title}</h3>
                <p class="text-gray-600 text-sm line-clamp-2">${
                  entry.content
                }</p>
                <p class="text-xs text-gray-500 mt-2">${formatDate(
                  entry.date
                )}</p>
            </div>
        `
      )
      .join("");
  }
}

// Page navigation
function showPage(page) {
  // Hide all pages
  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));

  // Show selected page
  document.getElementById(`${page}-page`).classList.remove("hidden");

  // Update navigation
  updateNavigation(page);

  currentPage = page;

  // Load page-specific content
  if (page === "journal") {
    renderJournalEntries();
  } else if (page === "poetry") {
    renderPoems();
  } else if (page === "music") {
    updateCurrentTrack();
  } else if (page === "school") {
    fetchGitHubRepos();
  } else if (page === "home") {
    updateGitHubUI();
  }
}

// Update navigation active states
function updateNavigation(activePage) {
  // Desktop navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("bg-gray-800", "text-white");
    if (link.dataset.page === activePage) {
      link.classList.add("bg-gray-800", "text-white");
    }
  });

  // Mobile navigation
  document.querySelectorAll(".mobile-nav-link").forEach((link) => {
    link.classList.remove("bg-gray-700", "text-white");
    link.classList.add("text-gray-400");
    if (link.dataset.page === activePage) {
      link.classList.remove("text-gray-400");
      link.classList.add("bg-gray-700", "text-white");
    }
  });
}

// Music player functions
function togglePlayPause() {
  const audio = document.getElementById("preview-audio");
  const btn = document.getElementById("play-pause-btn");
  const icon = btn.querySelector("i");

  if (audio) {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      icon.setAttribute("data-lucide", "play");
    } else {
      audio.play();
      isPlaying = true;
      icon.setAttribute("data-lucide", "pause");
    }
  } else {
    // Play current track preview
    const currentTrackData = playlist[currentTrack];
    if (currentTrackData) {
      playPreview(currentTrackData);
    }
  }

  lucide.createIcons();
}

function nextTrack() {
  currentTrack = (currentTrack + 1) % playlist.length;
  updateCurrentTrack();
}

function previousTrack() {
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  updateCurrentTrack();
}

function updateCurrentTrack() {
  const track = playlist[currentTrack];
  document.getElementById("current-artwork").src = track.artwork;
  document.getElementById("current-title").textContent = track.title;
  document.getElementById("current-artist").textContent = track.artist;
  document.getElementById("current-album").textContent = track.album;
  document.getElementById("total-time").textContent = track.duration;

  // Update playlist active state
  renderPlaylist();
}

function renderPlaylist() {
  const playlistContainer = document.getElementById("playlist");
  playlistContainer.innerHTML = playlist
    .map(
      (track, index) => `
        <div onclick="selectTrack(${index})" class="p-3 rounded-lg cursor-pointer transition-colors ${
        index === currentTrack
          ? "bg-blue-50 border border-blue-200"
          : "hover:bg-gray-50"
      }">
            <div class="flex items-center gap-3">
                <img src="${track.artwork}" alt="${
        track.album
      }" class="w-12 h-12 rounded-lg">
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-800 truncate">${
                      track.title
                    }</h4>
                    <p class="text-sm text-gray-600 truncate">${
                      track.artist
                    }</p>
                </div>
                <span class="text-sm text-gray-500">${track.duration}</span>
            </div>
        </div>
    `
    )
    .join("");
}

function selectTrack(index) {
  currentTrack = index;
  updateCurrentTrack();

  // Auto-play preview if available
  const track = playlist[currentTrack];
  if (track && track.preview_url) {
    playPreview(track);
  }
}

function playPreview(track) {
  if (track.preview_url) {
    // Stop any currently playing audio
    const existingAudio = document.getElementById("preview-audio");
    if (existingAudio) {
      existingAudio.pause();
      existingAudio.remove();
    }

    // Create and play new audio
    const audio = document.createElement("audio");
    audio.id = "preview-audio";
    audio.src = track.preview_url;
    audio.volume = 0.5;
    audio.play();

    // Update UI
    isPlaying = true;
    const btn = document.getElementById("play-pause-btn");
    const icon = btn.querySelector("i");
    icon.setAttribute("data-lucide", "pause");
    lucide.createIcons();

    // Auto-pause after 30 seconds (Spotify preview length)
    setTimeout(() => {
      audio.pause();
      isPlaying = false;
      icon.setAttribute("data-lucide", "play");
      lucide.createIcons();
    }, 30000);
  }
}

// Journal functions
function showNewEntryModal() {
  document.getElementById("journal-modal").classList.remove("hidden");
}

function hideJournalModal() {
  document.getElementById("journal-modal").classList.add("hidden");
  document.getElementById("journal-form").reset();
  currentMood = "😊";
  updateMoodSelector();
}

function renderJournalEntries() {
  const container = document.getElementById("journal-entries");
  const searchTerm = document
    .getElementById("journal-search")
    .value.toLowerCase();

  const filteredEntries = journalEntries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchTerm) ||
      entry.content.toLowerCase().includes(searchTerm)
  );

  if (filteredEntries.length === 0) {
    container.innerHTML = `
            <div class="text-center py-12">
                <i data-lucide="book-open" class="mx-auto text-gray-400 mb-4 w-12 h-12"></i>
                <h3 class="text-lg font-medium text-gray-600 mb-2">
                    ${
                      searchTerm ? "No entries found" : "No journal entries yet"
                    }
                </h3>
                <p class="text-gray-500">
                    ${
                      searchTerm
                        ? "Try adjusting your search terms"
                        : "Start writing your first entry to capture your thoughts"
                    }
                </p>
            </div>
        `;
  } else {
    container.innerHTML = filteredEntries
      .map(
        (entry) => `
            <div class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow fade-in">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${entry.mood}</span>
                        <div>
                            <h3 class="font-semibold text-gray-800 text-lg">${
                              entry.title
                            }</h3>
                            <div class="flex items-center gap-2 text-sm text-gray-500">
                                <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                                ${formatDate(entry.date)}
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteJournalEntry('${
                          entry.id
                        }')" class="p-1 text-gray-400 hover:text-red-600 transition-colors">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${
                  entry.content
                }</p>
            </div>
        `
      )
      .join("");
  }

  lucide.createIcons();
}

function deleteJournalEntry(id) {
  if (confirm("Are you sure you want to delete this entry?")) {
    journalEntries = journalEntries.filter((entry) => entry.id !== id);
    localStorage.setItem("journalEntries", JSON.stringify(journalEntries));
    renderJournalEntries();
    updateStats();
  }
}

// Poetry functions
function showNewPoemModal() {
  document.getElementById("poem-modal").classList.remove("hidden");
}

function hidePoemModal() {
  document.getElementById("poem-modal").classList.add("hidden");
  document.getElementById("poem-form").reset();
  currentTags = [];
  renderPoemTags();
}

function addPoemTag() {
  const input = document.getElementById("poem-tag-input");
  const tag = input.value.trim();

  if (tag && !currentTags.includes(tag)) {
    currentTags.push(tag);
    input.value = "";
    renderPoemTags();
  }
}

function removePoemTag(tag) {
  currentTags = currentTags.filter((t) => t !== tag);
  renderPoemTags();
}

function renderPoemTags() {
  const container = document.getElementById("poem-tags");
  container.innerHTML = currentTags
    .map(
      (tag) => `
        <span class="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm flex items-center gap-1">
            ${tag}
            <button type="button" onclick="removePoemTag('${tag}')" class="text-green-600 hover:text-green-800">×</button>
        </span>
    `
    )
    .join("");
}

function renderPoems() {
  const container = document.getElementById("poetry-entries");
  const searchTerm = document
    .getElementById("poetry-search")
    .value.toLowerCase();

  const filteredPoems = poems.filter(
    (poem) =>
      poem.title.toLowerCase().includes(searchTerm) ||
      poem.content.toLowerCase().includes(searchTerm) ||
      poem.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
  );

  if (filteredPoems.length === 0) {
    container.innerHTML = `
            <div class="text-center py-12">
                <i data-lucide="pen-tool" class="mx-auto text-gray-400 mb-4 w-12 h-12"></i>
                <h3 class="text-lg font-medium text-gray-600 mb-2">
                    ${searchTerm ? "No poems found" : "No poems yet"}
                </h3>
                <p class="text-gray-500">
                    ${
                      searchTerm
                        ? "Try adjusting your search terms"
                        : "Start writing your first poem to express your creativity"
                    }
                </p>
            </div>
        `;
  } else {
    container.innerHTML = filteredPoems
      .map(
        (poem) => `
            <div class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow fade-in">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <h3 class="font-semibold text-gray-800 text-lg mb-1">${
                          poem.title
                        }</h3>
                        <p class="text-sm text-gray-500 mb-2">${formatDate(
                          poem.date
                        )}</p>
                        ${
                          poem.tags.length > 0
                            ? `
                            <div class="flex flex-wrap gap-1">
                                ${poem.tags
                                  .map(
                                    (tag) => `
                                    <span class="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                        <i data-lucide="tag" class="w-2.5 h-2.5"></i>
                                        ${tag}
                                    </span>
                                `
                                  )
                                  .join("")}
                            </div>
                        `
                            : ""
                        }
                    </div>
                    <div class="flex gap-2">
                        <button class="p-1 text-gray-400 hover:text-green-600 transition-colors">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deletePoem('${
                          poem.id
                        }')" class="p-1 text-gray-400 hover:text-red-600 transition-colors">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="prose prose-sm max-w-none">
                    <pre class="whitespace-pre-wrap font-serif text-gray-700 leading-relaxed">${
                      poem.content
                    }</pre>
                </div>
            </div>
        `
      )
      .join("");
  }

  lucide.createIcons();
}

function deletePoem(id) {
  if (confirm("Are you sure you want to delete this poem?")) {
    poems = poems.filter((poem) => poem.id !== id);
    localStorage.setItem("poems", JSON.stringify(poems));
    renderPoems();
    updateStats();
  }
}

// School functions
function renderAssignments() {
  const container = document.getElementById("assignments");
  container.innerHTML = assignments
    .map(
      (assignment) => `
        <div class="p-3 rounded-lg border ${
          assignment.completed
            ? "bg-green-50 border-green-200"
            : "bg-white border-gray-200"
        }">
            <div class="flex items-start justify-between mb-2">
                <h3 class="${
                  assignment.completed
                    ? "text-green-800 line-through"
                    : "text-gray-800"
                } font-medium">
                    ${assignment.title}
                </h3>
                <span class="px-2 py-1 rounded text-xs ${getPriorityColor(
                  assignment.priority
                )}">
                    ${assignment.priority}
                </span>
            </div>
            
            <div class="flex items-center justify-between text-sm">
                <span class="${
                  assignment.completed ? "text-green-600" : "text-gray-600"
                } font-medium">
                    ${assignment.subject}
                </span>
                <div class="flex items-center gap-1 text-gray-500">
                    <i data-lucide="clock" class="w-3 h-3"></i>
                    ${formatDate(assignment.dueDate, true)}
                </div>
            </div>
        </div>
    `
    )
    .join("");

  lucide.createIcons();
}

function renderNotionPages() {
  const container = document.getElementById("notion-pages");

  if (notionPages.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <i data-lucide="file-text" class="mx-auto text-gray-400 mb-4 w-12 h-12"></i>
        <h3 class="text-lg font-medium text-gray-600 mb-2">No Notion pages found</h3>
        <p class="text-gray-500 mb-4">Configure your Notion integration to see your pages here</p>
        <button onclick="showNotionSetup()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          Setup Notion
        </button>
      </div>
    `;
  } else {
    container.innerHTML =
      notionPages
        .slice(0, 10)
        .map(
          (page) => `
          <a href="${getNotionPageUrl(
            page
          )}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
            <div class="flex items-center gap-3">
                <span class="text-2xl">${getNotionPageIcon(page)}</span>
                <div>
                    <h3 class="font-medium text-gray-800">${getNotionPageTitle(
                      page
                    )}</h3>
                    <p class="text-sm text-gray-500">Last edited ${formatDate(
                      page.last_edited_time
                    )}</p>
                </div>
            </div>
            <i data-lucide="external-link" class="text-gray-400 group-hover:text-gray-600 transition-colors w-4.5 h-4.5"></i>
          </a>
      `
        )
        .join("") +
      `
        <div class="border-t border-gray-200 pt-4 mt-6">
            <a href="https://notion.so" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                <i data-lucide="file-text" class="w-4 h-4"></i>
                Open Notion Workspace
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            </a>
        </div>
    `;
  }

  lucide.createIcons();
}

function fetchNotionPages() {
  // Refresh Notion pages
  const container = document.getElementById("notion-pages");
  container.innerHTML = `
        <div class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p class="text-gray-500 mt-2">Loading Notion pages...</p>
        </div>
    `;

  initializeNotion()
    .then(() => {
      renderNotionPages();
    })
    .catch(() => {
      showNotionError();
    });
}

// GitHub integration
function updateGitHubUI() {
  const container = document.getElementById("github-repos");

  if (githubRepos.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p class="text-gray-500 mt-2">Loading repositories...</p>
      </div>
    `;
  } else {
    container.innerHTML = githubRepos
      .slice(0, 3)
      .map(
        (repo) => `
            <div class="p-3 bg-gray-50 rounded-lg">
                <div class="flex items-start justify-between">
                    <div>
                        <h3 class="font-medium text-gray-800">${repo.name}</h3>
                        <p class="text-gray-600 text-sm">${
                          repo.description || "No description"
                        }</p>
                        <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>${repo.language || "Unknown"}</span>
                            <span>★ ${repo.stargazers_count}</span>
                        </div>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }
}

async function fetchGitHubRepos() {
  try {
    await initializeGitHub();
  } catch (error) {
    showGitHubError();
  }
}

function showGitHubError() {
  const container = document.getElementById("github-repos");
  container.innerHTML = `
    <div class="text-center py-4">
      <p class="text-red-600 mb-2">Failed to load repositories</p>
      <p class="text-gray-500 text-sm mb-3">Check your GitHub configuration</p>
      <button onclick="fetchGitHubRepos()" class="text-blue-600 hover:text-blue-700 text-sm">Try again</button>
    </div>
  `;
}

function showNotionError() {
  const container = document.getElementById("notion-pages");
  container.innerHTML = `
    <div class="text-center py-8">
      <i data-lucide="alert-circle" class="mx-auto text-red-400 mb-4 w-12 h-12"></i>
      <h3 class="text-lg font-medium text-red-600 mb-2">Notion Connection Failed</h3>
      <p class="text-gray-500 mb-4">Check your Notion integration token</p>
      <button onclick="fetchNotionPages()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
        Retry Connection
      </button>
    </div>
  `;
  lucide.createIcons();
}

function showNotionSetupMessage() {
  const container = document.getElementById("notion-pages");
  container.innerHTML = `
    <div class="text-center py-8">
      <i data-lucide="settings" class="mx-auto text-gray-400 mb-4 w-12 h-12"></i>
      <h3 class="text-lg font-medium text-gray-600 mb-2">Notion Not Configured</h3>
      <p class="text-gray-500 mb-4">Add your Notion integration token to see your pages</p>
      <button onclick="showNotionSetup()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
        Setup Guide
      </button>
    </div>
  `;
  lucide.createIcons();
}

function showMusicSetupMessage() {
  // Update music page to show setup message
  console.log("Music services not configured. Using default playlist.");
}

function showMusicError() {
  console.error("Music service connection failed. Using default playlist.");
}

function showNotionSetup() {
  alert(
    "Please check the setup-guide.md file for instructions on configuring Notion integration."
  );
}

// Utility functions for Notion API
function getNotionPageTitle(page) {
  if (page.properties && page.properties.title) {
    return page.properties.title.title[0]?.plain_text || "Untitled";
  }
  return page.title || "Untitled";
}

function getNotionPageIcon(page) {
  if (page.icon) {
    if (page.icon.type === "emoji") {
      return page.icon.emoji;
    } else if (page.icon.type === "external") {
      return "🔗";
    }
  }
  return "📄";
}

function getNotionPageUrl(page) {
  return page.url || `https://notion.so/${page.id.replace(/-/g, "")}`;
}

// Music utility functions
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Event listeners
function setupEventListeners() {
  // Journal form
  document
    .getElementById("journal-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const title = document.getElementById("journal-title").value;
      const content = document.getElementById("journal-content").value;

      const entry = {
        id: Date.now().toString(),
        title,
        content,
        mood: currentMood,
        date: new Date().toISOString(),
      };

      journalEntries.unshift(entry);
      localStorage.setItem("journalEntries", JSON.stringify(journalEntries));

      hideJournalModal();
      updateStats();
      if (currentPage === "journal") {
        renderJournalEntries();
      }
    });

  // Poem form
  document.getElementById("poem-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const title = document.getElementById("poem-title").value;
    const content = document.getElementById("poem-content").value;

    const poem = {
      id: Date.now().toString(),
      title,
      content,
      tags: [...currentTags],
      date: new Date().toISOString(),
    };

    poems.unshift(poem);
    localStorage.setItem("poems", JSON.stringify(poems));

    hidePoemModal();
    updateStats();
    if (currentPage === "poetry") {
      renderPoems();
    }
  });

  // Mood selector
  document.querySelectorAll(".mood-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      currentMood = this.dataset.mood;
      updateMoodSelector();
    });
  });

  // Search inputs
  document
    .getElementById("journal-search")
    .addEventListener("input", function () {
      if (currentPage === "journal") {
        renderJournalEntries();
      }
    });

  document
    .getElementById("poetry-search")
    .addEventListener("input", function () {
      if (currentPage === "poetry") {
        renderPoems();
      }
    });

  // Music controls
  document
    .getElementById("progress-slider")
    .addEventListener("input", function () {
      const progress = this.value;
      const minutes = Math.floor((progress * 2.1) / 60);
      const seconds = Math.floor((progress * 2.1) % 60);
      document.getElementById(
        "current-time"
      ).textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    });

  document
    .getElementById("volume-slider")
    .addEventListener("input", function () {
      document.getElementById("volume-display").textContent = `${this.value}%`;
    });

  // Tag input enter key
  document
    .getElementById("poem-tag-input")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addPoemTag();
      }
    });
}

// Utility functions
function updateMoodSelector() {
  document.querySelectorAll(".mood-btn").forEach((btn) => {
    btn.classList.remove("bg-blue-100", "border-2", "border-blue-500");
    if (btn.dataset.mood === currentMood) {
      btn.classList.add("bg-blue-100", "border-2", "border-blue-500");
    }
  });
}

function formatDate(dateString, shortFormat = false) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (shortFormat) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (diffDays === 1) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getPriorityColor(priority) {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
