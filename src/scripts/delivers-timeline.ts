import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Sui-style scroll-driven accordion: a marker travels down a dotted rail,
// opening one step at a time as the user scrolls through a tall "track".
// The timeline itself is CSS position: sticky (see the component's
// stylesheet) so it stays in view natively while the track's extra height
// scrolls past underneath it — this script only sizes that track and
// drives the marker position / active step off scroll progress, it never
// pins or repositions anything itself. Everything renders fully open in
// the base markup, so narrower or reduced-motion viewports (where this
// never engages) never lose any content.
export function initDeliversTimeline() {
  const track = document.querySelector<HTMLElement>('[data-delivers-track]');
  const timeline = document.querySelector<HTMLElement>('[data-delivers-timeline]');
  if (!track || !timeline) return;

  const marker = timeline.querySelector<HTMLElement>('[data-delivers-marker]');
  const steps = Array.from(timeline.querySelectorAll<HTMLElement>('[data-delivers-step]'));
  if (!marker || steps.length < 2) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canStep = window.matchMedia('(min-width: 900px)').matches;
  if (prefersReducedMotion || !canStep) return;

  timeline.classList.add('is-stepped');

  const headers = steps.map((step) => step.querySelector<HTMLButtonElement>('[data-delivers-step-header]'));
  const bodies = steps.map((step) => step.querySelector<HTMLElement>('[data-delivers-step-body]'));

  // Every active step expands to the same shared height (not each body's
  // own scrollHeight) so the timeline's own box height never changes as
  // different steps open — otherwise the sticky element's box would keep
  // resizing under the user's cursor mid-scroll.
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

  // A full viewport height of scroll "runway" per step, so a normal scroll
  // gesture doesn't race through every step before it's had time to open.
  track.style.height = `${window.innerHeight * steps.length}px`;

  ScrollTrigger.create({
    trigger: track,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      marker.style.top = `${self.progress * 100}%`;
      setActive(Math.min(steps.length - 1, Math.floor(self.progress * steps.length)));
    },
  });
}
