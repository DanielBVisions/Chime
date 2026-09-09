import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Draws the hub-and-spoke connector lines in What CHIME Delivers: a
// horizontal bus line extends, then each vertical stem drops down into
// its column, staggered — a real "assemble" moment instead of a fade.
export function initDiagramReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const groups = document.querySelectorAll<HTMLElement>('[data-reveal-stems]');

  groups.forEach((group) => {
    const bus = group.querySelector<HTMLElement>('.delivers__stem-bus');
    const stems = group.querySelectorAll<HTMLElement>('.delivers__stem');

    if (prefersReducedMotion) {
      if (bus) bus.style.transform = 'none';
      stems.forEach((stem) => (stem.style.transform = 'none'));
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: group, start: 'top 75%', once: true },
    });

    if (bus) tl.to(bus, { scaleX: 1, duration: 0.5, ease: 'power2.out' });
    tl.to(
      stems,
      { scaleY: 1, duration: 0.5, ease: 'power2.out', stagger: 0.15 },
      bus ? '-=0.15' : 0
    );
  });
}
