document.addEventListener("DOMContentLoaded", async () => {
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const albumId = urlParams.get("albumId")
  const theme = urlParams.get("theme") || "default"

  // Apply theme
  applyTheme(theme)

  // Set up theme buttons
  setupThemeButtons()

  // Load album selector
  await loadAlbumSelector()

  // Load specific album if ID is provided, otherwise show album selection
  if (albumId) {
    await loadAlbum(albumId)
  } else {
    showAlbumSelection()
  }
})

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme)

  // Update active state on theme buttons
  document.querySelectorAll(".theme-button").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-theme") === theme)
  })
}

function setupThemeButtons() {
  document.querySelectorAll(".theme-button").forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.getAttribute("data-theme")

      // Update URL with new theme
      const url = new URL(window.location)
      url.searchParams.set("theme", theme)
      window.history.pushState({}, "", url)

      // Apply the theme
      applyTheme(theme)
    })
  })
}

async function loadAlbumSelector() {
  try {
    const albums = await window.supabaseClient.fetchAllAlbums()

    const albumSelector = document.getElementById("albumSelector")
    if (!albumSelector) return

    albumSelector.innerHTML = ""

    albums.forEach((album) => {
      const albumCard = document.createElement("div")
      albumCard.className = "album-card"
      albumCard.innerHTML = `
        <div class="album-cover" style="background-image: url('${album["Album Art"] || "/placeholder.jpg"}')"></div>
        <div class="album-info">
          <h3>${album["Album Title"]}</h3>
          <p>${album["DOMAIN"] || ""}</p>
        </div>
      `

      albumCard.addEventListener("click", () => {
        // Update URL and load album
        const url = new URL(window.location)
        url.searchParams.set("albumId", album.AlbumID)
        window.history.pushState({}, "", url)

        loadAlbum(album.AlbumID)
      })

      albumSelector.appendChild(albumCard)
    })
  } catch (error) {
    console.error("Error loading album selector:", error)
    document.getElementById("albumSelector").innerHTML = '<p class="error">Error loading albums. Please try again.</p>'
  }
}

async function loadAlbum(albumId) {
  try {
    // Show loading state
    document.getElementById("loadingMessage").textContent = `Loading album ${albumId}...`
    document.getElementById("playerView").classList.add("loading")
    document.getElementById("albumSelection").style.display = "none"
    document.getElementById("playerView").style.display = "block"

    // Fetch album data
    const album = await window.supabaseClient.fetchAlbumById(albumId)

    if (!album) {
      throw new Error(`Album ${albumId} not found`)
    }

    // Fetch tracks for this album
    const tracks = await window.supabaseClient.fetchTracksByAlbumId(albumId)

    // Update UI with album data
    document.getElementById("albumTitle").textContent = album["Album Title"]
    document.getElementById("albumDomain").textContent = album["DOMAIN"] || ""

    // Set album cover if available
    if (album["Album Art"]) {
      document.getElementById("albumCover").style.backgroundImage = `url('${album["Album Art"]}')`
      document.getElementById("albumCover").style.display = "block"
    } else {
      document.getElementById("albumCover").style.display = "none"
    }

    // Populate tracks
    const tracksList = document.getElementById("tracksList")
    tracksList.innerHTML = ""

    if (tracks.length === 0) {
      tracksList.innerHTML = '<p class="no-tracks">No tracks available for this album</p>'
    } else {
      tracks.forEach((track, index) => {
        const trackElement = document.createElement("div")
        trackElement.className = "track"
        trackElement.innerHTML = `
          <div class="track-number">${track.TrackNumber || index + 1}</div>
          <div class="track-title">${track.Title}</div>
          <div class="track-duration">${track.Duration || "0:00"}</div>
          <button class="play-button" data-track-id="${track.id || index}">
            <span class="play-icon">▶</span>
          </button>
        `

        // Add click handler for play button
        trackElement.querySelector(".play-button").addEventListener("click", () => {
          playTrack(track, album)
        })

        tracksList.appendChild(trackElement)
      })
    }

    // Show back button
    document.getElementById("backButton").style.display = "block"

    // Hide loading message
    document.getElementById("loadingMessage").textContent = ""
    document.getElementById("playerView").classList.remove("loading")
  } catch (error) {
    console.error("Error loading album:", error)
    document.getElementById("loadingMessage").textContent = `Error: ${error.message}`
  }
}

function showAlbumSelection() {
  document.getElementById("albumSelection").style.display = "block"
  document.getElementById("playerView").style.display = "none"
  document.getElementById("loadingMessage").textContent = ""
}

function playTrack(track, album) {
  // Get or create audio player
  let audioPlayer = document.getElementById("audioPlayer")
  if (!audioPlayer) {
    audioPlayer = document.createElement("audio")
    audioPlayer.id = "audioPlayer"
    audioPlayer.controls = true
    document.getElementById("playerContainer").appendChild(audioPlayer)
  }

  // Set audio source if available
  if (track.MP3File) {
    audioPlayer.src = track.MP3File
    audioPlayer.play()

    // Update now playing info
    document.getElementById("nowPlayingTitle").textContent = track.Title
    document.getElementById("nowPlayingAlbum").textContent = album["Album Title"]
    document.getElementById("nowPlaying").style.display = "block"
  } else {
    // If no MP3 file available, show message
    alert(`No audio file available for "${track.Title}"`)
    document.getElementById("nowPlaying").style.display = "none"
  }

  // Update active track styling
  document.querySelectorAll(".track").forEach((el) => {
    el.classList.remove("active")
  })

  // Find and highlight the current track
  document.querySelectorAll(".track").forEach((el) => {
    const trackId = el.querySelector(".play-button").getAttribute("data-track-id")
    if (trackId == (track.id || track.TrackNumber)) {
      el.classList.add("active")
    }
  })
}

// Back button handler
document.getElementById("backButton").addEventListener("click", () => {
  // Update URL to remove albumId
  const url = new URL(window.location)
  url.searchParams.delete("albumId")
  window.history.pushState({}, "", url)

  // Show album selection
  showAlbumSelection()
})

