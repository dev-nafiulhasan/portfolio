import { promises as fs } from 'fs';
import path from 'path';
import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { defaultContent } from './default-content';
import type { SiteContent } from './types';

const KEY = 'content/site.json';
const LOCAL_FILE = path.join(process.cwd(), 'data', 'content.json');
const LOCAL_UPLOADS = path.join(process.cwd(), 'public', 'uploads');

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const onVercel = () => Boolean(process.env.VERCEL);

export class StorageError extends Error {}

function needStorage() {
  if (!useBlob() && onVercel()) {
    throw new StorageError(
      'No storage connected. In Vercel open your project, go to Storage, create a Blob store, connect it to this project and redeploy.'
    );
  }
}

/** Fill in anything missing so older saved content keeps working after updates. */
function normalize(raw: Partial<SiteContent> | null): SiteContent {
  if (!raw) return defaultContent;
  const d = defaultContent;
  return {
    ...d,
    ...raw,
    settings: { ...d.settings, ...raw.settings },
    about: { ...d.about, ...raw.about },
    contact: { ...d.contact, ...raw.contact },
  };
}

async function readRaw(): Promise<Partial<SiteContent> | null> {
  if (useBlob()) {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: KEY, limit: 1 });
    if (!blobs.length) return null;
    const res = await fetch(`${blobs[0].url}?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new StorageError(`Could not read saved content (${res.status}).`);
    return res.json();
  }
  try {
    return JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8'));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

/** Always-fresh read for the admin panel. Throws instead of silently falling back. */
export async function readContentFresh(): Promise<SiteContent> {
  return normalize(await readRaw());
}

const cached = unstable_cache(async () => normalize(await readRaw()), ['site-content'], {
  tags: ['content'],
  revalidate: 300,
});

/** Cached read for public pages. Falls back to starter content if storage is unreachable. */
export async function getContent(): Promise<SiteContent> {
  try {
    return await cached();
  } catch (e) {
    console.error('getContent failed, using starter content:', e);
    return defaultContent;
  }
}

export async function saveContent(content: SiteContent) {
  needStorage();
  const json = JSON.stringify(content, null, 2);
  if (useBlob()) {
    const { put } = await import('@vercel/blob');
    await put(KEY, json, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    });
  } else {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
    await fs.writeFile(LOCAL_FILE, json);
  }
  revalidateTag('content', { expire: 0 });
  revalidatePath('/', 'layout');
}

export async function saveImage(file: File): Promise<string> {
  needStorage();
  const ext = (file.name.split('.').pop() || 'webp').toLowerCase().replace(/[^a-z0-9]/g, '');
  const base =
    file.name
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'image';
  if (useBlob()) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`uploads/${base}.${ext}`, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    });
    return blob.url;
  }
  const name = `${base}-${Date.now().toString(36)}.${ext}`;
  await fs.mkdir(LOCAL_UPLOADS, { recursive: true });
  await fs.writeFile(path.join(LOCAL_UPLOADS, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
