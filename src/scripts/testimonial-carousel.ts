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
// appended - "active" is allowed to land on a clone (that transition
// looks like a completely normal step, since the clone is identical to
// the real slide it stands in for), and the very next time the carousel
// is asked to move, it first snaps - instantly, no animation - from
// that clone back to the equivalent real slide, before starting the new
// animated step. Doing the snap at the *start* of the next interaction,
// with nothing else animating, keeps it fully decoupled from any
// in-flight tween's own final frame - an earlier version did this snap
// inside the previous tween's onComplete instead, which visibly
// collided with that tween settling and read as a glitch/jump.
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

    // prepend/append (not a loop of insertBefore(clone, track.firstChild))
    // - that loop was inserting each clone before whatever the *current*
    // first child was, which changes after every insertion, so the two
    // leading clones ended up in reversed order relative to the real
    // slides they stand in for. prepend/append take multiple nodes and
    // insert them all in the given order in one call.
    track.prepend(...leadingClones);
    track.append(...trailingClones);
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

  function centreOn(slide: HTMLElement) {
    // Slide sizing is set by flex-basis (CSS), unaffected by the card's
    // own transform:scale, so offsetLeft/offsetWidth stay reliable for
    // centring math regardless of which slide is currently scaled up.
    return viewport!.offsetWidth / 2 - slide.offsetLeft - slide.offsetWidth / 2;
  }

  // If `active` is currently sitting on a clone, jump back to the
  // equivalent real slide instantly (no animation) before anything else
  // happens - see the note above the export for why this lives here
  // rather than in the previous tween's onComplete.
  function snapToReal() {
    if (!hasBuffer) return;
    if (active < offset || active >= offset + count) {
      active = offset + realIndexOf(active);
      setActiveClasses();
      gsap.set(track, { x: centreOn(slides[active]) });
      // Forces the browser to fully commit this instant reposition -
      // both the style write and a synchronous layout checkpoint -
      // before the very next line starts a new tween on the same
      // property. Without this, the following animateTo()'s tween has
      // no guarantee it picks up "from" the position just set here
      // rather than from a stale cached value, which would show up as
      // exactly the kind of visible jump this snap exists to prevent.
      void track.offsetWidth;
    }
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
      dot.addEventListener('click', () => {
        snapToReal();
        animateTo(offset + i);
      });
      dotsContainer.appendChild(dot);
      dots.push(dot);
    }
    updateDots();
  }

  function updateDots() {
    const realIndex = realIndexOf(active);
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === realIndex));
  }

  function animateTo(target: number, { instant = false } = {}) {
    active = target;
    setActiveClasses();
    updateDots();

    gsap.to(track, {
      x: centreOn(slides[active]),
      duration: instant || prefersReducedMotion ? 0 : 0.6,
      ease: 'power3.out',
    });

    if (liveRegion) {
      const label = realSlides[realIndexOf(active)]?.dataset.testimonialLabel;
      if (label) liveRegion.textContent = label;
    }
  }

  // Advances by one step, snapping back to a real slide first if we're
  // currently resting on a clone from the previous step.
  function step(delta: number, opts?: { instant?: boolean }) {
    snapToReal();
    animateTo(active + delta, opts);
  }

  buildDots();
  animateTo(active, { instant: true });

  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  });

  // Width only, not a bare 'resize' listener - mobile browsers fire
  // resize when the address bar/toolbar shows or hides during ordinary
  // scrolling (a height-only change, viewport width unaffected), and
  // this handler forces an instant, unanimated repositioning. Reacting
  // to every one of those looked exactly like the carousel randomly
  // snapping/jumping while the page was simply being scrolled past.
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    step(0, { instant: true });
  });

  if (prefersReducedMotion) return; // manual arrow/keyboard/dot nav still works; no autoplay

  let autoplay = window.setInterval(() => step(1), AUTOPLAY_INTERVAL_MS);
  const stopAutoplay = () => window.clearInterval(autoplay);
  const restartAutoplay = () => {
    stopAutoplay();
    autoplay = window.setInterval(() => step(1), AUTOPLAY_INTERVAL_MS);
  };

  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('mouseleave', restartAutoplay);
  viewport.addEventListener('focusin', stopAutoplay);
  viewport.addEventListener('focusout', restartAutoplay);
  viewport.addEventListener('touchstart', stopAutoplay, { passive: true });
}
