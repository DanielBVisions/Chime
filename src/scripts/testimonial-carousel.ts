import { gsap } from 'gsap';

const AUTOPLAY_INTERVAL_MS = 6000;
const BUFFER = 2; // cloned slides on each end - see note below

// Centre-focused carousel: advances one slide at a time (not by a page of
// N-per-view) and keeps whichever slide is "active" horizontally centred
// in the viewport. Sizing/opacity for active vs. neighbouring vs. distant
// slides is pure CSS (is-active/is-adjacent classes, see the component's
// stylesheet) driven off distance from the active index.
//
// The real slides alone aren't enough for a seamless loop: going from the
// last real slide to the first (or back) would jump the whole track across
// its full width in one visible leap, and at either end the active slide
// would run out of a real neighbour on one side. So BUFFER real slides are
// cloned from the tail and prepended, and BUFFER from the head and
// appended - "active" moves freely up and down this extended list, and
// once a transition lands on a clone, the track snaps (no animation,
// imperceptible since the clone is identical) to the equivalent real
// slide in the same visual position.
export function initTestimonialCarousel() {
  const viewport = document.querySelector<HTMLElement>('[data-testimonial-viewport]');
  const track = document.querySelector<HTMLElement>('[data-testimonial-track]');
  const prevBtn = document.querySelector<HTMLButtonElement>('[data-testimonial-prev]');
  const nextBtn = document.querySelector<HTMLButtonElement>('[data-testimonial-next]');
  const dotsContainer = document.querySelector<HTMLElement>('[data-testimonial-dots]');
  const liveRegion = document.querySelector<HTMLElement>('[data-testimonial-live]');
  if (!viewport || !track || !prevBtn || !nextBtn) return;

  const realSlides = Array.from(track.children) as HTMLElement[];
  const count = realSlides.length;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (count > BUFFER * 2) {
    const leadingClones = realSlides.slice(-BUFFER).map((slide) => {
      const clone = slide.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('data-testimonial-label');
      return clone;
    });
    const trailingClones = realSlides.slice(0, BUFFER).map((slide) => {
      const clone = slide.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('data-testimonial-label');
      return clone;
    });

    leadingClones.forEach((clone) => track.insertBefore(clone, track.firstChild));
    trailingClones.forEach((clone) => track.appendChild(clone));
  }

  const slides = Array.from(track.children) as HTMLElement[];
  const hasBuffer = slides.length > realSlides.length;
  const offset = hasBuffer ? BUFFER : 0;

  let active = offset; // extended index of real slide 0
  let dots: HTMLButtonElement[] = [];

  function realIndexOf(extendedIndex: number) {
    return ((extendedIndex - offset) % count + count) % count;
  }

  function setActiveClasses() {
    slides.forEach((slide, i) => {
      const distance = Math.abs(i - active);
      slide.classList.toggle('is-active', distance === 0);
      slide.classList.toggle('is-adjacent', distance === 1);
    });
  }

  function buildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    dots = [];
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'testimonials__dot';
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1} of ${count}`);
      dot.addEventListener('click', () => goTo(offset + i));
      dotsContainer.appendChild(dot);
      dots.push(dot);
    }
    updateDots();
  }

  function updateDots() {
    const realIndex = realIndexOf(active);
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === realIndex));
  }

  // If a previous transition was interrupted before its end-of-loop snap
  // could fire, `active` might still be sitting past the buffered clones -
  // pull it back into the safe extended range before computing a new step.
  function normalizeActive() {
    if (active < 0 || active >= slides.length) {
      active = offset + realIndexOf(active);
    }
  }

  function goTo(target: number, { instant = false } = {}) {
    active = target;
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
      onComplete: () => {
        if (!hasBuffer) return;
        if (active < offset || active >= offset + count) {
          active = offset + realIndexOf(active);
          const realSlide = slides[active];
          const snapX = viewport!.offsetWidth / 2 - realSlide.offsetLeft - realSlide.offsetWidth / 2;
          gsap.set(track, { x: snapX });
          setActiveClasses();
        }
      },
    });

    if (liveRegion) {
      const label = realSlides[realIndexOf(active)]?.dataset.testimonialLabel;
      if (label) liveRegion.textContent = label;
    }
  }

  buildDots();
  goTo(active, { instant: true });

  prevBtn.addEventListener('click', () => {
    normalizeActive();
    goTo(active - 1);
  });

  nextBtn.addEventListener('click', () => {
    normalizeActive();
    goTo(active + 1);
  });

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      normalizeActive();
      goTo(active - 1);
    }
    if (event.key === 'ArrowRight') {
      normalizeActive();
      goTo(active + 1);
    }
  });

  window.addEventListener('resize', () => {
    normalizeActive();
    goTo(active, { instant: true });
  });

  if (prefersReducedMotion) return; // manual arrow/keyboard/dot nav still works; no autoplay

  let autoplay = window.setInterval(() => {
    normalizeActive();
    goTo(active + 1);
  }, AUTOPLAY_INTERVAL_MS);
  const stopAutoplay = () => window.clearInterval(autoplay);
  const restartAutoplay = () => {
    stopAutoplay();
    autoplay = window.setInterval(() => {
      normalizeActive();
      goTo(active + 1);
    }, AUTOPLAY_INTERVAL_MS);
  };

  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('mouseleave', restartAutoplay);
  viewport.addEventListener('focusin', stopAutoplay);
  viewport.addEventListener('focusout', restartAutoplay);
  viewport.addEventListener('touchstart', stopAutoplay, { passive: true });
}
