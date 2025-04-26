# Futuristic Media Player with Google Sheet Integration - Deployment Guide

This guide explains how to deploy the updated Futuristic Media Player that fetches data from a Google Sheet.

## Basic Deployment

1. Upload all files to your web server, maintaining the directory structure:
   - HTML, CSS, and JavaScript files in the root directory
   - JS folder containing the Google Sheet integration files

2. Access the player by navigating to index.html in your browser.

3. The player will automatically load album data from the Google Sheet based on the AlbumID parameter in the URL:
   - Example: `https://yourdomain.com/index.html?albumId=album001`
   - If no AlbumID is specified, it will load the first album found in the sheet.

## WordPress Integration

To integrate with WordPress:

1. Create a new folder named `futuristic-media-player` in your WordPress `wp-content/plugins` directory.

2. Copy all files from this package into that folder.

3. Create a new file named `futuristic-media-player.php` in the same folder with the following content:

\`\`\`php
<?php
/**
 * Plugin Name: Futuristic Media Player
 * Description: A futuristic media player with Google Sheet integration
 * Version: 1.0
 * Author: Your Name
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Register scripts and styles
function futuristic_player_enqueue_assets() {
    $plugin_url = plugin_dir_url(__FILE__);
    
    // Enqueue styles
    wp_enqueue_style('futuristic-player-styles', $plugin_url . 'styles.css');
    wp_enqueue_style('futuristic-player-theme-variations', $plugin_url . 'theme_variations.css');
    
    // Enqueue scripts
    wp_enqueue_script('futuristic-player-google-sheet-fetcher', $plugin_url . 'js/googleSheetFetcher.js', array(), '1.0', true);
    wp_enqueue_script('futuristic-player-album-selector', $plugin_url . 'js/albumSelector.js', array(), '1.0', true);
    wp_enqueue_script('futuristic-player-main', $plugin_url . 'player.js', array(), '1.0', true);
}

// Create shortcode
function futuristic_player_shortcode($atts) {
    // Extract attributes
    $atts = shortcode_atts(array(
        'theme' => 'theme-default',
        'layout' => 'layout-vertical',
        'albumid' => ''
    ), $atts);
    
    // Enqueue assets
    futuristic_player_enqueue_assets();
    
    // Start output buffering
    ob_start();
    
    // Include the player HTML
    include 'player-template.php';
    
    // Return the buffered content
    return ob_get_clean();
}

// Register shortcode
add_shortcode('futuristic_player', 'futuristic_player_shortcode');
\`\`\`

4. Create a file named `player-template.php` in the same folder with the following content:

\`\`\`php
<div class="container">
    <div class="media-player-module <?php echo esc_attr($atts['theme']); ?> <?php echo esc_attr($atts['layout']); ?>" 
         <?php if (!empty($atts['albumid'])) : ?>data-album-id="<?php echo esc_attr($atts['albumid']); ?>"<?php endif; ?>>
        <div class="player-header">
            <h2 class="album-title">Loading album...</h2>
            <div class="theme-selector">
                <button class="theme-button active" data-theme="theme-default">Default</button>
                <button class="theme-button" data-theme="theme-cyberpunk">Cyberpunk</button>
                <button class="theme-button" data-theme="theme-neon-sunset">Neon Sunset</button>
                <button class="theme-button" data-theme="theme-digital-ocean">Digital Ocean</button>
            </div>
        </div>
        
        <div class="tracks-grid">
            <!-- Tracks will be dynamically added here -->
            <div class="loading-indicator">Loading tracks...</div>
        </div>
        
        <div class="player-footer">
            <div class="purchase-section preview-mode">
                <div class="preview-message">
                    <div class="preview-badge">PREVIEW MODE</div>
                    <p>You're listening to 30-second previews. Purchase to unlock full tracks and downloads.</p>
                </div>
                <button class="purchase-button">
                    <span class="purchase-text">Buy Full Album</span>
                    <span class="purchase-icon">🔓</span>
                </button>
                <button class="download-all-button" disabled>
                    <span class="download-all-text">Download All Tracks</span>
                    <span class="download-all-icon">↓</span>
                </button>
            </div>
            <div class="purchase-section purchased-mode hidden">
                <div class="purchased-message">
                    <div class="purchased-badge">FULL ACCESS</div>
                    <p>Thank you for your purchase! You now have full access to all tracks and downloads.</p>
                </div>
                <button class="download-all-button">
                    <span class="download-all-text">Download All Tracks</span>
                    <span class="download-all-icon">↓</span>
                </button>
            </div>
        </div>
    </div>
</div>
\`\`\`

5. Activate the plugin in your WordPress admin dashboard.

6. Add the player to any page or post using the shortcode:
   - Basic usage: `[futuristic_player]`
   - With options: `[futuristic_player theme="theme-cyberpunk" layout="layout-horizontal" albumid="album001"]`

## Google Sheet Configuration

The player is configured to fetch data from your published Google Sheet at:
`https://docs.google.com/spreadsheets/d/e/2PACX-1vS0DpDvjdDREoXZobh6_AvfZtgbdzJqCvYhOv6mbbHlQeYC2S4vv1b5N9vWCPDnSIQHy7EMEOAaUKtm/pubhtml`

To update the content displayed in the player:

1. Make changes to your Google Sheet.
2. Ensure the sheet is published to the web (File > Share > Publish to web).
3. The player will fetch the latest data when loaded.

### Google Sheet Structure

The player expects the following columns in your Google Sheet:

- **AlbumID**: Unique identifier for each album (e.g., album001)
- **DOMAIN**: Website domain associated with the album
- **Album Title**: Title of the album
- **Album Art**: URL to the album cover image
- **Theme**: Theme to use (e.g., theme-default, theme-cyberpunk)
- **Lock**: Whether the album requires purchase (yes/no)
- **Download**: Whether downloads are enabled (yes/no)
- **Stripe Payment Links**: URL to the Stripe payment page
- **Track 1** to **Track 12**: URLs to the audio files
- **Track 1 art** to **Track 12 art**: URLs to the track artwork images

## Customization

### Changing the Google Sheet Source

If you need to use a different Google Sheet, update the `publishedSheetUrl` property in the `js/googleSheetFetcher.js` file:

\`\`\`javascript
constructor() {
    // The published Google Sheet URL
    this.publishedSheetUrl = 'YOUR_NEW_GOOGLE_SHEET_URL';
    
    // Cache for album data
    this.albumsCache = null;
}
\`\`\`

### Modifying Themes

You can customize the visual appearance by editing the `theme_variations.css` file.

### Changing Preview Duration

The preview duration (default: 30 seconds) can be modified in the `player.js` file:

\`\`\`javascript
constructor() {
    // Configuration
    this.PREVIEW_DURATION = 45; // Change to desired number of seconds
    // ...
}
\`\`\`

## Troubleshooting

### Player Not Loading Data

If the player fails to load data from the Google Sheet:

1. Check that your Google Sheet is published to the web and publicly accessible.
2. Verify the Google Sheet URL in the `googleSheetFetcher.js` file.
3. Check browser console for any JavaScript errors.
4. The player includes a fallback mechanism that will load sample data if it cannot connect to the Google Sheet.

### CORS Issues

If you encounter Cross-Origin Resource Sharing (CORS) issues:

1. Ensure your web server allows CORS for the Google Sheet domain.
2. Consider using a CORS proxy if needed.

### Audio Not Playing

If audio files don't play:

1. Verify that the audio file URLs in your Google Sheet are correct and accessible.
2. Check that the audio files are in a supported format (MP3 recommended).
3. Ensure the audio files are hosted on a server that allows cross-origin requests.
