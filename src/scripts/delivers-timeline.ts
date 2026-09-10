import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Sui-style scroll-driven accordion: pins the step list while a marker
// travels down a dotted rail, opening one step at a time in sequence as
// the user scrolls. Every step renders fully open in the base markup, so
// narrower or reduced-motion viewports (where this never engages) never
// lose any content.
export function initDeliversTimeline() {
  const timeline = document.querySelector<HTMLElement>('[data-delivers-timeline]');
  if (!timeline) return;

  const marker = timeline.querySelector<HTMLElement>('[data-delivers-marker]');
  const steps = Array.from(timeline.querySelectorAll<HTMLElement>('[data-delivers-step]'));
  if (!marker || steps.length < 2) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canStep = window.matchMedia('(min-width: 900px)').matches;
  if (prefersReducedMotion || !canStep) return;

  timeline.classList.add('is-stepped');

  const headers = steps.map((step) => step.querySelector<HTMLButtonElement>('[data-delivers-step-header]'));
  const bodies = steps.map((step) => step.querySelector<HTMLElement>('[data-delivers-step-body]'));

  // A pinned element's box height has to stay pixel-identical for the whole
  // pin — GSAP sizes its spacer once and expects that. Setting each active
  // body to its own scrollHeight let the timeline's total height vary as
  // different (differently-sized) steps opened, desyncing the spacer from
  // the real layout — shown as leftover blank space and jumpiness in this
  // section and whatever follows it. Forcing every active body to the same
  // fixed height (not max-height, which only caps — a shorter body would
  // still shrink to its own natural size) keeps the box height constant no
  // matter which step is open.
  const maxBodyHeight = Math.max(...bodies.map((body) => body?.scrollHeight ?? 0));

  const setActive = (index: number) => {
    steps.forEach((step, i) => {
      const isActive = i === index;
      step.classList.toggle('is-active', isActive);
      headers[i]?.setAttribute('aria-expanded', String(isActive));
      const body = bodies[i];
      if (body) body.style.height = isActive ? `${maxBodyHeight}px` : '0px';
    });
  };

  setActive(0);

  headers.forEach((header, i) => {
    header?.addEventListener('click', () => setActive(i));
  });

  // A full viewport height per step, not a fraction of one — the earlier,
  // shorter distance meant a normal scroll gesture raced through all 3
  // steps in barely half a screen each, so step 2/3 never fully opened
  // before the pin released and the page jumped on to the next section.
  const distance = window.innerHeight * steps.length;

  ScrollTrigger.create({
    trigger: timeline,
    // Clears the sticky nav bar (72px) rather than pinning flush under it.
    start: 'top 72px',
    end: '+=' + distance,
    pin: true,
    // Reparents to <body> while pinned so nothing about this element's own
    // ancestors (container padding, section backgrounds, etc.) can throw
    // off the fixed-position math GSAP uses — the documented fix for a
    // pinned element rendering off in the viewport's top-left corner
    // instead of staying where it visually was.
    pinReparent: true,
    scrub: true,
    onUpdate: (self) => {
      marker.style.top = `${self.progress * 100}%`;
      setActive(Math.min(steps.length - 1, Math.floor(self.progress * steps.length)));
    },
  });
}
