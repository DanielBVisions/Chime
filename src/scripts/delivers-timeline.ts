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

  const setActive = (index: number) => {
    steps.forEach((step, i) => {
      const isActive = i === index;
      step.classList.toggle('is-active', isActive);
      headers[i]?.setAttribute('aria-expanded', String(isActive));
      const body = bodies[i];
      if (body) body.style.height = isActive ? `${body.scrollHeight}px` : '0px';
    });

    // Expanding/collapsing a card shifts every later card's position, and
    // each has its own ScrollTrigger keyed to that position. Refreshing
    // only after the (0.4s, see the stylesheet) height transition settles
    // means it measures the real final layout, not a mid-transition one.
    window.setTimeout(() => ScrollTrigger.refresh(), 400);
  };

  setActive(0);

  headers.forEach((header, i) => {
    header?.addEventListener('click', () => setActive(i));
  });

  steps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActive(i),
      onEnterBack: () => setActive(i),
    });
  });
}
