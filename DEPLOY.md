# Static Hosting Deployment

`public/tv/` is the primary standalone site, while `release/tv/` is the packaged version prepared for conventional hosting.

## Uploading the Site

1. Upload `release/tv.zip` to the public root of your hosting account, usually `public_html`.
2. Extract the archive in place so that `public_html/tv/index.html` exists.
3. Open `https://your-domain.com/tv/` in the TV browser.

The site does not require PHP, a database, Node.js, or custom server configuration. The host only needs to serve static files over HTTPS.

## TV Remote Controls

- Up/Down: move between channels
- Enter: select and play a channel
- Fullscreen: use the button below the player
- Fullscreen controls appear over the video and automatically hide after a few seconds
- Previous Channel/Next Channel: switch channels directly while in fullscreen
- Back: exit fullscreen; outside fullscreen, the browser's normal Back behavior is preserved
- Channel Up/Down: switch channels in fullscreen when the TV browser exposes these remote keys

## Playback Behavior

Channel lists are provided by IPTV-ORG, while each stream is delivered by its own upstream host. A channel may fail because its stream is offline, region-restricted, blocked by CORS, or served over insecure HTTP. These are upstream limitations that a fully static site cannot bypass.

Availability checks run automatically and conservatively in the background. For large lists, Mowj TV checks no more than 40 channels per session and downloads only a small playlist file for each probe. Scanning pauses immediately when playback is struggling, the buffer is low, or the video stalls. Interrupted streams reconnect with increasing delays. In automatic quality mode, the player can lower its cap from 480p to 360p and then 240p when the source offers those variants.

Downloaded playlists, including the large All Channels list, are stored in the TV browser's larger local database so that the most recent version can remain available during temporary connectivity problems. Up to six recently used categories are retained. The lighter playback-status cache has a controlled size to protect settings and favorites. Clearing browser data, resetting the TV, or severe storage pressure may remove these local caches.

Mowj TV does not host or restream video. Only watch streams you are authorized to access. See `README.md` and `THIRD_PARTY_NOTICES.md` for legal details and third-party attribution.
