/**
 * Album Handler Module
 * 
 * This module handles URL parameters for album selection and theme application.
 * It integrates with the existing GoogleSheetFetcher to load album data.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const albumId = urlParams.get("albumId");
  const theme = urlParams.get("theme");

  console.log("Album ID from URL:", albumId);
  console.log("Theme from URL:", theme);

  // Apply theme if specified
  if (theme) {
    applyTheme(theme);
  }

  // Load album if ID is provided
  if (albumId && window.googleSheetFetcher) {
    loadAlbumById(albumId);
  }
});

/**
 * Apply a theme to the player
 * @param {string} theme - The theme name to apply
 */
function applyTheme(theme) {
  // Find the theme button with matching data-theme
  const themeButtons = document.querySelectorAll(".theme-button");
  
  // Find the player container
  const playerContainer = document.querySelector(".media-player-module");
  
  // Apply theme class to container
  if (playerContainer) {
    // Remove existing theme classes
    const themeClasses = Array.from(playerContainer.classList)
      .filter(cls => cls.startsWith("theme-"));
    
    themeClasses.forEach(cls => playerContainer.classList.remove(cls));
    
    // Add new theme class
    playerContainer.classList.add(`theme-${theme}`);
  }
  
  // Update active button
  themeButtons.forEach(button => {
    // Remove active class from all buttons
    button.classList.remove("active");
    
    // Add active class to matching button
    const buttonTheme = button.getAttribute("data-theme");
    if (buttonTheme === `theme-${theme}`) {
      button.classList.add("active");
    }
  });
}

/**
 * Load album by ID using the existing GoogleSheetFetcher
 * @param {string} albumId - The album ID to load
 */
async function loadAlbum(albumId) {
  try {
    // Update loading message
    const loadingElement = document.querySelector("#loadingMessage") || document.querySelector(".loading-message")
    if (loadingElement) {
      loadingElement.textContent = `Loading album ${albumId}...`
    }

    // Use GoogleSheetFetcher to get album data
    const fetcher = new GoogleSheetFetcher()
    console.log("Fetching album data using GoogleSheetFetcher...")
    const albumData = await fetcher.getAlbumById(albumId)
    
    console.log("Album data received:", albumData)
    
    if (!albumData) {
      throw new Error(`Album ${albumId} not found`)
    }
    
    // Update UI with album data
    const titleElement = document.querySelector("#albumTitle") || document.querySelector(".album-title")
    if (titleElement) {
      titleElement.textContent = albumData.title || `Album: ${albumId}`
    }

    if (loadingElement) {
      loadingElement.textContent = ""
    }

    // Display tracks
    const tracksContainer = document.querySelector("#tracksList") || document.querySelector(".tracks-container")
    if (tracksContainer && albumData.tracks && albumData.tracks.length > 0) {
      tracksContainer.innerHTML = ""
      
      albumData.tracks.forEach((track, index) => {
        const trackElement = document.createElement("div")
        trackElement.className = "track"
        trackElement.innerHTML = `
          <div class="track-number">${track.id || index + 1}</div>
          <div class="track-title">${track.title}</div>
          <div class="track-duration">${formatDuration(track.duration || 180)}</div>
          <button class="play-button" data-src="${track.src}">Preview</button>
        `
        tracksContainer.appendChild(trackElement)
      })
      
      // Add event listeners to play buttons
      document.querySelectorAll(".play-button").forEach(button => {
        button.addEventListener("click", function() {
          const src = this.getAttribute("data-src")
          playTrack(src)
        })
      })
    } else {
      // If no tracks found, show a message
      if (tracksContainer) {
        tracksContainer.innerHTML = "<div class='no-tracks'>No tracks found for this album</div>"
      }
    }
  } catch (error) {
    console.error("Error loading album:", error)
    const loadingElement = document.querySelector("#loadingMessage") || document.querySelector(".loading-message")
    if (loadingElement) {
      loadingElement.textContent = `Error loading album: ${error.message}`
    }
  }
}

// Helper function to format duration
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Helper function to play a track
function playTrack(src) {
  const player = document.querySelector("#audioPlayer") || document.createElement("audio")
  player.id = "audioPlayer"
  player.controls = true
  player.src = src
  player.play()
  
  if (!document.querySelector("#audioPlayer")) {
    const container = document.querySelector("#playerContainer") || document.body
    container.appendChild(player)
  }
}
