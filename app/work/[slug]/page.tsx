import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getContent } from '@/lib/store';
import Header from '@/components/Header';
import Effects from '@/components/Effects';
import Contact from '@/components/Contact';
import { Arrow } from '@/components/Arrow';

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const content = await getContent();
  const projects = content.projects.filter((p) => p.published);
  const index = projects.findIndex((p) => p.slug === slug);
  return { content, projects, index };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projects, index } = await load((await params).slug);
  const p = projects[index];
  if (!p) return {};
  return {
    title: p.title,
    description: p.summary,
    openGraph: { title: p.title, description: p.summary, images: p.cover ? [p.cover] : [] },
  };
}

export default async function WorkPage({ params }: Props) {
  const { content, projects, index } = await load((await params).slug);
  if (index < 0) notFound();
  const p = projects[index];
  const next = projects[(index + 1) % projects.length];
  const meta = [
    ['Client', p.client],
    ['Year', p.year],
    ['Role', p.role],
  ].filter(([, v]) => v);

  return (
    <>
      <Effects />
      <div id="top" />
      <Header settings={content.settings} count={projects.length} />
      <main>
        <section className="case-head">
          <Link href="/#work" className="text-link">
            ← All work
          </Link>
          <h1 className="display">{p.title}</h1>
          <p className="lede">{p.summary}</p>
          <dl className="facts facts--dark">
            {meta.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            <div>
              <dt>Scope</dt>
              <dd>{p.tags.join(', ')}</dd>
            </div>
          </dl>
          {p.liveUrl && (
            <a className="pill pill--accent" href={p.liveUrl} target="_blank" rel="noopener">
              Visit live site <Arrow />
            </a>
          )}
        </section>

        <section className="band band--paper case-body">
          {p.cover && (
            <div className="case-img rise">
              <img src={p.cover} alt={`${p.title} cover`} />
            </div>
          )}
          {p.body && (
            <div className="prose rise">
              {p.body
                .split(/\n\s*\n/)
                .filter(Boolean)
                .map((t, i) => (
                  <p key={i}>{t}</p>
                ))}
            </div>
          )}
          {p.gallery.map((src, i) => (
            <div className="case-img rise" key={src + i}>
              <img src={src} alt={`${p.title} screenshot ${i + 1}`} loading="lazy" />
            </div>
          ))}
          {next && next.id !== p.id && (
            <Link href={`/work/${next.slug}`} className="next rise">
              <span className="small">Next project</span>
              <span className="display">
                {next.title} <Arrow />
              </span>
            </Link>
          )}
        </section>
      </main>
      <Contact content={content} />
    </>
  );
}
