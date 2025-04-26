# Media Player Module Requirements

## Core Functionality
1. **Modular Design**
   - Component should be easily embeddable in any webpage
   - Self-contained with minimal external dependencies
   - Configurable through simple parameters

2. **Media Support**
   - Support for both MP3 (audio) and MP4 (video) formats
   - Ability to handle 12 tracks in a collection
   - Responsive design that works across devices

3. **Preview Functionality**
   - Limited playback of 30 seconds per track for non-paying users
   - Visual indication of preview mode
   - Smooth transition/fade out at preview end

4. **Payment Integration**
   - Integration with Stripe payment ($6.95 purchase)
   - Current payment link: https://buy.stripe.com/9AQ17J3a09ib6s0fYZ
   - Ability to verify payment status

5. **Post-Purchase Features**
   - Full playback access after purchase verification
   - Individual track download buttons
   - "Download All" functionality for complete collection
   - Visual indication of purchased/unlocked status

6. **Visual Design**
   - Futuristic, eye-catching interface
   - "Shiny eye candy" aesthetic
   - Modern animations and transitions
   - High contrast and vibrant color scheme
   - Potentially include visualizations during playback

7. **Technical Requirements**
   - Cross-browser compatibility
   - Mobile-responsive design
   - Efficient loading (lazy loading where appropriate)
   - Local storage for remembering purchase status
   - Secure verification of purchases

## Implementation Approach
- Use HTML5 for structure
- CSS3 with animations and transitions for visual appeal
- JavaScript for interactivity and playback control
- Potentially use Web Audio API for visualizations
- Implement token-based verification for purchases
