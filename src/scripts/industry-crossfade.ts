import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// The left-hand image (sticky, see IndustryExpertise.astro) swaps to its
// second frame once the section's second text block scrolls up to the
// same crossing point, and swaps back on the way back up.
export function initIndustryCrossfade() {
  const media = document.querySelector<HTMLElement>('[data-industry-media]');
  const secondBlock = document.querySelector<HTMLElement>('[data-industry-frame-2]');
  if (!media || !secondBlock) return;

  ScrollTrigger.create({
    trigger: secondBlock,
    start: 'top 60%',
    onEnter: () => media.classList.add('is-frame-2'),
    onLeaveBack: () => media.classList.remove('is-frame-2'),
  });
}
