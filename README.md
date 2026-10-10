# Showcase

A 3D carousel of sample websites. Visitors drag, scroll or use arrow keys to move between
projects, and click the front card to fly into the demo. Each demo has one signature motion idea.

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

## Demos

| Demo | Signature motion | Built with |
|---|---|---|
| `altus` | One-take scroll: orbit → dive to a real coastline → fly through clouds → land on a real balcony with a 3D sofa | Earth shader (day/night, city lights, glint, atmosphere), bloom, cloud fly-through shader, GroundedSkybox |
| `volt` | 3D can built in code, flavor spin + recolor | three.js, GSAP |
| `titan` | Scroll-driven exploded view, HUD labels pinned to parts | glTF model, GSAP, Lenis, SplitText |
| `vanta` | Car placed inside real 360° photos; film-style cuts between locations | GroundedSkybox, HDRI lighting, real shadows |
| `aero` | Kinetic type rows + pinned horizontal photo lookbook; shoe changes colorway per panel | ScrollTrigger (pin + containerAnimation), Lenis velocity |
| `forma` | Silk intro curtain, camera pull-back, fabric "wipe" via clipping planes in a photographed room | GroundedSkybox, clipping planes, React Bits Silk |

## Shared code (`demos/shared/`)

- `viewer.js`: renderer, HDRI lighting, glTF loading with material variants, shadows, pointer/scroll helpers
- `motion.js`: Lenis smooth scroll, SplitText reveals (`data-split`), `data-reveal`, `data-magnetic`, `data-parallax`, curtain page transitions
- `backgrounds.js`: Silk background ported from React Bits (MIT + Commons Clause notice kept in the file)

Motion pages load these scripts first:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"></script>
```

## Add a project

1. Create `demos/<slug>/index.html` (link back with `href="../../#<slug>"`)
2. Add it to `PROJECTS`
3. With the server running, re-take its preview (uses headless Edge with the GPU):
   `powershell -ExecutionPolicy Bypass -File capture-previews.ps1 <slug>`
   Pages check for `?capture` to skip intros and show their final state.

Dev tools: `tools/inspect.html` (model sizes, variants, animations) and `tools/look.html?m=<Model>`
(renders a model from four angles).

## Assets and credits

| Asset | Source | License |
|---|---|---|
| Chronograph Watch, Car Concept | Eric Chadwick © Darmstadt Graphics Group, Khronos glTF Sample Assets | CC BY 4.0 (logos excluded) |
| Materials Variants Shoe | © 2021 Shopify, Khronos glTF Sample Assets | CC BY 4.0 |
| Glam Velvet Sofa | Eric Chadwick © 2021 Wayfair, Khronos glTF Sample Assets | CC BY 4.0 |
| Sheen Chair | © 2020 Wayfair, Khronos glTF Sample Assets | CC0 |
| HDRIs, location photos, lookbook photos | Poly Haven | CC0 |
| Earth day / night / clouds textures | Solar System Scope, via three.js examples | CC BY 4.0 |
| Silk background | React Bits by David Haz | MIT + Commons Clause |

Before using this publicly: the watch and car models include Khronos / DGG logos, which their
license does not cover. The license plate and steering emblem are hidden in `vanta`; the small logo
on the watch dial and caseback is still there. Replace those textures (or the models) for client work.

## Publish

It's a static site: upload the folder (minus the `.ps1` files and `tools/`) to Netlify, Vercel,
Cloudflare Pages or GitHub Pages. Libraries load from CDNs (three.js 0.170.0, GSAP 3.13.0, Lenis 1.1.20).
Total assets are about 50 MB, mostly the five 3D models.
