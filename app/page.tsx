import Link from 'next/link';
import { getContent } from '@/lib/store';
import Header from '@/components/Header';
import HeroSlot from '@/components/HeroSlot';
import HeroCanvas from '@/components/HeroCanvas';
import Preloader from '@/components/Preloader';
import Motion from '@/components/Motion';
import Cursor from '@/components/Cursor';
import Contact from '@/components/Contact';
import { Arrow } from '@/components/Arrow';

const pad = (n: number) => String(n).padStart(2, '0');
const paras = (t: string) => t.split(/\n\s*\n/).filter(Boolean);

export default async function Home() {
  const content = await getContent();
  const { settings: s, about } = content;
  const projects = content.projects.filter((p) => p.published);
  const skills = content.skills.filter((k) => k.name);
  const name = `${s.firstName} ${s.lastName}`.trim();
  // repeat the list so the strip is always wider than the screen
  const strip = skills.length ? Array.from({ length: Math.ceil(10 / skills.length) }, () => skills).flat() : [];

  return (
    <>
      {s.showPreloader && <Preloader name={name} />}
      <Motion />
      <Cursor />
      <div id="top" />
      <Header settings={s} count={projects.length} />

      <main>
        <section className="hero">
          <HeroCanvas />
          <div className="hero__glow" aria-hidden="true" />
          <div className="hero__intro">
            <div>
              {s.status && (
                <p className="chip" data-in>
                  <i aria-hidden="true" />
                  {s.status}
                </p>
              )}
              <p className="hero__role" data-in>
                {s.role}
              </p>
            </div>
            <div className="hero__side">
              <p className="muted" data-in>
                {s.note}
              </p>
              <div className="hero__actions" data-in>
                {s.ctaUrl && (
                  <a className="pill pill--accent" href={s.ctaUrl} target="_blank" rel="noopener" data-magnetic>
                    {s.ctaLabel} <Arrow />
                  </a>
                )}
                <Link className="pill pill--ghost" href="#work" data-magnetic>
                  See my work
                </Link>
              </div>
            </div>
          </div>
          <h1 className="hero__name" aria-label={name}>
            <span aria-hidden="true" data-chars>
              {s.firstName}
            </span>
            <HeroSlot images={projects.map((p) => p.cover).filter(Boolean).slice(0, 6)} />
            <span aria-hidden="true" data-chars>
              {s.lastName}
            </span>
          </h1>
        </section>

        {strip.length > 0 && (
          <div className="marquee" aria-hidden="true">
            <div className="marquee__track">
              {[0, 1].map((half) => (
                <ul key={half}>
                  {strip.map((k, i) => (
                    <li key={i}>
                      {k.name}
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="currentColor" />
                      </svg>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        )}

        <section className="hwork" id="work">
          <div className="hwork__pin">
            <header className="head head--row">
              <h2 className="display" data-split>
                Selected work
              </h2>
              <p className="mono">
                {pad(projects.length)} projects
                <span className="hwork__bar" aria-hidden="true">
                  <i />
                </span>
              </p>
            </header>
            <ol className="hwork__track">
              {projects.map((p, i) => (
                <li key={p.id} className="hcard">
                  <Link href={`/work/${p.slug}`} data-cursor="View">
                    <div className="hcard__media" data-tilt>
                      {p.cover && <img src={p.cover} alt="" loading={i ? 'lazy' : 'eager'} />}
                    </div>
                    <div className="hcard__cap">
                      <span className="mono">{pad(i + 1)}</span>
                      <div>
                        <h3>{p.title}</h3>
                        <p>{p.summary}</p>
                      </div>
                      <p className="mono hcard__tags">{p.tags.join(' / ')}</p>
                    </div>
                  </Link>
                </li>
              ))}
              <li className="hcard hcard--end">
                <a href="#contact" data-cursor="Let’s go">
                  <span className="mono">Next</span>
                  <b>
                    Your project <Arrow />
                  </b>
                </a>
              </li>
            </ol>
          </div>
        </section>

        {skills.length > 0 && (
          <section className="band" id="skills">
            <header className="head">
              <h2 className="display" data-split>
                Skills
              </h2>
              <p className="lede rv">{content.skillsIntro}</p>
            </header>
            <ol className="skills">
              {skills.map((k, i) => (
                <li key={k.name} className="rv">
                  <span className="mono">{pad(i + 1)}</span>
                  <h3>{k.name}</h3>
                  <p>{k.note}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {content.reviews.length > 0 && (
          <section className="band" id="reviews">
            <header className="head">
              <h2 className="display" data-split>
                Kind words
              </h2>
              <p className="lede rv">{content.reviewsIntro}</p>
            </header>
            <ol className="reviews">
              {content.reviews.map((r, i) => (
                <li key={r.id}>
                  <span className="mono">{pad(i + 1)}</span>
                  <figure>
                    <blockquote data-read>“{r.quote}”</blockquote>
                    <figcaption className="rv">
                      <b>{r.author}</b>
                      {r.company && <span>{r.company}</span>}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="band" id="about">
          <header className="head">
            <h2 className="display" data-split>
              About
            </h2>
          </header>
          <div className="about">
            {about.portrait && (
              <div className="about__img rv" data-parallax>
                <img src={about.portrait} alt={`Portrait of ${name}`} loading="lazy" />
              </div>
            )}
            <div className="about__text">
              {paras(about.body).map((t, i) => (
                <p key={i} className={i === 0 ? 'lede rv' : 'rv'}>
                  {t}
                </p>
              ))}
              <dl className="facts rv">
                {about.facts.map((f) => (
                  <div key={f.label}>
                    <dt className="mono">{f.label}</dt>
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
              <h2 className="display" data-split>
                Working together
              </h2>
              <p className="lede rv">{content.approachIntro}</p>
            </header>
            <ol className="stack">
              {content.approach.map((a, i) => (
                <li key={a.title} className="stack__card" style={{ '--i': i } as React.CSSProperties}>
                  <span className="mono">
                    {pad(i + 1)} / {pad(content.approach.length)}
                  </span>
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {content.services.length > 0 && (
          <section className="band" id="services">
            <header className="head">
              <h2 className="display" data-split>
                Services
              </h2>
              <p className="lede rv">{content.servicesIntro}</p>
            </header>
            <ol className="rows">
              {content.services.map((v, i) => (
                <li key={v.name} className="rv">
                  <a href="#contact">
                    <span className="mono">{pad(i + 1)}</span>
                    <h3>{v.name}</h3>
                    <p>
                      {v.line}
                      <span className="meta mono">{[v.price, v.duration].filter(Boolean).join(' · ')}</span>
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
