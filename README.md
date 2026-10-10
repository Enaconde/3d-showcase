# Showcase

A 3D carousel of sample websites. Visitors drag, scroll or use arrow keys to move between
projects, and click the front card to fly into the demo.

## Run it locally

ES modules need a web server (opening `index.html` directly won't work):

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open http://localhost:8770/.

## Make it yours

At the top of the `<script type="module">` in [index.html](index.html):

- `STUDIO`: company name, intro line, contact email
- `PROJECTS`: one entry per card (`slug` = folder name in `demos/`, plus name, category, tags, accent color)

## Add a project

1. Create `demos/<slug>/index.html` (any site; link back with `href="../../#<slug>"`)
2. Add it to `PROJECTS`
3. With the server running, re-take previews:
   `powershell -ExecutionPolicy Bypass -File capture-previews.ps1 <slug>`
   (uses headless Edge; demos can check for `?capture` to show their final state)

## Demos

| Demo | Shows |
|---|---|
| `volt` | 3D product built in code (lathe can + canvas label), flavor switching, mouse tilt |
| `neura` | 24k GPU particles morphing between shapes on scroll, mouse repulsion |
| `eclat` | Full-screen silk shader that reacts to the mouse, editorial typography |
| `altitude` | Procedural tower and city at sunset, camera path driven by scroll |

## Publish

It's a static site: upload the folder (minus the `.ps1` files) to Netlify, Vercel, Cloudflare
Pages or GitHub Pages. Libraries load from CDNs (three.js 0.170.0, GSAP 3.12.5).
