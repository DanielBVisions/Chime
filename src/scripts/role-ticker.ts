import { gsap } from 'gsap';

interface MarqueeOptions {
  /** Pixels per second — kept constant regardless of track length so different
   *  marquees (role ticker vs. partner logos) can be tuned to different speeds. */
  speed: number;
}

function buildMarquee(wrapper: HTMLElement, group: HTMLElement, track: HTMLElement, { speed }: MarqueeOptions) {
  const clone = track.cloneNode(true) as HTMLElement;
  clone.setAttribute('aria-hidden', 'true');
  group.appendChild(clone);

  const distance = track.offsetWidth;
  const duration = distance / speed;

  const tl = gsap.timeline({ repeat: -1 });
  tl.fromTo(group, { xPercent: 0 }, { xPercent: -50, duration, ease: 'none' });

  wrapper.addEventListener('mouseenter', () => tl.pause());
  wrapper.addEventListener('mouseleave', () => tl.play());
  wrapper.addEventListener('focusin', () => tl.pause());
  wrapper.addEventListener('focusout', () => tl.play());
}

function initMarquee(wrapperSelector: string, groupSelector: string, trackSelector: string, options: MarqueeOptions) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return; // static wrapped list stays as rendered — no marquee

  const wrapper = document.querySelector<HTMLElement>(wrapperSelector);
  const group = wrapper?.querySelector<HTMLElement>(groupSelector);
  const track = wrapper?.querySelector<HTMLElement>(trackSelector);
  if (!wrapper || !group || !track) return;

  wrapper.classList.add('is-marquee');
  buildMarquee(wrapper, group, track, options);
}

export function initRoleTicker() {
  initMarquee('[data-role-ticker]', '[data-role-ticker-group]', '[data-role-ticker-track]', { speed: 40 });
}

export function initPartnerMarquee() {
  initMarquee('[data-partner-logos]', '[data-partner-group]', '[data-partner-track]', { speed: 25 });
}
