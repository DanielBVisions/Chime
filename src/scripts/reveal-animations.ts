import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initRevealAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');

  targets.forEach((el) => {
    if (prefersReducedMotion) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }
    gsap.fromTo(
      el,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        // Once the reveal settles, drop the inline transform entirely
        // rather than leaving GSAP's translate3d(0,0,0) sitting on the
        // element. A lingering transform — even a no-op one — makes the
        // element a new containing block for any position:fixed
        // descendant, which breaks pin:true for anything nested inside
        // (e.g. the delivers timeline's pinned scroll accordion).
        clearProps: 'transform',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      }
    );
  });
}
