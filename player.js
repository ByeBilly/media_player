/**
 * Futuristic Media Player Module
 *
 * Features:
 * - 30-second preview functionality
 * - Theme customization
 * - Payment verification
 * - Full playback and download after purchase
 * - Responsive design
 * - Google Sheet integration for dynamic album data
 */

class MediaPlayer {
  constructor() {
    // Configuration
    this.PREVIEW_DURATION = 30 // Preview duration in seconds
    this.STRIPE_PAYMENT_LINK = "" // Will be loaded from album data
    this.TRACKS_DATA = [] // Will be loaded from album data

    // DOM Elements
    this.mediaPlayerModule = null
    this.tracksGrid = null
    this.themeButtons = null
    this.purchaseButton = null
    this.downloadAllButton = null
    this.previewSection = null
    this.purchasedSection = null
    this.albumTitleElement = null

    // State
    this.currentlyPlaying = null
    this.isPurchased = false
    this.currentAlbum = null
  }

  /**
   * Initialize the media player
   */
  initialize() {
    // Get DOM elements
    this.mediaPlayerModule = document.querySelector(".media-player-module")
    this.tracksGrid = document.querySelector(".tracks-grid")
    this.themeButtons = document.querySelectorAll(".theme-button")
    this.purchaseButton = document.querySelector(".purchase-button")
    this.downloadAllButton = document.querySelector(".download-all-button")
    this.previewSection = document.querySelector(".purchase-section.preview-mode")
    this.purchasedSection = document.querySelector(".purchase-section.purchased-mode")
    this.albumTitleElement = document.querySelector(".album-title")

    // Initialize album selector
    this.albumSelector = new AlbumSelector(this)
    this.albumSelector.initialize()

    // Set up theme switching
    this.setupThemeSwitching()

    // Add pulse animation class
    this.addPulseAnimation()
  }

  /**
   * Load album data into the player
   * @param {Object} albumData - The album data to load
   */
  loadAlbumData(albumData) {
    if (!albumData) return

    // Store current album
    this.currentAlbum = albumData

    // Update payment link
    this.STRIPE_PAYMENT_LINK = albumData.paymentLink || ""

    // Update tracks data
    this.TRACKS_DATA = albumData.tracks || []

    // Update album title
    if (this.albumTitleElement) {
      this.albumTitleElement.textContent = albumData.title || ""
    }

    // Update theme
    if (albumData.theme) {
      this.setTheme(albumData.theme)
    }

    // Clear purchase status
    localStorage.removeItem("albumPurchaseToken-" + albumData.id)

    // Set purchase status based on lock field
    this.isPurchased = !albumData.lock

    // Create tracks
    this.createTracks()

    // Update UI based on lock status
    if (!albumData.lock) {
      this.unlockFullAccess()
    } else {
      // Show preview mode
      if (this.previewSection) this.previewSection.classList.remove("hidden")
      if (this.purchasedSection) this.purchasedSection.classList.add("hidden")

      // Check if user has previously purchased
      this.checkPurchaseStatus()
    }
  }

  /**
   * Check if user has already purchased the current album
   */
  checkPurchaseStatus() {
    if (!this.currentAlbum) return

    // In a real implementation, this would verify with a server
    // For demo purposes, we'll check localStorage
    const purchaseToken = localStorage.getItem("albumPurchaseToken-" + this.currentAlbum.id)
    if (purchaseToken) {
      this.verifyPurchase(purchaseToken)
    }
  }

  /**
   * Verify purchase token
   * @param {string} token - The purchase token to verify
   */
  verifyPurchase(token) {
    // In a real implementation, this would verify with a server
    // For demo purposes, we'll just accept any token
    if (token) {
      this.isPurchased = true
      this.unlockFullAccess()
    }
  }

  /**
   * Unlock full access after purchase
   */
  unlockFullAccess() {
    if (!this.mediaPlayerModule) return

    this.mediaPlayerModule.querySelectorAll(".track-item").forEach((track) => {
      track.classList.remove("preview-mode")
      track.querySelector(".download").removeAttribute("disabled")
    })

    this.previewSection.classList.add("hidden")
    this.purchasedSection.classList.remove("hidden")
    this.downloadAllButton.removeAttribute("disabled")

    // Store purchase status
    if (this.currentAlbum) {
      localStorage.setItem("albumPurchaseToken-" + this.currentAlbum.id, "purchased-" + Date.now())
    }
  }

  /**
   * Format time (seconds to MM:SS)
   * @param {number} seconds - The time in seconds
   * @returns {string} Formatted time string (MM:SS)
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  /**
   * Create track elements
   */
  createTracks() {
    if (!this.tracksGrid) return

    // Clear existing tracks
    this.tracksGrid.innerHTML = ""

    // Create tracks
    this.TRACKS_DATA.forEach((track) => {
      const trackElement = document.createElement("div")
      trackElement.className = "track-item preview-mode"
      trackElement.dataset.trackId = track.id

      trackElement.innerHTML = `
                <div class="track-number">${track.id.toString().padStart(2, "0")}</div>
                <div class="track-info">
                    <h3 class="track-title">${track.title}</h3>
                    <div class="track-duration">
                        <span class="current-time">0:00</span>
                        <span class="duration-separator">/</span>
                        <span class="total-time">${this.formatTime(track.duration)}</span>
                    </div>
                </div>
                <div class="track-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                        <div class="preview-indicator">PREVIEW MODE - 30 SEC</div>
                    </div>
                </div>
                <div class="track-controls">
                    <button class="control-button play-pause">
                        <span class="play-icon">▶</span>
                        <span class="pause-icon">⏸</span>
                    </button>
                    <button class="control-button download" disabled>
                        <span class="download-icon">↓</span>
                    </button>
                </div>
                <div class="track-visualizer">
                    <div class="visualizer-bar"></div>
                    <div class="visualizer-bar"></div>
                    <div class="visualizer-bar"></div>
                    <div class="visualizer-bar"></div>
                    <div class="visualizer-bar"></div>
                </div>
                <audio class="track-audio" src="${track.src}" preload="metadata"></audio>
            `

      this.tracksGrid.appendChild(trackElement)

      // Setup audio element
      const audio = trackElement.querySelector(".track-audio")
      const playPauseButton = trackElement.querySelector(".play-pause")
      const progressFill = trackElement.querySelector(".progress-fill")
      const currentTimeDisplay = trackElement.querySelector(".current-time")
      const totalTimeDisplay = trackElement.querySelector(".total-time")
      const visualizerBars = trackElement.querySelectorAll(".visualizer-bar")
      const downloadButton = trackElement.querySelector(".download")

      // Update duration when metadata is loaded
      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration && !isNaN(audio.duration)) {
          track.duration = audio.duration
          totalTimeDisplay.textContent = this.formatTime(track.duration)
        }
      })

      // Play/Pause functionality
      playPauseButton.addEventListener("click", () => {
        if (this.currentlyPlaying && this.currentlyPlaying !== audio) {
          // Stop currently playing track
          this.currentlyPlaying.pause()
          this.currentlyPlaying.currentTime = 0
          document.querySelector(".track-item.playing")?.classList.remove("playing")
        }

        if (audio.paused) {
          audio.play()
          trackElement.classList.add("playing")
          this.currentlyPlaying = audio
          this.animateVisualizer(visualizerBars)
        } else {
          audio.pause()
          trackElement.classList.remove("playing")
          this.currentlyPlaying = null
          this.stopVisualizerAnimation(visualizerBars)
        }
      })

      // Track progress update
      audio.addEventListener("timeupdate", () => {
        const currentTime = audio.currentTime
        currentTimeDisplay.textContent = this.formatTime(currentTime)

        // Calculate progress percentage
        const duration = this.isPurchased ? track.duration : Math.min(this.PREVIEW_DURATION, track.duration)
        const progress = (currentTime / duration) * 100
        progressFill.style.width = `${progress}%`

        // Preview mode: stop after 30 seconds
        if (!this.isPurchased && currentTime >= this.PREVIEW_DURATION) {
          audio.pause()
          audio.currentTime = 0
          trackElement.classList.remove("playing")
          this.currentlyPlaying = null
          this.stopVisualizerAnimation(visualizerBars)

          // Show purchase prompt
          this.showPurchasePrompt()
        }
      })

      // Track ended event
      audio.addEventListener("ended", () => {
        audio.currentTime = 0
        trackElement.classList.remove("playing")
        this.currentlyPlaying = null
        this.stopVisualizerAnimation(visualizerBars)
      })

      // Download button functionality
      downloadButton.addEventListener("click", () => {
        if (this.isPurchased) {
          // Create a download link
          const downloadLink = document.createElement("a")
          downloadLink.href = track.src
          downloadLink.download = `${track.id.toString().padStart(2, "0")} - ${track.title}.mp3`
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
        }
      })
    })

    // Set up purchase button
    this.setupPurchaseButton()

    // Set up download all button
    this.setupDownloadAllButton()
  }

  /**
   * Set up purchase button functionality
   */
  setupPurchaseButton() {
    if (!this.purchaseButton) return

    // Remove existing event listeners
    const newPurchaseButton = this.purchaseButton.cloneNode(true)
    this.purchaseButton.parentNode.replaceChild(newPurchaseButton, this.purchaseButton)
    this.purchaseButton = newPurchaseButton

    // Update button text with price if available
    if (this.currentAlbum && this.currentAlbum.price) {
      this.purchaseButton.querySelector(".purchase-text").textContent = `Buy Full Album for ${this.currentAlbum.price}`
    }

    // Add event listener
    this.purchaseButton.addEventListener("click", () => {
      // In a real implementation, this would redirect to Stripe
      // For demo purposes, we'll simulate a successful purchase

      if (this.STRIPE_PAYMENT_LINK) {
        // Normally would redirect to:
        window.open(this.STRIPE_PAYMENT_LINK, "_blank")

        // For demo, also simulate purchase completion with confirmation
        if (
          confirm(
            "This will open the Stripe payment page in a new tab. For demo purposes, would you also like to simulate a successful purchase?",
          )
        ) {
          this.unlockFullAccess()
        }
      } else {
        // No payment link, just simulate purchase
        if (
          confirm(
            "This would normally redirect to Stripe payment. For demo purposes, would you like to simulate a successful purchase?",
          )
        ) {
          this.unlockFullAccess()
        }
      }
    })
  }

  /**
   * Set up download all button functionality
   */
  setupDownloadAllButton() {
    if (!this.downloadAllButton) return

    // Remove existing event listeners
    const newDownloadAllButton = this.downloadAllButton.cloneNode(true)
    this.downloadAllButton.parentNode.replaceChild(newDownloadAllButton, this.downloadAllButton)
    this.downloadAllButton = newDownloadAllButton

    // Add event listener
    this.downloadAllButton.addEventListener("click", () => {
      if (this.isPurchased) {
        // In a real implementation, this might create a zip file
        // For demo purposes, we'll trigger downloads for each track
        this.TRACKS_DATA.forEach((track, index) => {
          // Stagger downloads to prevent browser issues
          setTimeout(() => {
            const downloadLink = document.createElement("a")
            downloadLink.href = track.src
            downloadLink.download = `${track.id.toString().padStart(2, "0")} - ${track.title}.mp3`
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
          }, index * 500)
        })
      }
    })
  }

  /**
   * Set up theme switching
   */
  setupThemeSwitching() {
    if (!this.themeButtons || !this.mediaPlayerModule) return

    this.themeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const themeClass = button.dataset.theme
        this.setTheme(themeClass)
      })
    })
  }

  /**
   * Set theme
   * @param {string} themeClass - The theme class to set
   */
  setTheme(themeClass) {
    if (!this.mediaPlayerModule || !this.themeButtons) return

    // Remove active class from all buttons
    this.themeButtons.forEach((btn) => btn.classList.remove("active"))

    // Add active class to matching button
    const matchingButton = Array.from(this.themeButtons).find((btn) => btn.dataset.theme === themeClass)
    if (matchingButton) {
      matchingButton.classList.add("active")
    }

    // Remove all theme classes
    this.mediaPlayerModule.className = "media-player-module"

    // Add selected theme class
    this.mediaPlayerModule.classList.add(themeClass)
  }

  /**
   * Visualizer animation
   * @param {NodeList} bars - The visualizer bars to animate
   */
  animateVisualizer(bars) {
    bars.forEach((bar) => {
      const height = Math.floor(Math.random() * 25) + 5
      bar.style.height = `${height}px`

      // Set up continuous animation
      const animateBar = () => {
        if (!bar.parentElement.parentElement.classList.contains("playing")) return

        const height = Math.floor(Math.random() * 25) + 5
        bar.style.height = `${height}px`

        // Random timing for natural effect
        const delay = Math.floor(Math.random() * 200) + 100
        setTimeout(animateBar, delay)
      }

      animateBar()
    })
  }

  /**
   * Stop visualizer animation
   * @param {NodeList} bars - The visualizer bars to stop animating
   */
  stopVisualizerAnimation(bars) {
    bars.forEach((bar) => {
      bar.style.height = "5px"
    })
  }

  /**
   * Show purchase prompt
   */
  showPurchasePrompt() {
    if (!this.purchaseButton) return

    // Highlight the purchase button
    this.purchaseButton.classList.add("pulse-animation")
    setTimeout(() => {
      this.purchaseButton.classList.remove("pulse-animation")
    }, 2000)
  }

  /**
   * Add pulse animation class
   */
  addPulseAnimation() {
    // Check if already added
    if (document.querySelector("style#pulse-animation")) return

    // Add pulse animation class
    const style = document.createElement("style")
    style.id = "pulse-animation"
    style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); box-shadow: 0 0 20px var(--theme-glow); }
                100% { transform: scale(1); }
            }
            
            .pulse-animation {
                animation: pulse 0.5s ease-in-out infinite;
            }
        `
    document.head.appendChild(style)
  }
}

// Initialize on DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
  const mediaPlayer = new MediaPlayer()
  mediaPlayer.initialize()
})

// Dummy AlbumSelector class for demonstration purposes
class AlbumSelector {
  constructor(mediaPlayer) {
    this.mediaPlayer = mediaPlayer
  }

  initialize() {
    // Initialization logic here
  }
}
