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
    // fromTo, not from: the CSS default is opacity:0 (to avoid a flash of
    // unstyled content before this runs), so a bare .from() would capture
    // that same 0 as its implied end value and the text would silently
    // stay invisible — it only ever looked like it was sliding into place.
    gsap.timeline({ defaults: { ease: 'power4.out' } }).fromTo(
      lines,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.15 }
    );
  }

  initCursorGlow(hero, prefersReducedMotion);

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
    yPercent: 8,
    ease: 'none',
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

// Soft ambient light that follows the cursor — mouse/trackpad only (a
// touchscreen has no persistent pointer position to follow) and skipped
// entirely under reduced motion.
function initCursorGlow(hero: HTMLElement, prefersReducedMotion: boolean) {
  const glow = hero.querySelector<HTMLElement>('[data-hero-glow]');
  const canHover = window.matchMedia('(pointer: fine)').matches;
  if (!glow || prefersReducedMotion || !canHover) return;

  hero.addEventListener('pointerenter', () => glow.classList.add('is-active'));
  hero.addEventListener('pointerleave', () => glow.classList.remove('is-active'));

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    glow.style.setProperty('--x', `${x}%`);
    glow.style.setProperty('--y', `${y}%`);
  });
}
