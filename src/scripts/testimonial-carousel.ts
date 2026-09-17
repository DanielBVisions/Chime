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
// is asked to move, the index re-points to the equivalent real slide
// before that move's tween is built.
//
// Two earlier approaches to that re-point both showed a visible jump
// under some conditions: doing it inside the *previous* tween's
// onComplete visibly collided with that tween settling, and doing it as
// a separate instant gsap.set() immediately followed by a fresh gsap.to()
// relied on GSAP correctly inferring the tween's start from whatever it
// had cached from that just-applied set() - fine on a fast desktop
// pipeline, but transform is composited rather than laid out, and that
// implicit hand-off between two separate calls could lose a beat on a
// slower mobile compositor. The current approach (see step()/animateTo())
// passes both the start and end position to a single gsap.fromTo() call,
// so there's no intermediate value for anything to infer or cache.
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

  // If `active` is currently sitting on a clone, re-point it at the
  // equivalent real slide (no DOM/track change yet - see step() for why).
  function snapIndexToReal(): boolean {
    if (!hasBuffer) return false;
    if (active < offset || active >= offset + count) {
      active = offset + realIndexOf(active);
      return true;
    }
    return false;
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
        const snapped = snapIndexToReal();
        animateTo(offset + i, { fromX: snapped ? centreOn(slides[active]) : undefined });
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

  // fromX, when given, makes this a two-point gsap.fromTo() instead of a
  // gsap.to() that infers its starting value from whatever GSAP currently
  // has cached for the track. That inference is exactly what a wraparound
  // step relied on previously (an instant gsap.set() to the snapped
  // position, immediately followed by a separate gsap.to() reading
  // "current" position back from GSAP) - and exactly the kind of implicit
  // hand-off between two separate calls on the same property that can
  // land cleanly on a fast desktop pipeline but lose a beat on a slower
  // mobile compositor, since transform changes are composited, not laid
  // out - forcing a layout reflow (offsetWidth) between the two calls, as
  // a previous version of this fix did, has no bearing on when a
  // composited transform is actually committed. Passing both endpoints
  // explicitly in one call removes the hand-off entirely: there's nothing
  // for GSAP to infer, so there's nothing for a slower device to miss.
  function animateTo(target: number, { instant = false, fromX }: { instant?: boolean; fromX?: number } = {}) {
    active = target;
    setActiveClasses();
    updateDots();

    const toX = centreOn(slides[active]);
    const duration = instant || prefersReducedMotion ? 0 : 0.6;

    if (fromX !== undefined) {
      gsap.fromTo(track, { x: fromX }, { x: toX, duration, ease: 'power3.out' });
    } else {
      gsap.to(track, { x: toX, duration, ease: 'power3.out' });
    }

    if (liveRegion) {
      const label = realSlides[realIndexOf(active)]?.dataset.testimonialLabel;
      if (label) liveRegion.textContent = label;
    }
  }

  // Advances by one step, snapping back to a real slide first if we're
  // currently resting on a clone from the previous step - see animateTo()
  // for why that snap is folded into a single fromTo() rather than a
  // separate instant reposition.
  function step(delta: number, opts?: { instant?: boolean }) {
    const snapped = snapIndexToReal();
    const fromX = snapped ? centreOn(slides[active]) : undefined;
    animateTo(active + delta, { ...opts, fromX });
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
