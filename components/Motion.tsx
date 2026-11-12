'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

declare global {
  interface Window {
    __motion?: boolean;
    __preloading?: boolean;
  }
}

/** Wraps each word (or letter) of an element in spans so it can be animated. Keeps the text readable for screen readers. */
function split(el: HTMLElement, mode: 'words' | 'chars', mask: boolean): HTMLElement[] {
  if (el.dataset.splitDone) return Array.from(el.querySelectorAll<HTMLElement>('.sp'));
  const text = (el.textContent || '').trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const out: HTMLElement[] = [];
  const parts = mode === 'words' ? text.split(/\s+/) : Array.from(text);
  parts.forEach((part, i) => {
    const inner = document.createElement('span');
    inner.className = 'sp';
    inner.textContent = part === ' ' ? ' ' : part;
    inner.setAttribute('aria-hidden', 'true');
    if (mask) {
      const wrap = document.createElement('span');
      wrap.className = 'sp-mask';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.appendChild(inner);
      el.appendChild(wrap);
    } else {
      el.appendChild(inner);
    }
    if (mode === 'words' && i < parts.length - 1) el.appendChild(document.createTextNode(' '));
    out.push(inner);
  });
  el.dataset.splitDone = '1';
  return out;
}

/** All scroll and pointer animation for the public pages lives here. */
export default function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    window.__motion = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.remove('js'); // show everything, no animation
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add('motion');

    /* smooth scrolling */
    const lenis = new Lenis({ anchors: true, lerp: 0.11 });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      const ease = 'expo.out';

      /* hero intro, played once the loading counter has left */
      const intro = gsap.timeline({ paused: true });
      const nameParts = gsap.utils.toArray<HTMLElement>('[data-chars]');
      if (nameParts.length) {
        const chars = nameParts.flatMap((el) => split(el, 'chars', false));
        intro
          .from(chars, { yPercent: 70, opacity: 0, rotateX: -80, transformOrigin: '50% 100%', duration: 1.3, ease, stagger: 0.035 }, 0)
          .from('.slot', { scale: 0, rotate: 25, duration: 1.2, ease: 'back.out(1.6)' }, 0.35)
          .from('.hero [data-in]', { y: 28, opacity: 0, duration: 1, ease, stagger: 0.08 }, 0.25)
          .from('.nav', { y: -24, opacity: 0, duration: 0.9, ease }, 0.2);
      }
      const start = () => intro.play();
      if (window.__preloading) window.addEventListener('preloader:done', start, { once: true });
      else start();

      /* headings: words rise out of a mask */
      gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
        const words = split(el, 'words', true);
        gsap.from(words, {
          yPercent: 115,
          duration: 1.15,
          ease,
          stagger: 0.07,
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });

      /* generic fade-and-rise */
      gsap.set('.rv', { y: 40 });
      ScrollTrigger.batch('.rv', {
        start: 'top 90%',
        once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease, stagger: 0.08, overwrite: true }),
      });

      /* review quotes light up word by word as you scroll */
      gsap.utils.toArray<HTMLElement>('[data-read]').forEach((el) => {
        const words = split(el, 'words', false);
        gsap.fromTo(
          words,
          { opacity: 0.14 },
          { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 55%', scrub: true } }
        );
      });

      /* skills strip: runs on its own, speeds up and flips with the scroll */
      gsap.utils.toArray<HTMLElement>('.marquee__track').forEach((track, i) => {
        const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
        if (i % 2) loop.progress(0.5);
        ScrollTrigger.create({
          onUpdate(self) {
            const dir = self.direction;
            const boost = Math.min(Math.abs(self.getVelocity()) / 250, 5);
            gsap.to(loop, { timeScale: dir * (1 + boost), duration: 0.25, overwrite: true });
            gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25 });
          },
        });
      });

      /* scroll progress line */
      gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

      /* nav hides on the way down, returns on the way up */
      ScrollTrigger.create({
        start: 200,
        end: 'max',
        onUpdate: (self) => document.querySelector('.nav')?.classList.toggle('is-hidden', self.direction === 1),
        onLeaveBack: () => document.querySelector('.nav')?.classList.remove('is-hidden'),
      });

      /* parallax images */
      gsap.utils.toArray<HTMLElement>('[data-parallax] img').forEach((img) => {
        gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, scrub: true } });
      });

      /* stacked cards shrink back as the next one slides over */
      const cards = gsap.utils.toArray<HTMLElement>('.stack__card');
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        gsap.to(card, {
          scale: 1 - (cards.length - 1 - i) * 0.035,
          filter: 'brightness(0.55)',
          ease: 'none',
          scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 20%', scrub: true },
        });
      });

      /* contact block opens up from a rounded card */
      gsap.utils.toArray<HTMLElement>('.accent-zone').forEach((zone) => {
        gsap.fromTo(
          zone,
          { clipPath: 'inset(10% 5% 0% 5% round 48px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: zone, start: 'top bottom', end: 'top 25%', scrub: true } }
        );
      });

      /* desktop: projects scroll sideways while the section stays pinned */
      mm.add('(min-width: 900px)', () => {
        const pin = document.querySelector<HTMLElement>('.hwork__pin');
        const track = document.querySelector<HTMLElement>('.hwork__track');
        if (!pin || !track) return;
        pin.classList.add('is-pinned');
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const slide = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: { trigger: pin, pin: true, scrub: 0.8, end: () => '+=' + distance(), invalidateOnRefresh: true },
        });
        gsap.utils.toArray<HTMLElement>('.hcard__media img').forEach((img) => {
          gsap.fromTo(
            img,
            { xPercent: -5 },
            { xPercent: 5, ease: 'none', scrollTrigger: { trigger: img.parentElement, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true } }
          );
        });
        gsap.to('.hwork__bar i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + distance(), scrub: true } });
        return () => pin.classList.remove('is-pinned');
      });

      /* magnetic buttons and tilting cards, mouse only */
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const offs: (() => void)[] = [];
        gsap.utils.toArray<HTMLElement>('[data-magnetic]').forEach((el) => {
          const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
          const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            x((e.clientX - r.left - r.width / 2) * 0.35);
            y((e.clientY - r.top - r.height / 2) * 0.45);
          };
          const leave = () => (x(0), y(0));
          el.addEventListener('pointermove', move);
          el.addEventListener('pointerleave', leave);
          offs.push(() => (el.removeEventListener('pointermove', move), el.removeEventListener('pointerleave', leave)));
        });
        gsap.utils.toArray<HTMLElement>('[data-tilt]').forEach((el) => {
          const rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3.out' });
          const ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3.out' });
          gsap.set(el, { transformPerspective: 900 });
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 7);
            rx(((e.clientY - r.top) / r.height - 0.5) * -7);
          };
          const leave = () => (rx(0), ry(0));
          el.addEventListener('pointermove', move);
          el.addEventListener('pointerleave', leave);
          offs.push(() => (el.removeEventListener('pointermove', move), el.removeEventListener('pointerleave', leave)));
        });
        return () => offs.forEach((off) => off());
      });
    });

    // images and fonts change heights; re-measure once they are in
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);

    return () => {
      window.removeEventListener('load', refresh);
      mm.revert();
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [pathname]);

  return <div className="progress" aria-hidden="true" />;
}
