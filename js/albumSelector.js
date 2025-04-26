/**
 * Album Selector Module
 *
 * This module handles the selection of albums by ID
 * and provides a UI for switching between albums.
 */

class AlbumSelector {
  constructor(mediaPlayer) {
    this.mediaPlayer = mediaPlayer
    this.sheetFetcher = new GoogleSheetFetcher()
    this.currentAlbumId = null
    this.albumsData = {}
  }

  /**
   * Initialize the album selector
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Fetch all albums data
      this.albumsData = await this.sheetFetcher.fetchAllAlbums()

      // Create album selector UI if there are multiple albums
      if (Object.keys(this.albumsData).length > 1) {
        this.createAlbumSelectorUI()
      }

      // Get album ID from URL parameter or use the first album
      const urlParams = new URLSearchParams(window.location.search)
      const albumId = urlParams.get("albumId") || Object.keys(this.albumsData)[0]

      // Load the album
      await this.loadAlbum(albumId)
    } catch (error) {
      console.error("Error initializing album selector:", error)
      // Show error message to user
      this.showErrorMessage("Failed to load albums data. Please try again later.")
    }
  }

  /**
   * Create the album selector UI
   */
  createAlbumSelectorUI() {
    // Create album selector container
    const selectorContainer = document.createElement("div")
    selectorContainer.className = "album-selector"

    // Create label
    const label = document.createElement("label")
    label.textContent = "Select Album:"
    selectorContainer.appendChild(label)

    // Create select element
    const select = document.createElement("select")
    select.id = "album-select"

    // Add options for each album
    Object.entries(this.albumsData).forEach(([albumId, album]) => {
      const option = document.createElement("option")
      option.value = albumId
      option.textContent = album.title || albumId
      select.appendChild(option)
    })

    // Add change event listener
    select.addEventListener("change", (e) => {
      const albumId = e.target.value

      // Update URL parameter
      const url = new URL(window.location)
      url.searchParams.set("albumId", albumId)
      window.history.pushState({}, "", url)

      // Load the selected album
      this.loadAlbum(albumId)
    })

    selectorContainer.appendChild(select)

    // Add selector to the page
    const mediaPlayerModule = document.querySelector(".media-player-module")
    mediaPlayerModule.parentNode.insertBefore(selectorContainer, mediaPlayerModule)

    // Add styles
    const style = document.createElement("style")
    style.textContent = `
            .album-selector {
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .album-selector label {
                font-weight: bold;
            }
            
            .album-selector select {
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid #ccc;
                background-color: #fff;
                font-size: 16px;
                min-width: 200px;
            }
        `
    document.head.appendChild(style)
  }

  /**
   * Load album data by ID
   * @param {string} albumId - The album ID to load
   * @returns {Promise<void>}
   */
  async loadAlbum(albumId) {
    if (!albumId || this.currentAlbumId === albumId) return

    try {
      // Get album data
      const albumData = this.albumsData[albumId]
      if (!albumData) {
        throw new Error(`Album with ID "${albumId}" not found`)
      }

      // Update current album ID
      this.currentAlbumId = albumId

      // Update album selector if it exists
      const albumSelect = document.getElementById("album-select")
      if (albumSelect) {
        albumSelect.value = albumId
      }

      // Update media player with album data
      this.mediaPlayer.loadAlbumData(albumData)

      // Update URL parameter
      const url = new URL(window.location)
      url.searchParams.set("albumId", albumId)
      window.history.replaceState({}, "", url)
    } catch (error) {
      console.error(`Error loading album ${albumId}:`, error)
      this.showErrorMessage(`Failed to load album "${albumId}". Please try another album.`)
    }
  }

  /**
   * Show error message to user
   * @param {string} message - The error message to display
   */
  showErrorMessage(message) {
    const errorContainer = document.createElement("div")
    errorContainer.className = "error-message"
    errorContainer.textContent = message

    // Add to page
    const container = document.querySelector(".container")
    container.prepend(errorContainer)

    // Add styles
    const style = document.createElement("style")
    style.textContent = `
            .error-message {
                background-color: #f8d7da;
                color: #721c24;
                padding: 12px;
                margin-bottom: 20px;
                border-radius: 4px;
                border: 1px solid #f5c6cb;
            }
        `
    document.head.appendChild(style)

    // Remove after 5 seconds
    setTimeout(() => {
      errorContainer.remove()
    }, 5000)
  }
}

// Export the class
window.AlbumSelector = AlbumSelector
