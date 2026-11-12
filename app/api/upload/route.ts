import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { saveImage } from '@/lib/store';

const ALLOWED = ['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif'];
const MAX = 4 * 1024 * 1024; // Vercel's request body limit is 4.5 MB

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const file = (await req.formData()).get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file.' }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Use a JPG, PNG, WebP, AVIF or GIF image.' }, { status: 400 });
  }
  if (file.size > MAX) return NextResponse.json({ error: 'Image is larger than 4 MB.' }, { status: 400 });
  try {
    return NextResponse.json({ url: await saveImage(file) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
