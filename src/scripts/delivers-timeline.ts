import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Cards scroll normally; only the rail's marker is position: sticky,
// held at the vertical centre of the viewport (see the component's
// stylesheet). Whichever step's card is currently crossing that centre
// point becomes active — one ScrollTrigger per step, toggled as its own
// span passes the middle of the screen, rather than a single shared
// scroll-progress value driving everything. Everything renders open in
// the base markup, so narrower or reduced-motion viewports (where this
// never engages) never lose any content.
export function initDeliversTimeline() {
  const timeline = document.querySelector<HTMLElement>('[data-delivers-timeline]');
  if (!timeline) return;

  const steps = Array.from(timeline.querySelectorAll<HTMLElement>('[data-delivers-step]'));
  if (steps.length < 2) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canStep = window.matchMedia('(min-width: 900px)').matches;
  if (prefersReducedMotion || !canStep) return;

  timeline.classList.add('is-stepped');

  const headers = steps.map((step) => step.querySelector<HTMLButtonElement>('[data-delivers-step-header]'));
  const bodies = steps.map((step) => step.querySelector<HTMLElement>('[data-delivers-step-body]'));

  // Duration/easing lives here, driven directly by GSAP, rather than as a
  // CSS `transition` on height that JS merely sets a value for — that
  // route wasn't visibly changing no matter what duration was tried, so
  // this animates it explicitly instead of hoping a CSS transition picks
  // the style change up.
  const OPEN_DURATION = 0.6;

  const setActive = (index: number) => {
    steps.forEach((step, i) => {
      const isActive = i === index;
      step.classList.toggle('is-active', isActive);
      headers[i]?.setAttribute('aria-expanded', String(isActive));
      const body = bodies[i];
      if (!body) return;

      gsap.to(body, {
        height: isActive ? body.scrollHeight : 0,
        opacity: isActive ? 1 : 0,
        duration: OPEN_DURATION,
        ease: 'power2.inOut',
        onComplete: () => ScrollTrigger.refresh(),
      });
    });
  };

  setActive(0);

  headers.forEach((header, i) => {
    header?.addEventListener('click', () => setActive(i));
  });

  steps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step,
      // Fires while the card is still well below the marker's fixed
      // centre point (70% down the viewport, not 50%) so it's already
      // open by the time it actually reaches centre, rather than
      // triggering right at the crossing and visibly playing catch-up.
      start: 'top 70%',
      end: 'bottom 30%',
      onEnter: () => setActive(i),
      onEnterBack: () => setActive(i),
    });
  });

  // Solid trail behind the marker, filling in from the top of the rail
  // down to wherever the marker's fixed centre point currently lines up
  // — the same 0-1 span the marker itself already sits within.
  const trail = timeline.querySelector<HTMLElement>('[data-delivers-trail]');
  if (trail) {
    ScrollTrigger.create({
      trigger: timeline,
      start: 'top center',
      end: 'bottom center',
      scrub: true,
      onUpdate: (self) => {
        trail.style.height = `${self.progress * 100}%`;
      },
    });
  }
}
