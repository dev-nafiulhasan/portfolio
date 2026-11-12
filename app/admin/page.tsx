'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project, SiteContent } from '@/lib/types';

/* ------------------------------------------------------------------ helpers */

const uid = () => Math.random().toString(36).slice(2, 10);

const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Shrinks big photos to WebP in the browser so uploads stay small and fast. */
async function compress(file: File): Promise<File> {
  if (file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.86));
    if (!blob || (scale === 1 && blob.size > file.size)) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}

async function upload(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', await compress(file));
  const res = await fetch('/api/upload', { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed.');
  return data.url;
}

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/* ------------------------------------------------------------------- fields */

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  rows?: number;
  hint?: string;
  type?: string;
}) {
  return (
    <label className="f">
      <span>{props.label}</span>
      {props.area ? (
        <textarea rows={props.rows ?? 4} value={props.value} onChange={(e) => props.onChange(e.target.value)} />
      ) : (
        <input type={props.type ?? 'text'} value={props.value} onChange={(e) => props.onChange(e.target.value)} />
      )}
      {props.hint && <small>{props.hint}</small>}
    </label>
  );
}

function ImageField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onError: (m: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      props.onChange(await upload(file));
    } catch (e) {
      props.onError((e as Error).message);
    }
    setBusy(false);
  };
  return (
    <div className="f">
      <span>{props.label}</span>
      <div className="img">
        <div className="img__thumb">{props.value ? <img src={props.value} alt="" /> : <em>No image</em>}</div>
        <div className="img__btns">
          <button type="button" className="b" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? 'Uploading…' : props.value ? 'Replace' : 'Upload'}
          </button>
          {props.value && (
            <button type="button" className="b b--quiet" onClick={() => props.onChange('')}>
              Remove
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

function Gallery(props: { value: string[]; onChange: (v: string[]) => void; onError: (m: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      try {
        urls.push(await upload(file));
      } catch (e) {
        props.onError(`${file.name}: ${(e as Error).message}`);
      }
    }
    props.onChange([...props.value, ...urls]);
    setBusy(false);
  };
  return (
    <div className="f">
      <span>Gallery (shown on the case study page)</span>
      <div className="gal">
        {props.value.map((src, i) => (
          <figure key={src}>
            <img src={src} alt="" />
            <figcaption>
              <button type="button" aria-label="Move earlier" onClick={() => props.onChange(move(props.value, i, -1))}>
                ←
              </button>
              <button type="button" aria-label="Move later" onClick={() => props.onChange(move(props.value, i, 1))}>
                →
              </button>
              <button type="button" aria-label="Remove image" onClick={() => props.onChange(props.value.filter((_, k) => k !== i))}>
                ✕
              </button>
            </figcaption>
          </figure>
        ))}
        <button type="button" className="gal__add" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? 'Uploading…' : '+ Add images'}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/** A reorderable list of cards. */
function List<T>(props: {
  items: T[];
  onChange: (items: T[]) => void;
  make: () => T;
  addLabel: string;
  title: (item: T, i: number) => string;
  children: (item: T, set: (patch: Partial<T>) => void, i: number) => React.ReactNode;
  startOpen?: boolean;
}) {
  const { items, onChange } = props;
  return (
    <div className="list">
      {items.map((item, i) => (
        <details key={(item as { id?: string }).id ?? i} className="card" open={props.startOpen}>
          <summary>
            <b>{props.title(item, i) || 'Untitled'}</b>
            <span className="card__tools">
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={(e) => (e.preventDefault(), onChange(move(items, i, -1)))}>
                ↑
              </button>
              <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={(e) => (e.preventDefault(), onChange(move(items, i, 1)))}>
                ↓
              </button>
              <button
                type="button"
                className="danger"
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm(`Delete “${props.title(item, i) || 'this item'}”?`)) onChange(items.filter((_, k) => k !== i));
                }}
              >
                Delete
              </button>
            </span>
          </summary>
          <div className="card__body">
            {props.children(item, (patch) => onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it))), i)}
          </div>
        </details>
      ))}
      <button type="button" className="b b--add" onClick={() => onChange([...items, props.make()])}>
        + {props.addLabel}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------- page */

const TABS = ['Projects', 'General', 'Reviews', 'About', 'Approach', 'Services', 'Contact'] as const;
type Tab = (typeof TABS)[number];

const newProject = (): Project => ({
  id: uid(),
  slug: '',
  title: '',
  summary: '',
  tags: [],
  cover: '',
  gallery: [],
  year: String(new Date().getFullYear()),
  client: '',
  role: '',
  liveUrl: '',
  body: '',
  published: true,
});

export default function Admin() {
  const [view, setView] = useState<'loading' | 'login' | 'ready'>('loading');
  const [c, setC] = useState<SiteContent | null>(null);
  const [snapshot, setSnapshot] = useState('');
  const [tab, setTab] = useState<Tab>('Projects');
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState('');

  const dirty = c !== null && JSON.stringify(c) !== snapshot;
  const err = useCallback((text: string) => setNote({ kind: 'err', text }), []);

  const load = useCallback(async () => {
    const res = await fetch('/api/content', { cache: 'no-store' });
    if (res.status === 401) return setView('login');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      err(data.error || 'Could not load content.');
      return setView('login');
    }
    setC(data);
    setSnapshot(JSON.stringify(data));
    setView('ready');
  }, [err]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => dirty && e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (note?.kind !== 'ok') return;
    const t = setTimeout(() => setNote(null), 4000);
    return () => clearTimeout(t);
  }, [note]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setNote(null);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) return err((await res.json().catch(() => ({}))).error || 'Could not sign in.');
    setPassword('');
    setView('loading');
    load();
  };

  const save = async () => {
    if (!c) return;
    // make sure every project has a unique address
    const used = new Set<string>();
    const projects = c.projects.map((p) => {
      const base = slugify(p.slug || p.title) || 'project';
      let slug = base;
      for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
      used.add(slug);
      return { ...p, slug };
    });
    const next = { ...c, projects };
    setSaving(true);
    setNote(null);
    const res = await fetch('/api/content', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(next),
    });
    setSaving(false);
    if (res.status === 401) {
      err('Your session expired. Sign in again; your changes are still here.');
      return setView('login');
    }
    if (!res.ok) return err((await res.json().catch(() => ({}))).error || 'Could not save.');
    setC(next);
    setSnapshot(JSON.stringify(next));
    setNote({ kind: 'ok', text: 'Saved. The live site is updated.' });
  };

  if (view === 'loading') return <p className="adm__center">Loading…</p>;

  if (view === 'login' || !c) {
    return (
      <form className="login" onSubmit={login}>
        <h1>Portfolio admin</h1>
        <label className="f">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="current-password" />
        </label>
        {note && <p className={`note note--${note.kind}`}>{note.text}</p>}
        <button className="b b--main">Sign in</button>
      </form>
    );
  }

  const set = (patch: Partial<SiteContent>) => setC({ ...c, ...patch });
  const setS = (patch: Partial<SiteContent['settings']>) => set({ settings: { ...c.settings, ...patch } });
  const s = c.settings;

  return (
    <>
      <header className="bar">
        <b>Portfolio admin</b>
        <nav>
          {TABS.map((t) => (
            <button key={t} type="button" className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </nav>
        <div className="bar__right">
          <a className="b b--quiet" href="/" target="_blank">
            View site
          </a>
          <button
            type="button"
            className="b b--quiet"
            onClick={async () => {
              if (dirty && !confirm('You have unsaved changes. Sign out anyway?')) return;
              await fetch('/api/logout', { method: 'POST' });
              setC(null);
              setView('login');
            }}
          >
            Sign out
          </button>
          <button type="button" className="b b--main" disabled={!dirty || saving} onClick={save}>
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </header>

      {note && (
        <p className={`note note--${note.kind} note--float`} role="status">
          {note.text}
          <button type="button" aria-label="Dismiss" onClick={() => setNote(null)}>
            ✕
          </button>
        </p>
      )}

      <main className="panel">
        {tab === 'Projects' && (
          <>
            <h1>Projects</h1>
            <p className="help">The order here is the order on the site. Hidden projects stay saved but aren’t shown.</p>
            <List
              items={c.projects}
              onChange={(projects) => set({ projects })}
              make={newProject}
              addLabel="Add project"
              title={(p) => (p.title || 'New project') + (p.published ? '' : ' (hidden)')}
            >
              {(p, up) => (
                <>
                  <div className="grid2">
                    <Field label="Title" value={p.title} onChange={(title) => up({ title })} />
                    <Field
                      label="Page address"
                      value={p.slug}
                      onChange={(slug) => up({ slug: slugify(slug) })}
                      hint={`/work/${p.slug || slugify(p.title) || '…'}  (leave empty to use the title)`}
                    />
                  </div>
                  <Field label="Short description" area rows={2} value={p.summary} onChange={(summary) => up({ summary })} />
                  <div className="grid2">
                    <Field
                      label="Tags"
                      value={p.tags.join(', ')}
                      onChange={(v) => up({ tags: v.split(',').map((t) => t.trimStart()) })}
                      hint="Separate with commas"
                    />
                    <Field label="Live site link" value={p.liveUrl} onChange={(liveUrl) => up({ liveUrl })} hint="Optional" />
                    <Field label="Client" value={p.client} onChange={(client) => up({ client })} />
                    <Field label="Your role" value={p.role} onChange={(role) => up({ role })} />
                    <Field label="Year" value={p.year} onChange={(year) => up({ year })} />
                    <label className="check">
                      <input type="checkbox" checked={p.published} onChange={(e) => up({ published: e.target.checked })} />
                      Show on the site
                    </label>
                  </div>
                  <ImageField label="Cover image" value={p.cover} onChange={(cover) => up({ cover })} onError={err} />
                  <Field
                    label="Case study text"
                    area
                    rows={8}
                    value={p.body}
                    onChange={(body) => up({ body })}
                    hint="Leave an empty line between paragraphs."
                  />
                  <Gallery value={p.gallery} onChange={(gallery) => up({ gallery })} onError={err} />
                </>
              )}
            </List>
          </>
        )}

        {tab === 'General' && (
          <>
            <h1>General</h1>
            <div className="grid2">
              <Field label="First name" value={s.firstName} onChange={(firstName) => setS({ firstName })} />
              <Field label="Last name" value={s.lastName} onChange={(lastName) => setS({ lastName })} />
            </div>
            <Field label="Headline" area rows={2} value={s.role} onChange={(role) => setS({ role })} />
            <Field label="Supporting line" area rows={2} value={s.note} onChange={(note) => setS({ note })} />
            <div className="grid2">
              <Field label="Main button text" value={s.ctaLabel} onChange={(ctaLabel) => setS({ ctaLabel })} />
              <Field label="Main button link" value={s.ctaUrl} onChange={(ctaUrl) => setS({ ctaUrl })} hint="Your Upwork or Fiverr profile, for example" />
              <Field label="Email" value={s.email} onChange={(email) => setS({ email })} />
              <Field label="Location" value={s.location} onChange={(location) => setS({ location })} />
            </div>
            <label className="f">
              <span>Accent colour</span>
              <span className="color">
                <input type="color" value={/^#[0-9a-f]{6}$/i.test(s.accent) ? s.accent : '#c9f24d'} onChange={(e) => setS({ accent: e.target.value })} />
                <input type="text" value={s.accent} onChange={(e) => setS({ accent: e.target.value })} />
              </span>
              <small>Used for buttons, highlights and the contact section. Text on top switches between dark and white automatically.</small>
            </label>
            <label className="check">
              <input type="checkbox" checked={s.showPreloader} onChange={(e) => setS({ showPreloader: e.target.checked })} />
              Show the loading counter on first visit
            </label>

            <h2>Footer links</h2>
            <List
              items={s.socials}
              onChange={(socials) => setS({ socials })}
              make={() => ({ label: '', url: 'https://' })}
              addLabel="Add link"
              title={(l) => l.label || 'New link'}
              startOpen
            >
              {(l, up) => (
                <div className="grid2">
                  <Field label="Label" value={l.label} onChange={(label) => up({ label })} />
                  <Field label="Link" value={l.url} onChange={(url) => up({ url })} />
                </div>
              )}
            </List>

            <h2>Search engines and sharing</h2>
            <Field label="Page title" value={s.seoTitle} onChange={(seoTitle) => setS({ seoTitle })} />
            <Field label="Description" area rows={2} value={s.seoDescription} onChange={(seoDescription) => setS({ seoDescription })} />
          </>
        )}

        {tab === 'Reviews' && (
          <>
            <h1>Reviews</h1>
            <p className="help">Remove every review to hide this section.</p>
            <Field label="Intro line" value={c.reviewsIntro} onChange={(reviewsIntro) => set({ reviewsIntro })} />
            <List
              items={c.reviews}
              onChange={(reviews) => set({ reviews })}
              make={() => ({ id: uid(), quote: '', author: '', company: '' })}
              addLabel="Add review"
              title={(r) => r.author || 'New review'}
              startOpen
            >
              {(r, up) => (
                <>
                  <Field label="Quote" area rows={3} value={r.quote} onChange={(quote) => up({ quote })} />
                  <div className="grid2">
                    <Field label="Name" value={r.author} onChange={(author) => up({ author })} />
                    <Field label="Company or project" value={r.company} onChange={(company) => up({ company })} />
                  </div>
                </>
              )}
            </List>
          </>
        )}

        {tab === 'About' && (
          <>
            <h1>About</h1>
            <ImageField label="Your photo" value={c.about.portrait} onChange={(portrait) => set({ about: { ...c.about, portrait } })} onError={err} />
            <Field
              label="Text"
              area
              rows={8}
              value={c.about.body}
              onChange={(body) => set({ about: { ...c.about, body } })}
              hint="The first paragraph is shown larger. Leave an empty line between paragraphs."
            />
            <h2>Quick facts</h2>
            <List
              items={c.about.facts}
              onChange={(facts) => set({ about: { ...c.about, facts } })}
              make={() => ({ label: '', value: '' })}
              addLabel="Add fact"
              title={(f) => f.label || 'New fact'}
              startOpen
            >
              {(f, up) => (
                <div className="grid2">
                  <Field label="Label" value={f.label} onChange={(label) => up({ label })} />
                  <Field label="Value" value={f.value} onChange={(value) => up({ value })} />
                </div>
              )}
            </List>
          </>
        )}

        {tab === 'Approach' && (
          <>
            <h1>Working together</h1>
            <p className="help">Remove every point to hide this section.</p>
            <Field label="Intro line" value={c.approachIntro} onChange={(approachIntro) => set({ approachIntro })} />
            <List
              items={c.approach}
              onChange={(approach) => set({ approach })}
              make={() => ({ title: '', text: '' })}
              addLabel="Add point"
              title={(a) => a.title || 'New point'}
              startOpen
            >
              {(a, up) => (
                <>
                  <Field label="Title" value={a.title} onChange={(title) => up({ title })} />
                  <Field label="Text" area rows={2} value={a.text} onChange={(text) => up({ text })} />
                </>
              )}
            </List>
          </>
        )}

        {tab === 'Services' && (
          <>
            <h1>Services</h1>
            <p className="help">Remove every service to hide this section.</p>
            <Field label="Intro line" value={c.servicesIntro} onChange={(servicesIntro) => set({ servicesIntro })} />
            <List
              items={c.services}
              onChange={(services) => set({ services })}
              make={() => ({ name: '', line: '', price: '', duration: '' })}
              addLabel="Add service"
              title={(v) => v.name || 'New service'}
              startOpen
            >
              {(v, up) => (
                <>
                  <Field label="Name" value={v.name} onChange={(name) => up({ name })} />
                  <Field label="One-line description" value={v.line} onChange={(line) => up({ line })} />
                  <div className="grid2">
                    <Field label="Price" value={v.price} onChange={(price) => up({ price })} hint="For example: From $200" />
                    <Field label="Delivery time" value={v.duration} onChange={(duration) => up({ duration })} hint="For example: 3 days" />
                  </div>
                </>
              )}
            </List>
          </>
        )}

        {tab === 'Contact' && (
          <>
            <h1>Contact section</h1>
            <Field label="Big heading" value={c.contact.heading} onChange={(heading) => set({ contact: { ...c.contact, heading } })} />
            <Field label="Text" area rows={2} value={c.contact.text} onChange={(text) => set({ contact: { ...c.contact, text } })} />
            <Field label="Small note" value={c.contact.reply} onChange={(reply) => set({ contact: { ...c.contact, reply } })} />
            <p className="help">The button and email address come from the General tab.</p>
          </>
        )}
      </main>
    </>
  );
}
