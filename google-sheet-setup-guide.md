# Google Sheet Setup Guide for Futuristic Media Player

This guide will help you set up your Google Sheet correctly to work with the Futuristic Media Player.

## Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name your spreadsheet (e.g., "Music Player Albums")

## Step 2: Set Up the Columns

Create the following columns in your spreadsheet:

| Column Name | Description | Example |
|-------------|-------------|---------|
| AlbumID | Unique identifier for the album | album001 |
| Album Title | Title of the album | Maori and English Bilingual Tribute Album |
| DOMAIN | Domain name (optional) | bilingualbeats.ai |
| Album Art | URL to album artwork | https://example.com/album-art.jpg |
| Theme | Theme to use (theme-default, theme-cyberpunk, theme-neon-sunset, theme-digital-ocean) | theme-default |
| Lock | Whether the album requires purchase (yes/no) | yes |
| Download | Whether downloads are allowed (yes/no) | yes |
| Stripe Payment Links | URL to Stripe payment page | https://buy.stripe.com/14k7w75i8fGzaIgaEG |
| Track 1 | URL to track 1 audio file | https://example.com/track1.mp3 |
| Track 1 art | URL to track 1 artwork (optional) | https://example.com/track1-art.jpg |
| Track 2 | URL to track 2 audio file | https://example.com/track2.mp3 |
| Track 2 art | URL to track 2 artwork (optional) | https://example.com/track2-art.jpg |
| ... | ... | ... |
| Track 12 | URL to track 12 audio file | https://example.com/track12.mp3 |
| Track 12 art | URL to track 12 artwork (optional) | https://example.com/track12-art.jpg |

## Step 3: Add Your Album Data

1. Add at least one row of data for each album
2. Make sure to include:
   - A unique AlbumID for each album
   - Set "Lock" to "yes" for albums that require purchase, "no" for free albums
   - Add track URLs for each track (up to 12 tracks per album)

## Step 4: Publish Your Sheet

1. Click on **File > Share > Publish to web**
2. In the "Link" tab, select:
   - For "Publish content", choose "Entire Document"
   - For "Publish format", choose "Web page" or "CSV"
3. Click "Publish" and copy the URL

## Step 5: Update Your Code

1. Open the `js/googleSheetFetcher.js` file
2. Set `this.useLocalData = false`
3. Update the `this.publishedSheetUrl` with your copied URL:
   \`\`\`javascript
   this.publishedSheetUrl = "YOUR_PUBLISHED_SHEET_URL";
   \`\`\`

## Troubleshooting

If your Google Sheet is not working:

1. Make sure your sheet is published to the web and accessible to anyone with the link
2. Check that your column names match exactly (case-sensitive)
3. Verify that your AlbumID values are unique
4. Ensure your track URLs are valid and accessible
5. Check the browser console for any error messages

## Example Sheet Structure

Here's an example of how your sheet should look:

| AlbumID  | Album Title | Lock | Track 1                   | Track 2                   |
|----------|-------------|------|---------------------------|---------------------------|
| album001 | Album One   | yes  | https://example.com/1.mp3 | https://example.com/2.mp3 |
| album002 | Album Two   | no   | https://example.com/3.mp3 | https://example.com/4.mp3 |

Remember:
- Albums with Lock="yes" will show in preview mode with a purchase button
- Albums with Lock="no" will have full access without requiring purchase
