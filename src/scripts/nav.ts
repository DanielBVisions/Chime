import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initNav() {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const whiteLogo = nav.querySelector<HTMLElement>('[data-nav-logo-white]');
  const blackLogo = nav.querySelector<HTMLElement>('[data-nav-logo-black]');

  function setSolid(isSolid: boolean) {
    nav!.classList.toggle('is-solid', isSolid);
    if (whiteLogo && blackLogo) {
      const duration = prefersReducedMotion ? 0 : 0.3;
      gsap.to(whiteLogo, { opacity: isSolid ? 0 : 1, duration });
      gsap.to(blackLogo, { opacity: isSolid ? 1 : 0, duration });
    }
  }

  ScrollTrigger.create({
    start: 80,
    onEnter: () => setSolid(true),
    onLeaveBack: () => setSolid(false),
  });

  const toggle = nav.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const mobileMenu = nav.querySelector<HTMLElement>('[data-nav-mobile-menu]');
  if (!toggle || !mobileMenu) return;

  const mobileLinks = Array.from(mobileMenu.querySelectorAll<HTMLElement>('a'));

  gsap.set(mobileMenu, { yPercent: -100 });

  const openTl = gsap
    .timeline({ paused: true })
    .to(mobileMenu, { yPercent: 0, duration: prefersReducedMotion ? 0 : 0.4, ease: 'power3.out' })
    .from(
      mobileLinks,
      { opacity: 0, y: 16, duration: prefersReducedMotion ? 0 : 0.4, stagger: 0.08 },
      prefersReducedMotion ? 0 : '-=0.2'
    );

  let isOpen = false;

  function setOpen(next: boolean) {
    isOpen = next;
    toggle!.setAttribute('aria-expanded', String(isOpen));
    toggle!.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen) {
      openTl.play();
    } else {
      openTl.reverse();
    }
  }

  toggle.addEventListener('click', () => setOpen(!isOpen));
  mobileLinks.forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) setOpen(false);
  });
}
