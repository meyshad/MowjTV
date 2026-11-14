# Static Hosting Deployment

`public/tv/` is the primary standalone site, while `release/tv/` is the packaged version prepared for conventional hosting.

## Uploading the Site

Everything the app needs ships in the package: the page, the player library (hls.js), the font, the icons, the channel lists and the channel logos. Only the video streams come from each channel's own server.

1. Upload `release/tv.zip` to the public root of your hosting account, usually `public_html`.
2. Extract it there. You should then have `public_html/index.html` and `public_html/tv/index.html`.
3. Open `https://your-domain.com/tv/` in the TV browser. Opening the domain root also works: the small `index.html` sends visitors to `tv/`.

If the host answers "403 Forbidden", check that folders have permission 755 and files 644, and that `public_html/tv/index.html` exists. The package already uses these permissions, but some upload tools change them. If your domain root already has its own `index.html`, skip the one from the package and open `/tv/` directly.

The site does not require PHP, a database, Node.js, or custom server configuration. The host only needs to serve static files over HTTPS.

Step-by-step instructions in Persian are in [DEPLOY.fa.md](./DEPLOY.fa.md).

### Refreshing the channel data

The channel lists and logos are a snapshot. To update them, run:

```bash
npm run refresh-data
```

This downloads the IPTV-ORG playlists again, drops channels that no browser can play, fetches new or changed logos and rebuilds `release/tv.zip`. A scheduled GitHub Action (`.github/workflows/refresh-data.yml`) does the same once a week, commits the result and publishes the site to the gh-pages branch. After it runs, download the new `release/tv.zip` and extract it over the old files on your host.

## TV Remote Controls

- Up/Down: move through the channel list (walking past the first or last row turns the page); in fullscreen, previous/next channel
- Page buttons under the list: show the previous or next page of channels; they also work with a TV pointer or a mouse wheel
- Left/Right: move between the list, the player, the controls and the category row
- OK/Enter: play the focused channel; on the channel that is already playing, open fullscreen
- 0-9: type a channel number to jump to it
- CH+/CH-: next/previous channel
- Play/Pause media keys: pause or resume (pausing stops all downloading)
- Back: close a menu or dialog, or leave fullscreen; on the main screen the TV's normal Back behaviour is kept

## Playback Behavior

Channel lists come from IPTV-ORG and are bundled with the site when the package is built, while each stream is delivered by its own upstream host. A channel may fail because its stream is offline, region-restricted, blocked by CORS, or served over insecure HTTP. These are upstream limitations that a fully static site cannot bypass. Channels whose links can never work in a browser on an HTTPS site (HTTP-only links, hosts that only allow their own website through CORS, and links that need a custom Referer or User-Agent) are removed when the package is built, and the list footer shows how many were removed.

Automatic quality is capped at 480p. When a channel offers several renditions the player starts low and climbs to the cap only when the connection allows it, and it lowers the cap for the session after a long stall. Viewers can pick 720p or 1080p from the quality menu; the choice is saved and applied to every channel that offers it. Channels that only publish one high-quality rendition are marked as data-heavy.

There is no automatic background scanning. When the remote rests on a channel for about a second, a single small playlist request checks whether it answers. The "check channels" button under the list does the same for every channel in the list that has no recent result, two requests at a time and only while playback has spare bandwidth; it shows the expected cost before it starts.

Results are stored per device and order every list: channels that played on this connection in the last two weeks come first, channels with no result keep the playlist order, and channels that usually fail here are dimmed, sorted last and skipped by CH+/CH-. A hard failure (such as 404 or 403) keeps a channel at the bottom for a week; repeated "no answer" results keep it there for three days, while a single one after recent successes does not move it. The order is applied when a list opens or after a check, never while the cursor is on it, and channel numbers follow the order on screen. Failed sources fall through to the channel's other sources, reconnects use increasing delays and stop after a few attempts, and permanent errors such as 404 or 403 are never retried automatically.

Channel lists are kept in the browser's IndexedDB storage and reused for 12 hours without any network request. Clearing browser data removes them.

Mowj TV does not host or restream video. Only watch streams you are authorized to access. See `README.md` and `THIRD_PARTY_NOTICES.md` for legal details and third-party attribution.
