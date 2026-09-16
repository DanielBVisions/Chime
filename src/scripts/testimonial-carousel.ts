import { gsap } from 'gsap';

const AUTOPLAY_INTERVAL_MS = 6000;

// Centre-focused carousel: advances one slide at a time (not by a page of
// N-per-view) and keeps whichever slide is "active" horizontally centred
// in the viewport. Sizing/opacity for active vs. neighbouring vs. distant
// slides is pure CSS (is-active/is-adjacent classes, see the component's
// stylesheet) driven off distance from the active index - this file only
// tracks which index is active and where the track needs to sit to
// centre it.
export function initTestimonialCarousel() {
  const viewport = document.querySelector<HTMLElement>('[data-testimonial-viewport]');
  const track = document.querySelector<HTMLElement>('[data-testimonial-track]');
  const prevBtn = document.querySelector<HTMLButtonElement>('[data-testimonial-prev]');
  const nextBtn = document.querySelector<HTMLButtonElement>('[data-testimonial-next]');
  const dotsContainer = document.querySelector<HTMLElement>('[data-testimonial-dots]');
  const liveRegion = document.querySelector<HTMLElement>('[data-testimonial-live]');
  if (!viewport || !track || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.children) as HTMLElement[];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let active = 0;
  let dots: HTMLButtonElement[] = [];

  function setActiveClasses() {
    slides.forEach((slide, i) => {
      const raw = Math.abs(i - active);
      const distance = Math.min(raw, slides.length - raw); // wrap-around distance
      slide.classList.toggle('is-active', distance === 0);
      slide.classList.toggle('is-adjacent', distance === 1);
    });
  }

  function buildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    dots = [];
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'testimonials__dot';
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1} of ${slides.length}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
      dots.push(dot);
    });
    updateDots();
  }

  function updateDots() {
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === active));
  }

  function goTo(nextIndex: number, { instant = false } = {}) {
    active = (nextIndex + slides.length) % slides.length;
    setActiveClasses();
    updateDots();

    const activeSlide = slides[active];
    // Slide sizing is set by flex-basis (CSS), unaffected by the card's
    // own transform:scale, so offsetLeft/offsetWidth stay reliable for
    // centring math regardless of which slide is currently scaled up.
    const x = viewport!.offsetWidth / 2 - activeSlide.offsetLeft - activeSlide.offsetWidth / 2;

    gsap.to(track, {
      x,
      duration: instant || prefersReducedMotion ? 0 : 0.6,
      ease: 'power3.out',
    });

    if (liveRegion) {
      liveRegion.textContent = activeSlide?.dataset.testimonialLabel ?? '';
    }
  }

  buildDots();
  goTo(active, { instant: true });

  prevBtn.addEventListener('click', () => goTo(active - 1));
  nextBtn.addEventListener('click', () => goTo(active + 1));

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') goTo(active - 1);
    if (event.key === 'ArrowRight') goTo(active + 1);
  });

  window.addEventListener('resize', () => goTo(active, { instant: true }));

  if (prefersReducedMotion) return; // manual arrow/keyboard/dot nav still works; no autoplay

  let autoplay = window.setInterval(() => goTo(active + 1), AUTOPLAY_INTERVAL_MS);
  const stopAutoplay = () => window.clearInterval(autoplay);
  const restartAutoplay = () => {
    stopAutoplay();
    autoplay = window.setInterval(() => goTo(active + 1), AUTOPLAY_INTERVAL_MS);
  };

  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('mouseleave', restartAutoplay);
  viewport.addEventListener('focusin', stopAutoplay);
  viewport.addEventListener('focusout', restartAutoplay);
  viewport.addEventListener('touchstart', stopAutoplay, { passive: true });
}
