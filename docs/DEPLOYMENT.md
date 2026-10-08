# Deployment

## GitHub Pages (project site)
1. Push the folder contents to the repository root on `main`.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save.
3. Visit `https://USERNAME.github.io/REPOSITORY/`.

Everything uses relative URLs and hash routing, so no `.htaccess`, `404.html` tricks, server config, environment variables or backend endpoints are needed. Deep links such as `https://USERNAME.github.io/REPOSITORY/#room/12345` work.

## Other static hosts
Netlify, Cloudflare Pages, S3, any web server: upload the files as-is.

## Updating the service worker cache
Edit `VERSION` in `service-worker.js` whenever you change cached files, otherwise returning visitors may keep the old version until the cache is replaced. Add new files to `ASSETS`.

## PWA install
Requires HTTPS (GitHub Pages provides it). Chrome/Edge/Android: install prompt or browser menu → *Install app*. iOS Safari: Share → *Add to Home Screen*.

## Microphone
`getUserMedia` needs HTTPS or `localhost`; it will not work from `file://`. The app degrades gracefully with a message.
