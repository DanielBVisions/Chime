import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initHero() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
  const lines = document.querySelectorAll<HTMLElement>('[data-hero-line]');
  if (!hero) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    lines.forEach((line) => {
      line.style.opacity = '1';
      line.style.transform = 'none';
    });
  } else {
    gsap.timeline({ defaults: { ease: 'power4.out' } }).from(lines, {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
    });
  }

  if (!video) return;

  // Poster image is the real LCP element; fade the video in over it once it
  // can actually play, so playback never blocks LCP (tech spec §7).
  video.addEventListener(
    'canplay',
    () => {
      gsap.to(video, { opacity: 1, duration: prefersReducedMotion ? 0 : 0.6 });
    },
    { once: true }
  );

  if (prefersReducedMotion) return;

  gsap.to(video, {
    yPercent: 15,
    ease: 'none',
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}
