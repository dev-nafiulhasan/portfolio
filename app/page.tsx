import Link from 'next/link';
import { getContent } from '@/lib/store';
import Header from '@/components/Header';
import HeroSlot from '@/components/HeroSlot';
import Preloader from '@/components/Preloader';
import Effects from '@/components/Effects';
import Contact from '@/components/Contact';
import { Arrow } from '@/components/Arrow';

const pad = (n: number) => String(n).padStart(2, '0');
const paras = (t: string) => t.split(/\n\s*\n/).filter(Boolean);

export default async function Home() {
  const content = await getContent();
  const { settings: s, about } = content;
  const projects = content.projects.filter((p) => p.published);
  const name = `${s.firstName} ${s.lastName}`.trim();

  return (
    <>
      {s.showPreloader && <Preloader name={name} />}
      <Effects />
      <div id="top" />
      <Header settings={s} count={projects.length} />

      <main>
        <section className="hero">
          <div className="hero__intro">
            <p className="hero__role">{s.role}</p>
            <div className="hero__side">
              <p className="muted">{s.note}</p>
              <div className="hero__actions">
                {s.ctaUrl && (
                  <a className="pill pill--accent" href={s.ctaUrl} target="_blank" rel="noopener">
                    {s.ctaLabel} <Arrow />
                  </a>
                )}
                <Link className="pill pill--ghost" href="#work">
                  See my work
                </Link>
              </div>
            </div>
          </div>
          <h1 className="hero__name" aria-label={name}>
            <span aria-hidden="true">{s.firstName}</span>
            <HeroSlot images={projects.map((p) => p.cover).filter(Boolean).slice(0, 6)} />
            <span aria-hidden="true">{s.lastName}</span>
          </h1>
        </section>

        <section className="band band--paper" id="work">
          <header className="head">
            <h2 className="display rise">
              Selected work <sup>{pad(projects.length)}</sup>
            </h2>
          </header>
          <ol className="work">
            {projects.map((p, i) => (
              <li key={p.id} className="work__item rise">
                <Link href={`/work/${p.slug}`} className="work__link">
                  <div className="work__media">
                    {p.cover && <img src={p.cover} alt="" loading={i ? 'lazy' : 'eager'} />}
                    <span className="tag-cursor">
                      View case <Arrow />
                    </span>
                  </div>
                  <div className="work__cap">
                    <span className="num">{pad(i + 1)}</span>
                    <div>
                      <h3>{p.title}</h3>
                      <p>{p.summary}</p>
                    </div>
                    <p className="tags">{p.tags.join(' / ')}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {content.reviews.length > 0 && (
          <section className="band" id="reviews">
            <header className="head">
              <h2 className="display rise">Kind words</h2>
              <p className="lede rise">{content.reviewsIntro}</p>
            </header>
            <ol className="reviews">
              {content.reviews.map((r, i) => (
                <li key={r.id} className="rise">
                  <span className="num">{pad(i + 1)}</span>
                  <figure>
                    <blockquote>“{r.quote}”</blockquote>
                    <figcaption>
                      <b>{r.author}</b>
                      {r.company && <span>{r.company}</span>}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="band band--paper" id="about">
          <header className="head">
            <h2 className="display rise">About</h2>
          </header>
          <div className="about">
            {about.portrait && (
              <div className="about__img rise">
                <img src={about.portrait} alt={`Portrait of ${name}`} loading="lazy" />
              </div>
            )}
            <div className="about__text rise">
              {paras(about.body).map((t, i) => (
                <p key={i} className={i === 0 ? 'lede' : ''}>
                  {t}
                </p>
              ))}
              <dl className="facts">
                {about.facts.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {content.approach.length > 0 && (
          <section className="band" id="approach">
            <header className="head">
              <h2 className="display rise">Working together</h2>
              <p className="lede rise">{content.approachIntro}</p>
            </header>
            <ol className="rows">
              {content.approach.map((a, i) => (
                <li key={a.title} className="rise">
                  <span className="num">{pad(i + 1)}</span>
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {content.services.length > 0 && (
          <section className="band band--paper" id="services">
            <header className="head">
              <h2 className="display rise">Services</h2>
              <p className="lede rise">{content.servicesIntro}</p>
            </header>
            <ol className="rows rows--link">
              {content.services.map((v, i) => (
                <li key={v.name} className="rise">
                  <a href="#contact">
                    <span className="num">{pad(i + 1)}</span>
                    <h3>{v.name}</h3>
                    <p>
                      {v.line}
                      <span className="meta">{[v.price, v.duration].filter(Boolean).join(' · ')}</span>
                    </p>
                    <Arrow />
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>

      <Contact content={content} />
    </>
  );
}
