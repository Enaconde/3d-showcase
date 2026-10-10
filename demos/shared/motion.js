// Shared motion layer: Lenis smooth scroll, SplitText headline reveals, scroll reveals,
// magnetic buttons and a curtain page transition. Needs gsap, ScrollTrigger, SplitText and
// Lenis loaded as globals first (see MOTION_SCRIPTS in the README).
//
// Markup hooks:
//   data-split="chars|words|lines"  animate text in by characters / words / lines
//   data-now                        ...immediately on load instead of when scrolled into view
//   data-delay="0.3"                extra delay in seconds
//   data-reveal                     fade + rise when scrolled into view
//   data-magnetic                   element drifts toward the cursor
//   data-parallax="0.2"             moves at a different speed while scrolling

const capture = location.search.includes("capture");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initMotion({ smooth = true, curtainColor = "#0b0b0b" } = {}) {
  const { gsap, ScrollTrigger, SplitText, Lenis } = window;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const still = capture || reduced;

  // Lenis drives the native scroll position, so scrollY / ScrollTrigger keep working.
  let lenis = null;
  if (smooth && !still) {
    document.head.insertAdjacentHTML("beforeend", `<style>html.lenis,html.lenis body{height:auto}.lenis.lenis-smooth{scroll-behavior:auto!important}.lenis.lenis-stopped{overflow:hidden}</style>`);
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Split after web fonts load so line breaks are measured correctly.
  document.fonts.ready.then(() => {
    document.querySelectorAll("[data-split]").forEach((el) => {
      if (still) return;
      const kind = el.dataset.split || "chars";
      const split = SplitText.create(el, { type: "lines,words,chars", mask: "lines" });
      const targets = kind === "lines" ? split.lines : kind === "words" ? split.words : split.chars;
      gsap.from(targets, {
        yPercent: 115, rotate: kind === "chars" ? 6 : 0, duration: 1.15, ease: "expo.out",
        stagger: kind === "chars" ? 0.022 : kind === "words" ? 0.06 : 0.1,
        delay: +(el.dataset.delay || 0),
        scrollTrigger: el.hasAttribute("data-now") ? undefined : { trigger: el, start: "top 88%" },
      });
    });
  });

  if (!still) {
    gsap.utils.toArray("[data-reveal]").forEach((el) => gsap.from(el, {
      y: 48, opacity: 0, duration: 1.2, ease: "power3.out", delay: +(el.dataset.delay || 0),
      scrollTrigger: el.hasAttribute("data-now") ? undefined : { trigger: el, start: "top 90%" },
    }));
    gsap.utils.toArray("[data-parallax]").forEach((el) => gsap.to(el, {
      yPercent: -100 * +el.dataset.parallax, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    }));
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" }), y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.35); y((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener("pointerleave", () => { x(0); y(0); });
    });
  }

  curtain(curtainColor, still);
  return { lenis, gsap, ScrollTrigger };
}

// A panel that wipes away on arrival and wipes in before leaving to another page.
function curtain(color, still) {
  const { gsap } = window;
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;inset:0;z-index:9999;background:${color};pointer-events:none;transform-origin:50% 0%`;
  document.body.appendChild(el);
  if (still) el.style.transform = "scaleY(0)";
  else gsap.to(el, { scaleY: 0, duration: 1.0, ease: "expo.inOut", delay: 0.1 });

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
    e.preventDefault();
    el.style.transformOrigin = "50% 100%";
    gsap.to(el, { scaleY: 1, duration: 0.7, ease: "expo.inOut", onComplete: () => (location.href = url.href) });
  });
  addEventListener("pageshow", (e) => { if (e.persisted) gsap.set(el, { scaleY: 0 }); });
}
