'use client';
import { useEffect, useState } from 'react';

/** The small frame inside the name that flips through project covers. */
export default function HeroSlot({ images }: { images: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (images.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setI((v) => (v + 1) % images.length), 2200);
    return () => clearInterval(id);
  }, [images.length]);
  if (!images.length) return null;
  return (
    <span className="slot" aria-hidden="true">
      {images.map((src, k) => (
        <img
          key={src + k}
          src={src}
          alt=""
          className={k === i ? 'is-on' : k === (i - 1 + images.length) % images.length ? 'is-prev' : ''}
        />
      ))}
    </span>
  );
}
