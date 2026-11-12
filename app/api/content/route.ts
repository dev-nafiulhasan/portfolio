import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { readContentFresh, saveContent } from '@/lib/store';
import type { SiteContent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  try {
    return NextResponse.json(await readContentFresh());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as SiteContent | null;
  if (!body?.settings || !Array.isArray(body.projects)) {
    return NextResponse.json({ error: 'Invalid content.' }, { status: 400 });
  }
  try {
    await saveContent(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
