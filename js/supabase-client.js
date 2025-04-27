// Initialize the Supabase client
const supabaseUrl = "https://jspfslyrelidbyanj.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4anNmc2x5cnNlbGlkYmp5c25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MzUzNzAsImV4cCI6MjA2MTMxMTM3MH0.7mZXLV2rbB7RmEIyuatp6inG2tuJnVRuySQ4mrNjROA"

// Create a single supabase client for interacting with your database
const supabase = supabase.createClient(supabaseUrl, supabaseKey)

// Function to fetch all albums
async function fetchAllAlbums() {
  try {
    const { data, error } = await supabase.from("albums").select("*").order("AlbumID")

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching albums:", error)
    return []
  }
}

// Function to fetch album by ID
async function fetchAlbumById(albumId) {
  try {
    const { data, error } = await supabase.from("albums").select("*").eq("AlbumID", albumId).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching album:", error)
    return null
  }
}

// Function to fetch tracks for an album (for when you create the songs table)
async function fetchTracksByAlbumId(albumId) {
  try {
    // Check if the songs table exists
    const { error: tableError } = await supabase.from("songs").select("count").limit(1)

    // If the songs table doesn't exist yet, return empty array
    if (tableError) {
      console.log("Songs table not found, returning mock data")
      // Return mock data for now
      return [
        { id: 1, Title: "Track 1", Duration: "3:45", TrackNumber: 1 },
        { id: 2, Title: "Track 2", Duration: "4:12", TrackNumber: 2 },
        { id: 3, Title: "Track 3", Duration: "3:28", TrackNumber: 3 },
      ]
    }

    const { data, error } = await supabase.from("songs").select("*").eq("AlbumID", albumId).order("TrackNumber")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching tracks:", error)
    return []
  }
}

// Export the functions
window.supabaseClient = {
  fetchAllAlbums,
  fetchAlbumById,
  fetchTracksByAlbumId,
}

export { fetchAlbumById }

