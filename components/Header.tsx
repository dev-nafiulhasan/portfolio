import Link from 'next/link';
import type { Settings } from '@/lib/types';

export default function Header({ settings, count }: { settings: Settings; count: number }) {
  return (
    <header className="nav">
      <Link href="/" className="nav__brand">
        <i aria-hidden="true" />
        {settings.firstName} {settings.lastName}
      </Link>
      <nav aria-label="Main">
        <Link href="/#work">
          Work <sup>{count}</sup>
        </Link>
        <Link href="/#skills">Skills</Link>
        <Link href="/#about">About</Link>
        <Link href="/#services">Services</Link>
      </nav>
      <Link href="/#contact" className="pill pill--ghost nav__cta" data-magnetic>
        Get in touch
      </Link>
    </header>
  );
}
