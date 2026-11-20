# FluxWall website

This repository contains the public FluxWall marketing site for [fluxwall.anvik.studio](https://fluxwall.anvik.studio).

The public site showcases a curated selection of live wallpapers. The complete app and its visual engine remain in the private application repository.

## Run locally

The website is a static site and does not require a build step. From the repository root, start a local server with Python 3:

```bash
python3 -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173) in your browser.

Stop the server with `Ctrl+C`.

## Pages

- **Home & Live Preview Studio**: [`index.html`](index.html)
- **Free Live Wallpaper App, No Ads**: [`free-live-wallpaper-no-ads.html`](free-live-wallpaper-no-ads.html)
- **Interactive Live Wallpaper for Android**: [`interactive-live-wallpaper-android.html`](interactive-live-wallpaper-android.html)
- **Live Wallpaper That Doesn't Drain Battery**: [`live-wallpaper-battery.html`](live-wallpaper-battery.html)
- **Privacy Policy**: [`privacy_policy.html`](privacy_policy.html)
