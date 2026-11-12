'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/** A ring that trails the mouse, grows over links and shows a label over project cards. */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const label = el.querySelector('span')!;
    const x = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
    const move = (e: PointerEvent) => {
      el.classList.add('is-on');
      x(e.clientX);
      y(e.clientY);
      const t = e.target as Element | null;
      const tagged = t?.closest<HTMLElement>('[data-cursor]');
      label.textContent = tagged?.dataset.cursor ?? '';
      el.classList.toggle('is-label', Boolean(tagged));
      el.classList.toggle('is-link', !tagged && Boolean(t?.closest('a, button')));
    };
    const out = () => el.classList.remove('is-on');
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', out);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', out);
    };
  }, []);
  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      <span />
    </div>
  );
}
