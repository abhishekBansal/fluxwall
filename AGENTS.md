# FluxWall Website Agent Guide

## Project overview

This repository is the public FluxWall marketing site for `fluxwall.abhishekbansal.dev`. It is a static GitHub Pages site with no build step or package manager.

- `index.html` contains the page structure, metadata, CTA copy, and static fallback content.
- `css/site.css` contains the complete responsive design system and layout.
- `js/app.js` owns the gallery, preview editor, controls, navigation, and WebGL renderers.
- `js/shaders.js` contains the five configurable live-preview definitions and their shader source.
- `assets/screenshots/` contains the public wallpaper thumbnails.
- `assets/videos/` contains the available wallpaper media assets.
- `assets/images/` contains marketing screenshots, artwork, and the optimized Google Play icon.
- `llms.txt` contains the public AI-readable site guide.

## Local development

Start a static server from the repository root:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`. Stop the server with `Ctrl+C`.

Do not open `index.html` with `file://` when testing module imports, WebGL, video assets, or browser security behavior.

## Validation

Run these checks after changes:

```bash
node --check js/app.js
node --check js/shaders.js
git diff --check
```

Also verify:

- Desktop and mobile layouts have no document-level horizontal overflow.
- The hero and preview editor both render and animate.
- The preview canvas keeps the same dimensions when switching effects.
- Select, range, and checkbox controls update the active preview.
- The Google Play CTA image loads from `assets/images/google-play-icon.png`.
- JSON-LD remains valid and HTML IDs remain unique.

There is no npm test suite or build command. Use browser-based smoke tests for interaction and responsive behavior.

## Product and content rules

- Use customer-facing language: personal, mood, color, movement, discovery, and easy customization.
- Avoid exposing implementation jargon in public copy unless it is necessary for a technical explanation.
- Keep the primary CTA wording as `Get FluxWall Free`.
- Keep the Google Play destination consistent with the existing Play Store URL.
- Do not add accounts, ads, tracking, or sign-up requirements to the marketing experience.

## Preview and gallery architecture

- The five entries in `SHADER_EFFECTS` are the experimentable previews and may retain shader source for experimentation.
- Gallery cards must use public metadata and thumbnail assets only. Do not add shader source or large shader objects to gallery card markup.
- Keep thumbnail-only wallpaper entries separate from configurable shader entries so the gallery can grow without exposing implementation source.
- The gallery is a thumbnail catalog; the preview editor is a separate section. Do not nest the preview editor inside the gallery or add gallery-to-preview links unless explicitly requested.
- Keep the hero and preview editor renderers synchronized when changing a shader or control.
- Preserve fixed preview aspect-ratio sizing; control count must not resize the preview canvas.

## Coding conventions

- Prefer small, reusable functions and components over bulky files.
- Use semantic HTML and accessible labels for interactive controls.
- Preserve keyboard focus states and reduced-motion behavior.
- Keep image assets optimized and avoid adding large unused media.
- Prefer editing existing files and keeping changes scoped to the requested behavior.
- Do not modify deployment configuration unless the task explicitly requires it.

## Deployment

Pushes to `main` are deployed by `.github/workflows/deploy.yml` using the repository root as the GitHub Pages artifact. Do not add a build output directory or assume a server-side runtime.
