# IPTV Player

A browser-based IPTV player for Xtream Codes and M3U playlists, with a built-in
link checker. Runs entirely client-side (React + Vite) so it can be hosted
for free as a static site on GitHub Pages — no backend, no server-side
storage of your credentials.

## Features

- Connect via Xtream Codes (paste a `get.php`/`player_api.php` link, or enter
  server/username/password manually) or a plain M3U/M3U8 playlist URL
- Browse Live TV, Movies (VOD) and Series with categories and search
- Plays MPEG-TS (`mpegts.js`) and HLS (`hls.js`) streams, plus anything the
  browser natively supports
- **Checker** tab: validate an Xtream login or M3U URL, see account status/
  expiry/connection limits, and a breakdown of channel/category counts
- Credentials are kept only in your browser's `localStorage` — nothing is
  sent anywhere except directly to your provider (or your own CORS proxy, if
  you configure one)

## Running with Docker (no Node.js install required)

```bash
docker compose up dev
```

Then open <http://localhost:5173> — changes to `src/` hot-reload.

To preview a production build (served by nginx, closer to what GitHub Pages
will serve):

```bash
docker compose up preview
```

Then open <http://localhost:8080>.

## Running without Docker

Requires Node.js 20+.

```bash
npm install
npm run dev       # dev server with hot reload
npm run build     # production build into dist/
npm run preview   # preview the production build locally
```

## Deploying to GitHub Pages

This repo includes `.github/workflows/deploy.yml`, which builds the app and
deploys `dist/` to GitHub Pages on every push to `main`.

1. Push this repo to GitHub.
2. In the repo settings, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the Actions tab). Your
   site will be published at `https://<you>.github.io/<repo>/`.

The Vite config uses a relative `base: './'`, so the build works under any
subpath without editing anything.

## A note on CORS

Browsers block a page from *reading* a cross-origin response unless the
server explicitly allows it (via `Access-Control-Allow-Origin` headers). Many
IPTV/Xtream panels don't send these headers, so you may see network errors
when connecting or checking a link even though the same URL works fine in
VLC or a phone app.

If that happens, you have two options:

1. **Try the request anyway first** — plenty of Xtream panels do allow
   cross-origin requests, so this often just works.
2. **Run your own CORS proxy.** This repo includes a minimal one for
   Cloudflare Workers' free tier in [`proxy-worker/`](proxy-worker/worker.js):

   ```bash
   cd proxy-worker
   npx wrangler login
   npx wrangler deploy
   ```

   Copy the resulting `https://<name>.<subdomain>.workers.dev` URL into the
   app's **Settings → CORS proxy** field. Requests will then be routed as
   `https://<your-worker>/<original-url>`.

   Treat the deployed worker URL as sensitive — anyone who has it can use
   your Cloudflare account to fetch arbitrary URLs through it.

## Disclaimer

This is a generic media player and playlist parser. It does not host, index,
or provide any IPTV content itself — you are responsible for the legality of
whatever service or playlist you connect it to.
