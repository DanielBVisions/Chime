import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Adapted from the madewithgsap.com "effect001" horizontal scroll-pin pattern,
// with rotation/drift ranges cut way down (was ±10-20deg rotation, ±30-50%
// xPercent, ±10-16% yPercent — original effect001 values) and generous card
// gaps so cards never overlap each other's text mid-scroll. Runs at every
// viewport width, touch included - vertical scroll drives the horizontal
// card movement exactly like desktop, not a separate touch-only fallback.
// Only prefers-reduced-motion skips it, leaving the static grid already
// rendered in the markup.
export function initChimeAdvantage() {
  const section = document.querySelector<HTMLElement>('[data-advantage]');
  const track = document.querySelector<HTMLElement>('[data-advantage-track]');
  if (!section || !track) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  section.classList.add('is-scroll-pin');

  const cards = Array.from(track.children) as HTMLElement[];
  if (track.scrollWidth - window.innerWidth <= 0) return;

  // GSAP's pin locks the section's width via an inline style captured at
  // ScrollTrigger creation/refresh time - if that capture happens before
  // web fonts finish loading (or before a resize settles), it can lock in
  // a narrower width than the section's true, final layout, and nothing
  // in this section's own CSS can override an inline style afterwards.
  // invalidateOnRefresh + function-based x/end (rather than a value
  // captured once into `distance`) make GSAP re-measure on every refresh
  // (including the resize refresh it already runs automatically), and the
  // fonts.ready refresh below covers the case where the pin was first set
  // up against fallback-font metrics.
  const scrollTween = gsap.to(track, {
    x: () => -(track.scrollWidth - window.innerWidth),
    ease: 'none',
    scrollTrigger: {
      // Trigger is the card row itself, not the whole section - the
      // section is much taller than the card row (intro text/CTA sit
      // above it), so "section centre meets viewport centre" was
      // reached while the cards themselves were still sitting below
      // the middle of the screen. Pinning still locks the whole
      // section in place; only the position used to decide *when* to
      // start is now based on the cards' own position.
      trigger: track,
      pin: section,
      scrub: true,
      start: 'center center',
      end: () => '+=' + (track.scrollWidth - window.innerWidth),
      invalidateOnRefresh: true,
    },
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  cards.forEach((card) => {
    const values = {
      x: (Math.random() * 2 + 3) * (Math.random() < 0.5 ? 1 : -1), // ±3 to 5
      y: (Math.random() * 1 + 1.5) * (Math.random() < 0.5 ? 1 : -1), // ±1.5 to 2.5
      rotation: (Math.random() * 1.5 + 2) * (Math.random() < 0.5 ? 1 : -1), // ±2 to 3.5
    };

    gsap.fromTo(
      card,
      { rotation: values.rotation, xPercent: values.x, yPercent: values.y },
      {
        rotation: -values.rotation,
        xPercent: -values.x,
        yPercent: -values.y,
        ease: 'none',
        scrollTrigger: {
          // Tight range centred on the container's midpoint, so a card
          // sits flat/neutral while it's actually centred in the viewport
          // instead of still mid-transform.
          trigger: card,
          containerAnimation: scrollTween,
          start: 'left 65%',
          end: 'right 35%',
          scrub: true,
        },
      }
    );
  });
}
