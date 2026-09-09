import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Splits a heading's text into words, each masked so it can slide up from
// below on scroll — the same device used by Effortel's SplitType-driven
// reveal, reimplemented at build-independent runtime (no SplitType
// dependency needed since our headings are static text).
export function initHeadingReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const headings = document.querySelectorAll<HTMLElement>('[data-reveal-heading]');

  headings.forEach((heading) => {
    const words = (heading.textContent ?? '').trim().split(/\s+/);
    heading.innerHTML = words
      .map((word) => `<span class="word-mask"><span class="word-inner">${word}</span></span>`)
      .join(' ');

    if (prefersReducedMotion) return;

    const inners = heading.querySelectorAll<HTMLElement>('.word-inner');
    gsap.fromTo(
      inners,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power4.out',
        stagger: 0.045,
        scrollTrigger: {
          trigger: heading,
          start: 'top 85%',
          once: true,
        },
      }
    );
  });
}
