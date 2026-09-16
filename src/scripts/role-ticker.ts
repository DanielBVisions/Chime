import { gsap } from 'gsap';

interface MarqueeOptions {
  /** Pixels per second — kept constant regardless of track length so different
   *  marquees (role ticker vs. partner logos) can be tuned to different speeds. */
  speed: number;
}

function buildMarquee(wrapper: HTMLElement, group: HTMLElement, track: HTMLElement, { speed }: MarqueeOptions) {
  const baseWidth = track.offsetWidth;

  // A single clone (2 copies total) only tiles seamlessly across the
  // full row width if the track itself is already at least half the
  // wrapper's width. A short track (e.g. a role-ticker row with just a
  // handful of pills) left a visible gap of bare background before the
  // loop caught back up. Keep cloning until the tiled content covers at
  // least double the wrapper's width, so there's always overflow on
  // both sides no matter how narrow the source track is.
  const minWidth = wrapper.offsetWidth * 2 + baseWidth;
  let totalWidth = baseWidth;
  do {
    const clone = track.cloneNode(true) as HTMLElement;
    clone.setAttribute('aria-hidden', 'true');
    group.appendChild(clone);
    totalWidth += baseWidth;
  } while (totalWidth < minWidth);

  const duration = baseWidth / speed;

  // Role ticker rows alternate direction (see RoleTicker.astro's
  // data-marquee-direction) so the three rows visually counter-scroll
  // instead of all drifting the same way.
  const reverse = wrapper.dataset.marqueeDirection === 'reverse';

  // Pixel-based x (not xPercent) so the loop distance is always exactly
  // one original track's width, regardless of how many clones ended up
  // appended above.
  const tl = gsap.timeline({ repeat: -1 });
  if (reverse) {
    tl.fromTo(group, { x: -baseWidth }, { x: 0, duration, ease: 'none' });
  } else {
    tl.fromTo(group, { x: 0 }, { x: -baseWidth, duration, ease: 'none' });
  }

  wrapper.addEventListener('mouseenter', () => tl.pause());
  wrapper.addEventListener('mouseleave', () => tl.play());
  wrapper.addEventListener('focusin', () => tl.pause());
  wrapper.addEventListener('focusout', () => tl.play());
}

// Wrapper selector may match more than one element (the role ticker
// renders one marquee per row) - every match gets its own independent
// marquee instance.
function initMarquee(wrapperSelector: string, groupSelector: string, trackSelector: string, options: MarqueeOptions) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return; // static wrapped list stays as rendered — no marquee

  const wrappers = document.querySelectorAll<HTMLElement>(wrapperSelector);

  wrappers.forEach((wrapper) => {
    const group = wrapper.querySelector<HTMLElement>(groupSelector);
    const track = wrapper.querySelector<HTMLElement>(trackSelector);
    if (!group || !track) return;

    wrapper.classList.add('is-marquee');
    buildMarquee(wrapper, group, track, options);
  });
}

export function initRoleTicker() {
  initMarquee('[data-role-ticker]', '[data-role-ticker-group]', '[data-role-ticker-track]', { speed: 40 });
}

export function initPartnerMarquee() {
  initMarquee('[data-partner-logos]', '[data-partner-group]', '[data-partner-track]', { speed: 25 });
}

export function initHeroTrustMarquee() {
  initMarquee('[data-hero-trust]', '[data-hero-trust-group]', '[data-hero-trust-track]', { speed: 20 });
}
