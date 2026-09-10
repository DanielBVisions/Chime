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

  const setActive = (index: number) => {
    steps.forEach((step, i) => {
      const isActive = i === index;
      step.classList.toggle('is-active', isActive);
      headers[i]?.setAttribute('aria-expanded', String(isActive));
      const body = bodies[i];
      if (body) body.style.maxHeight = isActive ? `${body.scrollHeight}px` : '';
    });
  };

  setActive(0);

  headers.forEach((header, i) => {
    header?.addEventListener('click', () => setActive(i));
  });

  const distance = window.innerHeight * (steps.length - 1) * 0.8;

  ScrollTrigger.create({
    trigger: timeline,
    start: 'top top',
    end: '+=' + distance,
    pin: true,
    scrub: true,
    onUpdate: (self) => {
      marker.style.top = `${self.progress * 100}%`;
      setActive(Math.min(steps.length - 1, Math.floor(self.progress * steps.length)));
    },
  });
}
