import { gsap } from 'gsap';

const AUTOPLAY_INTERVAL_MS = 6000;

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

  let perView = 1;
  let pageCount = 1;
  let page = 0;
  let dots: HTMLButtonElement[] = [];

  // Mirrors the CSS breakpoints on .testimonials__slide exactly (640px -> 2,
  // 1024px -> 3) — matchMedia directly, rather than reading a custom
  // property back out of computed style, so there's no indirection that can
  // silently drift out of sync with what's actually laid out.
  function getPerView() {
    if (window.matchMedia('(min-width: 1024px)').matches) return 3;
    if (window.matchMedia('(min-width: 640px)').matches) return 2;
    return 1;
  }

  function updateDots() {
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === page));
  }

  function buildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    dots = [];
    for (let i = 0; i < pageCount; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'testimonials__dot';
      dot.setAttribute('aria-label', `Go to testimonials page ${i + 1} of ${pageCount}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
      dots.push(dot);
    }
    updateDots();
  }

  function goTo(nextPage: number, { instant = false } = {}) {
    page = (nextPage + pageCount) % pageCount;
    const x = -page * viewport!.offsetWidth;

    gsap.to(track, {
      x,
      duration: instant || prefersReducedMotion ? 0 : 0.6,
      ease: 'power3.out',
    });

    updateDots();

    if (liveRegion) {
      const first = slides[page * perView];
      liveRegion.textContent = first?.dataset.testimonialLabel ?? '';
    }
  }

  function recalculate({ instant = true } = {}) {
    perView = getPerView();
    pageCount = Math.max(1, Math.ceil(slides.length / perView));
    page = Math.min(page, pageCount - 1);
    buildDots();
    goTo(page, { instant });
  }

  recalculate();

  prevBtn.addEventListener('click', () => goTo(page - 1));
  nextBtn.addEventListener('click', () => goTo(page + 1));

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') goTo(page - 1);
    if (event.key === 'ArrowRight') goTo(page + 1);
  });

  window.addEventListener('resize', () => recalculate({ instant: true }));

  if (prefersReducedMotion) return; // manual arrow/keyboard/dot nav still works; no autoplay

  let autoplay = window.setInterval(() => goTo(page + 1), AUTOPLAY_INTERVAL_MS);
  const stopAutoplay = () => window.clearInterval(autoplay);
  const restartAutoplay = () => {
    stopAutoplay();
    autoplay = window.setInterval(() => goTo(page + 1), AUTOPLAY_INTERVAL_MS);
  };

  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('mouseleave', restartAutoplay);
  viewport.addEventListener('focusin', stopAutoplay);
  viewport.addEventListener('focusout', restartAutoplay);
  viewport.addEventListener('touchstart', stopAutoplay, { passive: true });
}
