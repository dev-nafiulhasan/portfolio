'use client';
import { useEffect, useRef } from 'react';

/** Field of dots behind the hero. A slow wave runs through it and the dots push away from the mouse. */
export default function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c9f24d';
    const GAP = 30;
    const R = 190;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const t = time / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      ctx.clearRect(0, 0, w, h);
      for (let gy = GAP / 2; gy < h; gy += GAP) {
        for (let gx = GAP / 2; gx < w; gx += GAP) {
          const wave = Math.sin(gx * 0.008 + gy * 0.012 - t * 0.9) * 0.5 + 0.5;
          const dx = gx - mouse.x;
          const dy = gy - mouse.y;
          const d = Math.hypot(dx, dy);
          const pull = d < R ? 1 - d / R : 0;
          const push = pull * pull * 26;
          const x = gx + (d ? (dx / d) * push : 0);
          const y = gy + (d ? (dy / d) * push : 0);
          if (pull > 0.02) {
            ctx.globalAlpha = 0.25 + pull * 0.75;
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.arc(x, y, 1.2 + pull * 2.4, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.globalAlpha = 0.1 + wave * 0.32;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8);
          }
        }
      }
      ctx.globalAlpha = 1;
      if (!reduce && visible) raf = requestAnimationFrame(draw);
    };

    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - r.left;
      mouse.ty = e.clientY - r.top;
    };
    const resize = () => {
      size();
      if (reduce) draw(0);
    };
    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was && !reduce) raf = requestAnimationFrame(draw);
    });

    size();
    raf = requestAnimationFrame(draw);
    io.observe(canvas);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', move);
    };
  }, []);

  return <canvas ref={ref} className="hero__canvas" aria-hidden="true" />;
}
