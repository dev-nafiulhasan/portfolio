import Link from 'next/link';
import type { SiteContent } from '@/lib/types';
import { Arrow } from './Arrow';

export default function Contact({ content }: { content: SiteContent }) {
  const { settings: s, contact: c } = content;
  const ext = (url: string) => /^https?:/.test(url);
  return (
    <div className="accent-zone">
      <section className="cta" id="contact">
        <h2 className="display rise">{c.heading}</h2>
        <div className="cta__body rise">
          <p className="lede">{c.text}</p>
          <div className="cta__actions">
            {s.ctaUrl && (
              <a className="pill pill--ink" href={s.ctaUrl} target="_blank" rel="noopener">
                {s.ctaLabel} <Arrow />
              </a>
            )}
            {s.email && (
              <a className="text-link" href={`mailto:${s.email}`}>
                {s.email}
              </a>
            )}
          </div>
          <p className="small">{c.reply}</p>
        </div>
      </section>
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} {s.firstName} {s.lastName}
          {s.location ? ` · ${s.location}` : ''}
        </p>
        <ul>
          {s.socials.map((l) => (
            <li key={l.label + l.url}>
              <a href={l.url} {...(ext(l.url) ? { target: '_blank', rel: 'noopener' } : {})}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <Link href="#top">Back to top ↑</Link>
      </footer>
    </div>
  );
}
