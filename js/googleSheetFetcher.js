/**
 * Google Sheet Fetcher Module
 *
 * This module fetches album data from a published Google Sheet
 * and transforms it into the format expected by the media player.
 */

class GoogleSheetFetcher {
  constructor() {
    // Now that you have a working CSV URL, set this to false
    this.useLocalData = false

    // Update this with your published CSV URL
    this.publishedSheetUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSeBHuwN87UTin6bqy7mVFDXOrgQ8EtB7eUAwittvrxusXPEQZFGb-1BiKUPqYXlRv8DuxoXGrDeeFg/pub?output=csv"

    // Cache for album data
    this.albumsCache = null

    // Debug mode
    this.debug = true
  }

  /**
   * Fetch all albums data from the Google Sheet or use local data
   * @returns {Promise<Object>} Promise resolving to an object with albumId as keys
   */
  async fetchAllAlbums() {
    if (this.albumsCache) {
      return this.albumsCache
    }

    // Since the Google Sheet URL is not working, we'll use the sample data
    if (this.useLocalData) {
      console.log("Using local sample data since Google Sheet URL is not accessible")
      const sampleData = this.getSampleAlbumData()
      this.albumsCache = sampleData
      return sampleData
    }

    try {
      // This code would be used if you had a working Google Sheet URL
      const response = await fetch(this.publishedSheetUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch Google Sheet: ${response.status} ${response.statusText}`)
      }

      // If it's a CSV format
      if (this.publishedSheetUrl.includes("output=csv")) {
        const csvText = await response.text()
        const albums = this.parseCSV(csvText)
        this.albumsCache = albums
        return albums
      } else {
        // If it's HTML format
        const htmlText = await response.text()
        const albums = this.parseHTML(htmlText)
        this.albumsCache = albums
        return albums
      }
    } catch (error) {
      console.error("Error fetching Google Sheet data:", error)

      // Fallback to sample data for testing
      const sampleData = this.getSampleAlbumData()
      console.log("Falling back to sample data with albums:", Object.keys(sampleData))
      return sampleData
    }
  }

  /**
   * Parse CSV data into a structured object
   * @param {string} csvText - The CSV text to parse
   * @returns {Object} Object with albumId as keys
   */
  parseCSV(csvText) {
    try {
      // Split the CSV into lines
      const lines = csvText.split("\n")
      if (lines.length < 2) {
        console.error("CSV has less than 2 lines")
        return this.getSampleAlbumData()
      }

      // Get headers from the first line
      const headers = lines[0].split(",").map((header) => header.trim())

      // Check if this CSV has our expected headers
      const albumIdIndex = headers.indexOf("AlbumID")
      const lockIndex = headers.indexOf("Lock")

      if (albumIdIndex === -1) {
        console.error("CSV doesn't have AlbumID column")
        return this.getSampleAlbumData()
      }

      // Process data rows
      const albums = {}

      // Skip the header row and process all data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        if (!line.trim()) continue // Skip empty lines

        const values = this.parseCSVLine(line)

        // Skip if not enough values
        if (values.length <= albumIdIndex) continue

        // Get the albumId
        const albumId = values[albumIdIndex].trim()
        if (!albumId) continue

        // Get lock value (default to "no" if not found)
        const lockValue = lockIndex >= 0 && values[lockIndex] ? values[lockIndex].trim().toLowerCase() : "no"

        // Find other column indexes
        const domainIndex = headers.indexOf("DOMAIN")
        const albumTitleIndex = headers.indexOf("Album Title")
        const albumArtIndex = headers.indexOf("Album Art")
        const themeIndex = headers.indexOf("Theme")
        const downloadIndex = headers.indexOf("Download")
        const paymentLinkIndex = headers.indexOf("Stripe Payment Links")

        // Create album object
        const album = {
          id: albumId,
          domain: domainIndex >= 0 && values[domainIndex] ? values[domainIndex].trim() : "",
          title: albumTitleIndex >= 0 && values[albumTitleIndex] ? values[albumTitleIndex].trim() : albumId,
          albumArt: albumArtIndex >= 0 ? values[albumArtIndex].trim() : "",
          theme: themeIndex >= 0 && values[themeIndex] ? values[themeIndex].trim() : "theme-default",
          lock: lockValue === "yes",
          download:
            downloadIndex >= 0 && values[downloadIndex] ? values[downloadIndex].trim().toLowerCase() === "yes" : true,
          paymentLink: paymentLinkIndex >= 0 ? values[paymentLinkIndex].trim() : "",
          tracks: [],
        }

        // Process tracks
        for (let j = 1; j <= 12; j++) {
          const trackIndex = headers.indexOf(`Track ${j}`)
          const trackArtIndex = headers.indexOf(`Track ${j} art`)

          // Skip if track column doesn't exist
          if (trackIndex === -1 || trackIndex >= values.length) continue

          // Only add track if there's a track URL
          const trackUrl = values[trackIndex].trim()
          if (trackUrl) {
            album.tracks.push({
              id: j,
              title: this.extractTrackTitle(trackUrl),
              src: trackUrl,
              art: trackArtIndex >= 0 && trackArtIndex < values.length ? values[trackArtIndex].trim() : "",
              duration: 180, // Default 3 minutes
            })
          }
        }

        // Add album to the collection
        albums[albumId] = album
      }

      // If we didn't find any albums, fall back to sample data
      if (Object.keys(albums).length === 0) {
        console.log("No albums found in CSV, falling back to sample data")
        return this.getSampleAlbumData()
      }

      return albums
    } catch (error) {
      console.error("Error parsing CSV:", error)
      return this.getSampleAlbumData()
    }
  }

  /**
   * Parse a CSV line, handling quoted values
   * @param {string} line - The CSV line to parse
   * @returns {string[]} Array of values
   */
  parseCSVLine(line) {
    const values = []
    let inQuotes = false
    let currentValue = ""

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(currentValue)
        currentValue = ""
      } else {
        currentValue += char
      }
    }

    // Add the last value
    values.push(currentValue)

    return values
  }

  /**
   * Extract URL from a cell element or text
   * @param {Element|string} cell - The cell element or text
   * @returns {string} The extracted URL
   */
  extractUrl(cell) {
    if (!cell) return ""

    try {
      // If it's an element, try to find an anchor tag
      if (cell instanceof Element) {
        const anchor = cell.querySelector("a")
        if (anchor && anchor.href) {
          return anchor.href
        }
        return cell.textContent.trim()
      }

      // If it's a string, try to extract a URL
      if (typeof cell === "string") {
        const urlMatch = cell.match(/https?:\/\/[^\s)]+/)
        if (urlMatch) {
          return urlMatch[0]
        }
        return cell.trim()
      }

      return ""
    } catch (error) {
      return ""
    }
  }

  /**
   * Extract track title from track URL or filename
   * @param {string} trackUrl - The track URL
   * @returns {string} The extracted track title
   */
  extractTrackTitle(trackUrl) {
    if (!trackUrl) return ""

    try {
      // Try to extract from filename
      const filename = trackUrl.split("/").pop()
      if (!filename) return ""

      // Remove extension and replace hyphens with spaces
      let title = filename
        .replace(/\.(mp3|wav|ogg)$/, "")
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim()

      // Capitalize first letter of each word
      title = title
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      return title
    } catch (error) {
      return "Track"
    }
  }

  /**
   * Get album data by ID
   * @param {string} albumId - The album ID to fetch
   * @returns {Promise<Object>} Promise resolving to album data
   */
  async getAlbumById(albumId) {
    const albums = await this.fetchAllAlbums()
    return albums[albumId] || null
  }

  /**
   * Get sample album data for testing
   * @returns {Object} Sample album data
   */
  getSampleAlbumData() {
    return {
      album001: {
        id: "album001",
        domain: "bilingualbeats.ai",
        title: "Maori and English Bilingual Tribute Album",
        albumArt: "https://via.placeholder.com/300x300?text=Album+Art",
        theme: "theme-default",
        lock: true, // This album requires purchase
        download: true,
        paymentLink: "https://buy.stripe.com/14k7w75i8fGzaIgaEG",
        tracks: [
          {
            id: 1,
            title: "Whenua & Home",
            duration: 225,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/Whenua-Home-.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+1",
          },
          {
            id: 2,
            title: "Te Moana Calls",
            duration: 198,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/Te-Moana-Calls.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+2",
          },
          {
            id: 3,
            title: "Whānau Ties",
            duration: 210,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/Whanau-Ties.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+3",
          },
          {
            id: 4,
            title: "Ngahere Groove",
            duration: 183,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/Ngahere-Groove.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+4",
          },
          {
            id: 5,
            title: "Tūmanako (Hope)",
            duration: 240,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/Tumanako-Hope.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+5",
          },
          {
            id: 6,
            title: "Aroha Rawa (So Much Love)",
            duration: 195,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/Aroha-Rawa-So-Much-Love.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+6",
          },
          {
            id: 7,
            title: "Track Seven",
            duration: 180,
            src: "https://example.com/track7.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+7",
          },
          {
            id: 8,
            title: "Track Eight",
            duration: 180,
            src: "https://example.com/track8.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+8",
          },
          {
            id: 9,
            title: "Track Nine",
            duration: 180,
            src: "https://example.com/track9.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+9",
          },
          {
            id: 10,
            title: "Track Ten",
            duration: 180,
            src: "https://example.com/track10.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+10",
          },
          {
            id: 11,
            title: "Track Eleven",
            duration: 180,
            src: "https://example.com/track11.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+11",
          },
          {
            id: 12,
            title: "Track Twelve",
            duration: 180,
            src: "https://example.com/track12.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+12",
          },
        ],
      },
      album002: {
        id: "album002",
        domain: "bilingualbeats.ai",
        title: "Terrific Toddlers at 2 Mandarin-English Early Learners",
        albumArt: "https://via.placeholder.com/300x300?text=Album+Art",
        theme: "theme-cyberpunk",
        lock: false, // This album is free (no purchase required)
        download: true,
        paymentLink: "",
        tracks: [
          {
            id: 1,
            title: "Terrific Two Year Olds Lets Create",
            duration: 225,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/ENGLISH-MANDARIN-Terrific-Two-Year-Olds-Lets-Create.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+1",
          },
          {
            id: 2,
            title: "Terrific Two Year Olds Lets Create 1",
            duration: 198,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/ENGLISH-MANDARIN-Terrific-Two-Year-Olds-Lets-Create-1.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+2",
          },
          {
            id: 3,
            title: "Terrific Two Year Olds Lets Create 2",
            duration: 210,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/ENGLISH-MANDARIN-Terrific-Two-Year-Olds-Lets-Create-2.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+3",
          },
          {
            id: 4,
            title: "Track Four",
            duration: 180,
            src: "https://example.com/track4.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+4",
          },
          {
            id: 5,
            title: "Track Five",
            duration: 180,
            src: "https://example.com/track5.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+5",
          },
          {
            id: 6,
            title: "Track Six",
            duration: 180,
            src: "https://example.com/track6.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+6",
          },
          {
            id: 7,
            title: "Track Seven",
            duration: 180,
            src: "https://example.com/track7.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+7",
          },
          {
            id: 8,
            title: "Track Eight",
            duration: 180,
            src: "https://example.com/track8.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+8",
          },
          {
            id: 9,
            title: "Track Nine",
            duration: 180,
            src: "https://example.com/track9.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+9",
          },
          {
            id: 10,
            title: "Track Ten",
            duration: 180,
            src: "https://example.com/track10.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+10",
          },
          {
            id: 11,
            title: "Track Eleven",
            duration: 180,
            src: "https://example.com/track11.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+11",
          },
          {
            id: 12,
            title: "Track Twelve",
            duration: 180,
            src: "https://example.com/track12.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+12",
          },
        ],
      },
      album003: {
        id: "album003",
        domain: "bilingualbeats.ai",
        title: "Getting ready to blitz through School",
        albumArt: "https://via.placeholder.com/300x300?text=Album+Art",
        theme: "theme-neon-sunset",
        lock: false, // This album is free (no purchase required)
        download: true,
        paymentLink: "",
        tracks: [
          {
            id: 1,
            title: "School Ready",
            duration: 225,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/Whenua-Home-.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+1",
          },
          {
            id: 2,
            title: "Learning Fun",
            duration: 198,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/Te-Moana-Calls.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+2",
          },
          {
            id: 3,
            title: "Track Three",
            duration: 180,
            src: "https://example.com/track3.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+3",
          },
          {
            id: 4,
            title: "Track Four",
            duration: 180,
            src: "https://example.com/track4.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+4",
          },
          {
            id: 5,
            title: "Track Five",
            duration: 180,
            src: "https://example.com/track5.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+5",
          },
          {
            id: 6,
            title: "Track Six",
            duration: 180,
            src: "https://example.com/track6.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+6",
          },
          {
            id: 7,
            title: "Track Seven",
            duration: 180,
            src: "https://example.com/track7.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+7",
          },
          {
            id: 8,
            title: "Track Eight",
            duration: 180,
            src: "https://example.com/track8.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+8",
          },
          {
            id: 9,
            title: "Track Nine",
            duration: 180,
            src: "https://example.com/track9.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+9",
          },
          {
            id: 10,
            title: "Track Ten",
            duration: 180,
            src: "https://example.com/track10.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+10",
          },
          {
            id: 11,
            title: "Track Eleven",
            duration: 180,
            src: "https://example.com/track11.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+11",
          },
          {
            id: 12,
            title: "Track Twelve",
            duration: 180,
            src: "https://example.com/track12.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+12",
          },
        ],
      },
      album004: {
        id: "album004",
        domain: "bilingualbeats.ai",
        title: "Mandarin English Bilingual ABC",
        albumArt: "https://via.placeholder.com/300x300?text=Album+Art",
        theme: "theme-digital-ocean",
        lock: true, // This album requires purchase
        download: true,
        paymentLink: "https://buy.stripe.com/14k7w75i8fGzaIgaEG",
        tracks: [
          {
            id: 1,
            title: "ABC Song",
            duration: 225,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/Whenua-Home-.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+1",
          },
          {
            id: 2,
            title: "Numbers Fun",
            duration: 198,
            src: "https://bilingualbeats.ai/wp-content/uploads/2025/04/Te-Moana-Calls.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+2",
          },
          {
            id: 3,
            title: "Track Three",
            duration: 180,
            src: "https://example.com/track3.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+3",
          },
          {
            id: 4,
            title: "Track Four",
            duration: 180,
            src: "https://example.com/track4.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+4",
          },
          {
            id: 5,
            title: "Track Five",
            duration: 180,
            src: "https://example.com/track5.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+5",
          },
          {
            id: 6,
            title: "Track Six",
            duration: 180,
            src: "https://example.com/track6.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+6",
          },
          {
            id: 7,
            title: "Track Seven",
            duration: 180,
            src: "https://example.com/track7.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+7",
          },
          {
            id: 8,
            title: "Track Eight",
            duration: 180,
            src: "https://example.com/track8.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+8",
          },
          {
            id: 9,
            title: "Track Nine",
            duration: 180,
            src: "https://example.com/track9.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+9",
          },
          {
            id: 10,
            title: "Track Ten",
            duration: 180,
            src: "https://example.com/track10.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+10",
          },
          {
            id: 11,
            title: "Track Eleven",
            duration: 180,
            src: "https://example.com/track11.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+11",
          },
          {
            id: 12,
            title: "Track Twelve",
            duration: 180,
            src: "https://example.com/track12.mp3",
            art: "https://via.placeholder.com/100x100?text=Track+12",
          },
        ],
      },
    }
  }
}

// Export the class
window.GoogleSheetFetcher = GoogleSheetFetcher
