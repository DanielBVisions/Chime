import { gsap } from 'gsap';

const AUTOPLAY_INTERVAL_MS = 6000;

export function initTestimonialCarousel() {
  const viewport = document.querySelector<HTMLElement>('[data-testimonial-viewport]');
  const track = document.querySelector<HTMLElement>('[data-testimonial-track]');
  const prevBtn = document.querySelector<HTMLButtonElement>('[data-testimonial-prev]');
  const nextBtn = document.querySelector<HTMLButtonElement>('[data-testimonial-next]');
  const liveRegion = document.querySelector<HTMLElement>('[data-testimonial-live]');
  if (!viewport || !track || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.children) as HTMLElement[];
  const slideCount = slides.length;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;

  function goTo(nextIndex: number, { instant = false } = {}) {
    index = (nextIndex + slideCount) % slideCount;
    const x = -index * viewport!.offsetWidth;

    gsap.to(track, {
      x,
      duration: instant || prefersReducedMotion ? 0 : 0.6,
      ease: 'power3.out',
    });

    if (liveRegion) {
      liveRegion.textContent = slides[index].dataset.testimonialLabel ?? '';
    }
  }

  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') goTo(index - 1);
    if (event.key === 'ArrowRight') goTo(index + 1);
  });

  window.addEventListener('resize', () => goTo(index, { instant: true }));

  if (prefersReducedMotion) return; // manual arrow/keyboard nav still works; no autoplay

  let autoplay = window.setInterval(() => goTo(index + 1), AUTOPLAY_INTERVAL_MS);
  const stopAutoplay = () => window.clearInterval(autoplay);
  const restartAutoplay = () => {
    stopAutoplay();
    autoplay = window.setInterval(() => goTo(index + 1), AUTOPLAY_INTERVAL_MS);
  };

  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('mouseleave', restartAutoplay);
  viewport.addEventListener('focusin', stopAutoplay);
  viewport.addEventListener('focusout', restartAutoplay);
  viewport.addEventListener('touchstart', stopAutoplay, { passive: true });
}
