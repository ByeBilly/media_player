// Album loading functionality
document.addEventListener("DOMContentLoaded", () => {
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const albumId = urlParams.get("albumId");
  const theme = urlParams.get("theme");

  console.log("Album ID:", albumId);
  console.log("Theme:", theme);

  // Apply theme if specified
  if (theme) {
    applyTheme(theme);
  }

  // Load album if ID is provided
  if (albumId) {
    loadAlbum(albumId);
  } else {
    // Show a message if no album ID is provided
    const albumTitle = document.querySelector(".album-title");
    if (albumTitle) {
      albumTitle.textContent = "No Album Selected";
    }
    
    const loadingIndicator = document.querySelector(".loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.textContent = "Please provide an album ID in the URL (e.g., ?albumId=123)";
    }
  }
});

function applyTheme(theme) {
  // Find the theme button
  const themeButtons = document.querySelectorAll(".theme-button");
  const themeContainer = document.querySelector(".media-player-module");
  
  // Remove all theme classes from container
  if (themeContainer) {
    themeContainer.className = "media-player-module";
    themeContainer.classList.add(`theme-${theme}`);
  }

  // Update active button
  themeButtons.forEach((button) => {
    button.classList.remove("active");
    
    if (button.getAttribute("data-theme") === `theme-${theme}`) {
      button.classList.add("active");
    }
  });
}

async function loadAlbum(albumId) {
  try {
    // Update loading message
    const albumTitle = document.querySelector(".album-title");
    const loadingIndicator = document.querySelector(".loading-indicator");
    
    if (loadingIndicator) {
      loadingIndicator.textContent = `Loading album ${albumId}...`;
    }

    // In a real implementation, you would fetch album data from an API or Google Sheet
    // For now, we'll simulate loading with a timeout
    setTimeout(() => {
      if (albumTitle) {
        albumTitle.textContent = `Album: ${albumId}`;
      }
      
      if (loadingIndicator) {
        loadingIndicator.textContent = "Album loaded successfully!";
      }
      
      // Create some dummy tracks for demonstration
      const tracksGrid = document.querySelector(".tracks-grid");
      if (tracksGrid) {
        // Clear existing content except the loading indicator
        const loadingElement = tracksGrid.querySelector(".loading-indicator");
        tracksGrid.innerHTML = "";
        
        // Add demo tracks
        for (let i = 1; i <= 5; i++) {
          const trackDiv = document.createElement("div");
          trackDiv.className = "track";
          trackDiv.innerHTML = `
            <div class="track-number">${i}</div>
            <div class="track-title">Demo Track ${i}</div>
            <div class="track-duration">${Math.floor(Math.random() * 3) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}</div>
            <div class="track-preview-button">Preview</div>
          `;
          tracksGrid.appendChild(trackDiv);
        }
        
        // Re-add the loading indicator but hide it
        if (loadingElement) {
          loadingElement.style.display = "none";
          tracksGrid.appendChild(loadingElement);
        }
      }
    }, 1500);
  } catch (error) {
    console.error("Error loading album:", error);
    const loadingIndicator = document.querySelector(".loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.textContent = "Error loading album. Please try again.";
    }
  }
}
