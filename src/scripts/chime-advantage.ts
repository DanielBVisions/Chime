import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Adapted from the madewithgsap.com "effect001" horizontal scroll-pin pattern,
// with rotation/drift ranges cut way down (was ±10-20deg rotation, ±30-50%
// xPercent, ±10-16% yPercent) and generous card gaps so cards never overlap
// each other's text mid-scroll. Desktop only — a scroll-jacked horizontal
// pin doesn't translate well to touch, so it's gated on both viewport width
// and prefers-reduced-motion; everything else gets the static grid fallback
// already rendered in the markup.
export function initChimeAdvantage() {
  const section = document.querySelector<HTMLElement>('[data-advantage]');
  const track = document.querySelector<HTMLElement>('[data-advantage-track]');
  if (!section || !track) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canScrollPin = window.matchMedia('(min-width: 900px)').matches;
  if (prefersReducedMotion || !canScrollPin) return;

  section.classList.add('is-scroll-pin');

  const cards = Array.from(track.children) as HTMLElement[];
  const distance = track.scrollWidth - window.innerWidth;
  if (distance <= 0) return;

  const scrollTween = gsap.to(track, {
    x: -distance,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      pin: true,
      scrub: true,
      start: 'top top',
      end: '+=' + distance,
    },
  });

  cards.forEach((card) => {
    const values = {
      x: (Math.random() * 4 + 8) * (Math.random() < 0.5 ? 1 : -1), // ±8 to 12
      y: (Math.random() * 2 + 3) * (Math.random() < 0.5 ? 1 : -1), // ±3 to 5
      rotation: (Math.random() * 3 + 4) * (Math.random() < 0.5 ? 1 : -1), // ±4 to 7
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
          trigger: card,
          containerAnimation: scrollTween,
          start: 'left 115%',
          end: 'right 5%',
          scrub: true,
        },
      }
    );
  });
}
