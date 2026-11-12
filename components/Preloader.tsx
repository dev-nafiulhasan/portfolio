'use client';
import { useEffect, useState } from 'react';

/** Short counter shown once per visit. Hidden by CSS alone if JavaScript never runs. */
export default function Preloader({ name }: { name: string }) {
  const [n, setN] = useState(0);
  const [state, setState] = useState<'run' | 'out' | 'gone'>('run');

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('loaded') === '1';
      sessionStorage.setItem('loaded', '1');
    } catch {}
    if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('gone');
      return;
    }
    const start = performance.now();
    const total = 1100;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setState('out');
        setTimeout(() => setState('gone'), 700);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (state === 'gone') return null;
  return (
    <div className={`preloader ${state === 'out' ? 'is-out' : ''}`} aria-hidden="true">
      <div className="preloader__row">
        <span>{name}</span>
        <span className="preloader__n">{n}</span>
      </div>
      <div className="preloader__bar">
        <i style={{ transform: `scaleX(${n / 100})` }} />
      </div>
    </div>
  );
}
