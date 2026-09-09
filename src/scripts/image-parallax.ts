import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Drifts an image within its (overflow-hidden) frame as the page scrolls.
// The image sits on a CSS custom property (--parallax-y) rather than the
// transform property directly, so this composes safely with any hover
// effect the same element already carries via CSS (e.g. a hover-zoom
// scale) instead of one clobbering the other's inline transform.
export function initImageParallax() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const images = document.querySelectorAll<HTMLElement>('[data-parallax-image]');

  images.forEach((image) => {
    const wrap = image.closest<HTMLElement>('[data-parallax-wrap]') ?? image;

    gsap.fromTo(
      image,
      { '--parallax-y': '-24px' },
      {
        '--parallax-y': '24px',
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}
