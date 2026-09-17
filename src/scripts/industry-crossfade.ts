import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// The left-hand image (sticky, see IndustryExpertise.astro) crossfades to
// the frame matching whichever text block has scrolled up to the same
// crossing point, and back to the previous one on the way back up. Each
// non-first block carries data-industry-frame="N" naming its own frame;
// the first block has no attribute since it's just the default frame.
export function initIndustryCrossfade() {
  const media = document.querySelector<HTMLElement>('[data-industry-media]');
  const frameBlocks = Array.from(document.querySelectorAll<HTMLElement>('[data-industry-frame]'));
  if (!media || !frameBlocks.length) return;

  const frameClasses = frameBlocks.map((block) => `is-frame-${block.dataset.industryFrame}`);

  frameBlocks.forEach((block, index) => {
    const frameClass = frameClasses[index];
    const previousFrameClass = index > 0 ? frameClasses[index - 1] : null;

    ScrollTrigger.create({
      trigger: block,
      start: 'top 60%',
      onEnter: () => {
        frameClasses.forEach((cls) => media.classList.remove(cls));
        media.classList.add(frameClass);
      },
      onLeaveBack: () => {
        media.classList.remove(frameClass);
        if (previousFrameClass) media.classList.add(previousFrameClass);
      },
    });
  });
}
