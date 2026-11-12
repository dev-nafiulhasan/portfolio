import type { Metadata } from 'next';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';
import { getContent } from '@/lib/store';
import { accentVars } from '@/lib/color';

export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getContent();
  return {
    title: { default: s.seoTitle, template: `%s | ${s.firstName} ${s.lastName}` },
    description: s.seoDescription,
    openGraph: { title: s.seoTitle, description: s.seoDescription, type: 'website' },
  };
}

// Marks the page as script-enabled so animated elements can start hidden.
// If the animation code never starts, the mark is removed and everything shows.
const boot = `document.documentElement.classList.add('js');setTimeout(function(){if(!window.__motion)document.documentElement.classList.remove('js')},4000)`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getContent();
  const { accent, onAccent } = accentVars(settings.accent);
  return (
    <html lang="en" style={{ '--accent': accent, '--on-accent': onAccent } as React.CSSProperties}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
